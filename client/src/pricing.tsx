import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";
import { T, LANG } from "./lang";
import { Dismissible } from "./ui";

/* Display helper for legacy combined strings ("套餐 Packages", saved
   selection labels, source notes): shows only the current language's half.
   Stored values and prices never change. */
function L(combined: string): string {
  let last = -1;
  for (let i = 0; i < combined.length; i++) { const c = combined.charCodeAt(i); if (c >= 0x4e00 && c <= 0x9fff) last = i; }
  if (last < 0) return combined;
  let end = last + 1;
  while (end < combined.length && "\uFF09\u3011\u300B%".includes(combined[end] ?? "")) end++;
  const zh = combined.slice(0, end).trim();
  const en = combined.slice(end).replace(/^[\u3001,\uFF0C\u00B7\s]+/, "").trim();
  if (!en || !/[A-Za-z]/.test(en)) return combined;
  return LANG === "zh" ? zh : en;
}

const FIELDS = actionFields<typeof Actions>();

const TEAL = "#1d6762";
const GREEN = "#2e7a4f";
const RED = "#a63d32";
const AMBER = "#9a6b10";
const PURPLE = "#6b4fa1";

/* The decided price list (2026-11-25 finance decision): the SOP playbook +
   the 0821 final price table are the single price list. Every row below is
   one row of the price↔service mapping: the service, where it lives on this
   site, its status, the decided price, and which source file holds what. */

type PriceStatus = "priced" | "free" | "noprice" | "toset" | "referral" | "notsold";

const STATUS_META: Record<PriceStatus, { zh: string; en: string; color: string; bg: string }> = {
  priced: { zh: "已定价", en: "Priced", color: GREEN, bg: "#e5f2e9" },
  free: { zh: "免费", en: "Free", color: TEAL, bg: "#e3efec" },
  noprice: { zh: "暂无价格", en: "No price yet", color: RED, bg: "#fbeae8" },
  toset: { zh: "待定价", en: "Price to set", color: AMBER, bg: "#fbf3d9" },
  referral: { zh: "仅转介", en: "Referral only", color: PURPLE, bg: "#efeaf7" },
  notsold: { zh: "不出售", en: "Not sold", color: "#535b58", bg: "#eeeae0" },
};

type PriceRow = {
  key: string;
  zh: string;
  en: string;
  page: string;
  status: PriceStatus;
  price: string;
  amount?: number; // numeric value used for the picker total (first/starting price)
  from?: boolean; // true when the decided price is a range or has several parts
  selectable?: boolean;
  doc: string;
};

type PriceSection = { zh: string; en: string; rows: PriceRow[] };

export const PRICE_PACKAGES: PriceRow[] = [
  { key: "pkg-trial", zh: "免费体验包", en: "Free trial pack", page: "套餐 Packages", status: "priced", price: "免费 ¥0", amount: 0, selectable: true, doc: "0820 免费层；0821 套餐表；0822 免费筛查。Free layer in the playbook; final table; Fuwai free screens." },
  { key: "pkg-vitality", zh: "活力年卡", en: "Vitality year card", page: "套餐 Packages", status: "priced", price: "¥5,980 / 年", amount: 5980, selectable: true, doc: "只在 0821 定稿价目表里有。Only in the 0821 final price table." },
  { key: "pkg-experts", zh: "90天六专家计划", en: "90-day six-expert plan", page: "套餐 Packages", status: "priced", price: "¥4,980", amount: 4980, selectable: true, doc: "0820 与 0821 一致。The playbook and the final table agree." },
  { key: "pkg-weight", zh: "体重管理专项", en: "Weight-management plan", page: "套餐 Packages", status: "priced", price: "¥1,280 / 30天", amount: 1280, selectable: true, doc: "只在 0821 定稿价目表里有。Only in the 0821 final price table." },
  { key: "pkg-home-std", zh: "居家年卡（标准）", en: "Home year card (standard)", page: "套餐 Packages", status: "priced", price: "¥9,800 / 年", amount: 9800, selectable: true, doc: "0820 与 0821 均为 9,800。Both agree on 9,800." },
  { key: "pkg-home-full", zh: "居家年卡（全包 · 80岁以上独居）", en: "Home year card (all-inclusive, 80+ living alone)", page: "套餐 Packages", status: "priced", price: "¥16,800 / 年", amount: 16800, selectable: true, doc: "来自 0822 阜外价目表，与标准卡是两张不同的卡，都保留。From the Fuwai list — kept as a second, fuller card." },
  { key: "pkg-monthly", zh: "基础月卡", en: "Basic monthly card", page: "套餐 Packages", status: "priced", price: "¥680 / 月", amount: 680, selectable: true, doc: "决定用 680（0820）；0822 原为 580，已按决定统一。Decided: 680 — the Fuwai list's 580 is aligned up." },
  { key: "pkg-chronic", zh: "慢病管理", en: "Chronic-disease manager", page: "套餐 Packages", status: "priced", price: "¥398 / 月", amount: 398, selectable: true, doc: "0820 与 0821 一致。The playbook and the final table agree." },
  { key: "pkg-threehigh", zh: "三高季度计划", en: "Three-highs quarterly plan", page: "套餐 Packages", status: "priced", price: "¥980 / 季", amount: 980, selectable: true, doc: "只在 0821（慢病护理）里有。Only in the 0821 final table." },
  { key: "pkg-manager", zh: "健康管理师", en: "Health manager", page: "套餐 Packages", status: "priced", price: "¥298 / 月", amount: 298, selectable: true, doc: "只在 0821（个案管理）里有。Only in the 0821 final table." },
];

