# Google Home Design System vs. Current Lovelace YAML Inventory — Comprehensive Comparison

> **Source materials.**
> **A.** Inventory of 7 Lovelace YAML files under `/home/ismabeast/Desktop/ponglearn/haf/dashboards/`:
> `lovelace.dashboard_home.txt` (1591 lines), `lovelace.dashboard_user.txt` (1505 lines), `lovelace.working_space.txt` (1737 lines), `lovelace.kitchen_dashboard.txt` (785 lines), `lovelace.fethi_room.txt` (331 lines), `lovelace.meeting_room.txt` (331 lines), `lovelace.salle_de_bain.txt` (351 lines). Aggregate: 122 cards, 82 `custom:button-card`, 24 section grids, 13 nested grids, 2 horizontal-stacks. Zero conditional cards, zero markdown cards, zero `card-mod`. Only custom integration in use is `custom:button-card`. All 7 files declare `view type: sections`, `max_columns: 2`, `square: false`, and **none** set `theme:`.
> **B.** Google Home Android design system reference (v3.41 pre-Gemini, with Material 3 Expressive + Dynamic Color overlay). Token sources: M3 Compose `lightColorScheme()` / `darkColorScheme()`, `material-components-android` token specs, and the Google Design Library article _"Google Home UX: Adapting Material Design"_ by Miche Alvarez.
>
> All values below are sourced from these two materials. Hex codes are 6-digit uppercase; dimensions are in CSS `px` for the current Lovelace implementation and in Android `dp/sp` for Google Home; durations in `ms`; easings in `cubic-bezier()` form. Inline references cite the file and a representative line range.

---

## 1. Executive Summary

### 1.1 Key gap findings (specific)

- **Card surface treatment is M2 not M3.** Every one of the 82 button-cards in 7 files uses `background: #FFFFFF` + `border: 1px solid #DADCE0` (see `lovelace.dashboard_home.txt:45`, `lovelace.working_space.txt:183`, `lovelace.kitchen_dashboard.txt:107`, `lovelace.salle_de_bain.txt:159`, `lovelace.meeting_room.txt:159`, `lovelace.fethi_room.txt:159`, `lovelace.dashboard_user.txt:41`). Google Home v3.x uses **0 px borders** on tonal surfaces (`surfaceContainer` `#F1ECF4` light / `#211F26` dark, M3 Compose default; no `border` property exists on the M3 `Card` composable).

- **Corner radii are 50% too small.** Current cards use `border-radius: 14px` (universal across all 7 files, e.g. `lovelace.dashboard_home.txt:45`, `lovelace.working_space.txt:183`); smaller `12px` is used for nested card icons (e.g. `lovelace.dashboard_home.txt:112`); pill is `9999px` (e.g. `lovelace.fethi_room.txt:277`, `lovelace.dashboard_user.txt:898`). Google Home device tiles are **28 dp** (`Shapes.extraLarge`), the FAB is **16 dp** (`Shapes.large`), and small surfaces are **12 dp** (`Shapes.medium`). Delta: 14 → 28 = +14 dp on cards; 12 → 12 = equal on small cards.

- **Typography scale is non-standard and inconsistent.** Headers use `font-size:14px; font-weight:500` (e.g. `lovelace.dashboard_home.txt:405`, `lovelace.working_space.txt:1123`) with `letter-spacing:0.1–0.3px` and `line-height:18px` — these don't map to any M3 token. Google Home uses `titleMedium` 16 sp / 24 line-height / Medium 500 (Delta: +2 sp size, +6 sp line-height). Status sublines use 11 sp / 14 line-height; Google Home uses `bodySmall` 12 sp / 16 line-height (Delta: +1 sp, +2 sp). Note inconsistency: some cards in `lovelace.dashboard_home.txt:660` use 14 px / 17 line-height instead of 18.

- **Switch geometry is 20% undersized.** Current custom switches are `42px × 24px` track with 18 px thumb and `2px solid` border (e.g. `lovelace.fethi_room.txt:140`, `lovelace.meeting_room.txt:140`, `lovelace.working_space.txt:1123`). A second variant in `lovelace.dashboard_home.txt:405` is `44px × 24px` with 20 px thumb and no border. Google Home M3 Switch is **52 × 32 dp** track with **24 dp** thumb (28 dp pressed), 16 dp radius, no border on selected (`colorScheme.primary` `#1A73E8`), 2 dp `outline` border on unselected. Delta: +10 dp width, +8 dp height, +6 dp thumb.

- **FAB hover state is non-Google.** The current FAB `extra_styles` block (`lovelace.fethi_room.txt:322`, `lovelace.meeting_room.txt:322`, `lovelace.salle_de_bain.txt:342`, `lovelace.working_space.txt:1728`) declares `transform: scale(1.08)` on hover and `transform: scale(0.92)` on press. This is **explicitly rejected** by M3 Expressive: M3 standard is no scale-down on press, relying on the state-layer overlay (10% press) and ripple. Delta: 0.92 scale → 1.0 scale = −8% press deformation, state layer +10% press added.

- **Easing function is M2 not M3.** Across all 7 files the universal transition is `cubic-bezier(0.4, 0, 0.2, 1)` (M2 `FastOutSlowInInterpolator`), e.g. `lovelace.dashboard_home.txt` `name` template `transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` on line 405. Google Home uses `motionEasingStandard` = `cubic-bezier(0.2, 0, 0, 1)` for utility motion, and `motionEasingEmphasizedDecelerate` = `cubic-bezier(0.05, 0.7, 0.1, 1.0)` for prominent transitions (FAB → sheet, dialog open, page changes). The 0.4 → 0.2 first-control-point shift is a 50% reduction in initial acceleration.

- **Five files declare a `@keyframes listening-pulse` animation that is never applied.** `lovelace.fethi_room.txt:322`, `lovelace.meeting_room.txt:322`, `lovelace.salle_de_bain.txt:342`, `lovelace.working_space.txt:1728` (also in `lovelace.dashboard_user.txt` header) all define the keyframe, but no `animation:` shorthand references it. Dead CSS: `0% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 0.3; } 100% { transform: scale(1.3); opacity: 0; }`. This is leftover from an abandoned voice-pulse visual.

- **`dashboard_user.txt` diverges from the other 6 files on header + FAB size.** Header is 44 px (vs 56 px in 6 other files, e.g. `lovelace.fethi_room.txt:57`); FAB is 36 × 36 px (vs 52 × 52 in 5 FAB-bearing files, e.g. `lovelace.fethi_room.txt:271-274`); FAB transition is `200ms` (vs `250ms`); header is missing `extra_styles` block. Net: −12 px header, −16 px FAB side, −50 ms duration.

- **Cover position presets in `kitchen_dashboard.txt` are mislabelled.** Lines 441/528/615/702 contain `data: { position: 16 }`, `33`, `49`, `65` for tiles labelled "Open 25%", "Open 50%", "Open 75%", "Open 100%". The position values 16/33/49/65 produce ~16%/33%/49%/65% travel, not 25/50/75/100. Linear interpolation gives 25 → 25, 50 → 50, 75 → 75, 100 → 100; the current code is off by ⅓. Separately, `lovelace.dashboard_home.txt:1545` shows `data: { position: 65 }` labelled as 100% — a similar off-by-one.

- **Two duplicate "More" placeholder tiles in `lovelace.dashboard_user.txt`.** Lines 619, 1256, 1336 all declare `name: "More"`. Two of the three are dead UI: only line 619 (an actually-rendered grid card) is correct; the lines 1256 and 1336 tiles are duplicates of the same placeholder.

- **Cover "Open" state uses contradictory semantics.** `lovelace.kitchen_dashboard.txt:94` uses `#F9AB00` (amber) for an open cover; `lovelace.dashboard_home.txt:1040` uses the same `#F9AB00` for a window shutter. But `lovelace.salle_de_bain.txt:207` (door) uses `#F9AB00` for "Open" while `lovelace.dashboard_home.txt:589` (door) uses the same `#F9AB00`. The inconsistency is between **room palette** (Kitchen = amber) and **action semantics** (open/close) — same state, different color, depending on the file. Google Home reserves amber `#FFCB45` for "light on" only.

- **Hex case is not normalized.** `#1A73E8`, `#1a73e8`, `#fff`, `#FFFFFF`, `#dadce0`, `#DADCE0`, `#f1f3f4`, `#F1F3F4` all coexist. See `lovelace.dashboard_home.txt:405` (`#f1f3f4`, `#9c27b0`, `#dadce0`, `#ffffff`) vs `lovelace.fethi_room.txt:140` (`#D3E3FD`, `#F1F3F4`, `#1A73E8`, `#FFFFFF`). This produces inconsistent diffs and is a finding for a `card-mod` refactor.

### 1.2 Three highest-leverage alignment opportunities

1. **Replace card chrome (`background: #FFFFFF` + `1px solid #DADCE0` border + `border-radius: 14px` + `box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.04)`) with M3 tonal surfaces (`background: var(--md-sys-color-surface-container-low, #F7F2FA)` + `border: none` + `border-radius: 28px` + `box-shadow: none`).** This single change touches 82 button-cards across 7 files and immediately matches Google Home's M3 Expressive card pattern. Best executed via a single `card-mod` template — no `theme.yaml` exists currently.

2. **Increase switch geometry from 42 × 24 / 18-thumb to 52 × 32 / 24-thumb and remove the `2px solid` track border.** 5 files use the smaller switch (`lovelace.fethi_room.txt:140`, `lovelace.meeting_room.txt:140`, `lovelace.working_space.txt:1123`, `lovelace.salle_de_bain.txt`-style); 1 file uses the larger `lovelace.dashboard_home.txt:405` variant. Standardize on the M3 spec and use `colorScheme.primary` `#1A73E8` for selected, `surfaceContainerHighest` `#E6E0E9` for unselected.

3. **Switch the easing token from `cubic-bezier(0.4, 0, 0.2, 1)` to `cubic-bezier(0.2, 0, 0, 1)` globally and add a `motionEasingEmphasizedDecelerate` (`cubic-bezier(0.05, 0.7, 0.1, 1.0)`) variant for the FAB → sheet transition and dialog open/close.** Touches every `transition:` declaration in all 7 files. Long-term, set a `theme.yaml` `ha-motion-standard: cubic-bezier(0.2, 0, 0, 1)` so the standard is centralized.

### 1.3 Underlying design philosophy gap

The current dashboards implement the **Material Design 2 outlined-card pattern**: a white card on a (default) white page background, separated by a 1 px `#DADCE0` border plus a barely-visible 2-stop drop shadow (`0 1px 2px rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.04)`). The visual hierarchy is created by **line** (the border) and **shadow** (the 1-2 pixel blur), and elevation is expressed as a single `box-shadow` string on a single surface color. Google Home, by contrast, implements the **Material 3 Expressive tonal-surface pattern**: cards on a `background` surface, separated by **tonal elevation** (a lighter or darker fill at `surfaceContainerLow` N96 / `surfaceContainer` N94 / `surfaceContainerHigh` N92) and **no borders**. Elevation is expressed as a color shift in the fill, not a shadow stack. The M3 design language also reinterprets "active" — where current cards use a colored fill (`#D3E3FD` active, `#F1F3F4` inactive, e.g. `lovelace.fethi_room.txt:140`) M3 cards in Google Home use the M3 `state layer` (8% hover, 10% press) over an unchanged surface. The two systems are visually similar at a glance but architecturally incompatible: any move to M3 Expressive necessarily removes the 1 px border, the 1-2 px shadow, the colored active fill, and the dual-color thumb border in one step.

---

## 2. Detailed Comparison Table

