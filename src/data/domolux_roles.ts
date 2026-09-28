import type { HomeAssistant } from "../types";

export enum DomoluxRole {
  FATHER = "father",
  USER = "user",
}

export interface DomoluxRoleGetResult {
  user_id: string;
  role: string;
  is_father: boolean;
  father_assigned: boolean;
}

export interface DomoluxRoleInfo {
  userId: string | null;
  role: DomoluxRole;
  isFather: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  hasNoDomoluxRole: boolean;
  fatherAssigned: boolean;
  available: boolean;
}

/**
 * Fetch Domolux role status for the currently authenticated Home Assistant user.
 *
 * SECURITY & IDENTITY GUARANTEES:
 * 1. Uses authenticated identity strictly from `hass.user.id`.
 * 2. NEVER infers role from username or display name.
 * 3. Queries backend WebSocket endpoint `domolux/role/get`.
 * 4. Fails safe if integration is unavailable, disconnected, or backend errors occur.
 * 5. Strictly enforces non-admin requirement: if user is admin/owner, isFather is false.
 */
export async function getDomoluxRole(hass: HomeAssistant): Promise<DomoluxRoleInfo> {
  const user = hass?.user;
  const userId = user?.id || null;
  const isAdmin = Boolean(user?.is_admin);
  const isOwner = Boolean(user?.is_owner);

  if (!userId || !hass?.connection || typeof hass?.callWS !== "function") {
    return {
      userId,
      role: DomoluxRole.USER,
      isFather: false,
      isAdmin,
      isOwner,
      hasNoDomoluxRole: true,
      fatherAssigned: false,
      available: false,
    };
  }

  try {
    const result = (await hass.callWS({
      type: "domolux/role/get",
    })) as DomoluxRoleGetResult;

    // Security Invariant: Father role can NEVER belong to an Admin or Owner user.
    // If backend reports is_father: true but HA frontend user has is_admin / is_owner,
    // client fail-closed check forces isFather to false.
    const isFather = Boolean(result?.is_father) && !isAdmin && !isOwner;
    const role = isFather ? DomoluxRole.FATHER : DomoluxRole.USER;

    return {
      userId,
      role,
      isFather,
      isAdmin,
      isOwner,
      hasNoDomoluxRole: !isFather,
      fatherAssigned: Boolean(result?.father_assigned),
      available: true,
    };
  } catch (_err) {
    // Graceful fallback when domolux_roles integration is unavailable or throws error
    return {
      userId,
      role: DomoluxRole.USER,
      isFather: false,
      isAdmin,
      isOwner,
      hasNoDomoluxRole: true,
      fatherAssigned: false,
      available: false,
    };
  }
}

/**
 * Check if the current authenticated user is an Administrator in Home Assistant.
 */
export function isAdminUser(hass: HomeAssistant): boolean {
  return Boolean(hass?.user?.is_admin);
}

/**
 * Check if the current authenticated user is an Owner in Home Assistant.
 */
export function isOwnerUser(hass: HomeAssistant): boolean {
  return Boolean(hass?.user?.is_owner);
}

/**
 * Check if the current user is active Father (must NOT be admin/owner).
 */
export function isFatherUser(hass: HomeAssistant, roleInfo?: DomoluxRoleInfo): boolean {
  if (isAdminUser(hass) || isOwnerUser(hass)) {
    return false;
  }
  if (roleInfo) {
    return roleInfo.isFather;
  }
  return false;
}

/**
 * Check if current user has no special Domolux role (standard user).
 */
export function hasNoDomoluxRole(roleInfo?: DomoluxRoleInfo): boolean {
  if (!roleInfo) {
    return true;
  }
  return !roleInfo.isFather;
}

/**
 * Subscribe to real-time Domolux role changes on the event bus.
 * Handles role updates without requiring client-side assumptions.
 */
export function subscribeDomoluxRole(
  hass: HomeAssistant,
  callback: (roleInfo: DomoluxRoleInfo) => void
): () => void {
  let unsub: (() => void) | undefined;

  const update = async () => {
    const roleInfo = await getDomoluxRole(hass);
    callback(roleInfo);
  };

  if (hass?.connection && typeof hass.connection.subscribeEvents === "function") {
    hass.connection
      .subscribeEvents((_event: any) => {
        update();
      }, "domolux_role_changed")
      .then((unsubFunc) => {
        unsub = unsubFunc;
      })
      .catch(() => {
        // Ignore subscription errors
      });
  }

  // Initial fetch
  update();

  return () => {
    if (unsub) {
      unsub();
    }
  };
}
