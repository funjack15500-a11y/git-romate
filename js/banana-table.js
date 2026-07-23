/**
 * Banana 词库表格：效果图 + 提示词一览
 */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    query: "",
    category: "全部",
    mode: "all",
    page: 1,
    pageSize: 24,
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getBundle() {
    return window.BANANA_SHOWCASE || { rows: [], total: 0 };
  }

  function getRows() {
    const all = getBundle().rows || [];
    const q = state.query.trim().toLowerCase();
    return all.filter((r) => {
      if (state.category !== "全部" && r.category !== state.category) return false;
      if (state.mode === "generate" && r.mode !== "generate") return false;
      if (state.mode === "edit" && r.mode !== "edit") return false;
      if (!q) return true;
      const hay = [r.title, r.summary, r.prompt, r.author, r.category, r.subCategory]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function categories() {
    const set = new Set((getBundle().rows || []).map((r) => r.category).filter(Boolean));
    return ["全部", ...[...set].sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制提示词");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast("已复制提示词");
      } catch {
        toast("复制失败");
      }
      document.body.removeChild(ta);
    }
  }

  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => t.classList.remove("show"), 1800);
  }

  function openDetail(row) {
    const backdrop = $("#bnModal");
    if (!backdrop) return;
    $("#bnModalTitle").textContent = row.title;
    $("#bnModalMeta").innerHTML = [
      `<span class="tag accent">${escapeHtml(row.category)}</span>`,
      row.subCategory ? `<span class="tag">${escapeHtml(row.subCategory)}</span>` : "",
      `<span class="tag">${row.mode === "edit" ? "编辑" : "生成"}</span>`,
      `<span class="tag">@${escapeHtml(String(row.author).replace(/^@/, ""))}</span>`,
    ].join("");
    $("#bnModalPrompt").textContent = row.prompt;
    const img = $("#bnModalImg");
    const refWrap = $("#bnModalRefs");
    if (row.preview) {
      img.src = row.preview;
      img.alt = row.title;
      img.hidden = false;
    } else {
      img.removeAttribute("src");
      img.hidden = true;
    }
    if (row.refs && row.refs.length) {
      refWrap.innerHTML =
        `<span class="bn-ref-label">参考图</span>` +
        row.refs
          .map(
            (u) =>
              `<a href="${escapeHtml(u)}" target="_blank" rel="noopener" class="bn-ref-thumb"><img src="${escapeHtml(u)}" alt="参考图" loading="lazy" /></a>`
          )
          .join("");
      refWrap.hidden = false;
    } else {
      refWrap.innerHTML = "";
      refWrap.hidden = true;
    }
    $("#bnModalCopy").onclick = () => copyText(row.prompt);
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeDetail() {
    const backdrop = $("#bnModal");
    if (!backdrop) return;
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderFilters() {
    const sel = $("#bnCategory");
    if (!sel) return;
    const cats = categories();
    sel.innerHTML = cats
      .map(
        (c) =>
          `<option value="${escapeHtml(c)}" ${c === state.category ? "selected" : ""}>${escapeHtml(c)}</option>`
      )
      .join("");
  }

  function renderTable() {
    const body = $("#bnTableBody");
    const empty = $("#bnEmpty");
    const pager = $("#bnPager");
    const countEl = $("#bnCount");
    if (!body) return;

    const list = getRows();
    const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = list.slice(start, start + state.pageSize);

    if (countEl) {
      countEl.innerHTML = `筛选 <strong>${list.length}</strong> / 共 ${getBundle().total || list.length} 条 · 第 ${state.page}/${totalPages} 页`;
    }

    if (!pageRows.length) {
      body.innerHTML = "";
      if (empty) empty.hidden = false;
      if (pager) pager.innerHTML = "";
      return;
    }
    if (empty) empty.hidden = true;

    body.innerHTML = pageRows
      .map((r) => {
        const modeLabel = r.mode === "edit" ? "编辑" : "生成";
        const modeClass = r.mode === "edit" ? "mode-edit" : "mode-gen";
        const thumb = r.preview
          ? `<img class="bn-thumb" src="${escapeHtml(r.preview)}" alt="" loading="lazy" decoding="async" />`
          : `<span class="bn-thumb bn-thumb-fallback">🍌</span>`;
        return `
        <tr data-id="${escapeHtml(r.id)}" tabindex="0">
          <td class="col-no">${r.no}</td>
          <td class="col-thumb">${thumb}</td>
          <td class="col-title">
            <div class="bn-title">${escapeHtml(r.title)}</div>
            <div class="bn-sub">${escapeHtml(r.summary)}</div>
          </td>
          <td class="col-cat">
            <span class="bn-pill">${escapeHtml(r.category)}</span>
            ${r.subCategory ? `<span class="bn-pill soft">${escapeHtml(r.subCategory)}</span>` : ""}
          </td>
          <td class="col-mode"><span class="bn-mode ${modeClass}">${modeLabel}</span></td>
          <td class="col-author">${escapeHtml(String(r.author).replace(/^@/, "@"))}</td>
          <td class="col-actions">
            <button type="button" class="bn-act" data-view="${escapeHtml(r.id)}" title="查看">查看</button>
            <button type="button" class="bn-act primary" data-copy="${escapeHtml(r.id)}" title="复制">复制</button>
          </td>
        </tr>`;
      })
      .join("");

    // mobile cards mirror
    const cards = $("#bnCards");
    if (cards) {
      cards.innerHTML = pageRows
        .map((r) => {
          const modeLabel = r.mode === "edit" ? "编辑" : "生成";
          return `
          <article class="bn-card" data-id="${escapeHtml(r.id)}">
            <div class="bn-card-media">
              ${
                r.preview
                  ? `<img src="${escapeHtml(r.preview)}" alt="${escapeHtml(r.title)}" loading="lazy" />`
                  : `<div class="bn-card-ph">🍌</div>`
              }
              <span class="bn-mode ${r.mode === "edit" ? "mode-edit" : "mode-gen"}">${modeLabel}</span>
            </div>
            <div class="bn-card-body">
              <h3>${escapeHtml(r.title)}</h3>
              <p>${escapeHtml(r.summary)}</p>
              <div class="bn-card-meta">
                <span class="bn-pill">${escapeHtml(r.category)}</span>
                <span class="bn-author">@${escapeHtml(String(r.author).replace(/^@/, ""))}</span>
              </div>
              <div class="bn-card-acts">
                <button type="button" class="bn-act" data-view="${escapeHtml(r.id)}">查看详情</button>
                <button type="button" class="bn-act primary" data-copy="${escapeHtml(r.id)}">复制提示词</button>
              </div>
            </div>
          </article>`;
        })
        .join("");
    }

    if (pager) {
      const prevDis = state.page <= 1 ? "disabled" : "";
      const nextDis = state.page >= totalPages ? "disabled" : "";
      pager.innerHTML = `
        <button type="button" class="bn-page-btn" data-page="prev" ${prevDis}>上一页</button>
        <span class="bn-page-info">${state.page} / ${totalPages}</span>
        <button type="button" class="bn-page-btn" data-page="next" ${nextDis}>下一页</button>
      `;
    }
  }

  function findRow(id) {
    return (getBundle().rows || []).find((r) => r.id === id);
  }

  function bind() {
    $("#bnSearch")?.addEventListener("input", (e) => {
      state.query = e.target.value;
      state.page = 1;
      renderTable();
    });
    $("#bnCategory")?.addEventListener("change", (e) => {
      state.category = e.target.value;
      state.page = 1;
      renderTable();
    });
    $$(".bn-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".bn-mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.mode = btn.dataset.mode;
        state.page = 1;
        renderTable();
      });
    });

    const onAct = (e) => {
      const copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        e.stopPropagation();
        const row = findRow(copyBtn.dataset.copy);
        if (row) copyText(row.prompt);
        return;
      }
      const viewBtn = e.target.closest("[data-view]");
      if (viewBtn) {
        e.stopPropagation();
        const row = findRow(viewBtn.dataset.view);
        if (row) openDetail(row);
        return;
      }
      const tr = e.target.closest("tr[data-id], .bn-card[data-id]");
      if (tr) {
        const row = findRow(tr.dataset.id);
        if (row) openDetail(row);
      }
    };
    $("#bnTableBody")?.addEventListener("click", onAct);
    $("#bnCards")?.addEventListener("click", onAct);
    $("#bnTableBody")?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const tr = e.target.closest("tr[data-id]");
      if (!tr) return;
      e.preventDefault();
      const row = findRow(tr.dataset.id);
      if (row) openDetail(row);
    });

    $("#bnPager")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      if (btn.dataset.page === "prev") state.page = Math.max(1, state.page - 1);
      if (btn.dataset.page === "next") state.page += 1;
      renderTable();
      $("#showcase")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#bnModalClose")?.addEventListener("click", closeDetail);
    $("#bnModal")?.addEventListener("click", (e) => {
      if (e.target === $("#bnModal")) closeDetail();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#bnModal")?.classList.contains("open")) closeDetail();
    });
  }

  function boot() {
    if (!getBundle().rows?.length) {
      const sec = $("#showcase") || $("#bananaTable");
      if (sec) sec.hidden = true;
      return;
    }
    const total = $("#bnTotalBadge");
    if (total) total.textContent = String(getBundle().total || getBundle().rows.length);
    renderFilters();
    bind();
    renderTable();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