export const PRICE_SECTIONS: PriceSection[] = [
  {
    zh: "今日照护", en: "Today — daily care",
    rows: [
      { key: "svc-morning", zh: "晨间护理与更衣", en: "Morning care & dressing", page: "今日 → 护工视图", status: "priced", price: "¥50 / 小时 · 洗澡 ¥80 / 次", amount: 50, from: true, selectable: true, doc: "0820 护工 80/次；0821 居家护理表。Care-aide price in the playbook; home-care sheet in the final table." },
      { key: "svc-meals", zh: "送餐", en: "Meal delivery", page: "今日 → 膳食", status: "priced", price: "¥20 / 餐", amount: 20, selectable: true, doc: "0821 居家护理表。Final table, home-care sheet." },
      { key: "svc-cooking", zh: "在家做饭", en: "Cooking at home", page: "今日 → 膳食", status: "noprice", price: "—", doc: "哪个文件都没有定价 — 家里人做。No file prices home cooking; the family does it." },
      { key: "svc-protein", zh: "蛋白饮与菜单", en: "Protein drink & menu", page: "今日 → 膳食；档案 → 营养", status: "priced", price: "¥200（7天菜单）", amount: 200, selectable: true, doc: "0821 营养价 200；0822 有 88 / 168 两档，未采用。Final table 200; the Fuwai list's 88 / 168 were not adopted." },
      { key: "svc-seated", zh: "坐位运动 A / B 组", en: "Seated exercise A / B", page: "今日 → 运动", status: "priced", price: "¥100 / 次 · 小组课 ¥20 / 次", amount: 100, from: true, selectable: true, doc: "0821 运动价；0822 也有（120 / 30分钟等），未采用。Final table; Fuwai prices differ and were not adopted." },
      { key: "svc-standing", zh: "站立练习", en: "Standing practice", page: "今日 → 运动；档案 → 运动", status: "priced", price: "上门 ¥200 · 指导 ¥100", amount: 200, from: true, selectable: true, doc: "0821 康复上门 200；0822 防跌倒卡 1,080/月未采用。Final table home visit; the Fuwai fall-prevention card was not adopted." },
      { key: "svc-brain", zh: "每日动脑游戏", en: "Daily brain games", page: "今日 → 动脑", status: "noprice", price: "—", doc: "没有单次价。0822 有认知照护卡 ¥780/月可参考；价格书 8 周认知计划 ¥3,980 未采用。No per-session price; the Fuwai cognitive card (¥780/mo) is the closest reference." },
      { key: "svc-sleep", zh: "睡眠 routine 与日记", en: "Sleep routine & diary", page: "今日 → 睡眠", status: "priced", price: "检查 ¥100 · 指导 ¥80", amount: 100, from: true, selectable: true, doc: "0821 心理 / 睡眠价。Final table, psychology & sleep." },
      { key: "svc-meds", zh: "服药协助", en: "Taking medicine", page: "今日 → 用药", status: "priced", price: "¥30", amount: 30, selectable: true, doc: "0821 护士服务。Final table, nurse services." },
      { key: "svc-check", zh: "每日健康打卡", en: "Daily health check", page: "今日 → 晚上打卡", status: "priced", price: "体征 ¥20 · 慢病检查 ¥80", amount: 20, from: true, selectable: true, doc: "0821 监测价。Final table, monitoring." },
      { key: "svc-night", zh: "夜间照护（23:00 / 03:00 巡查、晨间清洁）", en: "Night care (11pm & 3am checks, morning clean)", page: "今日 → 家人视图（夜间）", status: "noprice", price: "—", doc: "哪个文件都没有定价 — 家里人做；24 小时紧急联系含在 9,800 居家年卡里。No file prices overnight family care; 24h emergency contact sits in the home year card." },
      { key: "svc-weight", zh: "每周体重", en: "Weekly weight", page: "档案 → 每周跟踪", status: "priced", price: "¥50", amount: 50, selectable: true, doc: "0821 监测（体成分）。Final table, monitoring." },
      { key: "svc-report", zh: "周日照片报告", en: "Sunday photo report", page: "家人门户 → 每周小结", status: "priced", price: "¥298 / 月（经健康管理师）", amount: 298, selectable: true, doc: "0821 健康管理师 298/月；0822 线上随访 98/月未采用。Via the health manager in the final table." },
    ],
  },
  {
    zh: "团队服务", en: "Staff pages",
    rows: [
      { key: "svc-standcheck", zh: "站立监测（每周）", en: "Standing checks, weekly", page: "团队录入 → 站立监测", status: "priced", price: "¥200（上门）", amount: 200, selectable: true, doc: "0821 康复上门价。Final table, rehab home visit." },
      { key: "svc-nutrition", zh: "营养计算", en: "Nutrition calculation", page: "团队录入 → 营养计算", status: "priced", price: "检查 ¥100 · 菜单 ¥200", amount: 100, from: true, selectable: true, doc: "0821 营养价。Final table, nutrition." },
      { key: "svc-cogrec", zh: "每周动脑与语言记录", en: "Weekly brain & language records", page: "团队录入 → 认知记录", status: "noprice", price: "—", doc: "没有单条记录价；0822 认知照护卡 ¥780/月含记忆训练。No per-record price in any file; the Fuwai cognitive card covers memory training." },
      { key: "svc-followup", zh: "每周跟踪与随访", en: "Weekly tracking & follow-up", page: "团队录入 → 每周跟踪", status: "priced", price: "¥298 / 月 · 慢病管理 ¥398 / 月", amount: 298, from: true, selectable: true, doc: "0820 慢病管理 398/月；0821 管理价 298/月。Playbook and final table, manager rows." },
      { key: "svc-vitals", zh: "体征与体能检测", en: "Vitals & fitness tests", page: "团队录入 → 检测", status: "priced", price: "¥20 / ¥80 / ¥100", amount: 20, from: true, selectable: true, doc: "0821 监测价。Final table, monitoring." },
      { key: "svc-quest", zh: "情绪与睡眠问卷", en: "Mood & sleep questionnaires", page: "患者端；团队录入", status: "priced", price: "¥80 · ¥100", amount: 80, from: true, selectable: true, doc: "0821 心理 / 睡眠价。Final table, psychology & sleep." },
      { key: "svc-scan", zh: "3D 体态扫描", en: "3D body scan", page: "团队录入 → 检测", status: "noprice", price: "—", doc: "哪个文件都没有这个价；0822 全面体能检测 ¥198 最接近，但不是同一个检查。No file lists a 3D-scan price; the Fuwai full fitness check (¥198) is closest but is a different test." },
      { key: "svc-life", zh: "LIFE 检测", en: "LIFE test", page: "团队录入 → 检测", status: "noprice", price: "—", doc: "哪个文件都没有提到 LIFE 检测。No file mentions the LIFE test at all." },
      { key: "svc-labs", zh: "血液化验", en: "Blood lab work", page: "患者管理 → 化验", status: "noprice", price: "—", doc: "哪个文件都没有定价 — 医院做。No file prices blood tests; the hospital does them." },
      { key: "svc-notes", zh: "团队记录（医生、护士、营养师等）", en: "Team notes (doctor, nurse, dietitian…)", page: "团队录入 → 团队记录", status: "priced", price: "含在服务内", doc: "不单独收费 — 专业人员的服务已定价（0821：咨询 200、营养 100、教练 100、护士上门 150）。Not priced on its own; the professional's service is priced." },
    ],
  },
  {
    zh: "患者档案与学习", en: "Patient file & learning",
    rows: [
      { key: "svc-medlist", zh: "用药清单维护", en: "Medicine list", page: "患者管理 → 用药", status: "priced", price: "¥30", amount: 30, selectable: true, doc: "0821 护士服务。Final table, nurse services." },
      { key: "svc-assess", zh: "首次全面评估", en: "First full assessment", page: "患者管理 → 档案", status: "priced", price: "¥298", amount: 298, selectable: true, doc: "决定用 298（0821）；0820 为 250，按定稿表为准。Decided: 298 — the final table wins over the playbook's 250." },
      { key: "svc-signup", zh: "入组与同意", en: "Signing up & consent", page: "患者管理 → 入组", status: "free", price: "免费 ¥0", amount: 0, selectable: true, doc: "0820 免费层（建档免费）；0822 建档也免费。Free in the playbook's free layer and on the Fuwai list." },
      { key: "svc-talks", zh: "健康讲座", en: "Health talks", page: "资源", status: "free", price: "免费 ¥0", amount: 0, selectable: true, doc: "0821、0822 均为免费。Free in the final table and the Fuwai list." },
      { key: "svc-familyteach", zh: "家属教学", en: "Teaching for the family", page: "资源", status: "priced", price: "¥50 / 次", amount: 50, selectable: true, doc: "0821 教育价；0822 为 60/次，未采用。Final table, education." },
      { key: "svc-pain", zh: "疼痛治疗", en: "Pain treatment", page: "档案 → 运动；团队录入", status: "priced", price: "¥70–150 / 次", amount: 70, from: true, selectable: true, doc: "0821 康复手法价；0820 有疼痛阶梯价，专家级仅转介。Final table hands-on rehab; expert level is referral only." },
    ],
  },
  {
    zh: "患者端", en: "Patient app",
    rows: [
      { key: "svc-logday", zh: "记录我的一天", en: "Log my day", page: "患者端 → 记录我的一天", status: "free", price: "免费 ¥0", amount: 0, selectable: true, doc: "没有文件对患者记录收费 — 含在服务里。No file charges for patient logging; included." },
      { key: "svc-mini", zh: "小程序", en: "Mini-program", page: "患者端", status: "free", price: "免费 ¥0", amount: 0, selectable: true, doc: "没有文件收费。No file charges for it." },
      { key: "svc-familynotes", zh: "家属记录与观察", en: "Family notes & observations", page: "家人门户", status: "free", price: "免费 ¥0", amount: 0, selectable: true, doc: "没有文件对家属记录收费。No file charges for family entries." },
      { key: "svc-journal", zh: "每周日记（护士阅读并回复）", en: "Weekly journal (nurse reads & replies)", page: "家人门户", status: "priced", price: "¥298 / 月（经健康管理师）", amount: 298, selectable: true, doc: "0821 健康管理师 298/月；0822 线上随访 98/月未采用。Via the health manager in the final table." },
    ],
  },
  {
    zh: "套餐与设备", en: "Packages & devices",
    rows: [
      ...PRICE_PACKAGES,
      { key: "svc-devices", zh: "设备租赁（8 种）", en: "Rented devices (8 kinds)", page: "居家护理 → 设备", status: "priced", price: "¥20–200 / 月（每件）", amount: 20, from: true, selectable: true, doc: "0821 逐项价；0820 为统一 220/月，未采用。Itemised in the final table; the playbook's flat 220/mo was not adopted." },
    ],
  },
  {
    zh: "待定价 / 仅转介 / 不出售", en: "Price to set · referral only · not sold",
    rows: [
      { key: "svc-taichi", zh: "太极与八段锦课", en: "Tai chi & Baduanjin classes", page: "资源；档案 → 运动", status: "toset", price: "待定价", doc: "0821 写「按公示价」；0822 附表里公益课免费 — 两个说法不同，等定。The final table says 'price as posted'; the Fuwai appendix lists public classes as free." },
      { key: "svc-cookingclass", zh: "烹饪课", en: "Cooking class", page: "资源", status: "toset", price: "待定价", doc: "0821 写「按公示价」；0822 为 ¥50/人。'Price as posted' in the final table; ¥50 per person on the Fuwai list." },
      { key: "svc-senioruni", zh: "老年大学课程", en: "Senior-university classes", page: "资源", status: "toset", price: "待定价", doc: "0821 写「按公示价」；0822 附表 ¥40/人/课。'Price as posted'; ¥40 per person per lesson in the Fuwai appendix." },
      { key: "svc-phone", zh: "智能手机教学", en: "Smartphone teaching", page: "资源", status: "toset", price: "待定价", doc: "0821 写「按公示价」；0822 附表含在 ¥40/人/课的文化艺术课里。'Price as posted'; included in the Fuwai appendix's ¥40 culture & arts class." },
      { key: "svc-singapore", zh: "新加坡专家", en: "Singapore expert", page: "团队录入 → 转介", status: "referral", price: "仅转介", doc: "0821 定为转介（站点收佣金）；0820 有专家价 ¥1,850/次、课程 9,800–18,800。Referral in the final table; the playbook lists expert prices." },
      { key: "svc-fascia", zh: "筋膜刀治疗", en: "Fascia-knife treatment", page: "团队录入 → 转介", status: "referral", price: "仅转介", doc: "0821 转介，合作方定价。Referral in the final table; the partner sets the price." },
      { key: "svc-onlinedoc", zh: "线上医生问诊", en: "Online doctor visits", page: "团队录入 → 转介", status: "referral", price: "仅转介", doc: "0821 转介；0822 附表有 ¥99/次等价，未采用。Referral in the final table; Fuwai appendix prices were not adopted." },
      { key: "svc-rebuild", zh: "适老化改造", en: "Home rebuilding work", page: "居家护理 → 安全", status: "referral", price: "仅转介", doc: "0821 转介；0820 佣金 ¥300。Referral in the final table; playbook commission ¥300." },
      { key: "svc-partner-rent", zh: "合作方设备租赁", en: "Equipment rental via partners", page: "居家护理 → 设备", status: "referral", price: "仅转介", doc: "0821 转介；0820 佣金 ¥50。Referral in the final table; playbook commission ¥50." },
      { key: "svc-page-safety", zh: "安全与合规页", en: "Safety & compliance pages", page: "安全与合规", status: "notsold", price: "不出售", doc: "网站内部页面，没有文件给它定价。Inside page; no file prices it." },
      { key: "svc-page-public", zh: "成果公示页", en: "Public results page", page: "成果公示", status: "notsold", price: "不出售", doc: "网站内部页面，没有文件给它定价。Inside page; no file prices it." },
      { key: "svc-page-data", zh: "数据结构页", en: "Data model page", page: "数据结构", status: "notsold", price: "不出售", doc: "网站内部页面，没有文件给它定价。Inside page; no file prices it." },
      { key: "svc-page-progress", zh: "工作进展与智能助手", en: "Work progress & helper", page: "工作进展；智能助手", status: "notsold", price: "不出售", doc: "网站内部页面，没有文件给它们定价。Inside pages; no file prices them." },
    ],
  },
];

