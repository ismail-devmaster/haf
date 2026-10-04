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
} from "@mdi/js";

import "../../../components/ha-card";
import "../../../components/ha-button";
import "../../../components/ha-alert";
import "../../../components/ha-svg-icon";
import "../../../components/progress/ha-progress-ring";
import type { HomeAssistant } from "../../../types";
import {
  getDomoluxRole,
  type DomoluxRoleInfo,
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

  private _handleToggleStatusClick(e: Event): void {
    const member = (e.currentTarget as any).member as DomoluxFamilyMember;
    if (member) {
      this._handleToggleStatus(member);
    }
  }

  private _openPasswordDialogClick(e: Event): void {
    const member = (e.currentTarget as any).member as DomoluxFamilyMember;
    if (member) {
      this._openPasswordDialog(member);
    }
  }

  private _handleDeleteMemberClick(e: Event): void {
    const member = (e.currentTarget as any).member as DomoluxFamilyMember;
    if (member) {
      this._openDeleteDialog(member);
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
                                  .member=${member}
                                  @click=${this._handleToggleStatusClick}
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
                                  .member=${member}
                                  @click=${this._openPasswordDialogClick}
                                >
                                  <ha-svg-icon
                                    .path=${mdiKeyVariant}
                                    slot="start"
                                  ></ha-svg-icon>
                                  Password / كلمة السر
                                </ha-button>
                                <ha-button
                                  size="small"
                                  class="destructive"
                                  .disabled=${this._submitting}
                                  .member=${member}
                                  @click=${this._handleDeleteMemberClick}
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
      </div>
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
