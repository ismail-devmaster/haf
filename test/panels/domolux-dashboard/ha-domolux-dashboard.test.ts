import { describe, it, expect, vi, beforeEach } from "vitest";

import "../../../src/panels/domolux-dashboard/ha-domolux-dashboard";
import type { HaDomoluxDashboard } from "../../../src/panels/domolux-dashboard/ha-domolux-dashboard";
import type { HomeAssistant } from "../../../src/types";

function createMockHass(options: {
  userId?: string;
  allViewsAllowed?: boolean;
  defaultAccessLevel?: "none" | "read" | "control";
  viewRules?: Record<string, "allow" | "deny">;
  wsError?: any;
}): HomeAssistant {
  const {
    userId = "user-123",
    allViewsAllowed = false,
    defaultAccessLevel = "none",
    viewRules = {},
    wsError = null,
  } = options;

  let eventCallback: ((event: any) => void) | undefined;

  const mockCallWS = vi.fn().mockImplementation((msg: any) => {
    if (wsError) {
      return Promise.reject(wsError);
    }
    if (msg.type === "domolux/view/get") {
      return Promise.resolve({
        view: {
          view_id: "v-1",
          view_path: "other-view",
          title: "Other View",
          icon: "mdi:lightbulb",
          layout: "grid",
          cards: [{ card_id: "c1", card_type: "entities", title: "Test", entities: [] }],
          created_at: "2026-10-06T00:00:00Z",
          updated_at: "2026-10-06T00:00:00Z",
          created_by: "user-123",
        },
      });
    }
    if (msg.type === "domolux/view/get") {
      return Promise.resolve({
        view: {
          view_id: "v-1",
          view_path: "other-view",
          title: "Other View",
          icon: "mdi:lightbulb",
          layout: "grid",
          cards: [{ card_id: "c1", card_type: "entities", title: "Test", entities: [] }],
          created_at: "2026-10-06T00:00:00Z",
          updated_at: "2026-10-06T00:00:00Z",
          created_by: "user-123",
        },
      });
    }
    if (msg.type === "domolux/permission/my_views") {
      return Promise.resolve({
        user_id: userId,
        all_views_allowed: allViewsAllowed,
        default_access_level: defaultAccessLevel,
        view_rules: viewRules,
      });
    }
    return Promise.resolve({});
  });

  const subscribeEvents = vi.fn().mockImplementation((cb: (event: any) => void, eventType: string) => {
    if (eventType === "domolux_permissions_updated") {
      eventCallback = cb;
    }
    return Promise.resolve(() => {
      eventCallback = undefined;
    });
  });

  return {
    user: {
      id: userId,
      username: "test_user",
      name: "Test User",
      is_admin: false,
      is_owner: false,
      is_disabled: false,
    },
    localize: (key: string) => key,
    connection: {
      subscribeEvents,
    } as any,
    callWS: mockCallWS,
    _triggerPermissionEvent: (targetUserId?: string) => {
      if (eventCallback) {
        eventCallback({ data: { user_id: targetUserId || userId } });
      }
    },
  } as unknown as HomeAssistant & { _triggerPermissionEvent: (targetUserId?: string) => void };
}

