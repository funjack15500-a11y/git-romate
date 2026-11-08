/* 悬浮联系球：收起时为圆球，点开为联系面板 */
(function () {
  var STORE_KEY = "ld.contactWidget.open";

  function init() {
    var root = document.querySelector("[data-contact-widget]");
    if (!root) return;

    var ball = root.querySelector(".cw-ball");
    var panel = root.querySelector(".cw-panel");
    var minBtn = root.querySelector(".cw-min");
    var isOpen = false;

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

    if (ball) {
      ball.addEventListener("click", function () {
        setOpen(!isOpen);
      });
    }

    if (minBtn) {
      minBtn.addEventListener("click", function () {
        setOpen(false);
        if (ball) ball.focus();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen) setOpen(false);
    });

    document.addEventListener("click", function (event) {
      if (!isOpen) return;
      if (root.contains(event.target)) return;
      setOpen(false);
    });

    /* 导航「联系」点击时直接展开面板 */
    document.querySelectorAll("[data-open-contact]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        setOpen(true, false);
        var first = panel && panel.querySelector("a");
        if (first) first.focus();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
