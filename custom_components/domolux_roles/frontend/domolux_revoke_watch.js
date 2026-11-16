/*
 * Domolux Roles – live permission refresh for the signed-in user.
 *
 * Home Assistant only filters the entities of a `subscribe_entities` stream at
 * subscription time and on every following state change.  When the Father
 * revokes an entity from a Child, the entity stops changing for that Child, so
 * the Child's already-rendered dashboard would keep showing a card that is no
 * longer authorized until the tab is reloaded.
 *
 * This module is registered through `frontend.add_extra_js_url`, so it runs on
 * every Home Assistant page (stock dashboards included).  It subscribes to the
 * Domolux permission stream and refreshes the page when a change targets the
 * signed-in user.  A refresh is safe: it never keeps revoked data alive, and
 * the backend already denies the revoked resources before the refresh happens.
 *
 * Note: the generic Home Assistant `subscribe_events` command refuses custom
 * event types for non-admin users, so the dedicated
 * `domolux/permission/subscribe` command is used instead.
 *
 * The module is deliberately dependency free so it can ship without a build
 * step.
 */
(() => {
  "use strict";

  var SUBSCRIBE_TYPE = "domolux/permission/subscribe";
  var subscribedConnection = null;
  var reloading = false;
  var cleanupTimer = null;

  // Small, read-only test hook so the browser end-to-end suite can prove the
  // module actually loaded and subscribed.  The reload counter is kept in
  // sessionStorage because a reload restarts this module.
  var status = {
    loaded: true,
    subscribed: false,
    attempts: 0,
    disabled: false,
    reloads: Number(
      window.sessionStorage.getItem("__domoluxRevokeReloads") || 0
    ),
    cardsHidden: 0,
  };
  window.__domoluxRevokeWatch = status;

  // --------------------------------------------------------------------------
  // F-5: hide broken / unavailable entity cards for restricted (managed Child)
  // users.
  //
  // The generated Home Overview "Devices" tile targets zone.home.  zone.home is
  // deny-by-default for a managed Child, so it is absent from hass.states and
  // the tile renders a confusing "Entity not found" warning.  When zone.home is
  // not readable by the signed-in user, drop hui-warning cards and any tile
  // whose entity is missing from hass.states so no hidden entity is revealed.
  // --------------------------------------------------------------------------
  function shadowPiercingAll(selector) {
    var out = [];
    var stack = [document];
    var seen = new Set();
    while (stack.length) {
      var root = stack.pop();
      if (!root || seen.has(root)) {
        continue;
      }
      seen.add(root);
      try {
        var els = root.querySelectorAll(selector);
        for (var i = 0; i < els.length; i++) {
          out.push(els[i]);
        }
      } catch (err) {
        // ignore invalid selector for this root
      }
      var descendants = [];
      try {
        descendants = root.querySelectorAll("*");
      } catch (err) {
        descendants = [];
      }
      for (var j = 0; j < descendants.length; j++) {
        var el = descendants[j];
        if (el.shadowRoot) {
          stack.push(el.shadowRoot);
        }
      }
    }
    return out;
  }

  function removeElement(el) {
    if (!el) {
      return;
    }
    try {
      if (typeof el.remove === "function") {
        el.remove();
        return;
      }
    } catch (e) {}
    try {
      var parent = el.parentNode;
      if (parent && typeof parent.removeChild === "function") {
        parent.removeChild(el);
        return;
      }
    } catch (e) {}
    try {
      var root = el.getRootNode ? el.getRootNode() : null;
      var host = root && root.host ? root.host : null;
      if (host && host.shadowRoot && typeof host.shadowRoot.removeChild === "function") {
        host.shadowRoot.removeChild(el);
      }
    } catch (e) {}
  }

  function isRestrictedUser(hass) {
    // zone.home always exists as a state for users who may read it.  A managed
    // Child has it denied, so it is missing from hass.states.  Use that as the
    // restricted-user signal without needing a second authorization check.
    return !hass || !hass.states || hass.states["zone.home"] === undefined;
  }

  function hideBrokenCards(hass) {
    if (!isRestrictedUser(hass)) {
      return 0;
    }
    var removed = 0;
    var warnings = shadowPiercingAll("hui-warning");
    for (var i = 0; i < warnings.length; i++) {
      var w = warnings[i];
      var root = w.getRootNode ? w.getRootNode() : null;
      var host = root && root.host ? root.host : null;
      if (host) {
        removeElement(host);
        removed += 1;
      }
      removeElement(w);
      removed += 1;
    }
    var cards = shadowPiercingAll("hui-tile-card, hui-card");
    for (var j = 0; j < cards.length; j++) {
      var card = cards[j];
      var config = card.config || card._config;
      var entity = config && config.entity;
      if (entity && hass.states && hass.states[entity] === undefined) {
        removeElement(card);
        removed += 1;
      }
    }
    return removed;
  }

  function scheduleCleanup(hass) {
    if (cleanupTimer) {
      return;
    }
    function run() {
      var h = currentHass();
      if (!h) {
        return;
      }
      var n = hideBrokenCards(h);
      if (n) {
        status.cardsHidden += n;
      }
    }
    cleanupTimer = window.setInterval(run, 300);
    try {
      var observer = new MutationObserver(function () {
        run();
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
      });
    } catch (e) {}
  }

  function currentHass() {
    var app = document.querySelector("home-assistant");
    if (!app || !app.hass || !app.hass.connection) {
      return null;
    }
    return app.hass;
  }

  function payloadOf(message) {
    if (!message) return null;
    if (message.user_id) return message;
    return message.data || null;
  }

  function onPermissionsUpdated(message) {
    var data = payloadOf(message);
    if (!data || !data.user_id) {
      return;
    }

    var hass = currentHass();
    var userId = hass && hass.user && hass.user.id;
    if (!userId || data.user_id !== userId) {
      // The change targets somebody else (for example the Father editing a
      // Child while both are signed in).  Nothing to do here.
      return;
    }

    if (reloading) {
      return;
    }
    reloading = true;
    try {
      var prev = Number(
        window.sessionStorage.getItem("__domoluxRevokeReloads") || 0
      );
      window.sessionStorage.setItem(
        "__domoluxRevokeReloads",
        String(prev + 1)
      );
    } catch (err) {
      // Storage may be unavailable; the reload still happens.
    }
    window.location.reload();
  }

  function connect() {
    if (status.disabled) {
      return;
    }
    var hass = currentHass();
    if (!hass || !hass.connection || hass.connection === subscribedConnection) {
      return;
    }

    subscribedConnection = hass.connection;
    status.attempts += 1;
    scheduleCleanup(hass);
    hideBrokenCards(hass);
    try {
      var pending = hass.connection.subscribeMessage(onPermissionsUpdated, {
        type: SUBSCRIBE_TYPE,
      });
      if (pending && typeof pending.then === "function") {
        pending.then(
          function () {
            status.subscribed = true;
          },
          function () {
            // The socket is not authenticated yet, or the account may not
            // subscribe.  Retry a few times, then stop instead of looping.
            subscribedConnection = null;
            if (status.attempts >= 5) {
              status.disabled = true;
            }
          }
        );
      }
    } catch (err) {
      subscribedConnection = null;
      if (status.attempts >= 5) {
        status.disabled = true;
      }
    }
  }

  function start() {
    scheduleCleanup(currentHass());
    connect();
    window.setInterval(connect, 1000);
    window.addEventListener("focus", connect);
    document.addEventListener("visibilitychange", connect);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
