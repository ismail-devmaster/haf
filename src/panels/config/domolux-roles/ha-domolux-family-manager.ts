import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import {
  mdiAccountGroup,
  mdiAccountPlus,
  mdiAccountLock,
  mdiAccountCheck,
  mdiKeyVariant,
  mdiAccountRemove,
  mdiShieldAlert,
  mdiRefresh,
  mdiClose,
  mdiShieldAccount,
  mdiChevronDown,
  mdiChevronUp,
  mdiViewDashboard,
  mdiDevices,
  mdiTune,
  mdiMagnify,
  mdiLayersOutline,
  mdiWindowShutter,
  mdiLightbulb,
  mdiToggleSwitch,
  mdiThermostat,
  mdiFan,
  mdiLock,
  mdiCast,
  mdiRobotVacuum,
} from "@mdi/js";

import "../../../components/ha-card";
import "../../../components/ha-button";
import "../../../components/ha-alert";
import "../../../components/ha-svg-icon";
import "../../../components/progress/ha-progress-ring";
import type { HomeAssistant } from "../../../types";
import {
  getDomoluxRole,
  fetchHouseholdCatalog,
  type DomoluxRoleInfo,
  type UserPermissionSet,
  type EvaluationResult,
  type HouseholdDevice,
  type DeviceChannel,
  type DashboardSummary,
} from "../../../data/domolux_roles";

export interface DomoluxFamilyMember {
  user_id: string;
  display_name: string;
  username: string;
  status: "ACTIVE" | "SUSPENDED_DISABLED" | string;
  managed_group_id: string;
  created_at: string;
  updated_at: string;
}

