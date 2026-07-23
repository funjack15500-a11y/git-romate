/**
 * Generate prompts.json + js/data.js from a single source of truth.
 * Run: node tools/build-data.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const CATEGORIES = [
  "全部",
  "图像生成",
  "图像编辑",
  "写作与对话",
  "编程",
  "设计",
  "效率办公",
  "二次元",
];

const ANNOUNCEMENTS = [
  {
    title: "欢迎使用 Spark Prompts",
    body: "词库支持 prompts.json 热更新；HTTP 下自动拉取，file:// 回退内嵌数据。",
  },
  {
    title: "快捷键",
    body: "按 / 或 Ctrl+K 聚焦搜索；Esc 关闭详情；卡片复制图标一键复制全文。",
  },
  {
    title: "分享与深链",
    body: "详情弹窗「复制链接」得到 #p=id 地址，打开即可直达该提示词。",
  },
  {
    title: "扩展词库",
    body: "优先编辑 prompts.json，再运行 node tools/build-data.mjs 同步 data.js 回退包。",
  },
];

/** @type {Array<Record<string, unknown>>} */
const PROMPTS = [
  {
    id: "img-cinematic-portrait",
    title: "电影感人像",
    category: "图像生成",
    tags: ["人像", "电影感", "光影"],
    type: "generate",
    date: "2026-07-18",
    cover: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #e94560 100%)",
    emoji: "🎬",
    summary: "戏剧性光影与浅景深，适合角色海报与概念人像。",
    prompt: `Cinematic portrait of a young person looking slightly off-camera, dramatic Rembrandt lighting from the left, deep teal and amber color grade, shallow depth of field, 85mm lens look, film grain, anamorphic subtle lens flare, high detail skin texture, moody atmosphere, masterpiece, 8k --ar 3:4 --stylize 250`,
  },
  {
    id: "img-product-minimal",
    title: "极简产品摄影",
    category: "图像生成",
    tags: ["产品", "电商", "极简"],
    type: "generate",
    date: "2026-07-15",
    cover: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #94a3b8 100%)",
    emoji: "📦",
    summary: "干净背景与柔光，适合电商主图与品牌展示。",
    prompt: `Minimalist product photography of [PRODUCT], floating on pure soft gray seamless background, softbox studio lighting, subtle soft shadow, crisp reflections, commercial catalog style, ultra sharp, high-end brand aesthetic, 4k, clean composition --ar 1:1`,
  },
  {
    id: "img-iso-city",
    title: "等距未来城市",
    category: "图像生成",
    tags: ["场景", "科幻", "等距"],
    type: "generate",
    date: "2026-07-10",
    cover: "linear-gradient(135deg, #0f172a 0%, #312e81 50%, #06b6d4 100%)",
    emoji: "🏙️",
    summary: "俯视等距科幻城市场景，细节丰富可作壁纸。",
    prompt: `Isometric futuristic city block at dusk, neon signs in cyan and magenta, flying vehicles, dense architecture with greenery rooftops, volumetric fog, highly detailed, Unreal Engine style render, clean isometric perspective, vibrant but balanced colors --ar 16:9`,
  },
  {
    id: "img-watercolor-food",
    title: "水彩美食插画",
    category: "图像生成",
    tags: ["插画", "美食", "水彩"],
    type: "generate",
    date: "2026-07-08",
    cover: "linear-gradient(135deg, #fef3c7 0%, #fdba74 40%, #f472b6 100%)",
    emoji: "🍜",
    summary: "手绘水彩风格菜品，适合菜单与内容配图。",
    prompt: `Watercolor illustration of a steaming bowl of ramen, loose brush strokes, soft paper texture, warm pastel palette, food magazine illustration style, white paper background with light ink splatters, charming and appetizing, high quality watercolor --ar 4:5`,
  },
  {
    id: "img-logo-concept",
    title: "Logo 概念草图",
    category: "图像生成",
    tags: ["Logo", "品牌", "矢量感"],
    type: "generate",
    date: "2026-07-19",
    cover: "linear-gradient(135deg, #111827 0%, #374151 40%, #f97316 100%)",
    emoji: "✒️",
    summary: "简洁可缩放的标志概念，适合早期品牌探索。",
    prompt: `Minimal logo concept for a brand named "[BRAND]", industry: [INDUSTRY]. Flat vector, geometric, memorable silhouette, 2-color max, works in monochrome, centered on pure white background, no mockups, no text distortion, professional brand identity style, high clarity --ar 1:1`,
  },
  {
    id: "img-architecture-night",
    title: "建筑夜景长曝",
    category: "图像生成",
    tags: ["建筑", "夜景", "摄影"],
    type: "generate",
    date: "2026-07-21",
    cover: "linear-gradient(135deg, #0c1222 0%, #1e3a5f 50%, #f59e0b 100%)",
    emoji: "🌃",
    summary: "城市建筑光轨与玻璃反光，适合氛围海报。",
    prompt: `Night architecture photography of a modern glass skyscraper, long exposure light trails from traffic, deep blue hour sky, reflective wet streets, dramatic perspective looking up, ultra sharp facade details, cinematic color grade, 24mm wide angle --ar 9:16`,
  },
  {
    id: "img-flat-illustration",
    title: "扁平插画角色",
    category: "图像生成",
    tags: ["插画", "扁平", "角色"],
    type: "generate",
    date: "2026-07-17",
    cover: "linear-gradient(135deg, #312e81 0%, #818cf8 50%, #fbcfe8 100%)",
    emoji: "🖌️",
    summary: "现代扁平矢量角色，适合 App 与落地页。",
    prompt: `Flat vector character illustration of [CHARACTER], bold outlines, limited pastel color palette, soft gradients, friendly expression, clean shapes, app landing page style, centered composition, high quality digital illustration, no photorealism --ar 1:1`,
  },
  {
    id: "img-nature-macro",
    title: "微距自然纹理",
    category: "图像生成",
    tags: ["自然", "微距", "纹理"],
    type: "generate",
    date: "2026-07-06",
    cover: "linear-gradient(135deg, #14532d 0%, #4ade80 50%, #ecfccb 100%)",
    emoji: "🍃",
    summary: "叶脉与水珠细节，适合壁纸与材质参考。",
    prompt: `Extreme macro photograph of a fresh green leaf with morning dew drops, crystal clear water spheres, sharp leaf veins, soft bokeh background, natural lighting, ultra detailed texture, National Geographic style --ar 3:2`,
  },
  {
    id: "img-3d-icon",
    title: "3D 拟物图标",
    category: "图像生成",
    tags: ["3D", "图标", "UI"],
    type: "generate",
    date: "2026-07-22",
    cover: "linear-gradient(135deg, #1e1b4b 0%, #6366f1 45%, #a5b4fc 100%)",
    emoji: "🧊",
    summary: "柔和 3D 图标，适合桌面与营销素材。",
    prompt: `Soft 3D claymorphism icon of [OBJECT], pastel colors, studio soft lighting, subtle shadow, rounded forms, centered on clean light background, high quality render, app icon style, no text --ar 1:1`,
  },
  {
    id: "edit-bg-remove-style",
    title: "换背景并统一风格",
    category: "图像编辑",
    tags: ["编辑", "换背景", "风格统一"],
    type: "edit",
    date: "2026-07-12",
    cover: "linear-gradient(135deg, #064e3b 0%, #10b981 50%, #a7f3d0 100%)",
    emoji: "✨",
    summary: "保留主体，替换场景并匹配光影色调。",
    prompt: `Edit the uploaded image: keep the main subject unchanged (identity, pose, clothing details). Replace the background with [NEW SCENE]. Match lighting direction, color temperature, and contact shadows so the subject blends naturally. Photorealistic, seamless composite, no artifacts around edges.`,
  },
  {
    id: "edit-upscale-detail",
    title: "细节增强与清晰化",
    category: "图像编辑",
    tags: ["增强", "清晰度", "修复"],
    type: "edit",
    date: "2026-07-05",
    cover: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #bfdbfe 100%)",
    emoji: "🔍",
    summary: "提升清晰度与纹理，避免过度锐化。",
    prompt: `Enhance the uploaded image: increase sharpness and fine texture detail, reduce noise while preserving natural grain, recover slightly overexposed highlights, improve local contrast moderately. Do not change composition, colors, or add new objects. Photorealistic refinement only.`,
  },
  {
    id: "edit-color-grade",
    title: "电影调色",
    category: "图像编辑",
    tags: ["调色", "电影", "LUT"],
    type: "edit",
    date: "2026-07-14",
    cover: "linear-gradient(135deg, #431407 0%, #ea580c 45%, #0ea5e9 100%)",
    emoji: "🎚️",
    summary: "统一色调与对比，做出片感而不破坏主体。",
    prompt: `Color grade the uploaded image to a cinematic teal-and-orange look: lift shadows slightly cool, warm midtones and skin, protect natural skin tones, increase contrast moderately, add subtle film grain. Do not crop, recompose, or change subjects. Keep realism.`,
  },
  {
    id: "edit-face-consistency",
    title: "角色一致性改图",
    category: "图像编辑",
    tags: ["角色", "一致性", "编辑"],
    type: "edit",
    date: "2026-07-20",
    cover: "linear-gradient(135deg, #4a044e 0%, #c026d3 50%, #f5d0fe 100%)",
    emoji: "🪞",
    summary: "改服装/场景时锁定脸部身份与五官。",
    prompt: `Edit the uploaded character image: keep face identity, facial proportions, age, and distinctive features identical. Change only: [WHAT TO CHANGE]. Preserve lighting continuity on the face. No face morphing, no age change, no new scars or makeup unless requested.`,
  },
  {
    id: "edit-remove-object",
    title: "移除杂物补全",
    category: "图像编辑",
    tags: ["修复", "去杂物", "补全"],
    type: "edit",
    date: "2026-07-09",
    cover: "linear-gradient(135deg, #1f2937 0%, #6b7280 50%, #e5e7eb 100%)",
    emoji: "🧹",
    summary: "干净移除指定物体并自然补全背景。",
    prompt: `Remove [OBJECT] from the uploaded image and inpaint the area seamlessly. Match surrounding texture, perspective, lighting, and noise level. No residual edges, no cloning patterns, photorealistic completion only.`,
  },
  {
    id: "write-system-assistant",
    title: "通用助手 System Prompt",
    category: "写作与对话",
    tags: ["System", "助手", "通用"],
    type: "generate",
    date: "2026-07-20",
    cover: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c4b5fd 100%)",
    emoji: "🤖",
    summary: "结构化、可靠的默认系统提示词模板。",
    prompt: `你是一个专业、诚实、简洁的 AI 助手。

原则：
1. 优先给出可执行答案，再补充必要解释。
2. 不确定时明确说明假设与边界，不编造事实。
3. 对复杂任务先拆步骤，再逐步完成。
4. 代码需完整可运行，并注明关键依赖。
5. 用用户使用的语言回复（除非对方要求其他语言）。

输出风格：清晰分段；列表优于长段落；避免空洞套话。`,
  },
  {
    id: "write-xiaohongshu",
    title: "小红书种草文案",
    category: "写作与对话",
    tags: ["小红书", "种草", "文案"],
    type: "generate",
    date: "2026-07-16",
    cover: "linear-gradient(135deg, #881337 0%, #f43f5e 50%, #fda4af 100%)",
    emoji: "📕",
    summary: "口语化、有钩子、带话题标签的种草结构。",
    prompt: `请根据以下信息写一篇小红书种草笔记：
产品/主题：{{主题}}
目标人群：{{人群}}
核心卖点：{{卖点1}}、{{卖点2}}、{{卖点3}}

要求：
- 标题 1 个，含情绪词或数字，不超过 20 字
- 正文 300–500 字，口语化，有场景感
- 结构：痛点开场 → 体验过程 → 真实感受 → 适合谁
- 结尾给 3 个行动建议
- 附 8–12 个相关话题标签
- 不要硬广腔，不要虚假承诺`,
  },
  {
    id: "write-blog-outline",
    title: "技术博客大纲",
    category: "写作与对话",
    tags: ["博客", "技术", "大纲"],
    type: "generate",
    date: "2026-07-01",
    cover: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #7dd3fc 100%)",
    emoji: "📝",
    summary: "从主题生成可直接开写的深度文章大纲。",
    prompt: `为主题「{{主题}}」生成一篇面向中高级开发者的技术博客大纲。

请输出：
1. 标题备选（3 个）
2. 一句话摘要
3. 目标读者与前置知识
4. 目录（H2/H3）
5. 每一节的要点 bullet（每节约 3–5 条）
6. 可引用的示例/代码片段建议
7. 常见坑与最佳实践
8. 结语 CTA

风格：务实、可验证、少鸡汤。`,
  },
  {
    id: "write-translate-polish",
    title: "中英互译润色",
    category: "写作与对话",
    tags: ["翻译", "润色", "双语"],
    type: "edit",
    date: "2026-07-07",
    cover: "linear-gradient(135deg, #1e1b4b 0%, #6366f1 50%, #c7d2fe 100%)",
    emoji: "🌐",
    summary: "保留原意，输出自然地道的目标语言版本。",
    prompt: `请将下列文本翻译并润色为{{目标语言}}。

要求：
1. 先给「忠实译文」
2. 再给「自然润色版」（更适合正式对外沟通）
3. 列出 3 处关键术语处理说明
4. 保留专有名词原文（必要时括号注释）
5. 不要添加原文没有的营销夸张

原文：
{{文本}}`,
  },
  {
    id: "write-email-pro",
    title: "商务邮件撰写",
    category: "写作与对话",
    tags: ["邮件", "商务", "沟通"],
    type: "generate",
    date: "2026-07-13",
    cover: "linear-gradient(135deg, #134e4a 0%, #14b8a6 50%, #99f6e4 100%)",
    emoji: "✉️",
    summary: "礼貌清晰、有行动号召的中英文邮件。",
    prompt: `请写一封商务邮件：
场景：{{场景}}
收件人关系：{{关系}}
目标：{{目标}}
语气：{{正式/友好}}
语言：{{中文/英文}}

输出：
- 主题行 2 个备选
- 正文（开头寒暄 → 目的 → 关键信息 → 明确 CTA → 结尾）
- 可选：更短的跟进版（3–5 句）`,
  },
  {
    id: "write-story-beats",
    title: "短故事节拍表",
    category: "写作与对话",
    tags: ["故事", "结构", "创作"],
    type: "generate",
    date: "2026-07-04",
    cover: "linear-gradient(135deg, #3b0764 0%, #db2777 50%, #fce7f3 100%)",
    emoji: "📖",
    summary: "三幕式节拍，适合短视频脚本与短篇。",
    prompt: `为主题「{{主题}}」写一个约 800–1500 字短故事的节拍表。

包含：
1. Logline
2. 主角目标与内在冲突
3. 三幕式节拍（每拍 1–2 句场景）
4. 转折点与高潮
5. 主题句
6. 可选开放/闭环结局各一

风格：{{风格}}；避免套路堆砌。`,
  },
  {
    id: "write-rewrite-concise",
    title: "冗长文案精简",
    category: "写作与对话",
    tags: ["精简", "编辑", "润色"],
    type: "edit",
    date: "2026-07-11",
    cover: "linear-gradient(135deg, #422006 0%, #f59e0b 50%, #fef3c7 100%)",
    emoji: "✂️",
    summary: "砍掉水分，保留信息密度与语气。",
    prompt: `请精简以下文案，目标长度约原文字数的 {{比例}}%。

要求：
- 保留关键事实与承诺
- 去掉套话、重复与模糊修饰
- 保持原语气（正式/口语）
- 输出：精简版 + 删除了什么类型的冗余（3 点）

原文：
{{文本}}`,
  },
  {
    id: "code-review",
    title: "代码审查清单",
    category: "编程",
    tags: ["Code Review", "质量", "清单"],
    type: "generate",
    date: "2026-07-14",
    cover: "linear-gradient(135deg, #14532d 0%, #22c55e 50%, #bbf7d0 100%)",
    emoji: "🧑‍💻",
    summary: "系统性审查 PR，覆盖正确性与可维护性。",
    prompt: `你是资深工程师，请审查以下代码/PR 描述。

从这些维度给出反馈（按严重程度排序）：
- 正确性与边界条件
- 安全与敏感数据处理
- 性能与复杂度
- API/命名一致性
- 可读性与可测试性
- 缺失的测试用例

格式：
1. 总评（一句话）
2. 必须修改（Blocking）
3. 建议改进（Non-blocking）
4. 可选优化
5. 建议的测试点

代码：
\`\`\`
{{代码}}
\`\`\``,
  },
  {
    id: "code-explain",
    title: "代码讲解与注释",
    category: "编程",
    tags: ["讲解", "注释", "学习"],
    type: "generate",
    date: "2026-07-02",
    cover: "linear-gradient(135deg, #422006 0%, #f59e0b 50%, #fde68a 100%)",
    emoji: "📖",
    summary: "把复杂代码讲清楚，并生成教学向注释。",
    prompt: `请解释下面这段代码，面向有基础但未接触该库的开发者：

1. 这段代码在解决什么问题？
2. 关键执行流程（分步骤）
3. 关键函数/类型的职责
4. 关键容易误解的细节
5. 给出带中文注释的完整版本（注释解释“为什么”，不只是“做了什么”）
6. 若有更清晰的改写方案，给出简短对比

代码：
\`\`\`
{{代码}}
\`\`\``,
  },
  {
    id: "code-debug",
    title: "调试根因分析",
    category: "编程",
    tags: ["Debug", "根因", "排查"],
    type: "generate",
    date: "2026-07-18",
    cover: "linear-gradient(135deg, #7f1d1d 0%, #ef4444 50%, #fecaca 100%)",
    emoji: "🐛",
    summary: "从现象到假设验证，结构化排查问题。",
    prompt: `帮我排查问题：

现象：{{现象}}
期望：{{期望}}
环境：{{环境}}
最近改动：{{改动}}
日志/报错：
{{日志}}

请输出：
1. 最可能的 3 个根因（概率排序）
2. 每个根因的验证步骤（可执行命令/检查点）
3. 临时缓解与长期修复
4. 如何加观测避免复发`,
  },
  {
    id: "code-api-design",
    title: "REST API 设计",
    category: "编程",
    tags: ["API", "设计", "后端"],
    type: "generate",
    date: "2026-07-10",
    cover: "linear-gradient(135deg, #0f172a 0%, #2563eb 50%, #93c5fd 100%)",
    emoji: "🔌",
    summary: "资源建模、错误码与分页约定。",
    prompt: `为业务「{{业务}}」设计 REST API。

输出：
1. 资源列表与关系
2. 端点表（方法、路径、说明、鉴权）
3. 关键请求/响应 JSON 示例
4. 错误码约定
5. 分页/过滤/排序规范
6. 幂等与限流建议
7. OpenAPI 片段（可选）

原则：一致性、可演进、安全默认。`,
  },
  {
    id: "code-unit-tests",
    title: "单元测试生成",
    category: "编程",
    tags: ["测试", "Jest", "覆盖"],
    type: "generate",
    date: "2026-07-15",
    cover: "linear-gradient(135deg, #164e63 0%, #06b6d4 50%, #a5f3fc 100%)",
    emoji: "🧪",
    summary: "覆盖边界与异常路径的测试用例。",
    prompt: `为以下函数/模块生成单元测试（框架：{{框架}}）。

要求：
- 正常路径 + 边界 + 异常
- 命名清晰（should … when …）
- mock 外部依赖
- 给出可运行测试代码
- 列出仍未覆盖的风险

代码：
\`\`\`
{{代码}}
\`\`\``,
  },
  {
    id: "code-refactor-plan",
    title: "重构方案",
    category: "编程",
    tags: ["重构", "架构", "技术债"],
    type: "generate",
    date: "2026-07-08",
    cover: "linear-gradient(135deg, #312e81 0%, #8b5cf6 50%, #ddd6fe 100%)",
    emoji: "🧱",
    summary: "小步安全重构，可回滚、可验证。",
    prompt: `针对以下代码/模块给出重构方案：

问题：{{问题}}
约束：{{约束}}
代码概览：
{{概览}}

输出：
1. 现状问题（可维护性/性能/耦合）
2. 目标架构（简图文字版）
3. 分阶段步骤（每步可独立合并）
4. 测试与回滚策略
5. 不在本次做的事项`,
  },
  {
    id: "design-ui-critique",
    title: "UI 设计评审",
    category: "设计",
    tags: ["UI", "评审", "体验"],
    type: "generate",
    date: "2026-07-09",
    cover: "linear-gradient(135deg, #3b0764 0%, #a855f7 50%, #e9d5ff 100%)",
    emoji: "🎨",
    summary: "从层级、对比、无障碍与一致性做界面评审。",
    prompt: `请作为资深产品设计师评审以下界面描述/截图说明：

界面目标：{{目标}}
用户场景：{{场景}}
界面描述：{{描述}}

请输出：
1. 第一印象（5 秒测试）
2. 信息层级问题
3. 视觉与间距一致性
4. 交互可发现性
5. 无障碍（对比度、触控热区、文案）
6. 移动端/桌面适配风险
7. 优先级排序的改进建议（P0/P1/P2）
8. 一版改进后的文案与组件建议`,
  },
  {
    id: "design-design-system",
    title: "设计系统 Tokens",
    category: "设计",
    tags: ["Design System", "Token", "规范"],
    type: "generate",
    date: "2026-07-16",
    cover: "linear-gradient(135deg, #0f766e 0%, #2dd4bf 50%, #ccfbf1 100%)",
    emoji: "📐",
    summary: "颜色、字号、间距与组件层级约定。",
    prompt: `为产品「{{产品}}」起草轻量设计系统 tokens：

品牌关键词：{{关键词}}
平台：Web / 移动

输出：
1. 颜色（主色/中性/语义色，含 dark）
2. 字号与行高阶梯
3. 间距与圆角
4. 阴影与 elevation
5. 按钮/输入框状态表
6. 命名规范（CSS 变量示例）`,
  },
  {
    id: "design-user-flow",
    title: "用户流程图文案",
    category: "设计",
    tags: ["流程", "UX", "产品"],
    type: "generate",
    date: "2026-07-03",
    cover: "linear-gradient(135deg, #1e3a8a 0%, #60a5fa 50%, #dbeafe 100%)",
    emoji: "🗺️",
    summary: "从目标到完成态的关键路径与异常分支。",
    prompt: `梳理功能「{{功能}}」的用户流程：

主用户：{{用户}}
成功标准：{{标准}}

输出：
1. 主路径步骤（含页面/状态）
2. 关键异常与空状态
3. 文案草稿（标题/按钮/错误提示）
4. 埋点建议
5. 上线前验收清单`,
  },
  {
    id: "biz-meeting-summary",
    title: "会议纪要生成",
    category: "效率办公",
    tags: ["会议", "纪要", "行动项"],
    type: "generate",
    date: "2026-07-11",
    cover: "linear-gradient(135deg, #164e63 0%, #06b6d4 50%, #a5f3fc 100%)",
    emoji: "📋",
    summary: "从杂乱笔记提炼决议与可追踪行动项。",
    prompt: `根据以下会议笔记生成结构化纪要：

原始笔记：
{{笔记}}

输出格式：
# 会议纪要
- 时间 / 参与人 / 主题
## 结论
## 讨论要点（按议题分组）
## 行动项
| 事项 | 负责人 | 截止日期 | 状态 |
## 待决问题
## 下次会议建议

要求：客观、可执行；不确定处标注「待确认」。`,
  },
  {
    id: "biz-okr",
    title: "OKR 起草助手",
    category: "效率办公",
    tags: ["OKR", "目标", "管理"],
    type: "generate",
    date: "2026-06-20",
    cover: "linear-gradient(135deg, #713f12 0%, #eab308 50%, #fef08a 100%)",
    emoji: "🎯",
    summary: "把模糊目标写成可衡量的 O 与 KR。",
    prompt: `帮我把以下业务目标写成本季度 OKR：

背景：{{背景}}
模糊目标：{{目标}}
可用资源：{{资源}}

要求：
- 1 个 Objective（鼓舞人心但具体）
- 3–4 个 Key Results（可量化、有基线与目标值）
- 每个 KR 附：衡量方式、主要风险、每周检查问题
- 标明哪些是领先指标/滞后指标
- 避免 vanity metrics`,
  },
  {
    id: "biz-weekly-report",
    title: "周报结构化",
    category: "效率办公",
    tags: ["周报", "汇报", "进度"],
    type: "generate",
    date: "2026-07-19",
    cover: "linear-gradient(135deg, #1e293b 0%, #64748b 50%, #e2e8f0 100%)",
    emoji: "📅",
    summary: "本周进展、风险、下周计划一页说清。",
    prompt: `根据要点生成周报：

本周工作：{{要点}}
数据：{{数据}}
阻塞：{{阻塞}}

结构：
1. 本周亮点（3 条内）
2. 进展详情（项目分组）
3. 风险与求助
4. 下周计划（优先级）
5. 需要决策的事项

语气：专业克制，少形容词。`,
  },
  {
    id: "biz-job-jd",
    title: "招聘 JD 撰写",
    category: "效率办公",
    tags: ["招聘", "JD", "HR"],
    type: "generate",
    date: "2026-07-07",
    cover: "linear-gradient(135deg, #312e81 0%, #6366f1 50%, #c7d2fe 100%)",
    emoji: "💼",
    summary: "职责清晰、要求分层、有吸引力的职位描述。",
    prompt: `写一份职位描述：
岗位：{{岗位}}
团队：{{团队}}
级别：{{级别}}

包含：岗位使命、核心职责、必备/加分要求、协作方式、我们提供什么。
避免歧视性与空话；必备要求不超过 8 条。`,
  },
  {
    id: "biz-swot",
    title: "SWOT 分析",
    category: "效率办公",
    tags: ["战略", "分析", "决策"],
    type: "generate",
    date: "2026-07-05",
    cover: "linear-gradient(135deg, #0c4a6e 0%, #38bdf8 50%, #e0f2fe 100%)",
    emoji: "📊",
    summary: "围绕业务问题的 SWOT 与行动建议。",
    prompt: `对「{{对象}}」做 SWOT 分析。

背景：{{背景}}
目标：{{目标}}

输出四象限要点 + 交叉策略（SO/WO/ST/WT）+ 90 天行动清单（P0/P1）。`,
  },
  {
    id: "anime-character-sheet",
    title: "二次元角色设定",
    category: "二次元",
    tags: ["角色", "人设", "插画"],
    type: "generate",
    date: "2026-07-22",
    cover: "linear-gradient(135deg, #4a044e 0%, #ec4899 40%, #f9a8d4 100%)",
    emoji: "🌸",
    summary: "人设卡 + 文生图提示词，方便统一画风。",
    prompt: `Create an anime character design sheet for [NAME]:

Personality: [TRAITS]
Outfit: [OUTFIT]
Color palette: soft sakura pink, lavender, cream

Image prompt:
anime character reference sheet, front/side/back views, clean lineart, soft cel shading, large expressive eyes, detailed hair, pastel color palette, white background, high quality illustration, studio ghibli meets modern anime --ar 3:2`,
  },
  {
    id: "anime-sakura-scene",
    title: "樱花大道场景",
    category: "二次元",
    tags: ["场景", "樱花", "氛围"],
    type: "generate",
    date: "2026-07-21",
    cover: "linear-gradient(135deg, #831843 0%, #f472b6 45%, #fce7f3 100%)",
    emoji: "🌺",
    summary: "春日樱花与光粒子，适合壁纸与封面。",
    prompt: `Anime scenic illustration of a cherry blossom avenue in spring, petals drifting in soft wind, warm afternoon sunlight, volumetric light rays, schoolgirl silhouette walking away, highly detailed trees, dreamy atmosphere, soft pink and cyan accents, masterpiece anime background art --ar 16:9`,
  },
  {
    id: "anime-chibi-emoji",
    title: "Q 版表情包",
    category: "二次元",
    tags: ["Q版", "表情包", "贴纸"],
    type: "generate",
    date: "2026-07-18",
    cover: "linear-gradient(135deg, #5b21b6 0%, #a78bfa 50%, #fbcfe8 100%)",
    emoji: "😺",
    summary: "一套可爱 Q 版情绪贴纸提示词。",
    prompt: `Chibi anime sticker pack of [CHARACTER], 6 expressions (happy, sad, angry, shocked, love, sleepy), thick white outline, transparent background style, pastel colors, kawaii, clean vector-like shading, consistent proportions, sticker sheet layout --ar 1:1`,
  },
  {
    id: "anime-mecha-girl",
    title: "机甲少女立绘",
    category: "二次元",
    tags: ["机甲", "立绘", "科幻"],
    type: "generate",
    date: "2026-07-12",
    cover: "linear-gradient(135deg, #0f172a 0%, #6366f1 40%, #f472b6 100%)",
    emoji: "🤖",
    summary: "精细机甲部件与角色融合的半身立绘。",
    prompt: `Anime mecha girl half-body portrait, intricate mechanical armor with glowing cyan circuits, flowing hair, confident expression, rim light, detailed metal materials, cyberpunk sakura petals floating, dramatic composition, high detail, official art style --ar 3:4`,
  },
  {
    id: "anime-dialog-style",
    title: "二次元口吻对话",
    category: "二次元",
    tags: ["人设", "对话", "角色扮演"],
    type: "generate",
    date: "2026-07-17",
    cover: "linear-gradient(135deg, #701a75 0%, #e879f9 50%, #fae8ff 100%)",
    emoji: "💬",
    summary: "按人设口吻回复，适合角色卡与剧情。",
    prompt: `你将扮演角色「{{角色名}}」。
人设：{{人设}}
说话风格：{{风格}}（可带少量颜文字，但不过度）
禁忌：OOC、剧透未发生剧情、打破第四面墙（除非用户要求）

规则：
1. 用第一人称回应
2. 每次回复可含：对话 + 简短动作描写（*动作*）
3. 推进剧情但把选择权留给用户
4. 用户语言是什么就用什么回复

用户说：{{输入}}`,
  },
  {
    id: "anime-colorize-lineart",
    title: "线稿上色",
    category: "二次元",
    tags: ["上色", "线稿", "编辑"],
    type: "edit",
    date: "2026-07-13",
    cover: "linear-gradient(135deg, #9d174d 0%, #fb7185 50%, #fecdd3 100%)",
    emoji: "🎀",
    summary: "保留线稿结构，柔和赛璐璐上色。",
    prompt: `Colorize the uploaded anime lineart: preserve exact lines and proportions, soft cel shading, clean color fills, gentle blush, pastel-friendly palette unless specified, no redraw of face, no extra accessories, professional anime coloring.`,
  },
  {
    id: "img-food-photo",
    title: "餐厅级美食摄影",
    category: "图像生成",
    tags: ["美食", "摄影", "商业"],
    type: "generate",
    date: "2026-07-23",
    cover: "linear-gradient(135deg, #7c2d12 0%, #f97316 50%, #fed7aa 100%)",
    emoji: "🍽️",
    summary: "诱人光泽与餐桌氛围，适合菜单广告。",
    prompt: `Professional food photography of [DISH], 45-degree angle, natural window light, shallow depth of field, appetizing steam, rustic table props, editorial cookbook style, high detail textures, vibrant but realistic colors --ar 4:5`,
  },
  {
    id: "write-prompt-improve",
    title: "提示词优化器",
    category: "写作与对话",
    tags: ["Prompt", "优化", "元提示"],
    type: "edit",
    date: "2026-07-23",
    cover: "linear-gradient(135deg, #4c1d95 0%, #c026d3 50%, #f5d0fe 100%)",
    emoji: "🪄",
    summary: "把模糊需求改成结构清晰、可执行的提示词。",
    prompt: `你是提示词工程师。请优化用户给出的提示词。

原提示词：
{{原文}}

输出：
1. 问题诊断（含糊/缺约束/缺格式）
2. 优化后完整提示词
3. 可选变量占位符说明
4. 适用模型类型建议（对话/绘图/代码）`,
  },
  {
    id: "code-sql-optimize",
    title: "SQL 优化建议",
    category: "编程",
    tags: ["SQL", "性能", "数据库"],
    type: "generate",
    date: "2026-07-21",
    cover: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #bfdbfe 100%)",
    emoji: "🗄️",
    summary: "索引、执行计划与改写建议。",
    prompt: `优化以下 SQL（引擎：{{引擎}}）：

\`\`\`sql
{{SQL}}
\`\`\`

表规模：{{规模}}
请给出：执行计划关注点、索引建议、改写 SQL、分页/锁风险、回归验证方法。`,
  },
  {
    id: "design-landing-copy",
    title: "落地页文案结构",
    category: "设计",
    tags: ["落地页", "文案", "转化"],
    type: "generate",
    date: "2026-07-22",
    cover: "linear-gradient(135deg, #831843 0%, #f43f5e 50%, #fecdd3 100%)",
    emoji: "🚀",
    summary: "Hero 到 CTA 的完整转化文案骨架。",
    prompt: `为产品「{{产品}}」写落地页文案结构：
受众：{{受众}}
核心价值：{{价值}}

输出模块：导航 CTA、Hero（标题/副标/按钮）、社会证明、功能 3 点、对比、FAQ 5 条、底部 CTA。
每条文案给 2 个备选语气（理性/感性）。`,
  },
  {
    id: "biz-risk-register",
    title: "项目风险清单",
    category: "效率办公",
    tags: ["风险", "项目管理", "清单"],
    type: "generate",
    date: "2026-07-20",
    cover: "linear-gradient(135deg, #7f1d1d 0%, #f87171 50%, #fee2e2 100%)",
    emoji: "⚠️",
    summary: "概率×影响矩阵与应对 owner。",
    prompt: `为项目「{{项目}}」生成风险登记表。

背景：{{背景}}
截止：{{截止}}

表格列：风险、类别、概率、影响、分数、触发信号、缓解措施、应急计划、Owner、状态。
至少 8 条，按分数降序。`,
  },
];

const payload = {
  version: 1,
  updatedAt: "2026-07-23",
  categories: CATEGORIES,
  announcements: ANNOUNCEMENTS,
  prompts: PROMPTS,
};

const jsonPath = path.join(root, "prompts.json");
fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf8");

const dataJs = `/**
 * Spark Prompts — 内嵌回退数据（file:// 或 prompts.json 失败时使用）
 * 权威源：根目录 prompts.json
 * 同步命令：node tools/build-data.mjs
 */
window.PROMPT_DATA = ${JSON.stringify(PROMPTS, null, 2)};

window.ANNOUNCEMENTS = ${JSON.stringify(ANNOUNCEMENTS, null, 2)};

window.CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};
`;

fs.writeFileSync(path.join(root, "js", "data.js"), dataJs, "utf8");
console.log(`Wrote ${PROMPTS.length} prompts → prompts.json + js/data.js`);
