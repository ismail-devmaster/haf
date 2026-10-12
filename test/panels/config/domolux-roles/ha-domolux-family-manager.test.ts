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
      return Promise.resolve({
        user_id: msg.user_id,
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
          },
        },
      });
    }
    if (msg.type === "domolux/permission/set_default_level") {
      return Promise.resolve({
        success: true,
        permissions: {
          user_id: msg.user_id,
          default_access_level: msg.default_access_level,
          entity_rules: {},
          view_rules: {},
        },
      });
    }
    if (msg.type === "domolux/permission/set_entity_rule") {
      return Promise.resolve({
        success: true,
        rule: {
          rule_id: msg.rule_id || "rule_test",
          target_type: msg.target_type,
          target_id: msg.target_id,
          access_level: msg.access_level,
        },
        permissions: {
          user_id: msg.user_id,
          default_access_level: "none",
          entity_rules: {},
          view_rules: {},
        },
      });
    }
    if (msg.type === "domolux/permission/remove_entity_rule") {
      return Promise.resolve({
        success: true,
        permissions: {
          user_id: msg.user_id,
          default_access_level: "none",
          entity_rules: {},
          view_rules: {},
        },
      });
    }
    if (msg.type === "domolux/permission/set_view_rule") {
      return Promise.resolve({
        success: true,
        rule: {
          view_path: msg.view_path,
          effect: msg.effect,
        },
        permissions: {
          user_id: msg.user_id,
          default_access_level: "none",
          entity_rules: {},
          view_rules: {},
        },
      });
    }
    if (msg.type === "domolux/permission/remove_view_rule") {
      return Promise.resolve({
        success: true,
        permissions: {
          user_id: msg.user_id,
          default_access_level: "none",
          entity_rules: {},
          view_rules: {},
        },
      });
    }
    if (msg.type === "domolux/permission/reset") {
      return Promise.resolve({
        success: true,
        permissions: {
          user_id: msg.user_id,
          default_access_level: "none",
          entity_rules: {},
          view_rules: {},
        },
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
  });
});
