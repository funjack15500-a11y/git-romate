/**
 * Remove NSFW prompts from prompts.json + banana-showcase + data.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TITLE_RE =
  /nsfw|nude|naked|porn|hentai|lewd|xxx|r-?18|色情|成人向|全裸|情色|情趣|出浴|半透蕾丝|蕾丝内衣|费洛蒙|亲密场景|触摸身体|素体|小便|枕头遮挡|透明比基尼|堕落过程|破烂护士|人体科普|18-22岁|快递箱摆拍|包裹快递|健身房喝水|磨砂厕所|宫殿跪地|奇怪角度|高叉紧身|微胖|湿身|内衣穿搭|露脐|丁字裤|t-back|micro\s*bikini|see-?through|topless|bottomless|ahegao|巨乳|豪乳|丰乳|淫纹|翻白眼|吐舌头/i;

const BODY_RE =
  /\bnsfw\b|\bnude\b|\bnaked\b|\bporn\b|\bhentai\b|\blewd\b|uncensored|nipples?|areola|\bpussy\b|\bpenis\b|vagina|genital|ahegao|cameltoe|underboob|topless|bottomless|micro\s*t-back|t-back\s*thong|highleg\s*micro|bimbofication|全裸|裸露|色情|情色|性交|做爱|口交|自慰|射精|阴茎|阴道|淫纹|翻白眼.*吐舌|情趣内衣|半透明内衣|蕾丝内衣|丁字裤|巨硕豪乳|丰乳肥臀|敏感部位|不露出任何敏感|内衣.*诱惑|脱光|裸身|裸体/i;

const KEEP_IDS = new Set(["write-story-beats"]); // 故事「高潮」误报

function isNsfw(p) {
  if (KEEP_IDS.has(p.id)) return false;
  const tags = (p.tags || []).map(String);
  if (tags.some((t) => /^nsfw$/i.test(t.trim()) || /成人|色情|r-?18/i.test(t))) return true;
  // banana showcase / import: category or mode labeled NSFW
  const cat = `${p.category || ""} ${p.subCategory || ""} ${p.mode || ""} ${p.sub_category || ""}`;
  if (/\bnsfw\b|成人|色情|r-?18/i.test(cat)) return true;
  const title = p.title || "";
  if (TITLE_RE.test(title)) return true;
  // title is only "Girl" with sexual content nearby handled by body
  if (/^girl$/i.test(title.trim())) return true;
  const body = `${p.prompt || ""}\n${p.summary || ""}`;
  if (BODY_RE.test(body)) return true;
  // banana tagged NSFW already caught; extra: explicit clothing fetish prompts
  if (/半透|透明衣|湿身|湿透|入浴|淋浴间|更衣室.*脱|脱衣|漏出.*内脏.*丁字/i.test(body) && /女|少女|角色|cos/i.test(title + body)) {
    // only if also suggestive
    if (/内衣|裸|胸|臀|腿根|乳|性感|魅惑|羞耻|诱惑/i.test(body)) return true;
  }
  return false;
}

// prompts.json
const sparkPath = path.join(root, "prompts.json");
const spark = JSON.parse(fs.readFileSync(sparkPath, "utf8"));
const beforeP = spark.prompts.length;
const removed = spark.prompts.filter(isNsfw);
spark.prompts = spark.prompts.filter((p) => !isNsfw(p));
spark.updatedAt = new Date().toISOString().slice(0, 10);
spark.announcements = [
  {
    title: "欢迎来到灵动词库 · 我的作品集",
    body: "整站视觉与交互由我搭建。词库可搜可藏，对照表可看效果再复制。内容已做安全过滤。",
  },
  {
    title: "效果图对照表",
    body: "导航点「对照表」，边看预览边拿提示词。已移除不适宜内容。",
  },
  {
    title: "持续更新中",
    body: "我会继续补自己的模板与精选条目，欢迎收藏本站。",
  },
];
fs.writeFileSync(sparkPath, JSON.stringify(spark, null, 2), "utf8");

// banana showcase
const bnPath = path.join(root, "banana-showcase.json");
const bn = JSON.parse(fs.readFileSync(bnPath, "utf8"));
const beforeB = bn.rows.length;
bn.rows = bn.rows.filter((r) => !isNsfw(r));
bn.rows.forEach((r, i) => {
  r.no = i + 1;
});
bn.total = bn.rows.length;
bn.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(bnPath, JSON.stringify(bn, null, 2), "utf8");

const bnJs = `/**
 * 灵动词库 · 效果图对照数据（已过滤 NSFW）
 */
window.BANANA_SHOWCASE = ${JSON.stringify(bn)};
`;
fs.writeFileSync(path.join(root, "js", "banana-showcase.js"), bnJs, "utf8");

const dataJs = `/**
 * 灵动词库 — 内嵌回退数据（已过滤 NSFW）
 */
window.PROMPT_DATA = ${JSON.stringify(spark.prompts, null, 2)};

window.ANNOUNCEMENTS = ${JSON.stringify(spark.announcements, null, 2)};

window.CATEGORIES = ${JSON.stringify(spark.categories, null, 2)};
`;
fs.writeFileSync(path.join(root, "js", "data.js"), dataJs, "utf8");

// also purge raw banana cache for future imports
const rawPath = path.join(root, "tools", "banana-prompts-raw.json");
if (fs.existsSync(rawPath)) {
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
  const cleaned = raw.filter((item) => {
    const fake = {
      id: item.title,
      title: item.title,
      prompt: item.prompt,
      summary: "",
      tags: [item.sub_category, item.category, item.mode].filter(Boolean),
    };
    // map banana mode NSFW from title
    if (/nsfw/i.test(item.title || "")) return false;
    return !isNsfw(fake);
  });
  fs.writeFileSync(rawPath, JSON.stringify(cleaned, null, 2), "utf8");
  console.log("raw banana", raw.length, "->", cleaned.length);
}

console.log(
  JSON.stringify(
    {
      prompts: { before: beforeP, after: spark.prompts.length, removed: beforeP - spark.prompts.length },
      showcase: { before: beforeB, after: bn.rows.length, removed: beforeB - bn.rows.length },
      removedTitles: removed.map((p) => p.title),
    },
    null,
    2
  )
);
