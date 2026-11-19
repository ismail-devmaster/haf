import { describe, it, expect, vi, beforeEach } from "vitest";

import "../../../../src/panels/config/domolux-roles/ha-domolux-family-manager";
import type { HaDomoluxFamilyManager } from "../../../../src/panels/config/domolux-roles/ha-domolux-family-manager";
import type { HomeAssistant } from "../../../../src/types";

// Polyfill ElementInternals.prototype.setValidity and validity for WebAwesome in JSDOM environment
if (typeof ElementInternals !== "undefined") {
  if (
    !Object.getOwnPropertyDescriptor(ElementInternals.prototype, "validity")
  ) {
    Object.defineProperty(ElementInternals.prototype, "validity", {
      get() {
        return (
          (this as any)._validity || {
            valid: true,
            badInput: false,
            customError: false,
            patternMismatch: false,
            rangeOverflow: false,
            rangeUnderflow: false,
            stepMismatch: false,
            tooLong: false,
            tooShort: false,
            typeMismatch: false,
            valueMissing: false,
          }
        );
      },
      set(val) {
        (this as any)._validity = val;
      },
      configurable: true,
    });
  }

  if (!ElementInternals.prototype.setValidity) {
    ElementInternals.prototype.setValidity = function (flags?: any) {
      (this as any)._validity = {
        valid:
          !flags ||
          Object.keys(flags).length === 0 ||
          !Object.values(flags).some(Boolean),
        customError: Boolean(flags?.customError),
        badInput: Boolean(flags?.badInput),
        patternMismatch: Boolean(flags?.patternMismatch),
        rangeOverflow: Boolean(flags?.rangeOverflow),
        rangeUnderflow: Boolean(flags?.rangeUnderflow),
        stepMismatch: Boolean(flags?.stepMismatch),
        tooLong: Boolean(flags?.tooLong),
        tooShort: Boolean(flags?.tooShort),
        typeMismatch: Boolean(flags?.typeMismatch),
        valueMissing: Boolean(flags?.valueMissing),
      };
    };
  }
}

vi.mock("../../../../src/dialogs/generic/show-dialog-box", () => ({
  showConfirmationDialog: vi.fn().mockResolvedValue(true),
}));

const FATHER_USER_ID = "11111111-1111-4111-8111-111111111111";
const CHILD_USER_ID = "22222222-2222-4222-8222-222222222222";
const ADMIN_USER_ID = "99999999-9999-4999-8999-999999999999";
const OWNER_USER_ID = "88888888-8888-4888-8888-888888888888";

