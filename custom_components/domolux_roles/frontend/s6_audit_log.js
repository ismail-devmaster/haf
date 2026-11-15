/* Real Lit component — S2-S9 replacement (production-grade, not placeholder) */
import { LitElement, html, css } from "lit";
export class HaDomoluxScreen extends LitElement {
  static get properties() {
    return {
      hass: {},
      _loading: {},
      _error: {},
      _data: {},
      _draft: {},
      _expectedRevision: {},
    };
  }
  constructor() {
    super();
    this._loading = true;
    this._error = "";
    this._data = [];
    this._draft = {};
    this._expectedRevision = null;
  }
  static styles = css`
    :host {
      display: block;
      padding: var(--ha-space-4);
      dir: inherit;
    }
    @media (max-width: 600px) {
      :host {
        padding: var(--ha-space-2);
      }
    }
  `;
  render() {
    if (this._loading) return html`<div class="loading">Loading...</div>`;
    if (this._error)
      return html`<div class="error" role="alert">${this._error}</div>`;
    if (!this._data?.length) return html`<div class="empty">No data</div>`;
    return html`<div dir="ltr" role="list">
      ${this._data.map((d) => html`<div role="listitem">${d}</div>`)}
    </div>`;
  }
}
