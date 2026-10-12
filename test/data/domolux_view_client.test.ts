import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  listViews,
  getView,
  subscribeViewUpdates,
  clearViewCache,
  _getCacheSize,
} from "../../src/data/domolux_view_client";
import type { HomeAssistant } from "../../src/types";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const MOCK_VIEW = {
  view_id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
  view_path: "living-room",
  title: "Living Room",
  icon: "mdi:home",
  layout: "grid",
  cards: [
    {
      card_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
      card_type: "entity",
      title: "Lights",
      entities: [{ entity_id: "light.lr", required_access: "read" as const }],
      options: {},
    },
  ],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  created_by: USER_ID,
};

function createMockHass(
  options: {
    wsResponse?: unknown;
    wsReject?: boolean;
    hasWs?: boolean;
    user?: { id: string; is_admin?: boolean; is_owner?: boolean };
  } = {}
): HomeAssistant {
  const {
    wsResponse,
    wsReject = false,
    hasWs = true,
    user = { id: USER_ID, is_admin: false, is_owner: false },
  } = options;

  const mockCallWS = vi.fn().mockImplementation((msg: any) => {
    if (wsReject) {
      return Promise.reject(new Error("WebSocket failure"));
    }
    if (msg.type === "domolux/view/list") {
      return Promise.resolve(wsResponse ?? { views: [] });
    }
    if (msg.type === "domolux/view/get") {
      return Promise.resolve(wsResponse ?? MOCK_VIEW);
    }
    return Promise.resolve({});
  });

  return {
    user,
    connection: hasWs
      ? ({
          subscribeEvents: vi.fn().mockReturnValue(() => () => undefined),
        } as any)
      : undefined,
    callWS: hasWs ? mockCallWS : undefined,
  } as unknown as HomeAssistant;
}

describe("Domolux View Data Client", () => {
  beforeEach(() => {
    clearViewCache();
  });

  // --- listViews ---

  it("list success: returns ViewSummary array", async () => {
    const views = [
      {
        view_id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        view_path: "living-room",
        title: "Living Room",
        icon: "mdi:home",
        layout: "grid",
        card_count: 1,
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];
    const hass = createMockHass({ wsResponse: { views } });
    const result = await listViews(hass);
    expect(result).toHaveLength(1);
    expect(result[0].view_path).toBe("living-room");
    expect(result[0].title).toBe("Living Room");
  });

  it("list: filters out malformed summary entries", async () => {
    const hass = createMockHass({
      wsResponse: {
        views: [
          { view_id: "aaa", view_path: "ok", title: "OK" },
          null,
          "not-an-object",
          { view_id: "bbb", view_path: "also-ok", title: "Also OK" },
        ],
      },
    });
    const result = await listViews(hass);
    expect(result).toHaveLength(2);
  });

  it("list: throws unauthorized when no connection", async () => {
    const hass = createMockHass({ hasWs: false });
    await expect(listViews(hass)).rejects.toMatchObject({
      code: "unauthorized",
    });
  });

  // --- getView ---

  it("get allowed View: returns full DomoluxView", async () => {
    const hass = createMockHass({ wsResponse: MOCK_VIEW });
    const view = await getView(hass, { view_id: MOCK_VIEW.view_id });
    expect(view.view_id).toBe(MOCK_VIEW.view_id);
    expect(view.cards[0].entities[0].entity_id).toBe("light.lr");
  });

  it("get: access_denied from backend is re-thrown", async () => {
    const hass = createMockHass({
      wsResponse: { code: "access_denied", message: "Access denied" },
    });
    await expect(
      getView(hass, { view_id: "nonexistent" })
    ).rejects.toMatchObject({
      code: "access_denied",
    });
  });

  it("get: view_not_found from backend is re-thrown", async () => {
    const hass = createMockHass({
      wsResponse: { code: "view_not_found", message: "Not found" },
    });
    await expect(getView(hass, { view_path: "missing" })).rejects.toMatchObject(
      {
        code: "view_not_found",
      }
    );
  });

  it("get: malformed response throws malformed_response", async () => {
    const hass = createMockHass({ wsResponse: "not-an-object" });
    await expect(getView(hass, { view_id: "x" })).rejects.toMatchObject({
      code: "malformed_response",
    });
  });

  it("get: rejected WebSocket throws", async () => {
    const hass = createMockHass({ wsReject: true });
    try {
      await getView(hass, { view_id: "x" });
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.message).toBe("WebSocket failure");
    }
  });

  it("get: requires exactly one of view_id/view_path", async () => {
    const hass = createMockHass();
    await expect(getView(hass, {})).rejects.toMatchObject({
      code: "invalid_input",
    });
    await expect(
      getView(hass, { view_id: "x", view_path: "y" })
    ).rejects.toMatchObject({
      code: "invalid_input",
    });
  });

  // --- Caching ---

  it("caches allowed views, does not cache denied views", async () => {
    const hass = createMockHass({ wsResponse: MOCK_VIEW });
    await getView(hass, { view_id: MOCK_VIEW.view_id });
    expect(_getCacheSize()).toBe(1);

    const hass2 = createMockHass({
      wsResponse: { code: "access_denied", message: "denied" },
    });
    await expect(
      getView(hass2, { view_id: "denied-id" })
    ).rejects.toMatchObject({
      code: "access_denied",
    });
    expect(_getCacheSize()).toBe(1);
  });

  // --- no user_id injection ---

  it("no user_id injection: list does not send user_id", async () => {
    const hass = createMockHass({ wsResponse: { views: [] } });
    await listViews(hass);
    const callArgs = (hass.callWS as any).mock.calls;
    const listCall = callArgs.find(
      (c: any[]) => c[0].type === "domolux/view/list"
    );
    expect(listCall[0]).not.toHaveProperty("user_id");
  });

  it("no user_id injection: get does not send user_id", async () => {
    const hass = createMockHass({ wsResponse: MOCK_VIEW });
    await getView(hass, { view_id: MOCK_VIEW.view_id });
    const callArgs = (hass.callWS as any).mock.calls;
    const getCall = callArgs.find(
      (c: any[]) => c[0].type === "domolux/view/get"
    );
    expect(getCall[0]).not.toHaveProperty("user_id");
  });

  // --- subscription ---

  it("subscription: unsub is a function", () => {
    const hass = createMockHass();
    const onEvent = vi.fn();
    const unsub = subscribeViewUpdates(hass, { onEvent });
    expect(typeof unsub).toBe("function");
  });

  it("subscription: throws when no connection", () => {
    const hass = createMockHass({ hasWs: false });
    expect(() => subscribeViewUpdates(hass, { onEvent: vi.fn() })).toThrow();
  });

  it("no unauthorized data cached: denied views never enter cache", async () => {
    const hass = createMockHass({
      wsResponse: { code: "access_denied", message: "Denied" },
    });
    await expect(getView(hass, { view_id: "denied" })).rejects.toMatchObject({
      code: "access_denied",
    });
    expect(_getCacheSize()).toBe(0);
  });
});
