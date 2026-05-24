(function () {
  "use strict";

  // Set viewport meta tag for mobile responsiveness
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.head.appendChild(meta);
  }

  // Build the full CSS stylesheet
  var cssText = [
    "/* === GH RESPONSIVE SYSTEM === */",
    "",
    "/* Base */",
    "html {",
    "  scroll-behavior: smooth;",
    "}",
    "",
    "/* ===== MOBILE < 768px ===== */",
    "@media (max-width: 767px) {",
    "  .view {",
    "    padding-left: 16px !important;",
    "    padding-right: 16px !important;",
    "  }",
    "",
    "  ha-card {",
    "    --ha-card-border-radius: 16px;",
    "  }",
    "",
    '  /* !important: override HA shadow DOM sidebar display */',
    "  ha-sidebar {",
    "    display: none !important;",
    "  }",
    "",
    "  .device-grid {",
    "    display: grid !important;",
    "    grid-template-columns: 1fr 1fr !important;",
    "    gap: 8px !important;",
    "  }",
    "",
    "  .scene-chip, .chip-scroll-container button, [class*=\"scene\"] {",
    "    height: 36px !important;",
    "    font-size: 12px !important;",
    "  }",
    "",
    "  .greeting-text, h1, [class*=\"greeting\"] {",
    "    font-size: 16px !important;",
    "    line-height: 24px !important;",
    "  }",
    "",
    "  .view > * {",
    "    margin-bottom: 8px;",
    "  }",
    "",
    '  /* !important: ensure minimum tap target size on mobile */',
    "  .tap-target, button, [role=\"button\"], .mdc-button {",
    "    min-height: 48px !important;",
    "    min-width: 48px !important;",
    "  }",
    "}",
    "",
    "/* ===== TABLET 768-1279px ===== */",
    "@media (min-width: 768px) and (max-width: 1279px) {",
    "  .view {",
    "    padding-left: 24px !important;",
    "    padding-right: 24px !important;",
    "  }",
    "",
    '  /* !important: collapse sidebar to icon-only width */',
    "  ha-sidebar {",
    "    width: 48px !important;",
    "    min-width: 48px !important;",
    "  }",
    "",
    "  ha-sidebar .sidebar-label,",
    "  ha-sidebar .menu-item-text,",
    "  ha-sidebar .section-header-text {",
    "    display: none !important;",
    "  }",
    "",
    "  .device-grid {",
    "    display: grid !important;",
    "    grid-template-columns: 1fr 1fr !important;",
    "    gap: 10px !important;",
    "  }",
    "",
    "  .scene-chip, [class*=\"scene\"] {",
    "    height: 40px !important;",
    "  }",
    "",
    "  .view > * {",
    "    margin-bottom: 10px;",
    "  }",
    "}",
    "",
    "/* ===== DESKTOP >= 1280px ===== */",
    "@media (min-width: 1280px) {",
    "  .view {",
    "    padding-left: 32px !important;",
    "    padding-right: 32px !important;",
    "    max-width: 1400px !important;",
    "    margin-left: auto !important;",
    "    margin-right: auto !important;",
    "  }",
    "",
    '  /* !important: force sidebar expanded width */',
    "  ha-sidebar {",
    "    width: 256px !important;",
    "    min-width: 256px !important;",
    "  }",
    "",
    "  ha-sidebar .sidebar-label,",
    "  ha-sidebar .menu-item-text {",
    "    display: inline !important;",
    "  }",
    "",
    "  .device-grid {",
    "    display: grid !important;",
    "    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;",
    "    gap: 12px !important;",
    "  }",
    "",
    "  .view > * {",
    "    margin-bottom: 12px;",
    "  }",
    "}",
    "",
    "/* ===== WALL PANEL (landscape, wide aspect) ===== */",
    "@media (min-width: 768px) and (orientation: landscape) and (min-aspect-ratio: 16/10) {",
    "  .view {",
    "    padding-left: 32px !important;",
    "    padding-right: 32px !important;",
    "    max-width: 1400px !important;",
    "    margin-left: auto !important;",
    "    margin-right: auto !important;",
    "  }",
    "",
    "  .device-grid {",
    "    display: grid !important;",
    "    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;",
    "    gap: 12px !important;",
    "  }",
    "",
    '  /* !important: taller tiles for wall panel touch targets */',
    "  .device-tile, ha-card, [class*=\"device\"] {",
    "    min-height: 130px !important;",
    "  }",
    "",
    "  .greeting-text, h1, [class*=\"greeting\"] {",
    "    font-size: 32px !important;",
    "    line-height: 40px !important;",
    "    font-weight: 400 !important;",
    "  }",
    "",
    '  /* !important: bottom nav hidden — sidebar replaces it */',
    "  .bottom-nav, ha-bottom-nav, [class*=\"bottom-nav\"] {",
    "    display: none !important;",
    "  }",
    "}",
    "",
    "/* ===== SCROLL CONTAINERS ===== */",
    ".scroll-container, [class*=\"scroll\"] {",
    "  overflow-x: auto !important;",
    "  overflow-y: hidden !important;",
    "  -webkit-overflow-scrolling: touch !important;",
    "  scrollbar-width: none !important;",
    "  -ms-overflow-style: none !important;",
    "}",
    "",
    ".scroll-container::-webkit-scrollbar,",
    "[class*=\"scroll\"]::-webkit-scrollbar {",
    "  display: none !important;",
    "}",
    "",
    "/* ===== REDUCED MOTION ===== */",
    "@media (prefers-reduced-motion: reduce) {",
    "  *, *::before, *::after {",
    "    transition-duration: 0ms !important;",
    "    animation-duration: 0ms !important;",
    "  }",
    "}",
  ].join("\n");

  // Create and inject the style element
  var style = document.createElement("style");
  style.setAttribute("id", "gh-responsive-styles");
  style.textContent = cssText;
  document.head.appendChild(style);

  // Attempt to inject into known HA shadow roots for deeper penetration
  function injectIntoShadowRoots(root) {
    if (!root) return;
    var shadowRoots = root.querySelectorAll("*");
    for (var i = 0; i < shadowRoots.length; i++) {
      var el = shadowRoots[i];
      if (el.shadowRoot && el.shadowRoot !== root) {
        try {
          var shadowStyle = document.createElement("style");
          shadowStyle.textContent =
            '/* GH responsive injected into shadow root */' + cssText;
          el.shadowRoot.appendChild(shadowStyle);
        } catch (_) {
          // Some shadow roots are closed — skip silently
        }
        injectIntoShadowRoots(el.shadowRoot);
      }
    }
  }

  // Run shadow root injection after a short delay to let the app render
  setTimeout(function () {
    injectIntoShadowRoots(document.body);
  }, 1000);

  // Re-inject when DOM changes significantly (SPA navigation)
  var observer = new MutationObserver(function () {
    setTimeout(function () {
      injectIntoShadowRoots(document.body);
    }, 500);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
