/**
 * Import Banana Prompt Quicker prompts.json into Spark Prompts schema.
 * Source: https://github.com/glidea/banana-prompt-quicker (MIT)
 * Run: node tools/import-banana.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const rawPath = path.join(__dirname, "banana-prompts-raw.json");
const SOURCE_URL =
  "https://raw.githubusercontent.com/glidea/banana-prompt-quicker/main/prompts.json";

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return download(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
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

const covers = [
  "linear-gradient(135deg, #4a044e 0%, #ec4899 40%, #f9a8d4 100%)",
  "linear-gradient(135deg, #1e1b4b 0%, #6366f1 50%, #c7d2fe 100%)",
  "linear-gradient(135deg, #0f172a 0%, #312e81 50%, #06b6d4 100%)",
  "linear-gradient(135deg, #7c2d12 0%, #f97316 50%, #fed7aa 100%)",
  "linear-gradient(135deg, #14532d 0%, #22c55e 50%, #bbf7d0 100%)",
  "linear-gradient(135deg, #881337 0%, #f43f5e 50%, #fda4af 100%)",
  "linear-gradient(135deg, #164e63 0%, #06b6d4 50%, #a5f3fc 100%)",
  "linear-gradient(135deg, #3b0764 0%, #a855f7 50%, #e9d5ff 100%)",
  "linear-gradient(135deg, #422006 0%, #f59e0b 50%, #fde68a 100%)",
  "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #7dd3fc 100%)",
  "linear-gradient(135deg, #111827 0%, #374151 40%, #f97316 100%)",
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #e94560 100%)",
];

const emojis = ["🍌", "✨", "🎨", "🖼️", "🖌️", "📷", "🎬", "🧩", "🌸", "💫", "🪄", "📝"];

function mapCategory(cat, sub, title, prompt) {
  const s = `${cat || ""} ${sub || ""} ${title || ""}`;
  if (/二次元|动漫|角色|Q版|表情包|漫画|COS|立绘|萌/.test(s)) return "二次元";
  if (/编辑|改图|换|修|滤镜|增强|去/.test(s) || /上传|已有图|参考图|把图|基于图/.test(prompt || ""))
    return /编辑|改图|滤镜|增强/.test(s) ? "图像编辑" : mapGenCat(s);
  if (/UI|设计|海报|PPT|信息图|排版|图标/.test(s)) return "设计";
  if (/写作|文案|文章|翻译|对话|吐槽|锐评|解题|思维/.test(s)) return "写作与对话";
  if (/代码|编程|开发/.test(s)) return "编程";
  if (/办公|工作|商务|会议|效率/.test(s)) return "效率办公";
  return mapGenCat(s);
}

function mapGenCat(s) {
  if (/编辑|修图|滤镜/.test(s)) return "图像编辑";
  if (/设计|海报|PPT|UI/.test(s)) return "设计";
  if (/写作|文案/.test(s)) return "写作与对话";
  return "图像生成";
}

function mapType(mode, title, prompt) {
  if (mode === "edit") return "edit";
  if (mode === "generate") return "generate";
  if (/编辑|改图|基于图|把照片|将图片|上传/.test(`${title} ${prompt}`)) return "edit";
  return "generate";
}

function dateOnly(created) {
  if (!created) return "2026-01-01";
  const d = new Date(created);
  if (Number.isNaN(d.getTime())) return String(created).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function shortSummary(text) {
  const one = String(text).replace(/\s+/g, " ").trim();
  if (one.length <= 48) return one;
  return one.slice(0, 48) + "…";
}

async function main() {
  let rawText;
  if (fs.existsSync(rawPath) && fs.statSync(rawPath).size > 1000) {
    rawText = fs.readFileSync(rawPath, "utf8");
    console.log("using local", rawPath);
  } else {
    console.log("downloading", SOURCE_URL);
    rawText = await download(SOURCE_URL);
    fs.writeFileSync(rawPath, rawText, "utf8");
  }

  const banana = JSON.parse(rawText);
  if (!Array.isArray(banana)) throw new Error("banana prompts.json is not an array");

  const sparkPath = path.join(root, "prompts.json");
  const spark = JSON.parse(fs.readFileSync(sparkPath, "utf8"));
  const existingIds = new Set(spark.prompts.map((p) => p.id));
  const existingTitles = new Set(spark.prompts.map((p) => p.title.trim().toLowerCase()));

  const imported = [];
  let skipped = 0;
  banana.forEach((item, i) => {
    const title = (item.title || "").trim();
    if (!title || !item.prompt) {
      skipped++;
      return;
    }
    if (existingTitles.has(title.toLowerCase())) {
      skipped++;
      return;
    }
    const id = slugify(title);
    if (existingIds.has(id)) {
      skipped++;
      return;
    }
    const tags = [];
    if (item.sub_category) tags.push(item.sub_category);
    if (item.category) tags.push(item.category);
    tags.push("Banana");
    if (item.author && item.author !== "Official") tags.push(item.author.replace(/^@/, ""));

    const rec = {
      id,
      title,
      category: mapCategory(item.category, item.sub_category, title, item.prompt),
      tags: [...new Set(tags)].slice(0, 5),
      type: mapType(item.mode, title, item.prompt),
      date: dateOnly(item.created),
      cover: covers[i % covers.length],
      emoji: emojis[i % emojis.length],
      summary: shortSummary(item.prompt),
      prompt: String(item.prompt).trim(),
      source: "banana-prompt-quicker",
    };
    imported.push(rec);
    existingIds.add(id);
    existingTitles.add(title.toLowerCase());
  });

  const before = spark.prompts.length;
  spark.prompts = spark.prompts.concat(imported);
  spark.updatedAt = new Date().toISOString().slice(0, 10);
  spark.version = (spark.version || 1) + 1;
  spark.sources = spark.sources || [];
  if (!spark.sources.includes("https://github.com/glidea/banana-prompt-quicker")) {
    spark.sources.push("https://github.com/glidea/banana-prompt-quicker");
  }

  if (!Array.isArray(spark.announcements)) spark.announcements = [];
  spark.announcements.unshift({
    title: `已导入 Banana 词库 · 现共 ${spark.prompts.length} 条`,
    body: "来自 Banana Prompt Quicker 公开词库（MIT）。可搜索「海报」「表情包」「吐槽」等。",
  });
  // keep announcements short
  spark.announcements = spark.announcements.slice(0, 5);

  fs.writeFileSync(sparkPath, JSON.stringify(spark, null, 2), "utf8");

  const dataJs = `/**
 * Spark Prompts — 内嵌回退数据
 * 权威源：prompts.json（含 Banana Prompt Quicker 导入）
 */
window.PROMPT_DATA = ${JSON.stringify(spark.prompts, null, 2)};

window.ANNOUNCEMENTS = ${JSON.stringify(spark.announcements, null, 2)};

window.CATEGORIES = ${JSON.stringify(spark.categories, null, 2)};
`;
  fs.writeFileSync(path.join(root, "js", "data.js"), dataJs, "utf8");

  console.log(
    JSON.stringify(
      {
        banana: banana.length,
        before,
        imported: imported.length,
        skipped,
        total: spark.prompts.length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