@customElement("ha-domolux-family-manager")
export class HaDomoluxFamilyManager extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _loading = true;

  @state() private _submitting = false;

  @state() private _isFather = false;

  @state() private _familyMembers: DomoluxFamilyMember[] = [];

  @state() private _error: string | null = null;

  @state() private _success: string | null = null;

  // Dialog & Form States
  @state() private _showCreateDialog = false;

  @state() private _showPasswordDialog = false;

  @state() private _selectedUserForPassword: DomoluxFamilyMember | null = null;

  @state() private _showDeleteDialog = false;

  @state() private _selectedUserForDelete: DomoluxFamilyMember | null = null;

  // Permission Dialog States
  @state() private _showPermissionDialog = false;

  @state() private _selectedUserForPermissions: DomoluxFamilyMember | null = null;

  @state() private _userPermissionSet: UserPermissionSet | null = null;

  @state() private _newDefaultAccessLevel: "none" | "read" | "control" | "" = "none";

  @state() private _newRuleTargetType: "entity" | "device" | "area" = "entity";

  @state() private _newRuleTargetId = "";

  @state() private _newRuleAccessLevel: "none" | "read" | "control" = "none";

  @state() private _newViewPath = "";

  @state() private _newViewEffect: "allow" | "deny" = "deny";

  @state() private _evalTargetType: "entity" | "device" | "area" | "view" = "entity";

  @state() private _evalTargetId = "";

  @state() private _evalResult: EvaluationResult | null = null;

  @state() private _activePermissionTab: "devices" | "dashboards" | "diagnostics" = "devices";

  @state() private _catalogDevices: HouseholdDevice[] = [];

  @state() private _catalogDashboards: DashboardSummary[] = [];

  @state() private _catalogLoading = false;

  @state() private _deviceSearchQuery = "";

  @state() private _deviceRoomFilter = "all";

  @state() private _expandedDeviceIds: Set<string> = new Set();

  @state() private _expandedDashboardIds: Set<string> = new Set();

  // Form Inputs (Passwords cleared immediately after WS call)
  @state() private _createDisplayName = "";

  @state() private _createUsername = "";

  @state() private _createPassword = "";

  @state() private _newPassword = "";

  protected firstUpdated(): void {
    this._checkRoleAndLoadFamily();
  }

  private async _checkRoleAndLoadFamily(): Promise<void> {
    this._loading = true;
    this._error = null;

    try {
      // Security Check: Server-side authorization query
      const roleInfo: DomoluxRoleInfo = await getDomoluxRole(this.hass);
      this._isFather = roleInfo.isFather;

      if (!this._isFather) {
        this._loading = false;
        return;
      }

      await this._loadFamilyMembers();
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to initialize Family Manager."
      );
    } finally {
      this._loading = false;
    }
  }

  private async _loadFamilyMembers(): Promise<void> {
    try {
      const members = (await this.hass.callWS({
        type: "domolux/family/list",
      })) as DomoluxFamilyMember[];

      this._familyMembers = members || [];
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to load family members."
      );
    }
  }

  private _parseErrorMessage(err: any, defaultMsg: string): string {
    if (!err) return defaultMsg;
    const code = err.code || err.error?.code || "";
    const msg = err.message || err.error?.message || "";

    switch (code) {
      case "father_required":
        return "Privilege error: Father role required to perform family management actions.";
      case "invalid_input":
        return (
          msg ||
          "Invalid input provided. Password must be at least 8 characters."
        );
      case "duplicate_username":
        return msg || "Username already exists in Home Assistant.";
      case "family_user_not_found":
        return "Target user is not a Domolux managed family member.";
      case "cannot_target_admin":
        return "Security policy violation: Cannot target Administrator account.";
      case "cannot_target_owner":
        return "Security policy violation: Cannot target Owner account.";
      case "cannot_target_father":
        return "Security policy violation: Cannot target Father account.";
      case "family_user_orphaned":
        return "Target family member is missing from Home Assistant authentication system.";
      default:
        return msg || defaultMsg;
    }
  }

  private _dismissError(): void {
    this._error = null;
  }

  private _dismissSuccess(): void {
    this._success = null;
  }

  private _openCreateDialog(): void {
    this._createDisplayName = "";
    this._createUsername = "";
    this._createPassword = "";
    this._error = null;
    this._showCreateDialog = true;
  }

  private _closeCreateDialog(): void {
    this._showCreateDialog = false;
    this._createPassword = ""; // Immediate secret zeroization
  }

  private async _handleCreateMember(): Promise<void> {
    if (!this._createDisplayName.trim()) {
      this._error = "Display Name is required.";
      return;
    }
    if (!this._createUsername.trim()) {
      this._error = "Username is required.";
      return;
    }
    if (!this._createPassword || this._createPassword.length < 8) {
      this._error = "Password must be at least 8 characters long.";
      return;
    }

    this._submitting = true;
    this._error = null;
    this._success = null;

    const displayName = this._createDisplayName.trim();
    const username = this._createUsername.trim();
    const password = this._createPassword;

    // Zeroize component input state before async call finishes
    this._createPassword = "";

    try {
      await this.hass.callWS({
        type: "domolux/family/create",
        display_name: displayName,
        username: username,
        password: password,
      });

      this._success = `Family member '${displayName}' (@${username}) created successfully.`;
      this._closeCreateDialog();
      await this._loadFamilyMembers();
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to create family member."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleToggleStatus(
    member: DomoluxFamilyMember
  ): Promise<void> {
    const isCurrentlyActive = member.status === "ACTIVE";
    const actionType = isCurrentlyActive
      ? "domolux/family/disable"
      : "domolux/family/enable";
    const actionName = isCurrentlyActive ? "Disable / تعليق" : "Enable / تفعيل";

    this._submitting = true;
    this._error = null;
    this._success = null;

    try {
      await this.hass.callWS({
        type: actionType,
        user_id: member.user_id,
      });

      this._success = `Family member '${member.display_name}' ${isCurrentlyActive ? "disabled" : "enabled"} successfully.`;
      await this._loadFamilyMembers();
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        `Failed to ${actionName.toLowerCase()} family member.`
      );
    } finally {
      this._submitting = false;
    }
  }

  private _openPasswordDialog(member: DomoluxFamilyMember): void {
    this._selectedUserForPassword = member;
    this._newPassword = "";
    this._error = null;
    this._showPasswordDialog = true;
  }

  private _closePasswordDialog(): void {
    this._showPasswordDialog = false;
    this._selectedUserForPassword = null;
    this._newPassword = ""; // Immediate secret zeroization
  }

  private async _handleChangePassword(): Promise<void> {
    if (!this._selectedUserForPassword) return;

    if (!this._newPassword || this._newPassword.length < 8) {
      this._error = "New password must be at least 8 characters long.";
      return;
    }

    this._submitting = true;
    this._error = null;
    this._success = null;

    const targetUser = this._selectedUserForPassword;
    const newPass = this._newPassword;

    // Zeroize password in state immediately
    this._newPassword = "";

    try {
      await this.hass.callWS({
        type: "domolux/family/change_password",
        user_id: targetUser.user_id,
        new_password: newPass,
      });

      this._success = `Password changed successfully for '${targetUser.display_name}'.`;
      this._closePasswordDialog();
    } catch (err: any) {
      this._error = this._parseErrorMessage(err, "Failed to change password.");
    } finally {
      this._submitting = false;
    }
  }

  private _openDeleteDialog(member: DomoluxFamilyMember): void {
    this._selectedUserForDelete = member;
    this._error = null;
    this._showDeleteDialog = true;
  }

  private _closeDeleteDialog(): void {
    this._showDeleteDialog = false;
    this._selectedUserForDelete = null;
  }

  private async _handleConfirmDeleteMember(): Promise<void> {
    if (!this._selectedUserForDelete) return;

    const member = this._selectedUserForDelete;
    this._submitting = true;
    this._error = null;
    this._success = null;

    try {
      await this.hass.callWS({
        type: "domolux/family/delete",
        user_id: member.user_id,
      });

      this._success = `Family member '${member.display_name}' deleted successfully.`;
      this._closeDeleteDialog();
      await this._loadFamilyMembers();
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to delete family member."
      );
    } finally {
      this._submitting = false;
    }
  }


  private async _openPermissionDialog(member: DomoluxFamilyMember): Promise<void> {
    if (!this._isFather) {
      return;
    }
    this._selectedUserForPermissions = member;
    this._userPermissionSet = null;
    this._evalResult = null;
    this._newDefaultAccessLevel = "none";
    this._newRuleTargetType = "entity";
    this._newRuleTargetId = "";
    this._newRuleAccessLevel = "none";
    this._newViewPath = "";
    this._newViewEffect = "deny";
    this._evalTargetType = "entity";
    this._evalTargetId = "";
    this._activePermissionTab = "devices";
    this._deviceSearchQuery = "";
    this._deviceRoomFilter = "all";
    this._expandedDeviceIds = new Set();
    this._expandedDashboardIds = new Set();
    this._error = null;
    this._showPermissionDialog = true;

    await Promise.all([
      this._loadUserPermissions(member.user_id),
      this._loadCatalog(),
    ]);
  }

  private _closePermissionDialog(): void {
    this._showPermissionDialog = false;
    this._selectedUserForPermissions = null;
    this._userPermissionSet = null;
    this._evalResult = null;
    this._catalogDevices = [];
    this._catalogDashboards = [];
  }

  private async _loadCatalog(): Promise<void> {
    this._catalogLoading = true;
    try {
      const res = await fetchHouseholdCatalog(this.hass);
      this._catalogDevices = res?.devices || res?.household_devices || [];
      this._catalogDashboards = res?.dashboards || [];
    } catch (_err) {
      this._catalogDevices = [];
      this._catalogDashboards = [];
    } finally {
      this._catalogLoading = false;
    }
  }

  private _getDomainIconPath(domain?: string): string {
    switch (domain) {
      case "cover":
        return mdiWindowShutter;
      case "light":
        return mdiLightbulb;
      case "switch":
        return mdiToggleSwitch;
      case "climate":
        return mdiThermostat;
      case "fan":
        return mdiFan;
      case "lock":
        return mdiLock;
      case "media_player":
        return mdiCast;
      case "vacuum":
        return mdiRobotVacuum;
      default:
        return mdiDevices;
    }
  }

  private _getAvailableRooms(): string[] {
    const rooms = new Set<string>();
    for (const dev of this._catalogDevices) {
      if (dev.area_name) {
        rooms.add(dev.area_name);
      }
    }
    return Array.from(rooms).sort();
  }

  private _getFilteredDevices(): HouseholdDevice[] {
    return this._catalogDevices.filter((dev) => {
      if (this._deviceRoomFilter !== "all" && dev.area_name !== this._deviceRoomFilter) {
        return false;
      }
      if (this._deviceSearchQuery.trim()) {
        const query = this._deviceSearchQuery.toLowerCase();
        const matchesName = dev.name.toLowerCase().includes(query);
        const matchesRoom = (dev.area_name || "").toLowerCase().includes(query);
        const matchesChannel = dev.channels?.some((ch) => ch.name.toLowerCase().includes(query));
        if (!matchesName && !matchesRoom && !matchesChannel) {
          return false;
        }
      }
      return true;
    });
  }

  private _getEffectiveDeviceLevel(
    dev: HouseholdDevice
  ): "none" | "read" | "control" {
    if (!this._userPermissionSet) return "none";
    const rules = Object.values(this._userPermissionSet.entity_rules || {});

    const targetRule = rules.find(
      (r) =>
        (r.target_type === dev.target_type && r.target_id === dev.target_id) ||
        (r.target_type === "device" && r.target_id === dev.device_id)
    );
    if (targetRule) {
      return targetRule.access_level;
    }

    if (!dev.is_multi_entity && dev.primary_entity_id) {
      const entityRule = rules.find(
        (r) =>
          r.target_type === "entity" && r.target_id === dev.primary_entity_id
      );
      if (entityRule) {
        return entityRule.access_level;
      }
    }

    if (dev.is_multi_entity && dev.channels && dev.channels.length > 0) {
      const channelLevels = dev.channels.map((ch) =>
        this._getEffectiveChannelLevel(ch.entity_id)
      );
      if (channelLevels.every((lvl) => lvl === "control")) {
        return "control";
      }
      if (channelLevels.every((lvl) => lvl === "read")) {
        return "read";
      }
    }

    return this._userPermissionSet.default_access_level || "none";
  }

  private _getEffectiveChannelLevel(
    entityId: string
  ): "none" | "read" | "control" {
    if (!this._userPermissionSet) return "none";
    const rules = Object.values(this._userPermissionSet.entity_rules || {});
    const rule = rules.find(
      (r) => r.target_type === "entity" && r.target_id === entityId
    );
    if (rule) {
      return rule.access_level;
    }
    return this._userPermissionSet.default_access_level || "none";
  }

  private async _handleSetDevicePermission(
    dev: HouseholdDevice,
    accessLevel: "none" | "read" | "control"
  ): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/set_entity_rule",
        user_id: this._selectedUserForPermissions.user_id,
        target_type: dev.target_type,
        target_id: dev.target_id,
        access_level: accessLevel,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._success = "Device permission updated successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to update device permission."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleSetChannelPermission(
    channel: DeviceChannel,
    accessLevel: "none" | "read" | "control"
  ): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/set_entity_rule",
        user_id: this._selectedUserForPermissions.user_id,
        target_type: "entity",
        target_id: channel.entity_id,
        access_level: accessLevel,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._success = "Channel permission updated successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to update channel permission."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleSelectAllChannels(
    dev: HouseholdDevice,
    accessLevel: "none" | "read" | "control"
  ): Promise<void> {
    if (!this._selectedUserForPermissions || !dev.channels) return;

    this._submitting = true;
    this._error = null;

    try {
      for (const ch of dev.channels) {
        const res = (await this.hass.callWS({
          type: "domolux/permission/set_entity_rule",
          user_id: this._selectedUserForPermissions.user_id,
          target_type: "entity",
          target_id: ch.entity_id,
          access_level: accessLevel,
        })) as any;
        if (res?.permissions) {
          this._userPermissionSet = res.permissions;
        }
      }
      this._success = `All channels updated to ${accessLevel}.`;
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to update all channels."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleSetViewRuleDirect(
    viewPath: string,
    level: "none" | "read" | "control"
  ): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    this._submitting = true;
    this._error = null;

    try {
      const effect = level === "none" ? "deny" : "allow";
      const res = (await this.hass.callWS({
        type: "domolux/permission/set_view_rule",
        user_id: this._selectedUserForPermissions.user_id,
        view_path: viewPath,
        effect,
        access_level: level,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._success = "View permission updated successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to update view permission."
      );
    } finally {
      this._submitting = false;
    }
  }

  private _getExplicitEntityOverrideLevel(entityId: string): string | null {
    if (!this._userPermissionSet) return null;
    const rules = Object.values(this._userPermissionSet.entity_rules || {});
    const rule = rules.find(
      (r) => r.target_type === "entity" && r.target_id === entityId
    );
    return rule ? rule.access_level : null;
  }

  private async _handleSetEntityOverride(
    entityId: string,
    value: string
  ): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    this._submitting = true;
    this._error = null;

    try {
      if (value === "inherited") {
        const rules = Object.values(this._userPermissionSet?.entity_rules || {});
        const rule = rules.find(
          (r) => r.target_type === "entity" && r.target_id === entityId
        );
        if (rule) {
          await this._handleRemoveEntityRule(rule.rule_id);
        }
        return;
      }

      const res = (await this.hass.callWS({
        type: "domolux/permission/set_entity_rule",
        user_id: this._selectedUserForPermissions.user_id,
        target_type: "entity",
        target_id: entityId,
        access_level: value,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._success = "Device exception updated successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to update exception."
      );
    } finally {
      this._submitting = false;
    }
  }

  private _lookupDeviceOrEntityName(entityId: string): string {
    for (const dev of this._catalogDevices) {
      if (dev.primary_entity_id === entityId) return dev.name;
      if (dev.channels) {
        const ch = dev.channels.find((c) => c.entity_id === entityId);
        if (ch) return `${dev.name} - ${ch.name}`;
      }
    }
    return this.hass?.states?.[entityId]?.attributes?.friendly_name || entityId;
  }

  private _toggleExpandDevice(deviceId: string): void {
    const next = new Set(this._expandedDeviceIds);
    if (next.has(deviceId)) {
      next.delete(deviceId);
    } else {
      next.add(deviceId);
    }
    this._expandedDeviceIds = next;
  }

  private _toggleExpandDashboard(viewPath: string): void {
    const next = new Set(this._expandedDashboardIds);
    if (next.has(viewPath)) {
      next.delete(viewPath);
    } else {
      next.add(viewPath);
    }
    this._expandedDashboardIds = next;
  }

  private async _loadUserPermissions(userId: string): Promise<void> {
    try {
      const permSet = (await this.hass.callWS({
        type: "domolux/permission/get",
        user_id: userId,
      })) as UserPermissionSet;

      this._userPermissionSet = permSet;
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to load user permissions."
      );
    }
  }

  private async _handleSetDefaultAccessLevel(
    defaultLevel?: "none" | "read" | "control" | ""
  ): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    const level = defaultLevel || this._newDefaultAccessLevel;
    if (!level) {
      this._error = "Default access level is required.";
      return;
    }

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/set_default_level",
        user_id: this._selectedUserForPermissions.user_id,
        default_access_level: level,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._success = "Default access level updated successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to update default access level."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleAddEntityRule(): Promise<void> {
    if (!this._selectedUserForPermissions) return;
    if (!this._newRuleTargetId.trim()) {
      this._error = "Target ID is required for entity permission rule.";
      return;
    }

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/set_entity_rule",
        user_id: this._selectedUserForPermissions.user_id,
        target_type: this._newRuleTargetType,
        target_id: this._newRuleTargetId.trim(),
        access_level: this._newRuleAccessLevel,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._newRuleTargetId = "";
      this._success = "Entity permission rule added successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to add entity permission rule."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleRemoveEntityRule(ruleId: string): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/remove_entity_rule",
        user_id: this._selectedUserForPermissions.user_id,
        rule_id: ruleId,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._success = "Entity permission rule removed successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to remove entity permission rule."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleAddViewRule(): Promise<void> {
    if (!this._selectedUserForPermissions) return;
    if (!this._newViewPath.trim()) {
      this._error = "View Path is required for view permission rule.";
      return;
    }

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/set_view_rule",
        user_id: this._selectedUserForPermissions.user_id,
        view_path: this._newViewPath.trim(),
        effect: this._newViewEffect,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._newViewPath = "";
      this._success = "View permission rule added successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to add view permission rule."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleRemoveViewRule(viewPath: string): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/remove_view_rule",
        user_id: this._selectedUserForPermissions.user_id,
        view_path: viewPath,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._success = "View permission rule removed successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to remove view permission rule."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleResetPermissions(): Promise<void> {
    if (!this._selectedUserForPermissions) return;

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/reset",
        user_id: this._selectedUserForPermissions.user_id,
      })) as any;

      if (res?.permissions) {
        this._userPermissionSet = res.permissions;
      }
      this._evalResult = null;
      this._success = "User permissions reset to default successfully.";
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to reset permissions."
      );
    } finally {
      this._submitting = false;
    }
  }

  private async _handleEvaluatePermission(): Promise<void> {
    if (!this._selectedUserForPermissions) return;
    if (!this._evalTargetId.trim()) {
      this._error = "Target ID or View Path is required for evaluation.";
      return;
    }

    this._submitting = true;
    this._error = null;

    try {
      const res = (await this.hass.callWS({
        type: "domolux/permission/evaluate",
        user_id: this._selectedUserForPermissions.user_id,
        target_type: this._evalTargetType,
        target_id: this._evalTargetId.trim(),
      })) as EvaluationResult;

      this._evalResult = res;
    } catch (err: any) {
      this._error = this._parseErrorMessage(
        err,
        "Failed to evaluate permission."
      );
    } finally {
      this._submitting = false;
    }
  }

  private _handleCreateDisplayNameInput(e: Event): void {
    this._createDisplayName = (e.target as HTMLInputElement).value;
  }

  private _handleCreateUsernameInput(e: Event): void {
    this._createUsername = (e.target as HTMLInputElement).value;
  }

  private _handleCreatePasswordInput(e: Event): void {
    this._createPassword = (e.target as HTMLInputElement).value;
  }

  private _handleNewPasswordInput(e: Event): void {
    this._newPassword = (e.target as HTMLInputElement).value;
  }

  protected render() {
    if (this._loading) {
      return html`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <p>Loading Domolux Family Manager...</p>
        </div>
      `;
    }

    // Security Verification: Non-Father users receive Access Denied warning banner
    if (!this._isFather) {
      return html`
        <div class="content" dir="auto">
          <ha-alert alert-type="warning" title="Access Denied">
            <div class="alert-content">
              <ha-svg-icon .path=${mdiShieldAlert}></ha-svg-icon>
              <span>
                Father privilege required to view or manage family members. يلزم
                وجود صلاحيات الأب المسؤول لإدارة أفراد العائلة.
              </span>
            </div>
          </ha-alert>
        </div>
      `;
    }

    return html`
      <div class="content" dir="auto">
        <!-- Header -->
        <div class="header-section">
          <ha-svg-icon
            .path=${mdiAccountGroup}
            class="header-icon"
          ></ha-svg-icon>
          <div class="header-text">
            <h1>Domolux Family Manager / إدارة عائلة دومولوكس</h1>
            <p class="subtitle">
              Manage family member accounts, security statuses, and access
              credentials. إدارة حسابات أفراد العائلة وحالات الأمان وكلمات
              المرور.
            </p>
          </div>
          <div class="header-actions">
            <ha-button
              raised
              .disabled=${this._submitting}
              @click=${this._openCreateDialog}
            >
              <ha-svg-icon .path=${mdiAccountPlus} slot="start"></ha-svg-icon>
              Add Member / إضافة فرد
            </ha-button>
            <ha-button
              .disabled=${this._submitting}
              @click=${this._loadFamilyMembers}
              title="Refresh / تحديث"
            >
              <ha-svg-icon .path=${mdiRefresh} slot="start"></ha-svg-icon>
              Refresh / تحديث
            </ha-button>
          </div>
        </div>

        <!-- System Alerts -->
        ${this._error
          ? html`<ha-alert
              alert-type="error"
              dismissable
              .localize=${this.hass?.localize}
              @alert-dismissed-clicked=${this._dismissError}
            >
              ${this._error}
            </ha-alert>`
          : nothing}
        ${this._success
          ? html`<ha-alert
              alert-type="success"
              dismissable
              .localize=${this.hass?.localize}
              @alert-dismissed-clicked=${this._dismissSuccess}
            >
              ${this._success}
            </ha-alert>`
          : nothing}

        <!-- Family Dashboard Table Card -->
        <ha-card header="Managed Family Members / أفراد العائلة المدارون">
          <div class="card-content">
            ${this._familyMembers.length === 0
              ? html`
                  <div class="empty-state">
                    <p>
                      No managed family members found. Click "Add Member" above
                      to create a family user.
                    </p>
                  </div>
                `
              : html`
                  <div class="table-container">
                    <table class="member-table">
                      <thead>
                        <tr>
                          <th>Member Name / الاسم</th>
                          <th>Username / اسم المستخدم</th>
                          <th>Status / الحالة</th>
                          <th>Managed ID / المعرف</th>
                          <th>Actions / الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this._familyMembers.map((member) => {
                          const isActive = member.status === "ACTIVE";
                          return html`
                            <tr>
                              <td class="name-cell">
                                <span class="display-name"
                                  >${member.display_name}</span
                                >
                              </td>
                              <td class="username-cell">@${member.username}</td>
                              <td class="status-cell">
                                <span
                                  class="status-badge ${isActive
                                    ? "active"
                                    : "disabled"}"
                                >
                                  <ha-svg-icon
                                    .path=${isActive
                                      ? mdiAccountCheck
                                      : mdiAccountLock}
                                  ></ha-svg-icon>
                                  ${isActive
                                    ? "Active / نشط"
                                    : "Suspended / معلق"}
                                </span>
                              </td>
                              <td class="id-cell">
                                <code>${member.user_id}</code>
                              </td>
                              <td class="actions-cell">
                                <ha-button
                                  size="small"
                                  .disabled=${this._submitting}
                                  @click=${() =>
                                    this._handleToggleStatus(member)}
                                >
                                  <ha-svg-icon
                                    .path=${isActive
                                      ? mdiAccountLock
                                      : mdiAccountCheck}
                                    slot="start"
                                  ></ha-svg-icon>
                                  ${isActive
                                    ? "Disable / تعليق"
                                    : "Enable / تفعيل"}
                                </ha-button>
                                <ha-button
                                  size="small"
                                  .disabled=${this._submitting}
                                  @click=${() =>
                                    this._openPasswordDialog(member)}
                                >
                                  <ha-svg-icon
                                    .path=${mdiKeyVariant}
                                    slot="start"
                                  ></ha-svg-icon>
                                  Password / كلمة السر
                                </ha-button>
                                <ha-button
                                  size="small"
                                  .disabled=${this._submitting}
                                  @click=${() =>
                                    this._openPermissionDialog(member)}
                                >
                                  <ha-svg-icon
                                    .path=${mdiShieldAccount}
                                    slot="start"
                                  ></ha-svg-icon>
                                  Permissions / الصلاحيات
                                </ha-button>
                                <ha-button
                                  size="small"
                                  class="destructive"
                                  .disabled=${this._submitting}
                                  @click=${() =>
                                    this._openDeleteDialog(member)}
                                >
                                  <ha-svg-icon
                                    .path=${mdiAccountRemove}
                                    slot="start"
                                  ></ha-svg-icon>
                                  Delete / حذف
                                </ha-button>
                              </td>
                            </tr>
                          `;
                        })}
                      </tbody>
                    </table>
                  </div>
                `}
          </div>
        </ha-card>

        <!-- Create Member Dialog -->
        ${this._showCreateDialog
          ? html`
              <div class="dialog-backdrop">
                <div class="dialog-box">
                  <div class="dialog-header">
                    <h2>Add Family Member / إضافة فرد من العائلة</h2>
                    <button
                      class="icon-button"
                      @click=${this._closeCreateDialog}
                    >
                      <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <div class="form-group">
                      <label for="create-name"
                        >Display Name / الاسم المعروض</label
                      >
                      <input
                        id="create-name"
                        type="text"
                        placeholder="e.g. Child One"
                        .value=${this._createDisplayName}
                        @input=${this._handleCreateDisplayNameInput}
                      />
                    </div>
                    <div class="form-group">
                      <label for="create-username"
                        >Username / اسم المستخدم</label
                      >
                      <input
                        id="create-username"
                        type="text"
                        placeholder="e.g. child1"
                        .value=${this._createUsername}
                        @input=${this._handleCreateUsernameInput}
                      />
                    </div>
                    <div class="form-group">
                      <label for="create-password"
                        >Initial Password / كلمة المرور الأولية</label
                      >
                      <input
                        id="create-password"
                        type="password"
                        placeholder="At least 8 characters"
                        .value=${this._createPassword}
                        @input=${this._handleCreatePasswordInput}
                      />
                      <span class="helper-text"
                        >Minimum 8 characters required.</span
                      >
                    </div>
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._closeCreateDialog}
                      .disabled=${this._submitting}
                    >
                      Cancel / إلغاء
                    </ha-button>
                    <ha-button
                      raised
                      @click=${this._handleCreateMember}
                      .disabled=${this._submitting}
                    >
                      Create Member / إنشاء
                    </ha-button>
                  </div>
                </div>
              </div>
            `
          : nothing}

        <!-- Change Password Dialog -->
        ${this._showPasswordDialog && this._selectedUserForPassword
          ? html`
              <div class="dialog-backdrop">
                <div class="dialog-box">
                  <div class="dialog-header">
                    <h2>Change Password / تغيير كلمة المرور</h2>
                    <button
                      class="icon-button"
                      @click=${this._closePasswordDialog}
                    >
                      <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <p class="target-summary">
                      Target Member:
                      <strong
                        >${this._selectedUserForPassword.display_name}</strong
                      >
                      (@${this._selectedUserForPassword.username})
                    </p>
                    <div class="form-group">
                      <label for="new-password"
                        >New Password / كلمة المرور الجديدة</label
                      >
                      <input
                        id="new-password"
                        type="password"
                        placeholder="At least 8 characters"
                        .value=${this._newPassword}
                        @input=${this._handleNewPasswordInput}
                      />
                      <span class="helper-text"
                        >Minimum 8 characters required.</span
                      >
                    </div>
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._closePasswordDialog}
                      .disabled=${this._submitting}
                    >
                      Cancel / إلغاء
                    </ha-button>
                    <ha-button
                      raised
                      @click=${this._handleChangePassword}
                      .disabled=${this._submitting}
                    >
                      Save Password / حفظ
                    </ha-button>
                  </div>
                </div>
              </div>
            `
          : nothing}

        <!-- Delete Member Confirmation Dialog -->
        ${this._showDeleteDialog && this._selectedUserForDelete
          ? html`
              <div class="dialog-backdrop">
                <div class="dialog-box">
                  <div class="dialog-header">
                    <h2>Delete Family Member / حذف فرد من العائلة</h2>
                    <button
                      class="icon-button"
                      @click=${this._closeDeleteDialog}
                    >
                      <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <p class="target-summary">
                      Are you sure you want to delete family member
                      <strong
                        >"${this._selectedUserForDelete.display_name}"
                        (@${this._selectedUserForDelete.username})</strong
                      >? This action will permanently remove the Home Assistant
                      user account and cannot be undone.
                    </p>
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._closeDeleteDialog}
                      .disabled=${this._submitting}
                    >
                      Cancel / إلغاء
                    </ha-button>
                    <ha-button
                      raised
                      class="destructive"
                      @click=${this._handleConfirmDeleteMember}
                      .disabled=${this._submitting}
                    >
                      Delete Member / حذف
                    </ha-button>
                  </div>
                </div>
              </div>
            `
          : nothing}

        <!-- Permission Management Dialog -->
        ${this._showPermissionDialog && this._selectedUserForPermissions
          ? html`
              <div class="dialog-backdrop">
                <div class="dialog-box dialog-full">
                  <div class="dialog-header">
                    <h2>
                      Permissions / الصلاحيات —
                      ${this._selectedUserForPermissions.display_name}
                      (@${this._selectedUserForPermissions.username})
                    </h2>
                    <button
                      class="icon-button"
                      @click=${this._closePermissionDialog}
                    >
                      <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                    </button>
                  </div>
                  <div class="dialog-body">
                    <!-- Navigation Tabs -->
                    <div class="permission-tabs">
                      <button
                        class="tab-btn ${this._activePermissionTab === 'devices' ? 'active' : ''}"
                        @click=${() => {
                          this._activePermissionTab = "devices";
                        }}
                      >
                        <ha-svg-icon .path=${mdiDevices}></ha-svg-icon>
                        <span>Household devices</span>
                      </button>
                      <button
                        class="tab-btn ${this._activePermissionTab === 'dashboards' ? 'active' : ''}"
                        @click=${() => {
                          this._activePermissionTab = "dashboards";
                        }}
                      >
                        <ha-svg-icon .path=${mdiViewDashboard}></ha-svg-icon>
                        <span>Dashboards and views</span>
                      </button>
                      <button
                        class="tab-btn ${this._activePermissionTab === 'diagnostics' ? 'active' : ''}"
                        @click=${() => {
                          this._activePermissionTab = "diagnostics";
                        }}
                      >
                        <ha-svg-icon .path=${mdiTune}></ha-svg-icon>
                        <span>Advanced diagnostics</span>
                      </button>
                    </div>

                    ${this._activePermissionTab === "devices"
                      ? this._renderHouseholdDevicesTab()
                      : this._activePermissionTab === "dashboards"
                      ? this._renderDashboardsTab()
                      : this._renderDiagnosticsTab()}
                  </div>
                  <div class="dialog-footer">
                    <ha-button
                      @click=${this._handleResetPermissions}
                      .disabled=${this._submitting}
                      class="destructive"
                    >
                      Reset Permissions / إعادة تعيين
                    </ha-button>
                    <ha-button
                      @click=${this._closePermissionDialog}
                      .disabled=${this._submitting}
                    >
                      Close / إغلاق
                    </ha-button>
                  </div>
                </div>
              </div>
            `
          : nothing}
      </div>
    `;
  }

  private _renderHouseholdDevicesTab() {
    if (this._catalogLoading) {
      return html`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <span>Loading household devices...</span>
        </div>
      `;
    }

    const availableRooms = this._getAvailableRooms();
    const filteredDevices = this._getFilteredDevices();

    return html`
      <div class="filter-toolbar">
        <div class="search-box">
          <ha-svg-icon .path=${mdiMagnify}></ha-svg-icon>
          <input
            type="text"
            placeholder="Search devices by name..."
            .value=${this._deviceSearchQuery}
            @input=${(e: Event) => {
              this._deviceSearchQuery = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
        <div class="room-filter">
          <select
            .value=${this._deviceRoomFilter}
            @change=${(e: Event) => {
              this._deviceRoomFilter = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="all">All rooms</option>
            ${availableRooms.map(
              (room) => html`<option value=${room}>${room}</option>`
            )}
          </select>
        </div>
      </div>

      ${filteredDevices.length === 0
        ? html`
            <div class="empty-state">
              <p>No household devices found.</p>
            </div>
          `
        : html`
            <div class="device-list">
              ${filteredDevices.map((dev) => {
                const effectiveLevel = this._getEffectiveDeviceLevel(dev);
                const isExpanded = this._expandedDeviceIds.has(dev.device_id);
                return html`
                  <div class="device-card">
                    <div class="device-main-row">
                      <div class="device-icon-container">
                        <ha-svg-icon
                          .path=${this._getDomainIconPath(dev.domain)}
                        ></ha-svg-icon>
                      </div>
                      <div class="device-info">
                        <div class="device-name-row">
                          <span class="device-name">${dev.name}</span>
                          ${dev.area_name
                            ? html`<span class="area-badge"
                                >${dev.area_name}</span
                              >`
                            : nothing}
                          ${dev.is_multi_entity
                            ? html`<span class="multi-badge"
                                >${dev.channels.length} channels</span
                              >`
                            : nothing}
                        </div>
                        <div class="device-meta">
                          Capabilities: ${dev.capabilities.join(", ")}
                        </div>
                      </div>
                      <div class="device-permission-controls">
                        <div class="segmented-control">
                          <button
                            class="seg-btn ${effectiveLevel === 'none'
                              ? 'active-deny'
                              : ''}"
                            @click=${() =>
                              this._handleSetDevicePermission(dev, 'none')}
                            .disabled=${this._submitting}
                          >
                            Deny
                          </button>
                          <button
                            class="seg-btn ${effectiveLevel === 'read'
                              ? 'active-read'
                              : ''}"
                            @click=${() =>
                              this._handleSetDevicePermission(dev, 'read')}
                            .disabled=${this._submitting}
                          >
                            Read
                          </button>
                          <button
                            class="seg-btn ${effectiveLevel === 'control'
                              ? 'active-control'
                              : ''}"
                            @click=${() =>
                              this._handleSetDevicePermission(dev, 'control')}
                            .disabled=${this._submitting}
                          >
                            Control
                          </button>
                        </div>
                        ${dev.is_multi_entity
                          ? html`
                              <button
                                class="icon-button expand-btn"
                                @click=${() =>
                                  this._toggleExpandDevice(dev.device_id)}
                                title="Expand channels"
                              >
                                <ha-svg-icon
                                  .path=${isExpanded
                                    ? mdiChevronUp
                                    : mdiChevronDown}
                                ></ha-svg-icon>
                              </button>
                            `
                          : nothing}
                      </div>
                    </div>
                    ${dev.is_multi_entity && isExpanded
                      ? html`
                          <div class="channels-expansion">
                            <div class="channels-header">
                              <span>Individual channels</span>
                              <div class="channels-actions">
                                <ha-button
                                  size="small"
                                  @click=${() =>
                                    this._handleSelectAllChannels(
                                      dev,
                                      'control'
                                    )}
                                  .disabled=${this._submitting}
                                >
                                  Select all control
                                </ha-button>
                                <ha-button
                                  size="small"
                                  @click=${() =>
                                    this._handleSelectAllChannels(dev, 'none')}
                                  .disabled=${this._submitting}
                                >
                                  Select all deny
                                </ha-button>
                              </div>
                            </div>
                            <div class="channels-list">
                              ${dev.channels.map((ch) => {
                                const chLevel = this._getEffectiveChannelLevel(
                                  ch.entity_id
                                );
                                return html`
                                  <div class="channel-row">
                                    <div class="channel-info">
                                      <ha-svg-icon
                                        .path=${this._getDomainIconPath(
                                          ch.domain
                                        )}
                                      ></ha-svg-icon>
                                      <span class="channel-name"
                                        >${ch.name}</span
                                      >
                                    </div>
                                    <div class="segmented-control small">
                                      <button
                                        class="seg-btn ${chLevel === 'none'
                                          ? 'active-deny'
                                          : ''}"
                                        @click=${() =>
                                          this._handleSetChannelPermission(
                                            ch,
                                            'none'
                                          )}
                                        .disabled=${this._submitting}
                                      >
                                        Deny
                                      </button>
                                      <button
                                        class="seg-btn ${chLevel === 'read'
                                          ? 'active-read'
                                          : ''}"
                                        @click=${() =>
                                          this._handleSetChannelPermission(
                                            ch,
                                            'read'
                                          )}
                                        .disabled=${this._submitting}
                                      >
                                        Read
                                      </button>
                                      <button
                                        class="seg-btn ${chLevel === 'control'
                                          ? 'active-control'
                                          : ''}"
                                        @click=${() =>
                                          this._handleSetChannelPermission(
                                            ch,
                                            'control'
                                          )}
                                        .disabled=${this._submitting}
                                      >
                                        Control
                                      </button>
                                    </div>
                                  </div>
                                `;
                              })}
                            </div>
                          </div>
                        `
                      : nothing}
                  </div>
                `;
              })}
            </div>
          `}
    `;
  }

  private _renderDashboardsTab() {
    if (this._catalogLoading) {
      return html`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <span>Loading dashboards and views...</span>
        </div>
      `;
    }

    if (this._catalogDashboards.length === 0) {
      return html`
        <div class="empty-state">
          <p>No dashboards found.</p>
        </div>
      `;
    }

    return html`
      <div class="dashboards-list">
        ${this._catalogDashboards.map(
          (dash) => html`
            <div class="dashboard-block">
              <div class="dashboard-title">
                <ha-svg-icon .path=${mdiLayersOutline}></ha-svg-icon>
                <h3>${dash.title}</h3>
              </div>
              <div class="views-grid">
                ${dash.views.map((v) => {
                  const vRule = this._userPermissionSet?.view_rules[v.view_path];
                  const vEffect =
                    vRule?.access_level ||
                    (vRule?.effect === "allow" ? "control" : "none");
                  const isExpanded = this._expandedDashboardIds.has(v.view_path);
                  return html`
                    <div class="view-card">
                      <div class="view-card-header">
                        <div class="view-title-row">
                          <ha-svg-icon .path=${mdiViewDashboard}></ha-svg-icon>
                          <span class="view-title">${v.title}</span>
                        </div>
                        <div class="segmented-control">
                          <button
                            class="seg-btn ${vEffect === 'none'
                              ? 'active-deny'
                              : ''}"
                            @click=${() =>
                              this._handleSetViewRuleDirect(v.view_path, 'none')}
                            .disabled=${this._submitting}
                          >
                            Deny
                          </button>
                          <button
                            class="seg-btn ${vEffect === 'read'
                              ? 'active-read'
                              : ''}"
                            @click=${() =>
                              this._handleSetViewRuleDirect(v.view_path, 'read')}
                            .disabled=${this._submitting}
                          >
                            Read
                          </button>
                          <button
                            class="seg-btn ${vEffect === 'control'
                              ? 'active-control'
                              : ''}"
                            @click=${() =>
                              this._handleSetViewRuleDirect(v.view_path, 'control')}
                            .disabled=${this._submitting}
                          >
                            Control
                          </button>
                        </div>
                      </div>
                      ${v.entities.length > 0
                        ? html`
                            <div class="view-entities-section">
                              <button
                                class="expand-entities-toggle"
                                @click=${() =>
                                  this._toggleExpandDashboard(v.view_path)}
                              >
                                <span>${v.entities.length} referenced devices/entities</span>
                                <ha-svg-icon
                                  .path=${isExpanded
                                    ? mdiChevronUp
                                    : mdiChevronDown}
                                ></ha-svg-icon>
                              </button>
                              ${isExpanded
                                ? html`
                                    <div class="view-entities-list">
                                      ${v.entities.map((eid) => {
                                        const overrideLevel = this._getExplicitEntityOverrideLevel(
                                          eid
                                        );
                                        return html`
                                          <div class="view-entity-item">
                                            <span class="view-entity-name"
                                              >${this._lookupDeviceOrEntityName(
                                                eid
                                              )}</span
                                            >
                                            <div class="override-selector">
                                              <select
                                                .value=${overrideLevel || 'inherited'}
                                                @change=${(e: Event) =>
                                                  this._handleSetEntityOverride(
                                                    eid,
                                                    (e.target as HTMLSelectElement)
                                                      .value
                                                  )}
                                                .disabled=${this._submitting}
                                              >
                                                <option value="inherited">
                                                  Inherited (${vEffect})
                                                </option>
                                                <option value="none">
                                                  Explicit deny
                                                </option>
                                                <option value="read">
                                                  Explicit read
                                                </option>
                                                <option value="control">
                                                  Explicit control
                                                </option>
                                              </select>
                                            </div>
                                          </div>
                                        `;
                                      })}
                                    </div>
                                  `
                                : nothing}
                            </div>
                          `
                        : nothing}
                    </div>
                  `;
                })}
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  private _renderDiagnosticsTab() {
    return html`
      <!-- Default Access Level -->
      <ha-card>
        <div class="card-content">
          <h3>Default Access Level / مستوى الوصول الافتراضي</h3>
          <div class="form-group">
            <select
              .value=${this._userPermissionSet?.default_access_level || "none"}
              @change=${(e: Event) =>
                this._handleSetDefaultAccessLevel(
                  (e.target as HTMLSelectElement)
                    .value as "none" | "read" | "control"
                )}
            >
              <option value="none">None / لا شيء</option>
              <option value="read">Read / قراءة</option>
              <option value="control">Control / تحكم</option>
            </select>
          </div>
        </div>
      </ha-card>

      <!-- Entity Rules -->
      <ha-card>
        <div class="card-content">
          <h3>Entity / Device / Area Rules / القواعد</h3>
          <div class="form-row">
            <select
              .value=${this._newRuleTargetType}
              @change=${(e: Event) => {
                this._newRuleTargetType = (
                  e.target as HTMLSelectElement
                ).value as "entity" | "device" | "area";
              }}
            >
              <option value="entity">Entity / كيان</option>
              <option value="device">Device / جهاز</option>
              <option value="area">Area / منطقة</option>
            </select>
            <input
              type="text"
              placeholder="Target ID / المعرف"
              .value=${this._newRuleTargetId}
              @input=${(e: Event) => {
                this._newRuleTargetId = (
                  e.target as HTMLInputElement
                ).value;
              }}
            />
            <select
              .value=${this._newRuleAccessLevel}
              @change=${(e: Event) => {
                this._newRuleAccessLevel = (
                  e.target as HTMLSelectElement
                ).value as "none" | "read" | "control";
              }}
            >
              <option value="none">None / لا شيء</option>
              <option value="read">Read / قراءة</option>
              <option value="control">Control / تحكم</option>
            </select>
            <ha-button
              @click=${this._handleAddEntityRule}
              .disabled=${this._submitting || !this._newRuleTargetId.trim()}
            >
              Add / إضافة
            </ha-button>
          </div>
          ${this._userPermissionSet &&
          Object.keys(this._userPermissionSet.entity_rules).length === 0
            ? html`<p class="empty-state-text"
                >No entity rules / لا توجد قواعد</p
              >`
            : nothing}
          <div class="rules-list">
            ${this._userPermissionSet
              ? Object.values(this._userPermissionSet.entity_rules).map(
                  (rule) => html`
                    <div class="rule-row">
                      <span>
                        <strong>${rule.target_type}</strong>/${rule.target_id} →
                        ${rule.access_level}
                      </span>
                      <ha-button
                        size="small"
                        class="destructive"
                        @click=${() =>
                          this._handleRemoveEntityRule(rule.rule_id)}
                        .disabled=${this._submitting}
                      >
                        Remove / حذف
                      </ha-button>
                    </div>
                  `
                )
              : nothing}
          </div>
        </div>
      </ha-card>

      <!-- View Rules -->
      <ha-card>
        <div class="card-content">
          <h3>View Rules / قواعد العرض</h3>
          <div class="form-row">
            <input
              type="text"
              placeholder="View path / المسار"
              .value=${this._newViewPath}
              @input=${(e: Event) => {
                this._newViewPath = (e.target as HTMLInputElement).value;
              }}
            />
            <select
              .value=${this._newViewEffect}
              @change=${(e: Event) => {
                this._newViewEffect = (
                  e.target as HTMLSelectElement
                ).value as "allow" | "deny";
              }}
            >
              <option value="allow">Allow / سماح</option>
              <option value="deny">Deny / منع</option>
            </select>
            <ha-button
              @click=${this._handleAddViewRule}
              .disabled=${this._submitting || !this._newViewPath.trim()}
            >
              Add / إضافة
            </ha-button>
          </div>
          <div class="rules-list">
            ${this._userPermissionSet
              ? Object.values(this._userPermissionSet.view_rules).map(
                  (rule) => html`
                    <div class="rule-row">
                      <span>
                        <strong>${rule.view_path}</strong>
                        → ${rule.effect}
                      </span>
                      <ha-button
                        size="small"
                        class="destructive"
                        @click=${() =>
                          this._handleRemoveViewRule(rule.view_path)}
                        .disabled=${this._submitting}
                      >
                        Remove / حذف
                      </ha-button>
                    </div>
                  `
                )
              : nothing}
          </div>
        </div>
      </ha-card>

      <!-- Evaluation Preview -->
      <ha-card>
        <div class="card-content">
          <h3>Evaluation Preview / معاينة التقييم</h3>
          <div class="form-row">
            <select
              .value=${this._evalTargetType}
              @change=${(e: Event) => {
                this._evalTargetType = (
                  e.target as HTMLSelectElement
                ).value as "entity" | "device" | "area" | "view";
              }}
            >
              <option value="entity">Entity</option>
              <option value="device">Device</option>
              <option value="area">Area</option>
              <option value="view">View</option>
            </select>
            <input
              type="text"
              placeholder="Target ID / View path"
              .value=${this._evalTargetId}
              @input=${(e: Event) => {
                this._evalTargetId = (e.target as HTMLInputElement).value;
              }}
            />
            <ha-button
              @click=${this._handleEvaluatePermission}
              .disabled=${this._submitting || !this._evalTargetId.trim()}
            >
              Evaluate / قيّم
            </ha-button>
          </div>
          ${this._evalResult
            ? html`
                <div class="eval-result">
                  <p>
                    Result / النتيجة:
                    <strong
                      >${this._evalResult.effect ||
                      this._evalResult.access_level ||
                      "N/A"}</strong
                    >
                    ${this._evalResult.matching_rule_type
                      ? html` (matched:
                          ${this._evalResult.matching_rule_type}
                          / rule:
                          ${this._evalResult.matching_rule_id})`
                      : nothing}
                  </p>
                </div>
              `
            : nothing}
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: var(--ha-space-4, 16px);
      background-color: var(--primary-background-color);
      color: var(--primary-text-color);
    }

    .content {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-4, 16px);
    }

    .header-section {
      display: flex;
      align-items: center;
      gap: var(--ha-space-4, 16px);
      flex-wrap: wrap;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      color: var(--primary-color);
    }

    .header-text {
      flex: 1;
      min-width: 250px;
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .subtitle {
      margin: var(--ha-space-1, 4px) 0 0 0;
      color: var(--secondary-text-color);
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      gap: var(--ha-space-2, 8px);
    }

    ha-card {
      border-radius: var(--ha-card-border-radius, 12px);
    }

    .card-content {
      padding: var(--ha-space-4, 16px);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      gap: 16px;
    }

    .alert-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .table-container {
      overflow-x: auto;
    }

    .member-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .member-table th {
      padding: 12px;
      border-bottom: 2px solid var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color);
      font-weight: 600;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .member-table td {
      padding: 12px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      vertical-align: middle;
    }

    .display-name {
      font-weight: 500;
    }

    .username-cell {
      color: var(--secondary-text-color);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .status-badge.active {
      background-color: var(--state-active-color, rgba(3, 169, 244, 0.15));
      color: var(--primary-color);
    }

    .status-badge.disabled {
      background-color: var(--warning-color-subtle, rgba(255, 152, 0, 0.15));
      color: var(--warning-color, #ff9800);
    }

    .id-cell code {
      font-family: monospace;
      font-size: 0.8rem;
      background: var(--secondary-background-color, #f5f5f5);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .actions-cell {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    ha-button.destructive {
      --mdc-theme-primary: var(--error-color, #db4437);
      color: var(--error-color, #db4437);
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
      color: var(--secondary-text-color);
    }

    /* Dialog Styles */
    .dialog-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .dialog-box {
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #000);
      border-radius: 12px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 500;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      padding: 4px;
    }

    .dialog-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .target-summary {
      margin: 0;
      color: var(--secondary-text-color);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .form-group input {
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #000);
      font-size: 1rem;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .helper-text {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
    }

    /* Permission Tabs */
    .permission-tabs {
      display: flex;
      gap: var(--ha-space-2, 8px);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      padding-bottom: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-3, 12px);
      flex-wrap: wrap;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
      background: none;
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background-color: var(--secondary-background-color, #f5f5f5);
    }

    .tab-btn.active {
      color: var(--primary-color);
      background-color: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      border-color: var(--primary-color);
    }

    /* Filter Toolbar */
    .filter-toolbar {
      display: flex;
      gap: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-4, 16px);
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 200px;
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
    }

    .search-box input {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      color: var(--primary-text-color);
      font-size: 0.95rem;
    }

    .room-filter select {
      padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 0.95rem;
      height: 100%;
    }

    /* Device List & Card */
    .device-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-3, 12px);
    }

    .device-card {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .device-main-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3, 12px);
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      flex-wrap: wrap;
    }

    .device-icon-container {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background-color: var(--secondary-background-color, #f0f0f0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .device-info {
      flex: 1;
      min-width: 180px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .device-name-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      flex-wrap: wrap;
    }

    .device-name {
      font-weight: 600;
      font-size: 1rem;
    }

    .area-badge {
      background: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      color: var(--primary-color);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .multi-badge {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .device-meta {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
    }

    .device-permission-controls {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
    }

    /* Segmented Control */
    .segmented-control {
      display: inline-flex;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      overflow: hidden;
      background: var(--secondary-background-color, #f9f9f9);
    }

    .segmented-control.small {
      border-radius: 6px;
    }

    .seg-btn {
      background: none;
      border: none;
      padding: 6px 14px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      color: var(--primary-text-color);
      transition: background-color 0.2s, color 0.2s;
    }

    .segmented-control.small .seg-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
    }

    .seg-btn:not(:last-child) {
      border-right: 1px solid var(--divider-color, #ccc);
    }

    .seg-btn.active-deny {
      background-color: var(--error-color, #db4437);
      color: #fff;
    }

    .seg-btn.active-read {
      background-color: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .seg-btn.active-control {
      background-color: var(--success-color, #4caf50);
      color: #fff;
    }

    /* Channels Expansion */
    .channels-expansion {
      background-color: var(--secondary-background-color, #fbfbfb);
      border-top: 1px solid var(--divider-color, #e0e0e0);
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
    }

    .channels-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--secondary-text-color);
    }

    .channels-actions {
      display: flex;
      gap: var(--ha-space-2, 8px);
    }

    .channels-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
    }

    .channel-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #eee);
    }

    .channel-info {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
    }

    .channel-name {
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Dashboards Tab */
    .dashboards-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-4, 16px);
    }

    .dashboard-block {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-3, 12px);
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      color: var(--primary-color);
    }

    .dashboard-title h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
    }

    .views-grid {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-3, 12px);
    }

    .view-card {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
    }

    .view-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
    }

    .view-title-row {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
    }

    .view-title {
      font-weight: 600;
      font-size: 1rem;
    }

    .view-entities-section {
      border-top: 1px dashed var(--divider-color, #e0e0e0);
      padding-top: var(--ha-space-2, 8px);
      margin-top: 4px;
    }

    .expand-entities-toggle {
      display: flex;
      align-items: center;
      gap: var(--ha-space-1, 4px);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 0.85rem;
      padding: 0;
    }

    .view-entities-list {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2, 8px);
      margin-top: var(--ha-space-2, 8px);
      padding-left: var(--ha-space-2, 8px);
    }

    .view-entity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      background: var(--secondary-background-color, #fbfbfb);
    }

    .view-entity-name {
      font-size: 0.85rem;
      font-weight: 500;
    }

    .override-selector select {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      font-size: 0.8rem;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 20px;
      background: var(--secondary-background-color, #f9f9f9);
      border-top: 1px solid var(--divider-color, #e0e0e0);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-domolux-family-manager": HaDomoluxFamilyManager;
  }
}
