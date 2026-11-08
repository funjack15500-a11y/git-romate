/**
 * NSFW / 成人向判定（公共模块）
 *
 * 只收窄到"露骨词 + 明确内衣/裸体/性暗示"这一层，避免把 brand / glass / smooth
 * 这类英文子串、以及"指甲盖""胸口""床"等日常词误判成 NSFW。
 * 判定结果分三级：
 *   hard  —— 明确成人向，必须剔除
 *   soft  —— 擦边（内衣、贴身吊带、写真味重），需人工复看
 *   null  —— 正常内容
 */

const HARD_TITLE =
  /nsfw|nude|naked|porn|hentai|lewd|\bxxx\b|r-?18|\b18\+\b|色情|成人向|全裸|裸体|露点|情色|情趣内衣|性暗示|性交|做爱|自慰|口交/i;

const HARD_BODY =
  /\bnsfw\b|\bnude\b|\bnaked\b|\bporn\b|\bhentai\b|\blewd\b|\buncensored\b|\bnipples?\b|\bareola\b|\bpussy\b|\bpenis\b|\bvagina\b|\bgenital\b|\bahegao\b|\bcameltoe\b|\bunderboob\b|\btopless\b|\bbottomless\b|\bbimbofication\b|\blingerie\b|\bbustier\b|\bpanties\b|\bg-string\b|全裸|裸体|裸身|脱光|裸露|色情|情色|性交|做爱|口交|自慰|射精|阴茎|阴道|淫纹|情趣内衣|半透明内衣|蕾丝内衣|丁字裤|巨乳|豪乳|丰乳肥臀|敏感部位/i;

// 擦边：内衣/贴身/写真味，但不足以直接判定为成人向
const SOFT_TITLE = /写真|私房|内衣|肚兜|抹胸|吊带|湿身|出浴|浴室|更衣|睡衣|比基尼|泳装|紧身胸衣/i;
const SOFT_BODY =
  /丝绸肚兜|抹胸|紧身胸衣|胸衣|吊带上衣|比基尼|泳装拍摄|私房照|闺房|蕾丝|半透|透视装|强调曲线|突出曲线|身材曲线|湿润皮肤|沐浴|淋浴|更衣室|脱衣/i;

// 人工确认过的误报，永不命中
const KEEP_IDS = new Set([
  "write-story-beats", // 「高潮」= 剧情高潮
]);

// 人工拉黑：正文不算露骨，但整体是内衣秀/肚兜写真，重新导入时也不能复活
const BLOCKED_TITLES = ["维多利亚的秘密", "越南奥黛", "肚兜"];

export function classifyPrompt(p) {
  const id = String(p.id || "");
  if (KEEP_IDS.has(id)) return null;

  const rawTitle = String(p.title || "").trim();
  const blocked = BLOCKED_TITLES.find((k) => rawTitle.includes(k));
  if (blocked) return { level: "hard", why: `人工拉黑:${blocked}` };

  const tags = (p.tags || []).map((t) => String(t));
  const tagHit = tags.find((t) => /^nsfw$/i.test(t.trim()) || /成人|色情|r-?18|18\+/i.test(t));
  if (tagHit) return { level: "hard", why: `tag:${tagHit}` };

  const meta = `${p.category || ""} ${p.subCategory || ""} ${p.sub_category || ""} ${p.mode || ""}`;
  if (/\bnsfw\b|成人|色情|r-?18/i.test(meta)) return { level: "hard", why: "分类/模式标注" };

  const title = String(p.title || "");
  const t = title.match(HARD_TITLE);
  if (t) return { level: "hard", why: `标题:${t[0]}` };

  const body = `${p.prompt || ""}\n${p.summary || ""}`;
  const b = body.match(HARD_BODY);
  if (b) return { level: "hard", why: `正文:${b[0]}` };

  const st = title.match(SOFT_TITLE);
  if (st) return { level: "soft", why: `标题:${st[0]}` };
  const sb = body.match(SOFT_BODY);
  if (sb && /女|人物|人像|角色|少女|girl|woman|portrait|model|cos/i.test(title + body)) {
    return { level: "soft", why: `正文:${sb[0]}` };
  }
  return null;
}

/** 供导入脚本使用：命中 hard 就跳过；soft 只记录，不阻断 */
export function shouldSkipPrompt(p) {
  return classifyPrompt(p)?.level === "hard";
}