function createMockHass(options: {
  userId?: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  isFather?: boolean;
  familyMembers?: any[];
  wsError?: any;
}): HomeAssistant {
  const {
    userId = FATHER_USER_ID,
    isAdmin = false,
    isOwner = false,
    isFather = true,
    familyMembers = [
      {
        user_id: CHILD_USER_ID,
        display_name: "Child One",
        username: "child1",
        status: "ACTIVE",
        managed_group_id: "group_child1",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    wsError = null,
  } = options;

  const currentPermissions: any = {
    user_id: CHILD_USER_ID,
    default_access_level: "none",
    entity_rules: {
      rule_1: {
        rule_id: "rule_1",
        target_type: "entity",
        target_id: "light.living_room",
        access_level: "read",
      },
    },
    view_rules: {
      "/lovelace/kitchen": {
        view_path: "/lovelace/kitchen",
        effect: "deny",
        access_level: "none",
      },
    },
  };

  const mockCallWS = vi.fn().mockImplementation((msg: any) => {
    if (wsError) {
      return Promise.reject(wsError);
    }
    if (msg.type === "domolux/role/get") {
      return Promise.resolve({
        user_id: userId,
        role: isFather ? "father" : "user",
        is_father: isFather,
        father_assigned: true,
      });
    }
    if (msg.type === "domolux/family/list") {
      return Promise.resolve(familyMembers);
    }
    if (msg.type === "domolux/catalog") {
      return Promise.resolve({
        catalog: {
          devices: [
            {
              device_id: "dev_shade",
              target_id: "dev_shade",
              target_type: "device",
              name: "Hallway Roller Shade",
              area_id: "hallway",
              area_name: "Hallway",
              domain: "cover",
              icon: "mdi:window-shutter",
              entity_count: 1,
              is_multi_entity: false,
              capabilities: ["read", "control"],
              channels: [
                {
                  entity_id: "cover.zm108m",
                  name: "Hallway Roller Shade",
                  domain: "cover",
                  capabilities: ["read", "control"],
                },
              ],
              primary_entity_id: "cover.zm108m",
            },
            {
              device_id: "dev_pn16",
              target_id: "dev_pn16",
              target_type: "device",
              name: "SONOFF PN16",
              area_id: "utility",
              area_name: "Utility Room",
              domain: "switch",
              icon: "mdi:toggle-switch",
              entity_count: 16,
              is_multi_entity: true,
              capabilities: ["read", "control"],
              channels: [
                { entity_id: "switch.pn16_l1", name: "Channel 1", domain: "switch", capabilities: ["read", "control"] },
                { entity_id: "switch.pn16_l2", name: "Channel 2", domain: "switch", capabilities: ["read", "control"] },
                { entity_id: "switch.pn16_l3", name: "Channel 3", domain: "switch", capabilities: ["read", "control"] },
              ],
              primary_entity_id: "switch.pn16_l1",
            },
          ],
          household_devices: [],
          entities: [],
          dashboards: [
            {
              dashboard_id: "lovelace",
              title: "Home Assistant Overview",
              url_path: "lovelace",
              views: [
                {
                  view_id: "main",
                  view_path: "main",
                  title: "Main View",
                  entities: ["cover.zm108m", "switch.pn16_l3"],
                },
              ],
            },
          ],
        },
      });
    }
    if (msg.type === "domolux/family/create") {
      return Promise.resolve({
        success: true,
        family_member: {
          user_id: "newly-created-user-id",
          display_name: msg.display_name,
          username: msg.username,
          status: "ACTIVE",
        },
      });
    }
    if (msg.type === "domolux/family/disable") {
      return Promise.resolve({
        success: true,
        user_id: msg.user_id,
        status: "SUSPENDED_DISABLED",
      });
    }
    if (msg.type === "domolux/family/enable") {
      return Promise.resolve({
        success: true,
        user_id: msg.user_id,
        status: "ACTIVE",
      });
    }
    if (msg.type === "domolux/family/change_password") {
      return Promise.resolve({ success: true, user_id: msg.user_id });
    }
    if (msg.type === "domolux/family/delete") {
      return Promise.resolve({ success: true, user_id: msg.user_id });
    }
    if (msg.type === "domolux/permission/get") {
      return Promise.resolve(JSON.parse(JSON.stringify(currentPermissions)));
    }
    if (msg.type === "domolux/permission/set_default_level") {
      currentPermissions.default_access_level = msg.default_access_level;
      return Promise.resolve({
        success: true,
        permissions: JSON.parse(JSON.stringify(currentPermissions)),
      });
    }
    if (msg.type === "domolux/permission/set_entity_rule") {
      const existing = Object.values(currentPermissions.entity_rules).find(
        (r: any) => r.target_type === msg.target_type && r.target_id === msg.target_id
      ) as any;
      const ruleId = msg.rule_id || existing?.rule_id || `rule_${msg.target_type}_${Date.now()}`;
      for (const k of Object.keys(currentPermissions.entity_rules)) {
        const r = currentPermissions.entity_rules[k];
        if ((r.target_type === msg.target_type && r.target_id === msg.target_id) || k === ruleId) {
          delete currentPermissions.entity_rules[k];
        }
      }
      currentPermissions.entity_rules[ruleId] = {
        rule_id: ruleId,
        target_type: msg.target_type,
        target_id: msg.target_id,
        access_level: msg.access_level,
      };
      return Promise.resolve({
        success: true,
        rule: currentPermissions.entity_rules[ruleId],
        permissions: JSON.parse(JSON.stringify(currentPermissions)),
      });
    }
    if (msg.type === "domolux/permission/remove_entity_rule") {
      delete currentPermissions.entity_rules[msg.rule_id];
      return Promise.resolve({
        success: true,
        permissions: JSON.parse(JSON.stringify(currentPermissions)),
      });
    }
    if (msg.type === "domolux/permission/set_view_rule") {
      currentPermissions.view_rules[msg.view_path] = {
        view_path: msg.view_path,
        effect: msg.effect,
        access_level: msg.access_level || (msg.effect === "allow" ? "control" : "none"),
      };
      return Promise.resolve({
        success: true,
        rule: currentPermissions.view_rules[msg.view_path],
        permissions: JSON.parse(JSON.stringify(currentPermissions)),
      });
    }
    if (msg.type === "domolux/permission/remove_view_rule") {
      delete currentPermissions.view_rules[msg.view_path];
      return Promise.resolve({
        success: true,
        permissions: JSON.parse(JSON.stringify(currentPermissions)),
      });
    }
    if (msg.type === "domolux/permission/reset") {
      currentPermissions.default_access_level = "none";
      currentPermissions.entity_rules = {};
      currentPermissions.view_rules = {};
      return Promise.resolve({
        success: true,
        permissions: JSON.parse(JSON.stringify(currentPermissions)),
      });
    }
    if (msg.type === "domolux/permission/evaluate") {
      return Promise.resolve({
        user_id: msg.user_id,
        target_id: msg.target_id,
        access_level: "control",
        granted: true,
        matching_rule_type: "entity",
        matching_rule_id: "rule_1",
      });
    }
    return Promise.resolve({});
  });

  return {
    user: {
      id: userId,
      username: isFather
        ? "father_user"
        : isAdmin
          ? "admin_user"
          : "owner_user",
      name: isFather ? "Father User" : isAdmin ? "Admin User" : "Owner User",
      is_admin: isAdmin,
      is_owner: isOwner,
      is_disabled: false,
    },
    localize: (key: string) => key,
    connection: {
      subscribeEvents: vi.fn().mockResolvedValue(() => undefined),
    } as any,
    callWS: mockCallWS,
  } as unknown as HomeAssistant;
}

describe("ha-domolux-family-manager component", () => {
  let element: HaDomoluxFamilyManager;

  beforeEach(() => {
    document.body.innerHTML = "";
    element = document.createElement("ha-domolux-family-manager");
    document.body.appendChild(element);
  });

  describe("Father Authorization", () => {
    it("renders family manager dashboard for authenticated Father user", async () => {
      const hass = createMockHass({ isFather: true, isAdmin: false });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      expect((element as any)._isFather).toBe(true);
      expect((element as any)._familyMembers.length).toBe(1);

      const shadowRoot = element.shadowRoot!;
      expect(shadowRoot.textContent).toContain("Domolux Family Manager");
      expect(shadowRoot.textContent).toContain("Child One");
      expect(shadowRoot.textContent).toContain("@child1");
      expect(shadowRoot.textContent).toContain("Active / نشط");
      expect(
        shadowRoot.querySelector("ha-alert[title='Access Denied']")
      ).toBeNull();
    });

    it("renders Access Denied warning banner for non-Father Owner user", async () => {
      element.hass = createMockHass({
        userId: OWNER_USER_ID,
        isFather: false,
        isAdmin: false,
        isOwner: true,
      });

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      expect((element as any)._isFather).toBe(false);

      const shadowRoot = element.shadowRoot!;
      const alertEl = shadowRoot.querySelector("ha-alert");
      expect(alertEl).not.toBeNull();
      expect(alertEl?.getAttribute("title")).toBe("Access Denied");
      expect(shadowRoot.textContent).toContain(
        "Father privilege required to view or manage family members."
      );
      expect(shadowRoot.querySelector("table")).toBeNull();
    });

    it("renders Access Denied warning banner for non-Father Admin user", async () => {
      element.hass = createMockHass({
        userId: ADMIN_USER_ID,
        isFather: false,
        isAdmin: true,
      });

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      expect((element as any)._isFather).toBe(false);

      const shadowRoot = element.shadowRoot!;
      const alertEl = shadowRoot.querySelector("ha-alert");
      expect(alertEl).not.toBeNull();
      expect(alertEl?.getAttribute("title")).toBe("Access Denied");
      expect(shadowRoot.querySelector("table")).toBeNull();
    });

    it("renders Access Denied warning banner for regular non-Father user", async () => {
      element.hass = createMockHass({
        isFather: false,
        isAdmin: false,
        isOwner: false,
      });

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      expect((element as any)._isFather).toBe(false);

      const shadowRoot = element.shadowRoot!;
      const alertEl = shadowRoot.querySelector("ha-alert");
      expect(alertEl).not.toBeNull();
      expect(alertEl?.getAttribute("title")).toBe("Access Denied");
      expect(shadowRoot.querySelector("table")).toBeNull();
    });
  });

  describe("Security & Data Handling", () => {
    it("ensures zero password or credential leakages in rendered HTML output", async () => {
      element.hass = createMockHass({ isFather: true });

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      // Set and clear password inputs
      (element as any)._createPassword = "SecretUserPassword123!";
      (element as any)._newPassword = "SecretNewPassword456!";
      await element.updateComplete;

      const html = element.shadowRoot!.innerHTML;
      expect(html).not.toContain("SecretUserPassword123!");
      expect(html).not.toContain("SecretNewPassword456!");
      expect(html).not.toMatch(/secret/i);
      expect(html).not.toMatch(/token/i);
    });

    it("handles structured backend error codes gracefully", async () => {
      element.hass = createMockHass({ isFather: true });

      // Test structured backend error parsing
      const errFather = (element as any)._parseErrorMessage(
        { code: "father_required" },
        "Default"
      );
      expect(errFather).toContain("Father role required");

      const errDup = (element as any)._parseErrorMessage(
        {
          code: "duplicate_username",
          message: "Username 'child1' already exists in Home Assistant.",
        },
        "Default"
      );
      expect(errDup).toBe(
        "Username 'child1' already exists in Home Assistant."
      );

      const errAdmin = (element as any)._parseErrorMessage(
        { code: "cannot_target_admin" },
        "Default"
      );
      expect(errAdmin).toContain("Cannot target Administrator account");

      const errOwner = (element as any)._parseErrorMessage(
        { code: "cannot_target_owner" },
        "Default"
      );
      expect(errOwner).toContain("Cannot target Owner account");

      const errTargetFather = (element as any)._parseErrorMessage(
        { code: "cannot_target_father" },
        "Default"
      );
      expect(errTargetFather).toContain("Cannot target Father account");
    });
  });

  describe("Family CRUD Operations", () => {
    it("handles member creation with client validation and secret zeroization", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      // 1. Open create dialog
      (element as any)._openCreateDialog();
      await element.updateComplete;

      expect((element as any)._showCreateDialog).toBe(true);

      // 2. Test input validation (short password)
      (element as any)._createDisplayName = "New Child";
      (element as any)._createUsername = "newchild";
      (element as any)._createPassword = "short";

      await (element as any)._handleCreateMember();
      expect((element as any)._error).toBe(
        "Password must be at least 8 characters long."
      );

      // 3. Valid submission
      (element as any)._createPassword = "ValidPassword123!";
      await (element as any)._handleCreateMember();

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/family/create",
          display_name: "New Child",
          username: "newchild",
          password: "ValidPassword123!",
        })
      );

      // Verify secret zeroization
      expect((element as any)._createPassword).toBe("");
      expect((element as any)._showCreateDialog).toBe(false);
      expect((element as any)._success).toContain("created successfully");
    });

    it("handles disable and enable member status toggles", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      expect((element as any)._familyMembers.length).toBeGreaterThan(0);
      const activeMember = (element as any)._familyMembers[0];
      expect(activeMember.status).toBe("ACTIVE");

      // 1. Disable active member
      await (element as any)._handleToggleStatus(activeMember);
      expect(hass.callWS).toHaveBeenCalledWith({
        type: "domolux/family/disable",
        user_id: CHILD_USER_ID,
      });
      expect((element as any)._success).toContain("disabled successfully");

      // 2. Enable suspended member - update internal state first
      (element as any)._familyMembers[0].status = "SUSPENDED_DISABLED";
      const suspendedMember = (element as any)._familyMembers[0];

      await (element as any)._handleToggleStatus(suspendedMember);

      expect(hass.callWS).toHaveBeenCalledWith({
        type: "domolux/family/enable",
        user_id: CHILD_USER_ID,
      });

      expect((element as any)._success).toContain("enabled successfully");
    });

    it("handles delete member with confirmation dialog", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];

      // 1. Open delete dialog
      (element as any)._openDeleteDialog(member);
      await element.updateComplete;

      expect((element as any)._showDeleteDialog).toBe(true);
      expect((element as any)._selectedUserForDelete).toEqual(member);

      // 2. Confirm deletion
      await (element as any)._handleConfirmDeleteMember();

      expect(hass.callWS).toHaveBeenCalledWith({
        type: "domolux/family/delete",
        user_id: CHILD_USER_ID,
      });

      expect((element as any)._showDeleteDialog).toBe(false);
      expect((element as any)._selectedUserForDelete).toBe(null);
      expect((element as any)._success).toContain("deleted successfully");
    });

    it("handles delete member dialog cancel/close", async () => {
      element.hass = createMockHass({ isFather: true });

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];

      // Open delete dialog
      (element as any)._openDeleteDialog(member);
      await element.updateComplete;

      expect((element as any)._showDeleteDialog).toBe(true);

      // Close dialog
      (element as any)._closeDeleteDialog();

      expect((element as any)._showDeleteDialog).toBe(false);
      expect((element as any)._selectedUserForDelete).toBe(null);
    });
  });

  describe("Password Management Flow", () => {
    it("handles password change with validation and zeroization", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];

      // Open password dialog
      (element as any)._openPasswordDialog(member);
      await element.updateComplete;

      expect((element as any)._showPasswordDialog).toBe(true);
      expect((element as any)._selectedUserForPassword).toEqual(member);

      // Test short password validation
      (element as any)._newPassword = "short";
      await (element as any)._handleChangePassword();
      expect((element as any)._error).toBe(
        "New password must be at least 8 characters long."
      );

      // Reset error and set valid password
      (element as any)._error = null;
      (element as any)._newPassword = "NewSecurePassword123!";

      await (element as any)._handleChangePassword();

      expect(hass.callWS).toHaveBeenCalledWith({
        type: "domolux/family/change_password",
        user_id: CHILD_USER_ID,
        new_password: "NewSecurePassword123!",
      });

      expect((element as any)._newPassword).toBe("");
      expect((element as any)._showPasswordDialog).toBe(false);
      expect((element as any)._success).toContain(
        "Password changed successfully"
      );
    });

    it("handles password dialog cancel/close", async () => {
      element.hass = createMockHass({ isFather: true });

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      (element as any)._openPasswordDialog(member);
      await element.updateComplete;

      expect((element as any)._showPasswordDialog).toBe(true);

      // Close dialog without password change
      (element as any)._closePasswordDialog();

      expect((element as any)._showPasswordDialog).toBe(false);
      expect((element as any)._selectedUserForPassword).toBe(null);
      expect((element as any)._newPassword).toBe("");
    });
  });

  describe("Create Member Dialog Flow", () => {
    it("handles create member dialog cancel/close", async () => {
      element.hass = createMockHass({ isFather: true });

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      // Open create dialog
      (element as any)._openCreateDialog();
      await element.updateComplete;

      expect((element as any)._showCreateDialog).toBe(true);

      // Close dialog
      (element as any)._closeCreateDialog();

      expect((element as any)._showCreateDialog).toBe(false);
      expect((element as any)._createPassword).toBe("");
    });
  });

  describe("Phase 3: Permission Management", () => {
    it("opens permission dialog and loads permissions for a family member", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];

      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      expect((element as any)._showPermissionDialog).toBe(true);
      expect((element as any)._selectedUserForPermissions).toEqual(member);
      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/get",
          user_id: CHILD_USER_ID,
        })
      );

      const perms = (element as any)._userPermissionSet;
      expect(perms).not.toBeNull();
      expect(perms.default_access_level).toBe("none");
      expect(Object.keys(perms.entity_rules).length).toBe(1);
    });

    it("closes permission dialog and resets permission state", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      expect((element as any)._showPermissionDialog).toBe(true);

      (element as any)._closePermissionDialog();
      await element.updateComplete;

      expect((element as any)._showPermissionDialog).toBe(false);
      expect((element as any)._selectedUserForPermissions).toBeNull();
      expect((element as any)._userPermissionSet).toBeNull();
    });

    it("sets default access level for a family member", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._newDefaultAccessLevel = "read";

      await (element as any)._handleSetDefaultAccessLevel();

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_default_level",
          user_id: CHILD_USER_ID,
          default_access_level: "read",
        })
      );

      expect((element as any)._success).toContain(
        "Default access level updated"
      );
    });

    it("validates that empty default access level is rejected", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._newDefaultAccessLevel = "";

      await (element as any)._handleSetDefaultAccessLevel();

      expect((element as any)._error).toBeTruthy();
      expect(hass.callWS).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "domolux/permission/set_default_level" })
      );
    });

    it("adds an entity permission rule for a family member", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._newRuleTargetType = "entity";
      (element as any)._newRuleTargetId = "switch.bedroom";
      (element as any)._newRuleAccessLevel = "control";

      await (element as any)._handleAddEntityRule();

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          user_id: CHILD_USER_ID,
          target_type: "entity",
          target_id: "switch.bedroom",
          access_level: "control",
        })
      );

      expect((element as any)._success).toContain("Entity permission rule added");
      expect((element as any)._newRuleTargetId).toBe("");
    });

    it("validates empty target_id for entity rule", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._newRuleTargetType = "entity";
      (element as any)._newRuleTargetId = "";
      (element as any)._newRuleAccessLevel = "control";

      await (element as any)._handleAddEntityRule();

      expect((element as any)._error).toBeTruthy();
      expect(hass.callWS).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "domolux/permission/set_entity_rule" })
      );
    });

    it("removes an entity permission rule", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      await (element as any)._handleRemoveEntityRule("rule_1");

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/remove_entity_rule",
          user_id: CHILD_USER_ID,
          rule_id: "rule_1",
        })
      );

      expect((element as any)._success).toContain(
        "Entity permission rule removed"
      );
    });

    it("adds a view permission rule for a family member", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._newViewPath = "/lovelace/main";
      (element as any)._newViewEffect = "allow";

      await (element as any)._handleAddViewRule();

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_view_rule",
          user_id: CHILD_USER_ID,
          view_path: "/lovelace/main",
          effect: "allow",
        })
      );

      expect((element as any)._success).toContain("View permission rule added");
      expect((element as any)._newViewPath).toBe("");
    });

    it("validates empty view_path for view rule", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._newViewPath = "";
      (element as any)._newViewEffect = "allow";

      await (element as any)._handleAddViewRule();

      expect((element as any)._error).toBeTruthy();
      expect(hass.callWS).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "domolux/permission/set_view_rule" })
      );
    });

    it("removes a view permission rule", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      await (element as any)._handleRemoveViewRule("/lovelace/kitchen");

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/remove_view_rule",
          user_id: CHILD_USER_ID,
          view_path: "/lovelace/kitchen",
        })
      );

      expect((element as any)._success).toContain(
        "View permission rule removed"
      );
    });

    it("resets all permissions to default state", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      await (element as any)._handleResetPermissions();

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/reset",
          user_id: CHILD_USER_ID,
        })
      );

      expect((element as any)._success).toContain(
        "User permissions reset"
      );

      const perms = (element as any)._userPermissionSet;
      expect(perms.entity_rules).toEqual({});
      expect(perms.view_rules).toEqual({});
    });

    it("evaluates effective permission access level for entity", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._evalTargetType = "entity";
      (element as any)._evalTargetId = "light.living_room";

      await (element as any)._handleEvaluatePermission();

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/evaluate",
          user_id: CHILD_USER_ID,
          target_type: "entity",
          target_id: "light.living_room",
        })
      );

      const evalResult = (element as any)._evalResult;
      expect(evalResult).not.toBeNull();
      expect(evalResult.granted).toBe(true);
      expect(evalResult.access_level).toBe("control");
    });

    it("validates empty target_id before evaluating permission", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      (element as any)._evalTargetType = "entity";
      (element as any)._evalTargetId = "";

      await (element as any)._handleEvaluatePermission();

      expect((element as any)._error).toBeTruthy();
      expect(hass.callWS).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: "domolux/permission/evaluate" })
      );
    });

    it("does not open permission dialog if not Father", async () => {
      const hass = createMockHass({ isFather: false, isAdmin: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      expect((element as any)._isFather).toBe(false);

      const fakeMember = {
        user_id: CHILD_USER_ID,
        display_name: "Child",
        username: "child",
        status: "ACTIVE",
      };

      await (element as any)._openPermissionDialog(fakeMember);
      await element.updateComplete;

      expect((element as any)._showPermissionDialog).toBe(false);
    });

    it("loads household catalog and renders device list with recognizable names", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      expect((element as any)._catalogDevices.length).toBe(2);
      expect((element as any)._catalogDevices[0].name).toBe(
        "Hallway Roller Shade"
      );
      expect((element as any)._catalogDashboards.length).toBe(1);
    });

    it("assigns CONTROL to single-entity device (Hallway Roller Shade)", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const shadeDev = (element as any)._catalogDevices[0];
      await (element as any)._handleSetDevicePermission(shadeDev, "control");

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          user_id: CHILD_USER_ID,
          target_type: "device",
          target_id: "dev_shade",
          access_level: "control",
        })
      );
    });

    it("expands multi-entity device and sets selective channel permission (PN16 Channel 3)", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const pn16Dev = (element as any)._catalogDevices[1];
      (element as any)._toggleExpandDevice(pn16Dev.device_id);
      expect(
        (element as any)._expandedDeviceIds.has(pn16Dev.device_id)
      ).toBe(true);

      const ch3 = pn16Dev.channels[2];
      await (element as any)._handleSetChannelPermission(ch3, "control");

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          user_id: CHILD_USER_ID,
          target_type: "entity",
          target_id: "switch.pn16_l3",
          access_level: "control",
        })
      );
    });

    it("selects all channels for a multi-entity device", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const pn16Dev = (element as any)._catalogDevices[1];
      await (element as any)._handleSelectAllChannels(pn16Dev, "control");

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          target_id: "switch.pn16_l1",
          access_level: "control",
        })
      );
      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          target_id: "switch.pn16_l2",
          access_level: "control",
        })
      );
      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          target_id: "switch.pn16_l3",
          access_level: "control",
        })
      );
    });

    it("renders dashboards and views tab and sets view rule directly", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      await (element as any)._handleSetViewRuleDirect("main", "control");

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_view_rule",
          user_id: CHILD_USER_ID,
          view_path: "main",
          effect: "allow",
          access_level: "control",
        })
      );
    });

    it("sets explicit entity override for a device in a view", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      await (element as any)._handleSetEntityOverride(
        "switch.pn16_l3",
        "none"
      );

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          user_id: CHILD_USER_ID,
          target_type: "entity",
          target_id: "switch.pn16_l3",
          access_level: "none",
        })
      );
    });

    it("filters household devices by category (domain) and permission status", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      // Initial state: 2 devices
      expect((element as any)._getFilteredDevices().length).toBe(2);

      // Filter by domain "cover"
      (element as any)._deviceDomainFilter = "cover";
      const coverDevices = (element as any)._getFilteredDevices();
      expect(coverDevices.length).toBe(1);
      expect(coverDevices[0].domain).toBe("cover");

      // Filter by domain "switch"
      (element as any)._deviceDomainFilter = "switch";
      const switchDevices = (element as any)._getFilteredDevices();
      expect(switchDevices.length).toBe(1);
      expect(switchDevices[0].domain).toBe("switch");

      // Reset domain, test permission filter (default is none)
      (element as any)._deviceDomainFilter = "all";
      (element as any)._devicePermissionFilter = "none";
      expect((element as any)._getFilteredDevices().length).toBe(2);

      // Change one device rule to control
      (element as any)._userPermissionSet = {
        user_id: CHILD_USER_ID,
        default_access_level: "none",
        entity_rules: {
          r1: {
            rule_id: "r1",
            target_type: "device",
            target_id: "dev_shade",
            access_level: "control",
          },
        },
        view_rules: {},
      };

      // Filter for control only
      (element as any)._devicePermissionFilter = "control";
      const controlDevs = (element as any)._getFilteredDevices();
      expect(controlDevs.length).toBe(1);
      expect(controlDevs[0].device_id).toBe("dev_shade");
    });

    it("searches devices by name, area, target ID, and channel name", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      // Search by name
      (element as any)._deviceSearchQuery = "Roller";
      expect((element as any)._getFilteredDevices().length).toBe(1);
      expect((element as any)._getFilteredDevices()[0].name).toBe("Hallway Roller Shade");

      // Search by room
      (element as any)._deviceSearchQuery = "Utility";
      expect((element as any)._getFilteredDevices().length).toBe(1);
      expect((element as any)._getFilteredDevices()[0].name).toBe("SONOFF PN16");

      // Search by channel name
      (element as any)._deviceSearchQuery = "Channel 3";
      expect((element as any)._getFilteredDevices().length).toBe(1);
      expect((element as any)._getFilteredDevices()[0].name).toBe("SONOFF PN16");

      // Clear filters
      (element as any)._clearDeviceFilters();
      expect((element as any)._deviceSearchQuery).toBe("");
      expect((element as any)._deviceDomainFilter).toBe("all");
      expect((element as any)._devicePermissionFilter).toBe("all");
      expect((element as any)._deviceRoomFilter).toBe("all");
      expect((element as any)._hasActiveDeviceFilters).toBe(false);
    });

    it("groups devices by room/area and supports area collapse/expand", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const allDevs = (element as any)._getFilteredDevices();
      const groups = (element as any)._getGroupedDevices(allDevs);
      expect(groups.length).toBe(2);
      expect(groups.map((g: any) => g.area).sort()).toEqual(["Hallway", "Utility Room"]);

      // Test area collapse toggle
      expect((element as any)._collapsedAreaNames.has("Hallway")).toBe(false);
      (element as any)._toggleCollapseArea("Hallway");
      expect((element as any)._collapsedAreaNames.has("Hallway")).toBe(true);
      (element as any)._toggleCollapseArea("Hallway");
      expect((element as any)._collapsedAreaNames.has("Hallway")).toBe(false);
    });

    it("performs bulk permission updates for visible devices and area devices", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const allDevs = (element as any)._getFilteredDevices();
      await (element as any)._handleBulkSetVisibleDevices(allDevs, "control");

      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          target_id: "dev_shade",
          access_level: "control",
        })
      );
      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          target_id: "dev_pn16",
          access_level: "control",
        })
      );

      // Bulk area update
      const utilityGroup = (element as any)._getGroupedDevices(allDevs).find((g: any) => g.area === "Utility Room");
      await (element as any)._handleBulkSetAreaDevices(utilityGroup.devices, "none");
      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_entity_rule",
          target_id: "dev_pn16",
          access_level: "none",
        })
      );
    });

    it("supports bulk dashboard view permission updates and summary computation", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const dash = (element as any)._catalogDashboards[0];
      expect(dash).toBeDefined();

      // Check summary when no view rules are set (default none)
      const summaryInitial = (element as any)._getDashboardPermissionSummary(dash);
      expect(summaryInitial.level).toBe("deny");
      expect(summaryInitial.label).toBe("All Denied");

      // Bulk set views to control
      await (element as any)._handleBulkSetDashboardViews(dash, "control");
      expect(hass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "domolux/permission/set_view_rule",
          view_path: "main",
          access_level: "control",
        })
      );

      // Test dashboard group expand toggle
      expect((element as any)._expandedDashboardGroupIds.has(dash.dashboard_id)).toBe(false);
      (element as any)._toggleExpandDashboardGroup(dash.dashboard_id);
      expect((element as any)._expandedDashboardGroupIds.has(dash.dashboard_id)).toBe(true);
    });

    it("renders professional dialog container layout with sticky toolbar and scrollable body", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const shadowRoot = element.shadowRoot!;
      const dialogBackdrop = shadowRoot.querySelector(".dialog-backdrop");
      const dialogBox = shadowRoot.querySelector(".dialog-box.dialog-full");
      const dialogHeader = shadowRoot.querySelector(".dialog-header");
      const dialogBody = shadowRoot.querySelector(".dialog-body");
      const dialogFooter = shadowRoot.querySelector(".dialog-footer");
      const stickyToolbar = shadowRoot.querySelector(".sticky-toolbar");

      expect(dialogBackdrop).not.toBeNull();
      expect(dialogBox).not.toBeNull();
      expect(dialogHeader).not.toBeNull();
      expect(dialogBody).not.toBeNull();
      expect(dialogFooter).not.toBeNull();
      expect(stickyToolbar).not.toBeNull();

      // Verify area groups and device cards rendered
      const areaGroups = shadowRoot.querySelectorAll(".area-group");
      expect(areaGroups.length).toBeGreaterThanOrEqual(1);

      const deviceCards = shadowRoot.querySelectorAll(".device-card");
      expect(deviceCards.length).toBe(2);

      // Verify segmented control and buttons exist
      const segControls = shadowRoot.querySelectorAll(".segmented-control");
      expect(segControls.length).toBeGreaterThanOrEqual(2);
    });

    it("enforces critical dialog layout architecture and viewport containment styles", () => {
      const styles = (element.constructor as any).styles;
      const css = (Array.isArray(styles) ? styles.map((s: any) => s.cssText).join("\n") : styles.cssText) || "";

      // 1. Viewport containment for dialog box
      expect(css).toContain(".dialog-box.dialog-full");
      expect(css).toContain("max-height: calc(100vh - 48px)");
      expect(css).toContain("min(1080px, calc(100vw - 32px))");

      // 2. Controlled scroll container for dialog body
      expect(css).toContain(".dialog-body");
      expect(css).toContain("overflow-y: auto");
      expect(css).toContain("min-height: 0");
      expect(css).toContain("flex: 1 1 auto");

      // 3. Sticky toolbar that stays visible while scrolling
      expect(css).toContain(".filter-toolbar.sticky-toolbar");
      expect(css).toContain("position: sticky");

      // 4. Compact segmented controls
      expect(css).toContain(".segmented-control");
      expect(css).toContain(".seg-btn.active-deny");
      expect(css).toContain(".seg-btn.active-read");
      expect(css).toContain(".seg-btn.active-control");

      // 5. Mobile responsive rules and minimum 44px touch targets
      expect(css).toContain("@media (max-width: 768px)");
      expect(css).toContain("min-height: 44px");
      expect(css).toContain("100dvh");
    });

    it("seamlessly executes all 6 permission transitions on devices without getting stuck", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const shadeDev = (element as any)._catalogDevices[0];

      // Initial state is none (Deny)
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("none");

      // 1. Deny -> Read
      await (element as any)._handleSetDevicePermission(shadeDev, "read");
      await element.updateComplete;
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("read");

      // 2. Read -> Control
      await (element as any)._handleSetDevicePermission(shadeDev, "control");
      await element.updateComplete;
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("control");

      // Selecting already active control: no corruption
      await (element as any)._handleSetDevicePermission(shadeDev, "control");
      await element.updateComplete;
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("control");

      // 3. Control -> Read
      await (element as any)._handleSetDevicePermission(shadeDev, "read");
      await element.updateComplete;
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("read");

      // 4. Read -> Deny
      await (element as any)._handleSetDevicePermission(shadeDev, "none");
      await element.updateComplete;
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("none");

      // 5. Deny -> Control
      await (element as any)._handleSetDevicePermission(shadeDev, "control");
      await element.updateComplete;
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("control");

      // 6. Control -> Deny
      await (element as any)._handleSetDevicePermission(shadeDev, "none");
      await element.updateComplete;
      expect((element as any)._getEffectiveDeviceLevel(shadeDev)).toBe("none");
    });

    it("seamlessly executes all 6 permission transitions on multi-entity channels", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const pn16Dev = (element as any)._catalogDevices[1];
      const ch1 = pn16Dev.channels[0];

      // 1. Deny -> Read
      await (element as any)._handleSetChannelPermission(ch1, "read");
      await element.updateComplete;
      expect((element as any)._getEffectiveChannelLevel(ch1.entity_id, pn16Dev)).toBe("read");

      // 2. Read -> Control
      await (element as any)._handleSetChannelPermission(ch1, "control");
      await element.updateComplete;
      expect((element as any)._getEffectiveChannelLevel(ch1.entity_id, pn16Dev)).toBe("control");

      // Selecting already active control: no corruption
      await (element as any)._handleSetChannelPermission(ch1, "control");
      await element.updateComplete;
      expect((element as any)._getEffectiveChannelLevel(ch1.entity_id, pn16Dev)).toBe("control");

      // 3. Control -> Read
      await (element as any)._handleSetChannelPermission(ch1, "read");
      await element.updateComplete;
      expect((element as any)._getEffectiveChannelLevel(ch1.entity_id, pn16Dev)).toBe("read");

      // 4. Read -> Deny
      await (element as any)._handleSetChannelPermission(ch1, "none");
      await element.updateComplete;
      expect((element as any)._getEffectiveChannelLevel(ch1.entity_id, pn16Dev)).toBe("none");

      // 5. Deny -> Control
      await (element as any)._handleSetChannelPermission(ch1, "control");
      await element.updateComplete;
      expect((element as any)._getEffectiveChannelLevel(ch1.entity_id, pn16Dev)).toBe("control");

      // 6. Control -> Deny
      await (element as any)._handleSetChannelPermission(ch1, "none");
      await element.updateComplete;
      expect((element as any)._getEffectiveChannelLevel(ch1.entity_id, pn16Dev)).toBe("none");
    });

    it("seamlessly handles all 6 transitions on dashboard views and explicit entity overrides", async () => {
      const hass = createMockHass({ isFather: true });
      element.hass = hass;

      await (element as any)._checkRoleAndLoadFamily();
      await element.updateComplete;

      const member = (element as any)._familyMembers[0];
      await (element as any)._openPermissionDialog(member);
      await element.updateComplete;

      const viewPath = "main";

      // View transitions: Deny -> Read -> Control -> Read -> Deny -> Control -> Deny
      await (element as any)._handleSetViewRuleDirect(viewPath, "read");
      await element.updateComplete;
      expect((element as any)._userPermissionSet.view_rules[viewPath].access_level).toBe("read");

      await (element as any)._handleSetViewRuleDirect(viewPath, "control");
      await element.updateComplete;
      expect((element as any)._userPermissionSet.view_rules[viewPath].access_level).toBe("control");

      await (element as any)._handleSetViewRuleDirect(viewPath, "read");
      await element.updateComplete;
      expect((element as any)._userPermissionSet.view_rules[viewPath].access_level).toBe("read");

      await (element as any)._handleSetViewRuleDirect(viewPath, "none");
      await element.updateComplete;
      expect((element as any)._userPermissionSet.view_rules[viewPath].access_level).toBe("none");

      await (element as any)._handleSetViewRuleDirect(viewPath, "control");
      await element.updateComplete;
      expect((element as any)._userPermissionSet.view_rules[viewPath].access_level).toBe("control");

      await (element as any)._handleSetViewRuleDirect(viewPath, "none");
      await element.updateComplete;
      expect((element as any)._userPermissionSet.view_rules[viewPath].access_level).toBe("none");

      // Entity override transitions
      const eid = "switch.pn16_l3";
      await (element as any)._handleSetEntityOverride(eid, "read");
      await element.updateComplete;
      expect((element as any)._getExplicitEntityOverrideLevel(eid)).toBe("read");

      await (element as any)._handleSetEntityOverride(eid, "control");
      await element.updateComplete;
      expect((element as any)._getExplicitEntityOverrideLevel(eid)).toBe("control");

      await (element as any)._handleSetEntityOverride(eid, "none");
      await element.updateComplete;
      expect((element as any)._getExplicitEntityOverrideLevel(eid)).toBe("none");

      await (element as any)._handleSetEntityOverride(eid, "inherited");
      await element.updateComplete;
      expect((element as any)._getExplicitEntityOverrideLevel(eid)).toBeNull();

      // Tab switching retains state accurately
      (element as any)._activePermissionTab = "dashboards";
      await element.updateComplete;
      expect((element as any)._activePermissionTab).toBe("dashboards");
      expect((element as any)._userPermissionSet.view_rules[viewPath].access_level).toBe("none");

      (element as any)._activePermissionTab = "devices";
      await element.updateComplete;
      expect((element as any)._activePermissionTab).toBe("devices");
    });
  });
});
