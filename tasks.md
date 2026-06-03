You are an expert Frontend Security Engineer specializing in TypeScript, LitElement, and Home Assistant Frontend Architecture.

Your sole task is to implement rigid, absolute Role-Based Access Control (RBAC) within the Home Assistant Sidebar component to completely isolate non-admin users.

### OBJECTIVE:

Modify the sidebar layout and rendering engine so that if `this.hass.user.is_admin` is false, the sidebar and its toggle capabilities are fundamentally stripped from the DOM, and the main dashboard scales to fill 100% of the viewport.

### CONSTRAINTS & RULES:

1. TARGET ONLY FRONTEND: Limit all edits exclusively to files handling sidebar layout and menu/toggle visibility (e.g., `src/layouts/home-assistant-main.ts`, `src/components/ha-sidebar.ts`, and relevant header toolbar/menu buttons).
2. HARD CONDITIONALS: Do NOT use CSS tricks (like hidden classes or display: none) which can be bypassed via DevTools. Use strict conditional ternary operations or early return states in the Lit `render()` methods: `${this.hass.user?.is_admin ? html`<ha-sidebar...>` : ""}`.
3. REMOVE TOGGLES: Completely omit or conditionally un-render the `<ha-menu-button>` or hamburger menu icon inside dashboard toolbars for non-admin accounts to block any swipe-to-open or click-to-expand sidebar behaviors.
4. VIEWPORT FIX: Adjust layout responsive mixins or CSS blocks so that when the sidebar is un-rendered for a non-admin, the dashboard content width (`main` area) automatically resets its margins and expands to full width (`100vw` / `100%`).
5. NO BREAKING CHANGES: Ensure `this.hass` state checks safely handle potential undefined states (`this.hass?.user?.is_admin`) during initial boot-up sequences to prevent boot loops or blank white screens.

Provide the exact file paths, code diffs (showing what to replace and what to insert), and any necessary CSS overrides required to achieve this layout isolation cleanly.
