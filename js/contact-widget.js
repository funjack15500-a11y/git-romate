/* 悬浮联系球：收起时为圆球，点开为联系面板；导航「联系」悬停时在链接下方弹出同一面板 */
(function () {
  var STORE_KEY = "ld.contactWidget.open";

  function init() {
    var root = document.querySelector("[data-contact-widget]");
    if (!root) return;

    var ball = root.querySelector(".cw-ball");
    var panel = root.querySelector(".cw-panel");
    var minBtn = root.querySelector(".cw-min");
    var isOpen = false;
    var hideTimer = null;

    function setOpen(next, persist) {
      isOpen = !!next;
      root.classList.toggle("is-open", isOpen);
      if (ball) ball.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (panel) panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
      if (persist !== false) {
        try {
          localStorage.setItem(STORE_KEY, isOpen ? "1" : "0");
        } catch (error) {
          /* 隐私模式下忽略 */
        }
      }
    }

    var saved = null;
    try {
      saved = localStorage.getItem(STORE_KEY);
    } catch (error) {
      saved = null;
    }
    setOpen(saved === "1", false);

    /* —— 悬停小窗：贴着导航「联系」弹出 —— */
    function placeAt(el) {
      if (!panel) return;
      var rect = el.getBoundingClientRect();
      var width = panel.offsetWidth || 302;
      var left = rect.right - width;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      var top = Math.round(rect.bottom + 10);
      panel.style.left = Math.round(left) + "px";
      panel.style.top = top + "px";
      panel.style.right = "auto";
    }

    function showHover(el) {
      if (!panel) return;
      window.clearTimeout(hideTimer);
      panel.classList.add("is-anchored");
      root.classList.add("is-hover");
      placeAt(el);
      panel.setAttribute("aria-hidden", "false");
    }

    function hideHover() {
      if (!panel) return;
      root.classList.remove("is-hover");
      panel.classList.remove("is-anchored");
      panel.style.left = "";
      panel.style.top = "";
      panel.style.right = "";
      panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
    }

    function scheduleHide() {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hideHover, 260);
    }

    var links = Array.prototype.slice.call(
      document.querySelectorAll("[data-open-contact]")
    );
    links.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        showHover(el);
      });
      el.addEventListener("mouseleave", scheduleHide);
      el.addEventListener("focus", function () {
        showHover(el);
      });
      el.addEventListener("blur", scheduleHide);
      el.addEventListener("click", function (event) {
        event.preventDefault();
        showHover(el);
        var first = panel && panel.querySelector("a");
        if (first) first.focus();
      });
    });

    if (panel) {
      panel.addEventListener("mouseenter", function () {
        window.clearTimeout(hideTimer);
      });
      panel.addEventListener("mouseleave", scheduleHide);
    }

    if (ball) {
      ball.addEventListener("click", function () {
        hideHover();
        setOpen(!isOpen);
      });
    }

    if (minBtn) {
      minBtn.addEventListener("click", function () {
        hideHover();
        setOpen(false);
        if (ball) ball.focus();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        hideHover();
        if (isOpen) setOpen(false);
      }
    });

    document.addEventListener("click", function (event) {
      if (root.contains(event.target)) return;
      hideHover();
      if (isOpen) setOpen(false);
    });

    window.addEventListener("resize", hideHover);
    window.addEventListener("scroll", hideHover, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
