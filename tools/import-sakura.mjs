/**
 * Merge 网页设计/sakura prompts + extra templates into prompts.json & js/data.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const j = JSON.parse(fs.readFileSync(path.join(root, "prompts.json"), "utf8"));
const existing = new Set(j.prompts.map((p) => p.id));

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
];

const emojiMap = {
  文生图: "🎨",
  和风: "⛩️",
  夜景: "🌙",
  表情包: "💬",
  角色: "👤",
  Q版: "🧸",
  信息图: "📊",
  PPT: "📑",
  设计: "✏️",
  海报: "🪧",
  城市: "🌆",
  美食: "🍱",
  插画: "🖌️",
  旅游: "✈️",
  手账: "📔",
  总结: "📝",
  教育: "🎓",
  漫画: "📖",
  二次元: "🌸",
  滤镜: "🎞️",
  写真: "📷",
  复古: "📻",
  头像: "🧊",
  "3D": "📦",
  UI: "📱",
  产品: "🧩",
  神话: "🐉",
  装修: "🏠",
  封面: "🔥",
  运营: "📣",
  宠物: "🐾",
  趣味: "😄",
  摄影: "📸",
  场景: "🏡",
  拼贴: "🗂️",
  风格: "✨",
  绘本: "🖍️",
  可爱: "🌈",
  学习: "🧠",
  人像: "👩",
  电商: "🛍️",
  服装: "👗",
  翻译: "🌐",
  实用: "✅",
  设定: "🗂️",
};

function pickEmoji(tags) {
  for (const t of tags) if (emojiMap[t]) return emojiMap[t];
  return "✨";
}

function mapCategory(tags, title) {
  const t = tags.join(" ") + title;
  if (/二次元|Q版|角色|漫画|表情包|神话|COS|设定|盲盒/.test(t)) return "二次元";
  if (/UI|设计|装修|PPT|信息图/.test(t) && !/文生图|插画|海报/.test(t)) return "设计";
  if (/总结|教育|学习|翻译|菜单/.test(t)) return "写作与对话";
  if (/滤镜|写真|拼贴|试穿|上色|把照片|将手绘|将多张|基于宠物|升级/.test(t)) return "图像编辑";
  return "图像生成";
}

function mapType(title, prompt, tags) {
  const s = title + prompt + tags.join(" ");
  if (/转成|转|基于|升级|把照片|将手绘|将多张|根据户型|把角色设定转|把外语|把复杂|将长文/.test(s))
    return "edit";
  if (tags.includes("滤镜") || tags.includes("编辑")) return "edit";
  return "generate";
}

function shortSummary(text) {
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= 40) return one;
  return one.slice(0, 40) + "…";
}

const sakuraPath = path.join(root, "..", "网页设计", "assets", "js", "prompts-data.js");
const raw = fs.readFileSync(sakuraPath, "utf8");
const m = raw.match(/window\.SAKURA_PROMPTS\s*=\s*(\[[\s\S]*?\]);/);
if (!m) throw new Error("Failed to parse SAKURA_PROMPTS");
const sakura = Function(`"use strict"; return (${m[1]});`)();

const extras = [];
let i = 0;
for (const s of sakura) {
  const id = "sakura-" + s.id;
  if (existing.has(id)) continue;
  const tags = s.tags || [];
  extras.push({
    id,
    title: s.title,
    category: mapCategory(tags, s.title),
    tags,
    type: mapType(s.title, s.prompt, tags),
    date: "2026-07-" + String(Math.max(1, 23 - (i % 20))).padStart(2, "0"),
    cover: covers[i % covers.length],
    emoji: pickEmoji(tags),
    summary: shortSummary(s.prompt),
    prompt: s.prompt,
  });
  existing.add(id);
  i++;
}

const more = [
  {
    id: "write-wechat-official",
    title: "公众号长文结构",
    category: "写作与对话",
    tags: ["公众号", "结构", "运营"],
    type: "generate",
    date: "2026-07-23",
    cover: covers[0],
    emoji: "📰",
    summary: "从选题到结尾 CTA 的完整公众号成稿框架。",
    prompt: `请写一篇公众号文章：
主题：{{主题}}
受众：{{受众}}
风格：{{风格}}

输出：
1. 标题 5 个（含数字/反差/痛点）
2. 开头 100 字钩子
3. 正文小标题结构 + 每段要点
4. 金句 3 条
5. 结尾引导关注/转发
6. 封面文案建议
要求：口语可读，少空话，信息密度高。`,
  },
  {
    id: "write-script-shortvideo",
    title: "短视频分镜脚本",
    category: "写作与对话",
    tags: ["短视频", "脚本", "分镜"],
    type: "generate",
    date: "2026-07-22",
    cover: covers[1],
    emoji: "🎬",
    summary: "15–60 秒口播+画面提示的完整分镜表。",
    prompt: `为主题「{{主题}}」写短视频脚本（时长 {{秒}} 秒，平台 {{平台}}）。

表格列：时间轴 | 画面 | 口播 | 字幕 | 音效/BGM
要求：前 3 秒钩子；中段信息点清晰；结尾 CTA；口语自然。`,
  },
  {
    id: "code-regex-helper",
    title: "正则表达式助手",
    category: "编程",
    tags: ["正则", "文本", "工具"],
    type: "generate",
    date: "2026-07-21",
    cover: covers[2],
    emoji: "🔎",
    summary: "根据需求写出可测的正则与解释。",
    prompt: `需求：{{描述}}
语言/引擎：{{引擎}}

请给出：
1. 正则表达式
2. 逐段解释
3. 匹配/不匹配示例各 3 个
4. 常见坑
5. 可直接运行的测试代码片段`,
  },
  {
    id: "code-git-message",
    title: "Git Commit 信息",
    category: "编程",
    tags: ["Git", "规范", "协作"],
    type: "generate",
    date: "2026-07-20",
    cover: covers[3],
    emoji: "📎",
    summary: "按 Conventional Commits 写清晰提交说明。",
    prompt: `根据改动描述生成 commit message（Conventional Commits）：
改动：{{diff摘要}}

输出 3 个备选：
- type(scope): subject
- body（为何改）
- footer（破坏性变更如有）
中文或英文按用户语言。`,
  },
  {
    id: "biz-prd-lite",
    title: "轻量 PRD 模板",
    category: "效率办公",
    tags: ["PRD", "产品", "需求"],
    type: "generate",
    date: "2026-07-19",
    cover: covers[4],
    emoji: "📄",
    summary: "把模糊需求写成可评审的一页纸 PRD。",
    prompt: `把以下想法写成轻量 PRD：
{{想法}}

结构：背景与目标、用户故事、范围 In/Out、主流程、边界与异常、数据与埋点、验收标准、开放问题。语言简洁可执行。`,
  },
  {
    id: "biz-interview-prep",
    title: "面试题拆解",
    category: "效率办公",
    tags: ["面试", "准备", "表达"],
    type: "generate",
    date: "2026-07-18",
    cover: covers[5],
    emoji: "🎤",
    summary: "STAR 法则拆面试题并给示范回答。",
    prompt: `岗位：{{岗位}}
问题：{{问题}}
我的经历要点：{{要点}}

请用 STAR 输出：示范回答、可追问点、避坑提醒、30 秒精简版。`,
  },
  {
    id: "img-pixel-art",
    title: "像素风角色",
    category: "图像生成",
    tags: ["像素", "游戏", "角色"],
    type: "generate",
    date: "2026-07-23",
    cover: covers[6],
    emoji: "👾",
    summary: "复古游戏像素立绘，干净色板可当素材。",
    prompt: `16-bit pixel art character of [CHARACTER], side view idle pose, limited color palette, clean pixels, no anti-aliasing blur, game asset style, transparent-looking background, crisp edges, nostalgic SNES vibe --ar 1:1`,
  },
  {
    id: "img-cyberpunk-street",
    title: "赛博朋克街景",
    category: "图像生成",
    tags: ["赛博朋克", "街景", "夜景"],
    type: "generate",
    date: "2026-07-22",
    cover: covers[7],
    emoji: "🌃",
    summary: "霓虹雨夜街道，适合壁纸与概念图。",
    prompt: `Cyberpunk rainy street at night, neon signs in Japanese and Chinese, wet reflections, dense crowd silhouettes, volumetric fog, cinematic wide shot, teal and magenta lights, ultra detailed, blade runner atmosphere --ar 16:9`,
  },
  {
    id: "anime-vtuber-model",
    title: "VTuber 立绘设定",
    category: "二次元",
    tags: ["VTuber", "立绘", "直播"],
    type: "generate",
    date: "2026-07-23",
    cover: covers[8],
    emoji: "📺",
    summary: "可做 Live2D 的半身立绘与配色说明。",
    prompt: `Anime VTuber half-body illustration of [NAME], expressive eyes, signature hair accessory, streaming-friendly bright palette, clean lines, soft cel shading, transparent-ish simple background, high readability at small size, official art --ar 3:4`,
  },
  {
    id: "anime-storyboard",
    title: "日系分镜脚本",
    category: "二次元",
    tags: ["分镜", "动画", "脚本"],
    type: "generate",
    date: "2026-07-21",
    cover: covers[9],
    emoji: "🎞️",
    summary: "按镜头表输出分镜描述与台词。",
    prompt: `把剧情「{{剧情}}」写成 8-12 个日系动画分镜。
每镜：镜号、景别、镜头运动、画面描述、台词/SE、时长建议。
风格参考：{{风格}}。结尾给一张情绪曲线。`,
  },
  {
    id: "edit-style-transfer",
    title: "画风迁移",
    category: "图像编辑",
    tags: ["风格迁移", "编辑", "插画"],
    type: "edit",
    date: "2026-07-20",
    cover: covers[0],
    emoji: "🎭",
    summary: "保留构图与主体，迁移到指定画风。",
    prompt: `Apply style transfer to the uploaded image: keep composition, pose, and identity. Restyle as [STYLE] (e.g. ghibli / ukiyo-e / watercolor). Preserve main subjects, no new objects, cohesive lighting and palette.`,
  },
  {
    id: "design-icon-set",
    title: "统一图标套件",
    category: "设计",
    tags: ["图标", "UI", "套件"],
    type: "generate",
    date: "2026-07-17",
    cover: covers[2],
    emoji: "⬡",
    summary: "同一套描边与圆角的业务图标清单。",
    prompt: `为功能模块 {{模块列表}} 设计统一线性图标规范：2px 描边、圆角、24px 网格、视觉重心一致。输出每个图标的隐喻说明 + SVG 路径思路，避免过于具象。`,
  },
  {
    id: "write-resume-bullet",
    title: "简历项目量化",
    category: "效率办公",
    tags: ["简历", "求职", "量化"],
    type: "edit",
    date: "2026-07-23",
    cover: covers[1],
    emoji: "🧾",
    summary: "把流水账经历改成可量化的简历 bullet。",
    prompt: `将下列经历改成简历 bullet（中英文各一版）：
{{经历}}

要求：动作动词开头；尽量量化结果；每条一行；去掉虚词；按影响力排序。`,
  },
  {
    id: "write-debate-sides",
    title: "正反方辩论提纲",
    category: "写作与对话",
    tags: ["辩论", "论证", "结构"],
    type: "generate",
    date: "2026-07-16",
    cover: covers[3],
    emoji: "⚖️",
    summary: "同一议题的双方论点、反驳与总结。",
    prompt: `议题：{{议题}}
请输出：正方 5 论点 + 反方 5 论点 + 互相反驳 + 各自 1 分钟总结陈词。要求论据具体，避免人身攻击。`,
  },
  {
    id: "code-changelog",
    title: "Changelog 撰写",
    category: "编程",
    tags: ["发布", "文档", "版本"],
    type: "generate",
    date: "2026-07-15",
    cover: covers[4],
    emoji: "📦",
    summary: "按 Keep a Changelog 风格整理版本说明。",
    prompt: `根据提交/PR 列表写 Changelog（版本 {{version}}）：
{{列表}}

分类：Added / Changed / Fixed / Removed / Security
面向用户可读，技术细节可折叠为「开发者注」。`,
  },
];

for (const item of more) {
  if (!existing.has(item.id)) {
    extras.push(item);
    existing.add(item.id);
  }
}

const before = j.prompts.length;
j.prompts = j.prompts.concat(extras);
j.updatedAt = new Date().toISOString().slice(0, 10);
j.version = (j.version || 1) + 1;

const ann = j.announcements || [];
if (ann[0]) {
  ann[0] = {
    title: `词库已更新 · 共 ${j.prompts.length} 条`,
    body: "已并入樱词示例与实用模板，支持搜索「月下」「盲盒」「公众号」等关键词。",
  };
}

fs.writeFileSync(path.join(root, "prompts.json"), JSON.stringify(j, null, 2), "utf8");

const dataJs = `/**
 * Spark Prompts — 内嵌回退数据（file:// 或 prompts.json 失败时使用）
 * 权威源：根目录 prompts.json
 */
window.PROMPT_DATA = ${JSON.stringify(j.prompts, null, 2)};

window.ANNOUNCEMENTS = ${JSON.stringify(j.announcements, null, 2)};

window.CATEGORIES = ${JSON.stringify(j.categories, null, 2)};
`;
fs.writeFileSync(path.join(root, "js", "data.js"), dataJs, "utf8");

console.log(`before=${before} added=${extras.length} total=${j.prompts.length}`);
