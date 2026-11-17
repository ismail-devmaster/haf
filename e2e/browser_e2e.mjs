#!/usr/bin/env node
/**
 * Domolux Roles – browser end-to-end verification (TASKS.md §14.3).
 *
 * Runs against a real Home Assistant instance with the integration loaded and
 * the API level `setup` phase already executed (it provides the Father, the two
 * Children and their permissions).
 *
 * Every check prints a machine readable `RESULT <json>` line, exactly like the
 * Python phases, so the runner can assert on the outcome.
 *
 * Usage:
 *   node e2e/browser_e2e.mjs --state <state.json> [--origin URL] [--shots DIR]
 */

import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CDP, Page, launchChrome } from "./cdp.mjs";

// ---------------------------------------------------------------------------
// arguments
// ---------------------------------------------------------------------------
function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const ORIGIN = arg("origin", "http://127.0.0.1:8123");
const STATE_PATH = arg(
  "state",
  join(process.cwd(), "evidence/E2E/browser-state/state.json")
);
const SHOTS = arg("shots", join(process.cwd(), "evidence/E2E/screenshots"));

const ADMIN = { user: "e2e_admin", password: "e2e-Admin-Pass-1" };
const FATHER = { user: "e2e_father", password: "e2e-Father-Pass-1" };
const CHILD_A = { user: "e2e_child_a", password: "e2e-ChildA-Pass-1" };
const CHILD_B = { user: "e2e_child_b", password: "e2e-ChildB-Pass-1" };

const state = JSON.parse(readFileSync(STATE_PATH, "utf8"));
const PERMITTED = state.permitted_entity;
const FORBIDDEN = state.forbidden_entity;

const results = [];
let failures = 0;
let knownIssues = 0;

/**
 * Record one check.
 *
 * `knownIssue` marks a documented, non-security defect: the check still
 * reports the real observation, but it does not fail the release gate.
 */
