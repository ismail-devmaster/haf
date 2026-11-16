/**
 * Minimal Chrome DevTools Protocol client used by the Domolux browser tests.
 *
 * The repository does not depend on Playwright or Puppeteer, so this module
 * speaks CDP directly over Node's built-in WebSocket.  It only implements the
 * handful of commands the browser suite needs, which keeps the dependency
 * footprint at zero.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_BIN = process.env.CHROME_BIN || "google-chrome";

/** Start a headless Chrome and return a handle for it. */
export async function launchChrome({ headless = true } = {}) {
  const profile = mkdtempSync(join(tmpdir(), "domolux-chrome-"));
  const args = [
    headless ? "--headless=new" : null,
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-features=Translate,MediaRouter",
    "--window-size=1400,1000",
    "--hide-scrollbars",
    "about:blank",
  ].filter(Boolean);

  const proc = spawn(CHROME_BIN, args, { stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  proc.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const portFile = join(profile, "DevToolsActivePort");
  const deadline = Date.now() + 30_000;
  let port = null;
  while (Date.now() < deadline) {
    try {
      const [line] = readFileSync(portFile, "utf8").split("\n");
      port = Number(line.trim());
      if (port > 0) break;
    } catch {
      // Chrome has not written the file yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!port) {
    proc.kill("SIGKILL");
    throw new Error(`Chrome did not expose a debugging port.\n${stderr}`);
  }

  let wsUrl = null;
  const wsDeadline = Date.now() + 15_000;
  while (Date.now() < wsDeadline && !wsUrl) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      const info = await response.json();
      wsUrl = info.webSocketDebuggerUrl;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  if (!wsUrl) {
    proc.kill("SIGKILL");
    throw new Error("Chrome debugging endpoint did not become available.");
  }

  return {
    proc,
    port,
    wsUrl,
    async close() {
      try {
        proc.kill("SIGTERM");
      } catch {
        // already gone
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        proc.kill("SIGKILL");
      } catch {
        // already gone
      }
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        // best effort
      }
    },
  };
}

/** A CDP connection with promise based command dispatch. */
export class CDP {
  static async connect(wsUrl) {
    const socket = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener(
        "error",
        () => reject(new Error(`could not connect to ${wsUrl}`)),
        { once: true }
      );
    });
    return new CDP(socket);
  }

  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== undefined) {
        const entry = this.pending.get(message.id);
        if (!entry) return;
        this.pending.delete(message.id);
        if (message.error) {
          entry.reject(
            new Error(`${message.error.message} (${message.error.code})`)
          );
        } else {
          entry.resolve(message.result);
        }
        return;
      }
      const key = `${message.sessionId || ""}:${message.method}`;
      for (const handler of this.listeners.get(key) || []) {
        handler(message.params);
      }
      for (const handler of this.listeners.get(`*:${message.method}`) || []) {
        handler(message.params, message.sessionId);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(payload));
    });
  }

  on(method, handler, sessionId) {
    const key = `${sessionId || ""}:${method}`;
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key).push(handler);
  }

  close() {
    try {
      this.socket.close();
    } catch {
      // already closed
    }
  }
}

/** Shared in-page helpers, injected into every document. */
const PAGE_HELPERS = String.raw`
(() => {
  if (window.__dlAll) return;

  // Collect every element matching a selector across all shadow roots.
  window.__dlAll = (selector) => {
    const out = [];
    const stack = [document];
    const seen = new Set();
    while (stack.length) {
      const root = stack.pop();
      if (!root || seen.has(root)) continue;
      seen.add(root);
      try {
        for (const el of root.querySelectorAll(selector)) out.push(el);
      } catch (err) {
        // ignore invalid selector for this root
      }
      let descendants = [];
      try {
        descendants = root.querySelectorAll("*");
      } catch (err) {
        descendants = [];
      }
      for (const el of descendants) {
        if (el.shadowRoot) stack.push(el.shadowRoot);
      }
    }
    return out;
  };

  // All text currently rendered, including shadow roots.
  window.__dlText = () => {
    const parts = [document.body ? document.body.innerText : ""];
    for (const el of window.__dlAll("*")) {
      if (el.tagName === "STYLE" || el.tagName === "SCRIPT") continue;
      if (el.children.length === 0 && el.textContent) parts.push(el.textContent);
    }
    return parts.join("\n");
  };

  window.__dlHass = () => {
    const app = document.querySelector("home-assistant");
    return app && app.hass ? app.hass : null;
  };

  // Index of the visible login inputs (username, password).
  window.__dlInputs = () => {
    window.__dlInputList = window
      .__dlAll("input")
      .filter((el) => {
        if (el.type === "hidden" || el.disabled) return false;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }
        return el.getClientRects().length > 0;
      });
    return window.__dlInputList.map((el) => ({
      type: el.type,
      value: el.value,
      autocomplete: el.getAttribute("autocomplete"),
    }));
  };

  window.__dlFocusInput = (index) => {
    const list = window.__dlInputList || [];
    const el = list[index];
    if (!el) return false;
    el.focus();
    el.click();
    return document.activeElement === el || !!el.getClientRects().length;
  };

  window.__dlSubmitLogin = () => {
    const flows = window.__dlAll("ha-auth-flow");
    if (!flows.length) return "no-auth-flow";
    const flow = flows[0];
    const root = flow.shadowRoot || flow;
    const button =
      root.querySelector(".action ha-button") ||
      root.querySelector("ha-button");
    if (!button) return "no-button";
    const inner = button.shadowRoot
      ? button.shadowRoot.querySelector("button")
      : null;
    (inner || button).click();
    return "clicked";
  };

  window.__dlLoginState = () => {
    const hass = window.__dlHass();
    return {
      loggedIn: !!(hass && hass.user && hass.user.id),
      app: !!window.__dlAll("home-assistant").length,
      authFlow: !!window.__dlAll("ha-auth-flow").length,
      user: hass && hass.user ? { id: hass.user.id, name: hass.user.name } : null,
    };
  };
})();
`;