const ALL_ROWS: PriceRow[] = [...PRICE_SECTIONS.flatMap((s) => s.rows)];
export { ALL_ROWS as ALL_PRICE_ROWS };
export type { PriceRow };

/* Which MDT post delivers each service — the link between the price table
   and the org chart (YH-PLAT-ORG-001). Attributions follow the price
   files' own notes (0821's sheets are organised by post: 营养 / 康复 /
   心理睡眠 / 健康管理师 / 居家护理）. Services with no single delivering
   post (partner referrals, external classes) are simply absent here and
   show no role. */
export const SERVICE_ROLE: Record<string, string> = {
  "svc-morning": "aide", "svc-meals": "aide", "svc-cooking": "family",
  "svc-protein": "dietitian", "svc-seated": "exercise", "svc-standing": "exercise",
  "svc-brain": "counselor", "svc-sleep": "counselor", "svc-meds": "aide",
  "svc-check": "aide", "svc-night": "family", "svc-weight": "aide", "svc-report": "manager",
  "svc-standcheck": "exercise", "svc-nutrition": "dietitian", "svc-cogrec": "counselor",
  "svc-followup": "manager", "svc-vitals": "exercise", "svc-quest": "counselor",
  "svc-scan": "exercise", "svc-labs": "physician", "svc-medlist": "clerk",
  "svc-assess": "manager", "svc-signup": "sales", "svc-talks": "manager",
  "svc-familyteach": "manager", "svc-pain": "exercise", "svc-logday": "patient",
  "svc-mini": "patient", "svc-familynotes": "family", "svc-journal": "manager",
  "svc-devices": "lead", "svc-taichi": "exercise", "svc-cookingclass": "dietitian",
  "svc-onlinedoc": "physician",
  "svc-page-safety": "lead", "svc-page-public": "lead", "svc-page-data": "lead", "svc-page-progress": "lead",
};

