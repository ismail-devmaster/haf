#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Development-only reverse proxy for the Home Assistant frontend dev server.
 *
 * The Home Assistant development server serves the SPA with `--single`, which
 * makes every unknown path (including integration API paths) return
 * index.html. This proxy listens on the public frontend port and forwards only
 * the Domolux Roles frontend assets to the configured Home Assistant backend.
 * Everything else is streamed to the existing static file server.
 *
 * It is intentionally not a general purpose proxy: the upstream is fixed at
 * startup and is never derived from an incoming Host header.
 */
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import os from "node:os";
import process from "node:process";
import { URL, urlToHttpOptions } from "node:url";

const DOMOLUX_ASSET_PATH = "/api/domolux_roles/frontend";
const UPSTREAM_TIMEOUT_MS = 60_000;
const STATIC_READY_TIMEOUT_MS = 15_000;

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const proxySockets = new Set();
let staticServer;
let proxyServer;
let proxyDomoluxAssets = true;
let shuttingDown = false;

function log(message) {
  console.log(`[domolux-dev-proxy] ${message}`);
}

function logError(message, error) {
  console.error(
    `[domolux-dev-proxy] ${message}${error ? `: ${error.message}` : ""}`
  );
}

function usage() {
  return [
    "Usage: node script/domolux-dev-proxy.mjs \\",
    "  --listen-port <port> --static-port <port> --upstream <url> \\",
    "  [--serve-bin <path>] [--serve-config <path>] [--serve-root <path>]",
  ].join("\n");
}

function parsePort(value, flag) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${flag} must be an integer between 1 and 65535`);
  }
  return port;
}

function parseArgs(argv) {
  const options = {
    listenPort: undefined,
    staticPort: undefined,
    upstream: undefined,
    serveBin: "./node_modules/.bin/serve",
    // `serve` resolves --config relative to the served root directory.
    serveConfig: "../script/serve-config.json",
    serveRoot: "./hass_frontend",
  };

  let i = 0;

  const readValue = (flag) => {
    const value = argv[++i];
    if (value === undefined) {
      throw new Error(`${flag} requires a value`);
    }
    return value;
  };

  while (i < argv.length) {
    const flag = argv[i];
    switch (flag) {
      case "--listen-port":
        options.listenPort = parsePort(readValue(flag), flag);
        break;
      case "--static-port":
        options.staticPort = parsePort(readValue(flag), flag);
        break;
      case "--upstream":
        options.upstream = readValue(flag);
        break;
      case "--serve-bin":
        options.serveBin = readValue(flag);
        break;
      case "--serve-config":
        options.serveConfig = readValue(flag);
        break;
      case "--serve-root":
        options.serveRoot = readValue(flag);
        break;
      case "--help":
      case "-h":
        console.log(usage());
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${flag}`);
    }
    i += 1;
  }

  if (options.listenPort === undefined) {
    throw new Error("--listen-port is required");
  }
  if (options.staticPort === undefined) {
    throw new Error("--static-port is required");
  }
  if (!options.upstream) {
    throw new Error("--upstream is required");
  }
  if (options.listenPort === options.staticPort) {
    throw new Error("--listen-port and --static-port must be different");
  }

  return options;
}

function parseUpstream(value) {
  let upstream;
  try {
    upstream = new URL(value);
  } catch {
    throw new Error(`Invalid upstream URL: ${value}`);
  }
  if (upstream.protocol !== "http:" && upstream.protocol !== "https:") {
    throw new Error("The upstream URL must use http:// or https://");
  }
  if (!upstream.hostname) {
    throw new Error(`Invalid upstream URL: ${value}`);
  }
  return upstream;
}

/**
 * Hostnames that mean "this machine". Used only to prevent the proxy from
 * routing back into itself (for example the devcontainer setup where the
 * frontend and the default core URL share port 8123).
 */
function collectLocalHostnames() {
  const hostnames = new Set(["localhost", "127.0.0.1", "::1"]);
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      hostnames.add(address.address.toLowerCase());
    }
  }
  return hostnames;
}

const localHostnames = collectLocalHostnames();

function isSelfTarget(upstream, ports) {
  const hostname = upstream.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!localHostnames.has(hostname)) {
    return false;
  }
  const port = Number(
    upstream.port || (upstream.protocol === "https:" ? 443 : 80)
  );
  return ports.includes(port);
}

