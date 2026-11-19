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
  mdiFilterRemoveOutline,
  mdiCheckAll,
  mdiMinusCircleOutline,
  mdiEyeOutline,
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

  @state() private _deviceDomainFilter = "all";

  @state() private _devicePermissionFilter = "all";

  @state() private _expandedDeviceIds: Set<string> = new Set();

  @state() private _collapsedAreaNames: Set<string> = new Set();

  @state() private _expandedDashboardGroupIds: Set<string> = new Set();

  @state() private _expandedDashboardIds: Set<string> = new Set();

  @state() private _selectedDashboardId = "all";

  @state() private _dashboardSearchQuery = "";

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

      this._familyMembers = Array.isArray(members)
        ? members
        : Array.isArray((members as any)?.members)
          ? (members as any).members
          : [];
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
    this._deviceDomainFilter = "all";
    this._devicePermissionFilter = "all";
    this._expandedDeviceIds = new Set();
    this._collapsedAreaNames = new Set();
    this._expandedDashboardGroupIds = new Set();
    this._expandedDashboardIds = new Set();
    this._selectedDashboardId = "all";
    this._dashboardSearchQuery = "";
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
    this._selectedDashboardId = "all";
    this._dashboardSearchQuery = "";
    this._deviceSearchQuery = "";
    this._deviceRoomFilter = "all";
    this._deviceDomainFilter = "all";
    this._devicePermissionFilter = "all";
    this._expandedDeviceIds = new Set();
    this._collapsedAreaNames = new Set();
    this._expandedDashboardGroupIds = new Set();
    this._expandedDashboardIds = new Set();
  }

  private async _loadCatalog(): Promise<void> {
    this._catalogLoading = true;
    try {
      const res = await fetchHouseholdCatalog(this.hass);
      const devices = res?.devices || res?.household_devices || [];
      const dashboards = res?.dashboards || [];
      this._catalogDevices = Array.isArray(devices) ? devices : [];
      this._catalogDashboards = Array.isArray(dashboards) ? dashboards : [];
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

  private _getAvailableDomains(): { domain: string; label: string; count: number }[] {
    const domainCounts = new Map<string, number>();
    for (const dev of this._catalogDevices) {
      const d = dev.domain || "other";
      domainCounts.set(d, (domainCounts.get(d) || 0) + 1);
    }
    const labelMap: Record<string, string> = {
      light: "Lights",
      switch: "Switches",
      cover: "Covers",
      climate: "Climate",
      fan: "Fans",
      lock: "Locks",
      media_player: "Media Players",
      sensor: "Sensors",
      binary_sensor: "Binary Sensors",
      vacuum: "Vacuums",
      camera: "Cameras",
      other: "Other",
    };
    return Array.from(domainCounts.entries())
      .map(([domain, count]) => ({
        domain,
        label: labelMap[domain] || domain.charAt(0).toUpperCase() + domain.slice(1),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private _clearDeviceFilters(): void {
    this._deviceSearchQuery = "";
    this._deviceRoomFilter = "all";
    this._deviceDomainFilter = "all";
    this._devicePermissionFilter = "all";
  }

  private get _hasActiveDeviceFilters(): boolean {
    return (
      Boolean(this._deviceSearchQuery.trim()) ||
      this._deviceRoomFilter !== "all" ||
      this._deviceDomainFilter !== "all" ||
      this._devicePermissionFilter !== "all"
    );
  }

  private _getFilteredDevices(): HouseholdDevice[] {
    return this._catalogDevices.filter((dev) => {
      if (this._deviceRoomFilter !== "all" && dev.area_name !== this._deviceRoomFilter) {
        return false;
      }
      if (this._deviceDomainFilter !== "all" && dev.domain !== this._deviceDomainFilter) {
        return false;
      }
      if (this._devicePermissionFilter !== "all") {
        const level = this._getEffectiveDeviceLevel(dev);
        if (level !== this._devicePermissionFilter) {
          return false;
        }
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

  private _getGroupedDevices(filteredDevices: HouseholdDevice[]): { area: string; devices: HouseholdDevice[] }[] {
    const groups = new Map<string, HouseholdDevice[]>();
    for (const dev of filteredDevices) {
      const area = dev.area_name || "Unassigned";
      if (!groups.has(area)) {
        groups.set(area, []);
      }
      groups.get(area)!.push(dev);
    }
    const sortedAreas = Array.from(groups.keys()).sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      return a.localeCompare(b);
    });
    return sortedAreas.map((area) => ({
      area,
      devices: groups.get(area)!,
    }));
  }

  private _toggleCollapseArea(area: string): void {
    const next = new Set(this._collapsedAreaNames);
    if (next.has(area)) {
      next.delete(area);
    } else {
      next.add(area);
    }
    this._collapsedAreaNames = next;
  }

  private _toggleExpandDashboardGroup(dashboardId: string): void {
    const next = new Set(this._expandedDashboardGroupIds);
    if (next.has(dashboardId)) {
      next.delete(dashboardId);
    } else {
      next.add(dashboardId);
    }
    this._expandedDashboardGroupIds = next;
  }

  private _getDashboardPermissionSummary(dash: DashboardSummary): {
    label: string;
    level: "control" | "read" | "deny" | "mixed";
  } {
    if (!dash.views || dash.views.length === 0) {
      return { label: "No views", level: "mixed" };
    }
    const levels = dash.views.map((v) => {
      const vRule = this._userPermissionSet?.view_rules?.[v.view_path];
      return (
        vRule?.access_level ||
        (vRule?.effect === "allow" ? "control" : "none")
      );
    });
    if (levels.every((l) => l === "control")) {
      return { label: "All Control", level: "control" };
    }
    if (levels.every((l) => l === "read")) {
      return { label: "All Read", level: "read" };
    }
    if (levels.every((l) => l === "none")) {
      return { label: "All Denied", level: "deny" };
    }
    const active = levels.filter((l) => l === "control" || l === "read").length;
    return {
      label: `${active}/${levels.length} Allowed`,
      level: "mixed",
    };
  }

  private async _handleBulkSetAreaDevices(
    devices: HouseholdDevice[],
    accessLevel: "none" | "read" | "control"
  ): Promise<void> {
    if (!this._selectedUserForPermissions || !devices.length) return;
    this._submitting = true;
    this._error = null;
    try {
      for (const dev of devices) {
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
      }
      this._success = `Updated ${devices.length} devices in area to ${accessLevel}.`;
    } catch (err: any) {
      this._error = this._parseErrorMessage(err, "Failed to update area devices.");
    } finally {
      this._submitting = false;
    }
  }

  private async _handleBulkSetVisibleDevices(
    devices: HouseholdDevice[],
    accessLevel: "none" | "read" | "control"
  ): Promise<void> {
    if (!this._selectedUserForPermissions || !devices.length) return;
    this._submitting = true;
    this._error = null;
    try {
      for (const dev of devices) {
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
      }
      this._success = `Updated ${devices.length} visible devices to ${accessLevel}.`;
    } catch (err: any) {
      this._error = this._parseErrorMessage(err, "Failed to update devices.");
    } finally {
      this._submitting = false;
    }
  }

  private async _handleBulkSetDashboardViews(
    dash: DashboardSummary,
    accessLevel: "none" | "read" | "control"
  ): Promise<void> {
    if (!this._selectedUserForPermissions || !dash.views.length) return;
    this._submitting = true;
    this._error = null;
    try {
      const effect = accessLevel === "none" ? "deny" : "allow";
      for (const v of dash.views) {
        const res = (await this.hass.callWS({
          type: "domolux/permission/set_view_rule",
          user_id: this._selectedUserForPermissions.user_id,
          view_path: v.view_path,
          effect,
          access_level: accessLevel,
        })) as any;
        if (res?.permissions) {
          this._userPermissionSet = res.permissions;
        }
      }
      this._success = `All views in '${dash.title}' updated to ${accessLevel}.`;
    } catch (err: any) {
      this._error = this._parseErrorMessage(err, "Failed to update dashboard views.");
    } finally {
      this._submitting = false;
    }
  }

  private _getFilteredDashboards(): DashboardSummary[] {
    let list = this._catalogDashboards;
    if (this._selectedDashboardId !== "all") {
      list = list.filter((dash) => dash.dashboard_id === this._selectedDashboardId);
    }
    if (this._dashboardSearchQuery.trim()) {
      const q = this._dashboardSearchQuery.toLowerCase();
      list = list
        .map((dash) => {
          const matchTitle =
            dash.title.toLowerCase().includes(q) ||
            dash.dashboard_id.toLowerCase().includes(q);
          const matchingViews = dash.views.filter(
            (v) =>
              v.title.toLowerCase().includes(q) ||
              v.view_path.toLowerCase().includes(q) ||
              v.entities.some((eid) => eid.toLowerCase().includes(q))
          );
          if (matchTitle) return dash;
          if (matchingViews.length > 0) {
            return { ...dash, views: matchingViews };
          }
          return null;
        })
        .filter((dash): dash is DashboardSummary => dash !== null);
    }
    return list;
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
        this._getEffectiveChannelLevel(ch.entity_id, dev)
      );
      if (channelLevels.every((lvl) => lvl === "control")) {
        return "control";
      }
      if (channelLevels.every((lvl) => lvl === "read")) {
        return "read";
      }
    }

    if (dev.area_id) {
      const areaRule = rules.find(
        (r) => r.target_type === "area" && r.target_id === dev.area_id
      );
      if (areaRule) {
        return areaRule.access_level;
      }
    }

    return this._userPermissionSet.default_access_level || "none";
  }

  private _getEffectiveChannelLevel(
    entityId: string,
    dev?: HouseholdDevice
  ): "none" | "read" | "control" {
    if (!this._userPermissionSet) return "none";
    const rules = Object.values(this._userPermissionSet.entity_rules || {});
    // 1. Explicit entity rule
    const rule = rules.find(
      (r) => r.target_type === "entity" && r.target_id === entityId
    );
    if (rule) {
      return rule.access_level;
    }

    // 2. Parent device rule (if dev provided)
    if (dev) {
      const devRule = rules.find(
        (r) =>
          (r.target_type === dev.target_type && r.target_id === dev.target_id) ||
          (r.target_type === "device" && r.target_id === dev.device_id)
      );
      if (devRule) {
        return devRule.access_level;
      }
      // 3. Parent area rule
      if (dev.area_id) {
        const areaRule = rules.find(
          (r) => r.target_type === "area" && r.target_id === dev.area_id
        );
        if (areaRule) {
          return areaRule.access_level;
        }
      }
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
                                  size="s"
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
                                  size="s"
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
                                  size="s"
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
                                  size="s"
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
              <div class="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="perm-dialog-title">
                <div class="dialog-box dialog-full">
                  <div class="dialog-header">
                    <h2 id="perm-dialog-title">
                      Permissions / الصلاحيات —
                      ${this._selectedUserForPermissions.display_name}
                      (@${this._selectedUserForPermissions.username})
                    </h2>
                    <button
                      class="icon-button"
                      @click=${this._closePermissionDialog}
                      title="Close dialog"
                      aria-label="Close dialog"
                    >
                      <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                    </button>
                  </div>

                  <!-- Navigation Tabs: Pinned under header, always visible and accessible -->
                  <div class="permission-tabs" role="tablist" aria-label="Permission categories">
                    <button
                      role="tab"
                      id="tab-devices"
                      aria-selected=${this._activePermissionTab === "devices"}
                      class="tab-btn ${this._activePermissionTab === 'devices' ? 'active' : ''}"
                      @click=${() => {
                        this._activePermissionTab = "devices";
                      }}
                    >
                      <ha-svg-icon .path=${mdiDevices}></ha-svg-icon>
                      <span>Household devices</span>
                      <span class="tab-count-badge">${this._catalogDevices.length}</span>
                    </button>
                    <button
                      role="tab"
                      id="tab-dashboards"
                      aria-selected=${this._activePermissionTab === "dashboards"}
                      class="tab-btn ${this._activePermissionTab === 'dashboards' ? 'active' : ''}"
                      @click=${() => {
                        this._activePermissionTab = "dashboards";
                      }}
                    >
                      <ha-svg-icon .path=${mdiViewDashboard}></ha-svg-icon>
                      <span>Dashboards and views</span>
                      <span class="tab-count-badge">${this._catalogDashboards.length}</span>
                    </button>
                    <button
                      role="tab"
                      id="tab-diagnostics"
                      aria-selected=${this._activePermissionTab === "diagnostics"}
                      class="tab-btn ${this._activePermissionTab === 'diagnostics' ? 'active' : ''}"
                      @click=${() => {
                        this._activePermissionTab = "diagnostics";
                      }}
                    >
                      <ha-svg-icon .path=${mdiTune}></ha-svg-icon>
                      <span>Advanced diagnostics</span>
                    </button>
                  </div>

                  <!-- Controlled scroll container for tab contents -->
                  <div class="dialog-body" role="tabpanel" tabindex="0">
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

  private _renderDeviceCard(dev: HouseholdDevice) {
    const effectiveLevel = this._getEffectiveDeviceLevel(dev);
    const isExpanded = this._expandedDeviceIds.has(dev.device_id);

    return html`
      <div class="device-card" data-device-id=${dev.device_id}>
        <div class="device-main-row">
          <div class="device-icon-container">
            <ha-svg-icon
              .path=${this._getDomainIconPath(dev.domain)}
            ></ha-svg-icon>
          </div>
          <div class="device-info">
            <div class="device-name-row">
              <span class="device-name" title=${dev.name}>${dev.name}</span>
              ${dev.area_name
                ? html`<span class="area-badge">${dev.area_name}</span>`
                : nothing}
              ${dev.target_type === "entity"
                ? html`<span class="standalone-badge">Standalone</span>`
                : nothing}
              ${dev.is_multi_entity
                ? html`<span class="multi-badge">${dev.channels.length} channels</span>`
                : nothing}
            </div>
            <div class="device-meta">
              ${dev.primary_entity_id
                ? html`<span class="entity-id-meta">${dev.primary_entity_id}</span> • `
                : nothing}
              Capabilities: ${dev.capabilities.join(", ")}
            </div>
          </div>
          <div class="device-permission-controls">
            <div class="segmented-control" role="group" aria-label="Device permission for ${dev.name}">
              <button
                class="seg-btn ${effectiveLevel === 'none' ? 'active-deny' : ''}"
                @click=${() => this._handleSetDevicePermission(dev, 'none')}
                .disabled=${this._submitting}
                aria-pressed=${effectiveLevel === 'none'}
              >
                Deny
              </button>
              <button
                class="seg-btn ${effectiveLevel === 'read' ? 'active-read' : ''}"
                @click=${() => this._handleSetDevicePermission(dev, 'read')}
                .disabled=${this._submitting}
                aria-pressed=${effectiveLevel === 'read'}
              >
                Read
              </button>
              <button
                class="seg-btn ${effectiveLevel === 'control' ? 'active-control' : ''}"
                @click=${() => this._handleSetDevicePermission(dev, 'control')}
                .disabled=${this._submitting}
                aria-pressed=${effectiveLevel === 'control'}
              >
                Control
              </button>
            </div>
            ${dev.is_multi_entity
              ? html`
                  <button
                    class="icon-button expand-btn"
                    @click=${() => this._toggleExpandDevice(dev.device_id)}
                    title="${isExpanded ? 'Collapse' : 'Expand'} ${dev.channels.length} channels"
                    aria-expanded=${isExpanded}
                  >
                    <ha-svg-icon
                      .path=${isExpanded ? mdiChevronUp : mdiChevronDown}
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
                  <span>Individual channels (${dev.channels.length})</span>
                  <div class="channels-actions">
                    <ha-button
                      size="s"
                      @click=${() => this._handleSelectAllChannels(dev, 'control')}
                      .disabled=${this._submitting}
                    >
                      Select all control
                    </ha-button>
                    <ha-button
                      size="s"
                      @click=${() => this._handleSelectAllChannels(dev, 'read')}
                      .disabled=${this._submitting}
                    >
                      Select all read
                    </ha-button>
                    <ha-button
                      size="s"
                      @click=${() => this._handleSelectAllChannels(dev, 'none')}
                      .disabled=${this._submitting}
                    >
                      Select all deny
                    </ha-button>
                  </div>
                </div>
                <div class="channels-list">
                  ${dev.channels.map((ch) => {
                    const chLevel = this._getEffectiveChannelLevel(ch.entity_id, dev);
                    return html`
                      <div class="channel-row">
                        <div class="channel-info">
                          <ha-svg-icon
                            .path=${this._getDomainIconPath(ch.domain)}
                          ></ha-svg-icon>
                          <span class="channel-name">${ch.name}</span>
                          <span class="channel-entity-id">(${ch.entity_id})</span>
                        </div>
                        <div class="segmented-control small" role="group" aria-label="Channel permission for ${ch.name}">
                          <button
                            class="seg-btn ${chLevel === 'none' ? 'active-deny' : ''}"
                            @click=${() => this._handleSetChannelPermission(ch, 'none')}
                            .disabled=${this._submitting}
                            aria-pressed=${chLevel === 'none'}
                          >
                            Deny
                          </button>
                          <button
                            class="seg-btn ${chLevel === 'read' ? 'active-read' : ''}"
                            @click=${() => this._handleSetChannelPermission(ch, 'read')}
                            .disabled=${this._submitting}
                            aria-pressed=${chLevel === 'read'}
                          >
                            Read
                          </button>
                          <button
                            class="seg-btn ${chLevel === 'control' ? 'active-control' : ''}"
                            @click=${() => this._handleSetChannelPermission(ch, 'control')}
                            .disabled=${this._submitting}
                            aria-pressed=${chLevel === 'control'}
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
    const availableDomains = this._getAvailableDomains();
    const filteredDevices = this._getFilteredDevices();
    const grouped = this._getGroupedDevices(filteredDevices);

    return html`
      <div class="filter-toolbar sticky-toolbar">
        <div class="toolbar-top-row">
          <div class="search-box">
            <ha-svg-icon .path=${mdiMagnify}></ha-svg-icon>
            <input
              type="text"
              placeholder="Search devices by name, area, ID..."
              .value=${this._deviceSearchQuery}
              @input=${(e: Event) => {
                this._deviceSearchQuery = (e.target as HTMLInputElement).value;
              }}
            />
            ${this._deviceSearchQuery
              ? html`
                  <button
                    class="clear-input-btn"
                    @click=${() => {
                      this._deviceSearchQuery = "";
                    }}
                    title="Clear search"
                  >
                    <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                  </button>
                `
              : nothing}
          </div>
          <div class="toolbar-counts">
            <span class="count-pill">
              ${filteredDevices.length} / ${this._catalogDevices.length} devices
            </span>
            ${filteredDevices.length > 0
              ? html`
                  <div class="bulk-visible-actions">
                    <button
                      class="bulk-action-btn bulk-control"
                      @click=${() => this._handleBulkSetVisibleDevices(filteredDevices, 'control')}
                      .disabled=${this._submitting}
                      title="Set all ${filteredDevices.length} visible devices to Control"
                    >
                      <ha-svg-icon .path=${mdiCheckAll}></ha-svg-icon>
                      <span>All Control</span>
                    </button>
                    <button
                      class="bulk-action-btn bulk-read"
                      @click=${() => this._handleBulkSetVisibleDevices(filteredDevices, 'read')}
                      .disabled=${this._submitting}
                      title="Set all ${filteredDevices.length} visible devices to Read"
                    >
                      <ha-svg-icon .path=${mdiEyeOutline}></ha-svg-icon>
                      <span>All Read</span>
                    </button>
                    <button
                      class="bulk-action-btn bulk-deny"
                      @click=${() => this._handleBulkSetVisibleDevices(filteredDevices, 'none')}
                      .disabled=${this._submitting}
                      title="Set all ${filteredDevices.length} visible devices to Deny"
                    >
                      <ha-svg-icon .path=${mdiMinusCircleOutline}></ha-svg-icon>
                      <span>All Deny</span>
                    </button>
                  </div>
                `
              : nothing}
          </div>
        </div>

        <div class="toolbar-filter-row">
          <div class="filter-dropdown room-filter">
            <label>Room:</label>
            <select
              .value=${this._deviceRoomFilter}
              @change=${(e: Event) => {
                this._deviceRoomFilter = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="all">All rooms (${availableRooms.length})</option>
              ${availableRooms.map(
                (room) => html`<option value=${room}>${room}</option>`
              )}
            </select>
          </div>

          <div class="filter-dropdown category-filter">
            <label>Category:</label>
            <select
              .value=${this._deviceDomainFilter}
              @change=${(e: Event) => {
                this._deviceDomainFilter = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="all">All categories</option>
              ${availableDomains.map(
                (d) => html`<option value=${d.domain}>${d.label} (${d.count})</option>`
              )}
            </select>
          </div>

          <div class="filter-dropdown permission-filter">
            <label>Permission:</label>
            <select
              .value=${this._devicePermissionFilter}
              @change=${(e: Event) => {
                this._devicePermissionFilter = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="all">All permissions</option>
              <option value="control">Control only</option>
              <option value="read">Read only</option>
              <option value="none">Denied only</option>
            </select>
          </div>

          ${this._hasActiveDeviceFilters
            ? html`
                <button
                  class="clear-filters-btn"
                  @click=${this._clearDeviceFilters}
                  title="Reset all filters"
                >
                  <ha-svg-icon .path=${mdiFilterRemoveOutline}></ha-svg-icon>
                  <span>Clear filters</span>
                </button>
              `
            : nothing}
        </div>
      </div>

      ${filteredDevices.length === 0
        ? html`
            <div class="empty-state">
              <p>
                ${this._catalogDevices.length === 0
                  ? "No household devices found."
                  : "No household devices match the selected filters."}
              </p>
              ${this._hasActiveDeviceFilters
                ? html`
                    <button class="link-btn" @click=${this._clearDeviceFilters}>
                      Reset filters
                    </button>
                  `
                : nothing}
            </div>
          `
        : html`
            <div class="device-list">
              ${grouped.map((group) => {
                const isAreaCollapsed = this._collapsedAreaNames.has(group.area);
                return html`
                  <div class="area-group">
                    <div
                      class="area-group-header"
                      @click=${() => this._toggleCollapseArea(group.area)}
                      role="button"
                      tabindex="0"
                      aria-expanded=${!isAreaCollapsed}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          this._toggleCollapseArea(group.area);
                        }
                      }}
                    >
                      <ha-svg-icon
                        .path=${isAreaCollapsed ? mdiChevronDown : mdiChevronUp}
                        class="area-chevron"
                      ></ha-svg-icon>
                      <span class="area-group-title">${group.area}</span>
                      <span class="area-group-count">
                        ${group.devices.length} ${group.devices.length === 1 ? 'device' : 'devices'}
                      </span>
                      <div
                        class="area-group-actions"
                        @click=${(e: Event) => e.stopPropagation()}
                      >
                        <button
                          class="mini-action-btn"
                          @click=${() => this._handleBulkSetAreaDevices(group.devices, 'control')}
                          .disabled=${this._submitting}
                          title="Set all devices in ${group.area} to Control"
                        >
                          All Control
                        </button>
                        <button
                          class="mini-action-btn action-read"
                          @click=${() => this._handleBulkSetAreaDevices(group.devices, 'read')}
                          .disabled=${this._submitting}
                          title="Set all devices in ${group.area} to Read"
                        >
                          All Read
                        </button>
                        <button
                          class="mini-action-btn"
                          @click=${() => this._handleBulkSetAreaDevices(group.devices, 'none')}
                          .disabled=${this._submitting}
                          title="Set all devices in ${group.area} to Deny"
                        >
                          All Deny
                        </button>
                      </div>
                    </div>
                    ${!isAreaCollapsed
                      ? html`
                          <div class="area-device-items">
                            ${group.devices.map((dev) => this._renderDeviceCard(dev))}
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

    const filteredDashboards = this._getFilteredDashboards();

    return html`
      <div class="filter-toolbar sticky-toolbar">
        <div class="toolbar-top-row">
          <div class="search-box">
            <ha-svg-icon .path=${mdiMagnify}></ha-svg-icon>
            <input
              type="text"
              placeholder="Search dashboards and views..."
              .value=${this._dashboardSearchQuery}
              @input=${(e: Event) => {
                this._dashboardSearchQuery = (e.target as HTMLInputElement).value;
              }}
            />
            ${this._dashboardSearchQuery
              ? html`
                  <button
                    class="clear-input-btn"
                    @click=${() => {
                      this._dashboardSearchQuery = "";
                    }}
                    title="Clear search"
                  >
                    <ha-svg-icon .path=${mdiClose}></ha-svg-icon>
                  </button>
                `
              : nothing}
          </div>
          <div class="room-filter dashboard-select-container">
            <select
              class="dashboard-select"
              .value=${this._selectedDashboardId}
              @change=${(e: Event) => {
                this._selectedDashboardId = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="all">
                All dashboards (${this._catalogDashboards.length})
              </option>
              ${this._catalogDashboards.map(
                (dash) =>
                  html`<option value=${dash.dashboard_id}>
                    ${dash.title} (${dash.views.length})
                  </option>`
              )}
            </select>
          </div>
        </div>

        <div class="dashboard-selector-chips">
          <button
            class="dash-chip ${this._selectedDashboardId === 'all' ? 'active' : ''}"
            @click=${() => {
              this._selectedDashboardId = "all";
            }}
          >
            <ha-svg-icon .path=${mdiLayersOutline}></ha-svg-icon>
            <span>All dashboards</span>
            <span class="chip-count">${this._catalogDashboards.length}</span>
          </button>
          ${this._catalogDashboards.map(
            (dash) => html`
              <button
                class="dash-chip ${this._selectedDashboardId === dash.dashboard_id ? 'active' : ''}"
                @click=${() => {
                  this._selectedDashboardId = dash.dashboard_id;
                  const next = new Set(this._expandedDashboardGroupIds);
                  next.add(dash.dashboard_id);
                  this._expandedDashboardGroupIds = next;
                }}
              >
                <ha-svg-icon .path=${mdiViewDashboard}></ha-svg-icon>
                <span>${dash.title}</span>
                <span class="chip-count">${dash.views.length}</span>
              </button>
            `
          )}
        </div>
      </div>

      ${filteredDashboards.length === 0
        ? html`
            <div class="empty-state">
              <p>No dashboards match the selected search or filter.</p>
              ${this._dashboardSearchQuery || this._selectedDashboardId !== 'all'
                ? html`
                    <button
                      class="link-btn"
                      @click=${() => {
                        this._dashboardSearchQuery = "";
                        this._selectedDashboardId = "all";
                      }}
                    >
                      Show all dashboards
                    </button>
                  `
                : nothing}
            </div>
          `
        : html`
            <div class="dashboards-list">
              ${filteredDashboards.map((dash) => {
                const isGroupExpanded =
                  this._selectedDashboardId === dash.dashboard_id ||
                  this._dashboardSearchQuery.trim() !== "" ||
                  this._expandedDashboardGroupIds.has(dash.dashboard_id);
                const summary = this._getDashboardPermissionSummary(dash);

                return html`
                  <div
                    class="dashboard-block ${isGroupExpanded ? 'expanded' : 'collapsed'}"
                    data-dashboard-id=${dash.dashboard_id}
                  >
                    <div
                      class="dashboard-header-row ${this._selectedDashboardId === dash.dashboard_id ? 'selected-focus' : ''}"
                      @click=${() => this._toggleExpandDashboardGroup(dash.dashboard_id)}
                      role="button"
                      tabindex="0"
                      aria-expanded=${isGroupExpanded}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          this._toggleExpandDashboardGroup(dash.dashboard_id);
                        }
                      }}
                    >
                      <ha-svg-icon
                        .path=${isGroupExpanded ? mdiChevronUp : mdiChevronDown}
                        class="dash-chevron"
                      ></ha-svg-icon>
                      <div class="dashboard-title-info">
                        <ha-svg-icon .path=${mdiLayersOutline}></ha-svg-icon>
                        <h3>${dash.title}</h3>
                        <span class="views-count-badge">
                          ${dash.views.length} ${dash.views.length === 1 ? 'view' : 'views'}
                        </span>
                        <span class="permission-summary-badge summary-${summary.level}">
                          ${summary.label}
                        </span>
                      </div>
                      <div
                        class="dashboard-bulk-actions"
                        @click=${(e: Event) => e.stopPropagation()}
                      >
                        <button
                          class="mini-action-btn action-control"
                          @click=${() => this._handleBulkSetDashboardViews(dash, 'control')}
                          .disabled=${this._submitting}
                          title="Set all views in '${dash.title}' to Control"
                        >
                          All Control
                        </button>
                        <button
                          class="mini-action-btn action-read"
                          @click=${() => this._handleBulkSetDashboardViews(dash, 'read')}
                          .disabled=${this._submitting}
                          title="Set all views in '${dash.title}' to Read"
                        >
                          All Read
                        </button>
                        <button
                          class="mini-action-btn action-deny"
                          @click=${() => this._handleBulkSetDashboardViews(dash, 'none')}
                          .disabled=${this._submitting}
                          title="Set all views in '${dash.title}' to Deny"
                        >
                          All Deny
                        </button>
                      </div>
                    </div>

                    <div class="views-grid" ?hidden=${!isGroupExpanded}>
                      ${dash.views.map((v) => {
                        const vRule = this._userPermissionSet?.view_rules?.[v.view_path];
                        const vEffect =
                          vRule?.access_level ||
                          (vRule?.effect === "allow" ? "control" : "none");
                        const isEntitiesExpanded = this._expandedDashboardIds.has(v.view_path);

                        return html`
                          <div class="view-card" data-view-path=${v.view_path}>
                            <div class="view-card-header">
                              <div class="view-title-row">
                                <ha-svg-icon .path=${mdiViewDashboard}></ha-svg-icon>
                                <div class="view-title-wrap">
                                  <span class="view-title">${v.title}</span>
                                  <span class="view-path-meta">${v.view_path}</span>
                                </div>
                              </div>
                              <div class="segmented-control" role="group" aria-label="View permission for ${v.title}">
                                <button
                                  class="seg-btn ${vEffect === 'none' ? 'active-deny' : ''}"
                                  @click=${() => this._handleSetViewRuleDirect(v.view_path, 'none')}
                                  .disabled=${this._submitting}
                                  aria-pressed=${vEffect === 'none'}
                                >
                                  Deny
                                </button>
                                <button
                                  class="seg-btn ${vEffect === 'read' ? 'active-read' : ''}"
                                  @click=${() => this._handleSetViewRuleDirect(v.view_path, 'read')}
                                  .disabled=${this._submitting}
                                  aria-pressed=${vEffect === 'read'}
                                >
                                  Read
                                </button>
                                <button
                                  class="seg-btn ${vEffect === 'control' ? 'active-control' : ''}"
                                  @click=${() => this._handleSetViewRuleDirect(v.view_path, 'control')}
                                  .disabled=${this._submitting}
                                  aria-pressed=${vEffect === 'control'}
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
                                      @click=${() => this._toggleExpandDashboard(v.view_path)}
                                      aria-expanded=${isEntitiesExpanded}
                                    >
                                      <ha-svg-icon
                                        .path=${isEntitiesExpanded ? mdiChevronUp : mdiChevronDown}
                                      ></ha-svg-icon>
                                      <span>
                                        ${v.entities.length} referenced ${v.entities.length === 1 ? 'device / entity' : 'devices / entities'}
                                      </span>
                                    </button>
                                    ${isEntitiesExpanded
                                      ? html`
                                          <div class="view-entities-list">
                                            ${v.entities.map((eid) => {
                                              const overrideLevel = this._getExplicitEntityOverrideLevel(eid);
                                              return html`
                                                <div class="view-entity-item">
                                                  <span class="view-entity-name" title=${eid}>
                                                    ${this._lookupDeviceOrEntityName(eid)}
                                                  </span>
                                                  <div class="override-selector">
                                                    <select
                                                      .value=${overrideLevel || 'inherited'}
                                                      @change=${(e: Event) =>
                                                        this._handleSetEntityOverride(
                                                          eid,
                                                          (e.target as HTMLSelectElement).value
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
                `;
              })}
            </div>
          `}
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
          Object.keys(this._userPermissionSet.entity_rules || {}).length === 0
            ? html`<p class="empty-state-text"
                >No entity rules / لا توجد قواعد</p
              >`
            : nothing}
          <div class="rules-list">
            ${this._userPermissionSet
              ? Object.values(this._userPermissionSet.entity_rules || {}).map(
                  (rule) => html`
                    <div class="rule-row">
                      <span>
                        <strong>${rule.target_type}</strong>/${rule.target_id} →
                        ${rule.access_level}
                      </span>
                      <ha-button
                        size="s"
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
              ? Object.values(this._userPermissionSet.view_rules || {}).map(
                  (rule) => html`
                    <div class="rule-row">
                      <span>
                        <strong>${rule.view_path}</strong>
                        → ${rule.effect}
                      </span>
                      <ha-button
                        size="s"
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
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 16px;
      box-sizing: border-box;
      backdrop-filter: blur(2px);
    }

    .dialog-box {
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #000);
      border-radius: 12px;
      width: 100%;
      max-width: 480px;
      max-height: calc(100vh - 48px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.28);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .dialog-box.dialog-full {
      max-width: 1080px;
      width: min(1080px, calc(100vw - 32px));
      height: min(880px, calc(100vh - 48px));
      max-height: calc(100vh - 48px);
      border-radius: 14px;
    }

    @supports (height: 100dvh) {
      .dialog-box.dialog-full {
        height: min(880px, calc(100dvh - 48px));
        max-height: calc(100dvh - 48px);
      }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      flex-shrink: 0;
      background: var(--card-background-color, #fff);
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--primary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .icon-button {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s, color 0.15s;
    }

    .icon-button:hover {
      background-color: var(--secondary-background-color, #f0f0f0);
      color: var(--primary-text-color);
    }

    .dialog-body {
      padding: 0 20px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: var(--divider-color, #ccc) transparent;
    }

    .dialog-body::-webkit-scrollbar {
      width: 6px;
    }

    .dialog-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .dialog-body::-webkit-scrollbar-thumb {
      background-color: var(--divider-color, #ccc);
      border-radius: 3px;
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
      padding: 8px 20px;
      background: var(--secondary-background-color, #fafafa);
      flex-shrink: 0;
      flex-wrap: wrap;
      align-items: center;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: 7px 14px;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      background-color: var(--secondary-background-color, #f0f0f0);
      color: var(--primary-text-color);
    }

    .tab-btn.active {
      color: var(--primary-color);
      background-color: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      border-color: var(--primary-color);
      font-weight: 600;
    }

    .tab-count-badge {
      font-size: 0.72rem;
      padding: 1px 6px;
      border-radius: 10px;
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color);
      font-weight: 600;
    }

    .tab-btn.active .tab-count-badge {
      background: var(--primary-color);
      color: #fff;
    }

    /* Sticky Toolbar */
    .filter-toolbar.sticky-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--card-background-color, #fff);
      margin: 0 -20px;
      padding: 14px 20px 12px 20px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toolbar-top-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .toolbar-filter-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .toolbar-counts {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .count-pill {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--secondary-text-color);
      background: var(--secondary-background-color, #f0f0f0);
      padding: 4px 10px;
      border-radius: 12px;
      white-space: nowrap;
    }

    .bulk-visible-actions {
      display: flex;
      gap: 6px;
    }

    .bulk-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--primary-text-color);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .bulk-action-btn ha-svg-icon {
      --mdc-icon-size: 16px;
    }

    .bulk-control:hover:not(:disabled) {
      background: var(--success-color, #4caf50);
      border-color: var(--success-color, #4caf50);
      color: #fff;
    }

    .bulk-read:hover:not(:disabled) {
      background: var(--info-color, #2196f3);
      border-color: var(--info-color, #2196f3);
      color: #fff;
    }

    .bulk-deny:hover:not(:disabled) {
      background: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
      color: #fff;
    }

    .clear-filters-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px dashed var(--divider-color, #ccc);
      background: transparent;
      color: var(--secondary-text-color);
      font-size: 0.82rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clear-filters-btn:hover {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
      background: rgba(219, 68, 55, 0.05);
    }

    .filter-dropdown {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-dropdown label {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      white-space: nowrap;
    }

    .filter-dropdown select {
      padding: 6px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 0.85rem;
      cursor: pointer;
    }

    .clear-input-btn {
      background: none;
      border: none;
      padding: 2px;
      cursor: pointer;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .clear-input-btn:hover {
      color: var(--primary-text-color);
    }

    .link-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      text-decoration: underline;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 4px;
    }

    .search-box {
      flex: 1;
      min-width: 200px;
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      padding: 6px 10px;
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
      font-size: 0.92rem;
    }

    /* Device List & Area Groups */
    .device-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .area-group {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .area-group-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: var(--secondary-background-color, #f7f7f7);
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
      user-select: none;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .area-group-header:hover {
      background: var(--secondary-background-color, #efefef);
    }

    .area-chevron {
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }

    .area-group-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .area-group-count {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      padding: 1px 8px;
    }

    .area-group-actions {
      margin-left: auto;
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .mini-action-btn {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--primary-text-color);
      padding: 3px 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .mini-action-btn:hover:not(:disabled) {
      background: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .area-device-items {
      display: flex;
      flex-direction: column;
    }

    .area-device-items .device-card {
      border: none;
      border-radius: 0;
    }

    .area-device-items .device-card:not(:last-child) {
      border-bottom: 1px solid var(--divider-color, #f0f0f0);
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
      padding: 10px 16px;
    }

    .device-icon-container {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background-color: var(--secondary-background-color, #f0f0f0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .device-info {
      flex: 1 1 0%;
      min-width: 0;
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
      font-size: 0.95rem;
      color: var(--primary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .area-badge {
      background: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      color: var(--primary-color);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 500;
    }

    .multi-badge {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 500;
    }

    .standalone-badge {
      background: var(--warning-color-subtle, rgba(255, 152, 0, 0.14));
      color: var(--warning-color, #ff9800);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 500;
    }

    .entity-id-meta {
      font-family: var(--code-font-family, monospace);
      font-size: 0.72rem;
      color: var(--secondary-text-color);
    }

    .device-meta {
      font-size: 0.78rem;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .device-permission-controls {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2, 8px);
      flex-shrink: 0;
    }

    /* Segmented Control */
    .segmented-control {
      display: inline-flex;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      overflow: hidden;
      background: var(--secondary-background-color, #f9f9f9);
      flex-shrink: 0;
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
      transition: background-color 0.15s, color 0.15s;
      user-select: none;
    }

    .segmented-control.small .seg-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
    }

    .seg-btn:not(:last-child) {
      border-right: 1px solid var(--divider-color, #ccc);
    }

    .seg-btn:hover:not(:disabled) {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .seg-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    .seg-btn.active-deny {
      background-color: var(--error-color, #db4437);
      color: #fff;
      font-weight: 600;
    }

    .seg-btn.active-read {
      background-color: var(--primary-color, #03a9f4);
      color: #fff;
      font-weight: 600;
    }

    .seg-btn.active-control {
      background-color: var(--success-color, #4caf50);
      color: #fff;
      font-weight: 600;
    }

    /* Channels Expansion */
    .channels-expansion {
      background-color: var(--secondary-background-color, #fbfbfb);
      border-top: 1px solid var(--divider-color, #e0e0e0);
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .channels-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }

    .channels-actions {
      display: flex;
      gap: var(--ha-space-2, 8px);
    }

    .channels-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .channel-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 10px;
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
      font-size: 0.88rem;
      font-weight: 500;
    }

    .channel-entity-id {
      font-family: var(--code-font-family, monospace);
      font-size: 0.72rem;
      color: var(--secondary-text-color);
    }

    /* Dashboards Tab */
    .dashboard-select-container select {
      padding: 6px 10px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 6px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 0.85rem;
    }

    .dashboard-selector-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
    }

    .dash-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid var(--divider-color, #ccc);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s, border-color 0.15s, color 0.15s;
    }

    .dash-chip:hover {
      background: var(--secondary-background-color, #f5f5f5);
    }

    .dash-chip.active {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: #fff;
    }

    .dash-chip.active .chip-count {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
    }

    .chip-count {
      background: var(--secondary-background-color, #e0e0e0);
      color: var(--secondary-text-color);
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .dashboards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dashboard-block {
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 10px;
      background: var(--card-background-color, #fff);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .dashboard-block.expanded {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-color: var(--primary-color-subtle, #b3e5fc);
    }

    .dashboard-header-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: var(--secondary-background-color, #f7f7f7);
      user-select: none;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .dashboard-header-row:hover {
      background: var(--secondary-background-color, #efefef);
    }

    .dash-chevron {
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }

    .dashboard-title-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      flex-wrap: wrap;
      color: var(--primary-text-color);
    }

    .dashboard-title-info h3 {
      margin: 0;
      font-size: 0.98rem;
      font-weight: 600;
    }

    .views-count-badge {
      font-size: 0.72rem;
      font-weight: 500;
      background: var(--primary-color-subtle, rgba(3, 169, 244, 0.12));
      color: var(--primary-color);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .permission-summary-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-control {
      background: rgba(76, 175, 80, 0.15);
      color: var(--success-color, #4caf50);
    }

    .summary-read {
      background: rgba(3, 169, 244, 0.15);
      color: var(--primary-color, #03a9f4);
    }

    .summary-deny {
      background: rgba(219, 68, 55, 0.15);
      color: var(--error-color, #db4437);
    }

    .summary-mixed {
      background: rgba(255, 152, 0, 0.15);
      color: var(--warning-color, #ff9800);
    }

    .dashboard-bulk-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .views-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px 16px;
      border-top: 1px solid var(--divider-color, #e0e0e0);
      background: var(--card-background-color, #fff);
    }

    .views-grid[hidden] {
      display: none !important;
    }

    .view-card {
      border: 1px solid var(--divider-color, #e8e8e8);
      border-radius: 8px;
      background: var(--card-background-color, #fff);
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .view-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .view-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .view-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .view-title {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .view-path-meta {
      font-family: var(--code-font-family, monospace);
      font-size: 0.72rem;
      color: var(--secondary-text-color);
    }

    .view-entities-section {
      border-top: 1px dashed var(--divider-color, #e0e0e0);
      padding-top: 8px;
      margin-top: 2px;
    }

    .expand-entities-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--secondary-text-color);
      font-size: 0.82rem;
      padding: 0;
    }

    .expand-entities-toggle:hover {
      color: var(--primary-color);
    }

    .view-entities-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
      padding-left: 8px;
    }

    .view-entity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 10px;
      border-radius: 6px;
      background: var(--secondary-background-color, #fbfbfb);
    }

    .view-entity-name {
      font-size: 0.82rem;
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
      gap: 10px;
      padding: 12px 20px;
      background: var(--secondary-background-color, #f9f9f9);
      border-top: 1px solid var(--divider-color, #e0e0e0);
      flex-shrink: 0;
    }

    /* Responsive Rules */
    @media (max-width: 768px) {
      .dialog-backdrop {
        padding: 0;
      }

      .dialog-box.dialog-full {
        width: 100vw;
        height: 100dvh;
        max-height: 100dvh;
        border-radius: 0;
      }

      .dialog-header {
        padding: 12px 16px;
      }

      .permission-tabs {
        padding: 8px 14px;
        gap: 6px;
        overflow-x: auto;
        flex-wrap: nowrap;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      .permission-tabs::-webkit-scrollbar {
        display: none;
      }

      .tab-btn {
        padding: 8px 12px;
        white-space: nowrap;
        min-height: 44px;
      }

      .dialog-body {
        padding: 0 14px 14px 14px;
      }

      .filter-toolbar.sticky-toolbar {
        top: 0;
        margin: 0 -14px;
        padding: 10px 14px;
      }

      .toolbar-top-row {
        flex-direction: column;
        align-items: stretch;
      }

      .toolbar-counts {
        margin-left: 0;
        justify-content: space-between;
      }

      .toolbar-filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-dropdown {
        justify-content: space-between;
      }

      .filter-dropdown select {
        flex: 1;
        max-width: 65%;
      }

      .device-main-row {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .device-permission-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .segmented-control {
        flex: 1;
        display: flex;
      }

      .segmented-control .seg-btn {
        flex: 1;
        text-align: center;
        padding: 10px 4px;
        min-height: 44px; /* Hit target >= 44px */
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-button.expand-btn {
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .dashboard-header-row {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
      }

      .dashboard-bulk-actions {
        justify-content: flex-end;
      }

      .view-card-header {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .view-card-header .segmented-control {
        width: 100%;
      }

      .view-card-header .segmented-control .seg-btn {
        flex: 1;
        min-height: 44px;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-domolux-family-manager": HaDomoluxFamilyManager;
  }
}
