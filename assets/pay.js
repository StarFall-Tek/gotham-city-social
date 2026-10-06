/* Gotham City Social — show the thank-you banner after Stripe checkout redirects to ?paid=1 */
(function () {
  "use strict";
  var banner = document.getElementById("paid-banner");
  if (!banner) return;
  var params;
  try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
  if (params.get("paid") !== "1") return;
  banner.hidden = false;
  var close = banner.querySelector("[data-paid-close]");
  if (close) {
    close.addEventListener("click", function () {
      banner.hidden = true;
      try {
        params.delete("paid");
        var q = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (q ? "?" + q : "") + window.location.hash);
      } catch (e) {}
    });
  }
})();