const PRICE_ROLE_LABELS: Record<string, { zh: string; en: string }> = {
  lead: { zh: "平台总负责人", en: "Platform lead" },
  sales: { zh: "销售顾问", en: "Sales consultant" },
  clerk: { zh: "档案录入员", en: "Records clerk" },
  manager: { zh: "健康管理师", en: "Health manager" },
  dietitian: { zh: "营养师", en: "Dietitian" },
  exercise: { zh: "运动康复师", en: "Rehab therapist" },
  counselor: { zh: "心理咨询师", en: "Psychologist" },
  physician: { zh: "合作会诊医师（外部）", en: "Consulting physician (external)" },
  aide: { zh: "生活管家", en: "Care butler" },
  family: { zh: "家人", en: "Family" },
  patient: { zh: "患者本人", en: "The patient" },
};
export function serviceRoleLabel(roleKey: string | undefined): string {
  if (!roleKey) return "";
  const r = PRICE_ROLE_LABELS[roleKey];
  return r ? T(r.zh, r.en) : roleKey;
}
/** The priced services one MDT post delivers (packages excluded). */
export function servicesForRole(roleKey: string): PriceRow[] {
  return ALL_ROWS.filter((r) => !r.key.startsWith("pkg-") && SERVICE_ROLE[r.key] === roleKey);
}
/** One-language display of a stored price string. */
export function priceDisplay(combined: string): string {
  return L(combined);
}
const SELECTABLE_SERVICES: PriceRow[] = ALL_ROWS.filter((r) => r.selectable && !r.key.startsWith("pkg-"));
const SERVICE_SECTIONS: PriceSection[] = PRICE_SECTIONS
  .map((s) => ({ ...s, rows: s.rows.filter((r) => r.selectable && !r.key.startsWith("pkg-")) }))
  .filter((s) => s.rows.length > 0);