function record(check, ok, details = {}) {
  const { knownIssue = false, ...rest } = details;
  const entry = { check, ok: Boolean(ok), ...rest };
  if (knownIssue && !entry.ok) {
    entry.status = "known_issue";
    knownIssues += 1;
  } else if (!entry.ok) {
    failures += 1;
  }
  results.push(entry);
  process.stdout.write(`RESULT ${JSON.stringify(entry)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
const chrome = await launchChrome();
const cdp = await CDP.connect(chrome.wsUrl);
const pages = {};

async function openPage(label, credentials) {
  const { browserContextId } = await cdp.send("Target.createBrowserContext");
  const page = await Page.create(cdp, {
    origin: ORIGIN,
    label,
    browserContextId,
  });
  await page.login(credentials.user, credentials.password);
  pages[label] = page;
  return page;
}

async function shot(page, name) {
  try {
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot(join(SHOTS, `${name}.png`));
  } catch {
    // screenshots are evidence, never a hard failure
  }
}

try {
  // -------------------------------------------------------------------------
  // 1. Father signs in through the real login form
  // -------------------------------------------------------------------------
  const father = await openPage("father", FATHER);
  const fatherUser = await father.user();
  record("browser.father_login", fatherUser?.name === "E2E Father", {
    user: fatherUser,
  });

  await father.waitFor(
    "Object.keys(window.__dlHass().states).some((id) => id.startsWith('light.'))"
  );
  await father.waitForCards();
  await father.waitForText("Lights");
  const fatherLights = await father.lightStates();
  record(
    "browser.father_sees_household",
    fatherLights.length >= 3 &&
      fatherLights.includes(PERMITTED) &&
      fatherLights.includes(FORBIDDEN),
    { lights: fatherLights }
  );
  await shot(father, "father-overview");

  const fatherCards = await father.cardEntities();
  record(
    "browser.father_dashboard_renders",
    Array.isArray(fatherCards.entities),
    {
      entities: fatherCards.entities,
    }
  );

  // -------------------------------------------------------------------------
  // 1a. Father opens Domolux Roles canonical panel at /domolux-roles
  // -------------------------------------------------------------------------
  await father.navigate(`${ORIGIN}/domolux-roles`);
  await sleep(4000);
  const fatherRolesUrl = await father.evaluate("location.href");
  const fatherRolesTexts = (await father.shortTexts()).join("\n");
  record(
    "browser.father_domolux_roles_opens_successfully",
    fatherRolesUrl.includes("/domolux-roles") &&
      !fatherRolesUrl.includes("/dashboard-user/overview"),
    { url: fatherRolesUrl }
  );
  await shot(father, "father-domolux-roles");

  // Reload page and confirm Father stays on /domolux-roles without redirect
  await father.evaluate("location.reload()");
  await sleep(4000);
  const fatherReloadUrl = await father.evaluate("location.href");
  record(
    "browser.father_domolux_roles_reload_no_redirect",
    fatherReloadUrl.includes("/domolux-roles") &&
      !fatherReloadUrl.includes("/dashboard-user/overview"),
    { url: fatherReloadUrl }
  );

  // -------------------------------------------------------------------------
  // 1a-2. Father resource discovery in real browser on /domolux-roles
  // -------------------------------------------------------------------------
  // 1. Father calls domolux/catalog via WebSocket from browser context
  const catalogWS = await father.callWS({ type: "domolux/catalog" });
  const catalogData = catalogWS?.result?.catalog || {};
  const discoveredDevices = catalogData.devices || [];
  const discoveredDashboards = catalogData.dashboards || [];

  record(
    "browser.father_discovers_household_devices",
    catalogWS.ok === true &&
      discoveredDevices.length > 0 &&
      discoveredDevices.some((d) => d.name && d.name !== "Unnamed device"),
    {
      device_count: discoveredDevices.length,
      sample_devices: discoveredDevices.slice(0, 3).map((d) => ({
        id: d.device_id,
        name: d.name,
        channels: d.channels?.length,
      })),
    }
  );

  const discoveredDashIds = discoveredDashboards.map((db) => db.dashboard_id);
  const userDash = discoveredDashboards.find((db) => db.dashboard_id === "dashboard-user");
  const userDashViews = (userDash?.views || []).map((v) => v.view_path);

  record(
    "browser.father_discovers_all_dashboards_and_views",
    discoveredDashIds.includes("lovelace") &&
      discoveredDashIds.includes("dashboard-user") &&
      userDashViews.includes("overview") &&
      userDashViews.includes("kids-room"),
    {
      dashboards: discoveredDashIds,
      user_dashboard_views: userDashViews,
    }
  );

  // Helper script injected into browser context to recursively locate ha-domolux-family-manager
  // across shadow boundaries and custom panel iframes
  const findMgrFunc = `
    function findDomoluxMgr(root = document) {
      if (!root) return null;
      if (root.tagName && root.tagName.toLowerCase() === "ha-domolux-family-manager") {
        return root;
      }
      if (root.shadowRoot) {
        const found = findDomoluxMgr(root.shadowRoot);
        if (found) return found;
      }
      if (root.tagName && root.tagName.toLowerCase() === "iframe") {
        try {
          const doc = root.contentDocument || root.contentWindow?.document;
          if (doc) {
            const found = findDomoluxMgr(doc);
            if (found) return found;
          }
        } catch (e) {}
      }
      const children = root.children || root.childNodes || [];
      for (const child of children) {
        if (child.nodeType === 1) {
          const found = findDomoluxMgr(child);
          if (found) return found;
        }
      }
      return null;
    }
  `;

  // 2. Open the Permission Dialog for Child A in the Family Manager DOM
  await father.evaluate(`(async () => {
    ${findMgrFunc}
    const mgr = findDomoluxMgr();
    if (mgr) {
      const member = (mgr._familyMembers || []).find((m) => m.display_name === "Child A" || m.user_id === "${state.child_a_id}") || {
        user_id: "${state.child_a_id}",
        display_name: "Child A",
        username: "child_a",
        managed_by_domolux: true,
      };
      await mgr._openPermissionDialog(member);
      mgr.requestUpdate();
    }
  })()`);
  await sleep(3000);

  // Check dialog rendered with devices
  const permDialogState = await father.evaluate(`(() => {
    ${findMgrFunc}
    const mgr = findDomoluxMgr();
    if (!mgr) return { found: false };
    const devCount = (mgr._catalogDevices || []).length;
    const emptyState = !!mgr.shadowRoot?.querySelector(".empty-state");
    const deviceCards = mgr.shadowRoot?.querySelectorAll(".device-card")?.length || 0;
    return {
      found: true,
      open: Boolean(mgr._showPermissionDialog),
      devicesTabActive: mgr._activePermissionTab === "devices",
      devCount,
      emptyState,
      deviceCards,
    };
  })()`);

  record(
    "browser.permission_dialog_shows_household_devices",
    permDialogState.open === true &&
      permDialogState.devCount > 0 &&
      permDialogState.deviceCards > 0 &&
      permDialogState.emptyState === false,
    { state: permDialogState }
  );
  await shot(father, "father-household-devices-catalog");

  // Switch to "Dashboards and views" tab
  await father.evaluate(`(() => {
    ${findMgrFunc}
    const mgr = findDomoluxMgr();
    if (mgr) {
      mgr._activePermissionTab = "dashboards";
      mgr.requestUpdate();
    }
  })()`);
  await sleep(2000);

  const dashboardsTabState = await father.evaluate(`(() => {
    ${findMgrFunc}
    const mgr = findDomoluxMgr();
    if (!mgr) return { found: false };
    const dashCount = (mgr._catalogDashboards || []).length;
    const emptyState = !!mgr.shadowRoot?.querySelector(".empty-state");
    const dashBlocks = mgr.shadowRoot?.querySelectorAll(".dashboard-block")?.length || 0;
    const viewCards = mgr.shadowRoot?.querySelectorAll(".view-card")?.length || 0;
    return {
      found: true,
      dashCount,
      emptyState,
      dashBlocks,
      viewCards,
    };
  })()`);

  record(
    "browser.permission_dialog_shows_dashboards_and_views",
    dashboardsTabState.dashCount >= 2 &&
      dashboardsTabState.dashBlocks >= 2 &&
      dashboardsTabState.viewCards >= 2 &&
      dashboardsTabState.emptyState === false,
    { state: dashboardsTabState }
  );
  await shot(father, "father-dashboards-views-catalog");

  // Father assigns view permission to Child A directly through UI method
  await father.evaluate(`(async () => {
    ${findMgrFunc}
    const mgr = findDomoluxMgr();
    if (mgr) {
      await mgr._handleSetViewRuleDirect("kids-room", "read");
      mgr.requestUpdate();
    }
  })()`);
  await sleep(3000);

  const updatedPermSet = await father.callWS({
    type: "domolux/permission/get",
    user_id: state.child_a_id,
  });
  const childAViewRule = (
    updatedPermSet?.result?.view_rules ||
    updatedPermSet?.result?.permissions?.view_rules ||
    {}
  )["kids-room"];
  record(
    "browser.father_sets_view_permission_via_catalog",
    Boolean(childAViewRule && (childAViewRule.effect === "allow" || childAViewRule.access_level === "read")),
    { view_rule: childAViewRule }
  );

  // Restore Child A's baseline by removing the temporary view rule
  await father.callWS({
    type: "domolux/permission/remove_view_rule",
    user_id: state.child_a_id,
    view_path: "kids-room",
  });
  await sleep(1000);

  // Close dialog and restore
  await father.evaluate(`(() => {
    ${findMgrFunc}
    const mgr = findDomoluxMgr();
    if (mgr) {
      mgr._closePermissionDialog();
    }
  })()`);
  await sleep(1000);

  // Navigate back to overview for subsequent checks
  await father.navigate(`${ORIGIN}/`);
  await sleep(2000);

  // -------------------------------------------------------------------------
  // 1b. Father Preview as Child Feature (P1)
  // -------------------------------------------------------------------------
  const previewStart = await father.callWS({
    type: "domolux/preview/start",
    child_user_id: state.child_a_id,
  });
  record(
    "browser.preview.start_as_father",
    previewStart.ok === true && previewStart.result?.preview?.active === true,
    { response: previewStart }
  );

  const previewViews = await father.callWS({
    type: "domolux/permission/my_views",
  });
  record(
    "browser.preview.my_views_reflects_child",
    previewViews.ok === true &&
      previewViews.result?.preview_mode === true &&
      previewViews.result?.preview_child_id === state.child_a_id &&
      previewViews.result?.all_views_allowed === false,
    { response: previewViews }
  );

  const previewEval = await father.callWS({
    type: "domolux/preview/evaluate",
    child_user_id: state.child_a_id,
    entity_id: PERMITTED,
    access_level: "read",
  });
  const previewEvalForbidden = await father.callWS({
    type: "domolux/preview/evaluate",
    child_user_id: state.child_a_id,
    entity_id: FORBIDDEN,
    access_level: "read",
  });
  record(
    "browser.preview.evaluate_child_permissions",
    previewEval.ok === true &&
      previewEval.result?.entity_evaluation?.granted === true &&
      previewEvalForbidden.ok === true &&
      previewEvalForbidden.result?.entity_evaluation?.granted === false,
    { permitted: previewEval.result, forbidden: previewEvalForbidden.result }
  );

  const previewStop = await father.callWS({
    type: "domolux/preview/stop",
  });
  const viewsRestored = await father.callWS({
    type: "domolux/permission/my_views",
  });
  record(
    "browser.preview.stop_restores_father",
    previewStop.ok === true &&
      viewsRestored.ok === true &&
      viewsRestored.result?.all_views_allowed === true &&
      viewsRestored.result?.preview_mode === false,
    { stop: previewStop, restored: viewsRestored }
  );

  // -------------------------------------------------------------------------
  // 2. Child A signs in in its own isolated browser context
  // -------------------------------------------------------------------------
  const childA = await openPage("childA", CHILD_A);
  const childAUser = await childA.user();
  record("browser.child_a_login", childAUser?.name === "Child A", {
    user: childAUser,
  });

  await childA.waitFor(
    "Object.keys(window.__dlHass().states).some((id) => id.startsWith('light.'))"
  );
  await childA.waitForCards();
  await childA.waitForText("Lights");
  const childALights = await childA.lightStates();
  record(
    "browser.child_a_sees_only_permitted_light",
    childALights.length === 1 && childALights[0] === PERMITTED,
    { lights: childALights, permitted: PERMITTED }
  );

  const childACards = await childA.cardEntities();
  const childAForbiddenCards = childACards.entities.filter(
    (entity) => entity.startsWith("light.") && entity !== PERMITTED
  );
  record(
    "browser.child_a_dashboard_has_no_foreign_light_cards",
    childAForbiddenCards.length === 0,
    { entities: childACards.entities, areas: childACards.areas }
  );

  const childATexts = (await childA.shortTexts()).join("\n");
  record("browser.child_a_dashboard_renders", childATexts.includes("Lights"), {
    has_lights_section: childATexts.includes("Lights"),
    cards: childACards.entities.length + childACards.areas.length,
  });

  // Home Assistant's generated overview builds a "Devices" tile for
  // `zone.home`; a managed Child is denied that entity, so the tile renders an
  // "Entity not found" warning.  Tracked as F-5.
  await sleep(1500);
  const warnings = await childA.evaluate(`(() => {
    const warnings = window.__dlAll("hui-warning");
    const entities = [];
    for (const warning of warnings) {
      let node = warning;
      for (let i = 0; i < 6 && node; i += 1) {
        if (node.config && node.config.entity) { entities.push(node.config.entity); break; }
        node = node.parentElement || (node.getRootNode && node.getRootNode().host) || null;
      }
    }
    return { count: warnings.length, entities };
  })()`);
  record("browser.child_a_overview_has_no_broken_cards", warnings.count === 0, {
    knownIssue: false,
    finding: "F-5",
    warnings: warnings.count,
    unresolved_entities: warnings.entities,
    note: "unauthorized and unavailable entity cards are gracefully hidden without disclosure",
  });
  await shot(childA, "child-a-overview");

  // -------------------------------------------------------------------------
  // 3. Child A cannot use hidden entities from the page (devtools style)
  // -------------------------------------------------------------------------
  const allowedCall = await childA.callWS({
    type: "call_service",
    domain: "light",
    service: "turn_on",
    service_data: { entity_id: PERMITTED },
  });
  record(
    "browser.child_a_ui_can_control_permitted_entity",
    allowedCall.ok === true,
    { response: allowedCall }
  );

  await sleep(1500);
  const permittedOn = await childA.evaluate(
    `(window.__dlHass().states[${JSON.stringify(PERMITTED)}] || {}).state`
  );
  record(
    "browser.child_a_permitted_entity_state_changed",
    permittedOn === "on",
    {
      state: permittedOn,
    }
  );

  const deniedCall = await childA.callWS({
    type: "call_service",
    domain: "light",
    service: "turn_on",
    service_data: { entity_id: FORBIDDEN },
  });
  record(
    "browser.child_a_ui_cannot_control_hidden_entity",
    deniedCall.ok === false,
    {
      error: deniedCall.error,
    }
  );

  const wildcardCall = await childA.callWS({
    type: "call_service",
    domain: "light",
    service: "turn_off",
    service_data: { entity_id: "all" },
  });
  record("browser.child_a_ui_wildcard_denied", wildcardCall.ok === false, {
    error: wildcardCall.error,
  });

  const directRead = await childA.rest(`/api/states/${FORBIDDEN}`);
  record(
    "browser.child_a_rest_hidden_entity_denied",
    directRead.status === 401 || directRead.status === 404,
    { status: directRead.status }
  );

  const childPreviewAttempt = await childA.callWS({
    type: "domolux/preview/start",
    child_user_id: state.child_b_id,
  });
  record(
    "browser.preview.child_denied_starting_preview",
    childPreviewAttempt.ok === false,
    { response: childPreviewAttempt }
  );

  record(
    "browser.child_a_domolux_roles_hidden_from_sidebar",
    !childATexts.includes("Domolux Roles"),
    {
      knownIssue: false,
      observed_sidebar_entry: childATexts.includes("Domolux Roles"),
      note: "Domolux Roles canonical panel is hidden from managed Child sidebar.",
    }
  );

  record(
    "browser.child_a_parent_console_hidden_from_sidebar",
    !childATexts.includes("Parent Console"),
    {
      knownIssue: false,
      finding: "F-4",
      observed_sidebar_entry: childATexts.includes("Parent Console"),
      note: "Father-only panels are hidden from managed Child sidebar.",
    }
  );

  // Direct navigation to hidden views must not expose data (tested on probe page).
  const childProbe = await openPage("childProbe", CHILD_A);
  await childProbe.navigate(`${ORIGIN}/domolux-manage`);
  await sleep(5000);
  const consoleTexts = (await childProbe.shortTexts()).join("\n");
  record(
    "browser.child_a_parent_console_has_no_family_data",
    !consoleTexts.includes("Child B") && !consoleTexts.includes("e2e_child_b"),
    { url: await childProbe.evaluate("location.href") }
  );

  // The Family Manager panel is also Father-only; opening it must not leak.
  await childProbe.navigate(`${ORIGIN}/domolux-family`);
  await sleep(5000);
  const familyTexts = (await childProbe.shortTexts()).join("\n");
  record(
    "browser.child_a_family_manager_has_no_family_data",
    !familyTexts.includes("Child B") && !familyTexts.includes("e2e_child_b"),
    { url: await childProbe.evaluate("location.href") }
  );

  // Direct navigation to canonical /domolux-roles must not expose data to Child.
  await childProbe.navigate(`${ORIGIN}/domolux-roles`);
  await sleep(5000);
  const rolesTexts = (await childProbe.shortTexts()).join("\n");
  record(
    "browser.child_a_domolux_roles_has_no_family_data",
    !rolesTexts.includes("Child B") && !rolesTexts.includes("e2e_child_b"),
    { url: await childProbe.evaluate("location.href") }
  );
  await shot(childProbe, "child-a-parent-console");

  // -------------------------------------------------------------------------
  // 3b. Home Assistant Administrator verification
  // -------------------------------------------------------------------------
  const adminPage = await openPage("admin", ADMIN);
  const adminUser = await adminPage.user();
  record("browser.admin_login", adminUser?.is_admin === true, {
    user: adminUser,
  });

  await adminPage.navigate(`${ORIGIN}/config`);
  await sleep(3000);
  const adminConfigUrl = await adminPage.evaluate("location.href");
  record(
    "browser.admin_config_accessible",
    adminConfigUrl.includes("/config"),
    { url: adminConfigUrl }
  );

  // -------------------------------------------------------------------------
  // 4. Child B (read-only permission set) signs in
  // -------------------------------------------------------------------------
  const childB = await openPage("childB", CHILD_B);
  const childBUser = await childB.user();
  record("browser.child_b_login", childBUser?.name === "Child B", {
    user: childBUser,
  });

  await childB.waitFor(
    "Object.keys(window.__dlHass().states).some((id) => id.startsWith('light.'))"
  );
  await childB.waitForCards();
  await childB.waitForText("Lights");
  const childBLights = await childB.lightStates();
  record(
    "browser.child_b_sees_only_permitted_light",
    childBLights.length === 1 && childBLights[0] === FORBIDDEN,
    { lights: childBLights }
  );

  const readOnlyControl = await childB.callWS({
    type: "call_service",
    domain: "light",
    service: "turn_off",
    service_data: { entity_id: FORBIDDEN },
  });
  record(
    "browser.child_b_read_only_cannot_control",
    readOnlyControl.ok === false,
    {
      error: readOnlyControl.error,
    }
  );
  await shot(childB, "child-b-overview");

  // -------------------------------------------------------------------------
  // 5. Live revocation while the Child page stays open
  // -------------------------------------------------------------------------
  const watcher = await childA.evaluate(
    "window.__domoluxRevokeWatch ? JSON.stringify(window.__domoluxRevokeWatch) : null"
  );
  const watcherState = watcher ? JSON.parse(watcher) : null;
  record("browser.live_refresh_module_loaded", watcherState?.loaded === true, {
    state: watcherState,
  });

  const revoke = await father.callWS({
    type: "domolux/permission/remove_entity_rule",
    user_id: state.child_a_id,
    rule_id: state.child_a_rule_id,
  });
  record("browser.father_revokes_child_a_rule", revoke.ok === true, {
    response: revoke,
  });

  // The watcher reloads the Child page; wait for the permitted light to vanish.
  let revokedLights = null;
  let reloads = 0;
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const after = await childA.evaluate(
        "JSON.stringify({ lights: Object.keys(window.__dlHass().states).filter((id) => id.startsWith('light.')).sort(), reloads: (window.__domoluxRevokeWatch || {}).reloads || 0 })"
      );
      const parsed = JSON.parse(after);
      revokedLights = parsed.lights;
      reloads = parsed.reloads;
      if (!revokedLights.includes(PERMITTED) && reloads > 0) break;
    } catch {
      // the page is reloading
    }
    await sleep(1000);
  }
  record("browser.live_revoke_child_page_refreshed", reloads >= 1, { reloads });
  record(
    "browser.live_revoke_entity_disappeared",
    Array.isArray(revokedLights) && !revokedLights.includes(PERMITTED),
    { lights: revokedLights }
  );
  await shot(childA, "child-a-after-revoke");

  await childA.waitForApp();
  const deniedAfterRevoke = await childA.callWS({
    type: "call_service",
    domain: "light",
    service: "turn_on",
    service_data: { entity_id: PERMITTED },
  });
  record(
    "browser.live_revoke_direct_call_denied",
    deniedAfterRevoke.ok === false,
    { error: deniedAfterRevoke.error }
  );

  // -------------------------------------------------------------------------
  // 6. Account switch in the same browser context
  // -------------------------------------------------------------------------
  await father.evaluate(
    "(() => { window.localStorage.clear(); window.sessionStorage.clear(); window.location.href = '/'; })()"
  );
  await sleep(3000);
  await father.login(CHILD_A.user, CHILD_A.password);
  const switchedUser = await father.user();
  record("browser.account_switch_identity", switchedUser?.name === "Child A", {
    user: switchedUser,
  });

  await father.waitFor("!!window.__dlHass()");
  const switchedStates = await father.evaluate(
    "JSON.stringify(Object.keys(window.__dlHass().states).filter((id) => id.startsWith('light.') || id.startsWith('weather.')).sort())"
  );
  const switchedList = JSON.parse(switchedStates);
  record(
    "browser.account_switch_no_father_data_left",
    switchedList.every((id) => !id.startsWith("weather.")),
    { states: switchedList }
  );

  const switchedTexts = (await father.shortTexts()).join("\n");
  record(
    "browser.account_switch_no_father_name_rendered",
    !switchedTexts.includes("E2E Father"),
    { observed_child_welcome: switchedTexts.includes("Welcome Child A") }
  );
  await shot(father, "account-switch-child-a");

  // Browser network health for the pages under test.
  const noisyPages = Object.entries(pages)
    .filter(([, page]) => page.failedRequests.length > 0)
    .map(([label, page]) => ({
      label,
      failures: page.failedRequests.slice(0, 5),
    }));
  record("browser.no_failed_page_requests", noisyPages.length === 0, {
    pages: noisyPages,
  });
} catch (err) {
  record("browser.unexpected_error", false, {
    error: String(err && err.stack ? err.stack : err),
  });
} finally {
  try {
    await chrome.close();
  } catch {
    // best effort
  }
}

process.stdout.write(
  `SUMMARY phase=browser checks=${results.length} failures=${failures} known=${knownIssues}\n`
);
process.exit(failures === 0 ? 0 : 1);
