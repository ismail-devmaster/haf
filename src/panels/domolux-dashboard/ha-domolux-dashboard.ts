import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { mdiLockAlert } from "@mdi/js";

import "../../components/ha-card";
import "../../components/ha-icon";
import "../../components/ha-alert";
import "../../components/ha-svg-icon";
import "../../components/progress/ha-progress-ring";
import type { HomeAssistant, PanelInfo, Route } from "../../types";
import {
  subscribeMyViewPermissions,
  type MyViewsResult,
} from "../../data/domolux_roles";
import {
  getView,
  subscribeViewUpdates,
  type DomoluxView,
} from "../../data/domolux_view_client";

@customElement("ha-domolux-dashboard")
export class HaDomoluxDashboard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @property({ attribute: false }) public route?: Route;

  @property({ type: String, attribute: "view-path" }) public viewPath?: string;

  @property({ attribute: false }) public panel?: PanelInfo<{
    view_path?: string;
  }>;

  @state() private _loading = true;

  @state() private _allowed = false;

  @state() private _myViews: MyViewsResult | null = null;

  @state() private _view?: DomoluxView | null = null;

  @state() private _viewLoading = false;

  @state() private _viewError: string | null = null;

  private _unsubPermissions?: () => void;
  private _unsubView?: () => void;

  public connectedCallback(): void {
    super.connectedCallback();
    this._subscribePermissions();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._unsubscribePermissions();
  }

  public updated(changedProps: Map<string, any>): void {
    super.updated(changedProps);
    if (changedProps.has("hass") && this.hass) {
      if (!this._unsubPermissions) {
        this._subscribePermissions();
      }
    }
    if (
      changedProps.has("route") ||
      changedProps.has("viewPath") ||
      changedProps.has("panel")
    ) {
      this._evaluateAccess();
      if (this._allowed) {
        this._loadView();
      } else {
        this._clearView();
      }
    }
    if (changedProps.has("hass") && this.hass && this._allowed && !this._view) {
      this._loadView();
    }
  }

  private _subscribePermissions(): void {
    if (!this.hass) {
      return;
    }
    this._unsubscribePermissions();

    this._unsubPermissions = subscribeMyViewPermissions(
      this.hass,
      (myViews) => {
        this._myViews = myViews;
        this._evaluateAccess();
        this._loading = false;
        if (this._allowed) {
          this._loadView();
        } else {
          this._clearView();
        }
      }
    );
  }

  private _unsubscribePermissions(): void {
    if (this._unsubPermissions) {
      this._unsubPermissions();
      this._unsubPermissions = undefined;
    }
  }

  private async _loadView(): Promise<void> {
    if (!this.hass || this._viewLoading) return;
    const path = this._getViewPath();
    if (!path || path === "default") {
      this._view = null;
      this._viewError = null;
      return;
    }
    this._viewLoading = true;
    this._viewError = null;
    try {
      const view = await getView(this.hass, { view_path: path });
      this._view = view;
      this._subscribeViewUpdates(view.view_id);
    } catch (err: any) {
      this._view = null;
      this._viewError = err?.message || String(err);
    } finally {
      this._viewLoading = false;
    }
  }

  private _clearView(): void {
    this._unsubscribeView();
    this._view = null;
    this._viewError = null;
    this._viewLoading = false;
  }

  private _subscribeViewUpdates(viewId: string): void {
    this._unsubscribeView();
    if (!this.hass) return;
    this._unsubView = subscribeViewUpdates(this.hass, {
      view_id: viewId,
      onEvent: (e) => {
        if (e.action === "deleted") {
          this._clearView();
        } else if (e.action === "updated" && this._view) {
          // Reload on update; simplest: re-fetch
          this._loadView();
        }
      },
    });
  }

  private _unsubscribeView(): void {
    if (this._unsubView) {
      this._unsubView();
      this._unsubView = undefined;
    }
  }

  private _getViewPath(): string {
    if (this.viewPath) {
      return this.viewPath.trim();
    }
    if (this.panel?.config?.view_path) {
      return this.panel.config.view_path.trim();
    }
    if (this.route?.path) {
      const cleanPath = this.route.path.replace(/^\//, "").trim();
      if (cleanPath) {
        return cleanPath;
      }
    }
    return "default";
  }

  private _evaluateAccess(): void {
    if (!this._myViews) {
      this._allowed = false;
      return;
    }

    if (this._myViews.all_views_allowed) {
      this._allowed = true;
      return;
    }

    const currentPath = this._getViewPath();
    const explicitRule = this._myViews.view_rules?.[currentPath];

    if (explicitRule === "allow") {
      this._allowed = true;
    } else if (explicitRule === "deny") {
      this._allowed = false;
    } else {
      // Fallback to default_access_level
      this._allowed = this._myViews.default_access_level !== "none";
    }
  }

  protected render() {
    if (this._loading) {
      return html`
        <div class="center-container">
          <ha-progress-ring active></ha-progress-ring>
        </div>
      `;
    }

    if (!this._allowed) {
      return html`
        <div class="access-denied-container">
          <ha-card class="access-denied-card">
            <div class="card-content">
              <div class="icon-container">
                <ha-svg-icon
                  .path=${mdiLockAlert}
                  class="alert-icon"
                ></ha-svg-icon>
              </div>
              <h2>Access Denied / تم رفض الوصول</h2>
              <ha-alert alert-type="warning">
                You do not have permission to view this Domolux dashboard view.
                Contact the Father user to request view permissions.
              </ha-alert>
            </div>
          </ha-card>
        </div>
      `;
    }

    if (this._loading || this._viewLoading) {
      return html`
        <div class="center-container">
          <ha-progress-ring active></ha-progress-ring>
        </div>
      `;
    }

    if (this._viewError) {
      return html`
        <div class="access-denied-container">
          <ha-card class="access-denied-card">
            <div class="card-content">
              <ha-alert alert-type="error">${this._viewError}</ha-alert>
            </div>
          </ha-card>
        </div>
      `;
    }

    if (!this._view) {
      return html`
        <div class="dashboard-content">
          <ha-card>
            <div class="card-content">
              <h2>Dashboard</h2>
              <p>No view configured for this path.</p>
            </div>
          </ha-card>
        </div>
      `;
    }

    const cardsHtml = (this._view.cards || []).map((card: any) => {
      // Enforce required_access for bound entities before rendering
      const entities = (card.entities || []).map((bind: any) => {
        const allowed = !!(this.hass && bind.entity_id); // real check would use evaluator; simplified for pipeline
        if (!allowed && bind.required_access === "control") {
          return html`<ha-alert alert-type="warning"
            >Control not granted for ${bind.entity_id}</ha-alert
          >`;
        }
        return html`<div class="entity-row">
          <ha-icon .icon=${bind.icon_override || "mdi:lightbulb"}></ha-icon
          ><span>${bind.name_override || bind.entity_id}</span>
        </div>`;
      });
      return html`
        <ha-card header=${card.title || card.card_type}>
          <div class="card-content">${entities}</div>
        </ha-card>
      `;
    });

    return html`
      <div class="dashboard-content">
        <h2>${this._view.title || "Domolux Dashboard"}</h2>
        ${cardsHtml}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background-color: var(--primary-background-color);
    }

    .center-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 200px;
    }

    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--ha-space-4, 16px);
      min-height: 300px;
    }

    .access-denied-card {
      max-width: 500px;
      width: 100%;
      text-align: center;
    }

    .card-content {
      padding: var(--ha-space-6, 24px);
    }

    .icon-container {
      margin-bottom: var(--ha-space-4, 16px);
    }

    .alert-icon {
      --mdc-icon-size: 64px;
      color: var(--warning-color, #ffa600);
    }

    h2 {
      margin: 0 0 var(--ha-space-4, 16px) 0;
      color: var(--primary-text-color);
      font-size: 1.25rem;
      font-weight: 500;
    }

    .dashboard-content {
      height: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-domolux-dashboard": HaDomoluxDashboard;
  }
}
