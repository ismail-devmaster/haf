import type { PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import {
  mdiHome,
  mdiDevices,
  mdiAutoFix,
  mdiClockOutline,
  mdiCog,
} from "@mdi/js";
import { navigate } from "../common/navigate";
import type { HASSDomEvent } from "../common/dom/fire_event";
import { fireEvent } from "../common/dom/fire_event";
import { listenMediaQuery } from "../common/dom/media_query";
import { toggleAttribute } from "../common/dom/toggle_attribute";
import { computeRTLDirection } from "../common/util/compute_rtl";
import "../components/ha-drawer";
import { showNotificationDrawer } from "../dialogs/notifications/show-notification-drawer";
import type { HomeAssistant, Route } from "../types";
import "./partial-panel-resolver";

declare global {
  // for fire event
  interface HASSDomEvents {
    "hass-toggle-menu": undefined | { open?: boolean };
    "hass-show-notifications": undefined;
  }
  interface HTMLElementEventMap {
    "hass-toggle-menu": HASSDomEvent<HASSDomEvents["hass-toggle-menu"]>;
  }
}

@customElement("home-assistant-main")
export class HomeAssistantMain extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public route?: Route;

  @property({ type: Boolean }) public narrow = false;

  @state() private _sidebarEditMode = false;

  @state() private _externalSidebar = false;

  @state() private _drawerOpen = false;

  constructor() {
    super();
    listenMediaQuery("(max-width: 870px)", (matches) => {
      this.narrow = matches;
    });
  }

  protected render(): TemplateResult {
    const sidebarNarrow =
      this._sidebarNarrow || this._externalSidebar || this.hass.kioskMode;

    const isPanelReady =
      this.hass.panels && this.hass.userData && this.hass.systemData;

    return html`
      <ha-snowflakes .hass=${this.hass} .narrow=${this.narrow}></ha-snowflakes>
      <div class="app-shell">
      <ha-drawer
        .type=${sidebarNarrow ? "modal" : ""}
        .open=${sidebarNarrow ? this._drawerOpen : false}
        .direction=${computeRTLDirection(this.hass)}
        @hass-drawer-closed=${this._drawerClosed}
      >
        <ha-sidebar
          .hass=${this.hass}
          .narrow=${sidebarNarrow}
          .route=${this.route}
          .alwaysExpand=${sidebarNarrow || this.hass.dockedSidebar === "docked"}
        ></ha-sidebar>
        ${isPanelReady
          ? html`<partial-panel-resolver
              .narrow=${this.narrow}
              .hass=${this.hass}
              .route=${this.route}
              slot="appContent"
            ></partial-panel-resolver>`
          : nothing}
      </ha-drawer>
      ${sidebarNarrow && isPanelReady ? this._renderBottomNavigation() : nothing}
      </div>
    `;
  }

  private _renderBottomNavigation(): TemplateResult {
    const currentPanel = this.hass.panelUrl;
    const currentPath = this.route?.path || "";

    let activeIndex = -1;
    if (currentPanel === "home") {
      if (currentPath.includes("other-devices")) {
        activeIndex = 1;
      } else {
        activeIndex = 0;
      }
    } else if (currentPanel === "config") {
      if (currentPath.includes("automation")) {
        activeIndex = 2;
      } else {
        activeIndex = 4;
      }
    } else if (currentPanel === "logbook") {
      activeIndex = 3;
    }

    const items = [
      { label: "Home", path: "/home/overview", icon: mdiHome, index: 0 },
      { label: "Devices", path: "/home/other-devices", icon: mdiDevices, index: 1 },
      { label: "Automations", path: "/config/automation", icon: mdiAutoFix, index: 2 },
      { label: "Activity", path: "/logbook", icon: mdiClockOutline, index: 3 },
      { label: "Settings", path: "/config", icon: mdiCog, index: 4 },
    ];

    return html`
      <div class="domolux-bottom-nav">
        ${items.map(
          (item) => html`
            <div
              class="nav-item ${item.index === activeIndex ? "active" : ""}"
              .path=${item.path}
              @click=${this._handleNavClick}
            >
              <div class="icon-wrapper">
                <ha-svg-icon .path=${item.icon}></ha-svg-icon>
              </div>
              <span class="label">${item.label}</span>
            </div>
          `
        )}
      </div>
    `;
  }

  private _handleNavClick(ev: Event) {
    const path = (ev.currentTarget as any).path;
    navigate(path);
  }

  protected firstUpdated() {
    import(/* webpackPreload: true */ "../components/ha-sidebar");
    import("../components/ha-snowflakes");

    if (this.hass.auth.external) {
      this._externalSidebar =
        this.hass.auth.external.config.hasSidebar === true;
      import("../external_app/external_app_entrypoint").then((mod) =>
        mod.attachExternalToApp(this)
      );
    }

    this.addEventListener("hass-toggle-menu", (ev) => {
      if (this._sidebarEditMode) {
        return;
      }
      if (this._externalSidebar) {
        this.hass.auth.external!.fireMessage({
          type: "sidebar/show",
        });
        return;
      }
      if (this._sidebarNarrow || this.hass.kioskMode) {
        this._drawerOpen = ev.detail?.open ?? !this._drawerOpen;
      } else {
        fireEvent(this, "hass-dock-sidebar", {
          dock: ev.detail?.open
            ? "docked"
            : ev.detail?.open === false
              ? "auto"
              : this.hass.dockedSidebar === "auto"
                ? "docked"
                : "auto",
        });
      }
    });

    this.addEventListener("hass-show-notifications", () => {
      showNotificationDrawer(this, {
        narrow: this.narrow,
      });
    });
  }

  public willUpdate(changedProps: PropertyValues<this>) {
    if (changedProps.has("route") && this._sidebarNarrow) {
      this._drawerOpen = false;
    }
  }

  protected updated(changedProps: PropertyValues<this>) {
    super.updated(changedProps);

    toggleAttribute(this, "expanded", this.hass.dockedSidebar === "docked");

    toggleAttribute(
      this,
      "modal",
      this._sidebarNarrow || this._externalSidebar || this.hass.kioskMode
    );
  }

  private get _sidebarNarrow() {
    return this.narrow || this.hass.dockedSidebar === "always_hidden";
  }

  private _drawerClosed() {
    this._drawerOpen = false;
    this._sidebarEditMode = false;
  }

  static styles = css`
    :host {
      color: var(--primary-text-color);
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      --ha-sidebar-width: calc(80px + var(--safe-area-inset-left, 0px));
      --mdc-top-app-bar-width: calc(100% - var(--ha-sidebar-width));
      --safe-area-content-inset-left: 0px;
      --safe-area-content-inset-right: var(--safe-area-inset-right);
    }
    :host([expanded]) {
      --ha-sidebar-width: calc(260px + var(--safe-area-inset-left, 0px));
      --mdc-top-app-bar-width: calc(100% - var(--ha-sidebar-width));
    }
    :host([modal]) {
      --ha-sidebar-width: unset;
      --mdc-top-app-bar-width: unset;
      --safe-area-content-inset-left: var(--safe-area-inset-left);
    }
    :host([modal]) partial-panel-resolver {
      height: calc(100% - 88px);
      display: block;
    }

    .app-shell {
      height: 100%;
      background: var(--primary-background-color);
    }

    partial-panel-resolver,
    ha-sidebar {
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
    }

    .domolux-bottom-nav {
      position: fixed;
      bottom: 12px;
      left: 12px;
      right: 12px;
      height: 64px;
      border-radius: 32px;
      background: rgba(255, 255, 255, 0.80);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.04);
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 8px;
      z-index: 1000;
      box-sizing: border-box;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      height: 100%;
      cursor: pointer;
      position: relative;
      color: var(--secondary-text-color);
      transition: color 200ms ease;
      -webkit-tap-highlight-color: transparent;
      padding: 0 4px;
      border-radius: 0;
      background: none;
    }

    .nav-item .icon-wrapper {
      width: 56px;
      height: 28px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
      transition: all 200ms ease;
    }

    .nav-item ha-svg-icon {
      width: 22px;
      height: 22px;
      transition: transform 200ms ease;
    }

    .nav-item .label {
      font-family: 'Google Sans Text', 'Product Sans', sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.1px;
      color: inherit;
    }

    .nav-item.active {
      color: var(--primary-color, #006D6D);
    }

    .nav-item.active .icon-wrapper {
      background-color: rgba(0, 109, 109, 0.10);
      color: var(--primary-color, #006D6D);
    }

    .nav-item.active ha-svg-icon {
      transform: scale(1.0);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "home-assistant-main": HomeAssistantMain;
  }
}