function describeUpstream(upstream) {
  const basePath = upstream.pathname.replace(/\/+$/, "");
  return `${upstream.protocol}//${upstream.host}${basePath}`;
}

function parseRequestTarget(requestUrl) {
  try {
    const parsed = new URL(requestUrl, "http://frontend.invalid");
    return { pathname: parsed.pathname, search: parsed.search };
  } catch {
    return null;
  }
}

function isDomoluxAssetPath(pathname) {
  return (
    pathname === DOMOLUX_ASSET_PATH ||
    pathname.startsWith(`${DOMOLUX_ASSET_PATH}/`)
  );
}

function connectionTokens(headers) {
  const connection = headers.connection;
  if (!connection) {
    return new Set();
  }
  const value = Array.isArray(connection) ? connection.join(",") : connection;
  return new Set(
    value
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
  );
}

function buildForwardHeaders(headers, hostOverride) {
  const dropped = connectionTokens(headers);
  const forwarded = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }
    const lowerName = name.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerName) || dropped.has(lowerName)) {
      continue;
    }
    forwarded[name] = value;
  }

  if (hostOverride) {
    forwarded.host = hostOverride;
  }

  return forwarded;
}

function sendError(response, statusCode, message) {
  if (response.headersSent) {
    response.destroy();
    return;
  }
  const body = `${message}\n`;
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function forwardResponse(upstreamResponse, response) {
  response.writeHead(
    upstreamResponse.statusCode ?? 502,
    buildForwardHeaders(upstreamResponse.headers)
  );
  upstreamResponse.pipe(response);
}

function proxyToUpstream(request, response, pathname, search, upstream) {
  const target = new URL(upstream.href);
  const basePath = target.pathname.replace(/\/+$/, "");
  target.pathname = `${basePath}${pathname}` || "/";
  target.search = search;
  target.hash = "";

  const transport = target.protocol === "https:" ? https : http;
  const upstreamRequest = transport.request(
    {
      ...urlToHttpOptions(target),
      method: request.method,
      headers: buildForwardHeaders(request.headers, target.host),
    },
    (upstreamResponse) => {
      upstreamResponse.on("error", (error) => {
        logError(`Error reading upstream response for ${pathname}`, error);
        response.destroy();
      });
      response.on("close", () => {
        if (!response.writableEnded) {
          upstreamResponse.destroy();
          upstreamRequest.destroy();
        }
      });
      forwardResponse(upstreamResponse, response);
    }
  );

  upstreamRequest.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
    upstreamRequest.destroy(new Error("Upstream request timed out"));
  });

  upstreamRequest.on("error", (error) => {
    logError(`Upstream request failed for ${pathname}`, error);
    if (!response.headersSent) {
      sendError(
        response,
        502,
        "Bad gateway: Domolux Roles asset backend is unavailable."
      );
    } else {
      response.destroy();
    }
  });

  request.on("aborted", () => upstreamRequest.destroy());
  request.pipe(upstreamRequest);
}

function proxyToStatic(request, response, pathname, search, staticPort) {
  const staticRequest = http.request(
    {
      hostname: "127.0.0.1",
      port: staticPort,
      method: request.method,
      path: `${pathname}${search}`,
      headers: buildForwardHeaders(request.headers),
    },
    (staticResponse) => {
      staticResponse.on("error", (error) => {
        logError(`Error reading static response for ${pathname}`, error);
        response.destroy();
      });
      response.on("close", () => {
        if (!response.writableEnded) {
          staticResponse.destroy();
          staticRequest.destroy();
        }
      });
      forwardResponse(staticResponse, response);
    }
  );

  staticRequest.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
    staticRequest.destroy(new Error("Static server request timed out"));
  });

  staticRequest.on("error", (error) => {
    logError(`Frontend static server request failed for ${pathname}`, error);
    if (!response.headersSent) {
      sendError(
        response,
        502,
        "Bad gateway: frontend static file server is unavailable."
      );
    } else {
      response.destroy();
    }
  });

  request.on("aborted", () => staticRequest.destroy());
  request.pipe(staticRequest);
}

