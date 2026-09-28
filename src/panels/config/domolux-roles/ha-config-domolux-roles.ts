import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { mdiAccountCheck, mdiAccountRemove, mdiShieldAccount, mdiAlertCircle } from "@mdi/js";

import "../../../components/ha-card";
import "../../../components/ha-button";
import "../../../components/ha-alert";
import "../../../components/ha-svg-icon";
import "../../../components/progress/ha-progress-ring";
import { showConfirmationDialog } from "../../../dialogs/generic/show-dialog-box";
import type { HomeAssistant } from "../../../types";

export interface DomoluxEligibleUser {
  id: string;
  name: string;
  username: string | null;
}

export interface DomoluxRoleGetResult {
  user_id: string;
  role: string;
  is_father: boolean;
  father_assigned: boolean;
}

@customElement("ha-config-domolux-roles")
export class HaConfigDomoluxRoles extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _loading = true;

  @state() private _submitting = false;

  @state() private _error: string | null = null;

  @state() private _success: string | null = null;

  @state() private _isFatherAssigned = false;

  @state() private _fatherUserName: string | null = null;

  @state() private _eligibleUsers: DomoluxEligibleUser[] = [];

  @state() private _selectedUserId = "";

  protected firstUpdated(): void {
    this._loadData();
  }

  private async _loadData(): Promise<void> {
    this._loading = true;
    this._error = null;

    if (!this.hass.user?.is_admin) {
      this._loading = false;
      return;
    }

    try {
      // 1. Fetch current role status
      const roleResult = (await this.hass.callWS({
        type: "domolux/role/get",
      })) as DomoluxRoleGetResult;

      this._isFatherAssigned = roleResult.father_assigned;

      // 2. Fetch list of eligible users
      const users = (await this.hass.callWS({
        type: "domolux/users/list",
      })) as DomoluxEligibleUser[];

      this._eligibleUsers = users || [];

      // Find father user details if assigned
      if (this._isFatherAssigned) {
        const matched = this._eligibleUsers.find((u) => u.id === roleResult.user_id);
        if (matched) {
          this._fatherUserName = matched.name || matched.username || matched.id;
        } else {
          this._fatherUserName = "Household Father / الأب المسؤول";
        }
      } else {
        this._fatherUserName = null;
      }
    } catch (err: any) {
      this._error = err?.message || "Failed to load Domolux Roles configuration from backend.";
    } finally {
      this._loading = false;
    }
  }

  private _handleUserSelect(ev: CustomEvent): void {
    this._selectedUserId = (ev.target as HTMLSelectElement).value;
  }

  private async _handleAssignClick(): Promise<void> {
    if (!this._selectedUserId) {
      this._error = "Please select a user to assign as Father.";
      return;
    }

    const selectedUser = this._eligibleUsers.find((u) => u.id === this._selectedUserId);
    const userName = selectedUser ? selectedUser.name || selectedUser.username : "selected user";

    if (this._isFatherAssigned) {
      // Confirm replacement
      const confirmed = await showConfirmationDialog(this, {
        title: "Replace Father Role / تغيير الأب المسؤول",
        text: `Are you sure you want to transfer the Father role to ${userName}? The existing Father assignment will be revoked.`,
        confirmText: "Replace / تغيير",
        dismissText: "Cancel / إلغاء",
        destructive: true,
      });

      if (!confirmed) {
        return;
      }
    }

    await _executeAssign(this, this._selectedUserId);
  }

  private _dismissError(): void {
    this._error = null;
  }

  private _dismissSuccess(): void {
    this._success = null;
  }

  private async _handleRemoveClick(): Promise<void> {
    const confirmed = await showConfirmationDialog(this, {
      title: "Remove Father Role / إزالة الأب المسؤول",
      text: "Are you sure you want to remove the Father role? The household will return to an unassigned status.",
      confirmText: "Remove / إزالة",
      dismissText: "Cancel / إلغاء",
      destructive: true,
    });

    if (!confirmed) {
      return;
    }

    this._submitting = true;
    this._error = null;
    this._success = null;

    try {
      await this.hass.callWS({
        type: "domolux/role/remove_father",
      });

      this._success = "Father role removed successfully.";
      this._selectedUserId = "";
      await this._loadData();
    } catch (err: any) {
      this._error = err?.message || "Failed to remove Father role.";
    } finally {
      this._submitting = false;
    }
  }

  protected render() {
    // Security check: Server-side authorization fallback
    if (!this.hass.user?.is_admin) {
      return html`
        <div class="content" dir="auto">
          <ha-alert alert-type="warning" title="Access Denied / غير مصرح">
            Administrator privileges are required to view or configure Domolux Application Roles.
            يلزم وجود صلاحيات مسؤول لإدارة أدوار دومولوكس.
          </ha-alert>
        </div>
      `;
    }

    if (this._loading) {
      return html`
        <div class="loading-container">
          <ha-progress-ring active></ha-progress-ring>
          <p>Loading Domolux Roles configuration...</p>
        </div>
      `;
    }

    return html`
      <div class="content" dir="auto">
        <div class="header-section">
          <ha-svg-icon .path=${mdiShieldAccount} class="header-icon"></ha-svg-icon>
          <div>
            <h1>Domolux Role Management / إدارة أدوار دومولوكس</h1>
            <p class="subtitle">
              Configure the primary Household Father role for access control.
              تعيين الأب المسؤول للمنزل لإدارة الصلاحيات.
            </p>
          </div>
        </div>

        ${this._error
          ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this._dismissError}>
              ${this._error}
            </ha-alert>`
          : nothing}
        ${this._success
          ? html`<ha-alert alert-type="success" dismissable @alert-dismissed-clicked=${this._dismissSuccess}>
              ${this._success}
            </ha-alert>`
          : nothing}

        <!-- Card 1: Current Status -->
        <ha-card header="Current Father Assignment / الأب الحالي">
          <div class="card-content">
            ${this._isFatherAssigned
              ? html`
                  <div class="status-box active">
                    <ha-svg-icon .path=${mdiAccountCheck} class="status-icon active"></ha-svg-icon>
                    <div class="status-info">
                      <span class="status-title">${this._fatherUserName}</span>
                      <span class="status-badge">Active Father / الأب المسؤول الحالي</span>
                    </div>
                    <ha-button
                      class="destructive"
                      .disabled=${this._submitting}
                      @click=${this._handleRemoveClick}
                    >
                      <ha-svg-icon .path=${mdiAccountRemove} slot="start"></ha-svg-icon>
                      Remove Role / إزالة
                    </ha-button>
                  </div>
                `
              : html`
                  <div class="status-box unassigned">
                    <ha-svg-icon .path=${mdiAlertCircle} class="status-icon unassigned"></ha-svg-icon>
                    <div class="status-info">
                      <span class="status-title">No Father Assigned / لم يتم تعيين أب مسؤول</span>
                      <span class="status-subtitle">Select an eligible user below to assign the role.</span>
                    </div>
                  </div>
                `}
          </div>
        </ha-card>

        <!-- Card 2: Assign / Replace -->
        <ha-card header=${this._isFatherAssigned ? "Replace Father Role / تغيير الأب" : "Assign Father Role / تعيين الأب"}>
          <div class="card-content">
            ${this._eligibleUsers.length === 0
              ? html`
                  <p class="empty-state">
                    No eligible non-administrator users available for Father assignment. Create a regular Home Assistant user first.
                  </p>
                `
              : html`
                  <div class="form-row">
                    <label for="user-select" class="form-label">
                      Select Household Member / اختر فرد من العائلة:
                    </label>
                    <select
                      id="user-select"
                      class="user-select-dropdown"
                      .value=${this._selectedUserId}
                      @change=${this._handleUserSelect}
                      .disabled=${this._submitting}
                    >
                      <option value="">-- Choose User / اختر مستخدم --</option>
                      ${this._eligibleUsers.map(
                        (u) => html`
                          <option value=${u.id}>
                            ${u.name}${u.username ? ` (@${u.username})` : ""}
                          </option>
                        `
                      )}
                    </select>

                    <ha-button
                      raised
                      .disabled=${!this._selectedUserId || this._submitting}
                      @click=${this._handleAssignClick}
                    >
                      ${this._isFatherAssigned ? "Replace Father / تغيير الأب" : "Assign Role / تعيين"}
                    </ha-button>
                  </div>
                `}
          </div>
        </ha-card>
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
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
      }

      .header-section {
        display: flex;
        align-items: center;
        gap: var(--ha-space-4, 16px);
        margin-bottom: var(--ha-space-2, 8px);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        color: var(--primary-color);
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

      ha-card {
        border-radius: var(--ha-card-border-radius, 12px);
      }

      .card-content {
        padding: var(--ha-space-4, 16px);
      }

      .status-box {
        display: flex;
        align-items: center;
        padding: var(--ha-space-4, 16px);
        border-radius: 8px;
        gap: var(--ha-space-4, 16px);
      }

      .status-box.active {
        background-color: var(--state-active-color, rgba(3, 169, 244, 0.1));
        border: 1px solid var(--primary-color);
      }

      .status-box.unassigned {
        background-color: var(--warning-color-subtle, rgba(255, 152, 0, 0.1));
        border: 1px solid var(--warning-color, #ff9800);
      }

      .status-icon {
        width: 36px;
        height: 36px;
      }

      .status-icon.active {
        color: var(--primary-color);
      }

      .status-icon.unassigned {
        color: var(--warning-color, #ff9800);
      }

      .status-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .status-title {
        font-size: 1.1rem;
        font-weight: 600;
      }

      .status-badge {
        font-size: 0.85rem;
        color: var(--primary-color);
        font-weight: 500;
      }

      .status-subtitle {
        font-size: 0.85rem;
        color: var(--secondary-text-color);
      }

      .form-row {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
      }

      .form-label {
        font-weight: 500;
        font-size: 0.95rem;
      }

      .user-select-dropdown {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color, #ccc);
        background-color: var(--card-background-color, #fff);
        color: var(--primary-text-color, #000);
        font-size: 1rem;
      }

      .user-select-dropdown:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        gap: 16px;
      }

      ha-button.destructive {
        --mdc-theme-primary: var(--error-color, #db4437);
        color: var(--error-color, #db4437);
      }

      .empty-state {
        color: var(--secondary-text-color);
        font-style: italic;
        margin: 0;
      }
    `;
}

async function _executeAssign(element: HaConfigDomoluxRoles, targetUserId: string): Promise<void> {
  (element as any)._submitting = true;
  (element as any)._error = null;
  (element as any)._success = null;

  try {
    await element.hass.callWS({
      type: "domolux/role/set_father",
      user_id: targetUserId,
    });

    (element as any)._success = "Father role assigned successfully.";
    (element as any)._selectedUserId = "";
    await (element as any)._loadData();
  } catch (err: any) {
    (element as any)._error = err?.message || "Failed to assign Father role.";
  } finally {
    (element as any)._submitting = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-config-domolux-roles": HaConfigDomoluxRoles;
  }
}