describe("ha-domolux-dashboard component", () => {
  let element: HaDomoluxDashboard;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("ha-domolux-dashboard");
    element.innerHTML = "<p id='child-content'>Secret Dashboard Content</p>";
    document.body.appendChild(element);
  });

  it("renders slotted content when all_views_allowed is true (Father/Admin/Owner)", async () => {
    const hass = createMockHass({
      allViewsAllowed: true,
    });
    element.hass = hass;

    await element.updateComplete;
    // Wait for async permission subscription resolution
    await new Promise((r) => setTimeout(r, 10));
    await element.updateComplete;

    const shadowRoot = element.shadowRoot!;
    expect(shadowRoot.querySelector(".dashboard-content")).not.toBeNull();
    expect(shadowRoot.querySelector(".access-denied-card")).toBeNull();
  });

  it("renders Access Denied banner when all_views_allowed is false and default access is none", async () => {
    const hass = createMockHass({
      allViewsAllowed: false,
      defaultAccessLevel: "none",
      viewRules: {},
    });
    element.hass = hass;

    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
    await element.updateComplete;

    const shadowRoot = element.shadowRoot!;
    expect(shadowRoot.querySelector(".access-denied-card")).not.toBeNull();
    expect(shadowRoot.textContent).toContain("Access Denied / تم رفض الوصول");
    expect(shadowRoot.querySelector(".dashboard-content")).toBeNull();
  });

  it("allows access when explicit view rule is 'allow'", async () => {
    element.viewPath = "kitchen-view";
    const hass = createMockHass({
      allViewsAllowed: false,
      defaultAccessLevel: "none",
      viewRules: {
        "kitchen-view": "allow",
      },
    });
    element.hass = hass;

    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
    await element.updateComplete;

    const shadowRoot = element.shadowRoot!;
    expect(shadowRoot.querySelector(".dashboard-content")).not.toBeNull();
    expect(shadowRoot.querySelector(".access-denied-card")).toBeNull();
  });

  it("denies access when explicit view rule is 'deny' even if default access level is read", async () => {
    element.viewPath = "secret-view";
    const hass = createMockHass({
      allViewsAllowed: false,
      defaultAccessLevel: "read",
      viewRules: {
        "secret-view": "deny",
      },
    });
    element.hass = hass;

    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
    await element.updateComplete;

    const shadowRoot = element.shadowRoot!;
    expect(shadowRoot.querySelector(".access-denied-card")).not.toBeNull();
    expect(shadowRoot.querySelector(".dashboard-content")).toBeNull();
  });

  it("falls back to default_access_level when no explicit view rule exists", async () => {
    element.viewPath = "other-view";
    const hass = createMockHass({
      allViewsAllowed: false,
      defaultAccessLevel: "read",
      viewRules: {},
    });
    element.hass = hass;

    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
    await element.updateComplete;

    const shadowRoot = element.shadowRoot!;
    expect(shadowRoot.querySelector(".dashboard-content")).not.toBeNull();
    expect(shadowRoot.querySelector(".access-denied-card")).toBeNull();
  });

  it("instantly revokes access and unmounts dashboard DOM on real-time permission event", async () => {
    let currentResponse = {
      allViewsAllowed: false,
      defaultAccessLevel: "read" as const,
      viewRules: {} as Record<string, "allow" | "deny">,
    };

    const hass = createMockHass(currentResponse);
    element.hass = hass;

    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 10));
    await element.updateComplete;

    // Initially allowed via default_access_level = "read"
    expect(element.shadowRoot!.querySelector(".dashboard-content")).not.toBeNull();

    // Revoke access on server side
    (hass.callWS as any).mockImplementation((msg: any) => {
      if (msg.type === "domolux/view/get") {
      return Promise.resolve({
        view: {
          view_id: "v-1",
          view_path: "other-view",
          title: "Other View",
          icon: "mdi:lightbulb",
          layout: "grid",
          cards: [{ card_id: "c1", card_type: "entities", title: "Test", entities: [] }],
          created_at: "2026-10-06T00:00:00Z",
          updated_at: "2026-10-06T00:00:00Z",
          created_by: "user-123",
        },
      });
    }
    if (msg.type === "domolux/permission/my_views") {
        return Promise.resolve({
          user_id: "user-123",
          all_views_allowed: false,
          default_access_level: "none",
          view_rules: {},
        });
      }
      return Promise.resolve({});
    });

    // Trigger bus event
    (hass as any)._triggerPermissionEvent("user-123");

    await new Promise((r) => setTimeout(r, 10));
    await element.updateComplete;

    // Verify DOM was instantly unmounted and replaced with access denied card
    const shadowRoot = element.shadowRoot!;
    expect(shadowRoot.querySelector(".dashboard-content")).toBeNull();
    expect(shadowRoot.querySelector(".access-denied-card")).not.toBeNull();
  });
});
