import type { HomeAssistant } from "../types";

// ---------------------------------------------------------------------
// Strongly typed client interfaces
// ---------------------------------------------------------------------

export interface DomoluxEntityBinding {
  entity_id: string;
  required_access: "read" | "control";
  name_override?: string;
  icon_override?: string;
}

export interface DomoluxCardConfig {
  card_id: string;
  card_type: string;
  title?: string | null;
  entities: DomoluxEntityBinding[];
  options?: Record<string, unknown>;
}

export interface ViewSummary {
  view_id: string;
  view_path: string;
  title: string;
  icon: string;
  layout: string;
  card_count: number;
  updated_at: string;
}

export interface DomoluxView {
  view_id: string;
  view_path: string;
  title: string;
  icon: string;
  layout: string;
  cards: DomoluxCardConfig[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface DomoluxViewUpdatedEvent {
  action: "created" | "updated" | "deleted";
  view_id: string;
  view_path: string;
}

// ---------------------------------------------------------------------
// Typed error responses
// ---------------------------------------------------------------------

export type DomoluxViewErrorCode =
  | "unauthorized"
  | "access_denied"
  | "view_not_found"
  | "duplicate_view_path"
  | "permission_denied"
  | "father_required"
  | "invalid_input"
  | "internal_error"
  | "malformed_response";

export interface DomoluxViewError {
  code: DomoluxViewErrorCode;
  message: string;
}

function isDomoluxViewError(value: unknown): value is DomoluxViewError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    typeof (value as DomoluxViewError).code === "string" &&
    typeof (value as DomoluxViewError).message === "string"
  );
}

// ---------------------------------------------------------------------
// In-memory cache (denied views are never cached)
// ---------------------------------------------------------------------

const viewCache = new Map<string, DomoluxView>();
const summaryCache = new Map<string, ViewSummary[]>();

function invalidateViewCache(
  viewId: string | undefined,
  viewPath: string | undefined
): void {
  if (viewId) {
    viewCache.delete(viewId);
  }
  if (viewPath) {
    for (const key of viewCache.keys()) {
      const entry = viewCache.get(key);
      if (entry && entry.view_path === viewPath) {
        viewCache.delete(key);
      }
    }
  }
  summaryCache.clear();
}

// ---------------------------------------------------------------------
// Response shape validation
// ---------------------------------------------------------------------

function isValidEntityBinding(v: unknown): v is DomoluxEntityBinding {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as DomoluxEntityBinding).entity_id === "string" &&
    typeof (v as DomoluxEntityBinding).required_access === "string"
  );
}

function isValidCardConfig(v: unknown): v is DomoluxCardConfig {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as DomoluxCardConfig).card_id === "string" &&
    typeof (v as DomoluxCardConfig).card_type === "string" &&
    Array.isArray((v as DomoluxCardConfig).entities) &&
    (v as DomoluxCardConfig).entities.every(isValidEntityBinding)
  );
}

function isValidViewSummary(v: unknown): v is ViewSummary {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as ViewSummary).view_id === "string" &&
    typeof (v as ViewSummary).view_path === "string" &&
    typeof (v as ViewSummary).title === "string"
  );
}

function isValidView(v: unknown): v is DomoluxView {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as DomoluxView).view_id === "string" &&
    typeof (v as DomoluxView).view_path === "string" &&
    typeof (v as DomoluxView).title === "string" &&
    Array.isArray((v as DomoluxView).cards) &&
    (v as DomoluxView).cards.every(isValidCardConfig)
  );
}

// ---------------------------------------------------------------------
// Client helpers
// ---------------------------------------------------------------------

/**
 * List accessible Domolux Views for the authenticated user.
 * Never sends a target user_id — identity comes from hass.user.
 */
export async function listViews(
  hass: HomeAssistant
): Promise<ViewSummary[]> {
  if (!hass?.connection || typeof hass.callWS !== "function") {
    throw buildError("unauthorized", "No authenticated Home Assistant connection.");
  }
  const result = (await hass.callWS({
    type: "domolux/view/list",
  })) as { views?: unknown } | null;
  if (!result || !Array.isArray(result.views)) {
    throw buildError("malformed_response", "Backend returned malformed view list.");
  }
  const summaries: ViewSummary[] = [];
  for (const v of result.views) {
    if (isValidViewSummary(v)) {
      summaries.push(v);
    }
  }
  summaryCache.set("all", summaries);
  return summaries;
}

/**
 * Fetch a single Domolux View by view_id or view_path.
 * Denied / unauthorized views are never cached.
 */
export async function getView(
  hass: HomeAssistant,
  opts: { view_id?: string; view_path?: string }
): Promise<DomoluxView> {
  if (!hass?.connection || typeof hass.callWS !== "function") {
    throw buildError("unauthorized", "No authenticated Home Assistant connection.");
  }
  if (!opts.view_id && !opts.view_path) {
    throw buildError("invalid_input", "Must specify exactly one of 'view_id' or 'view_path'.");
  }
  if (opts.view_id && opts.view_path) {
    throw buildError("invalid_input", "Must specify exactly one of 'view_id' or 'view_path'.");
  }

  const payload: Record<string, unknown> = { type: "domolux/view/get" };
  if (opts.view_id) payload.view_id = opts.view_id;
  if (opts.view_path) payload.view_path = opts.view_path;

  const result = (await hass.callWS(payload)) as Record<string, unknown> | null;
  if (!result || typeof result !== "object") {
    throw buildError("malformed_response", "Backend returned malformed view response.");
  }

  // Propagate structured backend errors
  if (isDomoluxViewError(result)) {
    if (result.code === "access_denied" || result.code === "view_not_found") {
      throw buildError(result.code, result.message);
    }
  }

  const viewObj = result.view ?? result;
  if (!isValidView(viewObj)) {
    throw buildError("malformed_response", "Backend returned malformed view object.");
  }
  const view: DomoluxView = viewObj;

  // Cache only allowed views
  viewCache.set(view.view_id, view);
  return view;
}

/**
 * Subscribe to domolux_view_updated real-time events.
 * Filters events by target view_id when provided.
 * Returns an unsubscribe function for deterministic cleanup.
 */
export function subscribeViewUpdates(
  hass: HomeAssistant,
  opts: {
    view_id?: string;
    view_path?: string;
    onEvent: (event: DomoluxViewUpdatedEvent) => void;
  }
): () => void {
  if (!hass?.connection || typeof hass.connection.subscribeEvents !== "function") {
    throw buildError("unauthorized", "No active Home Assistant connection.");
  }

  const handler = (event: AnyEvent) => {
    const data = event?.data as DomoluxViewUpdatedEvent | undefined;
    if (!data || !data.action || !data.view_id) return;

    // Filter by target view context when provided
    if (opts.view_id && data.view_id !== opts.view_id) return;
    if (opts.view_path && data.view_path && data.view_path !== opts.view_path) return;

    // Invalidate cache on mutation events
    invalidateViewCache(data.view_id, opts.view_path);

    opts.onEvent(data);
  };

  const unsub = hass.connection.subscribeEvents(handler, "domolux_view_updated");

  // Return deterministic cleanup function
  return unsub;
}

/** Clear all in-memory cached views (useful on logout / disconnect). */
export function clearViewCache(): void {
  viewCache.clear();
  summaryCache.clear();
}

/** Expose cache size for tests */
export function _getCacheSize(): number {
  return viewCache.size;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function buildError(
  code: DomoluxViewErrorCode,
  message: string
): DomoluxViewError {
  return { code, message };
}

interface AnyEvent {
  data?: unknown;
}