import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from "lit/decorators";

@customElement("ha-card")
export class HaCard extends LitElement {
  @property() public header?: string;

  @property({ type: Boolean, reflect: true }) public raised = false;

  static styles = css`
    :host {
      background: var(
        --ha-card-background,
        var(--card-background-color, #ffffff)
      );
      -webkit-backdrop-filter: var(--ha-card-backdrop-filter, none);
      backdrop-filter: var(--ha-card-backdrop-filter, none);
      box-shadow: var(
        --ha-card-box-shadow,
        0 2px 4px 0 rgba(0, 0, 0, 0.08),
        0 4px 8px -2px rgba(0, 0, 0, 0.06)
      );
      box-sizing: border-box;
      border-radius: var(--ha-card-border-radius, 24px);
      border: var(--ha-card-border, 1px solid rgba(0, 0, 0, 0.06));
      color: var(--primary-text-color);
      display: block;
      transition:
        box-shadow 200ms ease,
        transform 200ms ease;
      position: relative;
      will-change: transform;
    }

    :host(:hover) {
      box-shadow:
        0 4px 12px 0 rgba(0, 0, 0, 0.08),
        0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }

    :host([raised]) {
      border: var(--ha-card-border, 1px solid rgba(0, 0, 0, 0.06));
      box-shadow: var(
        --ha-card-box-shadow,
        0 4px 12px 0 rgba(0, 0, 0, 0.06),
        0 2px 4px -2px rgba(0, 0, 0, 0.04)
      );
    }

    :host([raised]:hover) {
      box-shadow:
        0 6px 20px 0 rgba(0, 0, 0, 0.1),
        0 3px 6px -3px rgba(0, 0, 0, 0.06);
    }

    .card-header,
    :host ::slotted(.card-header) {
      color: var(--ha-card-header-color, var(--primary-text-color));
      font-family: var(
        --ha-card-header-font-family,
        "Google Sans",
        "Product Sans",
        var(--ha-font-family-heading, inherit)
      );
      font-size: var(--ha-card-header-font-size, 18px);
      letter-spacing: -0.01em;
      line-height: 1.4;
      padding: 20px 20px 8px;
      display: block;
      margin-block-start: 0;
      margin-block-end: 0;
      font-weight: 500;
    }

    :host ::slotted(.card-content) {
      padding: 16px 20px;
    }

    :host ::slotted(.card-content:first-child) {
      padding-top: 20px;
    }

    :host ::slotted(.card-content:last-child) {
      padding-bottom: 20px;
    }

    :host ::slotted(.card-actions) {
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding: 12px 16px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `;

  protected render() {
    return html`
      ${this.header
        ? html`<h1 class="card-header">${this.header}</h1>`
        : nothing}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-card": HaCard;
  }
}
