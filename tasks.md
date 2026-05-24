# ════════════════════════════════════════════════════════════════

# CLAUDE CODE — HOME ASSISTANT GOOGLE HOME REDESIGN

# Master Prompt v3.0 — Merged & Production-Ready

# Target: Google Home / Material You (M3) — Light + Dark

# Responsive: Mobile (360px+) · Tablet (768px+) · Desktop (1280px+)

# Execution model: Phased with gates — complete each phase fully

# ════════════════════════════════════════════════════════════════

## ROLE & OBJECTIVE

You are a senior UI/UX engineer and design systems architect.
Your task is a complete redesign of this Home Assistant Lovelace
dashboard to match Google Home's Material You (M3) visual language
exactly — covering design tokens, theme YAML (light + dark), card
components, layout architecture, typography, iconography,
micro-interactions, and responsive behaviour across all breakpoints.

Do NOT modify HAOS system files, HA Core files, or any compiled
frontend bundle. All work is confined to:
· /config/themes/
· /config/www/
· /config/lovelace/
· /config/button_card_templates.yaml
· /config/configuration.yaml (frontend: block only)

Work through each phase sequentially. Complete and verify each
phase before starting the next. Output every file in full — never
use placeholder comments like "// rest of file unchanged".

────────────────────────────────────────────────────────────────

## PHASE 0 — AUDIT (mandatory before any code)

────────────────────────────────────────────────────────────────

Read and analyse:

1. The current ui-lovelace.yaml or all dashboard YAML files
2. configuration.yaml (frontend: and themes: blocks)
3. /config/www/ for any existing custom JS or CSS
4. Installed HACS integrations listed in configuration.yaml

Output a structured audit report covering:
· Current theme variables and their values
· All custom cards in use (type: custom:xxx)
· Dashboard view count and entity categories used
· Missing HACS dependencies (required: Mushroom Cards,
button-card, layout-card, card-mod, mini-graph-card)
· Any naming conflicts or deprecated syntax to resolve

Do not proceed to Phase 1 until the audit report is complete.

────────────────────────────────────────────────────────────────

## PHASE 1 — DESIGN TOKEN SYSTEM

────────────────────────────────────────────────────────────────

Create /config/www/gh-tokens.js — injected via extra_module_url.

### Color System (Material You Dynamic Color — exact hex, no deviation)

Primary (Google Blue): #1A73E8
On Primary: #FFFFFF
Primary Container: #E8F0FE
On Primary Container: #041E49

Secondary (Active/Success): #0F9D58
On Secondary: #FFFFFF
Secondary Container: #E6F4EA

Surface light: #F8F9FA
Surface dark: #1C1B1F
Surface Variant light: #F1F3F4
Surface Variant dark: #49454F
Background light: #FFFBFE
Background dark: #131314
On Surface light: #202124
On Surface dark: #E6E1E5
On Surface Variant light: #5F6368
On Surface Variant dark: #CAC4D0

Error: #D93025
Error dark: #F2B8B8
Error Container light: #FCE8E6
Error Container dark: #8C1D18
Warning: #F9AB00
Warning Container: #FEF7E0

Outline light: rgba(0,0,0,0.12)
Outline dark: rgba(255,255,255,0.12)
Scrim: rgba(0,0,0,0.32)

### Elevation Tokens (box-shadow only — no background tint)

Level 0: none
Level 1: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)
Level 2: 0 2px 6px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)
Level 3: 0 4px 12px rgba(0,0,0,0.09), 0 2px 4px rgba(0,0,0,0.06)

### Shape Tokens (border-radius)

Extra Small: 4px (badges, small chips inner elements)
Small: 8px (chips, input fields, small buttons)
Medium: 12px (icon containers, small cards)
Large: 16px (standard cards)
Extra Large: 28px (room cards, feature cards, bottom sheets)
Full: 9999px (pill chips, FABs, toggle tracks)

### Typography — Google Sans Stack

Font families:
Display: "Google Sans Display", "Product Sans", sans-serif
Body: "Google Sans", "Roboto", sans-serif
Mono: "Google Sans Mono", "Roboto Mono", monospace

