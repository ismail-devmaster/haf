# Home Assistant × Google Home Redesign

A complete visual redesign of Home Assistant Lovelace to match Google Home's Material You (M3) design language. Features light + dark themes, responsive layouts (mobile/tablet/desktop/wall panel), Google Sans typography, and polished micro-interactions.

## Features
- 🌗 Light & dark theme variants with automatic switching
- 📱 Fully responsive: 360px mobile → 1400px desktop
- 🎨 Google Material You color system (#1A73E8 primary)
- 🔠 Google Sans typography across all UI
- 🃏 Custom button-card component library (10+ templates)
- ⚡ Optimistic UI updates with 150ms response
- ♿ WCAG AA accessible color contrast

## Prerequisites

The following HACS packages are required. **HACS** (Home Assistant Community Store) must be installed first.

| Package | Repository |
|---------|-----------|
| **button-card** | https://github.com/custom-cards/button-card |
| **card-mod** | https://github.com/thomasloven/lovelace-card-mod |
| **layout-card** | https://github.com/thomasloven/lovelace-layout-card |
| **mini-graph-card** | https://github.com/kalkih/mini-graph-card |
| **Mushroom Cards** | https://github.com/piitaya/lovelace-mushroom |

## Installation

### Step 1: Install HACS
If not already installed, follow the guide at [hacs.xyz](https://hacs.xyz/docs/setup/download).

### Step 2: Install Required HACS Packages
In HACS → Integrations → "+ Explore & Download Repositories":
1. Search and install "button-card"
2. Search and install "card-mod"
3. Search and install "layout-card"
4. Search and install "mini-graph-card"
5. Search and install "Mushroom Cards"

After installing all packages, restart Home Assistant.

### Step 3: Copy Files to Your Configuration Directory
Copy the following files from this repository to your Home Assistant config directory:

| Source | Destination |
|--------|------------|
| `config/themes/google_home.yaml` | `/config/themes/google_home.yaml` |
| `config/www/gh-tokens.js` | `/config/www/gh-tokens.js` |
| `config/www/gh-responsive.js` | `/config/www/gh-responsive.js` |
| `config/button_card_templates.yaml` | `/config/button_card_templates.yaml` |
| `config/lovelace/resources.yaml` | `/config/lovelace/resources.yaml` |
| `config/lovelace/views/*.yaml` | `/config/lovelace/views/*.yaml` |

### Step 4: Update configuration.yaml
Add or modify these sections in your `/config/configuration.yaml`:

```yaml
frontend:
  themes: !include_dir_merge_named themes
  extra_module_url:
    - /local/gh-tokens.js
    - /local/gh-responsive.js
```

### Step 5: Apply the Theme
**Per-user:** Click your profile icon → select "google_home_light" or "google_home_dark" from the theme dropdown.

**Globally (optional):** In configuration.yaml, add:
```yaml
frontend:
  themes: !include_dir_merge_named themes
  theme: "google_home_light"
```

### Step 6: Set Up Lovelace Dashboard
In Home Assistant → Settings → Lovelace Dashboards → "+ Add Dashboard":
1. Name: "Google Home"
2. Mode: "YAML"
3. Click "Take Control"

Then copy the view YAML files from `config/lovelace/views/` into the dashboard editor, or use the raw configuration editor to paste the full configuration.

### Step 7: Clear Browser Cache
Hard refresh (Ctrl+F5 or Cmd+Shift+R) to ensure all new CSS and JavaScript files are loaded.

## Customization

### Adding a New Room
1. Edit `config/lovelace/views/00_home.yaml`
2. Add a new room card to the rooms grid:
```yaml
- type: custom:button-card
  template: gh_room_card
  entity: light.dining_room_lights
  name: Dining Room
  icon: mdi:silverware
```
3. Create a room sub-view (optional): copy an existing view file, rename it, and add specific devices.

### Adding a New Device Tile
```yaml
- type: custom:button-card
  template: gh_device_tile
  entity: switch.my_device
  name: My Device
  icon: mdi:power-socket
```

### Adding Scene Chips
```yaml
- type: custom:button-card
  template: gh_scene_chip
  entity: scene.my_scene
  name: My Scene
  icon: mdi:star
```

### Adding Climate Tiles
```yaml
- type: custom:button-card
  template: gh_climate_tile
  entity: climate.my_thermostat
  name: My Thermostat
```

### Adding Energy Tiles
```yaml
- type: custom:button-card
  template: gh_energy_tile
  entity: sensor.my_energy_sensor
  name: My Sensor
```

## Template Customization

### Token Customization
Override any CSS token by adding to your `configuration.yaml` or a custom `themes` file:

```yaml
# Example: Custom color overrides
google_home_light:
  primary-color: "#YourColor"
  card-background-color: "#YourCardBg"
  ha-card-border-radius: "12px"
```

### Template Override Reference
| Template | Overrideable Properties | Default |
|----------|------------------------|---------|
| `gh_theme_base` | border-radius, box-shadow, font-family | 20px, elev-1, Google Sans |
| `gh_room_card` | min-height, border-radius, icon color | 120px, 28px, dynamic |
| `gh_scene_chip` | height, padding, border-radius | 40px, 0 16px, 9999px |
| `gh_device_tile` | min-height, border-radius, background | 110px, 20px, dynamic |
| `gh_climate_tile` | (extends device_tile) | — |
| `gh_media_tile` | (extends device_tile) | — |
| `gh_energy_tile` | min-height, border-radius | 120px, 20px |
| `gh_skeleton` | animation duration, background | 1.5s, shimmer |

## Theme Token Reference

### Color Tokens (Light)
| Token | Value | Usage |
|-------|-------|-------|
| `--primary-color` | #1A73E8 | Primary actions, active states |
| `--primary-background-color` | #FFFBFE | Page background |
| `--card-background-color` | #FFFFFF | Card surfaces |
| `--primary-text-color` | #202124 | Primary text |
| `--secondary-text-color` | #5F6368 | Secondary text |
| `--sidebar-selected-background-color` | #E8F0FE | Active sidebar item |

### Color Tokens (Dark)
| Token | Value | Usage |
|-------|-------|-------|
| `--primary-color` | #8AB4F8 | Primary actions (dark accessible) |
| `--primary-background-color` | #131314 | Page background |
| `--card-background-color` | #1C1B1F | Card surfaces |
| `--primary-text-color` | #E6E1E5 | Primary text |
| `--secondary-text-color` | #CAC4D0 | Secondary text |
| `--sidebar-selected-background-color` | #1E3A5F | Active sidebar item |

## Sidebar Configuration

This theme is designed for a maximum of 4 sidebar navigation items:

1. **Home** — Main overview
2. **Favorites** — Favorite devices
3. **Automations** — Automation controls
4. **Settings** — System settings

To customize, edit your `ui-lovelace.yaml` or dashboard configuration to limit sidebar items.

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | <768px | 1-column grid, 16px padding, sidebar hidden |
| Tablet | 768-1279px | 2-column grid, 24px padding, collapsed sidebar |
| Desktop | ≥1280px | 1400px max-width, auto-fill grid, expanded sidebar |
| Wall Panel | 768px+ landscape | Desktop layout, larger greeting, hidden bottom nav |

## Known Limitations

- **Entity existence**: All example entities in view files (e.g., `light.living_room_lights`) are placeholders. You must replace these with your actual Home Assistant entity IDs.
- **Scene entities**: Example scenes (`scene.goodnight`, `scene.movie_time`, etc.) need to be created or replaced with your existing scenes.
- **Climate entities**: Thermostat entities (`climate.living_room_thermostat`) must match your actual device names.
- **Mushroom card overrides**: Card-mod overrides for Mushroom cards require the card-mod HACS package to be installed.
- **Google Fonts**: The gh-tokens.js file loads Google Sans from Google Fonts CDN. Internet connection required for first load. After caching, fonts work offline.
- **Browser compatibility**: View Transitions API requires Chromium-based browsers. Firefox and Safari fall back gracefully without transitions.
- **Sidebar**: Sidebar customization may require additional configuration depending on your HA setup. The `sidebar: hidden` mobile behavior works best with Kiosk Mode.

## Troubleshooting

### Theme not appearing
- Ensure `/config/themes/` directory exists
- Verify `frontend: themes: !include_dir_merge_named themes` is in configuration.yaml
- Restart Home Assistant after adding theme files

### Cards showing as "Custom element not found"
- Ensure all HACS packages are installed
- Verify resources.yaml is loaded in your Lovelace dashboard resources
- Hard refresh browser cache

### JavaScript not loading
- Verify extra_module_url paths point to existing files in `/config/www/`
- Check browser console for 404 errors
- Files must be in `/config/www/` directory (served at `/local/`)

### Colors not matching Google Home
- Ensure gh-tokens.js is loading (check browser console)
- Clear browser cache and hard refresh
- Verify data-theme attribute is set correctly on `<html>` element

## Credits

- Design system: Google Material You (Material Design 3)
- Home Assistant: Home Assistant Lovelace UI
- Custom cards: button-card, card-mod, layout-card, mini-graph-card, Mushroom
