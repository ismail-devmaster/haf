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
  };
  window.__domoluxRevokeWatch = status;

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
    status.reloads += 1;
    try {
      window.sessionStorage.setItem(
        "__domoluxRevokeReloads",
        String(status.reloads)
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