Full M3 type scale:
Display Large: 57px / line-height 64px / weight 400
Display Medium: 45px / line-height 52px / weight 400
Headline Large: 32px / line-height 40px / weight 400
Headline Medium: 28px / line-height 36px / weight 400
Title Large: 22px / line-height 28px / weight 400
Title Medium: 16px / line-height 24px / weight 500 / tracking 0.15px
Title Small: 14px / line-height 20px / weight 500 / tracking 0.1px
Body Large: 16px / line-height 24px / weight 400 / tracking 0.5px
Body Medium: 14px / line-height 20px / weight 400 / tracking 0.25px
Label Large: 14px / line-height 20px / weight 500 / tracking 0.1px
Label Medium: 12px / line-height 16px / weight 500 / tracking 0.5px
Label Small: 11px / line-height 16px / weight 500 / tracking 0.5px

### Motion Tokens (Material You Easing)

--gh-duration-short-1: 50ms
--gh-duration-short-2: 100ms
--gh-duration-short-3: 150ms
--gh-duration-medium-1: 200ms
--gh-duration-medium-2: 250ms
--gh-duration-medium-3: 300ms
--gh-duration-long-1: 400ms
--gh-duration-long-2: 500ms

--gh-easing-emphasized: cubic-bezier(0.2, 0.0, 0.0, 1.0) 500ms
--gh-easing-emphasized-decel: cubic-bezier(0.05, 0.7, 0.1, 1.0) 400ms
--gh-easing-emphasized-accel: cubic-bezier(0.3, 0.0, 0.8, 0.15) 200ms
--gh-easing-standard: cubic-bezier(0.2, 0.0, 0.0, 1.0) 300ms
--gh-easing-standard-decel: cubic-bezier(0.0, 0.0, 0.0, 1.0) 250ms
--gh-easing-standard-accel: cubic-bezier(0.3, 0.0, 1.0, 1.0) 200ms

### Spacing Tokens

--gh-space-xs: 4px
--gh-space-sm: 8px
--gh-space-md: 12px
--gh-space-lg: 16px
--gh-space-xl: 24px
--gh-space-2xl: 32px
--gh-space-3xl: 48px

In gh-tokens.js, also:
· Append a <link> loading Google Sans from Google Fonts
· Apply font globally: document.documentElement.style.fontFamily
· Detect prefers-color-scheme and set a data-theme attribute
on <html> for CSS-level dark mode switching

────────────────────────────────────────────────────────────────

## PHASE 2 — THEME FILES (LIGHT + DARK)

────────────────────────────────────────────────────────────────

Create /config/themes/google_home.yaml with TWO named themes:
google_home_light
google_home_dark

Both must define ALL of the following HA variable groups:

