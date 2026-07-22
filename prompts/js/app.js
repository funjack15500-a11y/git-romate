(function () {
  "use strict";

  const FAV_KEY = "spark-prompts-favorites";
  const THEME_KEY = "spark-prompts-theme";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    query: "",
    category: "全部",
    filter: "all", // all | recent-week | generate | edit | favorites
    favorites: loadFavorites(),
  };

  function loadFavorites() {
    try {
      return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...state.favorites]));
    } catch {
      /* file:// 或隐私模式可能不可写，忽略 */
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    const btn = $("#themeToggle");
    if (!btn) return;
    btn.innerHTML =
      theme === "dark"
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.setAttribute("aria-label", theme === "dark" ? "切换浅色模式" : "切换深色模式");
  }

  function isWithinDays(dateStr, days) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    return now - d <= days * 24 * 60 * 60 * 1000;
  }

  function getFiltered() {
    const q = state.query.trim().toLowerCase();
    return (window.PROMPT_DATA || []).filter((item) => {
      if (state.category !== "全部" && item.category !== state.category) return false;
      if (state.filter === "generate" && item.type !== "generate") return false;
      if (state.filter === "edit" && item.type !== "edit") return false;
      if (state.filter === "recent-week" && !isWithinDays(item.date, 7)) return false;
      if (state.filter === "favorites" && !state.favorites.has(item.id)) return false;
      if (!q) return true;
      const hay = [item.title, item.summary, item.prompt, item.category, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function heartSvg(filled) {
    if (filled) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }

  function renderGrid() {
    const grid = $("#promptsGrid");
    const list = getFiltered();
    $("#resultCount").textContent = String(list.length);

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          <strong>没有找到匹配的提示词</strong>
          试试调整搜索词或筛选条件
        </div>`;
      return;
    }

    grid.innerHTML = list
      .map((item) => {
        const fav = state.favorites.has(item.id);
        return `
        <article class="card" data-id="${item.id}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(item.title)}">
          <div class="card-cover" style="background:${item.cover}">
            <span class="card-emoji">${item.emoji || "✨"}</span>
            <button type="button" class="card-fav ${fav ? "active" : ""}" data-fav="${item.id}" aria-label="${fav ? "取消收藏" : "收藏"}">
              ${heartSvg(fav)}
            </button>
          </div>
          <div class="card-body">
            <h3 class="card-title">${escapeHtml(item.title)}</h3>
            <p class="card-summary">${escapeHtml(item.summary)}</p>
            <div class="card-meta">
              <span class="tag accent">${escapeHtml(item.category)}</span>
              ${(item.tags || [])
                .slice(0, 2)
                .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
                .join("")}
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findById(id) {
    return (window.PROMPT_DATA || []).find((p) => p.id === id);
  }

  function openModal(id) {
    const item = findById(id);
    if (!item) return;
    const backdrop = $("#modalBackdrop");
    $("#modalCover").style.background = item.cover;
    $("#modalTitle").textContent = item.title;
    $("#modalSummary").textContent = item.summary;
    $("#modalPrompt").textContent = item.prompt;
    $("#modalTags").innerHTML = [
      `<span class="tag accent">${escapeHtml(item.category)}</span>`,
      ...(item.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`),
      item.type === "edit"
        ? `<span class="tag">编辑类</span>`
        : `<span class="tag">生成类</span>`,
    ].join("");

    const favBtn = $("#modalFavBtn");
    const fav = state.favorites.has(item.id);
    favBtn.dataset.id = item.id;
    favBtn.innerHTML = `${heartSvg(fav)} ${fav ? "已收藏" : "收藏"}`;
    favBtn.classList.toggle("active", fav);

    $("#copyBtn").dataset.prompt = item.prompt;
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    $("#modalClose").focus();
  }

  function closeModal() {
    $("#modalBackdrop").classList.remove("open");
    document.body.style.overflow = "";
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) state.favorites.delete(id);
    else state.favorites.add(id);
    saveFavorites();
    renderGrid();
    updateFavStat();
    const modalOpen = $("#modalBackdrop").classList.contains("open");
    if (modalOpen && $("#modalFavBtn").dataset.id === id) {
      const fav = state.favorites.has(id);
      $("#modalFavBtn").innerHTML = `${heartSvg(fav)} ${fav ? "已收藏" : "收藏"}`;
    }
  }

  function updateFavStat() {
    const el = $("#favCount");
    if (el) el.textContent = String(state.favorites.size);
  }

  function updateTotalStat() {
    const el = $("#totalCount");
    if (el) el.textContent = String((window.PROMPT_DATA || []).length);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("已复制到剪贴板");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        showToast("已复制到剪贴板");
      } catch {
        showToast("复制失败，请手动选择");
      }
      document.body.removeChild(ta);
    }
  }

  let toastTimer;
  function showToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
  }

  function initCategories() {
    const options = $("#categoryOptions");
    const cats = window.CATEGORIES || ["全部"];
    options.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="category-option ${c === state.category ? "active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join("");
  }

  function initAnnouncements() {
    const list = window.ANNOUNCEMENTS || [];
    if (!list.length) {
      $("#announcement").style.display = "none";
      return;
    }
    const slides = $("#announcementSlides");
    const dots = $("#announcementDots");
    slides.innerHTML = list
      .map(
        (a, i) => `
      <div class="announcement-slide ${i === 0 ? "active" : ""}" data-i="${i}">
        <strong>${escapeHtml(a.title)}</strong>
        <p>${escapeHtml(a.body)}</p>
      </div>`
      )
      .join("");
    dots.innerHTML = list
      .map(
        (_, i) =>
          `<button type="button" class="${i === 0 ? "active" : ""}" data-i="${i}" aria-label="公告 ${i + 1}"></button>`
      )
      .join("");

    let idx = 0;
    const go = (n) => {
      idx = n;
      $$(".announcement-slide", slides).forEach((el, i) =>
        el.classList.toggle("active", i === idx)
      );
      $$("button", dots).forEach((el, i) => el.classList.toggle("active", i === idx));
    };

    dots.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-i]");
      if (!btn) return;
      go(Number(btn.dataset.i));
    });

    setInterval(() => go((idx + 1) % list.length), 5000);
  }

  function bindEvents() {
    $("#searchInput").addEventListener("input", (e) => {
      state.query = e.target.value;
      renderGrid();
    });

    $("#categoryTrigger").addEventListener("click", (e) => {
      e.stopPropagation();
      $("#categoryOptions").classList.toggle("open");
    });

    $("#categoryOptions").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      state.category = btn.dataset.cat;
      $("#categoryText").textContent = state.category;
      $$(".category-option").forEach((el) =>
        el.classList.toggle("active", el.dataset.cat === state.category)
      );
      $("#categoryOptions").classList.remove("open");
      renderGrid();
    });

    document.addEventListener("click", () => {
      $("#categoryOptions").classList.remove("open");
    });

    $$(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.filter = btn.dataset.filter;
        renderGrid();
      });
    });

    $("#promptsGrid").addEventListener("click", (e) => {
      const fav = e.target.closest("[data-fav]");
      if (fav) {
        e.stopPropagation();
        toggleFavorite(fav.dataset.fav);
        return;
      }
      const card = e.target.closest(".card[data-id]");
      if (card) openModal(card.dataset.id);
    });

    $("#promptsGrid").addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".card[data-id]");
      if (!card) return;
      e.preventDefault();
      openModal(card.dataset.id);
    });

    $("#modalClose").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", (e) => {
      if (e.target === $("#modalBackdrop")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    $("#copyBtn").addEventListener("click", () => {
      copyText($("#modalPrompt").textContent);
    });

    $("#modalFavBtn").addEventListener("click", () => {
      const id = $("#modalFavBtn").dataset.id;
      if (id) toggleFavorite(id);
    });

    $("#themeToggle").addEventListener("click", toggleTheme);
  }

  function applySiteConfig() {
    const cfg = window.SITE_CONFIG || {};
    if (cfg.name) {
      document.title = `${cfg.name} — ${cfg.tagline || "AI 提示词画廊"}`;
      const logo = document.querySelector(".logo");
      if (logo) {
        logo.innerHTML = `<span class="logo-mark">✦</span> ${escapeHtml(cfg.name)}`;
      }
    }
    if (cfg.githubUrl) {
      const gh = $("#githubLink");
      if (gh) gh.href = cfg.githubUrl;
    }
    const yearEl = $("#footerYear");
    if (yearEl && cfg.year) yearEl.textContent = String(cfg.year);
    const nameEl = $("#footerName");
    if (nameEl && cfg.name) nameEl.textContent = cfg.name;
    if (cfg.debug) {
      console.info("[Spark Prompts]", cfg.name, "prompts:", (window.PROMPT_DATA || []).length);
    }
  }

  function boot() {
    applySiteConfig();
    initTheme();
    initCategories();
    initAnnouncements();
    bindEvents();
    updateTotalStat();
    updateFavStat();
    renderGrid();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
