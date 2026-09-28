import { describe, it, expect, vi } from "vitest";
import {
  DomoluxRole,
  getDomoluxRole,
  isAdminUser,
  isOwnerUser,
  isFatherUser,
  hasNoDomoluxRole,
  subscribeDomoluxRole,
} from "../../src/data/domolux_roles";
import type { HomeAssistant } from "../../src/types";

const REGULAR_USER_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_USER_ID = "99999999-9999-4999-8999-999999999999";

function createMockHass(options: {
  userId?: string;
  username?: string;
  name?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  wsResponse?: any;
  wsReject?: boolean;
  hasWs?: boolean;
}): HomeAssistant {
  const {
    userId = REGULAR_USER_ID,
    username = "regular_user",
    name = "Regular User",
    isAdmin = false,
    isOwner = false,
    wsResponse,
    wsReject = false,
    hasWs = true,
  } = options;

  const mockCallWS = vi.fn().mockImplementation((msg: any) => {
    if (wsReject) {
      return Promise.reject(new Error("Unknown command 'domolux/role/get'"));
    }
    if (msg.type === "domolux/role/get") {
      return Promise.resolve(
        wsResponse || {
          user_id: userId,
          role: "user",
          is_father: false,
          father_assigned: false,
        }
      );
    }
    return Promise.resolve({});
  });

  return {
    user: {
      id: userId,
      username,
      name,
      is_admin: isAdmin,
      is_owner: isOwner,
      is_disabled: false,
    },
    connection: hasWs
      ? ({
          subscribeEvents: vi.fn().mockResolvedValue(() => undefined),
        } as any)
      : undefined,
    callWS: hasWs ? mockCallWS : undefined,
  } as unknown as HomeAssistant;
}

