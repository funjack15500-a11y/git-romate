const LIVE_URL = "https://lingdongtech.de5.net/prompts.json";
const LOCAL_URL = "data/prompts.json";
const DEFAULT_CAT = "科研提示词";
const MAX_RENDER = 120;

const state = {
  data: null,
  live: false,
  category: DEFAULT_CAT,
  query: "",
  rendered: MAX_RENDER,
  expanded: new Set(),
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

function categories() {
  const cats = (state.data && state.data.categories) || [];
  const withAll = ["全部"].concat(cats.filter((c) => c !== "全部"));
  return withAll;
}

function currentItems() {
  if (!state.data) return [];
  const q = state.query.trim().toLowerCase();
  return state.data.prompts.filter((item) => {
    if (state.category !== "全部" && item.category !== state.category) return false;
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
      const count =
        cat === "全部"
          ? (state.data ? state.data.prompts.length : 0)
          : (state.data ? state.data.prompts.filter((p) => p.category === cat).length : 0);
      return `<button type="button" class="cat-btn" role="tab" data-cat="${escapeHtml(cat)}" aria-selected="${
        cat === state.category ? "true" : "false"
      }">${escapeHtml(cat)} ${count}</button>`;
    })
    .join("");
}

function rowHtml(item) {
  const expanded = state.expanded.has(item.id);
  const tags = (item.tags || []).slice(0, 3);
  return `
    <article class="row" data-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="复制 ${escapeHtml(item.title)}">
      <div class="row-head">
        <span class="emoji" aria-hidden="true">${escapeHtml(item.emoji || "✨")}</span>
        <div class="row-title"><span>${escapeHtml(item.title)}</span></div>
        <span class="cat-badge">${escapeHtml(item.category)}</span>
        <button type="button" class="row-toggle" aria-expanded="${expanded}" title="${
          expanded ? "收起正文" : "展开正文"
        }">${expanded ? "收起" : "正文"}</button>
      </div>
      <div class="row-meta">
        ${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
        <span class="row-len">${item.prompt.length.toLocaleString()} 字符</span>
      </div>
      ${expanded ? `<div class="preview">${escapeHtml(item.prompt)}</div>` : ""}
    </article>`;
}

function render() {
  const items = currentItems();
  $("#listCount").textContent = `${items.length} 条`;
  if (!items.length) {
    listEl.innerHTML = `<div class="empty-state">没有匹配的提示词，换个关键词试试。</div>`;
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

async function handleCopy(row, item) {
  const ok = await copyText(item.prompt);
  if (!ok) {
    showToast("复制失败，点「正文」手动选取");
    return;
  }
  row.classList.add("copied");
  setTimeout(() => row.classList.remove("copied"), 1200);
  showToast(`已复制：${item.title}`);
}

function toggleExpand(id) {
  if (state.expanded.has(id)) state.expanded.delete(id);
  else state.expanded.add(id);
  render();
}

function bindList() {
  listEl.addEventListener("click", (event) => {
    const row = event.target.closest(".row");
    if (!row) return;
    if (event.target.closest(".preview")) return;
    if (event.target.closest(".row-toggle")) {
      toggleExpand(row.dataset.id);
      return;
    }
    const item = state.data.prompts.find((p) => p.id === row.dataset.id);
    if (item) handleCopy(row, item);
  });

  listEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest(".row");
    if (!row) return;
    event.preventDefault();
    const item = state.data.prompts.find((p) => p.id === row.dataset.id);
    if (item) handleCopy(row, item);
  });

  listEl.addEventListener("scroll", () => {
    if (listEl.scrollTop + listEl.clientHeight < listEl.scrollHeight - 240) return;
    const total = currentItems().length;
    if (state.rendered >= total) return;
    state.rendered = Math.min(total, state.rendered + MAX_RENDER);
    render();
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
  bindList();

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
