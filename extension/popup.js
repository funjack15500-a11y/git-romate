const LIVE_URL = "https://lingdongtech.de5.net/prompts.json";
const LOCAL_URL = "data/prompts.json";
const DEFAULT_CAT = "科研提示词";
const FAV_CAT = "我的收藏";
const FAV_KEY = "ld.favorites";
const MAX_RENDER = 120;

const state = {
  data: null,
  live: false,
  category: DEFAULT_CAT,
  query: "",
  rendered: MAX_RENDER,
  favorites: new Set(),
  detailId: null,
};

const $ = (sel) => document.querySelector(sel);
const listEl = $("#list");

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function loadData() {
  try {
    const res = await fetchWithTimeout(`${LIVE_URL}?t=${Date.now()}`, 4000);
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.prompts) && json.prompts.length) {
        return { data: json, live: true };
      }
    }
  } catch (error) {
    /* 网络不可用时退回内置快照 */
  }
  const local = await fetch(chrome.runtime.getURL(LOCAL_URL));
  return { data: await local.json(), live: false };
}

async function loadFavorites() {
  try {
    const got = await chrome.storage.local.get(FAV_KEY);
    const list = got && Array.isArray(got[FAV_KEY]) ? got[FAV_KEY] : [];
    state.favorites = new Set(list.map((id) => String(id)));
  } catch (error) {
    state.favorites = new Set();
  }
}

function saveFavorites() {
  try {
    chrome.storage.local.set({ [FAV_KEY]: [...state.favorites] });
  } catch (error) {
    /* 存储不可用时只保留当前会话状态 */
  }
}

function categories() {
  const cats = (state.data && state.data.categories) || [];
  const withAll = ["全部"].concat(cats.filter((c) => c !== "全部"));
  if (!withAll.includes(FAV_CAT)) withAll.push(FAV_CAT);
  return withAll;
}

function currentItems() {
  if (!state.data) return [];
  const q = state.query.trim().toLowerCase();
  return state.data.prompts.filter((item) => {
    if (state.category === FAV_CAT) {
      if (!state.favorites.has(String(item.id))) return false;
    } else if (state.category !== "全部" && item.category !== state.category) {
      return false;
    }
    if (!q) return true;
    const haystack = [item.title, item.summary, (item.tags || []).join(" "), item.prompt]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function renderCats() {
  const el = $("#cats");
  el.innerHTML = categories()
    .map((cat) => {
      let count = 0;
      if (!state.data) count = 0;
      else if (cat === "全部") count = state.data.prompts.length;
      else if (cat === FAV_CAT) count = state.favorites.size;
      else count = state.data.prompts.filter((p) => p.category === cat).length;
      return `<button type="button" class="cat-btn" role="tab" data-cat="${escapeHtml(cat)}" aria-selected="${
        cat === state.category ? "true" : "false"
      }">${escapeHtml(cat)} ${count}</button>`;
    })
    .join("");
}

function heartSvg(filled) {
  if (filled) {
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
  }
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function rowHtml(item) {
  const fav = state.favorites.has(String(item.id));
  const tags = (item.tags || []).slice(0, 3);
  return `
    <article class="row" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(item.title)}">
      <div class="row-head">
        <span class="emoji" aria-hidden="true">${escapeHtml(item.emoji || "✨")}</span>
        <div class="row-title"><span>${escapeHtml(item.title)}</span></div>
        <span class="cat-badge">${escapeHtml(item.category)}</span>
        <button type="button" class="row-fav ${fav ? "active" : ""}" data-fav="${escapeHtml(item.id)}" title="${
          fav ? "取消收藏" : "加入我的收藏"
        }" aria-label="${fav ? "取消收藏" : "加入我的收藏"}">${heartSvg(fav)}</button>
      </div>
      ${item.summary ? `<p class="row-sum">${escapeHtml(item.summary)}</p>` : ""}
      <div class="row-meta">
        ${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
        <span class="row-len">${item.prompt.length.toLocaleString()} 字符</span>
      </div>
    </article>`;
}

function render() {
  const items = currentItems();
  $("#listCount").textContent = `${items.length} 条`;
  if (!items.length) {
    if (state.category === FAV_CAT && state.favorites.size === 0) {
      listEl.innerHTML = `<div class="empty-state">还没有收藏：点条目右侧的 ♡，就能把它收进「我的收藏」，随时回来复制。</div>`;
      return;
    }
    listEl.innerHTML =
      state.category === FAV_CAT
        ? `<div class="empty-state">这个关键词下没有收藏的提示词，换个词试试。</div>`
        : `<div class="empty-state">没有匹配的提示词，换个关键词试试。</div>`;
    return;
  }
  const shown = items.slice(0, state.rendered);
  listEl.innerHTML =
    shown.map(rowHtml).join("") +
    (items.length > shown.length
      ? `<div class="empty-state" id="moreHint">还有 ${items.length - shown.length} 条，继续输入关键词缩小范围，或滚动加载更多。</div>`
      : "");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

let toastTimer = null;

function showToast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1500);
}

async function copyPrompt(item, node) {
  const ok = await copyText(item.prompt);
  if (!ok) {
    if (node && node.isConnected) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      showToast("已选中正文，按 Ctrl+C 复制");
    } else {
      showToast("复制失败，请手动选取正文");
    }
    return;
  }
  if (node) {
    node.classList.add("copied");
    setTimeout(() => node.classList.remove("copied"), 1200);
  }
  showToast(`已复制：${item.title}`);
}

function itemById(id) {
  if (!state.data) return null;
  return state.data.prompts.find((p) => p.id === id) || null;
}

function paintDetailFav(item) {
  const btn = $("#detailFav");
  if (!btn) return;
  const fav = state.favorites.has(String(item.id));
  btn.classList.toggle("active", fav);
  btn.innerHTML = heartSvg(fav);
  btn.title = fav ? "取消收藏" : "加入我的收藏";
  btn.setAttribute("aria-label", fav ? "取消收藏" : "加入我的收藏");
}

function openDetail(id) {
  const item = itemById(id);
  if (!item) return;
  state.detailId = item.id;

  $("#detailCat").textContent = item.category || "";
  $("#detailTitle").textContent = item.title || "";

  const tagsEl = $("#detailTags");
  tagsEl.innerHTML = (item.tags || [])
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  const sumEl = $("#detailSummary");
  sumEl.textContent = item.summary || "";
  sumEl.hidden = !item.summary;

  const body = $("#detailBody");
  body.textContent = item.prompt || "";
  body.classList.remove("copied");
  body.scrollTop = 0;

  paintDetailFav(item);

  const detail = $("#detail");
  detail.hidden = false;
  detail.setAttribute("aria-hidden", "false");
  $("#detailBack").focus();
}

function closeDetail() {
  state.detailId = null;
  const detail = $("#detail");
  detail.hidden = true;
  detail.setAttribute("aria-hidden", "true");
  $("#search").focus();
}

function currentDetailItem() {
  return state.detailId ? itemById(state.detailId) : null;
}

function toggleFavorite(id) {
  const key = String(id);
  const adding = !state.favorites.has(key);
  if (adding) state.favorites.add(key);
  else state.favorites.delete(key);
  saveFavorites();
  renderCats();
  state.rendered = MAX_RENDER;
  render();
  showToast(adding ? "已加入我的收藏" : "已取消收藏");
}

function bindList() {
  listEl.addEventListener("click", (event) => {
    const row = event.target.closest(".row");
    if (!row) return;
    const favBtn = event.target.closest("[data-fav]");
    if (favBtn) {
      toggleFavorite(favBtn.dataset.fav);
      return;
    }
    openDetail(row.dataset.id);
  });

  listEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest(".row");
    if (!row) return;
    if (event.target.closest("[data-fav]")) return;
    event.preventDefault();
    openDetail(row.dataset.id);
  });

  listEl.addEventListener("scroll", () => {
    if (listEl.scrollTop + listEl.clientHeight < listEl.scrollHeight - 240) return;
    const total = currentItems().length;
    if (state.rendered >= total) return;
    state.rendered = Math.min(total, state.rendered + MAX_RENDER);
    render();
  });
}

