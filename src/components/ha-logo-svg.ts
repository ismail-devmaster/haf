import type { TemplateResult } from "lit";
import { css, LitElement, html } from "lit";
import { customElement, property } from "lit/decorators";

@customElement("ha-logo-svg")
export class HaLogoSvg extends LitElement {
  @property({ type: Boolean })
  public darkMode = false;

  protected render(): TemplateResult {
    const logoSrc = this.darkMode
      ? "/static/images/domolux_dark.png"
      : "/static/images/domolux.png";
    return html`<svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      role="img"
      aria-label="Domolux"
    >
      <image
        href=${logoSrc}
        width="240"
        height="240"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>`;
  }

  static styles = css`
    :host {
      display: var(--logo-display, var(--ha-icon-display, inline-flex));
      align-items: center;
      justify-content: center;
      position: relative;
      vertical-align: middle;
      fill: currentcolor;
      width: var(--logo-width, var(--mdc-icon-size, 24px));
      height: var(--logo-height, var(--mdc-icon-size, 24px));
    }
    svg {
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: block;
    }
  `;
}
declare global {
  interface HTMLElementTagNameMap {
    "ha-logo-svg": HaLogoSvg;
  }
}