/** One page in one isolated browser context. */
export class Page {
  static async create(cdp, { origin, label, browserContextId }) {
    const target = await cdp.send("Target.createTarget", {
      url: "about:blank",
      browserContextId,
    });
    const attached = await cdp.send("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: true,
    });
    const page = new Page(cdp, attached.sessionId, target.targetId, {
      origin,
      label,
    });
    await page.prepare();
    return page;
  }

  constructor(cdp, sessionId, targetId, { origin, label }) {
    this.cdp = cdp;
    this.sessionId = sessionId;
    this.targetId = targetId;
    this.origin = origin;
    this.label = label;
    this.consoleErrors = [];
    this.failedRequests = [];
  }

  async prepare() {
    await this.cdp.send("Page.enable", {}, this.sessionId);
    await this.cdp.send("Runtime.enable", {}, this.sessionId);
    await this.cdp.send("Network.enable", {}, this.sessionId);
    await this.cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false },
      this.sessionId
    );
    await this.cdp.send(
      "Page.addScriptToEvaluateOnNewDocument",
      { source: PAGE_HELPERS },
      this.sessionId
    );

    this.cdp.on(
      "Runtime.consoleAPICalled",
      (params) => {
        if (params.type === "error") {
          const text = (params.args || [])
            .map((arg) => arg.value || arg.description || "")
            .join(" ");
          this.consoleErrors.push(text);
        }
      },
      this.sessionId
    );
    this.cdp.on(
      "Network.loadingFailed",
      (params) => {
        this.failedRequests.push(params.errorText || "loadingFailed");
      },
      this.sessionId
    );
  }

  async evaluate(expression) {
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await this.cdp.send(
          "Runtime.evaluate",
          {
            expression,
            awaitPromise: true,
            returnByValue: true,
            userGesture: true,
          },
          this.sessionId
        );
        if (result.exceptionDetails) {
          const detail =
            result.exceptionDetails.exception?.description ||
            result.exceptionDetails.text ||
            "evaluation failed";
          throw new Error(`${this.label}: ${detail}`);
        }
        return result.result.value;
      } catch (err) {
        lastError = err;
        if (
          !/navigated or closed|Execution context was destroyed/i.test(
            err.message
          )
        ) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    throw lastError;
  }

  async navigate(url) {
    await this.cdp.send("Page.navigate", { url }, this.sessionId);
  }

  /** Poll an in-page expression until it returns a truthy value. */
  async waitFor(expression, { timeout = 60_000, interval = 250 } = {}) {
    const deadline = Date.now() + timeout;
    let lastError = null;
    while (Date.now() < deadline) {
      try {
        const value = await this.evaluate(expression);
        if (value) return value;
      } catch (err) {
        lastError = err;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(
      `${this.label}: timed out waiting for ${expression}` +
        (lastError ? ` (${lastError.message})` : "")
    );
  }

  /** Wait until Lovelace cards have rendered. */
  async waitForCards({ timeout = 60_000 } = {}) {
    return this.waitFor(
      'window.__dlAll("hui-card, hui-tile-card").length > 0',
      { timeout }
    );
  }

  /** Wait until a short rendered text contains ``needle``. */
  async waitForText(needle, { timeout = 30_000 } = {}) {
    return this.waitFor(
      `window.__dlText().includes(${JSON.stringify(needle)})`,
      { timeout, interval: 500 }
    );
  }

  async waitForApp({ timeout = 120_000 } = {}) {
    return this.waitFor(
      "!!(window.__dlLoginState && window.__dlLoginState().loggedIn)",
      { timeout }
    );
  }

  /** Log in through the real Home Assistant login form. */
  async login(username, password, { timeout = 120_000 } = {}) {
    await this.navigate(`${this.origin}/`);
    // Either the login form or the app shows up, depending on the session.
    await this.waitFor(
      "(window.__dlLoginState && window.__dlLoginState() && (window.__dlLoginState().loggedIn || window.__dlLoginState().authFlow))",
      { timeout }
    );

    const state = await this.evaluate("window.__dlLoginState()");
    if (state.loggedIn) return;

    // The auth flow is created asynchronously; wait for the fields.
    await this.waitFor(
      "window.__dlInputs().filter((field) => field.type !== 'checkbox').length >= 2",
      { timeout }
    );

    const inputs = await this.evaluate("window.__dlInputs()");
    if (inputs.length < 2) {
      throw new Error(
        `${this.label}: expected a username and password field, got ${JSON.stringify(inputs)}`
      );
    }

    await this.evaluate("window.__dlFocusInput(0)");
    await this.cdp.send("Input.insertText", { text: username }, this.sessionId);
    await this.evaluate("window.__dlFocusInput(1)");
    await this.cdp.send("Input.insertText", { text: password }, this.sessionId);

    const submit = await this.evaluate("window.__dlSubmitLogin()");
    if (submit !== "clicked") {
      throw new Error(
        `${this.label}: could not submit the login form (${submit})`
      );
    }

    await this.waitForApp({ timeout });
    const failed = await this.evaluate("window.__dlAll('ha-auth-flow').length");
    if (failed) {
      const error = await this.evaluate(
        "((window.__dlAll('ha-alert') || [])[0] || {}).textContent || ''"
      );
      throw new Error(`${this.label}: login failed: ${error}`);
    }
  }

  async user() {
    return this.evaluate(
      "(() => { const h = window.__dlHass(); return h && h.user ? { id: h.user.id, name: h.user.name, is_admin: h.user.is_admin } : null; })()"
    );
  }

  async lightStates() {
    return this.evaluate(
      "Object.keys(window.__dlHass().states).filter((id) => id.startsWith('light.')).sort()"
    );
  }

  async renderedText() {
    return this.evaluate("window.__dlText()");
  }

  /** Short leaf texts only: entity names, headings, counters. */
  async shortTexts(maxLength = 80) {
    return this.evaluate(`(() => {
      const skip = new Set(["STYLE", "SCRIPT", "TEMPLATE", "HEAD", "TITLE"]);
      const out = [];
      for (const el of window.__dlAll("*")) {
        if (skip.has(el.tagName) || el.children.length !== 0) continue;
        const text = (el.textContent || "").trim();
        if (!text || text.length > ${maxLength}) continue;
        out.push(text);
      }
      return Array.from(new Set(out));
    })()`);
  }

  /** Entity ids referenced by the rendered Lovelace cards. */
  async cardEntities() {
    return this.evaluate(`(() => {
      const entities = new Set();
      const areas = new Set();
      for (const card of window.__dlAll("hui-card, hui-tile-card")) {
        const config = card.config || card._config || null;
        if (!config) continue;
        if (config.entity) entities.add(config.entity);
        if (config.area) areas.add(config.area);
        if (Array.isArray(config.entities)) {
          for (const entry of config.entities) {
            if (typeof entry === "string") entities.add(entry);
            else if (entry && entry.entity) entities.add(entry.entity);
          }
        }
      }
      return { entities: Array.from(entities).sort(), areas: Array.from(areas).sort() };
    })()`);
  }

  async accessToken() {
    return this.evaluate(
      "(() => { const c = window.__tokenCache; return c && c.tokens ? c.tokens.access_token : null; })()"
    );
  }

  async callWS(message) {
    return this.evaluate(
      `window.__dlHass().callWS(${JSON.stringify(message)}).then(
        (result) => ({ ok: true, result }),
        (error) => ({ ok: false, error: { code: error.code, message: error.message } })
      )`
    );
  }

  async rest(path, { method = "GET" } = {}) {
    return this.evaluate(
      `(async () => {
        const token = window.__tokenCache && window.__tokenCache.tokens
          ? window.__tokenCache.tokens.access_token
          : null;
        const response = await fetch(${JSON.stringify(path)}, {
          method: ${JSON.stringify(method)},
          headers: token ? { Authorization: "Bearer " + token } : {},
        });
        let body = null;
        try { body = await response.json(); } catch (err) { body = null; }
        return { status: response.status, body };
      })()`
    );
  }

  async screenshot(path) {
    const shot = await this.cdp.send(
      "Page.captureScreenshot",
      { format: "png", captureBeyondViewport: false },
      this.sessionId
    );
    const { writeFileSync, mkdirSync } = await import("node:fs");
    const { dirname } = await import("node:path");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(shot.data, "base64"));
  }
}
