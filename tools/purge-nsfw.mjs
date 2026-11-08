/**
 * 清理 NSFW / 成人向提示词
 *
 * 当前数据链路（注意：不要跑 build-data.mjs，那是旧版硬编码生成器，会把词库覆盖回几十条）：
 *   权威源   ：根目录 prompts.json
 *   派生副本 ：js/data.js（file:// 或 prompts.json 拉取失败时的内嵌回退包）
 *   导入缓存 ：tools/banana-prompts-raw.json（banana 重新导入的原料，不清会复活）
 *
 * 用法：
 *   node tools/purge-nsfw.mjs            # 只试算，打印命中清单，不写盘
 *   node tools/purge-nsfw.mjs --apply     # 写回 prompts.json + js/data.js + 原始缓存
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { classifyPrompt } from "./nsfw-filter.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.argv.includes("--apply");

/**
 * 人工复核后确认要删的擦边条目（标题看不出问题、正文是内衣/肚兜/露胸式造型）。
 * 命中 soft 默认只提示不删，需要删就往这里加。
 */
const MANUAL_REMOVE = {
  "bn-维多利亚的秘密华丽拍摄-b1bfce16":
    "维多利亚的秘密后台内衣秀：紧身胸衣 + 羽毛翅膀，正文强调性感、皮肤光泽",
  "bn-换装越南奥黛风艺术照-487bdc4e":
    "白色丝绸肚兜（露肩胸衣式）+ 大腿特写，写真向",
};

const sparkPath = path.join(root, "prompts.json");
const spark = JSON.parse(fs.readFileSync(sparkPath, "utf8"));

const rows = spark.prompts.map((p) => {
  const auto = classifyPrompt(p);
  const manual = MANUAL_REMOVE[p.id];
  return { p, auto, manual, drop: Boolean(manual) || auto?.level === "hard" };
});

const drop = rows.filter((r) => r.drop);
const soft = rows.filter((r) => !r.drop && r.auto?.level === "soft");

console.log(`总条目 ${spark.prompts.length}；删除 ${drop.length}；擦边待复核 ${soft.length}`);

console.log("\n== 将删除 ==");
for (const r of drop) {
  const why = r.manual || r.auto?.why;
  console.log(`- ${r.p.id} | ${r.p.title} | ${r.p.category} | 原因：${why}`);
}

console.log("\n== 擦边（保留，仅提示） ==");
for (const r of soft) {
  const body = `${r.p.prompt || ""}`.replace(/\s+/g, " ").slice(0, 60);
  console.log(`- ${r.p.id} | ${r.p.title} | ${r.auto.why} | ${body}`);
}

if (!APPLY) {
  console.log("\n（试算模式，未写盘。确认后加 --apply）");
  process.exit(0);
}

const dropIds = new Set(drop.map((r) => r.p.id));
const before = spark.prompts.length;
spark.prompts = spark.prompts.filter((p) => !dropIds.has(p.id));
spark.updatedAt = new Date().toISOString().slice(0, 10);

/**
 * 原文件是单行紧凑 JSON（线上靠 HTTP 拉取，体积更重要），
 * 所以这里按原格式做最小改动：只摘掉目标条目，不重新排版，避免整文件 diff 噪音。
 */
const rawText = fs.readFileSync(sparkPath, "utf8");
const compactSingleLine = !rawText.includes("\n");

if (compactSingleLine) {
  let out = rawText;
  for (const p of drop.map((r) => r.p)) {
    const ser = JSON.stringify(p);
    const idx = out.indexOf(ser);
    if (idx === -1) throw new Error(`找不到待删条目的序列化片段：${p.id}`);
    if (out[idx + ser.length] === ",") {
      out = out.slice(0, idx) + out.slice(idx + ser.length + 1);
    } else if (out[idx - 1] === ",") {
      out = out.slice(0, idx - 1) + out.slice(idx + ser.length);
    } else {
      throw new Error(`无法确定逗号位置：${p.id}`);
    }
  }
  out = out.replace(/("updatedAt":")[^"]*(")/, `$1${spark.updatedAt}$2`);
  const check = JSON.parse(out);
  if (check.prompts.length !== spark.prompts.length) {
    throw new Error(`删除后条数不符：${check.prompts.length} != ${spark.prompts.length}`);
  }
  fs.writeFileSync(sparkPath, out, "utf8");
} else {
  fs.writeFileSync(sparkPath, JSON.stringify(spark, null, 2), "utf8");
}

/**
 * js/data.js 是多行缩进格式，但公告用的是紧凑单行写法（{ title: ..., body: ... }），
 * JSON.stringify 会把公告也重排成多行。这里按条目整块删除，其余字节保持原样。
 */
const dataJsPath = path.join(root, "js", "data.js");
const dataJsText = fs.readFileSync(dataJsPath, "utf8");
let dataOut = dataJsText;
for (const p of drop.map((r) => r.p)) {
  const esc = p.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRe = new RegExp(`  \\{\\r?\\n    "id": "${esc}",\\r?\\n[\\s\\S]*?\\r?\\n  \\},(?:\\r?\\n)?`);
  if (!blockRe.test(dataOut)) throw new Error(`js/data.js 里找不到条目块：${p.id}`);
  dataOut = dataOut.replace(blockRe, "");
}
const dataCount = (dataOut.match(/\r?\n    "id": "/g) || []).length;
if (dataCount !== spark.prompts.length) {
  throw new Error(`js/data.js 删除后条数不符：${dataCount} != ${spark.prompts.length}`);
}
fs.writeFileSync(dataJsPath, dataOut, "utf8");

// 原始缓存：按同样规则剔除，避免下次 import-banana 重新导回
const rawPath = path.join(root, "tools", "banana-prompts-raw.json");
let rawBefore = 0;
let rawAfter = 0;
if (fs.existsSync(rawPath)) {
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  rawBefore = raw.length;
  const cleaned = raw.filter((item) => {
    if (/nsfw/i.test(item.title || "")) return false;
    const fake = {
      id: item.title,
      title: item.title,
      category: item.category || "",
      sub_category: item.sub_category || "",
      mode: item.mode || "",
      prompt: item.prompt || "",
      summary: "",
      tags: [item.sub_category, item.category, item.mode].filter(Boolean),
    };
    return classifyPrompt(fake)?.level !== "hard";
  });
  rawAfter = cleaned.length;
  fs.writeFileSync(rawPath, JSON.stringify(cleaned, null, 2), "utf8");
}

console.log(`\n已写盘：prompts.json ${before} -> ${spark.prompts.length}；js/data.js 已同步`);
if (rawPath) console.log(`banana 原始缓存 ${rawBefore} -> ${rawAfter}`);
