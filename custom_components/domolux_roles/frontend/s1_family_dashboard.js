/* S1: Family Dashboard — Father control, Child read-only */
import { LitElement, html, css } from "lit";

export class S1FamilyDashboard extends LitElement {
  static get properties() {
    return { _loading: {}, _error: {}, _members: {} };
  }
  constructor() {
    super();
    this._loading = true;
    this._error = "";
    this._members = [];
  }
  static styles = css`
    :host {
      display: block;
    }
    .dashboard {
      padding: var(--ha-space-4);
      background: var(--card-background-color);
      border-radius: 12px;
    }
    @media (max-width: 600px) {
      .dashboard {
        padding: var(--ha-space-2);
      }
    }
    .loading {
      color: var(--secondary-text-color);
    }
    .error {
      color: var(--error-color);
    }
    .empty {
      color: var(--secondary-text-color);
      font-style: italic;
    }
    .header {
      font-weight: bold;
      margin-bottom: var(--ha-space-2);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._loadMembers();
  }

  async _loadMembers() {
    this._loading = true;
    try {
      // Integration with backend family store (isolated; no live HA required for stub)
      const data =
        typeof this.hass !== "undefined" && this.hass
          ? await this._fetchFamily()
          : [];
      this._members = Array.isArray(data) ? data : [];
      this._error = "";
    } catch (e) {
      this._error = String(e?.message || e);
    } finally {
      this._loading = false;
    }
  }

  async _fetchFamily() {
    // Placeholder for actual backend integration (family store / API)
    return [];
  }

  render() {
    if (this._loading)
      return html`<div class="dashboard loading">
        Loading family members...
      </div>`;
    if (this._error)
      return html`<div class="dashboard error">Error: ${this._error}</div>`;
    if (!this._members.length)
      return html`<div class="dashboard empty">
        No family members configured.
      </div>`;
    return html` <div class="dashboard" dir="ltr">
      <div class="header">Family Dashboard</div>
      <ul>
        ${this._members.map((m) => html`<li>${m.name || m.id}</li>`)}
      </ul>
    </div>`;
  }
}
