/**
 * Spark Prompts — 提示词数据
 * 可直接在此文件增删改条目；也可后续改为 fetch('./prompts.json')
 */
window.PROMPT_DATA = [
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
    prompt: `Cinematic portrait of a young person looking slightly off-camera, dramatic Rembrandt lighting from the left, deep teal and amber color grade, shallow depth of field, 85mm lens look, film grain, anamorphic subtle lens flare, high detail skin texture, moody atmosphere, masterpiece, 8k --ar 3:4 --stylize 250`
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
    prompt: `Minimalist product photography of [PRODUCT], floating on pure soft gray seamless background, softbox studio lighting, subtle soft shadow, crisp reflections, commercial catalog style, ultra sharp, high-end brand aesthetic, 4k, clean composition --ar 1:1`
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
    prompt: `Isometric futuristic city block at dusk, neon signs in cyan and magenta, flying vehicles, dense architecture with greenery rooftops, volumetric fog, highly detailed, Unreal Engine style render, clean isometric perspective, vibrant but balanced colors --ar 16:9`
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
    prompt: `Watercolor illustration of a steaming bowl of ramen, loose brush strokes, soft paper texture, warm pastel palette, food magazine illustration style, white paper background with light ink splatters, charming and appetizing, high quality watercolor --ar 4:5`
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
    prompt: `Edit the uploaded image: keep the main subject unchanged (identity, pose, clothing details). Replace the background with [NEW SCENE]. Match lighting direction, color temperature, and contact shadows so the subject blends naturally. Photorealistic, seamless composite, no artifacts around edges.`
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
    prompt: `Enhance the uploaded image: increase sharpness and fine texture detail, reduce noise while preserving natural grain, recover slightly overexposed highlights, improve local contrast moderately. Do not change composition, colors, or add new objects. Photorealistic refinement only.`
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

输出风格：清晰分段；列表优于长段落；避免空洞套话。`
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
- 不要硬广腔，不要虚假承诺`
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

风格：务实、可验证、少鸡汤。`
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
\`\`\``
  },
  {
    id: "code-explain",
    title: "代码讲解与注释",
    category: "编程",
    tags: ["讲解", "注释", "学习"],
    type: "generate",
    date: "2026-06-28",
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
\`\`\``
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
8. 一版改进后的文案与组件建议`
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

要求：客观、可执行；不确定处标注「待确认」。`
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
- 避免 vanity metrics`
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
    prompt: `Minimal logo concept for a brand named "[BRAND]", industry: [INDUSTRY]. Flat vector, geometric, memorable silhouette, 2-color max, works in monochrome, centered on pure white background, no mockups, no text distortion, professional brand identity style, high clarity --ar 1:1`
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
{{文本}}`
  }
];

window.ANNOUNCEMENTS = [
  {
    title: "欢迎使用 Spark Prompts",
    body: "纯静态提示词画廊，可一键复制，支持搜索与分类筛选，适合部署到 GitHub Pages。"
  },
  {
    title: "如何扩展词库？",
    body: "编辑 js/data.js 中的 PROMPT_DATA 数组即可新增提示词，刷新页面立即生效。"
  },
  {
    title: "自定义域名",
    body: "在仓库根目录添加 CNAME 文件写入你的域名，并在 DNS 配置到 GitHub Pages。"
  }
];

window.CATEGORIES = [
  "全部",
  "图像生成",
  "图像编辑",
  "写作与对话",
  "编程",
  "设计",
  "效率办公"
];