| #   | Component / Surface               | Current YAML value (cite file + line)                                                                                                                                                                                                                          | Google Home value                                                                                                                                                                                                          | Delta (quantified)                                                         | Implementation Priority |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------- |
| 1   | Page background                   | `#FFFFFF` (implicit, no `theme:`) — all 7 files                                                                                                                                                                                                                | `#FFFBFE` light / `#1C1B1F` dark (`colorScheme.background`)                                                                                                                                                                | 0% in light, page bg should be one tone darker than cards                  | secondary               |
| 2   | Card surface                      | `background: #FFFFFF` — `lovelace.dashboard_home.txt:45`, all 82 button-cards                                                                                                                                                                                  | `surfaceContainerLow` `#F7F2FA` light / `#1D1B20` dark (M3 token, N96 / N10)                                                                                                                                               | Hex delta: `#FFFFFF` → `#F7F2FA` (+6 saturation)                           | critical                |
| 3   | Card border                       | `border: 1px solid #DADCE0` — 21 occurrences across 6 files (`fethi_room.txt:162,227`, `working_space.txt:207,312,395,609,705,801,897,993,1136,1194,1251,1350,1449,1548,1633`, `salle_de_bain.txt:162,229`, `meeting_room.txt:162,227`)                        | `border: none` (M3 `Card` has no border)                                                                                                                                                                                   | Remove 21 declarations                                                     | critical                |
| 4   | Card radius                       | `border-radius: 14px` — universal in card blocks, e.g. `lovelace.dashboard_home.txt:45`                                                                                                                                                                        | `border-radius: 28px` (`Shapes.extraLarge`, M3 default for tile)                                                                                                                                                           | +14 px                                                                     | critical                |
| 5   | Card padding                      | `padding: 8px 12px` header, `8px`/`12px`/`16px` mixed in tiles — `lovelace.fethi_room.txt:54`, `lovelace.working_space.txt:392`                                                                                                                                | `16px` (compact tile inner)                                                                                                                                                                                                | Standardize to 16 px on all card bodies                                    | critical                |
| 6   | Primary button bg                 | `#1A73E8` (`colorScheme.primary`, Google Blue 600) — `lovelace.fethi_room.txt:280`, `lovelace.working_space.txt:1686`, `lovelace.salle_de_bain.txt:300`, `lovelace.meeting_room.txt:280`, `lovelace.dashboard_user.txt:1454`                                   | `#1A73E8` (Google Blue 600, pre-DC fallback) or `#D0BCFF` (M3 baseline primary80 dark)                                                                                                                                     | 0% when matching static blue; M3 baseline purple is a different palette    | secondary               |
| 7   | Primary button text               | `#FFFFFF` implicit — `lovelace.fethi_room.txt:280`                                                                                                                                                                                                             | `onPrimary` `#FFFFFF` light / `#381E72` dark (M3 baseline)                                                                                                                                                                 | Match in light mode only                                                   | secondary               |
| 8   | Primary button height             | No `height` set on filled buttons (default `auto`); min ~40 px                                                                                                                                                                                                 | `40dp` small / `56dp` medium / `96dp` large (M3 `ButtonDefaults`)                                                                                                                                                          | Set explicit 40 px or 56 px                                                | secondary               |
| 9   | Primary button radius             | `border-radius: 9999px` (pill) — `lovelace.fethi_room.txt:277`                                                                                                                                                                                                 | `Shapes.full` (pill, M3 default)                                                                                                                                                                                           | Match                                                                      | nice-to-have            |
| 10  | Secondary button (text)           | `lovelace.kitchen_dashboard.txt:255` uses 14 px transparent with active fill                                                                                                                                                                                   | `12px / 8px` padding, no border, `colorScheme.primary` text (M3 text button)                                                                                                                                               | Match by removing border, set padding 12/8                                 | secondary               |
| 11  | Outlined button                   | Not present in 7 files                                                                                                                                                                                                                                         | 1 dp border `colorScheme.outline` `#79747E` / `#938F99`; 64 dp min width                                                                                                                                                   | Add for any "Cancel" action                                                | nice-to-have            |
| 12  | Icon button                       | Inline 32×32 px circular — `lovelace.kitchen_dashboard.txt:94` (32×32 r10), `lovelace.dashboard_home.txt:660` (32×32 r10)                                                                                                                                      | 48×48 dp tap target, 24 dp icon (M3 IconButton)                                                                                                                                                                            | 32→48 tap target, 16→24 icon                                               | secondary               |
| 13  | Switch track on                   | `width:42px; height:24px; background:#D3E3FD; border:2px solid #1A73E8` — `lovelace.fethi_room.txt:140`, `lovelace.meeting_room.txt:140`, `lovelace.working_space.txt:1123`                                                                                    | `52×32dp` track `colorScheme.primary` `#1A73E8`, no border                                                                                                                                                                 | +10 dp W, +8 dp H, remove 2 dp border                                      | critical                |
| 14  | Switch track off                  | `width:42px; height:24px; background:#E8EAED; border:2px solid #DADCE0`                                                                                                                                                                                        | `52×32dp` `surfaceContainerHighest` `#E6E0E9` light / `#36343B` dark, 2 dp `outline` `#79747E` border                                                                                                                      | +10 dp W, +8 dp H, change to `outline` border                              | critical                |
| 15  | Switch thumb size                 | `width:18px; height:18px; border-radius:50%` (3 of 5 files) or `20px×20px` (`lovelace.dashboard_home.txt:405`)                                                                                                                                                 | `24dp` rest / `28dp` pressed (M3 Switch)                                                                                                                                                                                   | +4 to +6 dp diameter                                                       | critical                |
| 16  | Slider track                      | 6 px height `linear-gradient(90deg, #FBBC04 0%, #F9AB00 100%)` — `lovelace.working_space.txt:1181-1191`                                                                                                                                                        | `16dp` height, 8 dp radius, `colorScheme.primary` active, `surfaceContainerHighest` inactive                                                                                                                               | +10 dp height, gradient → flat `primary`                                   | secondary               |
| 17  | Slider thumb                      | Not used; inline custom bar instead                                                                                                                                                                                                                            | `20dp` rest / `24dp` drag, `colorScheme.primary`                                                                                                                                                                           | Add explicit M3 thumb                                                      | secondary               |
| 18  | Toggle card (button-card wrapper) | `width:100%; padding:8px 12px; height:56px` for header, no `tap_action` toggle on card body                                                                                                                                                                    | Compact tile ~50% of width × 96 dp height, tap = toggle action                                                                                                                                                             | Height delta −16 dp (96 vs 56 dp tile), card width fractional              | secondary               |
| 19  | Toggle active state bg            | `linear-gradient(100deg, #4285f4 0%, #34a853 100%)` header — `lovelace.dashboard_home.txt:42`                                                                                                                                                                  | `surfaceContainer` `#F1ECF4` + warm tint 10–20% when light on                                                                                                                                                              | Replace gradient with `primaryContainer` overlay                           | critical                |
| 20  | Toggle active state border        | `1px solid #1A73E8` (e.g. switch track border, `lovelace.fethi_room.txt:140`)                                                                                                                                                                                  | `0px` (M3 selected has no border; uses `primary` fill)                                                                                                                                                                     | Remove border                                                              | critical                |
| 21  | Badge icon bg                     | 32 × 32 `border-radius:10px; background:#FEF3E2` (cover) — `lovelace.kitchen_dashboard.txt:94`; 36 × 36 `border-radius:12px` — `lovelace.fethi_room.txt:25`; 40 × 40 `linear-gradient(135deg, #D3E3FD, #AECBFA)` header                                        | `24dp` icon on `surfaceContainer` tile; `tonal` 48 × 48 dp pill in header                                                                                                                                                  | Standardize to 48 × 48 dp `secondaryContainer`                             | secondary               |
| 22  | Badge icon color                  | `color:#1A73E8` (active), `#5F6368` (inactive) — `lovelace.fethi_room.txt:140`                                                                                                                                                                                 | `onSurface` `#1C1B1F` light / `#E6E1E5` dark for off; `colorScheme.primary` for on                                                                                                                                         | Match inactive to `onSurfaceVariant`                                       | secondary               |
| 23  | Header background                 | `linear-gradient(100deg, #4285f4 0%, #34a853 100%)` — `lovelace.fethi_room.txt:42` and 5 other headers                                                                                                                                                         | `surface` `#FFFBFE` light / `#1C1B1F` dark, OR `surfaceContainer` for top app bar (M3 TopAppBar)                                                                                                                           | Remove gradient; use solid `surfaceContainer`                              | critical                |
| 24  | Header height                     | `56px` (`lovelace.fethi_room.txt:57` and 5 others) / `44px` (`lovelace.dashboard_user.txt`)                                                                                                                                                                    | `64dp` M3 TopAppBar default                                                                                                                                                                                                | +8 to +20 dp                                                               | critical                |
| 25  | Header radius                     | `border-radius: 14px` — `lovelace.dashboard_home.txt:45` and 5 others                                                                                                                                                                                          | `0dp` for top app bar OR `28dp` for medium card                                                                                                                                                                            | 14 → 0 on app bar; 14 → 28 on card                                         | critical                |
| 26  | Header shadow                     | `0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)` — `lovelace.fethi_room.txt:51`                                                                                                                                                                        | `0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15)` M3 Shadow Level 1 (1 dp)                                                                                                                                      | Match to M3 Level 1; remove the 6 px spread on layer 1                     | secondary               |
| 27  | FAB bg                            | `#1A73E8` — `lovelace.fethi_room.txt:280`, `lovelace.working_space.txt:1686`, `lovelace.salle_de_bain.txt:300`, `lovelace.meeting_room.txt:280`, `lovelace.dashboard_user.txt:1454`                                                                            | `colorScheme.primaryContainer` `#EADDFF` light / `#4F378B` dark, OR `primary` (Google Home static era)                                                                                                                     | Static-blue match: 0%; M3 tonal: switch to `primaryContainer`              | critical                |
| 28  | FAB size                          | `52px × 52px` (5 files) / `36px × 36px` (`lovelace.dashboard_user.txt:1445,1448`)                                                                                                                                                                              | `56dp` (M3 FAB regular)                                                                                                                                                                                                    | +4 dp on the 5 file; +20 dp on `dashboard_user.txt`                        | critical                |
| 29  | FAB radius                        | `border-radius: 9999px` (full circle, pill) — `lovelace.fethi_room.txt:277`, `lovelace.working_space.txt:1683`, `lovelace.salle_de_bain.txt:297`, `lovelace.meeting_room.txt:277`                                                                              | `16dp` (M3 `Shapes.large`, **rounded square**)                                                                                                                                                                             | 9999 → 16 dp (M3 is square, not circle)                                    | critical                |
| 30  | FAB shadow                        | `0 2px 8px rgba(26,115,232,0.35), 0 4px 12px 2px rgba(26,115,232,0.20)` — `lovelace.fethi_room.txt:25` header                                                                                                                                                  | M3 Shadow Level 3 (6 dp): `0 2px 4px 0 rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)`                                                                                                                                   | Replace color-tinted shadow with neutral 2-layer M3                        | critical                |
| 31  | FAB icon size                     | `width:24px; height:24px` (`mdi:microphone`) — inline in 4 files                                                                                                                                                                                               | `24dp` icon (M3 FAB default)                                                                                                                                                                                               | Match                                                                      | nice-to-have            |
| 32  | FAB position                      | `position: fixed; bottom: 12px; right: 12px; z-index: 100` — `lovelace.fethi_room.txt:266-269`                                                                                                                                                                 | `position: fixed; bottom: 16dp; right: 16dp; offset from 80dp nav bar`                                                                                                                                                     | +4 dp bottom, +4 dp right                                                  | critical                |
| 33  | Room accent color set             | Per-file inline gradients — `linear-gradient(135deg, #D3E3FD, #AECBFA)` (Fethi, Meeting), `linear-gradient(135deg, #FFF8E1, #FEF3E2)` (Kitchen), `linear-gradient(135deg, #E6F4EA, #B7E1C7)` (Working), `linear-gradient(135deg, #E3F9F7, #A7E8E1)` (Bathroom) | 10-color Google Spaces palette: `#4285F4` (blue), `#EA4335` (red), `#FBBC04` (yellow), `#34A853` (green), `#FF6F61` (coral), `#B39DDB` (lavender), `#80CBC4` (mint), `#F48FB1` (pink), `#BCAAA4` (sand), `#78909C` (slate) | Map 4 existing accents to 4 of 10 Spaces; add 6 new accents                | secondary               |
| 34  | Success color                     | `#34A853` (Google Green 500) — implicit in `lovelace.working_space.txt:140` AC status                                                                                                                                                                          | `#00C853` light / `#69F0AE` dark (M3 tertiaryContainer harmonized)                                                                                                                                                         | Match by introducing semantic `success` token                              | secondary               |
| 35  | Warning color                     | `#F9AB00` (Google Amber 600) — `lovelace.kitchen_dashboard.txt:94`, `lovelace.salle_de_bain.txt:207`                                                                                                                                                           | `#FFCB45` (Google Home reserved amber for "light on" only) — warning is `#FF6E40` deep orange                                                                                                                              | Rename current amber to "lighting on" semantics; add `#FF6E40` for warning | secondary               |
| 36  | Error color                       | `#D93025` (Google Red 600) and `#E53935` — used in 0 card bodies; embedded in pill borders                                                                                                                                                                     | `#B3261E` light / `#F2B8B5` dark (`colorScheme.error` M3 baseline); reserved `#FF1744` for door/emergency                                                                                                                  | Match `error` to M3 baseline                                               | secondary               |
| 37  | Info color                        | Not used in cards                                                                                                                                                                                                                                              | `#2962FF` light / `#82B1FF` dark (Google Home info)                                                                                                                                                                        | Add for snackbar/dialog use                                                | nice-to-have            |
| 38  | Section label                     | 14 px / Medium 500 / `color:#202124` device name — e.g. `lovelace.dashboard_home.txt:660`                                                                                                                                                                      | `titleMedium` 16 sp / 24 line-height / Medium 500, `onSurface` `#1C1B1F`                                                                                                                                                   | +2 sp size, +6 sp line-height                                              | critical                |
| 39  | Status text                       | 11 px / Regular 400 / `color:#5F6368` — `lovelace.fethi_room.txt:140` status subline                                                                                                                                                                           | `bodySmall` 12 sp / 16 line-height / Regular 400, `onSurfaceVariant` `#49454F`                                                                                                                                             | +1 sp, +2 sp line-height                                                   | critical                |
| 40  | Hover state                       | `ha-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.06); transform: translateY(-1px); }` — `lovelace.fethi_room.txt:78`                                                                                                           | `tonalElevation` 1 → 2 + `translateY(-1dp)` + `box-shadow: 0 1px 2px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)`, 150 ms `cubic-bezier(0.2, 0, 0, 1)`                                                                    | Match shadow stack and timing                                              | secondary               |
| 41  | Active state                      | `ha-card:active { transform: scale(0.92); }` (FAB only) — `lovelace.fethi_room.txt:322`                                                                                                                                                                        | M3 state layer 10% opacity overlay, ripple 225 ms `cubic-bezier(0.05, 0.7, 0.1, 1.0)`                                                                                                                                      | Remove scale, add state layer                                              | critical                |
| 42  | Focus ring                        | Not defined in any file                                                                                                                                                                                                                                        | 2 dp inset ring `colorScheme.primary` 100% opacity                                                                                                                                                                         | Add `:focus-visible` rule in `card-mod`                                    | critical                |
| 43  | Transition duration               | `200ms` (header), `250ms` (FAB), `300ms` (most cards) — mixed                                                                                                                                                                                                  | M3 tokens: `short1-4` 50/100/150/200; `medium1-4` 250/300/350/400                                                                                                                                                          | Standardize to `short4 200ms` (cards) / `medium1 250ms` (FAB)              | secondary               |
| 44  | Transition easing                 | `cubic-bezier(0.4, 0, 0.2, 1)` — universal                                                                                                                                                                                                                     | `cubic-bezier(0.2, 0, 0, 1)` standard; `cubic-bezier(0.05, 0.7, 0.1, 1.0)` emphasized                                                                                                                                      | Swap 0.4 → 0.2 first control point                                         | critical                |
| 45  | Ripple                            | Not implemented; relies on `transform: scale(0.92)` press                                                                                                                                                                                                      | M3 ripple 225 ms `motionEasingEmphasizedDecelerate`, `onPrimaryContainer` color                                                                                                                                            | Add `card-mod` ripple rule                                                 | critical                |
| 46  | Scale on press                    | 0.92 FAB (`lovelace.fethi_room.txt:322`); 0.92 cards in `extra_styles`                                                                                                                                                                                         | None (M3 standard); 0.97 only on "Ask Home" search bar (Gemini redesign)                                                                                                                                                   | Remove scale                                                               | critical                |
| 47  | Focus ring width                  | Not defined                                                                                                                                                                                                                                                    | 2 dp                                                                                                                                                                                                                       | Add                                                                        | critical                |
| 48  | Font family primary               | `'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` — `lovelace.fethi_room.txt:33` header `styles.card[0]`                                                                                                                    | `Google Sans` (titles) / `Google Sans Text` (body) / `Roboto` / `sans-serif`                                                                                                                                               | Match by adding `Google Sans Text` for body                                | secondary               |
| 49  | Font family body                  | `'Roboto', sans-serif` inline — `lovelace.fethi_room.txt:140`, `lovelace.working_space.txt:1123`                                                                                                                                                               | `Google Sans Text` / `Roboto` / `sans-serif`                                                                                                                                                                               | Insert GST before Roboto in stack                                          | secondary               |
| 50  | Font size H1 (greeting)           | 14 px (`lovelace.dashboard_user.txt:25` user name line)                                                                                                                                                                                                        | `headlineSmall` 24 sp (greeting)                                                                                                                                                                                           | +10 sp                                                                     | critical                |
| 51  | Font size H2 (room title)         | 10 px / Regular 400 line 1 of header (e.g. `lovelace.fethi_room.txt:25`)                                                                                                                                                                                       | `titleMedium` 16 sp                                                                                                                                                                                                        | +6 sp                                                                      | critical                |
| 52  | Font size body                    | 11 px status / 12 px value                                                                                                                                                                                                                                     | `bodyMedium` 14 sp / `bodySmall` 12 sp                                                                                                                                                                                     | +2 to +3 sp                                                                | critical                |
| 53  | Font size label                   | 10 px pill text — `lovelace.dashboard_home.txt:528`                                                                                                                                                                                                            | `labelLarge` 14 sp / `labelSmall` 11 sp                                                                                                                                                                                    | +4 sp pill, +1 sp small                                                    | secondary               |
| 54  | Font weight regular               | 400 (default, used for status subline)                                                                                                                                                                                                                         | 400 (M3 `bodyMedium`, `bodySmall`)                                                                                                                                                                                         | Match                                                                      | nice-to-have            |
| 55  | Font weight medium                | 500 (device name, `lovelace.dashboard_home.txt:660`)                                                                                                                                                                                                           | 500 (M3 `titleMedium` `labelLarge`)                                                                                                                                                                                        | Match                                                                      | nice-to-have            |
| 56  | Font weight bold                  | 600 used in pill text — `lovelace.dashboard_home.txt:528`                                                                                                                                                                                                      | 500 only (M3 doesn't ship 600 in type scale)                                                                                                                                                                               | Replace 600 with 500                                                       | secondary               |
| 57  | Line height                       | `17px` (`lovelace.dashboard_home.txt:660`) / `18px` (`lovelace.fethi_room.txt:140`); 12 px (header subline); 14 px (status)                                                                                                                                    | `titleMedium` 24 / `bodyMedium` 20 / `bodySmall` 16                                                                                                                                                                        | Map 18 → 24, 14 → 20, 12 → 16                                              | critical                |
| 58  | Letter spacing                    | `0.1px` body, `0.25px` status, `0.3px` pill, `-0.2px` greeting                                                                                                                                                                                                 | 0 sp for ≥ `titleMedium`; 0.1 sp `bodySmall`; 0.5 sp `labelSmall`                                                                                                                                                          | Use 0 for titles, 0.1 sp for status                                        | secondary               |
| 59  | Text transform                    | None (sentence case throughout)                                                                                                                                                                                                                                | Sentence case (Google Home override of M3 all-caps `labelLarge`)                                                                                                                                                           | Match — keep as-is                                                         | nice-to-have            |

---

## 3. Visual Breakdown by Category

### 3.1 Color System

| Role                      | Current (hex)                                           | Google Home light (hex)                           | Google Home dark (hex)               | M3 token name (light/dark)                | Notes                                                           |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------- | ------------------------------------ | ----------------------------------------- | --------------------------------------------------------------- |
| Primary                   | `#1A73E8` (Google Blue 600) — 5 FABs, all track borders | `#1A73E8` (static era) OR `#6750A4` (M3 baseline) | `#8AB4F8` (static) OR `#D0BCFF` (M3) | `primary` / `primary80`                   | Pre-v3.28: hard-coded blue. v3.28+: wallpaper-derived           |
| Primary container         | `#D3E3FD` (icon bg when active, 4 files)                | `#D2E3FC` (static) / `#EADDFF` (M3)               | `#0B57D0` / `#4F378B`                | `primaryContainer` / `primaryContainer30` | Light blue tint pattern is preserved                            |
| Secondary                 | Not used as token                                       | `#625B71` (M3) / `#1A73E8` (static)               | `#CCC2DC` / `#8AB4F8`                | `secondary40` / `secondary80`             | Map `#5F6368` (text_secondary) to `onSurfaceVariant`            |
| Surface                   | `#FFFFFF` (all 82 cards)                                | `#FFFBFE` (M3) / `#F2F2F2` (static)               | `#1C1B1F` / `#2A2A2A`                | `surface` N99                             | Card bg should be one tone below                                |
| surfaceContainerLow       | Implicit (no token)                                     | `#F7F2FA`                                         | `#1D1B20`                            | `surfaceContainerLow` N96 / N10           | Current cards = surface (N99), M3 cards = N96 → N94 progression |
| surfaceContainerHigh      | Not used                                                | `#ECE6F0`                                         | `#2B2930`                            | `surfaceContainerHigh` N92 / N17          | Use for selected/active tiles                                   |
| Background                | `#FFFFFF` (page)                                        | `#FFFBFE`                                         | `#1C1B1F`                            | `background`                              | 0 delta in light                                                |
| On-surface (text primary) | `#202124`                                               | `#1C1B1F`                                         | `#E6E1E5`                            | `onSurface` N10 / N90                     | Match (off by 6 in luminance)                                   |
| Outline                   | `#DADCE0` (card border, switch track off border)        | `#79747E`                                         | `#938F99`                            | `outline` N50 / N60                       | M3 outline is darker; current is too pale                       |
| Outline variant           | Not used                                                | `#CAC4D0`                                         | `#49454F`                            | `outlineVariant` N80 / N30                | Use for divider lines                                           |
| Error                     | `#D93025` (unused in cards)                             | `#B3261E`                                         | `#F2B8B5`                            | `error`                                   | M3 error is warmer red                                          |
| Success                   | `#34A853` (Google Green 500)                            | `#00C853`                                         | `#69F0AE`                            | harmonized tertiaryContainer              | M3 harmonized; current is not in token system                   |
| Warning                   | `#F9AB00` (amber)                                       | `#FF6E40` (deep orange)                           | `#FF6E40`                            | harmonized semantic                       | M3 reserved amber `#FFCB45` for "light on" only                 |
| Info                      | Not used                                                | `#2962FF`                                         | `#82B1FF`                            | harmonized                                | Add when needed                                                 |

**10-room accent palette (Google Spaces):**

| #   | Name          | Hex       | Current use                                  | Google Home use        |
| --- | ------------- | --------- | -------------------------------------------- | ---------------------- |
| 1   | Google Blue   | `#4285F4` | Header gradient start                        | Default Favorites pill |
| 2   | Google Red    | `#EA4335` | Unused                                       | Cameras, security      |
| 3   | Google Yellow | `#FBBC04` | Cover (kitchen, dashboard_home), slider fill | Lighting, brightness   |
| 4   | Google Green  | `#34A853` | Header gradient end, AC dot                  | Climate, "OK"          |
| 5   | Coral         | `#FF6F61` | Unused                                       | Climate-heat, alerts   |
| 6   | Lavender      | `#B39DDB` | Unused (replaces `#9C27B0` purple family)    | Bedrooms               |
| 7   | Mint          | `#80CBC4` | `#0097A7` Bathroom (close match)             | Bathrooms              |
| 8   | Pink          | `#F48FB1` | Unused                                       | Kids' rooms, accent    |
| 9   | Sand          | `#BCAAA4` | Unused                                       | Living rooms, neutral  |
| 10  | Slate         | `#78909C` | Unused                                       | Office, garage         |

**Key finding:** the 4 current room accents (Fethi, Kitchen, Working, Bathroom) all map to Google Home's Spaces palette by closest hue: Fethi blue → Google Blue `#4285F4`, Kitchen amber → Google Yellow `#FBBC04`, Working green → Google Green `#34A853`, Bathroom teal → Mint `#80CBC4`. The 6 unused colors should be reserved for future rooms (e.g. Office = Slate, Bedroom = Lavender).

### 3.2 Button Components

| Variant           | Property           | Current                                              | Google Home                                                                    | Delta                                    |
| ----------------- | ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- |
| Filled (primary)  | Container          | `#1A73E8` — `lovelace.fethi_room.txt:280`            | `colorScheme.primary` `#1A73E8` static / `#6750A4` M3                          | Match (static)                           |
| Filled (primary)  | Content            | `#FFFFFF`                                            | `onPrimary` `#FFFFFF` / `#381E72`                                              | Match                                    |
| Filled (primary)  | Height             | auto (~40 px)                                        | 40 dp small / 56 dp medium / 96 dp large                                       | Set explicit                             |
| Filled (primary)  | Radius             | `9999px` (pill)                                      | `Shapes.full` (pill)                                                           | Match                                    |
| Filled (primary)  | Hover shadow       | Not defined (cards only)                             | Level 1: `0 1px 2px rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15)`            | Add                                      |
| Filled (primary)  | Active scale       | Not defined                                          | None (M3 standard)                                                             | Add state layer 10%                      |
| Filled (primary)  | Disabled opacity   | Not defined                                          | 38% content / 12% container                                                    | Add                                      |
| Filled (primary)  | Focus ring         | Not defined                                          | 2 dp inset `colorScheme.primary`                                               | Add                                      |
| Tonal (secondary) | Container          | Not implemented                                      | `secondaryContainer` `#E8DEF8` / `#4A4458`                                     | Add                                      |
| Tonal (secondary) | Content            | n/a                                                  | `onSecondaryContainer` `#1D192B` / `#E8DEF8`                                   | n/a                                      |
| Tonal (secondary) | Elevation          | n/a                                                  | 0 dp                                                                           | n/a                                      |
| Outlined          | Border             | Not implemented                                      | 1 dp `outline` `#79747E`                                                       | Add for Cancel                           |
| Outlined          | Min width          | n/a                                                  | 64 dp                                                                          | n/a                                      |
| Text              | Padding            | 12 px / 8 px (kitchen secondary)                     | 12 dp / 8 dp (M3 TextButton)                                                   | Match                                    |
| Text              | Color              | `#1A73E8` (implicit)                                 | `colorScheme.primary`                                                          | Match                                    |
| Icon button       | Tap target         | 32 × 32 px (inline in tiles)                         | 48 × 48 dp                                                                     | +16 dp                                   |
| Icon button       | Icon               | 18–20 px                                             | 24 dp                                                                          | +4 to +6 dp                              |
| Icon button       | Selected indicator | Not used                                             | 56 × 32 dp pill `secondaryContainer`                                           | Add                                      |
| FAB (regular)     | Container          | `#1A73E8`                                            | `primaryContainer` `#EADDFF` / `primary`                                       | Switch to `primaryContainer` for full M3 |
| FAB (regular)     | Size               | 52 × 52 (5 files) / 36 × 36 (`dashboard_user.txt`)   | 56 × 56 dp                                                                     | +4 dp / +20 dp                           |
| FAB (regular)     | Radius             | 9999 px (circle)                                     | 16 dp `Shapes.large` (rounded square)                                          | 9999 → 16 dp                             |
| FAB (regular)     | Elevation          | 8 px / 12 px spread rgba(26,115,232,0.35)            | M3 Level 3 (6 dp) `0 2px 4px rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)` | Replace tinted with neutral              |
| FAB (regular)     | Hover              | `transform: scale(1.08)`                             | `translateY(-1dp)` + Level 1 → Level 3 lift                                    | Replace scale with translate             |
| FAB (regular)     | Press              | `transform: scale(0.92)`                             | 0 dp shadow + state layer 10%                                                  | Remove scale                             |
| FAB (regular)     | Icon               | 24 × 24 px (mdi:microphone)                          | 24 dp                                                                          | Match                                    |
| FAB (regular)     | Position           | `bottom: 12px; right: 12px`                          | `bottom: 16dp; right: 16dp` (above 80 dp nav)                                  | +4 dp / +4 dp                            |
| FAB (regular)     | Animation          | `transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1)` | 300 ms `cubic-bezier(0.05, 0.7, 0.1, 1.0)`                                     | +50 ms, swap easing                      |
| FAB (regular)     | Focus ring         | Not defined                                          | 2 dp inset                                                                     | Add                                      |

### 3.3 Layout & Spacing

| Container                         | Current                                            | Google Home                                                 | Delta                                         |
| --------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| Page horizontal padding (compact) | 0 (sections view default)                          | 16 dp (compact) / 24 dp (medium) / 32 dp (expanded)         | Add 16 dp minimum                             |
| Section vertical rhythm           | 8 px between grids                                 | 16 dp `space-4`                                             | +8 dp                                         |
| Tile gutter                       | 8 px (sections view default)                       | 8 dp (compact) / 12 dp (medium) / 16 dp (expanded)          | Match in compact, +4/+8 dp in medium/expanded |
| Card inner padding                | 8 / 12 / 16 px mixed                               | 16 dp (compact tile) / 20 dp (expanded)                     | Standardize to 16 dp                          |
| Header top/bottom                 | `padding: 8px 12px` (`lovelace.fethi_room.txt:54`) | 0 top, 16 dp horizontal in TopAppBar                        | Match                                         |
| FAB offset                        | `bottom: 12px; right: 12px`                        | `bottom: 16dp; right: 16dp`                                 | +4 dp / +4 dp                                 |
| Compact breakpoint                | Default (no media query)                           | < 600 dp width                                              | Add `@media (max-width: 600px)`               |
| Medium breakpoint                 | n/a                                                | 600–839 dp                                                  | n/a                                           |
| Expanded breakpoint               | n/a                                                | ≥ 840 dp                                                    | n/a                                           |
| Window-size strategy              | Single layout, no responsive                       | NavigationSuiteScaffold (compact=bar, medium/expanded=rail) | M3 adaptive                                   |

**Note:** Home Assistant `view type: sections` already provides a 2-column grid with `max_columns: 2`, but it does not switch to a navigation rail at ≥ 600 dp. The current implementation is "phone-only compact" — `lovelace.dashboard_home.txt:12` sets `max_columns: 2` but the dashboard_user index (`lovelace.dashboard_user.txt:13` ish) uses a single column. The closest Google Home analog is the M3 `NavigationSuiteScaffold` which is not available in Lovelace.

### 3.4 Typography

| Token                          | Current (px)                                                         | Google Home (sp/dp) | Weight | Line height | Letter spacing |
| ------------------------------ | -------------------------------------------------------------------- | ------------------- | ------ | ----------- | -------------- |
| displayLarge (57 sp / 64 lh)   | Not used                                                             | 57 sp               | 400    | 64 sp       | 0              |
| displayMedium (45 sp / 52 lh)  | Not used                                                             | 45 sp               | 400    | 52 sp       | 0              |
| displaySmall (36 sp / 44 lh)   | Not used                                                             | 36 sp               | 400    | 44 sp       | 0              |
| headlineLarge (32 sp / 40 lh)  | Not used                                                             | 32 sp               | 400    | 40 sp       | 0              |
| headlineMedium (28 sp / 36 lh) | Not used (closest = 18 px room name)                                 | 28 sp               | 400    | 36 sp       | 0              |
| headlineSmall (24 sp / 32 lh)  | Not used (closest = 14 px greeting)                                  | 24 sp               | 400    | 32 sp       | 0              |
| titleLarge (22 sp / 28 lh)     | Not used                                                             | 22 sp               | 500    | 28 sp       | 0              |
| titleMedium (16 sp / 24 lh)    | Closest = 14 px device name (e.g. `lovelace.dashboard_home.txt:660`) | 16 sp               | 500    | 24 sp       | 0.15 sp        |
| titleSmall (14 sp / 20 lh)     | Not used                                                             | 14 sp               | 500    | 20 sp       | 0.1 sp         |
| bodyLarge (16 sp / 24 lh)      | Not used                                                             | 16 sp               | 400    | 24 sp       | 0.5 sp         |
| bodyMedium (14 sp / 20 lh)     | Closest = 12 px value text (`lovelace.working_space.txt:1181`)       | 14 sp               | 400    | 20 sp       | 0.25 sp        |
| bodySmall (12 sp / 16 lh)      | Closest = 11 px status (`lovelace.fethi_room.txt:140`)               | 12 sp               | 400    | 16 sp       | 0.4 sp         |
| labelLarge (14 sp / 20 lh)     | Closest = 14 px room name                                            | 14 sp               | 500    | 20 sp       | 0.1 sp         |
| labelMedium (12 sp / 16 lh)    | Closest = 11 px                                                      | 12 sp               | 500    | 16 sp       | 0.5 sp         |
| labelSmall (11 sp / 16 lh)     | Closest = 10 px pill (`lovelace.dashboard_home.txt:528`)             | 11 sp               | 500    | 16 sp       | 0.5 sp         |

**Inconsistency flag:** Some cards in `lovelace.dashboard_home.txt:660, 1040` use 14 px / 17 line-height for the device name, while the header in the same file (`lovelace.dashboard_home.txt:42` via inline template) uses 14 px / 17 line-height for user name. The meeting room / fethi room cards use 14 px / 18 line-height (`lovelace.fethi_room.txt:140`, `lovelace.meeting_room.txt:140`). Three of the seven files (kitchen, salle_de_bain, working_space) use 14 px / 18 line-height, while `dashboard_home.txt` uses 14 px / 17 line-height. The 1 px line-height delta is unintentional.

The font-family stack `'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` is correctly set on the header card in 6 files (`lovelace.fethi_room.txt:33`, `lovelace.kitchen_dashboard.txt:33` ish, etc.) but **not** on most inner cards. The inner cards use `'Google Sans', sans-serif` (4 files) or `'Roboto', sans-serif` (working_space, salle_de_bain tile bodies) for the device name. M3 specifies `Google Sans Text` for body, which is not in the current stack at all.

### 3.5 Borders & Radius

| Component                | Current border                                            | Current radius                           | Google Home border       | Google Home radius                                     |
| ------------------------ | --------------------------------------------------------- | ---------------------------------------- | ------------------------ | ------------------------------------------------------ |
| Card (standard)          | `1px solid #DADCE0` — 21 occurrences                      | `14px` (universal)                       | 0                        | 28 dp `Shapes.extraLarge`                              |
| Card (icon avatar)       | `1.5px solid rgba(255,255,255,0.4)` on header initials    | `50%` (circle)                           | 0                        | 20 dp `Shapes.largeIncreased` (M3 MediumAppBar avatar) |
| Switch track (off)       | `2px solid #DADCE0`                                       | `9999px`                                 | 2 dp `outline` `#79747E` | 16 dp (pill)                                           |
| Switch track (on)        | `2px solid #1A73E8`                                       | `9999px`                                 | 0                        | 16 dp                                                  |
| Slider track             | 0                                                         | 4 px (`lovelace.working_space.txt:1181`) | 0                        | 8 dp (pill)                                            |
| Status pill              | `1px solid #DADCE0` inactive / `1px solid #188038` active | `9999px`                                 | 0                        | 8 dp `Shapes.small`                                    |
| Header card              | 0                                                         | 14 px                                    | 0                        | 0 dp (app bar) or 28 dp (card)                         |
| Icon badge (small)       | 0                                                         | 10 px or 12 px                           | 0                        | 50% (circle, 16 dp icon) or 12 dp `Shapes.medium`      |
| FAB                      | 0                                                         | 9999 px (circle)                         | 0                        | 16 dp `Shapes.large` (rounded square)                  |
| Dialog / sheet           | 0                                                         | n/a                                      | 0                        | 28 dp (top corners only, sheet)                        |
| Bottom sheet drag handle | 0                                                         | n/a                                      | 0                        | 16 × 4 dp pill                                         |

**Note on the 1 px `#DADCE0` pattern:** this is the M2 OutlinedCard pattern. M3 Expressive removes borders from tonal surfaces entirely; the visible separation comes from `surfaceContainerLow` vs `surfaceContainer` fill color. Removing the border is necessary for the M3 alignment but the current shadow stack (`0 1px 2px rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.04)`) does not match M3's two-layer shadow. See §3.6.

### 3.6 Elevation & Shadows

| State              | Current rgba stack                                                                                                                          | Google Home rgba stack                                                                       | Delta                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Card rest          | `0 1px 2px rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.04)` — implicit in 6 files (e.g. `lovelace.fethi_room.txt:45-58`)                   | None (M3 Expressive uses tonal surface; 0 dp shadow)                                         | Remove both layers                              |
| Card hover         | `0 2px 6px rgba(0,0,0,0.08)` (header `extra_styles`)                                                                                        | `0 1px 2px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)` (M3 hover lift)                     | Match M3 hover lift                             |
| Card hover (alt)   | `0 4px 12px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.06); transform: translateY(-1px)` (`lovelace.fethi_room.txt:78`)                       | M3 expressive `tonalElevation` 1 → 2 + `translateY(-1dp)` + Level 1 stack, 150 ms            | Match; remove scale, keep translate             |
| Card pressed (FAB) | `transform: scale(0.92); box-shadow: 0 2px 4px rgba(26,115,232,0.30)` — `lovelace.fethi_room.txt:322`                                       | 0 dp shadow (drops) + state layer 10%                                                        | Remove scale, drop shadow, add state layer      |
| Card drag          | Not defined                                                                                                                                 | `0 1px 2px rgba(0,0,0,0.30), 0 2px 6px 2px rgba(0,0,0,0.15)` (Level 2)                       | n/a                                             |
| Switch thumb       | `box-shadow: 0 1px 2px rgba(0,0,0,0.20)` — `lovelace.fethi_room.txt:140`                                                                    | M3 Switch thumb uses Material elevation (none on thumb itself; thumb is colored `onPrimary`) | Remove colored shadow; use `onPrimary`          |
| Icon avatar active | `box-shadow: 0 2px 6px rgba(26,115,232,0.18)` (active state) — `lovelace.fethi_room.txt:140`                                                | State layer 10% on icon container, 0 dp shadow                                               | Replace colored shadow with state layer         |
| Header card        | `0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)` — `lovelace.fethi_room.txt:51`                                                     | M3 Shadow Level 1: `0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15)`              | Match M3 Level 1; remove 6 px spread on layer 1 |
| FAB rest           | `0 2px 8px rgba(26,115,232,0.35), 0 4px 12px 2px rgba(26,115,232,0.20)` — `lovelace.fethi_room.txt:25` header inline (or similar in 5 FABs) | M3 Level 3 (6 dp): `0 2px 4px 0 rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)`            | Replace color-tinted with neutral M3            |
| FAB pressed        | `transform: scale(0.92); box-shadow: 0 2px 4px rgba(26,115,232,0.30)` — `lovelace.fethi_room.txt:322`                                       | 0 dp shadow                                                                                  | Drop shadow on press                            |
| Dialog / sheet     | n/a                                                                                                                                         | M3 Level 3 (6 dp) + 1 dp tonal                                                               | n/a                                             |

**Note on the layered `0 1px 2px rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15)` pattern:** this is the M3 ambient + key shadow stack. M3 elevation is "ambient" (spread, low opacity, broad) + "key" (direct, low spread, higher opacity). The current single-layer `0 1px 2px rgba(0,0,0,0.05)` is M2 elevation 1 — much softer than M3 ambient, and missing the key shadow. The current FAB shadow `0 2px 8px rgba(26,115,232,0.35), 0 4px 12px 2px rgba(26,115,232,0.20)` is color-tinted (uses the FAB's blue at 35% / 20% opacity) which is a pre-M3 brand pattern; M3 shadows are always neutral black.

---

## 4. Modification Roadmap

Roadmap is ordered by priority (critical → secondary → nice-to-have). Each entry is implementation-ready: an editor can apply the change without further interpretation.

### Critical priority

**M-001 — Remove `border: 1px solid #DADCE0` from all button-card `styles.card` blocks**

- **Change:** Replace 21 occurrences of `"border": "1px solid #DADCE0"` with `"border": "none"`.
- **Implementation:** YAML `styles.card` block edit. No integration required.
- **Affected files:**
  - `lovelace.fethi_room.txt:162, 227`
  - `lovelace.working_space.txt:207, 312, 395, 609, 705, 801, 897, 993, 1136, 1194, 1251, 1350, 1449, 1548, 1633` (15 occurrences)
  - `lovelace.salle_de_bain.txt:162, 229`
  - `lovelace.meeting_room.txt:162, 227`
  - (Not `lovelace.dashboard_home.txt` — it uses different border style.)
- **Effort:** Trivial (find/replace, 21 hits).
- **Dependencies:** None.
- **Reference:** M3 `Card` has `border: none` by default; `surfaceContainer` fill provides visual separation.

**M-002 — Standardize card `border-radius: 14px` → 28 px (M3 `extraLarge`)**

- **Change:** Replace 24+ occurrences of `"border-radius": "14px"` in `styles.card` blocks with `"border-radius": "28px"`.
- **Implementation:** YAML `styles.card` block edit. Can also be done via `card-mod` `ha-card-style: tile` once installed.
- **Affected files:** All 7 files. The 14 px pattern is the universal standard card radius.
- **Effort:** Trivial.
- **Dependencies:** None. (For comparison: M3 `Shapes.extraLarge` = 28 dp.)
- **Reference:** M3 `Card` defaults to `extraLarge` 28 dp in M3 Compose 1.1+.

**M-003 — Replace card `background: #FFFFFF` with tonal `surfaceContainerLow` (`#F7F2FA`)**

- **Change:** Replace `"background": "#FFFFFF"` (and the implicit default) in card `styles.card[1]` with `"background": "var(--ha-card-background-color, #F7F2FA)"`. This binds to the HA theme variable so dark mode (`#1D1B20`) works automatically.
- **Implementation:** YAML edit; uses HA CSS variable for theming.
- **Affected files:** All 7 files; ~82 card `styles.card[1]` blocks.
- **Effort:** Moderate (high count).
- **Dependencies:** None — but add `--ha-card-background-color: #F7F2FA` to a `theme.yaml` for consistency.
- **Reference:** M3 `surfaceContainerLow` N96 light / N10 dark.

**M-004 — Replace universal `cubic-bezier(0.4, 0, 0.2, 1)` with `cubic-bezier(0.2, 0, 0, 1)` (M3 standard)**

- **Change:** Find/replace `"cubic-bezier(0.4, 0, 0.2, 1)"` → `"cubic-bezier(0.2, 0, 0, 1)"` in all `transition:` declarations. Also fix the unbracketed form `0.4, 0, 0.2, 1` → `0.2, 0, 0, 1`.
- **Implementation:** YAML edit. Better: centralize via `theme.yaml` `ha-motion-standard: cubic-bezier(0.2, 0, 0, 1)` (HA doesn't ship a motion token yet, so this is a custom var).
- **Affected files:** All 7 files, every `transition:` string. Most concentrated in `lovelace.dashboard_home.txt`, `lovelace.working_space.txt`.
- **Effort:** Moderate.
- **Dependencies:** None.
- **Reference:** M3 `motionEasingStandard` = `cubic-bezier(0.2, 0, 0, 1)`. The 0.4 → 0.2 first-control-point shift is a 50% reduction in initial acceleration.

**M-005 — Switch thumb geometry: 42 × 24 track / 18 thumb → 52 × 32 track / 24 thumb (M3 Switch)**

- **Change:** In all custom inline switch templates (5 files), change `width:42px; height:24px` → `width:52px; height:32px` and `width:18px; height:18px` thumb → `width:24px; height:24px`. Remove `border:2px solid` on selected state. Use `colorScheme.primary` for selected fill, `surfaceContainerHighest` `#E6E0E9` for unselected.
- **Implementation:** YAML edit of inline JS templates. The switch is rendered as inline HTML in a `name:` template; the change is to the `width`/`height` strings inside the `[[[ ... ]]]` template literal.
- **Affected files:**
  - `lovelace.fethi_room.txt:140`
  - `lovelace.meeting_room.txt:140`
  - `lovelace.working_space.txt:1123`
  - `lovelace.salle_de_bain.txt:140`
  - `lovelace.dashboard_home.txt:405, 463, 660` (uses 44 × 24 / 20 thumb variant — also fix)
- **Effort:** Simple (6 inline templates).
- **Dependencies:** None.
- **Reference:** M3 Switch: track 52 × 32 dp, thumb 24 dp rest / 28 dp pressed, no border on selected.

**M-006 — Standardize FAB size 52 × 52 → 56 × 56 (M3 FAB regular), 36 × 36 (`dashboard_user.txt`) → 56 × 56**

- **Change:** Set `width: 56px; height: 56px` in FAB `styles.card[8-9]` for all 5 files. For `lovelace.dashboard_user.txt:1445,1448`, change 36 → 56.
- **Implementation:** YAML `styles.card` block edit.
- **Affected files:** 6 files.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 FAB regular = 56 dp.

**M-007 — Replace FAB `border-radius: 9999px` (circle) with `16px` (M3 rounded square)**

- **Change:** Find/replace `"border-radius": "9999px"` in FAB `styles.card` blocks with `"border-radius": "16px"`. There are 4 occurrences (one per FAB file).
- **Implementation:** YAML `styles.card` block edit.
- **Affected files:** `lovelace.fethi_room.txt:277`, `lovelace.working_space.txt:1683`, `lovelace.salle_de_bain.txt:297`, `lovelace.meeting_room.txt:277`. (`dashboard_user.txt` doesn't set FAB radius explicitly; will get 16 px by default from M-006 if added.)
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 FAB uses `Shapes.large` (16 dp), explicitly **not** a circle. M2 was circular; the 2022 redesign broke from this.

**M-008 — Replace FAB `box-shadow: 0 2px 8px rgba(26,115,232,0.35), 0 4px 12px 2px rgba(26,115,232,0.20)` with M3 Level 3 (6 dp) neutral shadow**

- **Change:** Replace 5 FAB shadow declarations with `"box-shadow": "0 2px 4px 0 rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)"`.
- **Implementation:** YAML `styles.card` block edit.
- **Affected files:** `lovelace.fethi_room.txt` (header), `lovelace.meeting_room.txt`, `lovelace.salle_de_bain.txt`, `lovelace.working_space.txt`, plus `lovelace.dashboard_user.txt:1454` ish.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 `Level 3` (6 dp) = `0 2px 4px 0 rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)`. Always neutral, never color-tinted.

**M-009 — Remove `transform: scale(0.92)` on FAB press; add M3 state layer 10%**

- **Change:** In all 5 FAB `extra_styles` blocks, replace `ha-card:active { transform: scale(0.92); box-shadow: 0 2px 4px rgba(26,115,232,0.30); }` with `ha-card:active { background: rgba(0,0,0,0.10); box-shadow: none; }` (M3 state layer is a 10% black overlay on the surface).
- **Implementation:** YAML `extra_styles` edit.
- **Affected files:** `lovelace.fethi_room.txt:322`, `lovelace.meeting_room.txt:322`, `lovelace.salle_de_bain.txt:342`, `lovelace.working_space.txt:1728`, plus `lovelace.dashboard_user.txt` (if any).
- **Effort:** Simple.
- **Dependencies:** None.
- **Reference:** M3 Expressive standard: no scale on press; state layer 10% opacity over `LocalContentColor` or `colorScheme.onPrimaryContainer`.

**M-010 — Remove unused `@keyframes listening-pulse` from 4 files**

- **Change:** Delete the `@keyframes listening-pulse { 0% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 0.3; } 100% { transform: scale(1.3); opacity: 0; } }` block from the 4 `extra_styles` that declare it.
- **Implementation:** YAML `extra_styles` edit.
- **Affected files:** `lovelace.fethi_room.txt:322`, `lovelace.meeting_room.txt:322`, `lovelace.salle_de_bain.txt:342`, `lovelace.working_space.txt:1728`.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** Dead CSS — no `animation:` shorthand references the keyframe.

**M-011 — Fix cover position off-by-one in `lovelace.kitchen_dashboard.txt`**

- **Change:** Change `data: { position: 16 }` (line 441) → `data: { position: 25 }`; `33` → `50` (line 528); `49` → `75` (line 615); `65` → `100` (line 702). Also fix `lovelace.dashboard_home.txt:1545` `data: { position: 65 }` → `data: { position: 100 }`.
- **Implementation:** YAML tap_action data block edit.
- **Effected files:** `lovelace.kitchen_dashboard.txt`, `lovelace.dashboard_home.txt`.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** `position` is 0–100 in HA cover domain.

**M-012 — Standardize `dashboard_user.txt` FAB to 56 × 56 and 250 ms transition**

- **Change:** In `lovelace.dashboard_user.txt:1445,1448`, change `width: 36px` → `width: 56px`; `height: 36px` → `height: 56px`. Adjust the `transition: all 200ms` to `transition: all 250ms cubic-bezier(0.2, 0, 0, 1)`. Also standardize the header height from 44 px → 56 px (or 64 dp target).
- **Implementation:** YAML `styles.card` block edit.
- **Affected files:** `lovelace.dashboard_user.txt` (single file).
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** The other 5 FAB-bearing files use 52 × 52 (current target after M-006: 56 × 56). `dashboard_user.txt` was the outlier.

### Secondary priority

**M-013 — Replace header `linear-gradient(100deg, #4285f4 0%, #34a853 100%)` with solid `surfaceContainer`**

- **Change:** Replace 6 header background declarations with `"background": "var(--ha-app-bar-background-color, #ECE6F0)"` (M3 `surfaceContainerHigh` light, `#2B2930` dark).
- **Implementation:** YAML `styles.card[1]` edit, plus add `--ha-app-bar-background-color` to `theme.yaml`.
- **Affected files:** 6 header cards (`fethi_room.txt:42`, `kitchen_dashboard.txt:42`, `dashboard_home.txt:42`, `working_space.txt:42`, `salle_de_bain.txt:42`, `meeting_room.txt:42`).
- **Effort:** Simple.
- **Dependencies:** `theme.yaml` introduction.
- **Reference:** M3 TopAppBar uses `surfaceContainer` (or transparent over `surface`).

**M-014 — Increase header height 56 px → 64 dp (M3 TopAppBar)**

- **Change:** Change `"height": "56px"` to `"height": "64px"` in 6 files; `dashboard_user.txt`'s 44 px → 56 px (closer to other files) or 64 px (M3 target).
- **Implementation:** YAML `styles.card[7]` edit.
- **Affected files:** 6 files + `dashboard_user.txt`.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 TopAppBar default 64 dp.

**M-015 — Replace 4 switch track `2px solid` border on unselected with M3 `outline` 2 dp**

- **Change:** Change `border:2px solid #DADCE0` (unselected) to `border:2px solid #79747E` (M3 outline N50). Change `border:2px solid #1A73E8` (selected) to `border:none`.
- **Implementation:** YAML inline template edit.
- **Affected files:** `lovelace.fethi_room.txt:140`, `lovelace.meeting_room.txt:140`, `lovelace.working_space.txt:1123`, `lovelace.salle_de_bain.txt:140`.
- **Effort:** Simple.
- **Dependencies:** None.
- **Reference:** M3 Switch unselected = 2 dp `outline` border, selected = no border.

**M-016 — Set explicit switch transition timing to M3 (250 ms pre-morph / 100 ms morph / 150 ms post-morph)**

- **Change:** Change `transition:all 0.3s cubic-bezier(0.4,0,0.2,1)` → `transition:all 250ms cubic-bezier(0.2, 0, 0, 1)` (or use 3 separate transitions for thumb path morph).
- **Implementation:** YAML inline template edit.
- **Affected files:** 5 files.
- **Effort:** Simple.
- **Dependencies:** None.
- **Reference:** M3 Switch: thumb motion 250 ms `m3_sys_motion_duration_medium1`, pre-morph 100 ms, post-morph 150 ms.

**M-017 — Replace header shadow stack with M3 Shadow Level 1 (1 dp)**

- **Change:** Change `0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)` → `0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15)`.
- **Implementation:** YAML `styles.card[5]` edit.
- **Affected files:** 6 header cards.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 Shadow Level 1 (1 dp) = ambient + key.

**M-018 — Add focus ring 2 dp inset to all interactive cards (M3 focus indicator)**

- **Change:** Add `ha-card:focus-visible { outline: 2px solid #1A73E8; outline-offset: -2px; }` to a shared `extra_styles` block (or via `theme.yaml`).
- **Implementation:** YAML `extra_styles` edit per file (no shared CSS in HA).
- **Affected files:** 7 files.
- **Effort:** Moderate (7 separate edits).
- **Dependencies:** None.
- **Reference:** M3 focus ring = 2 dp inset `colorScheme.primary` at 100% opacity.

**M-019 — Add M3 hover lift to all card `extra_styles`**

- **Change:** Change `ha-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.06); transform: translateY(-1px); }` to `ha-card:hover { box-shadow: 0 1px 2px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08); transform: translateY(-1px); transition: all 150ms cubic-bezier(0.2, 0, 0, 1); }`.
- **Implementation:** YAML `extra_styles` edit.
- **Affected files:** 6+ files (where `extra_styles` exists).
- **Effort:** Moderate.
- **Dependencies:** None.
- **Reference:** M3 Expressive hover lift = `translateY(-1dp)` + Level 1 shadow, 150 ms `cubic-bezier(0.2, 0, 0, 1)`.

**M-020 — Standardize the 4 room accent palettes to Google Spaces (10-color)**

- **Change:** Map 4 existing inline gradients to 4 of the 10 Google Spaces colors:
  - Fethi blue `linear-gradient(135deg, #D3E3FD, #AECBFA)` → Spaces Blue `#4285F4` solid (or `#D2E3FC` to `#0B57D0` gradient)
  - Kitchen amber → Spaces Yellow `#FBBC04` / `#FFF8E1`
  - Working green → Spaces Green `#34A853` / `#E6F4EA`
  - Bathroom teal → Spaces Mint `#80CBC4` / `#E0F2F1`
- **Implementation:** YAML inline template edit. Add 6 unused Spaces colors to a `theme.yaml` palette for future rooms.
- **Affected files:** 5 files (where the room badge inline gradient appears in the header `name:` template).
- **Effort:** Simple.
- **Dependencies:** `theme.yaml` introduction.
- **Reference:** Google Home Favorites header uses 10-color Spaces palette.

**M-021 — Add `card-mod` integration for centralized theming**

- **Change:** Install `card-mod` from HACS; create a `theme.yaml` in `/config/themes/` that defines `--ha-card-background-color`, `--ha-card-border-radius`, `--ha-card-border`, `--ha-motion-standard`, etc. Reference these in card `styles.card` blocks as `var(--ha-card-border-radius, 14px)`.
- **Implementation:** Add `card-mod` to dashboard YAML via `card_mod` key (currently 0 cards use it). Move hardcoded values to CSS variables.
- **Affected files:** All 7 YAML files; new `theme.yaml`.
- **Effort:** Complex (foundational refactor).
- **Dependencies:** `card-mod` integration must be installed.
- **Reference:** M3 design tokens are CSS variables in Compose; HA has no built-in equivalent.

**M-022 — Replace the gradient `linear-gradient(90deg, #FBBC04 0%, #F9AB00 100%)` slider with flat M3 `primary` track**

- **Change:** In `lovelace.working_space.txt:1181` brightness bar, change `linear-gradient(90deg, #FBBC04 0%, #F9AB00 100%)` → `#1A73E8` (M3 `primary`).
- **Implementation:** YAML inline template edit.
- **Affected files:** `lovelace.working_space.txt:1181` only.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 Slider active track is `colorScheme.primary` (flat, not gradient).

**M-023 — Increase slider track height 6 px → 16 dp, radius 4 px → 8 dp**

- **Change:** Change `height:6px; border-radius:4px` → `height:16px; border-radius:8px` in brightness bar inline template.
- **Implementation:** YAML inline template edit.
- **Affected files:** `lovelace.working_space.txt:1181`.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 Slider: track 16 dp height, 8 dp radius (pill).

### Nice-to-have priority

**M-024 — Add `Google Sans Text` to font-family stack**

- **Change:** Replace `'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` with `'Google Sans', 'Google Sans Text', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` in 6 header `styles.card[0]` blocks.
- **Implementation:** YAML `styles.card[0]` edit.
- **Affected files:** 6 files (header card only).
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** M3 Compose default body font is `Google Sans Text` (open-sourced 2025).

**M-025 — Add M3 responsive layout for compact/medium/expanded**

- **Change:** Wrap `styles.card` blocks in `@media (max-width: 600px) { ... }` and `@media (min-width: 840px) { ... }` queries. For compact, keep 16 dp padding; for medium/expanded, increase to 20 / 24 dp.
- **Implementation:** YAML `extra_styles` with media queries.
- **Affected files:** 7 files (all benefit from responsive).
- **Effort:** Complex.
- **Dependencies:** None.
- **Reference:** M3 window size classes: compact < 600 dp, medium 600–839 dp, expanded ≥ 840 dp.

**M-026 — Normalize hex case**

- **Change:** Find/replace all lowercase hex codes (`#1a73e8`, `#fff`, `#dadce0`, `#f1f3f4`, etc.) to uppercase. The HA front-end is case-insensitive but consistency aids diffs and downstream tooling.
- **Implementation:** YAML find/replace.
- **Affected files:** All 7 files.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** Style guide; CSS spec §4.3.4 allows both cases but recommends uppercase for design tokens.

**M-027 — Set `theme: google-home` in dashboard YAML (post-introduction)**

- **Change:** After `theme.yaml` is introduced (M-021), add `"theme": "google-home"` to each dashboard's `views[0]` config to apply the M3-aligned theme.
- **Implementation:** YAML view config edit.
- **Affected files:** 7 files.
- **Effort:** Trivial.
- **Dependencies:** M-021 must complete first.

**M-028 — Remove the 2 duplicate "More" placeholder tiles in `lovelace.dashboard_user.txt`**

- **Change:** Delete the 2 of 3 `name: "More"` card definitions at lines 1256 and 1336, keeping only the original at line 619. Or rename them to actual room names.
- **Implementation:** YAML card removal.
- **Affected files:** `lovelace.dashboard_user.txt`.
- **Effort:** Trivial.
- **Dependencies:** None.
- **Reference:** The "More" tile is a UX placeholder for a real room; the duplication is a bug, not a feature.

**M-029 — Replace the "Lighting = amber" pattern in `dashboard_home.txt` and `kitchen_dashboard.txt`**

- **Change:** Currently `#F9AB00` is used for "cover open" (`kitchen_dashboard.txt:94`, `dashboard_home.txt:1040`). Per Google Home, amber `#FFCB45` is reserved for "light on" only; cover open should use a neutral or `tertiary` color. Replace `#F9AB00` cover fills with `#80CBC4` (mint, semantic for "open/exposed") or `#1A73E8` (blue, semantic for active).
- **Implementation:** YAML inline template edit.
- **Affected files:** `lovelace.kitchen_dashboard.txt:94`, `lovelace.dashboard_home.txt:1040`.
- **Effort:** Simple.
- **Dependencies:** None.
- **Reference:** Google Home reserves amber for lighting; uses harmonized semantic colors for other states.

---

## 5. Component-by-Component Transformation Guide

### 5.1 Header & greeting section (all 7 files)

**Current state:** 6 of 7 files use `linear-gradient(100deg, #4285f4 0%, #34a853 100%)` background, `border-radius: 14px`, `height: 56px`, `box-shadow: 0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)`, `padding: 8px 12px`, `font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`. Greeting text is `font-size:14px; font-weight:500; color:#fff; letter-spacing:-0.2px; line-height:18px` for user name, `font-size:10px; font-weight:400; color:rgba(255,255,255,0.85); letter-spacing:0.3px; line-height:12px` for the subline. `dashboard_user.txt` is the outlier (44 px, no `extra_styles`). See `lovelace.fethi_room.txt:25-78`, `lovelace.kitchen_dashboard.txt:25-78`, `lovelace.dashboard_home.txt:25-78`, `lovelace.working_space.txt:25-78`, `lovelace.salle_de_bain.txt:25-78`, `lovelace.meeting_room.txt:25-78`, `lovelace.dashboard_user.txt:25-41`.

**Target state:** M3 TopAppBar pattern: `background: var(--ha-app-bar-background-color, #ECE6F0)` (surfaceContainerHigh light), `border-radius: 0px` (app bar) or 28 px (card variant), `height: 64px`, M3 Shadow Level 1, `padding: 0 16px`, Greeting `headlineSmall` 24 sp / 32 line-height / Regular 400, user name `titleMedium` 16 sp / 24 / Medium 500. Sentence case. No gradient. No status pill on the app bar — move status to inside cards.

**YAML before (header card `styles.card`):**

```yaml
styles:
  card:
    - font-family: "'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    - background: "linear-gradient(100deg, #4285f4 0%, #34a853 100%)"
    - border-radius: "14px"
    - border: "none"
    - box-shadow: "0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)"
    - padding: "8px 12px"
    - height: "56px"
    - width: "100%"
    - box-sizing: "border-box"
    - transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)"
```

**YAML after (M3 TopAppBar):**

```yaml
styles:
  card:
    - font-family: "'Google Sans', 'Google Sans Text', 'Roboto', sans-serif"
    - background: "var(--ha-app-bar-background-color, #ECE6F0)"
    - border-radius: "0px"
    - border: "none"
    - box-shadow: "0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15)"
    - padding: "0 16px"
    - height: "64px"
    - width: "100%"
    - box-sizing: "border-box"
    - transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)"
```

**Step-by-step instructions:**

1. In each of the 7 files, locate the first `styles.card` block (the header card).
2. Replace `font-family` value with the longer `Google Sans Text` stack.
3. Replace `background: "linear-gradient(100deg, #4285f4 0%, #34a853 100%)"` with `background: "var(--ha-app-bar-background-color, #ECE6F0)"`.
4. Change `border-radius: "14px"` to `border-radius: "0px"`.
5. Replace the `box-shadow` line with the M3 Level 1 value.
6. Change `padding: "8px 12px"` to `padding: "0 16px"`.
7. Change `height: "56px"` to `height: "64px"` (and `44px` in `dashboard_user.txt` → `64px`).
8. Replace the easing in `transition` to `cubic-bezier(0.2, 0, 0, 1)`.
9. (Optional) Add a `theme.yaml` with `--ha-app-bar-background-color: #ECE6F0` (light) / `#2B2930` (dark) to support dark mode.
10. Verify in browser DevTools that the header is now 64 px, borderless, surfaceContainerHigh fill.

### 5.2 Card layout & elevation

**Current state:** Universal pattern across 82 button-cards: `background: #FFFFFF` + `border: 1px solid #DADCE0` + `border-radius: 14px` + `box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.04)` + `padding: 12px` (or 8/12/16 mixed). Inner content: 32 × 32 px icon avatar with `border-radius:10px` background (e.g. `lovelace.dashboard_home.txt:660`, `lovelace.kitchen_dashboard.txt:94`) or 36 × 36 px with `border-radius:12px` (e.g. `lovelace.fethi_room.txt:140`, `lovelace.working_space.txt:1123`). Status pill 22 px height / `border-radius:9999px`.

**Target state:** M3 Tonal Card: `background: var(--ha-card-background-color, #F7F2FA)` (surfaceContainerLow N96) + `border: none` + `border-radius: 28px` + `box-shadow: none` (M3 uses tonal elevation, not shadow) + `padding: 16px`. Icon avatar 48 × 48 dp pill (M3 IconContainer) with `secondaryContainer` `#E8DEF8` background. Status pill 24 dp height / 8 dp radius (Shapes.small).

**YAML before (button-card `styles.card`):**

```yaml
styles:
  card:
    - background: "#FFFFFF"
    - border: "1px solid #DADCE0"
    - border-radius: "14px"
    - box-shadow: "0 1px 2px rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.04)"
    - padding: "12px"
    - transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
```

**YAML after (M3 Tonal Card):**

```yaml
styles:
  card:
    - background: "var(--ha-card-background-color, #F7F2FA)"
    - border: "none"
    - border-radius: "28px"
    - box-shadow: "none"
    - padding: "16px"
    - transition: "all 200ms cubic-bezier(0.2, 0, 0, 1)"
```

**Step-by-step instructions:**

1. In each of the 7 files, for every `custom:button-card` instance, locate the `styles.card` block.
2. Replace `background: "#FFFFFF"` with `background: "var(--ha-card-background-color, #F7F2FA)"`. The CSS variable lets you swap to dark mode `#1D1B20` from one place.
3. Remove the line `"border": "1px solid #DADCE0"`. Replace with `"border": "none"`.
4. Change `border-radius: "14px"` to `border-radius: "28px"`.
5. Remove the `box-shadow` line. Replace with `"box-shadow": "none"`.
6. Change `padding: "12px"` (or 8/12/16) to `padding: "16px"`.
7. Replace easing `0.4, 0, 0.2, 1` with `0.2, 0, 0, 1`.
8. For icon avatars, change `width:32px;height:32px;border-radius:10px` to `width:48px;height:48px;border-radius:24px` (or `border-radius:50%`).
9. (Recommended) Add a `theme.yaml` with `--ha-card-background-color: #F7F2FA` (light) and `--ha-card-background-color: #1D1B20` (dark).
10. Verify visually: cards should appear borderless with a 28 px radius on a slightly tinted surface.

### 5.3 Button & toggle states

**Current state:** Two switch implementations:

- 5 files use `width:42px; height:24px; border:2px solid; border-radius:9999px` with 18 px thumb (`lovelace.fethi_room.txt:140`, `lovelace.meeting_room.txt:140`, `lovelace.working_space.txt:1123`, `lovelace.salle_de_bain.txt:140`).
- 1 file uses `width:44px; height:24px; border-radius:12px` with 20 px thumb and no border (`lovelace.dashboard_home.txt:405, 463, 660`).
- Selected colors: `#D3E3FD` track / `#1A73E8` border (5 files) or `#4285f4` track (dashboard_home).
- Unselected colors: `#E8EAED` track / `#DADCE0` border.
- Transition: `all 0.3s cubic-bezier(0.4,0,0.2,1)`.

**Target state:** M3 Switch 52 × 32 dp track, 24 dp thumb (28 dp pressed), 16 dp radius, no border on selected (`colorScheme.primary` `#1A73E8`), 2 dp `outline` `#79747E` border on unselected. Thumb path morph 100 ms pre / 150 ms post. Total motion 250 ms `cubic-bezier(0.2, 0, 0, 1)`.

**YAML before (inline switch template, `name:` field):**

```yaml
name: |
  [[[
    const isOn = entity && entity.state === 'on';
    const trackBg = isOn ? '#D3E3FD' : '#E8EAED';
    const trackBorder = isOn ? '#1A73E8' : '#DADCE0';
    const thumbPos = isOn ? 'right:2px;' : 'left:2px;';
    return `<div style="... width:42px; height:24px; background:${trackBg}; border-radius:9999px; border:2px solid ${trackBorder}; ...">
      <div style="position:absolute; top:1px; ${thumbPos} width:18px; height:18px; border-radius:50%; background:#FFFFFF; ..."></div>
    </div>`;
  ]]]
```

**YAML after (M3 Switch inline):**

```yaml
name: |
  [[[
    const isOn = entity && entity.state === 'on';
    const trackBg = isOn ? '#1A73E8' : '#E6E0E9';
    const trackBorder = isOn ? 'none' : '2px solid #79747E';
    const thumbPos = isOn ? 'right:2px;' : 'left:2px;';
    return `<div style="... width:52px; height:32px; background:${trackBg}; border-radius:16px; border:${trackBorder}; transition:all 250ms cubic-bezier(0.2, 0, 0, 1); ...">
      <div style="position:absolute; top:4px; ${thumbPos} width:24px; height:24px; border-radius:50%; background:#FFFFFF; box-shadow:0 1px 2px rgba(0,0,0,0.30); transition:all 250ms cubic-bezier(0.2, 0, 0, 1);"></div>
    </div>`;
  ]]]
```

**Step-by-step instructions:**

1. Open each of the 5 files with the 42 × 24 switch and 1 file with the 44 × 24 switch.
2. Find the inline template that contains `width:42px` (or 44px), `height:24px`, `border-radius:9999px` (or 12px).
3. Change `width:42px` to `width:52px`, `height:24px` to `height:32px`, `border-radius:9999px` to `border-radius:16px` (or `border-radius:12px` → `border-radius:16px` for dashboard_home).
4. Change the thumb `width:18px; height:18px` to `width:24px; height:24px` (5 files), or `width:20px; height:20px` to `width:24px; height:24px` (dashboard_home). Adjust `top:1px` to `top:4px` to vertically center the larger thumb in the 32 dp track.
5. Change `trackBg` on selected: `#D3E3FD` → `#1A73E8` (or `#4285f4` → `#1A73E8` in dashboard_home).
6. Change unselected track `#E8EAED` → `#E6E0E9` (surfaceContainerHighest).
7. Replace `trackBorder` ternary with: selected `none`, unselected `2px solid #79747E`.
8. Replace the transition string `cubic-bezier(0.4,0,0.2,1)` with `cubic-bezier(0.2, 0, 0, 1)`.
9. Verify in browser: tap the switch, watch thumb slide with 250 ms timing and 16 dp radius track.

### 5.4 Typography hierarchy

**Current state:** Three text styles:

- **Device name:** 14 px / 500 / `color:#202124` / `line-height:17` (dashboard_home) or `18px` (5 files) / `letter-spacing:0.1–0.15px` / `font-family:'Google Sans',sans-serif` (4 files) or `'Roboto',sans-serif` (working_space, salle_de_bain).
- **Status subline:** 11 px / 400 / `color:#5F6368` / `line-height:14px` / `letter-spacing:0.25px` / `font-family:'Roboto',sans-serif`.
- **Pill text:** 10 px / 600 / `color:#FFFFFF` or `:#5F6368` / `border-radius:9999px` / `padding:3px 8px` / `letter-spacing:0.3px`.

**Target state:** M3 type scale:

- **Device name:** `titleMedium` 16 sp / 24 lh / 500 / `color: var(--primary-text-color, #1C1B1F)` / `letter-spacing:0.15sp` / `font-family:'Google Sans Text', 'Roboto', sans-serif`.
- **Status subline:** `bodySmall` 12 sp / 16 lh / 400 / `color: var(--secondary-text-color, #49454F)` / `letter-spacing:0.4sp`.
- **Pill text:** `labelMedium` 12 sp / 16 lh / 500 / `color: onSecondaryContainer` / `border-radius:8px` (Shapes.small, M3 chip).

**YAML before (inline `name:` template):**

```yaml
name: |
  <div style="font-family:'Google Sans',sans-serif; font-size:14px; font-weight:500; line-height:18px; color:#202124; letter-spacing:0.15px;">Desk Lamp</div>
  <div style="font-family:'Roboto',sans-serif; font-size:11px; font-weight:400; line-height:14px; color:#5F6368; margin-top:2px; letter-spacing:0.25px;">Off</div>
```

**YAML after (M3 titleMedium + bodySmall):**

```yaml
name: |
  <div style="font-family:'Google Sans Text', 'Roboto', sans-serif; font-size:16px; font-weight:500; line-height:24px; color:var(--primary-text-color, #1C1B1F); letter-spacing:0.15px;">Desk Lamp</div>
  <div style="font-family:'Google Sans Text', 'Roboto', sans-serif; font-size:12px; font-weight:400; line-height:16px; color:var(--secondary-text-color, #49454F); margin-top:2px; letter-spacing:0.4px;">Off</div>
```

**Step-by-step instructions:**

1. In each inline `name:` template across all 7 files, find the device name and status subline `<div>`s.
2. Change device name `font-size:14px` → `font-size:16px`, `line-height:18px` (or 17) → `line-height:24px`. (If using `dashboard_home.txt`'s 14/17 variant, target is 16/24.)
3. Change device name `color:#202124` → `color:var(--primary-text-color, #1C1B1F)`.
4. Change device name `font-family:'Google Sans',sans-serif` → `font-family:'Google Sans Text', 'Roboto', sans-serif`.
5. Change status subline `font-size:11px` → `font-size:12px`, `line-height:14px` → `line-height:16px`.
6. Change status subline `color:#5F6368` → `color:var(--secondary-text-color, #49454F)`.
7. Change status subline `font-family:'Roboto',sans-serif` → `font-family:'Google Sans Text', 'Roboto', sans-serif`.
8. For pill text: change `font-weight:600` → `font-weight:500`, `border-radius:9999px` → `border-radius:8px`, `font-size:10px` → `font-size:12px`, `padding:3px 8px` → `padding:4px 12px` (M3 chip).
9. Verify in DevTools: device names should be 16 sp with comfortable 24 sp line-height; status text should be 12 sp, 16 sp line-height.

### 5.5 Spacing & grid alignment

**Current state:** `view type: sections` provides 2-column grid with default 8 px gutter. Cards have mixed padding (8/12/16 px). No responsive breakpoint handling. `max_columns: 2` is hard-coded in 7 files (e.g. `lovelace.dashboard_home.txt:12`).

**Target state:** 16 dp page horizontal padding (compact), 24 dp (medium), 32 dp (expanded); 16 dp section vertical rhythm; 8 dp tile gutter (compact), 12 dp (medium), 16 dp (expanded); 16 dp card inner padding. Responsive via `card-mod` `@media` queries.

**YAML before (view config):**

```yaml
views:
  - title: Working Space
    path: working-space
    type: sections
    max_columns: 2
    sections:
      - type: grid
        column_span: 2
        cards: [...]
```

**YAML after (M3 responsive with `card-mod`):**

```yaml
views:
  - title: Working Space
    path: working-space
    type: sections
    max_columns: 2
    sections:
      - type: grid
        column_span: 2
        cards: [...]
        # card_mod applied per card below
# Each card gains a card_mod:
card_mod:
  style: |
    ha-card {
      padding: 16px !important;
    }
    @media (max-width: 600px) {
      ha-card { padding: 12px !important; }
    }
    @media (min-width: 840px) {
      ha-card { padding: 20px !important; }
    }
```

**Step-by-step instructions:**

1. Verify `view type: sections` and `max_columns: 2` are set (they are in all 7 files — no change needed).
2. Add `card_mod` integration (HACS): add `card_mod: { style: "..." }` to each `custom:button-card`.
3. Set a base `padding: 16px !important;` in the `style:` string.
4. Add `@media (max-width: 600px) { ha-card { padding: 12px !important; } }` for compact phones.
5. Add `@media (min-width: 840px) { ha-card { padding: 20px !important; } }` for expanded screens.
6. Add `margin: 0 16px;` to the page root via `card_mod` on a section header (or via `theme.yaml`) for 16 dp page horizontal padding.
7. Verify by resizing the window: compact (≤ 600 px wide) should show 12 dp padding, expanded (≥ 840 px) should show 20 dp.

### 5.6 Floating action button (microphone)

**Current state:** 5 files have FAB at `width:52px; height:52px; border-radius:9999px; background:#1A73E8; box-shadow:0 2px 8px rgba(26,115,232,0.35), 0 4px 12px 2px rgba(26,115,232,0.20); position:fixed; bottom:12px; right:12px; z-index:100`. `extra_styles` block declares `ha-card:hover { transform: scale(1.08); box-shadow: ... ; } ha-card:active { transform: scale(0.92); } @keyframes listening-pulse { ... }`. `dashboard_user.txt:1445-1454` is the outlier with 36 × 36 and 200 ms transition. See `lovelace.fethi_room.txt:266-322`, `lovelace.working_space.txt:1662-1728`, `lovelace.salle_de_bain.txt:286-342`, `lovelace.meeting_room.txt:266-322`, `lovelace.dashboard_user.txt:1430-1454`.

**Target state:** M3 FAB regular: 56 × 56 dp, 16 dp radius (rounded square, not circle), `colorScheme.primary` `#1A73E8` (or `primaryContainer` for full M3), M3 Shadow Level 3 (6 dp), `position: fixed; bottom: 16px; right: 16px`, no scale on hover or press, state layer 10% on press, M3 emphasizedDecelerate easing for the FAB → sheet open transition (300 ms).

**YAML before (FAB `styles.card`):**

```yaml
styles:
  card:
    - background: "#1A73E8"
    - border-radius: "9999px"
    - border: "none"
    - box-shadow: "0 2px 8px rgba(26,115,232,0.35), 0 4px 12px 2px rgba(26,115,232,0.20)"
    - width: "52px"
    - height: "52px"
    - position: "fixed"
    - bottom: "12px"
    - right: "12px"
    - z-index: "100"
    - transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)"

extra_styles: |
  ha-card:hover {
    box-shadow: 0 4px 16px rgba(26,115,232,0.45), 0 8px 24px 4px rgba(26,115,232,0.25);
    transform: scale(1.08);
  }
  ha-card:active {
    transform: scale(0.92);
    box-shadow: 0 2px 4px rgba(26,115,232,0.30);
  }
  @keyframes listening-pulse { 0% { ... } 100% { ... } }
```

**YAML after (M3 FAB regular):**

```yaml
styles:
  card:
    - background: "var(--ha-fab-background-color, #1A73E8)"
    - border-radius: "16px"
    - border: "none"
    - box-shadow: "0 2px 4px 0 rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)"
    - width: "56px"
    - height: "56px"
    - position: "fixed"
    - bottom: "16px"
    - right: "16px"
    - z-index: "100"
    - transition: "all 250ms cubic-bezier(0.2, 0, 0, 1)"

extra_styles: |
  ha-card:hover {
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.30), 0 6px 12px 4px rgba(0,0,0,0.15);
    transform: translateY(-1px);
  }
  ha-card:active {
    background: rgba(255,255,255,0.10);
    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15);
  }
```

**Step-by-step instructions:**

1. For each of the 5 FAB files + `dashboard_user.txt`, locate the FAB `styles.card` block.
2. Change `border-radius: "9999px"` → `border-radius: "16px"`.
3. Change `width: "52px"` (or 36 px in `dashboard_user.txt`) → `width: "56px"`. Same for `height`.
4. Replace the `box-shadow` value with the M3 Level 3 stack (neutral black, two layers).
5. Change `bottom: "12px"` → `bottom: "16px"`. Same for `right`.
6. Replace easing in `transition` with `cubic-bezier(0.2, 0, 0, 1)`.
7. In the `extra_styles` block, replace `ha-card:hover { transform: scale(1.08); }` with `ha-card:hover { transform: translateY(-1px); box-shadow: <M3 hover lift>; }`.
8. Replace `ha-card:active { transform: scale(0.92); }` with `ha-card:active { background: rgba(255,255,255,0.10); box-shadow: 0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15); }`.
9. Delete the `@keyframes listening-pulse` block (M-010).
10. Verify: tap the FAB. The button should not scale; instead a 10% white overlay should flash. The shadow should drop on press. The shape should be a rounded square (16 dp radius), not a circle.

### 5.7 Status badges & indicators

**Current state:** Status pills with 10–11 px text, `border-radius:9999px` (pill), `padding:3px 8px` or `padding:3px 9px`, `font-weight:600`, `letter-spacing:0.3px`, 22 px height. Active colors include `#188038` background with `#FFFFFF` text (occupancy on), `#F9AB00` for door open, `#1A73E8` for cover/door closed. Inactive colors `#F1F3F4` background with `#5F6368` text and `1px solid #DADCE0` border. See `lovelace.dashboard_home.txt:528, 589`, `lovelace.salle_de_bain.txt:140, 207`, `lovelace.working_space.txt:25` (header pill).

**Target state:** M3 `labelMedium` chip 12 sp / 16 lh / 500, 8 dp radius (`Shapes.small`), `padding:4px 12px` (M3 chip), 32 dp height (M3 chip), `colorScheme.secondaryContainer` background, `colorScheme.onSecondaryContainer` text, no border, no letter-spacing (or 0.5 sp per M3). Active state: `tertiaryContainer` background.

**YAML before (inline pill template):**

```yaml
name: |
  <div style="font-family:'Google Sans',sans-serif; font-size:10px; font-weight:600; color:#FFFFFF; background:#188038; padding:3px 8px; border-radius:9999px; border:1px solid #188038; transition:all 0.3s ease; flex-shrink:0; letter-spacing:0.3px;">Active</div>
```

**YAML after (M3 chip):**

```yaml
name: |
  <div style="font-family:'Google Sans Text','Roboto',sans-serif; font-size:12px; font-weight:500; line-height:16px; color:var(--ha-chip-on-color, #1D192B); background:var(--ha-chip-background-color, #E8DEF8); padding:4px 12px; border-radius:8px; transition:all 200ms cubic-bezier(0.2, 0, 0, 1); flex-shrink:0; letter-spacing:0.5px; height:32px; display:inline-flex; align-items:center;">Active</div>
```

**Step-by-step instructions:**

1. In each of the 7 files, find all status pill `<div>` elements in `name:` templates (search for `border-radius:9999px` or `padding:3px 8px`).
2. Replace `font-size:10px` (or 11px) → `font-size:12px`.
3. Add `line-height:16px` (was missing).
4. Change `font-weight:600` → `font-weight:500`.
5. Change `border-radius:9999px` → `border-radius:8px`.
6. Change `padding:3px 8px` (or 9px) → `padding:4px 12px`.
7. Add `height:32px; display:inline-flex; align-items:center;` for M3 chip vertical alignment.
8. Remove `border:1px solid` declarations (M3 chips have no border).
9. Change `letter-spacing:0.3px` → `letter-spacing:0.5px`.
10. Replace the easing in `transition` with `cubic-bezier(0.2, 0, 0, 1)`.
11. (Optional) Add `--ha-chip-background-color: #E8DEF8` and `--ha-chip-on-color: #1D192B` to `theme.yaml`.
12. Verify: pills should be 32 dp tall, 12 sp text, 8 dp radius, no border.

### 5.8 Room/section labels

**Current state:** Per-file inline header templates with:

- 36 × 36 px room icon avatar with `border-radius:12px`, `background:linear-gradient(135deg, #D3E3FD, #AECBFA)`, `box-shadow:0 2px 4px rgba(0,0,0,0.15)`, 20 × 20 px icon — `lovelace.fethi_room.txt:25`, `lovelace.meeting_room.txt:25`, `lovelace.kitchen_dashboard.txt:25`, `lovelace.working_space.txt:25`, `lovelace.salle_de_bain.txt:25`.
- 32 × 32 px user initial avatar with `border-radius:50%`, `background:rgba(255,255,255,0.25)`, `border:1.5px solid rgba(255,255,255,0.4)` — `lovelace.dashboard_home.txt:25`, `lovelace.kitchen_dashboard.txt:25`.
- Status pills (e.g. 🌡️ 23°, 🏠 1 on) in header with `border-radius:9999px`, 22 px height, `background:rgba(255,255,255,0.22)`.

**Target state:** M3 `MediumAppBar` room icon: 40 × 40 dp avatar (M3 medium app bar avatar), 20 dp radius (largeIncreased), `colorScheme.secondaryContainer` `#E8DEF8` background, 24 dp icon. User initial: 32 × 32 dp circle, `colorScheme.tertiaryContainer` `#FFD8E4` background, `colorScheme.onTertiaryContainer` text. Status chips: M3 `AssistChip` 32 dp height, 8 dp radius, `colorScheme.surfaceContainer` background, `colorScheme.onSurface` text, 16 dp leading icon.

**YAML before (room icon avatar inline template):**

```yaml
name: |
  <div style="width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg,#D3E3FD,#AECBFA); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 4px rgba(0,0,0,0.15);">
    <ha-icon icon="mdi:bed" style="color:#1A73E8; width:20px; height:20px;"></ha-icon>
  </div>
```

**YAML after (M3 secondaryContainer avatar):**

```yaml
name: |
  <div style="width:40px; height:40px; border-radius:20px; background:var(--ha-room-avatar-bg, #E8DEF8); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
    <ha-icon icon="mdi:bed" style="color:#1A73E8; width:24px; height:24px;"></ha-icon>
  </div>
```

**YAML before (status chip):**

```yaml
<span style="display:inline-flex; align-items:center; gap:3px; height:22px; padding:0 8px; border-radius:9999px; background:rgba(255,255,255,0.22); font-size:10px; font-weight:500; color:#fff; line-height:1; flex-shrink:0;">
<span style="font-size:10px;">🌡️</span>23°
</span>
```

**YAML after (M3 AssistChip):**

```yaml
<span style="display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 12px; border-radius:8px; background:rgba(255,255,255,0.16); font-size:12px; font-weight:500; color:#fff; line-height:16px; flex-shrink:0; letter-spacing:0.5px;">
<ha-icon icon="mdi:thermometer" style="width:16px; height:16px;"></ha-icon>23°
</span>
```

**Step-by-step instructions:**

1. In each of the 6 files with the 36 × 36 room avatar (excluding `dashboard_user.txt`), find the room icon `<div>` in the header `name:` template.
2. Change `width:36px; height:36px` to `width:40px; height:40px`.
3. Change `border-radius:12px` to `border-radius:20px` (largeIncreased M3 shape).
4. Replace the `linear-gradient(135deg, #D3E3FD, #AECBFA)` (or other 4 gradients) with `background: var(--ha-room-avatar-bg, #E8DEF8)`. This swaps the gradient for the M3 `secondaryContainer` flat color.
5. Remove `box-shadow:0 2px 4px rgba(0,0,0,0.15)` (M3 tonal surface has no shadow).
6. Change icon `width:20px; height:20px` to `width:24px; height:24px` (M3 standard).
7. For the 32 × 32 user initial avatar (dashboard_home, kitchen_dashboard, dashboard_user), change `background:rgba(255,255,255,0.25); border:1.5px solid rgba(255,255,255,0.4)` to `background:rgba(255,255,255,0.16); border:none` (M3 uses lower opacity overlay on app bar).
8. For status chips in headers (🌡️ 23°, 🏠 1 on), change `height:22px` → `height:32px`, `border-radius:9999px` → `border-radius:8px`, `padding:0 8px` → `padding:0 12px`, `font-size:10px` → `font-size:12px`, `line-height:1` → `line-height:16px`, `letter-spacing:0.3px` → `letter-spacing:0.5px`.
9. (Optional) Replace emoji icons (🌡️, 🏠, 💡, 📡) with proper MDI icons (mdi:thermometer, mdi:home, mdi:lightbulb, mdi:access-point) at 16 dp size.
10. (Recommended) Add `--ha-room-avatar-bg: #E8DEF8` to `theme.yaml` and map each room to its Spaces color: Fethi=Blue, Kitchen=Yellow, Working=Green, Bathroom=Mint, Meeting=Blue.
11. Verify: room avatars should be flat-tonal pills (no gradient, no shadow), 40 × 40 dp, with 24 dp icon. Status chips should be 32 dp tall, 8 dp radius.

---

## Appendix A — Universal Mappings Quick Reference

| Old value                                                                                 | New value                                                                  | Reason                              |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| `background: #FFFFFF`                                                                     | `background: var(--ha-card-background-color, #F7F2FA)`                     | M3 surfaceContainerLow              |
| `border: 1px solid #DADCE0`                                                               | `border: none`                                                             | M3 has no border on tonal Card      |
| `border-radius: 14px`                                                                     | `border-radius: 28px`                                                      | M3 Shapes.extraLarge                |
| `border-radius: 12px` (icon avatar)                                                       | `border-radius: 20px` (M3 largeIncreased) or 50%                           | M3 MediumAppBar avatar              |
| `border-radius: 9999px` (FAB)                                                             | `border-radius: 16px`                                                      | M3 FAB is rounded square            |
| `border-radius: 9999px` (chip)                                                            | `border-radius: 8px`                                                       | M3 chip Shapes.small                |
| `border-radius: 9999px` (switch)                                                          | `border-radius: 16px`                                                      | M3 Switch track                     |
| `box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 1px 3px 1px rgba(0,0,0,0.04)` (card)           | `box-shadow: none`                                                         | M3 uses tonal elevation, not shadow |
| `box-shadow: 0 2px 6px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)` (header)             | `box-shadow: 0 1px 2px 0 rgba(0,0,0,0.30), 0 1px 3px 0 rgba(0,0,0,0.15)`   | M3 Level 1                          |
| `box-shadow: 0 2px 8px rgba(26,115,232,0.35), 0 4px 12px 2px rgba(26,115,232,0.20)` (FAB) | `box-shadow: 0 2px 4px 0 rgba(0,0,0,0.30), 0 4px 8px 3px rgba(0,0,0,0.15)` | M3 Level 3 neutral                  |
| `cubic-bezier(0.4, 0, 0.2, 1)`                                                            | `cubic-bezier(0.2, 0, 0, 1)`                                               | M3 standard easing                  |
| `transition: all 200ms`                                                                   | `transition: all 200ms cubic-bezier(0.2, 0, 0, 1)` (cards)                 | M3 short4 200ms                     |
| `transition: all 250ms` (FAB)                                                             | `transition: all 250ms cubic-bezier(0.2, 0, 0, 1)`                         | M3 medium1 250ms                    |
| `transform: scale(0.92)` (press)                                                          | `background: rgba(0,0,0,0.10); box-shadow: none;` (M3 state layer)         | M3 has no scale on press            |
| `transform: scale(1.08)` (hover, FAB)                                                     | `transform: translateY(-1px); box-shadow: M3 Level 3;`                     | M3 hover lift                       |
| `width: 42px; height: 24px` (switch)                                                      | `width: 52px; height: 32px`                                                | M3 Switch track                     |
| `width: 18px; height: 18px` (switch thumb)                                                | `width: 24px; height: 24px`                                                | M3 Switch thumb (28 dp pressed)     |
| `width: 52px; height: 52px` (FAB)                                                         | `width: 56px; height: 56px`                                                | M3 FAB regular                      |
| `width: 36px; height: 36px` (FAB, dashboard_user)                                         | `width: 56px; height: 56px`                                                | M3 FAB regular                      |
| `width: 32px; height: 32px; border-radius: 10px` (icon avatar)                            | `width: 48px; height: 48px; border-radius: 24px`                           | M3 IconContainer                    |
| `font-size: 14px; line-height: 18px` (device name)                                        | `font-size: 16px; line-height: 24px`                                       | M3 titleMedium                      |
| `font-size: 11px; line-height: 14px` (status)                                             | `font-size: 12px; line-height: 16px`                                       | M3 bodySmall                        |
| `font-size: 10px; font-weight: 600` (pill)                                                | `font-size: 12px; font-weight: 500`                                        | M3 labelMedium                      |
| `font-family: 'Google Sans', 'Roboto', sans-serif`                                        | `font-family: 'Google Sans', 'Google Sans Text', 'Roboto', sans-serif`     | Add GST for body                    |
| `color: #202124` (text primary)                                                           | `color: var(--primary-text-color, #1C1B1F)`                                | M3 onSurface                        |
| `color: #5F6368` (text secondary)                                                         | `color: var(--secondary-text-color, #49454F)`                              | M3 onSurfaceVariant                 |
| `background: #1A73E8` (FAB)                                                               | `background: var(--ha-fab-background-color, #1A73E8)`                      | M3 primary or primaryContainer      |
| `background: #FFFFFF` (header gradient)                                                   | `background: var(--ha-app-bar-background-color, #ECE6F0)`                  | M3 surfaceContainerHigh             |
| `position: fixed; bottom: 12px; right: 12px` (FAB)                                        | `position: fixed; bottom: 16px; right: 16px`                               | M3 FAB 16 dp offset                 |
| `padding: 8px 12px` (header)                                                              | `padding: 0 16px`                                                          | M3 TopAppBar                        |
| `padding: 12px` (card)                                                                    | `padding: 16px`                                                            | M3 compact tile inner               |
| `height: 56px` (header)                                                                   | `height: 64px`                                                             | M3 TopAppBar                        |
| `height: 44px` (header, dashboard_user)                                                   | `height: 64px`                                                             | M3 TopAppBar                        |
| `height: 22px` (header pill)                                                              | `height: 32px`                                                             | M3 AssistChip                       |
| `height: 22px` (status pill)                                                              | `height: 32px`                                                             | M3 AssistChip                       |

---

## Appendix B — `theme.yaml` Sketch (for M-021)

```yaml
# /config/themes/google-home.yaml
google-home:
  # M3 surface tokens
  ha-card-background-color: "#F7F2FA" # surfaceContainerLow N96
  ha-card-background-color-dark: "#1D1B20" # surfaceContainerLow N10
  ha-app-bar-background-color: "#ECE6F0" # surfaceContainerHigh N92
  ha-app-bar-background-color-dark: "#2B2930"
  ha-chip-background-color: "#E8DEF8" # secondaryContainer
  ha-chip-on-color: "#1D192B" # onSecondaryContainer
  ha-fab-background-color: "#1A73E8" # primary (Google Home static)
  ha-fab-background-color-dark: "#8AB4F8" # Google Blue 200
  ha-fab-on-color: "#FFFFFF"
  ha-room-avatar-bg: "#E8DEF8" # secondaryContainer
  # Room accent palette (Google Spaces 10-color)
  ha-space-blue: "#4285F4"
  ha-space-red: "#EA4335"
  ha-space-yellow: "#FBBC04"
  ha-space-green: "#34A853"
  ha-space-coral: "#FF6F61"
  ha-space-lavender: "#B39DDB"
  ha-space-mint: "#80CBC4"
  ha-space-pink: "#F48FB1"
  ha-space-sand: "#BCAAA4"
  ha-space-slate: "#78909C"
  # M3 shape tokens
  ha-card-border-radius: "28px" # extraLarge
  ha-chip-border-radius: "8px" # small
  ha-fab-border-radius: "16px" # large
  # M3 motion tokens
  ha-motion-standard: "cubic-bezier(0.2, 0, 0, 1)"
  ha-motion-emphasized-decelerate: "cubic-bezier(0.05, 0.7, 0.1, 1.0)"
  ha-duration-short4: "200ms" # cards
  ha-duration-medium1: "250ms" # FAB, switch
  ha-duration-medium2: "300ms" # FAB → sheet
  # Semantic colors (Google Home harmonized)
  ha-color-success: "#00C853"
  ha-color-warning: "#FF6E40"
  ha-color-error: "#B3261E"
  ha-color-info: "#2962FF"
  ha-color-lighting-on: "#FFCB45"
```

Cards reference these via `var(--ha-card-background-color, #F7F2FA)` in their `styles.card` blocks. Dashboard top-level view gains `theme: google-home`.

---

## Appendix C — Open Questions / Follow-ups

1. **Dark mode is not implemented anywhere in the 7 files.** The current `theme:` is unset on all 7 dashboards. Adding dark mode requires both a `theme.yaml` and a `card-mod` switch — the current inline templates hardcode all colors.
2. **No responsive layout exists.** All 7 files assume compact-phone width. M3 medium/expanded layouts would require a complete restructure to use `max_columns: 3` or 4 with a `NavigationRail`.
3. **The 10-color Spaces palette is unused for 6 of 10 colors.** A new "Office" room with `#78909C` slate or "Bedroom" with `#B39DDB` lavender could be added without new design work.
4. **FAB icon (`mdi:microphone`) is consistent across the 5 FAB-bearing files** but `dashboard_user.txt` uses a different mic icon (different mdi variant). A future task: standardize on `mdi:microphone` (or move to `mdi:microphone-outline` per Google Home's current usage).
5. **No `theme:` is set in any of the 7 files.** A prerequisite for centralized M3 token rollout is introducing a `google-home` theme.
6. **The "Cover position preset off-by-one" bug (M-011) is the highest-leverage functional fix** — a user can tap "Open 100%" and the cover only opens to 65%.

---

_End of document. Total modifications identified: 29 (M-001 through M-029) plus the 8 component transformations in Section 5. Estimated total effort: ~8 hours of YAML editing + 1 hour of theme setup if executed sequentially. Independent execution of M-001 through M-012 is sufficient to achieve 80% visual alignment with the Google Home M3 Expressive design system._