· primary-background-color, secondary-background-color
· card-background-color
· ha-card-border-radius: "16px" (light) / "16px" (dark)
· ha-card-box-shadow (elevation level 1 values)
· ha-card-border-width: "1px"
· ha-card-border-color (outline token value)
· primary-color, accent-color, dark-primary-color
· primary-text-color, secondary-text-color, disabled-text-color
· text-primary-color, link-color
· divider-color, border-color
· app-header-background-color (with rgba 0.92 opacity for blur)
· app-header-text-color
· app-header-selection-bar-color: primary color
· sidebar-background-color
· sidebar-text-color, sidebar-icon-color
· sidebar-selected-background-color: primary container color
· sidebar-selected-icon-color: primary color
· sidebar-selected-text-color: primary color
· switch-checked-color, switch-checked-button-color
· switch-checked-track-color, switch-unchecked-color
· slider-color, slider-secondary-color
· input-fill-color, input-ink-color, input-label-ink-color
· mdc-theme-primary, mdc-theme-surface, mdc-theme-on-surface
· paper-listbox-background-color
· paper-item-icon-color
· paper-font-body1*-\_font-family (Google Sans stack)
· paper-font-headline*-\_font-family (Google Sans Display stack)
· error-color (light: #D93025 / dark: #F2B8B8)

After creating the theme file, update configuration.yaml:

frontend:
extra_module_url: - /local/gh-tokens.js - /local/gh-responsive.js
themes: !include_dir_merge_named themes/

────────────────────────────────────────────────────────────────

## PHASE 3 — FILE STRUCTURE & LAYOUT ARCHITECTURE

────────────────────────────────────────────────────────────────

Deliver the following file structure under /config/lovelace/:

/config/
├── themes/
│ └── google_home.yaml
├── lovelace/
│ ├── views/
│ │ ├── 00_home.yaml ← Main overview (room grid)
│ │ ├── 01_lighting.yaml ← Lighting control view
│ │ ├── 02_climate.yaml ← Thermostat + climate view
│ │ ├── 03_security.yaml ← Cameras + locks view
│ │ └── 04_energy.yaml ← Energy monitoring view
│ └── resources.yaml ← HACS card registrations
├── extra_module_url/
│ ├── gh-tokens.js
│ └── gh-responsive.js
├── button_card_templates.yaml
└── README.md ← Install guide

### View Layout Rules

00_home.yaml — PRIMARY VIEW:

┌─────────────────────────────────┐
│ ☰ Good morning, [Name] │ ← Greeting + time + weather chip
│ Monday · 22°C · Sunny │
├─────────────────────────────────┤
│ [Scenes — pill chip row] │ ← Away · Night · Movie · Morning
├─────────────────────────────────┤
│ ROOMS │
│ ┌──────────┐ ┌──────────┐ │
│ │ Living │ │ Kitchen │ │ ← 2-col grid, Extra Large radius
│ │ Room │ │ │ │ Tap → room detail sub-view
│ │ 3 on ● │ │ 1 on ● │ │
│ └──────────┘ └──────────┘ │
│ ┌──────────┐ ┌──────────┐ │
│ │ Bedroom │ │ Office │ │
│ └──────────┘ └──────────┘ │
├─────────────────────────────────┤
│ FAVORITES │
│ [Horizontal scroll strip] │ ← Quick-toggle devices
├─────────────────────────────────┤
│ 🏠 Devices 💡 ⚙️ │ ← Material 3 NavigationBar
└─────────────────────────────────┘

Grid specification:
Desktop ≥1280px: max_cols 2, min_width 480px, gap 12px, padding 32px
Tablet 768–1279px: max_cols 2, min_width 320px, gap 10px, padding 24px
Mobile <768px: max_cols 1, single col, gap 8px, padding 16px

Sidebar nav items — maximum 4:
Home · Favorites · Automations · Settings
Remove all other items.

────────────────────────────────────────────────────────────────

## PHASE 4 — COMPONENT LIBRARY

────────────────────────────────────────────────────────────────

Create /config/button_card_templates.yaml.
Implement ALL templates below. Output the full file.

Priority order: P0 → P1 → P2 → P3

P0: gh_theme_base — base token injection (all cards extend this)
P0: gh_greeting — dynamic time-based greeting header
P1: gh_room_card — tappable room tile (Extra Large 28px radius)
P1: gh_scene_chip — pill scene/automation shortcut
P1: gh_device_tile — standard device toggle tile
P2: gh_device_chip — compact horizontal device chip
P2: gh_climate_tile — thermostat tile with temp display
P2: gh_media_tile — media player tile with track info
P3: gh_energy_tile — energy metric display tile
P3: gh_skeleton — shimmer loading placeholder

─── gh_greeting ────────────────────────────────────────────────
No card background, no shadow, no border
JS template:
06:00–11:59 → "Good morning" (sun icon)
12:00–16:59 → "Good afternoon" (sun icon)
17:00–20:59 → "Good evening" (sunset icon)
21:00–05:59 → "Good night" (moon icon)
Greeting: Title Large (22px / 400 / On Surface)
Subtext: optional weather entity — Body Medium (14px / 400)
Padding: 20px top, 8px bottom

─── gh_room_card ───────────────────────────────────────────────
Shape: Extra Large (28px)
Min-height: 120px
Visual states:
all off → Surface (#F8F9FA), grey icon (muted)
partial → Primary Container (#E8F0FE), colored icon
all on → deeper Primary Container, white icon, bright label
Room name: Title Medium (16px / 500)
Device count: Label Small in pill badge (9999px radius, 32px height)
Tap action: navigate to room sub-view
Hold action: toggle all devices in room
Press animation: scale(0.97) / 100ms emphasized-accel easing
Release animation: scale(1.0) / 200ms emphasized-decel easing

─── gh_scene_chip ──────────────────────────────────────────────
Shape: Full pill (9999px)
Height: 40px, padding: 0 16px
Inactive: bg #F1F3F4, text #202124, icon #5F6368
Active: bg #E8F0FE, text #1A73E8, icon #1A73E8
Font: Label Large (14px / 500)
Icon: 18px, leading position
Row: horizontal scroll, overflow hidden, snap scroll on mobile

─── gh_device_tile ─────────────────────────────────────────────
Layout: icon top-left, name + label bottom-left
Min-height: 110px
OFF: bg #FFFFFF, elev-1 shadow, icon #5F6368, name #202124
ON: bg #E8F0FE, icon #1A73E8, name #1A73E8, label #5F6368
UNAVAILABLE: bg #F8F9FA, opacity 0.5
Icon: outline MDI variant (off), filled (on)
Name: Label Large (14px / 500)
Label: Body Medium (14px / 400 / On Surface Variant)
Border-radius: 20px, border: none
Tap: toggle entity
Hold: more-info dialog

─── gh_climate_tile ────────────────────────────────────────────
Extends gh_device_tile
Center display: current temperature — Title Large (22px / 400)
Subtext: set-point temperature — Body Medium
Heating: icon #D93025, bg #FCE8E6, mdi:thermometer-chevron-up
Cooling: icon #1A73E8, bg #E8F0FE, mdi:thermometer-chevron-down
Auto: icon #0F9D58, bg #E6F4EA, mdi:home-thermometer-outline
Off: standard device tile off state

─── gh_media_tile ──────────────────────────────────────────────
Extends gh_device_tile
Label shows: currently playing track (truncated 1 line)
Playing: icon mdi:speaker-play, colour #1A73E8
Paused: icon mdi:speaker-pause, colour #5F6368
Idle: standard off state

─── gh_energy_tile ─────────────────────────────────────────────
Large metric number: Display Medium (45px / 400)
Unit label: Body Medium below number
Trend badge: up/down arrow + delta value pill
Uses mini-graph-card for sparkline

─── gh_skeleton ────────────────────────────────────────────────
Shimmer animation: 1.5s infinite linear
Background: gradient-shimmer from #F1F3F4 → #E8EAED → #F1F3F4
Matches gh_device_tile dimensions for seamless swap
Accessible: aria-busy="true", aria-label="Loading"

Also implement Mushroom card overrides via card_mod targeting all
custom:mushroom-\* cards globally:
border-radius: 20px
box-shadow: elevation level 1
border: none
--mush-icon-border-radius: 12px
--mush-icon-size: 36px
font-family: Google Sans stack

────────────────────────────────────────────────────────────────

## PHASE 5 — UX FLOWS & INTERACTION DESIGN

────────────────────────────────────────────────────────────────

### Interaction Model (implement all 3 tiers)

Single tap: toggle device on/off — optimistic UI within 150ms
Long press: 500ms hold → open more-info bottom sheet modal
Swipe left: reveal quick actions strip (schedule, favorite toggle)
Double tap: not used

### State Feedback

Loading: shimmer skeleton (gh_skeleton template) — no spinners
Success: green ripple from element center, 300ms fade
Error: card border pulses #D93025 for 600ms, then resets + snackbar notification at bottom of view
Unavailable: opacity 0.5, icon replaced with mdi:alert-circle-outline

Optimistic UI: state updates immediately on tap, reverts if HA
websocket confirmation fails within 3 seconds.

### prefers-reduced-motion

In gh-tokens.js, detect prefers-reduced-motion and inject: \* { transition-duration: 0ms !important;
animation-duration: 0ms !important; }
This must override all card-mod and button-card transitions.

### Scene Chip Row UX

· Horizontal scroll, scrollbar hidden (scrollbar-width: none)
· Momentum scroll on iOS (-webkit-overflow-scrolling: touch)
· Snap scroll to nearest chip on mobile
· Active chip: filled Primary Container style
· Maximum 8 chips before overflow scrolls

### Room Navigation Flow

· Room card tap → navigate action to dedicated sub-view
· Sub-view header: room name + back chevron button
· Back chevron: navigate action to 00_home view
· Sub-view layout: same grid rules as home view, greeting omitted
· "Control All" toggle at top of each room sub-view

────────────────────────────────────────────────────────────────

## PHASE 6 — RESPONSIVE SYSTEM

────────────────────────────────────────────────────────────────

Create /config/www/gh-responsive.js (second extra_module_url).

Inject a <style> block into the HA shadow DOM with these rules:

MOBILE (<768px):
Device tile grid: 2 columns, (50% - 8px) each
Scene chips: 36px height, Label Medium text (12px)
Greeting: Title Medium (16px)
Page padding: 16px horizontal
Card gap: 8px
Sidebar: hidden — implement via Kiosk Mode if installed,
otherwise leave sidebar visible with collapsed icons

TABLET (768px–1279px):
Device tile grid: 2 equal columns
Page padding: 24px horizontal
Scene chips: 40px height
Card gap: 10px
Sidebar: visible, collapsed to icons only (48px width)

DESKTOP (≥1280px):
Content max-width: 1400px centred
Device tile grid: auto-fill, minmax(140px, 1fr)
Page padding: 32px horizontal
Card gap: 12px
Sidebar: fully expanded with labels (256px width)

WALL PANEL (landscape, aspect-ratio ≥ 1.6, ≥768px height):
Apply desktop grid rules
Greeting: Headline Large (32px / 400)
Device tiles: min-height 130px
Bottom nav: hidden (replaced by sidebar)

────────────────────────────────────────────────────────────────

## PHASE 7 — DELIVERABLES

────────────────────────────────────────────────────────────────

Produce all files in the structure below. Output each file in
full — no truncation, no placeholders.

google_home.yaml — Complete theme, light + dark variants
00_home.yaml — Main overview view
01_lighting.yaml — Lighting control view
02_climate.yaml — Thermostat + climate view
03_security.yaml — Cameras + locks view
04_energy.yaml — Energy monitoring view
button_card_templates.yaml — Full component library
resources.yaml — HACS module registrations
gh-tokens.js — Token injection + font load
gh-responsive.js — Responsive CSS injection
README.md — Installation + customisation guide

README.md must include:
· HACS packages to install (exact names and GitHub URLs)
· Manual steps in execution order
· How to apply the theme per-user and globally
· How to add new rooms and devices
· Customisation reference for overriding token values

────────────────────────────────────────────────────────────────

## PHASE 8 — VERIFICATION (self-run before final output)

────────────────────────────────────────────────────────────────

Run through every item. Fix failures before outputting the summary.

VISUAL CONSISTENCY:
[ ] All card backgrounds are #FFFFFF (light) / #1C1B1F (dark)
[ ] Page background is #FFFBFE (light) / #131314 (dark)
[ ] Zero instances of border: 1px solid on any card
[ ] ha-card-border-radius is consistently 16px across all cards
[ ] Room cards use 28px border-radius (Extra Large)
[ ] No text-transform: uppercase anywhere
[ ] Active/ON state uses #1A73E8 exclusively (not green/orange)
[ ] Google Sans applied to all text nodes
[ ] Dark theme mirrors all light values with correct dark tokens
[ ] Both themes validate without YAML syntax errors

FUNCTIONALITY:
[ ] All toggle tiles respond within 200ms optimistic update
[ ] Scene chips activate correct HA scenes
[ ] Room nav sub-views all have working back buttons
[ ] Hold opens more-info for every device tile
[ ] Unavailable entities display faded with alert icon
[ ] prefers-reduced-motion disables all transitions

RESPONSIVE:
[ ] Renders correctly at 360px viewport width
[ ] Renders correctly at 768px viewport width
[ ] Renders correctly at 1280px viewport width
[ ] Scene chip row scrolls horizontally on touch with no overflow
[ ] No horizontal overflow at any viewport width
[ ] Tap targets all ≥ 48×48dp on mobile

ACCESSIBILITY:
[ ] Colour contrast ≥ 4.5:1 for all body text
[ ] Colour contrast ≥ 3:1 for all UI component text
[ ] All icon-only buttons have aria-label
[ ] Colour is never the sole state indicator
[ ] Keyboard navigation works through all interactive elements
[ ] Lighthouse accessibility score target: ≥ 85

────────────────────────────────────────────────────────────────

## HARD CONSTRAINTS (invariants — never violated)

────────────────────────────────────────────────────────────────

✗ Never edit frontend bundle files or HAOS system files
✗ Never use !important unless overriding Web Component shadow DOM
that cannot be reached any other way — document each use
✗ Never use text-transform: uppercase anywhere
✗ Never use font-weight 700 — maximum is 600 for display headings
✗ Never use filled MDI icon variants in off-state device tiles
✗ Never ship without both light and dark theme variants
✗ Never store tokens, API keys, or passwords in Lovelace YAML
✗ Never use the deprecated Lovelace UI editor — raw YAML only
✗ Never output partial files — always output complete file content
✗ Never add more than 4 items to sidebar navigation
✗ Never use gradients as card surface backgrounds
✗ Never use purple (#6750A4) as the primary action colour —
the primary is Google Blue (#1A73E8)
✗ Never proceed to the next phase without completing the current one

────────────────────────────────────────────────────────────────

## OUTPUT FORMAT (per file)

────────────────────────────────────────────────────────────────

For each file created or modified:

1. State the full file path
2. State what changed and why (one sentence)
3. Output the complete file content in a fenced code block
   with the correct language tag (yaml / javascript / css / md)
4. List any manual follow-up steps the user must perform
   (restart HA, clear browser cache, install HACS package)

End with a final summary listing:
· All files created or modified
· All HACS packages required (name + GitHub URL)
· Manual steps in execution order
· Any known limitations or deviations from the M3 spec