function bindDetail() {
  const body = $("#detailBody");

  $("#detailBack").addEventListener("click", closeDetail);

  body.addEventListener("click", () => {
    const item = currentDetailItem();
    if (item) copyPrompt(item, body);
  });

  body.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const item = currentDetailItem();
    if (item) copyPrompt(item, body);
  });

  $("#detailCopy").addEventListener("click", () => {
    const item = currentDetailItem();
    if (item) copyPrompt(item, body);
  });

  $("#detailFav").addEventListener("click", () => {
    const item = currentDetailItem();
    if (!item) return;
    toggleFavorite(item.id);
    paintDetailFav(item);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.detailId) closeDetail();
  });
}

function bindControls() {
  const search = $("#search");
  search.addEventListener("input", () => {
    state.query = search.value;
    $("#clearBtn").hidden = !search.value;
    state.rendered = MAX_RENDER;
    renderCats();
    render();
  });

  $("#clearBtn").addEventListener("click", () => {
    search.value = "";
    state.query = "";
    $("#clearBtn").hidden = true;
    state.rendered = MAX_RENDER;
    renderCats();
    render();
    search.focus();
  });

  $("#cats").addEventListener("click", (event) => {
    const btn = event.target.closest(".cat-btn");
    if (!btn) return;
    state.category = btn.dataset.cat;
    state.rendered = MAX_RENDER;
    renderCats();
    render();
    listEl.scrollTop = 0;
  });

  const openSite = () => chrome.tabs.create({ url: "https://lingdongtech.de5.net/" });
  $("#siteBtn").addEventListener("click", openSite);
  $("#siteLink").addEventListener("click", (event) => {
    event.preventDefault();
    openSite();
  });

  const mailLink = $("#mailLink");
  if (mailLink) {
    mailLink.addEventListener("click", (event) => {
      event.preventDefault();
      chrome.tabs.create({ url: "mailto:funjack15500@gmail.com" });
    });
  }

  const issuesLink = $("#issuesLink");
  if (issuesLink) {
    issuesLink.addEventListener("click", (event) => {
      event.preventDefault();
      chrome.tabs.create({ url: "https://github.com/funjack15500-a11y/git-romate/issues" });
    });
  }
}

async function boot() {
  bindControls();
  bindDetail();
  bindList();
  await loadFavorites();

  let loaded = null;
  try {
    loaded = await loadData();
  } catch (error) {
    listEl.innerHTML = `<div class="empty-state">词库载入失败：${escapeHtml(error.message || error)}</div>`;
    return;
  }

  state.data = loaded.data;
  state.live = loaded.live;

  const total = state.data.prompts.length;
  const updated = state.data.updatedAt ? `更新于 ${state.data.updatedAt}` : "";
  $("#metaLine").textContent = `${total} 条提示词 · ${loaded.live ? "在线最新" : "本地快照"}`;
  $("#dataSource").textContent = `${updated || "数据来源"} · ${loaded.live ? "在线" : "离线"}`;

  const cats = categories();
  if (!cats.includes(state.category)) state.category = "全部";

  renderCats();
  render();
}

boot();
