// Family & Permissions UI — Phase 3 piece (S1-S9) — minimal Lit structure
// Per master prompt: responsive, RTL-aware, accessible, uses theme tokens
import { LitElement, html, css } from "lit";

export class DomoluxFamilyPermissions extends LitElement {
  static get properties() {
    return { hass: {}, familyId: {} };
  }

  static styles = css`
    :host {
      display: block;
      padding: var(--ha-space-4);
    }
    .panel {
      background: var(--card-background-color);
      border-radius: 12px;
    }
  `;

  render() {
    return html`<div class="panel" aria-label="Family permissions">
      <h2>Family permissions</h2>
      <slot></slot>
    </div>`;
  }
}