describe("Domolux Roles Frontend Identity API", () => {
  it("correctly identifies normal non-admin user with no special role", async () => {
    const hass = createMockHass({
      userId: REGULAR_USER_ID,
      isAdmin: false,
      isOwner: false,
      wsResponse: {
        user_id: REGULAR_USER_ID,
        role: "user",
        is_father: false,
        father_assigned: false,
      },
    });

    const info = await getDomoluxRole(hass);

    expect(info.userId).toBe(REGULAR_USER_ID);
    expect(info.role).toBe(DomoluxRole.USER);
    expect(info.isFather).toBe(false);
    expect(info.isAdmin).toBe(false);
    expect(info.isOwner).toBe(false);
    expect(info.hasNoDomoluxRole).toBe(true);
    expect(info.fatherAssigned).toBe(false);
    expect(info.available).toBe(true);

    expect(isAdminUser(hass)).toBe(false);
    expect(isOwnerUser(hass)).toBe(false);
    expect(isFatherUser(hass, info)).toBe(false);
    expect(hasNoDomoluxRole(info)).toBe(true);
  });

  it("correctly identifies active Father user", async () => {
    const hass = createMockHass({
      userId: REGULAR_USER_ID,
      isAdmin: false,
      isOwner: false,
      wsResponse: {
        user_id: REGULAR_USER_ID,
        role: "father",
        is_father: true,
        father_assigned: true,
      },
    });

    const info = await getDomoluxRole(hass);

    expect(info.userId).toBe(REGULAR_USER_ID);
    expect(info.role).toBe(DomoluxRole.FATHER);
    expect(info.isFather).toBe(true);
    expect(info.isAdmin).toBe(false);
    expect(info.isOwner).toBe(false);
    expect(info.hasNoDomoluxRole).toBe(false);
    expect(info.fatherAssigned).toBe(true);

    expect(isFatherUser(hass, info)).toBe(true);
    expect(hasNoDomoluxRole(info)).toBe(false);
  });

  it("correctly identifies Home Assistant Administrator", async () => {
    const hass = createMockHass({
      userId: ADMIN_USER_ID,
      isAdmin: true,
      isOwner: false,
      wsResponse: {
        user_id: ADMIN_USER_ID,
        role: "user",
        is_father: false,
        father_assigned: true,
      },
    });

    const info = await getDomoluxRole(hass);

    expect(info.isAdmin).toBe(true);
    expect(info.isOwner).toBe(false);
    expect(info.isFather).toBe(false);

    expect(isAdminUser(hass)).toBe(true);
    expect(isOwnerUser(hass)).toBe(false);
    expect(isFatherUser(hass, info)).toBe(false);
  });

  it("correctly identifies Home Assistant Owner", async () => {
    const hass = createMockHass({
      userId: ADMIN_USER_ID,
      isAdmin: false,
      isOwner: true,
      wsResponse: {
        user_id: ADMIN_USER_ID,
        role: "user",
        is_father: false,
        father_assigned: false,
      },
    });

    const info = await getDomoluxRole(hass);

    expect(info.isAdmin).toBe(false);
    expect(info.isOwner).toBe(true);
    expect(info.isFather).toBe(false);

    expect(isAdminUser(hass)).toBe(false);
    expect(isOwnerUser(hass)).toBe(true);
    expect(isFatherUser(hass, info)).toBe(false);
  });

  it("handles removed Father safely", async () => {
    const hass = createMockHass({
      userId: REGULAR_USER_ID,
      isAdmin: false,
      isOwner: false,
      wsResponse: {
        user_id: REGULAR_USER_ID,
        role: "user",
        is_father: false,
        father_assigned: false,
      },
    });

    const info = await getDomoluxRole(hass);

    expect(info.isFather).toBe(false);
    expect(info.fatherAssigned).toBe(false);
    expect(info.hasNoDomoluxRole).toBe(true);
  });

  it("forces fail-closed evaluation if Father user is elevated to Admin", async () => {
    // Backend reports is_father: true, but HA auth user has is_admin: true
    const hass = createMockHass({
      userId: REGULAR_USER_ID,
      username: "father_user",
      isAdmin: true,
      isOwner: false,
      wsResponse: {
        user_id: REGULAR_USER_ID,
        role: "father",
        is_father: true,
        father_assigned: true,
      },
    });

    const info = await getDomoluxRole(hass);

    // Security check must deny Father status to any user with is_admin = true
    expect(info.isFather).toBe(false);
    expect(info.role).toBe(DomoluxRole.USER);
    expect(isFatherUser(hass, info)).toBe(false);
  });

  it("handles integration unavailable safely without crashing", async () => {
    const hass = createMockHass({
      wsReject: true,
    });

    const info = await getDomoluxRole(hass);

    expect(info.available).toBe(false);
    expect(info.role).toBe(DomoluxRole.USER);
    expect(info.isFather).toBe(false);
    expect(info.hasNoDomoluxRole).toBe(true);
  });

  it("handles disconnect / restart gracefully when callWS is missing", async () => {
    const hass = createMockHass({
      hasWs: false,
    });

    const info = await getDomoluxRole(hass);

    expect(info.available).toBe(false);
    expect(info.role).toBe(DomoluxRole.USER);
    expect(info.isFather).toBe(false);
  });

  it("never infers Father from username or display name", async () => {
    // Username contains "father" and display name is "Household Father", but backend returns is_father: false
    const hass = createMockHass({
      userId: REGULAR_USER_ID,
      username: "father",
      name: "Household Father",
      wsResponse: {
        user_id: REGULAR_USER_ID,
        role: "user",
        is_father: false,
        father_assigned: false,
      },
    });

    const info = await getDomoluxRole(hass);

    expect(info.isFather).toBe(false);
    expect(info.role).toBe(DomoluxRole.USER);
  });

  it("supports real-time role change subscriptions", async () => {
    const hass = createMockHass({
      userId: REGULAR_USER_ID,
      wsResponse: {
        user_id: REGULAR_USER_ID,
        role: "father",
        is_father: true,
        father_assigned: true,
      },
    });

    const callback = vi.fn();
    const unsub = subscribeDomoluxRole(hass, callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalled();
    });

    const lastCallArg = callback.mock.calls[0][0];
    expect(lastCallArg.isFather).toBe(true);

    expect(hass.connection!.subscribeEvents).toHaveBeenCalledWith(
      expect.any(Function),
      "domolux_role_changed"
    );

    unsub();
  });
});
