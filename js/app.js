(function () {
  "use strict";

  const FAV_KEY = "spark-prompts-favorites";
  const THEME_KEY = "spark-prompts-theme";
  const SORT_KEY = "spark-prompts-sort";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const PAGE_SIZE = 36;

  const state = {
    query: "",
    category: "全部",
    filter: "all", // all | recent-week | generate | edit | favorites
    sort: loadSort(),
    favorites: loadFavorites(),
    activeId: null,
    visible: PAGE_SIZE,
    randomSeed: Date.now(),
    tag: "",
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

  function loadSort() {
    try {
      return localStorage.getItem(SORT_KEY) || "newest";
    } catch {
      return "newest";
    }
  }

  function saveSort() {
    try {
      localStorage.setItem(SORT_KEY, state.sort);
    } catch {
      /* ignore */
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
    let list = (window.PROMPT_DATA || []).filter((item) => {
      if (state.category !== "全部" && item.category !== state.category) return false;
      if (state.filter === "generate" && item.type !== "generate") return false;
      if (state.filter === "edit" && item.type !== "edit") return false;
      if (state.filter === "recent-week" && !isWithinDays(item.date, 7)) return false;
      if (state.filter === "favorites" && !state.favorites.has(item.id)) return false;
      if (state.tag && !(item.tags || []).includes(state.tag)) return false;
      if (!q) return true;
      const hay = [item.title, item.summary, item.prompt, item.category, ...(item.tags || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    list = list.slice();
    const byDate = (a, b) => new Date(b.date) - new Date(a.date);
    switch (state.sort) {
      case "oldest":
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
        break;
      case "category":
        list.sort((a, b) => {
          const c = a.category.localeCompare(b.category, "zh-CN");
          return c || a.title.localeCompare(b.title, "zh-CN");
        });
        break;
      case "random": {
        const seed = state.randomSeed || 1;
        const score = (id) => {
          let h = seed;
          const s = String(id);
          for (let i = 0; i < s.length; i++) {
            h = (Math.imul(h ^ s.charCodeAt(i), 2654435761) >>> 0) + 0x9e3779b9;
          }
          return h >>> 0;
        };
        list.sort((a, b) => score(a.id) - score(b.id));
        break;
      }
      default:
        list.sort(byDate);
    }
    return list;
  }

  function resetVisible() {
    state.visible = PAGE_SIZE;
  }

  function categoryCounts() {
    const data = window.PROMPT_DATA || [];
    const map = { 全部: data.length };
    for (const p of data) {
      const c = p.category || "其他";
      map[c] = (map[c] || 0) + 1;
    }
    return map;
  }

  function heartSvg(filled) {
    if (filled) {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    }
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }

  function copyIconSvg() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  }

  function filterLabel(f) {
    return (
      {
        all: "全部类型",
        "recent-week": "近一周",
        generate: "生成",
        edit: "编辑",
        favorites: "收藏",
      }[f] || f
    );
  }

  function hasActiveFilters() {
    return (
      state.query.trim() !== "" ||
      state.category !== "全部" ||
      state.filter !== "all" ||
      !!state.tag
    );
  }

  function updateChips() {
    const chips = $("#activeChips");
    if (!chips) return;
    const parts = [];
    if (state.query.trim()) {
      parts.push(
        `<button type="button" class="chip" data-chip="query">搜索：${escapeHtml(state.query.trim())} <span aria-hidden="true">×</span></button>`
      );
    }
    if (state.category !== "全部") {
      parts.push(
        `<button type="button" class="chip" data-chip="category">分类：${escapeHtml(state.category)} <span aria-hidden="true">×</span></button>`
      );
    }
    if (state.filter !== "all") {
      parts.push(
        `<button type="button" class="chip" data-chip="filter">类型：${escapeHtml(filterLabel(state.filter))} <span aria-hidden="true">×</span></button>`
      );
    }
    if (state.tag) {
      parts.push(
        `<button type="button" class="chip" data-chip="tag">标签：${escapeHtml(state.tag)} <span aria-hidden="true">×</span></button>`
      );
    }
    chips.innerHTML = parts.join("");
    chips.hidden = parts.length === 0;
    const reset = $("#resetFilters");
    if (reset) reset.classList.toggle("visible", hasActiveFilters());
    const clearTag = $("#tagCloudClear");
    if (clearTag) clearTag.hidden = !state.tag;
    $$(".tag-cloud-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.tag === state.tag);
    });
  }

  function updateResultLine(count) {
    const n = $("#resultCount");
    if (n) n.textContent = String(count);
    const inline = $("#resultCountInline");
    if (inline) inline.textContent = String(count);
    const line = $("#resultLine");
    if (line) {
      const q = state.query.trim();
      line.innerHTML = q
        ? `找到 <strong>${count}</strong> 条与「${escapeHtml(q)}」相关`
        : `共 <strong id="resultCountInline">${count}</strong> 条`;
    }
  }

  function cardHtml(item) {
    const fav = state.favorites.has(item.id);
    const anime = item.category === "二次元";
    return `
        <article class="card ${anime ? "card-anime" : ""}" data-id="${item.id}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(item.title)}">
          <div class="card-cover" style="background:${item.cover}">
            ${
              item.preview
                ? `<img class="card-preview-img" src="${escapeHtml(item.preview)}" alt="" loading="lazy" decoding="async" />`
                : ""
            }
            <span class="card-shine" aria-hidden="true"></span>
            <span class="card-corner" aria-hidden="true"></span>
            <span class="card-emoji">${item.preview ? "" : item.emoji || "✨"}</span>
            ${anime ? `<span class="card-badge-anime">萌</span>` : ""}
            ${item.preview ? `<span class="card-badge-img">图</span>` : ""}
            <div class="card-actions">
              <button type="button" class="card-icon-btn card-copy" data-copy="${item.id}" aria-label="快速复制" title="快速复制">${copyIconSvg()}</button>
              <button type="button" class="card-icon-btn card-fav ${fav ? "active" : ""}" data-fav="${item.id}" aria-label="${fav ? "取消收藏" : "收藏"}" title="${fav ? "取消收藏" : "收藏"}">
                ${heartSvg(fav)}
              </button>
            </div>
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
              <span class="card-date">${escapeHtml(item.date || "")}</span>
            </div>
          </div>
        </article>`;
  }

  function renderGrid() {
    const grid = $("#promptsGrid");
    const list = getFiltered();
    updateResultLine(list.length);
    updateChips();

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty">
          <strong>没有找到匹配的提示词</strong>
          <p>试试调整搜索词或筛选条件</p>
          <button type="button" class="btn btn-secondary" id="emptyReset">清除筛选</button>
        </div>`;
      const more = $("#loadMoreWrap");
      if (more) more.hidden = true;
      return;
    }

    if (state.visible > list.length) state.visible = list.length;
    const shown = list.slice(0, state.visible);
    grid.innerHTML = shown.map(cardHtml).join("");

    const more = $("#loadMoreWrap");
    const moreBtn = $("#loadMoreBtn");
    const moreHint = $("#loadMoreHint");
    if (more) {
      const remain = list.length - shown.length;
      more.hidden = remain <= 0;
      if (moreHint) {
        moreHint.textContent =
          remain > 0
            ? `已显示 ${shown.length} / ${list.length}，还有 ${remain} 条`
            : `已全部显示 ${list.length} 条`;
      }
      if (moreBtn) {
        moreBtn.hidden = remain <= 0;
        moreBtn.textContent =
          remain > PAGE_SIZE ? `加载更多（+${PAGE_SIZE}）` : remain > 0 ? `加载剩余 ${remain} 条` : "已全部加载";
      }
    }
  }

  function loadMore() {
    const total = getFiltered().length;
    if (state.visible >= total) return;
    state.visible = Math.min(state.visible + PAGE_SIZE, total);
    renderGrid();
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

  function promptDeepLink(id) {
    const base = location.href.split("#")[0];
    return `${base}#p=${encodeURIComponent(id)}`;
  }

  function setHashForPrompt(id) {
    const next = `#p=${encodeURIComponent(id)}`;
    if (location.hash !== next) {
      history.replaceState(null, "", next);
    }
  }

  function openModal(id) {
    const item = findById(id);
    if (!item) return;
    state.activeId = id;
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

    const lenEl = $("#promptLen");
    if (lenEl) {
      const chars = item.prompt.length;
      lenEl.textContent = `${chars.toLocaleString()} 字符`;
    }
    const dateEl = $("#modalDate");
    if (dateEl) dateEl.textContent = item.date ? `更新于 ${item.date}` : "";

    const favBtn = $("#modalFavBtn");
    const fav = state.favorites.has(item.id);
    favBtn.dataset.id = item.id;
    favBtn.innerHTML = `${heartSvg(fav)} ${fav ? "已收藏" : "收藏"}`;
    favBtn.classList.toggle("active", fav);

    $("#copyBtn").dataset.prompt = item.prompt;
    updateModalNav();
    setHashForPrompt(id);
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
    $("#modalClose").focus();
  }

  function updateModalNav() {
    const list = getFiltered();
    const idx = list.findIndex((p) => p.id === state.activeId);
    const pos = $("#modalPos");
    if (pos) {
      pos.textContent =
        idx >= 0 && list.length ? `${idx + 1} / ${list.length}` : "";
    }
    const prev = $("#modalPrev");
    const next = $("#modalNext");
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx < 0 || idx >= list.length - 1;
  }

  function navigateModal(dir) {
    if (!$("#modalBackdrop")?.classList.contains("open")) return;
    const list = getFiltered();
    if (!list.length) return;
    let idx = list.findIndex((p) => p.id === state.activeId);
    if (idx < 0) idx = 0;
    const next = idx + dir;
    if (next < 0 || next >= list.length) return;
    // ensure target card is in visible page for focus restore
    if (next + 1 > state.visible) {
      state.visible = Math.min(list.length, Math.ceil((next + 1) / PAGE_SIZE) * PAGE_SIZE);
      renderGrid();
    }
    openModal(list[next].id);
  }

  function closeModal() {
    $("#modalBackdrop").classList.remove("open");
    document.body.style.overflow = "";
    if (state.activeId) {
      const card = $(`.card[data-id="${state.activeId}"]`);
      if (card) card.focus();
    }
    state.activeId = null;
    if (location.hash.startsWith("#p=")) {
      history.replaceState(null, "", location.pathname + location.search + "#gallery");
    }
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
      $("#modalFavBtn").classList.toggle("active", fav);
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
    if (!options) return;
    const cats = window.CATEGORIES || ["全部"];
    const counts = categoryCounts();
    options.innerHTML = cats
      .map((c) => {
        const label = c === "全部" ? "全部分类" : c;
        const n = counts[c] ?? 0;
        return `<button type="button" class="category-option ${c === state.category ? "active" : ""}" role="option" data-cat="${escapeHtml(c)}" aria-selected="${c === state.category}"><span class="cat-label">${escapeHtml(label)}</span><span class="cat-count">${n}</span></button>`;
      })
      .join("");
  }

  function setCategory(cat) {
    state.category = cat;
    resetVisible();
    const text = cat === "全部" ? "全部分类" : cat;
    $("#categoryText").textContent = text;
    $$(".category-option").forEach((el) => {
      const on = el.dataset.cat === state.category;
      el.classList.toggle("active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
    renderGrid();
  }

  function setFilter(filter) {
    state.filter = filter;
    resetVisible();
    $$(".filter-btn[data-filter]").forEach((b) =>
      b.classList.toggle("active", b.dataset.filter === filter)
    );
    renderGrid();
  }

  function resetFilters() {
    state.query = "";
    state.tag = "";
    resetVisible();
    const input = $("#searchInput");
    if (input) input.value = "";
    const clear = $("#searchClear");
    if (clear) clear.hidden = true;
    setCategory("全部");
    setFilter("all");
    updateChips();
  }

  function initAnnouncements() {
    const list = window.ANNOUNCEMENTS || [];
    const root = $("#announcement");
    if (!list.length) {
      if (root) root.style.display = "none";
      return;
    }
    const slides = $("#announcementSlides");
    const dots = $("#announcementDots");
    if (!slides) return;

    slides.innerHTML = list
      .map(
        (a, i) => `
      <div class="announcement-slide ${i === 0 ? "active" : ""}" data-i="${i}">
        <strong>${escapeHtml(a.title)}</strong>
        <span class="ann-sep" aria-hidden="true">·</span>
        <span class="ann-body">${escapeHtml(a.body)}</span>
      </div>`
      )
      .join("");

    if (dots) {
      dots.innerHTML = list
        .map(
          (_, i) =>
            `<button type="button" class="${i === 0 ? "active" : ""}" data-i="${i}" aria-label="提示 ${i + 1}"></button>`
        )
        .join("");
    }

    let idx = 0;
    const go = (n) => {
      idx = ((n % list.length) + list.length) % list.length;
      $$(".announcement-slide", slides).forEach((el, i) =>
        el.classList.toggle("active", i === idx)
      );
      if (dots) {
        $$("button", dots).forEach((el, i) => el.classList.toggle("active", i === idx));
      }
    };

    dots?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-i]");
      if (!btn) return;
      go(Number(btn.dataset.i));
    });

    if (list.length > 1) {
      setInterval(() => go(idx + 1), 6500);
    } else if (dots) {
      dots.style.display = "none";
    }
  }

  function collectTagStats(limit = 28) {
    const counts = new Map();
    for (const p of window.PROMPT_DATA || []) {
      for (const t of p.tags || []) {
        if (!t || String(t).length > 18) continue;
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
      .slice(0, limit);
  }

  function weightClass(n, min, max) {
    if (max <= min) return "w3";
    const t = (n - min) / (max - min);
    if (t >= 0.8) return "w5";
    if (t >= 0.55) return "w4";
    if (t >= 0.3) return "w3";
    if (t >= 0.12) return "w2";
    return "w1";
  }

  function initTagCloud() {
    const cloud = $("#tagCloud");
    const wrap = $("#tagCloudWrap");
    if (!cloud) return;
    const stats = collectTagStats(28);
    if (!stats.length) {
      if (wrap) wrap.hidden = true;
      return;
    }
    if (wrap) wrap.hidden = false;
    const nums = stats.map(([, n]) => n);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    cloud.innerHTML = stats
      .map(([tag, n]) => {
        const w = weightClass(n, min, max);
        const active = state.tag === tag ? " active" : "";
        return `<button type="button" class="tag-cloud-item ${w}${active}" role="listitem" data-tag="${escapeHtml(tag)}" title="${escapeHtml(tag)} · ${n} 条">${escapeHtml(tag)}<span class="tc-n">${n}</span></button>`;
      })
      .join("");
  }

  function setTag(tag) {
    state.tag = state.tag === tag ? "" : tag || "";
    resetVisible();
    updateChips();
    renderGrid();
  }

  function syncSearchClear() {
    const clear = $("#searchClear");
    if (clear) clear.hidden = !state.query.trim();
  }

  function openFromHash() {
    const hash = location.hash || "";
    const m = hash.match(/^#p=([^&]+)/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (findById(id)) {
      openModal(id);
      // scroll gallery into view underneath
      const gal = $("#gallery");
      if (gal) gal.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function bindEvents() {
    const searchInput = $("#searchInput");
    let searchTimer = 0;
    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value;
      syncSearchClear();
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        resetVisible();
        renderGrid();
      }, 160);
    });

    $("#searchClear")?.addEventListener("click", () => {
      state.query = "";
      resetVisible();
      searchInput.value = "";
      syncSearchClear();
      searchInput.focus();
      renderGrid();
    });

    const catTrigger = $("#categoryTrigger");
    catTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = $("#categoryOptions").classList.toggle("open");
      catTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    $("#categoryOptions").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      setCategory(btn.dataset.cat);
      $("#categoryOptions").classList.remove("open");
      catTrigger.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", () => {
      $("#categoryOptions").classList.remove("open");
      catTrigger.setAttribute("aria-expanded", "false");
    });

    $$(".filter-btn[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => setFilter(btn.dataset.filter));
    });

    $("#resetFilters")?.addEventListener("click", resetFilters);

    const sortSelect = $("#sortSelect");
    if (sortSelect) {
      sortSelect.value = state.sort;
      sortSelect.addEventListener("change", () => {
        state.sort = sortSelect.value;
        if (state.sort === "random") state.randomSeed = Date.now();
        saveSort();
        resetVisible();
        renderGrid();
      });
    }

    $("#shuffleBtn")?.addEventListener("click", () => {
      state.sort = "random";
      state.randomSeed = Date.now();
      if (sortSelect) sortSelect.value = "random";
      saveSort();
      resetVisible();
      renderGrid();
      showToast("已随机打乱词库 🎲");
      const gal = $("#gallery");
      if (gal) gal.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#loadMoreBtn")?.addEventListener("click", loadMore);

    // 触底自动加载更多
    const sentinel = $("#loadMoreSentinel");
    if (sentinel && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) loadMore();
        },
        { rootMargin: "240px 0px" }
      );
      io.observe(sentinel);
    }

    $("#activeChips")?.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-chip]");
      if (!chip) return;
      const kind = chip.dataset.chip;
      if (kind === "query") {
        state.query = "";
        resetVisible();
        searchInput.value = "";
        syncSearchClear();
      } else if (kind === "category") {
        setCategory("全部");
        return;
      } else if (kind === "filter") {
        setFilter("all");
        return;
      } else if (kind === "tag") {
        setTag("");
        return;
      }
      renderGrid();
    });

    $("#tagCloud")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tag]");
      if (!btn) return;
      setTag(btn.dataset.tag);
    });

    $("#tagCloudClear")?.addEventListener("click", () => setTag(""));

    $("#promptsGrid").addEventListener("click", (e) => {
      if (e.target.closest("#emptyReset")) {
        resetFilters();
        return;
      }
      const copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        e.stopPropagation();
        const item = findById(copyBtn.dataset.copy);
        if (item) copyText(item.prompt);
        return;
      }
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
      const modalOpen = $("#modalBackdrop").classList.contains("open");
      if (e.key === "Escape") {
        if (modalOpen) closeModal();
        return;
      }
      // 弹窗内左右键切换
      if (modalOpen && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const tag = (e.target && e.target.tagName) || "";
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          navigateModal(e.key === "ArrowLeft" ? -1 : 1);
        }
        return;
      }
      // / 聚焦搜索（非输入态）
      const tag = (e.target && e.target.tagName) || "";
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;
      if (!typing && e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      // Ctrl/Cmd+K 聚焦搜索
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    $("#modalPrev")?.addEventListener("click", () => navigateModal(-1));
    $("#modalNext")?.addEventListener("click", () => navigateModal(1));

    $("#copyBtn").addEventListener("click", () => {
      copyText($("#modalPrompt").textContent);
    });

    $("#modalFavBtn").addEventListener("click", () => {
      const id = $("#modalFavBtn").dataset.id;
      if (id) toggleFavorite(id);
    });

    $("#shareBtn")?.addEventListener("click", async () => {
      const id = state.activeId || $("#modalFavBtn").dataset.id;
      if (!id) return;
      await copyText(promptDeepLink(id));
    });

    $("#themeToggle").addEventListener("click", toggleTheme);

    $("#jumpAnime")?.addEventListener("click", (e) => {
      e.preventDefault();
      setCategory("二次元");
      const gal = $("#gallery");
      if (gal) gal.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.addEventListener("hashchange", () => {
      if (location.hash.startsWith("#p=")) openFromHash();
      else if ($("#modalBackdrop").classList.contains("open")) {
        $("#modalBackdrop").classList.remove("open");
        document.body.style.overflow = "";
        state.activeId = null;
      }
    });

    const backTop = $("#backTop");
    const onScroll = () => {
      if (!backTop) return;
      backTop.classList.toggle("show", window.scrollY > 480);
      const bar = $("#controlsBar");
      if (bar) {
        bar.classList.toggle("is-stuck", window.scrollY > 320);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backTop?.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function applySiteConfig() {
    const cfg = window.SITE_CONFIG || {};
    if (cfg.name) {
      document.title = `${cfg.name} — ${cfg.tagline || "AI 提示词库"}`;
      const logo = document.querySelector(".logo");
      if (logo) {
        const sub = cfg.nameEn
          ? `${escapeHtml(cfg.nameEn)} · ${escapeHtml(cfg.brandNote || "Prompt Gallery")}`
          : escapeHtml(cfg.brandNote || "Prompt Gallery");
        logo.innerHTML = `<span class="logo-mark">✦</span><span class="logo-text"><strong>${escapeHtml(cfg.name)}</strong><small>${sub}</small></span>`;
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
    if (cfg.siteUrl) {
      const fs = $("#footerSite");
      if (fs) {
        fs.href = cfg.siteUrl;
        try {
          fs.textContent = new URL(cfg.siteUrl).host;
        } catch {
          fs.textContent = cfg.siteUrl;
        }
      }
    }
    if (cfg.debug) {
      console.info("[Lingdong]", cfg.name, "prompts:", (window.PROMPT_DATA || []).length);
    }
  }

  function pickShowcaseItems(n = 24) {
    const list = [...(window.PROMPT_DATA || [])];
    if (!list.length) return [];
    // prefer variety across categories
    const byCat = new Map();
    for (const p of list) {
      const c = p.category || "其他";
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c).push(p);
    }
    const cats = [...byCat.keys()];
    const picked = [];
    let i = 0;
    while (picked.length < Math.min(n, list.length) && i < list.length * 2) {
      const cat = cats[i % cats.length];
      const bucket = byCat.get(cat);
      if (bucket && bucket.length) {
        const idx = Math.floor(Math.random() * bucket.length);
        const item = bucket.splice(idx, 1)[0];
        if (item) picked.push(item);
      }
      i++;
    }
    // fallback fill
    while (picked.length < Math.min(n, list.length)) {
      const p = list[picked.length % list.length];
      if (!picked.includes(p)) picked.push(p);
      else break;
    }
    return picked;
  }

  function chipHtml(item) {
    return `<button type="button" class="ticker-chip" data-id="${escapeHtml(item.id)}" title="${escapeHtml(item.title)}">
      <span class="tc-emoji">${escapeHtml(item.emoji || "✦")}</span>
      <span class="tc-title">${escapeHtml(item.title)}</span>
      <span class="tc-cat">${escapeHtml(item.category || "")}</span>
    </button>`;
  }

  function initHeroTicker() {
    const trackA = $("#tickerTrackA");
    const trackB = $("#tickerTrackB");
    if (!trackA) return;
    const items = pickShowcaseItems(28);
    if (!items.length) return;
    const half = Math.ceil(items.length / 2);
    const rowA = items.slice(0, half);
    const rowB = items.slice(half).length ? items.slice(half) : items.slice().reverse();
    // duplicate for seamless loop
    const htmlA = [...rowA, ...rowA].map(chipHtml).join("");
    const htmlB = [...rowB, ...rowB].map(chipHtml).join("");
    trackA.innerHTML = htmlA;
    if (trackB) trackB.innerHTML = htmlB;

    const open = (e) => {
      const btn = e.target.closest(".ticker-chip");
      if (!btn?.dataset.id) return;
      openModal(btn.dataset.id);
    };
    trackA.addEventListener("click", open);
    trackB?.addEventListener("click", open);
  }

  function initSpotlight() {
    const stage = $("#spotlightStage");
    const dots = $("#spotlightDots");
    if (!stage) return;
    const items = pickShowcaseItems(8);
    if (!items.length) {
      $("#heroSpotlight")?.setAttribute("hidden", "");
      return;
    }
    let idx = 0;
    let timer = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    stage.innerHTML = items
      .map(
        (p, i) => `<article class="spotlight-card ${i === 0 ? "active" : ""}" data-i="${i}" data-id="${escapeHtml(p.id)}" role="button" tabindex="0">
        <div class="sp-meta">
          <span class="sp-emoji">${escapeHtml(p.emoji || "✦")}</span>
          <span>${escapeHtml(p.category || "")}</span>
          <span>·</span>
          <span>${p.type === "edit" ? "编辑" : "生成"}</span>
        </div>
        <div class="sp-title">${escapeHtml(p.title)}</div>
        <div class="sp-summary">${escapeHtml(p.summary || p.prompt?.slice(0, 80) || "")}</div>
      </article>`
      )
      .join("");

    if (dots) {
      dots.innerHTML = items
        .map(
          (_, i) =>
            `<button type="button" class="${i === 0 ? "active" : ""}" data-i="${i}" aria-label="第 ${i + 1} 条"></button>`
        )
        .join("");
    }

    function show(n) {
      idx = (n + items.length) % items.length;
      $$(".spotlight-card", stage).forEach((el, i) => el.classList.toggle("active", i === idx));
      if (dots) {
        $$("button", dots).forEach((el, i) => el.classList.toggle("active", i === idx));
      }
    }

    function next() {
      show(idx + 1);
    }
    function prev() {
      show(idx - 1);
    }

    function arm() {
      if (reduce) return;
      clearInterval(timer);
      timer = setInterval(next, 4200);
    }

    $("#spotNext")?.addEventListener("click", () => {
      next();
      arm();
    });
    $("#spotPrev")?.addEventListener("click", () => {
      prev();
      arm();
    });
    dots?.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (!b) return;
      show(+b.dataset.i);
      arm();
    });
    stage.addEventListener("click", (e) => {
      const card = e.target.closest(".spotlight-card");
      if (!card?.dataset.id) return;
      openModal(card.dataset.id);
    });
    stage.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".spotlight-card");
      if (!card?.dataset.id) return;
      e.preventDefault();
      openModal(card.dataset.id);
    });

    arm();
  }

  function applyBundle(data) {
    if (!data || typeof data !== "object") return false;
    if (Array.isArray(data.prompts) && data.prompts.length) {
      window.PROMPT_DATA = data.prompts;
    }
    if (Array.isArray(data.categories) && data.categories.length) {
      window.CATEGORIES = data.categories;
    }
    if (Array.isArray(data.announcements) && data.announcements.length) {
      window.ANNOUNCEMENTS = data.announcements;
    }
    return Array.isArray(window.PROMPT_DATA) && window.PROMPT_DATA.length > 0;
  }

  /**
   * HTTP(S) 下优先拉取 prompts.json；file:// 或失败时使用 data.js 内嵌数据。
   */
  async function loadPromptBundle() {
    const cfg = window.SITE_CONFIG || {};
    const url = cfg.promptsUrl || "prompts.json";
    const isHttp = /^https?:$/i.test(location.protocol);

    if (!isHttp) {
      if (cfg.debug) console.info("[Spark Prompts] file:// 使用内嵌 data.js");
      return { source: "embedded", ok: !!(window.PROMPT_DATA || []).length };
    }

    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!applyBundle(data)) throw new Error("invalid prompts.json");
      if (cfg.debug) {
        console.info("[Spark Prompts] loaded", url, "count:", window.PROMPT_DATA.length);
      }
      return { source: "json", ok: true };
    } catch (err) {
      console.warn("[Spark Prompts] prompts.json 加载失败，回退 data.js", err);
      return {
        source: "embedded-fallback",
        ok: !!(window.PROMPT_DATA || []).length,
      };
    }
  }

  function initSakuraField() {
    const field = $("#sakuraField");
    if (!field || field.dataset.ready) return;
    field.dataset.ready = "1";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reduce ? 0 : 28;
    const kinds = ["", " petal-b", " petal-c"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "petal" + kinds[i % kinds.length];
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDuration = `${7 + Math.random() * 14}s`;
      p.style.animationDelay = `${-Math.random() * 14}s`;
      p.style.opacity = String(0.3 + Math.random() * 0.55);
      p.style.setProperty("--drift", `${(Math.random() * 80 - 40).toFixed(0)}px`);
      p.style.transform = `scale(${0.55 + Math.random() * 1.1})`;
      field.appendChild(p);
    }

    const stars = $("#starfield");
    if (stars && !stars.dataset.ready && !reduce) {
      stars.dataset.ready = "1";
      for (let i = 0; i < 24; i++) {
        const s = document.createElement("span");
        s.className = "twinkle";
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 70}%`;
        s.style.animationDelay = `${Math.random() * 4}s`;
        s.style.animationDuration = `${2 + Math.random() * 3}s`;
        stars.appendChild(s);
      }
    }
  }

  async function boot() {
    applySiteConfig();
    initTheme();
    initSakuraField();
    await loadPromptBundle();
    initCategories();
    initAnnouncements();
    initTagCloud();
    initHeroTicker();
    initSpotlight();
    bindEvents();
    updateTotalStat();
    updateFavStat();
    renderGrid();
    openFromHash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
