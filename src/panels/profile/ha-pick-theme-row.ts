import type { TemplateResult } from "lit";
import { html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent, type HASSDomEvent } from "../../common/dom/fire_event";
import "../../components/ha-button";
import "../../components/ha-settings-row";
import "../../components/ha-theme-settings";
import {
  saveThemePreferences,
  subscribeThemePreferences,
} from "../../data/theme";
import { SubscribeMixin } from "../../mixins/subscribe-mixin";
import type { HomeAssistant, ThemeSettings } from "../../types";
import { documentationUrl } from "../../util/documentation-url";
import { clearSelectedThemeState } from "../../util/ha-pref-storage";

@customElement("ha-pick-theme-row")
export class HaPickThemeRow extends SubscribeMixin(LitElement) {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ type: Boolean }) public narrow = false;

  @state() private _userTheme?: ThemeSettings | null;

  @state() private _migrating = false;

  protected hassSubscribe() {
    return [
      subscribeThemePreferences(this.hass, ({ value }) => {
        this._userTheme = value;
      }).catch(() => {
        this._userTheme = undefined;
        return () => undefined;
      }),
    ];
  }

  protected render(): TemplateResult {
    const hasThemes =
      this.hass.themes.themes && Object.keys(this.hass.themes.themes).length;

    const localTheme = this._getLocalTheme();
    const showMigration =
      this._userTheme !== undefined &&
      this._userTheme === null &&
      localTheme !== null;

    return html`
      <ha-theme-settings
        .selectedTheme=${this.hass.selectedTheme}
        .narrow=${this.narrow}
        .heading=${this.hass.localize("ui.panel.profile.themes.header")}
        .description=${html`
          ${
            !hasThemes
              ? this.hass.localize("ui.panel.profile.themes.error_no_theme")
              : nothing
          }
          <a
            href=${documentationUrl(
              this.hass,
              "/integrations/frontend/#defining-themes"
            )}
            target="_blank"
            rel="noreferrer"
          >
            ${this.hass.localize("ui.panel.profile.themes.link_promo")}
          </a>
<<<<<<< HEAD
        </span>
        <ha-select
          .label=${this.hass.localize("ui.panel.profile.themes.dropdown_label")}
          .disabled=${!hasThemes}
          .value=${this.hass.selectedTheme?.theme || USE_DEFAULT_THEME}
          @selected=${this._handleThemeSelection}
          .options=${[
            {
              value: USE_DEFAULT_THEME,
              label: this.hass.localize("ui.panel.profile.themes.use_default"),
            },
            { value: HOME_ASSISTANT_THEME, label: "Domolux" },
            ...this._themeNames.map((theme) => ({
              value: theme,
              label: theme,
            })),
          ]}
        >
        </ha-select>
      </ha-settings-row>
      ${curTheme === HOME_ASSISTANT_THEME ||
      (curThemeIsUseDefault &&
        this.hass.themes.default_dark_theme &&
        this.hass.themes.default_theme) ||
      this._supportsModeSelection(curTheme)
        ? html`<div class="inputs">
            <ha-radio-group
              @change=${this._handleDarkMode}
              name="dark_mode"
              .ariaLabel=${this.hass.localize(
                "ui.panel.profile.themes.theme_mode"
              )}
              .value=${themeSettings?.dark === undefined
                ? "light"
                : themeSettings.dark
                  ? "dark"
                  : "light"}
              orientation="horizontal"
            >
              <ha-radio-option value="auto">
                ${this.hass.localize("ui.panel.profile.themes.dark_mode.auto")}
              </ha-radio-option>
              <ha-radio-option value="light">
                ${this.hass.localize("ui.panel.profile.themes.dark_mode.light")}
              </ha-radio-option>
              <ha-radio-option value="dark">
                ${this.hass.localize("ui.panel.profile.themes.dark_mode.dark")}
              </ha-radio-option>
            </ha-radio-group>
            ${curTheme === HOME_ASSISTANT_THEME
              ? html`<div class="color-pickers">
                  <ha-input
                    .value=${themeSettings?.primaryColor || DefaultPrimaryColor}
                    type="color"
                    .label=${this.hass.localize(
                      "ui.panel.profile.themes.primary_color"
                    )}
                    .name=${"primaryColor"}
                    @change=${this._handleColorChange}
                  ></ha-input>
                  <ha-input
                    .value=${themeSettings?.accentColor || DefaultAccentColor}
                    type="color"
                    .label=${this.hass.localize(
                      "ui.panel.profile.themes.accent_color"
                    )}
                    .name=${"accentColor"}
                    @change=${this._handleColorChange}
                  ></ha-input>
                  ${themeSettings?.primaryColor || themeSettings?.accentColor
                    ? html` <ha-button
                        appearance="plain"
                        size="small"
                        @click=${this._resetColors}
                      >
                        ${this.hass.localize("ui.panel.profile.themes.reset")}
                      </ha-button>`
                    : ""}
                </div>`
              : ""}
          </div>`
        : ""}
      ${showMigration
        ? html`
            <ha-settings-row .narrow=${this.narrow}>
              <span slot="heading">
                ${this.hass.localize("ui.panel.profile.themes.migrate_header")}
              </span>
              <span slot="description">
                ${this.hass.localize(
                  "ui.panel.profile.themes.migrate_description"
                )}
              </span>
              <ha-button
                appearance="plain"
                size="small"
                .disabled=${this._migrating}
                @click=${this._migrateThemePreferences}
              >
                ${this.hass.localize("ui.panel.profile.themes.migrate_button")}
              </ha-button>
            </ha-settings-row>
          `
        : ""}
=======
        `}
        .labels=${{
          theme: this.hass.localize("ui.panel.profile.themes.dropdown_label"),
          noTheme: this.hass.localize("ui.panel.profile.themes.use_default"),
          mode: this.hass.localize("ui.panel.profile.themes.theme_mode"),
          autoMode: this.hass.localize(
            "ui.panel.profile.themes.dark_mode.auto"
          ),
          lightMode: this.hass.localize(
            "ui.panel.profile.themes.dark_mode.light"
          ),
          darkMode: this.hass.localize(
            "ui.panel.profile.themes.dark_mode.dark"
          ),
          colors: this.hass.localize("ui.panel.profile.themes.colors"),
          primaryColor: this.hass.localize(
            "ui.panel.profile.themes.primary_color"
          ),
          accentColor: this.hass.localize(
            "ui.panel.profile.themes.accent_color"
          ),
          reset: this.hass.localize("ui.panel.profile.themes.reset"),
        }}
        .themePickerDisabled=${!hasThemes}
        include-default
        @theme-settings-changed=${this._themeSettingsChanged}
      ></ha-theme-settings>
      ${
        showMigration
          ? html`
              <ha-settings-row .narrow=${this.narrow}>
                <span slot="heading">
                  ${this.hass.localize("ui.panel.profile.themes.migrate_header")}
                </span>
                <span slot="description">
                  ${this.hass.localize(
                    "ui.panel.profile.themes.migrate_description"
                  )}
                </span>
                <ha-button
                  appearance="plain"
                  size="s"
                  .disabled=${this._migrating}
                  @click=${this._migrateThemePreferences}
                >
                  ${this.hass.localize("ui.panel.profile.themes.migrate_button")}
                </ha-button>
              </ha-settings-row>
            `
          : nothing
      }
>>>>>>> dev
    `;
  }

  private _themeSettingsChanged(ev: HASSDomEvent<Partial<ThemeSettings>>) {
    fireEvent(this, "settheme", ev.detail);
  }

  private _getLocalTheme(): ThemeSettings | null {
    return this.hass.selectedTheme ?? null;
  }

  private async _migrateThemePreferences() {
    const localTheme = this._getLocalTheme();
    if (!localTheme) {
      return;
    }
    this._migrating = true;
    try {
      await saveThemePreferences(this.hass, localTheme);
      clearSelectedThemeState();
      fireEvent(this, "hass-notification", {
        message: this.hass.localize("ui.panel.profile.themes.migrate_success"),
      });
    } catch (_err: any) {
      fireEvent(this, "hass-notification", {
        message: this.hass.localize("ui.panel.profile.themes.migrate_failed"),
      });
    } finally {
      this._migrating = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-pick-theme-row": HaPickThemeRow;
  }
}
