/**
 * Build banana-showcase dataset (title + preview image + prompt) for table UI.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const rawPath = path.join(__dirname, "banana-prompts-raw.json");

const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));

function dateOnly(created) {
  if (!created) return "";
  const d = new Date(created);
  if (Number.isNaN(d.getTime())) return String(created).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function slugify(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return `bn-${base || "prompt"}-${h.toString(16).slice(0, 6)}`;
}

const rows = raw
  .filter((x) => x && x.title && x.prompt)
  .map((item, i) => ({
    id: slugify(item.title),
    no: i + 1,
    title: item.title.trim(),
    preview: item.preview || "",
    refs: Array.isArray(item.reference_image_urls) ? item.reference_image_urls : [],
    prompt: String(item.prompt).trim(),
    author: item.author || "—",
    mode: item.mode === "edit" ? "edit" : "generate",
    category: item.category || "其他",
    subCategory: item.sub_category || "",
    date: dateOnly(item.created),
    summary: String(item.prompt).replace(/\s+/g, " ").trim().slice(0, 80) + (item.prompt.length > 80 ? "…" : ""),
  }));

// Sort: newest first
rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
rows.forEach((r, i) => {
  r.no = i + 1;
});

const payload = {
  version: 1,
  source: "https://github.com/glidea/banana-prompt-quicker",
  license: "MIT",
  updatedAt: new Date().toISOString().slice(0, 10),
  total: rows.length,
  rows,
};

fs.writeFileSync(path.join(root, "banana-showcase.json"), JSON.stringify(payload, null, 2), "utf8");

const js = `/**
 * Banana Prompt Quicker 表格展示数据（含效果图预览 URL）
 * 来源 MIT：https://github.com/glidea/banana-prompt-quicker
 * 由 tools/build-banana-table.mjs 生成
 */
window.BANANA_SHOWCASE = ${JSON.stringify(payload)};
`;
fs.writeFileSync(path.join(root, "js", "banana-showcase.js"), js, "utf8");

// Attach preview onto matching PROMPT_DATA entries in prompts.json
const sparkPath = path.join(root, "prompts.json");
if (fs.existsSync(sparkPath)) {
  const spark = JSON.parse(fs.readFileSync(sparkPath, "utf8"));
  const byTitle = new Map(rows.map((r) => [r.title.toLowerCase(), r]));
  let n = 0;
  for (const p of spark.prompts) {
    const hit = byTitle.get(String(p.title).toLowerCase());
    if (hit && hit.preview) {
      p.preview = hit.preview;
      if (hit.refs?.length) p.refs = hit.refs;
      n++;
    }
  }
  fs.writeFileSync(sparkPath, JSON.stringify(spark, null, 2), "utf8");

  const dataJs = `/**
 * Spark Prompts — 内嵌回退数据
 */
window.PROMPT_DATA = ${JSON.stringify(spark.prompts, null, 2)};

window.ANNOUNCEMENTS = ${JSON.stringify(spark.announcements, null, 2)};

window.CATEGORIES = ${JSON.stringify(spark.categories, null, 2)};
`;
  fs.writeFileSync(path.join(root, "js", "data.js"), dataJs, "utf8");
  console.log("attached preview to prompts:", n);
}

console.log("rows:", rows.length, "→ banana-showcase.json + js/banana-showcase.js");
