/* Gotham City Social — native Web Share + copy / channel fallback */
(function () {
  "use strict";

  var SITE = "https://gotham-city-social.netlify.app";
  var DEFAULT_TITLE = "Gotham City Social";
  var DEFAULT_TEXT =
    "Website & social media that get you found — for Brooklyn and New York.";

  var sheet = null;
  var toastEl = null;
  var lastFocus = null;
  var toastTimer = null;

  function ensureUi() {
    if (sheet) return;
    sheet = document.createElement("div");
    sheet.id = "gcs-share-sheet";
    sheet.className = "gcs-share-sheet";
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="gcs-share-backdrop" data-share-close tabindex="-1"></div>' +
      '<div class="gcs-share-panel" role="dialog" aria-modal="true" aria-labelledby="gcs-share-heading" tabindex="-1">' +
      '<div class="gcs-share-head">' +
      '<h2 id="gcs-share-heading">Share Gotham City Social</h2>' +
      '<button type="button" class="gcs-share-close" data-share-close aria-label="Close share options">&times;</button>' +
      "</div>" +
      '<p class="gcs-share-url" id="gcs-share-url-label"></p>' +
      '<div class="gcs-share-actions" role="list">' +
      '<button type="button" class="gcs-share-action" data-share-copy role="listitem">' +
      '<span class="gcs-share-ico" aria-hidden="true">🔗</span><span>Copy link</span></button>' +
      '<a class="gcs-share-action" data-share-channel="whatsapp" role="listitem" target="_blank" rel="noopener noreferrer">' +
      '<span class="gcs-share-ico" aria-hidden="true">💬</span><span>WhatsApp</span></a>' +
      '<a class="gcs-share-action" data-share-channel="sms" role="listitem">' +
      '<span class="gcs-share-ico" aria-hidden="true">📱</span><span>SMS / Texts</span></a>' +
      '<a class="gcs-share-action" data-share-channel="email" role="listitem">' +
      '<span class="gcs-share-ico" aria-hidden="true">✉️</span><span>Email</span></a>' +
      '<a class="gcs-share-action" data-share-channel="x" role="listitem" target="_blank" rel="noopener noreferrer">' +
      '<span class="gcs-share-ico" aria-hidden="true">𝕏</span><span>X / Twitter</span></a>' +
      '<a class="gcs-share-action" data-share-channel="facebook" role="listitem" target="_blank" rel="noopener noreferrer">' +
      '<span class="gcs-share-ico" aria-hidden="true">f</span><span>Facebook</span></a>' +
      '<a class="gcs-share-action" data-share-channel="linkedin" role="listitem" target="_blank" rel="noopener noreferrer">' +
      '<span class="gcs-share-ico" aria-hidden="true">in</span><span>LinkedIn</span></a>' +
      "</div>" +
      "</div>";
    document.body.appendChild(sheet);

    toastEl = document.createElement("div");
    toastEl.id = "gcs-share-toast";
    toastEl.className = "gcs-share-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.hidden = true;
    document.body.appendChild(toastEl);

    sheet.addEventListener("click", function (e) {
      var t = e.target.closest("[data-share-close]");
      if (t) {
        e.preventDefault();
        closeSheet();
      }
    });
    sheet.querySelector("[data-share-copy]").addEventListener("click", function () {
      var url = sheet.dataset.shareUrl || SITE + "/";
      copyLink(url).then(function () {
        showToast("Link copied");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet && !sheet.hidden) {
        e.preventDefault();
        closeSheet();
      }
    });
  }

  function showToast(msg) {
    ensureUi();
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-on");
      toastEl.hidden = true;
    }, 2200);
  }

  function copyLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url).catch(function () {
        return legacyCopy(url);
      });
    }
    return Promise.resolve(legacyCopy(url));
  }

  function legacyCopy(url) {
    var ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (_) {}
    document.body.removeChild(ta);
    return true;
  }

  function channelHref(channel, title, text, url) {
    var blob = text + " " + url;
    switch (channel) {
      case "whatsapp":
        return "https://wa.me/?text=" + encodeURIComponent(blob);
      case "sms":
        // iOS prefers sms:&body= ; Android sms:?body=
        return "sms:?&body=" + encodeURIComponent(blob);
      case "email":
        return (
          "mailto:?subject=" +
          encodeURIComponent(title) +
          "&body=" +
          encodeURIComponent(blob)
        );
      case "x":
        return (
          "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(text) +
          "&url=" +
          encodeURIComponent(url)
        );
      case "facebook":
        return (
          "https://www.facebook.com/sharer/sharer.php?u=" +
          encodeURIComponent(url)
        );
      case "linkedin":
        return (
          "https://www.linkedin.com/sharing/share-offsite/?url=" +
          encodeURIComponent(url)
        );
      default:
        return "#";
    }
  }

  function openSheet(data) {
    ensureUi();
    lastFocus = document.activeElement;
    sheet.dataset.shareUrl = data.url;
    sheet.querySelector("#gcs-share-url-label").textContent = data.url;
    sheet.querySelectorAll("[data-share-channel]").forEach(function (el) {
      var ch = el.getAttribute("data-share-channel");
      el.setAttribute("href", channelHref(ch, data.title, data.text, data.url));
    });
    sheet.hidden = false;
    document.documentElement.classList.add("gcs-share-open");
    var panel = sheet.querySelector(".gcs-share-panel");
    panel.focus();
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    document.documentElement.classList.remove("gcs-share-open");
    if (lastFocus && typeof lastFocus.focus === "function") {
      try {
        lastFocus.focus();
      } catch (_) {}
    }
  }

  function resolveUrl(raw, fallbackPath) {
    if (raw && String(raw).trim()) return String(raw).trim();
    try {
      if (
        location.hostname === "gotham-city-social.netlify.app" ||
        location.hostname.endsWith(".netlify.app")
      ) {
        var u = new URL(location.href);
        u.hash = "";
        // Prefer clean path without trailing noise
        return u.origin + u.pathname.replace(/\/index\.html$/, "/");
      }
    } catch (_) {}
    return SITE + (fallbackPath || "/");
  }

  function shareFrom(btn) {
    var title = btn.getAttribute("data-share-title") || DEFAULT_TITLE;
    var text = btn.getAttribute("data-share-text") || DEFAULT_TEXT;
    var fallbackPath = btn.getAttribute("data-share-fallback-path") || "/";
    var url = resolveUrl(btn.getAttribute("data-share-url"), fallbackPath);

    var payload = { title: title, text: text, url: url };

    if (typeof navigator.share === "function") {
      navigator
        .share(payload)
        .then(function () {})
        .catch(function (err) {
          if (err && err.name === "AbortError") return;
          openSheet(payload);
        });
      return;
    }
    openSheet(payload);
  }

  function onClick(e) {
    var btn = e.target.closest("[data-share]");
    if (!btn) return;
    e.preventDefault();
    shareFrom(btn);
  }

  document.addEventListener("click", onClick);
})();