function handleRequest(options, request, response) {
  const target = parseRequestTarget(request.url ?? "/");
  if (!target) {
    sendError(response, 400, "Bad request: invalid URL.");
    return;
  }

  if (isDomoluxAssetPath(target.pathname)) {
    if (!proxyDomoluxAssets) {
      sendError(
        response,
        502,
        "Domolux Roles asset proxy is disabled because the configured " +
          "Home Assistant URL points at this development server. Start the " +
          "dev server with -c pointing at the real Home Assistant backend."
      );
      return;
    }
    proxyToUpstream(
      request,
      response,
      target.pathname,
      target.search,
      options.upstream
    );
    return;
  }

  proxyToStatic(
    request,
    response,
    target.pathname,
    target.search,
    options.staticPort
  );
}

function waitForStaticServer(port, child) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + STATIC_READY_TIMEOUT_MS;

    const attempt = () => {
      if (child.exitCode !== null || child.signalCode !== null) {
        reject(new Error("The static file server exited during startup"));
        return;
      }

      const socket = net.connect({ host: "127.0.0.1", port });
      let settled = false;

      const retry = () => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        if (Date.now() >= deadline) {
          reject(
            new Error(
              `The static file server did not listen on port ${port} in time`
            )
          );
          return;
        }
        setTimeout(attempt, 100);
      };

      socket.setTimeout(500);
      socket.once("connect", () => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        resolve();
      });
      socket.once("error", retry);
      socket.once("timeout", retry);
    };

    attempt();
  });
}

function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (proxyServer?.listening) {
    proxyServer.close();
  }
  for (const socket of proxySockets) {
    socket.destroy();
  }
  proxySockets.clear();

  if (staticServer && staticServer.exitCode === null) {
    const forceKill = setTimeout(() => {
      if (staticServer.exitCode === null) {
        staticServer.kill("SIGKILL");
      }
    }, 3_000);
    forceKill.unref();

    staticServer.once("exit", () => {
      clearTimeout(forceKill);
      process.exit(exitCode);
    });
    staticServer.kill("SIGTERM");
    return;
  }

  process.exit(exitCode);
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    options.upstream = parseUpstream(options.upstream);
  } catch (error) {
    logError("Invalid configuration", error);
    console.error(usage());
    process.exit(2);
    return;
  }

  const { listenPort, staticPort, upstream } = options;

  proxyDomoluxAssets = !isSelfTarget(upstream, [listenPort, staticPort]);
  if (!proxyDomoluxAssets) {
    log(
      "WARNING: the configured core URL points at this development server. " +
        "Domolux Roles asset proxying is disabled to prevent a proxy loop."
    );
    log(
      "WARNING: use -c with a Home Assistant URL reachable from this " +
        "environment to load Domolux Roles assets."
    );
  }

  log(
    proxyDomoluxAssets
      ? `Proxying ${DOMOLUX_ASSET_PATH}/* -> ${describeUpstream(upstream)}`
      : `Domolux Roles asset proxy disabled (upstream: ${describeUpstream(
          upstream
        )})`
  );

  staticServer = spawn(
    options.serveBin,
    [
      "-p",
      String(staticPort),
      "--single",
      "--no-port-switching",
      "--config",
      options.serveConfig,
      options.serveRoot,
    ],
    { stdio: "inherit", env: process.env }
  );

  staticServer.on("error", (error) => {
    logError("Failed to start the static file server", error);
    shutdown(1);
  });

  staticServer.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }
    if (signal === "SIGINT" || signal === "SIGTERM") {
      shutdown(0);
      return;
    }
    logError(
      `Static file server exited unexpectedly (code: ${code}, signal: ${signal})`
    );
    shutdown(code || 1);
  });

  try {
    await waitForStaticServer(staticPort, staticServer);
  } catch (error) {
    logError("Static file server startup failed", error);
    shutdown(1);
    return;
  }

  if (shuttingDown) {
    return;
  }

  proxyServer = http.createServer((request, response) =>
    handleRequest(options, request, response)
  );

  proxyServer.on("connection", (socket) => {
    proxySockets.add(socket);
    socket.on("close", () => proxySockets.delete(socket));
  });

  proxyServer.on("clientError", (error, socket) => {
    logError("Malformed client request", error);
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  proxyServer.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      logError(
        `Cannot listen on port ${listenPort}: the port is already in use`
      );
    } else {
      logError(`Proxy server error on port ${listenPort}`, error);
    }
    shutdown(1);
  });

  proxyServer.listen(listenPort, () => {
    log(`Frontend proxy listening on port ${listenPort}`);
    log(`Static frontend server listening on 127.0.0.1:${staticPort}`);
  });

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));
}

main().catch((error) => {
  logError("Unexpected failure", error);
  shutdown(1);
});