function StatusChip({ status }: { status: PriceStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-block shrink-0 rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: m.color, background: m.bg }}>
      {T(m.zh, m.en)}
    </span>
  );
}

function PCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>{title}</h3>
      {children}
    </section>
  );
}

const INP = "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm";

export function PricingPanel() {
  const queryClient = useQueryClient();
  const [pkgKey, setPkgKey] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [nameError, setNameError] = useState("");
  const [filter, setFilter] = useState<"all" | "unmatched">("all");

  const selQ = useQuery({ queryKey: ["pricingSelections"], queryFn: () => api.listPricingSelections({}) });
  const selections = selQ.data?.selections ?? [];

  const pkg = PRICE_PACKAGES.find((p) => p.key === pkgKey) ?? null;
  const pickedRows = useMemo(() => SELECTABLE_SERVICES.filter((r) => picked.includes(r.key)), [picked]);
  const total = (pkg?.amount ?? 0) + pickedRows.reduce((a, r) => a + (r.amount ?? 0), 0);
  const anyFrom = Boolean(pkg?.from) || pickedRows.some((r) => r.from);
  const hasChoice = Boolean(pkg) || pickedRows.length > 0;

  const counts = useMemo(() => {
    const c: Record<PriceStatus, number> = { priced: 0, free: 0, noprice: 0, toset: 0, referral: 0, notsold: 0 };
    for (const r of ALL_ROWS) c[r.status] += 1;
    return c;
  }, []);

  const save = useMutation({
    mutationFn: async () => await api.savePricingSelection({
      clientName: clientName.trim(),
      packageLabel: pkg ? `${pkg.zh} ${pkg.en}` : "",
      packagePrice: pkg ? pkg.price : "",
      services: pickedRows.map((r) => ({ label: `${r.zh} ${r.en}`, price: r.price })),
      note: note.trim(),
    }),
    onSuccess: () => {
      setMsg(T("已保存 — 客户的选择在下方列表里，团队都能看到。", "Saved — the client's choices are in the list below for the team."));
      setPkgKey(""); setPicked([]); setClientName(""); setNote("");
      void queryClient.invalidateQueries({ queryKey: ["pricingSelections"] });
    },
    onError: (e) => setMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });

  const toggleService = (key: string) =>
    setPicked((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  return (
    <div className="space-y-4">
      <PCard title={T("第一步 · 选一个套餐", "Step 1 — choose a package")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--border)] p-3">
            <input type="radio" name="price-package" className="mt-1 h-4 w-4 shrink-0" checked={pkgKey === ""} onChange={() => setPkgKey("")} />
            <span className="text-sm"><span className="font-semibold">{T("不选套餐，只选单项", "No package — individual services only")}</span></span>
          </label>
          {PRICE_PACKAGES.map((p) => (
            <label key={p.key} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3" style={pkgKey === p.key ? { borderColor: TEAL, background: "#e3efec" } : { borderColor: "var(--border)" }}>
              <input type="radio" name="price-package" className="mt-1 h-4 w-4 shrink-0" checked={pkgKey === p.key} onChange={() => setPkgKey(p.key)} />
              <span className="text-sm">
                <span className="font-semibold">{T(p.zh, p.en)}</span>
                <br /><span className="font-bold" style={{ color: TEAL }}>{L(p.price)}</span>
              </span>
            </label>
          ))}
        </div>
      </PCard>

      <PCard title={T("第二步 · 加选单项服务", "Step 2 — add individual services")}>
        <div className="space-y-4">
          {SERVICE_SECTIONS.map((s) => (
            <div key={s.zh}>
              <p className="mb-1.5 text-sm font-bold" style={{ color: TEAL }}>{T(s.zh, s.en)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {s.rows.map((r) => {
                  const on = picked.includes(r.key);
                  return (
                    <label key={r.key} className="flex cursor-pointer items-start gap-2 rounded-lg border p-3" style={on ? { borderColor: TEAL, background: "#e3efec" } : { borderColor: "var(--border)" }}>
                      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={on} onChange={() => toggleService(r.key)} aria-label={`Add ${r.en}`} />
                      <span className="text-sm">
                        <span className="font-semibold">{T(r.zh, r.en)}</span>
                        <br /><span className="font-bold" style={{ color: TEAL }}>{L(r.price)}</span>
                        {r.status === "free" ? <span className="ml-2"><StatusChip status="free" /></span> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PCard>

      <PCard title={T("已选与合计", "Your choices")}>
        {!hasChoice ? (
          <p className="text-sm text-[var(--dim)]">{T("还没有选择 — 在上面选一个套餐，或勾选单项服务，这里会列出所选内容和合计。", "Nothing chosen yet — pick a package or tick services above and they appear here with a total.")}</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {pkg ? (
              <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-1.5">
                <span><span className="font-semibold">{T(pkg.zh, pkg.en)}</span> <span className="ml-1 rounded-full bg-[#e3efec] px-2 py-0.5 text-xs font-bold" style={{ color: TEAL }}>{T("套餐", "Package")}</span></span>
                <span className="font-bold">{L(pkg.price)}</span>
              </li>
            ) : null}
            {pickedRows.map((r) => (
              <li key={r.key} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-1.5">
                <span><span className="font-semibold">{T(r.zh, r.en)}</span></span>
                <span className="font-bold">{L(r.price)}</span>
              </li>
            ))}
          </ul>
        )}
        {hasChoice ? (
          <p className="mt-3 text-base">
            {T("合计估算：", "Estimated total: ")}<span className="text-xl font-bold" style={{ color: TEAL }}>{anyFrom ? T("约 ", "about ") : ""}¥{total.toLocaleString(LANG === "zh" ? "zh-CN" : "en-GB")}{anyFrom ? T(" 起", "+") : ""}</span>
            <span className="ml-2 text-xs text-[var(--dim)]">{T("月卡 / 年卡按周期收费，单项按次或按月收费 — 合计是把所选各项加在一起的估算。", "Cards bill per month or year and services per visit or month; the total simply adds the chosen items together.")}</span>
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">{T("客户姓名", "Client name")}
            <input {...FIELDS.savePricingSelection.clientName} aria-label="Client name" className={INP} value={clientName} onChange={(e) => { setClientName(e.target.value); setNameError(""); }} placeholder={T("例如：王阿姨", "e.g. Mrs Wang")} />
            {nameError ? <span className="mt-1 block text-xs" style={{ color: RED }}>{nameError}</span> : null}
          </label>
          <label className="block text-sm">{T("备注", "Note")}
            <input {...FIELDS.savePricingSelection.note} aria-label="Selection note" className={INP} value={note} onChange={(e) => setNote(e.target.value)} placeholder={T("可选", "Optional")} />
          </label>
        </div>
        <button type="button" disabled={save.isPending || !hasChoice}
          className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-50" style={{ background: TEAL }}
          onClick={() => {
            if (!clientName.trim()) { setNameError(T("请先填客户姓名，再保存。", "Please fill in the client's name first.")); return; }
            save.mutate();
          }}>
          {save.isPending ? T("保存中…", "Saving…") : T("保存客户选择", "Save this client's choices")}
        </button>
        {msg ? <p className="mt-2 text-sm" role="status">{msg}</p> : null}
        {selections.length > 0 ? (
          <div className="mt-4 border-t border-[var(--border)] pt-3">
            <p className="mb-2 text-sm font-bold" style={{ color: TEAL }}>{T("已保存的客户选择", "Saved client choices")}</p>
            <ul className="space-y-2">
              {selections.map((s) => (
                <li key={s.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                  <p><span className="font-semibold">{s.clientName || T("（未填姓名）", "(no name)")}</span> <span className="text-xs text-[var(--dim)]">{new Date(s.createdAt).toLocaleString(LANG === "zh" ? "zh-CN" : "en-GB")}</span></p>
                  {s.packageLabel ? <p className="mt-0.5">{T("套餐：", "Package: ")}{L(s.packageLabel)} — <span className="font-semibold">{L(s.packagePrice)}</span></p> : null}
                  {s.services.length > 0 ? (
                    <ul className="mt-0.5 list-disc pl-5">
                      {s.services.map((sv, i) => (<li key={i}>{L(sv.label)} — {L(sv.price)}</li>))}
                    </ul>
                  ) : null}
                  {s.note ? <p className="mt-0.5 text-[var(--dim)]">{T("备注：", "Note: ")}{s.note}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </PCard>

      <PCard title={T("全部服务价格对照", "Full price list — matched & unmatched")}>
        <Dismissible className="pr-8"><p className="mb-3 flex flex-wrap gap-1.5 text-sm">
          {(Object.keys(STATUS_META) as PriceStatus[]).map((k) => (
            <span key={k}><StatusChip status={k} /> <span className="font-semibold">{counts[k]}</span></span>
          ))}
          <span className="text-[var(--dim)]">{T(`共 ${ALL_ROWS.length} 项 · 定价依据：0820 操作手册 + 0821 定稿价目表（2026-11-25 决定）`, `${ALL_ROWS.length} items · Pricing basis: the 0820 playbook + 0821 final price table (decided 2026-11-25)`)}</span>
        </p></Dismissible>
        <div className="mb-3 flex gap-2" role="group" aria-label="Price list filter">
          <button type="button" aria-pressed={filter === "all"} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === "all" ? "text-white" : "border border-[var(--border)]"}`} style={filter === "all" ? { background: TEAL } : { color: TEAL }} onClick={() => setFilter("all")}>{T("全部", "All")}</button>
          <button type="button" aria-pressed={filter === "unmatched"} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === "unmatched" ? "text-white" : "border border-[var(--border)]"}`} style={filter === "unmatched" ? { background: TEAL } : { color: TEAL }} onClick={() => setFilter("unmatched")}>{T("只看未匹配", "Unmatched only")}</button>
        </div>
        <div className="space-y-5">
          {PRICE_SECTIONS.map((s) => {
            const rows = filter === "all" ? s.rows : s.rows.filter((r) => r.status === "noprice" || r.status === "toset");
            if (rows.length === 0) return null;
            return (
              <div key={s.zh}>
                <p className="mb-1 text-sm font-bold" style={{ color: TEAL }}>{T(s.zh, s.en)}</p>
                <ul>
                  {rows.map((r) => (
                    <li key={r.key} className="border-b border-[var(--border)] py-2.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold">{T(r.zh, r.en)}</span>
                        <StatusChip status={r.status} />
                        <span className="ml-auto text-sm font-bold" style={{ color: r.status === "noprice" || r.status === "toset" ? STATUS_META[r.status].color : TEAL }}>{L(r.price)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--dim)]">{T("网站页面：", "Page: ")}{L(r.page)}</p>
                      {SERVICE_ROLE[r.key] ? <p className="mt-0.5 text-xs text-[var(--dim)]">{T("提供角色：", "Provided by: ")}<span className="font-semibold" style={{ color: TEAL }}>{serviceRoleLabel(SERVICE_ROLE[r.key])}</span></p> : null}
                      <p className="mt-0.5 text-xs text-[var(--dim)]">{L(r.doc)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {filter === "unmatched" && PRICE_SECTIONS.every((s) => s.rows.every((r) => r.status !== "noprice" && r.status !== "toset")) ? (
            <p className="text-sm text-[var(--dim)]">{T("全部已匹配。", "Everything is matched.")}</p>
          ) : null}
        </div>
      </PCard>
    </div>
  );
}
