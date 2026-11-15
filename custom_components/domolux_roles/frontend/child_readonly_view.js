/* Child Read-Only View — Child account, restricted access, read-only enforced */
import { LitElement, html, css } from "lit";
export class ChildReadonlyView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: var(--ha-space-4);
    }
    @media (max-width: 600px) {
      :host {
        padding: var(--ha-space-2);
      }
    }
    [dir="rtl"] {
      direction: rtl;
    }
    .readonly {
      color: var(--secondary-text-color);
      font-style: italic;
    }
    .error {
      color: var(--error-color);
    }
  `;
  static get properties() {
    return { _loading: {}, _error: {}, _permissions: {} };
  }
  constructor() {
    super();
    this._loading = true;
    this._error = "";
    this._permissions = [];
  }
  connectedCallback() {
    super.connectedCallback();
    this._load();
  }
  async _load() {
    this._loading = true;
    try {
      this._permissions = [];
      this._error = "";
    } catch (e) {
      this._error = String(e);
    } finally {
      this._loading = false;
    }
  }
  render() {
    if (this._loading)
      return html`<div dir="ltr" class="readonly">Loading child view...</div>`;
    if (this._error)
      return html`<div dir="ltr" class="error">Error: ${this._error}</div>`;
    return html`<div dir="ltr" role="region" aria-label="Child read-only view">
      <h2>Child Read-Only</h2>
      <div class="readonly">Access restricted to assigned entities only.</div>
      <slot></slot>
    </div>`;
  }
}
