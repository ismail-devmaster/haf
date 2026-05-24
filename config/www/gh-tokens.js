(function () {
  "use strict";

  function applyLightTokens(root) {
    root.style.setProperty("--gh-primary", "#1A73E8");
    root.style.setProperty("--gh-on-primary", "#FFFFFF");
    root.style.setProperty("--gh-primary-container", "#E8F0FE");
    root.style.setProperty("--gh-on-primary-container", "#041E49");
    root.style.setProperty("--gh-secondary", "#0F9D58");
    root.style.setProperty("--gh-on-secondary", "#FFFFFF");
    root.style.setProperty("--gh-secondary-container", "#E6F4EA");
    root.style.setProperty("--gh-surface", "#F8F9FA");
    root.style.setProperty("--gh-surface-variant", "#F1F3F4");
    root.style.setProperty("--gh-background", "#FFFBFE");
    root.style.setProperty("--gh-on-surface", "#202124");
    root.style.setProperty("--gh-on-surface-variant", "#5F6368");
    root.style.setProperty("--gh-error", "#D93025");
    root.style.setProperty("--gh-error-container", "#FCE8E6");
    root.style.setProperty("--gh-warning", "#F9AB00");
    root.style.setProperty("--gh-warning-container", "#FEF7E0");
    root.style.setProperty("--gh-outline", "rgba(0,0,0,0.12)");
    root.style.setProperty("--gh-scrim", "rgba(0,0,0,0.32)");
  }

  function applyDarkTokens(root) {
    root.style.setProperty("--gh-primary", "#1A73E8");
    root.style.setProperty("--gh-on-primary", "#FFFFFF");
    root.style.setProperty("--gh-primary-container", "#E8F0FE");
    root.style.setProperty("--gh-on-primary-container", "#041E49");
    root.style.setProperty("--gh-secondary", "#0F9D58");
    root.style.setProperty("--gh-on-secondary", "#FFFFFF");
    root.style.setProperty("--gh-secondary-container", "#E6F4EA");
    root.style.setProperty("--gh-surface", "#1C1B1F");
    root.style.setProperty("--gh-surface-variant", "#49454F");
    root.style.setProperty("--gh-background", "#131314");
    root.style.setProperty("--gh-on-surface", "#E6E1E5");
    root.style.setProperty("--gh-on-surface-variant", "#CAC4D0");
    root.style.setProperty("--gh-error", "#F2B8B8");
    root.style.setProperty("--gh-error-container", "#8C1D18");
    root.style.setProperty("--gh-warning", "#F9AB00");
    root.style.setProperty("--gh-warning-container", "#FEF7E0");
    root.style.setProperty("--gh-outline", "rgba(255,255,255,0.12)");
    root.style.setProperty("--gh-scrim", "rgba(0,0,0,0.32)");
  }

  function applySharedTokens(root) {
    root.style.setProperty("--gh-elevation-0", "none");
    root.style.setProperty("--gh-elevation-1", "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)");
    root.style.setProperty("--gh-elevation-2", "0 2px 6px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)");
    root.style.setProperty("--gh-elevation-3", "0 4px 12px rgba(0,0,0,0.09), 0 2px 4px rgba(0,0,0,0.06)");

    root.style.setProperty("--gh-shape-xs", "4px");
    root.style.setProperty("--gh-shape-sm", "8px");
    root.style.setProperty("--gh-shape-md", "12px");
    root.style.setProperty("--gh-shape-lg", "16px");
    root.style.setProperty("--gh-shape-xl", "28px");
    root.style.setProperty("--gh-shape-full", "9999px");

    root.style.setProperty("--gh-font-display", '"Google Sans Display", "Product Sans", sans-serif');
    root.style.setProperty("--gh-font-body", '"Google Sans", "Roboto", sans-serif');
    root.style.setProperty("--gh-font-mono", '"Google Sans Mono", "Roboto Mono", monospace');

    root.style.setProperty("--gh-typescale-display-large", "57px");
    root.style.setProperty("--gh-typescale-display-line-height-large", "64px");
    root.style.setProperty("--gh-typescale-display-weight-large", "400");

    root.style.setProperty("--gh-typescale-display-medium", "45px");
    root.style.setProperty("--gh-typescale-display-line-height-medium", "52px");
    root.style.setProperty("--gh-typescale-display-weight-medium", "400");

    root.style.setProperty("--gh-typescale-headline-large", "32px");
    root.style.setProperty("--gh-typescale-headline-line-height-large", "40px");
    root.style.setProperty("--gh-typescale-headline-weight-large", "400");

    root.style.setProperty("--gh-typescale-headline-medium", "28px");
    root.style.setProperty("--gh-typescale-headline-line-height-medium", "36px");
    root.style.setProperty("--gh-typescale-headline-weight-medium", "400");

    root.style.setProperty("--gh-typescale-title-large", "22px");
    root.style.setProperty("--gh-typescale-title-line-height-large", "28px");
    root.style.setProperty("--gh-typescale-title-weight-large", "400");

    root.style.setProperty("--gh-typescale-title-medium", "16px");
    root.style.setProperty("--gh-typescale-title-line-height-medium", "24px");
    root.style.setProperty("--gh-typescale-title-weight-medium", "500");
    root.style.setProperty("--gh-typescale-title-tracking-medium", "0.15px");

    root.style.setProperty("--gh-typescale-title-small", "14px");
    root.style.setProperty("--gh-typescale-title-line-height-small", "20px");
    root.style.setProperty("--gh-typescale-title-weight-small", "500");
    root.style.setProperty("--gh-typescale-title-tracking-small", "0.1px");

    root.style.setProperty("--gh-typescale-body-large", "16px");
    root.style.setProperty("--gh-typescale-body-line-height-large", "24px");
    root.style.setProperty("--gh-typescale-body-weight-large", "400");
    root.style.setProperty("--gh-typescale-body-tracking-large", "0.5px");

    root.style.setProperty("--gh-typescale-body-medium", "14px");
    root.style.setProperty("--gh-typescale-body-line-height-medium", "20px");
    root.style.setProperty("--gh-typescale-body-weight-medium", "400");
    root.style.setProperty("--gh-typescale-body-tracking-medium", "0.25px");

    root.style.setProperty("--gh-typescale-label-large", "14px");
    root.style.setProperty("--gh-typescale-label-line-height-large", "20px");
    root.style.setProperty("--gh-typescale-label-weight-large", "500");
    root.style.setProperty("--gh-typescale-label-tracking-large", "0.1px");

    root.style.setProperty("--gh-typescale-label-medium", "12px");
    root.style.setProperty("--gh-typescale-label-line-height-medium", "16px");
    root.style.setProperty("--gh-typescale-label-weight-medium", "500");
    root.style.setProperty("--gh-typescale-label-tracking-medium", "0.5px");

    root.style.setProperty("--gh-typescale-label-small", "11px");
    root.style.setProperty("--gh-typescale-label-line-height-small", "16px");
    root.style.setProperty("--gh-typescale-label-weight-small", "500");
    root.style.setProperty("--gh-typescale-label-tracking-small", "0.5px");

    root.style.setProperty("--gh-duration-short-1", "50ms");
    root.style.setProperty("--gh-duration-short-2", "100ms");
    root.style.setProperty("--gh-duration-short-3", "150ms");
    root.style.setProperty("--gh-duration-medium-1", "200ms");
    root.style.setProperty("--gh-duration-medium-2", "250ms");
    root.style.setProperty("--gh-duration-medium-3", "300ms");
    root.style.setProperty("--gh-duration-long-1", "400ms");
    root.style.setProperty("--gh-duration-long-2", "500ms");

    root.style.setProperty("--gh-easing-emphasized", "cubic-bezier(0.2, 0.0, 0.0, 1.0)");
    root.style.setProperty("--gh-easing-emphasized-decel", "cubic-bezier(0.05, 0.7, 0.1, 1.0)");
    root.style.setProperty("--gh-easing-emphasized-accel", "cubic-bezier(0.3, 0.0, 0.8, 0.15)");
    root.style.setProperty("--gh-easing-standard", "cubic-bezier(0.2, 0.0, 0.0, 1.0)");
    root.style.setProperty("--gh-easing-standard-decel", "cubic-bezier(0.0, 0.0, 0.0, 1.0)");
    root.style.setProperty("--gh-easing-standard-accel", "cubic-bezier(0.3, 0.0, 1.0, 1.0)");

    root.style.setProperty("--gh-space-xs", "4px");
    root.style.setProperty("--gh-space-sm", "8px");
    root.style.setProperty("--gh-space-md", "12px");
    root.style.setProperty("--gh-space-lg", "16px");
    root.style.setProperty("--gh-space-xl", "24px");
    root.style.setProperty("--gh-space-2xl", "32px");
    root.style.setProperty("--gh-space-3xl", "48px");
  }

  var root = document.documentElement;

  applySharedTokens(root);

  var theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  root.setAttribute("data-theme", theme);

  if (theme === "dark") {
    applyDarkTokens(root);
  } else {
    applyLightTokens(root);
  }

  window.matchMedia("(prefers-color-scheme: dark)").addListener(function (e) {
    var newTheme = e.matches ? "dark" : "light";
    root.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      applyDarkTokens(root);
    } else {
      applyLightTokens(root);
    }
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var style = document.createElement("style");
    style.textContent = "* { transition-duration: 0ms !important; animation-duration: 0ms !important; }";
    document.head.appendChild(style);
  }

  window.matchMedia("(prefers-reduced-motion: reduce)").addListener(function (e) {
    if (e.matches) {
      var style = document.createElement("style");
      style.textContent = "* { transition-duration: 0ms !important; animation-duration: 0ms !important; }";
      style.id = "gh-reduced-motion-style";
      if (!document.getElementById("gh-reduced-motion-style")) {
        style.id = "gh-reduced-motion-style";
        document.head.appendChild(style);
      }
    } else {
      var existing = document.getElementById("gh-reduced-motion-style");
      if (existing) {
        existing.remove();
      }
    }
  });

  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Google+Sans+Display:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=Google+Sans+Mono:wght@400;500;700&display=swap";
  document.head.appendChild(link);

  root.style.fontFamily = '"Google Sans", Roboto, sans-serif';
})();
