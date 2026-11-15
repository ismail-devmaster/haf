/* global process */
// Copies the complete Domolux Roles build into the integration directory.
//
// The build emits a `domolux-assets.json` manifest listing every runtime asset,
// including dynamically imported chunks. This script uses that manifest instead
// of a manually maintained list of filenames, so new chunks are deployed
// automatically and stale generated files are removed.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import paths from "./paths.cjs";

const MANIFEST_NAME = "domolux-assets.json";
const DEPLOYED_MANIFEST_NAME = ".domolux-assets.json";

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const normalizeAsset = (name) => {
  const normalized = path.posix.normalize(String(name)).replace(/^\.\//, "");
  if (
    !normalized ||
    normalized === "." ||
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`Unsafe asset path in manifest: ${name}`);
  }
  return normalized;
};

const sameContents = (src, dest) => {
  const srcStat = fs.statSync(src);
  const destStat = fs.statSync(dest);
  if (srcStat.size !== destStat.size) {
    return false;
  }
  return fs.readFileSync(src).equals(fs.readFileSync(dest));
};

export async function deployDomoluxRoles({
  sourceDir = paths.domolux_roles_output_root,
  destDir = paths.domolux_roles_frontend,
  log = console.log,
} = {}) {
  const manifestPath = path.join(sourceDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Domolux asset manifest not found at ${manifestPath}. ` +
        "Run the Domolux build before deploying."
    );
  }

  const manifest = readJson(manifestPath);
  if (!Array.isArray(manifest.assets)) {
    throw new Error(`Invalid Domolux asset manifest at ${manifestPath}`);
  }

  const entrypoint = normalizeAsset(manifest.entrypoint || "entrypoint.js");
  const assets = [...new Set(manifest.assets.map(normalizeAsset))];
  if (!assets.includes(entrypoint)) {
    assets.push(entrypoint);
  }
  assets.sort();

  fs.mkdirSync(destDir, { recursive: true });

  const deployedManifestPath = path.join(destDir, DEPLOYED_MANIFEST_NAME);
  let previousAssets = [];
  if (fs.existsSync(deployedManifestPath)) {
    try {
      const previous = readJson(deployedManifestPath);
      if (Array.isArray(previous.assets)) {
        previousAssets = previous.assets.map(normalizeAsset);
      }
    } catch (err) {
      log(`[domolux] Ignoring unreadable previous manifest: ${err.message}`);
    }
  }

  const deployed = [];
  const unchanged = [];
  const missing = [];

  for (const asset of assets) {
    const src = path.join(sourceDir, asset);
    const dest = path.join(destDir, asset);

    if (!fs.existsSync(src)) {
      missing.push(asset);
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (fs.existsSync(dest) && sameContents(src, dest)) {
      unchanged.push(asset);
      continue;
    }

    fs.copyFileSync(src, dest);
    deployed.push(asset);
  }

  const staleAssets = previousAssets.filter((asset) => !assets.includes(asset));
  const removed = [];
  for (const asset of staleAssets) {
    const dest = path.join(destDir, asset);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest);
      removed.push(asset);
    }
  }

  fs.writeFileSync(
    deployedManifestPath,
    `${JSON.stringify({ entrypoint, assets }, null, 2)}\n`
  );

  log(
    `[domolux] Deployed to ${destDir}: ${deployed.length} copied, ` +
      `${unchanged.length} unchanged, ${removed.length} removed, ` +
      `${missing.length} missing`
  );
  if (deployed.length) {
    log(`[domolux] Copied assets: ${deployed.join(", ")}`);
  }
  if (removed.length) {
    log(`[domolux] Removed stale assets: ${removed.join(", ")}`);
  }
  if (missing.length) {
    log(`[domolux] Missing assets: ${missing.join(", ")}`);
  }

  return { entrypoint, assets, deployed, unchanged, removed, missing };
}

const isMain =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  deployDomoluxRoles().catch((err) => {
    console.error(`[domolux] Deployment failed: ${err.message}`);
    process.exitCode = 1;
  });
}
