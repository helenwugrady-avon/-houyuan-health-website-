import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { fileToBase64 } from "@hatch/space-sdk/client";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";
import pillarNutrition from "./assets/pillar-nutrition.webp";
import pillarActivity from "./assets/pillar-activity.webp";
import pillarSleep from "./assets/pillar-sleep.webp";
import pillarStress from "./assets/pillar-stress.webp";
import pillarSocial from "./assets/pillar-social.webp";
import pillarSubstances from "./assets/pillar-substances.webp";
import { TodayTab, ExerciseBrainTab, MedsLabsTab, SeniorCheckinPanel, TeamFormsPanel, FormsMapPanel } from "./senior";
import { PricingPanel } from "./pricing";

const FIELDS = actionFields<typeof Actions>();

type Patient = ApiResponse<typeof api, "getState">["patients"][number];
type Measures = Patient["measures"];

const TEAL = "#1d6762";
const DEEP = "#123b3a";
const GREEN = "#2e7a4f";
const AMBER = "#b8860b";
const RED = "#a63d32";

/* The six pillars of lifestyle medicine — ONE shared list used everywhere
   the pillars appear (header, dashboard, record, patient app, public page,
   screener, resources), always in this order and always with these same
   pictures, so each pillar is recognisable at a glance. */
type PillarKey = "nutrition" | "activity" | "sleep" | "stress" | "social" | "substances";
const PILLARS: { key: PillarKey; zh: string; en: string; img: string; alt: string }[] = [
  { key: "nutrition", zh: "营养", en: "Nutrition", img: pillarNutrition, alt: "一碗蔬菜、谷物和鸡蛋的插图 Illustration of a bowl of vegetables, grains and egg" },
  { key: "activity", zh: "运动", en: "Physical activity", img: pillarActivity, alt: "两位不同年龄的人一起快走的插图 Illustration of two people of different ages walking briskly together" },
  { key: "sleep", zh: "睡眠", en: "Sleep", img: pillarSleep, alt: "月亮下安睡的插图 Illustration of restful sleep under a crescent moon" },
  { key: "stress", zh: "压力管理", en: "Stress management", img: pillarStress, alt: "一位女士在户外缓缓打太极、神情安详的插图 Illustration of a woman calmly practising tai chi outdoors" },
  { key: "social", zh: "社会联系", en: "Social connectedness", img: pillarSocial, alt: "三位朋友坐在长椅上聊天的插图 Illustration of three friends talking on a bench" },
  { key: "substances", zh: "远离有害物质", en: "Avoiding risky substances", img: pillarSubstances, alt: "一位男士端着一杯茶、向香烟和酒杯摆手说不的插图 Illustration of a man holding a cup of tea and waving no to a cigarette and a wine glass" },
];
function PillarImg({ k, className }: { k: string; className?: string }) {
  const p = PILLARS.find((x) => x.key === k);
  if (!p) return null;
  return <img src={p.img} alt="" className={className} />;
}

/* ---------- Viewer roles (need-to-know demo) ---------- */
type ViewerRole = "doctor" | "dietitian" | "exercise" | "counselor" | "coach" | "nurse" | "frontdesk" | "admin" | "manager" | "aide" | "family" | "patient" | "newrole1" | "newrole2" | "newrole3";
const VIEWER_ROLES: { key: ViewerRole; zh: string; en: string; sees: string; placeholder?: boolean }[] = [
  { key: "doctor", zh: "医生", en: "Physician", sees: "全部临床数据 All clinical data" },
  { key: "dietitian", zh: "营养师", en: "Dietitian", sees: "饮食、体成分、化验 Food, body composition, labs" },
  { key: "exercise", zh: "运动/康复师", en: "Exercise specialist", sees: "运动与体能 Activity and fitness tests" },
  { key: "counselor", zh: "心理/睡眠咨询师", en: "Counselor", sees: "睡眠、压力、量表 Sleep, stress, mood scales" },
  { key: "coach", zh: "健康教练", en: "Health coach", sees: "支柱、目标、打卡 Pillars, goals, check-ins（不含化验明细）" },
  { key: "nurse", zh: "护士/技师", en: "Nurse / technician", sees: "检测数据 Assessment data" },
  { key: "frontdesk", zh: "前台", en: "Front desk", sees: "仅入组信息 Enrollment only — 无临床数值 No clinical values" },
  { key: "admin", zh: "管理员", en: "Admin", sees: "系统与审计 System and audit" },
  { key: "manager", zh: "健康管理师", en: "Health manager", sees: "汇总、随访、周报 Summaries, follow-ups, weekly reports" },
  { key: "aide", zh: "护工", en: "Aide", sees: "每日照护清单与喂药打勾 Daily care checklist and dose ticks（不上传文件 No file uploads）" },
  { key: "family", zh: "家人", en: "Family", sees: "所照顾患者的完整情况（家人门户）The complete picture of the patient they look after (Family Portal)" },
  { key: "patient", zh: "患者", en: "Patient", sees: "自己的记录 Own record" },
  { key: "newrole1", zh: "新角色 1", en: "New role 1 — to be defined", sees: "待定义 To be defined — 暂无任务 No tasks yet", placeholder: true },
  { key: "newrole2", zh: "新角色 2", en: "New role 2 — to be defined", sees: "待定义 To be defined — 暂无任务 No tasks yet", placeholder: true },
  { key: "newrole3", zh: "新角色 3", en: "New role 3 — to be defined", sees: "待定义 To be defined — 暂无任务 No tasks yet", placeholder: true },
];
function isPlaceholderRole(r: ViewerRole) { return r === "newrole1" || r === "newrole2" || r === "newrole3"; }
function viewerLabel(r: ViewerRole) { const v = VIEWER_ROLES.find((x) => x.key === r); return v ? `${v.zh} ${v.en}` : r; }
function canSeeClinical(r: ViewerRole) { return r !== "frontdesk" && r !== "aide" && !isPlaceholderRole(r); }



/* Seeded home-monitoring alerts (thresholds: glucose <3.9 / ≥13.9 red; BP ≥180/110 red, ≥160/100 amber, ≥140/90 amber) */
const HOME_ALERTS: { pid: string; level: "red" | "amber"; zh: string; en: string; date: string }[] = [
  { pid: "P004", level: "red", zh: "餐后2小时血糖 15.2 mmol/L · 2026-11-21", en: "2-h post-meal glucose 15.2 mmol/L — very high, call today", date: "2026-11-21" },
  { pid: "P002", level: "red", zh: "空腹血糖 3.6 mmol/L · 2026-11-19", en: "Fasting glucose 3.6 mmol/L — low, call today", date: "2026-11-19" },
  { pid: "P007", level: "amber", zh: "血压 172/104 mmHg · 2026-11-22", en: "BP 172/104 — high (≥160/100 band), physician review", date: "2026-11-22" },
  { pid: "P007", level: "amber", zh: "血压 166/101 mmHg · 2026-11-20", en: "BP 166/101 — high, physician review", date: "2026-11-20" },
  { pid: "P012", level: "amber", zh: "近7天空腹血糖≥7.0 共4次", en: "Fasting glucose ≥7.0 on 4 days in 7 days", date: "2026-11-22" },
  { pid: "P003", level: "amber", zh: "近5天没有居家记录", en: "No home log in 5 days", date: "2026-11-22" },
  { pid: "P006", level: "amber", zh: "近5天没有居家记录", en: "No home log in 5 days", date: "2026-11-22" },
];

const STATUS_EN: Record<string, string> = { "绿": "Green", "黄": "Amber", "红": "Red" };
const STATUS_COLOR: Record<string, string> = { "绿": GREEN, "黄": AMBER, "红": RED };
const SEX_EN: Record<string, string> = { "女": "Female", "男": "Male" };
const SOURCE_EN: Record<string, string> = { "医生转诊": "Physician referral", "小程序": "Mini program", "社区筛查": "Community screening" };
const GOAL_EN: Record<string, string> = { "维持": "Maintain", "减重": "Lose weight", "增肌": "Gain muscle" };
const STAGE_EN: Record<string, string> = { "基线": "Baseline", "第12周": "Week 12", "第24周": "Week 24" };

function stageEn(s: string) { return STAGE_EN[s] ?? s.replace("第", "Week ").replace("周", ""); }
function followShort(f: string) {
  const parts = f.split("-");
  if (parts.length === 3) return `${Number(parts[1])}月 ${Number(parts[2])}日`;
  return f;
}

function Pill({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? TEAL;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ background: c }}>
      {status} {STATUS_EN[status] ?? ""}
    </span>
  );
}

/* ---------- Why this status? (reasons derived from the patient's own latest measures + check-ins) ---------- */
type ReasonTone = "good" | "warn" | "bad";
type StatusReason = { tone: ReasonTone; zh: string; en: string; shortZh: string; shortEn: string; clinical: boolean };

function hasNoMeasures(p: Patient) { return p.measures.weightKg === 0 && p.measures.hba1cPct === 0 && p.measures.systolic === 0; }

function statusReasons(p: Patient): StatusReason[] {
  const m = p.measures;
  const reasons: StatusReason[] = [];
  if (hasNoMeasures(p)) {
    return [{ tone: "warn", clinical: false, zh: "新入组，还没有第一次评估数据 — 先在「团队录入」完成评估，录入真实测量后，颜色和原因按真实数据算", en: "Newly enrolled — no first-assessment data yet. Complete the assessment in Staff entry; once real measurements are in, the colour and reasons follow the real data", shortZh: "待评估 Awaiting assessment", shortEn: "Awaiting assessment" }];
  }
  if (m.hba1cPct >= 6.5) {
    reasons.push({ tone: "bad", clinical: true, zh: `HbA1c ${m.hba1cPct}% 偏高（目标 <6.5%，达到或超过 6.5% 需要医生重点复核）`, en: `HbA1c ${m.hba1cPct}% is high (target <6.5%; at or above 6.5% needs physician review)`, shortZh: `HbA1c ${m.hba1cPct}% 偏高`, shortEn: `HbA1c ${m.hba1cPct}% high` });
  } else if (m.hba1cPct >= 5.7) {
    reasons.push({ tone: "warn", clinical: true, zh: `HbA1c ${m.hba1cPct}% 略高（正常 <5.7%，5.7–6.4% 需要关注）`, en: `HbA1c ${m.hba1cPct}% is slightly high (normal <5.7%; 5.7–6.4% needs attention)`, shortZh: `HbA1c ${m.hba1cPct}% 略高`, shortEn: `HbA1c ${m.hba1cPct}% slightly high` });
  } else {
    reasons.push({ tone: "good", clinical: true, zh: `HbA1c ${m.hba1cPct}% 在目标内（<5.7%）`, en: `HbA1c ${m.hba1cPct}% is in target (<5.7%)`, shortZh: `HbA1c ${m.hba1cPct}% 达标`, shortEn: `HbA1c in target` });
  }
  if (m.systolic >= 160 || m.diastolic >= 100) {
    reasons.push({ tone: "bad", clinical: true, zh: `血压 ${m.systolic}/${m.diastolic} mmHg 明显偏高（目标 <130/80）`, en: `Blood pressure ${m.systolic}/${m.diastolic} mmHg is clearly high (target <130/80)`, shortZh: `血压 ${m.systolic}/${m.diastolic} 明显偏高`, shortEn: `BP ${m.systolic}/${m.diastolic} clearly high` });
  } else if (m.systolic >= 140 || m.diastolic >= 90) {
    reasons.push({ tone: "warn", clinical: true, zh: `血压 ${m.systolic}/${m.diastolic} mmHg 偏高（目标 <130/80）`, en: `Blood pressure ${m.systolic}/${m.diastolic} mmHg is high (target <130/80)`, shortZh: `血压 ${m.systolic}/${m.diastolic} 偏高`, shortEn: `BP ${m.systolic}/${m.diastolic} high` });
  } else if (m.systolic >= 130 || m.diastolic >= 80) {
    reasons.push({ tone: "warn", clinical: true, zh: `血压 ${m.systolic}/${m.diastolic} mmHg 接近上限（目标 <130/80）`, en: `Blood pressure ${m.systolic}/${m.diastolic} mmHg is borderline (target <130/80)`, shortZh: `血压 ${m.systolic}/${m.diastolic} 接近上限`, shortEn: `BP ${m.systolic}/${m.diastolic} borderline` });
  } else {
    reasons.push({ tone: "good", clinical: true, zh: `血压 ${m.systolic}/${m.diastolic} mmHg 在目标内（<130/80）`, en: `Blood pressure ${m.systolic}/${m.diastolic} mmHg is in target (<130/80)`, shortZh: `血压达标`, shortEn: `BP in target` });
  }
  if (m.fastingGlucose >= 7.0) {
    reasons.push({ tone: "bad", clinical: true, zh: `空腹血糖 ${m.fastingGlucose} mmol/L 偏高（目标 <6.1）`, en: `Fasting glucose ${m.fastingGlucose} mmol/L is high (target <6.1)`, shortZh: `空腹血糖 ${m.fastingGlucose} 偏高`, shortEn: `Fasting glucose ${m.fastingGlucose} high` });
  } else if (m.fastingGlucose >= 6.1) {
    reasons.push({ tone: "warn", clinical: true, zh: `空腹血糖 ${m.fastingGlucose} mmol/L 略高（目标 <6.1）`, en: `Fasting glucose ${m.fastingGlucose} mmol/L is slightly high (target <6.1)`, shortZh: `空腹血糖 ${m.fastingGlucose} 略高`, shortEn: `Fasting glucose slightly high` });
  } else {
    reasons.push({ tone: "good", clinical: true, zh: `空腹血糖 ${m.fastingGlucose} mmol/L 在目标内（<6.1）`, en: `Fasting glucose ${m.fastingGlucose} mmol/L is in target (<6.1)`, shortZh: `空腹血糖达标`, shortEn: `Fasting glucose in target` });
  }
  if (p.checkinDays <= 2) {
    reasons.push({ tone: "bad", clinical: false, zh: `近7天只打卡 ${p.checkinDays} 天，联系太少，需要优先联系`, en: `Only ${p.checkinDays} check-in day(s) in the last 7 days — too little contact, reach out first`, shortZh: `近7天只打卡 ${p.checkinDays} 天`, shortEn: `Only ${p.checkinDays}/7 check-ins` });
  } else if (p.checkinDays <= 5) {
    reasons.push({ tone: "warn", clinical: false, zh: `近7天打卡 ${p.checkinDays}/7 天，不够规律`, en: `${p.checkinDays}/7 check-in days in the last 7 days — not regular enough`, shortZh: `打卡 ${p.checkinDays}/7 天，不够规律`, shortEn: `${p.checkinDays}/7 check-ins` });
  } else {
    reasons.push({ tone: "good", clinical: false, zh: `近7天打卡 ${p.checkinDays}/7 天，比较规律`, en: `${p.checkinDays}/7 check-in days in the last 7 days — regular`, shortZh: `打卡 ${p.checkinDays}/7 天，规律`, shortEn: `${p.checkinDays}/7 check-ins, regular` });
  }
  return reasons;
}

function statusWhyShort(p: Patient, viewerRole?: ViewerRole): { zh: string; en: string } {
  const all = statusReasons(p);
  const visible = viewerRole && !canSeeClinical(viewerRole) ? all.filter((r) => !r.clinical) : all;
  if (viewerRole && !canSeeClinical(viewerRole)) {
    const c = visible[0];
    return { zh: c ? `为什么：${c.shortZh} · 临床原因已隐藏（前台无权限）` : "为什么：临床原因已隐藏（前台无权限）", en: c ? `Why: ${c.shortEn} · Clinical reasons hidden for this role` : "Why: clinical reasons hidden for this role" };
  }
  const concerns = visible.filter((r) => r.tone !== "good");
  if (concerns.length === 0) return { zh: "为什么：指标都在目标内，打卡规律", en: "Why: all key measures in target, regular check-ins" };
  const sorted = [...concerns].sort((a, b) => (a.tone === "bad" ? 0 : 1) - (b.tone === "bad" ? 0 : 1));
  if (p.status === "绿") return { zh: `为什么：基本达标，需留意 ${sorted.map((r) => r.shortZh).join(" · ")}`, en: `Why: broadly on track — watch ${sorted.map((r) => r.shortEn).join(" · ")}` };
  return { zh: `为什么：${sorted.map((r) => r.shortZh).join(" · ")}`, en: `Why: ${sorted.map((r) => r.shortEn).join(" · ")}` };
}

function statusActionAdvice(status: string): { zh: string; en: string } {
  if (status === "红") return { zh: "建议下一步：优先联系这位患者，请医生复核血压和血糖，必要时转诊；先处理风险，不要只催打卡。", en: "Next step: contact this patient first, ask a physician to review blood pressure and glucose, and refer if needed — deal with the risk first, not just check-ins." };
  if (status === "黄") return { zh: "建议下一步：由教练提醒一次，复查偏高的那一项，看看打卡或目标哪里卡住了。", en: "Next step: a coach reminder, re-check the measure that is high, and find where check-ins or goals are getting stuck." };
  return { zh: "建议下一步：继续当前计划，保持打卡，下次随访时复查。", en: "Next step: keep the current plan, keep checking in, and re-check at the next follow-up." };
}

function StatusLegend() {
  return (
    <Card title="状态怎么看 · 为什么是这个颜色？ How to read the colours — why red, amber or green?">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg p-3" style={{ background: "#eaf4ec" }}>
          <p className="flex items-center gap-2 font-bold"><span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: GREEN }} />绿 Green — 基本达标 On track</p>
          <p className="mt-1 text-sm">主要指标（HbA1c、血压、空腹血糖）在目标内，近7天打卡规律。继续保持当前计划。</p>
          <p className="mt-1 text-xs text-[var(--dim)]">Key measures are in target and check-ins are regular. Keep the current plan.</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#fbf3d9" }}>
          <p className="flex items-center gap-2 font-bold"><span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: AMBER }} />黄 Amber — 需要关注 Needs attention</p>
          <p className="mt-1 text-sm">有一两项指标偏高或接近上限，或者打卡不够规律。需要提醒一次，并复查偏高的指标。</p>
          <p className="mt-1 text-xs text-[var(--dim)]">One or two measures are high or borderline, or check-ins are irregular. Remind and re-check.</p>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#fdecec" }}>
          <p className="flex items-center gap-2 font-bold"><span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: RED }} />红 Red — 优先处理 Priority</p>
          <p className="mt-1 text-sm">指标明显偏高（如 HbA1c ≥6.5% 或血压明显升高），并且/或者近7天很少打卡。需要优先联系，请医生复核。</p>
          <p className="mt-1 text-xs text-[var(--dim)]">Measures are clearly high (e.g. HbA1c ≥6.5% or blood pressure well above target) and/or very few check-ins. Contact first and get a physician review.</p>
        </div>
      </div>
    </Card>
  );
}

function StatusWhyPanel({ p, viewerRole }: { p: Patient; viewerRole?: ViewerRole }) {
  const reasons = statusReasons(p);
  const hideClinical = viewerRole ? !canSeeClinical(viewerRole) : false;
  const visible = hideClinical ? reasons.filter((r) => !r.clinical) : reasons;
  const concerns = reasons.filter((r) => r.tone !== "good");
  const sorted = [...visible].sort((a, b) => (a.tone === "bad" ? 0 : a.tone === "warn" ? 1 : 2) - (b.tone === "bad" ? 0 : b.tone === "warn" ? 1 : 2));
  const advice = statusActionAdvice(p.status);
  const headline = hideClinical
    ? "前台视图不显示临床数值原因，下面只显示打卡情况；完整原因请由有临床权限的角色查看。"
    : concerns.length === 0
      ? `${p.id} 是${p.status}灯，主要是因为主要指标都在目标内、打卡也规律。`
      : p.status === "绿"
        ? `${p.id} 是绿灯：主要指标基本达标，需要留意的是：${concerns.map((r) => r.shortZh).join("、")}。`
        : `${p.id} 是${p.status}灯，主要是因为：${concerns.map((r) => r.shortZh).join("、")}。`;
  return (
    <Card title={`为什么是${p.status}灯？ Why is ${p.id} ${STATUS_EN[p.status] ?? p.status}?`}>
      <p className="text-sm font-medium">{headline}</p>
      {hideClinical ? <p className="mt-1 text-xs text-[var(--dim)]">Front-desk view: clinical reasons are hidden on a need-to-know basis; only the check-in reason is shown below.</p> : null}
      <ul className="mt-3 space-y-2">
        {sorted.map((r) => (
          <li key={r.zh} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.tone === "bad" ? RED : r.tone === "warn" ? AMBER : GREEN }} aria-hidden="true" />
            <span>{r.tone === "good" ? "✓ " : r.tone === "bad" ? "需处理：" : "需关注："}{r.zh}<br /><span className="text-xs text-[var(--dim)]">{r.en}</span></span>
          </li>
        ))}
      </ul>
      <p className="mt-3 rounded-lg bg-[var(--surface-alt)] p-3 text-sm"><strong>{advice.zh}</strong><br /><span className="text-[var(--dim)]">{advice.en}</span></p>
    </Card>
  );
}

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm ${className}`}>
      {title ? <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>{title}</h3> : null}
      {children}
    </section>
  );
}

function Progress({ pct, color = TEAL }: { pct: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ece5d3]" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  );
}

/* ---------- Sub-tabs (second-level navigation inside a main tab) ----------
   A scrollable bilingual row that splits one long tab into sections.
   The main 10-tab bar is unchanged; these sit inside each tab. */
function SubTabs<T extends string>({ tabs, value, onChange, label }: {
  tabs: { key: T; zh: string; en: string; count?: number }[];
  value: T;
  onChange: (k: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button key={t.key} type="button" role="tab" aria-selected={active}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${active ? "text-white" : ""}`}
            style={active ? { background: TEAL } : { color: TEAL }}
            onClick={() => onChange(t.key)}>
            {t.zh} <span className="font-normal opacity-75">{t.en}</span>
            {t.count != null ? <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-xs font-bold">{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- SVG chart helpers ---------- */
function LineChart({ series, width = 640, height = 220, yMin, yMax, xLabels }: {
  series: { label: string; color: string; points: number[] }[];
  width?: number; height?: number; yMin: number; yMax: number; xLabels: [string, string];
}) {
  const padL = 38, padR = 10, padT = 12, padB = 26;
  const iw = width - padL - padR, ih = height - padT - padB;
  const all = series[0]?.points ?? [];
  const n = Math.max(2, all.length);
  const X = (i: number) => padL + (i / (n - 1)) * iw;
  const Y = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * ih;
  const ticks = [yMin, (yMin + yMax) / 2, yMax];
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={series.map((s) => s.label).join(", ")}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={Y(t)} y2={Y(t)} stroke="#e7dfca" />
            <text x={padL - 5} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="#5f6f6b">{Number(t.toFixed(1))}</text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.label}>
            <polyline fill="none" stroke={s.color} strokeWidth="2.5" points={s.points.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} />
            {s.points.map((v, i) => (<circle key={i} cx={X(i)} cy={Y(v)} r="3" fill={s.color} />))}
          </g>
        ))}
        <text x={padL} y={height - 6} fontSize="11" fill="#5f6f6b">{xLabels[0]}</text>
        <text x={width - padR} y={height - 6} textAnchor="end" fontSize="11" fill="#5f6f6b">{xLabels[1]}</text>
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--dim)]">
        {series.map((s) => (<span key={s.label} className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>))}
      </div>
    </div>
  );
}

function Donut({ green, amber, red }: { green: number; amber: number; red: number }) {
  const total = Math.max(1, green + amber + red);
  const segs = [
    { v: green, c: GREEN, label: `绿 Green ${green} (${((green / total) * 100).toFixed(1)}%)` },
    { v: amber, c: AMBER, label: `黄 Amber ${amber} (${((amber / total) * 100).toFixed(1)}%)` },
    { v: red, c: RED, label: `红 Red ${red} (${((red / total) * 100).toFixed(1)}%)` },
  ];
  let acc = 0;
  const R = 52, C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0" role="img" aria-label="Status mix donut">
        {segs.map((s) => {
          const frac = s.v / total;
          const el = (
            <circle key={s.label} cx="70" cy="70" r={R} fill="none" stroke={s.c} strokeWidth="22"
              strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} transform="rotate(-90 70 70)" />
          );
          acc += frac;
          return el;
        })}
        <text x="70" y="76" textAnchor="middle" fontSize="20" fontWeight="700" fill={TEAL}>{total}</text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segs.map((s) => (<li key={s.label} className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded" style={{ background: s.c }} />{s.label}</li>))}
      </ul>
    </div>
  );
}

/* ---------- shared filter logic ---------- */
type Filters = { stage: string; sex: string; age: string; status: string };
const NO_FILTERS: Filters = { stage: "全部", sex: "全部", age: "全部", status: "全部" };
function applyFilters(list: Patient[], f: Filters, search = "") {
  return list.filter((p) => {
    if (search && !p.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (f.stage !== "全部" && p.stage !== f.stage) return false;
    if (f.sex !== "全部" && p.sex !== f.sex) return false;
    if (f.status !== "全部" && p.status !== f.status) return false;
    if (f.age === "20–39" && !(p.age >= 20 && p.age <= 39)) return false;
    if (f.age === "40–59" && !(p.age >= 40 && p.age <= 59)) return false;
    if (f.age === "60+" && !(p.age >= 60)) return false;
    return true;
  });
}
function hasFilters(f: Filters, search = "") {
  return search !== "" || f.stage !== "全部" || f.sex !== "全部" || f.age !== "全部" || f.status !== "全部";
}

function FilterBar({ f, setF, idPrefix }: { f: Filters; setF: (f: Filters) => void; idPrefix: string }) {
  const sel = "rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm";
  return (
    <div className="flex flex-wrap gap-2">
      <label className="text-sm">阶段 Stage
        <select aria-label="Stage filter" className={`${sel} ml-1`} value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })}>
          <option value="全部">全部 All</option><option value="基线">基线 Baseline</option><option value="第12周">第12周 Week 12</option><option value="第24周">第24周 Week 24</option>
        </select></label>
      <label className="text-sm">性别 Sex
        <select aria-label="Sex filter" className={`${sel} ml-1`} value={f.sex} onChange={(e) => setF({ ...f, sex: e.target.value })}>
          <option value="全部">全部 All</option><option value="女">女 Female</option><option value="男">男 Male</option>
        </select></label>
      <label className="text-sm">年龄 Age
        <select aria-label="Age filter" className={`${sel} ml-1`} value={f.age} onChange={(e) => setF({ ...f, age: e.target.value })}>
          <option value="全部">全部 All</option><option value="20–39">20–39</option><option value="40–59">40–59</option><option value="60+">60+</option>
        </select></label>
      <label className="text-sm">状态 Status
        <select aria-label="Status filter" className={`${sel} ml-1`} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="全部">全部 All</option><option value="绿">绿 Green</option><option value="黄">黄 Amber</option><option value="红">红 Red</option>
        </select></label>
      <span className="hidden">{idPrefix}</span>
    </div>
  );
}

/* ================= Dashboard ================= */
const CHANGE_BARS: { label: string; pct: number }[] = [
  { label: "体重 Weight kg", pct: -3.1 }, { label: "腰围 Waist cm", pct: -2.8 },
  { label: "内脏脂肪 Visceral fat level", pct: -7.9 }, { label: "糖化血红蛋白 HbA1c %", pct: -5.3 },
  { label: "收缩压 Systolic BP mmHg", pct: -4.2 }, { label: "舒张压 Diastolic BP mmHg", pct: -4.3 },
  { label: "空腹血糖 Fasting glucose mmol/L", pct: -6.4 }, { label: "LDL cholesterol mmol/L", pct: -5.6 },
  { label: "甘油三酯 Triglycerides mmol/L", pct: -6.3 }, { label: "体脂率 Body fat %", pct: -5.7 },
  { label: "骨骼肌量 Skeletal muscle kg", pct: 1.6 }, { label: "6分钟步行 6-min walk m", pct: 4.5 },
  { label: "握力 Grip strength kg", pct: 3.0 }, { label: "PHQ-9", pct: -17.6 },
  { label: "GAD-7", pct: -16.7 }, { label: "PSQI sleep", pct: -14.3 },
];

/* ================= My day 我的今天 (role login demo) =================
   Picking a role at the top is this demo's way of "logging in" as that
   team member. Each role sees the general overview below plus ONLY its
   own tasks here. Lists are intentionally light — a few sample tasks,
   marked as examples; real tasks are filled in later by the team. */
type MyDayTask = { id: string; pri: 0 | 1 | 2 | 3; pid: string; type: string; zh: string; en: string; due: string };
const MYDAY_PRI_LABEL = ["紧急 Urgent", "逾期/重要 Overdue", "今天 Today", "常规 Routine"];
const MYDAY_PRI_COLOR = [RED, AMBER, GREEN, "#8a7f63"];

const PHYSICIAN_ADMIN_TASKS: MyDayTask[] = [
  { id: "padm-1", pri: 2, pid: "", type: "排班 Rota", zh: "确认下周门诊排班", en: "Confirm next week's clinic rota", due: "2026-11-23" },
  { id: "padm-2", pri: 3, pid: "", type: "报告签署 Sign-off", zh: "签署第12周复评报告 3 份", en: "Sign off 3 week-12 re-test reports", due: "2026-11-24" },
  { id: "padm-3", pri: 3, pid: "", type: "同意书模板 Consent template", zh: "复核知情同意书模板更新", en: "Review the updated consent-form template", due: "2026-11-25" },
  { id: "padm-4", pri: 3, pid: "", type: "审计查看 Audit review", zh: "看一眼本周审计日志有无异常", en: "Glance at this week's audit log for anything unusual", due: "2026-11-25" },
];
const FRONTDESK_TASKS: MyDayTask[] = [
  { id: "fd-1", pri: 2, pid: "P003", type: "入组登记 Enrollment", zh: "确认入组表格和联系方式", en: "Confirm enrollment form and contact details", due: "2026-11-23" },
  { id: "fd-2", pri: 3, pid: "P007", type: "预约 Appointment", zh: "确认下一次随访时间", en: "Confirm the next follow-up appointment", due: "2026-11-23" },
  { id: "fd-3", pri: 3, pid: "P001", type: "同意书归档 Consent filing", zh: "归档已签署的同意书", en: "File the signed consent form", due: "2026-11-24" },
  { id: "fd-4", pri: 3, pid: "P014", type: "到诊提醒 Visit reminder", zh: "电话提醒明天到诊", en: "Phone reminder about tomorrow's visit", due: "2026-11-23" },
];
const ADMIN_TASKS: MyDayTask[] = [
  { id: "adm-1", pri: 2, pid: "", type: "账号权限 Permissions", zh: "复核新账号的权限范围", en: "Review permissions for new accounts", due: "2026-11-23" },
  { id: "adm-2", pri: 3, pid: "", type: "审计日志 Audit log", zh: "查看本周审计日志", en: "Check this week's audit log", due: "2026-11-24" },
  { id: "adm-3", pri: 3, pid: "", type: "备份 Backup", zh: "确认昨晚备份已完成", en: "Confirm last night's backup completed", due: "2026-11-23" },
  { id: "adm-4", pri: 3, pid: "", type: "登录安全 Sign-in security", zh: "检查有无异常登录提醒", en: "Check for unusual sign-in alerts", due: "2026-11-25" },
];

function staffRoleStringForViewer(r: ViewerRole): string {
  switch (r) {
    case "doctor": return "医生 Physician";
    case "dietitian": return "营养师 Dietitian";
    case "exercise": return "运动/康复师 Exercise specialist";
    case "counselor": return "心理/睡眠咨询师 Counselor";
    case "coach": return "健康教练 Health coach";
    case "nurse": return "护士/技师 Nurse or technician";
    default: return "";
  }
}

const FAMILY_TASKS: MyDayTask[] = [
  { id: "fam-1", pri: 1, pid: "", type: "家人观察 Family observation", zh: "查看所照顾患者今天的清单完成情况", en: "Check your patient's checklist for today", due: "" },
  { id: "fam-2", pri: 2, pid: "", type: "上传 Upload", zh: "有新的处方或化验报告时上传（照片 / PDF / Excel）", en: "Upload any new prescription or lab report (photo / PDF / Excel)", due: "" },
  { id: "fam-3", pri: 2, pid: "", type: "夜间照护 Night care", zh: "夜间巡查与晨间护理（见「今日」的家人视图）", en: "Night checks and morning care (see the Family view in Today)", due: "" },
];
const AIDE_TASKS: MyDayTask[] = [
  { id: "aide-1", pri: 1, pid: "", type: "照护清单 Care checklist", zh: "完成「今日」清单里护工负责的项目", en: "Complete the aide items on today's checklist", due: "" },
  { id: "aide-2", pri: 1, pid: "", type: "喂药打勾 Dose ticks", zh: "喂药后在「用药与化验」里打勾（护工只打勾，不上传文件）", en: "Tick off each dose under Medications & Labs after giving it (the aide ticks only — no file uploads)", due: "" },
  { id: "aide-3", pri: 2, pid: "", type: "训练前检查 Pre-training check", zh: "训练前量血压、脉搏、血氧，超标不练", en: "Take BP, pulse and SpO2 before training; skip if over the limits", due: "" },
];
const MANAGER_TASKS: MyDayTask[] = [
  { id: "mgr-1", pri: 1, pid: "", type: "执行率 Execution", zh: "查看本周执行率（运动与认知 → 训练记录）", en: "Review this week's execution rates (Exercise & Brain → Records)", due: "" },
  { id: "mgr-2", pri: 2, pid: "", type: "随访 Follow-up", zh: "跟进到期的化验和未完成的随访", en: "Follow up due lab checks and open follow-ups", due: "" },
  { id: "mgr-3", pri: 2, pid: "", type: "周报 Weekly report", zh: "周日晚把一周小结发给家人", en: "Send the weekly summary to the family on Sunday evening", due: "" },
];
const PATIENT_TASKS: MyDayTask[] = [
  { id: "pat-1", pri: 1, pid: "", type: "每日记录 Daily log", zh: "填写「记录我的一天」", en: "Fill in Log my day", due: "" },
  { id: "pat-2", pri: 3, pid: "", type: "目标 Goals", zh: "看一眼本周目标进度", en: "Check this week's goal progress", due: "" },
];

/* ---- People model: real people, each assigned to ONE role and to the
   patient they serve in that role. Roles are chosen per patient; choosing
   a role brings that role's task list for that patient. Family is a role
   like any other. Care-team roles start as empty slots (no name yet). ---- */
const MEMBER_ROLES: { key: string; zh: string; en: string }[] = [
  { key: "family", zh: "家人", en: "Family" },
  { key: "patient", zh: "患者", en: "Patient" },
  { key: "doctor", zh: "医生", en: "Physician" },
  { key: "nurse", zh: "护士", en: "Nurse" },
  { key: "dietitian", zh: "营养师", en: "Dietitian" },
  { key: "exercise", zh: "治疗师", en: "Therapist" },
  { key: "manager", zh: "健康管理师", en: "Health manager" },
  { key: "aide", zh: "护工", en: "Aide" },
  { key: "coach", zh: "健康教练", en: "Health coach" },
  { key: "counselor", zh: "心理/睡眠咨询师", en: "Counselor" },
  { key: "frontdesk", zh: "前台", en: "Front desk" },
  { key: "admin", zh: "管理员", en: "Admin" },
];
function memberRoleLabel(roleKey: string) { const r = MEMBER_ROLES.find((x) => x.key === roleKey); return r ? `${r.zh} ${r.en}` : roleKey; }
type TeamMemberRow = { id: number; name: string; roleKey: string; patientId: string; note: string };
function personLabel(m: TeamMemberRow) { return m.name ? `${m.name} · ${memberRoleLabel(m.roleKey)}` : `${memberRoleLabel(m.roleKey)} · 待填名字 Name to fill in`; }
function memberPatientLabel(patientId: string) { return patientId === "patient-zero" ? "Patient Zero · 爸爸 Dad" : patientId === "" ? "未分配 Not assigned yet" : patientId; }

const TEAM_ROLE_OPTIONS = ["family", "nurse", "doctor", "dietitian", "exercise", "manager", "aide"];
const ROLE_TEAM_TASKS: Record<string, { zh: string; en: string }[]> = {
  family: [
    { zh: "夜间巡查与晨间护理", en: "Night checks and morning care" },
    { zh: "上传处方与化验报告（照片 / PDF / Excel）", en: "Upload prescriptions and lab reports (photo / PDF / Excel)" },
    { zh: "记录家人观察，写进每日小结", en: "Add family observations to the daily note" },
  ],
  nurse: [
    { zh: "量血压、体测并记录", en: "Take BP and measurements, record them" },
    { zh: "照着处方附件核对药单、录入化验结果", en: "Check the medication list against the prescription attachment; enter lab results" },
    { zh: "上门护理与伤口/皮肤检查记录", en: "Home-visit nursing and skin checks" },
  ],
  doctor: [
    { zh: "看诊与复查，审阅化验结果", en: "Consultations, reviews, reading lab results" },
    { zh: "照着处方照片/文件核对并录入药单", en: "Read the prescription photo/file and type in the medication list" },
    { zh: "调整方案 — 改药、停药、加药由医生决定", en: "Adjust the plan — medicine changes are the doctor's decision" },
  ],
  dietitian: [
    { zh: "营养计算与食谱安排", en: "Nutrition calculation and meal planning" },
    { zh: "每周饮食复盘，确认后发给患者", en: "Weekly food review, confirmed before it goes to the patient" },
    { zh: "体重与体成分跟进", en: "Weight and body-composition follow-up" },
  ],
  exercise: [
    { zh: "训练前安全检查（血压、脉搏、血氧、体温）", en: "Pre-training safety check (BP, pulse, SpO2, temperature)" },
    { zh: "运动记录、站立进阶与第 4 周检查点", en: "Exercise records, standing progression, Week-4 checkpoint" },
    { zh: "认知训练安排与记录", en: "Brain-training plan and records" },
  ],
  manager: [
    { zh: "每周执行率与周日晚周报", en: "Weekly execution rates and the Sunday-evening report" },
    { zh: "随访安排与到期提醒", en: "Follow-up scheduling and due-date reminders" },
    { zh: "协调团队成员与家人", en: "Coordinate the team and the family" },
  ],
  aide: [
    { zh: "每日照护清单（白天时段）", en: "Daily care checklist (daytime)" },
    { zh: "喂药后打勾 — 只打勾，不上传文件", en: "Tick off doses after giving them — ticks only, no file uploads" },
    { zh: "陪练运动与认知训练，记录完成情况", en: "Accompany exercise and brain training, record completion" },
  ],
};

function PatientTeamRolesEditor({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const rolesQ = useQuery({ queryKey: ["patientTeamRoles"], queryFn: async () => await api.listPatientTeamRoles({}) });
  const membersQ = useQuery({ queryKey: ["teamMembers"], queryFn: async () => await api.listTeamMembers({}) });
  const pairs = rolesQ.data?.pairs ?? [];
  const members = (membersQ.data?.members ?? []) as TeamMemberRow[];
  const onRoles = new Set(pairs.filter((x) => x.patientId === patientId).map((x) => x.roleKey));
  const toggle = useMutation({
    mutationFn: async (v: { roleKey: string; on: boolean }) => await api.setPatientTeamRole({ patientId, roleKey: v.roleKey, on: v.on }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["patientTeamRoles"] }); },
  });
  return (
    <div>
      <p className="text-sm text-[var(--dim)]">勾选这位患者的团队角色 — 选上一个角色，这个角色的任务就出现在这位患者名下，做事的人是团队成员里分到这个角色的人。Tick the roles on this patient's team — choosing a role brings that role's tasks for this patient; the person who does them is the team member assigned to that role for this patient.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TEAM_ROLE_OPTIONS.map((rk) => (
          <label key={rk} className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm">
            <input type="checkbox" checked={onRoles.has(rk)} onChange={(e) => toggle.mutate({ roleKey: rk, on: e.target.checked })} /> {memberRoleLabel(rk)}
          </label>
        ))}
      </div>
      {TEAM_ROLE_OPTIONS.filter((rk) => onRoles.has(rk)).map((rk) => {
        const people = members.filter((m) => m.patientId === patientId && m.roleKey === rk);
        return (
          <div key={rk} className="mt-3 rounded-lg bg-[var(--surface-alt)] p-3">
            <p className="text-sm font-bold" style={{ color: TEAL }}>{memberRoleLabel(rk)} — {people.length > 0 ? people.map((m) => (m.name || "待填名字 Name to fill in")).join("、") : "空缺 Vacant — 在「团队成员」里填名字和负责的患者"}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {(ROLE_TEAM_TASKS[rk] ?? []).map((t) => (<li key={t.zh}>{t.zh} <span className="text-xs text-[var(--dim)]">{t.en}</span></li>))}
            </ul>
          </div>
        );
      })}
      {onRoles.size === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">还没有选任何角色。No roles chosen for this patient yet.</p> : null}
    </div>
  );
}

function TeamMembersPanel({ patients }: { patients: Patient[] }) {
  const queryClient = useQueryClient();
  const membersQ = useQuery({ queryKey: ["teamMembers"], queryFn: async () => await api.listTeamMembers({}) });
  const members = (membersQ.data?.members ?? []) as TeamMemberRow[];
  type MemberForm = { id?: number; name: string; roleKey: string; patientId: string; note: string };
  const [form, setForm] = useState<MemberForm | null>(null);
  const [err, setErr] = useState("");
  const save = useMutation({
    mutationFn: async (f: MemberForm) => await api.saveTeamMember({ ...(f.id ? { id: f.id } : {}), name: f.name, roleKey: f.roleKey, patientId: f.patientId, note: f.note }),
    onSuccess: () => { setForm(null); setErr(""); void queryClient.invalidateQueries({ queryKey: ["teamMembers"] }); },
    onError: (e) => setErr(`保存失败 Save failed: ${e instanceof Error ? e.message : String(e)}`),
  });
  const del = useMutation({
    mutationFn: async (id: number) => await api.deleteTeamMember({ id }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["teamMembers"] }); },
  });
  const groups: { key: string; label: string; items: TeamMemberRow[] }[] = [];
  const pz = members.filter((m) => m.patientId === "patient-zero");
  if (pz.length > 0) groups.push({ key: "patient-zero", label: "Patient Zero · 爸爸 Dad 的团队 His team", items: pz });
  for (const p of patients) { const items = members.filter((m) => m.patientId === p.id); if (items.length > 0) groups.push({ key: p.id, label: `${p.id} 的团队 Team`, items }); }
  const others = members.filter((m) => m.patientId !== "" && m.patientId !== "patient-zero" && !patients.some((p) => p.id === m.patientId));
  if (others.length > 0) groups.push({ key: "other", label: "其他患者 Other patients", items: others });
  const unassigned = members.filter((m) => m.patientId === "");
  if (unassigned.length > 0) groups.push({ key: "unassigned", label: "未分配到患者 Not assigned to a patient yet", items: unassigned });
  return (
    <div className="space-y-4">
      <Card title="团队成员 Team members — 每个人一条 One entry per person">
        <p className="text-sm">每个人都是单独一条：一个名字、一个角色、负责一位患者，能看什么、能填什么、能不能上传文件，都按角色来。不同患者可以有不同的团队成员 — 一位患者的护士或护工，不自动是另一位患者的。家人也是角色之一：Helen、姐姐、哥哥是爸爸（Patient Zero）的家人角色，他们在家人门户里看爸爸的完整情况。护理团队的角色先留空缺，之后填真名。下一步：每人独立登录 — 现在先用页面顶部的名单切换查看身份。Each person is their own entry: one name, one role, one patient they serve — what they see, enter and upload follows their role. Different patients can have different team members: one patient's nurse or aide is not automatically another's. Family is one of the roles: Helen, her sister and her brother hold the family role for their dad (Patient Zero) and see his complete picture through the Family Portal. Care-team roles start as empty slots, to fill in with real names later. Next step: per-person logins — for now, use the people switcher at the top of the page to view as each person.</p>
      </Card>
      <Card title="Patient Zero 的团队角色 Team roles for Patient Zero">
        <PatientTeamRolesEditor patientId="patient-zero" />
      </Card>
      {groups.map((g) => (
        <Card key={g.key} title={g.label}>
          <div className="space-y-2">
            {g.items.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] p-3">
                <span className="font-semibold">{m.name || "（空缺 — 待填名字 Vacant — name to fill in）"}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: "var(--accent-light)", color: TEAL }}>{memberRoleLabel(m.roleKey)}</span>
                <span className="text-sm text-[var(--dim)]">负责 Serves: {memberPatientLabel(m.patientId)}</span>
                {m.note ? <span className="text-xs text-[var(--dim)]">{m.note}</span> : null}
                <span className="ml-auto flex gap-2">
                  <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold" onClick={() => setForm({ id: m.id, name: m.name, roleKey: m.roleKey, patientId: m.patientId, note: m.note })}>编辑 Edit</button>
                  <button type="button" className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: RED, color: RED }} onClick={() => del.mutate(m.id)}>删除 Delete</button>
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
      {form ? (
        <Card title={form.id ? "编辑成员 Edit member" : "加一位成员 Add a member"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">姓名 Name（空缺就留空 Leave blank for an empty slot）
              <input {...FIELDS.saveTeamMember.name} aria-label="Member name" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如 Helen" />
            </label>
            <label className="text-sm">角色 Role（一个人一个角色 One role per person）
              <select aria-label="Member role" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value })}>
                {MEMBER_ROLES.map((r) => (<option key={r.key} value={r.key}>{r.zh} {r.en}</option>))}
              </select>
            </label>
            <label className="text-sm">负责的患者 Patient they serve
              <select aria-label="Member patient" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
                <option value="">未分配 Not assigned yet</option>
                <option value="patient-zero">Patient Zero · 爸爸 Dad</option>
                {patients.map((p) => (<option key={p.id} value={p.id}>{p.id}</option>))}
              </select>
            </label>
            <label className="text-sm">备注 Note
              <input {...FIELDS.saveTeamMember.note} aria-label="Member note" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>
          </div>
          {err ? <p className="mt-2 text-sm" style={{ color: RED }}>{err}</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} disabled={save.isPending} onClick={() => save.mutate(form)}>保存 Save</button>
            <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" onClick={() => setForm(null)}>取消 Cancel</button>
          </div>
        </Card>
      ) : (
        <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => setForm({ name: "", roleKey: "nurse", patientId: "", note: "" })}>加一位成员 Add a member</button>
      )}
    </div>
  );
}

function sampleTasksForViewer(r: ViewerRole, physicianMode: "clinical" | "admin", patients?: Patient[]): MyDayTask[] {
  if (isPlaceholderRole(r)) return [];
  if (r === "doctor") {
    if (physicianMode === "admin") return PHYSICIAN_ADMIN_TASKS;
    // Clinical list reuses the physician queue from Staff entry (light: red alerts + message + follow-up).
    return tasksForRole("医生 Physician", patients).map((t) => ({ ...t }));
  }
  if (r === "frontdesk") return FRONTDESK_TASKS;
  if (r === "admin") return ADMIN_TASKS;
  if (r === "family") return FAMILY_TASKS;
  if (r === "aide") return AIDE_TASKS;
  if (r === "manager") return MANAGER_TASKS;
  if (r === "patient") return PATIENT_TASKS;
  const s = staffRoleStringForViewer(r);
  if (!s) return [];
  return tasksForRole(s, patients).map((t) => ({ ...t }));
}

/* Shared team goals — set by any role, visible to every role. Sample/demo goals only. */
const TEAM_GOALS: { pid: string; byZh: string; byEn: string; zh: string; en: string }[] = [
  { pid: "P001", byZh: "营养师 Dietitian", byEn: "set by the dietitian", zh: "营养目标：工作日午餐主食减半，小程序拍照记录", en: "Nutrition goal: halve lunch staples on workdays, photo-log meals" },
  { pid: "P001", byZh: "运动/康复师 Exercise specialist", byEn: "set by the exercise specialist", zh: "运动目标：每周快走 150 分钟，先做到 120 分钟", en: "Activity goal: 150 minutes of brisk walking a week, 120 first" },
  { pid: "P009", byZh: "健康教练 Health coach", byEn: "set by the health coach", zh: "教练目标：出差周也要打卡，血压隔天测一次", en: "Coach goal: keep checking in during the work trip; BP every other day" },
  { pid: "P005", byZh: "医生 Physician", byEn: "set by the physician", zh: "医疗目标：两周内复查血压和空腹血糖，再定下一步", en: "Medical goal: re-check BP and fasting glucose within two weeks" },
];

function TeamGoalsStrip({ goRecord }: { goRecord: (id: string) => void }) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3">
      <p className="text-sm font-bold" style={{ color: TEAL }}>团队目标 Team goals — 全队可见 Visible to everyone</p>
      <ul className="mt-2 grid gap-2 md:grid-cols-2">
        {TEAM_GOALS.map((g) => (
          <li key={g.pid + g.zh} className="rounded-lg bg-[var(--surface)] p-2.5 text-sm">
            <button type="button" className="font-bold underline" style={{ color: TEAL }} onClick={() => goRecord(g.pid)}>{g.pid}</button>
            <span className="ml-2 rounded-full bg-[#e3efec] px-2 py-0.5 text-xs font-semibold" style={{ color: TEAL }}>{g.byZh}</span>
            <p className="mt-1">{g.zh}<br /><span className="text-xs text-[var(--dim)]">{g.en} · {g.byEn}</span></p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MyDayPanel({ viewerRole, viewerName, goRecord, patients }: { viewerRole: ViewerRole; viewerName?: string; goRecord: (id: string) => void; patients: Patient[] }) {
  const queryClient = useQueryClient();
  const [physicianMode, setPhysicianMode] = useState<"clinical" | "admin">("clinical");
  const [done, setDone] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPid, setNewTaskPid] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [addErr, setAddErr] = useState("");
  const [noteTo, setNoteTo] = useState("健康教练 Health coach");
  const [notePid, setNotePid] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [noteErr, setNoteErr] = useState("");
  const notesQ = useQuery({ queryKey: ["teamNotes"], queryFn: () => api.listTeamNotes({}) });
  const customQ = useQuery({ queryKey: ["myDayTasks"], queryFn: () => api.listMyDayTasks({}) });
  const addTaskMut = useMutation({
    mutationFn: async () => await api.addMyDayTask({ roleKey: viewerRole, text: newTaskText.trim(), patientId: newTaskPid }),
    onSuccess: () => { setNewTaskText(""); setNewTaskPid(""); setAddMsg("已添加 Added ✓ 它会留在这个角色的清单里。It stays on this role's list."); void queryClient.invalidateQueries({ queryKey: ["myDayTasks"] }); },
    onError: (e: Error) => setAddErr(e.message || "添加失败，请再试一次。Could not add. Please try again."),
  });
  const noteMut = useMutation({
    mutationFn: async () => await api.addTeamNote({ fromRole: viewerLabel(viewerRole), toRole: noteTo, patientId: notePid, text: noteText.trim() }),
    onSuccess: () => { setNoteText(""); setNoteMsg("留言已发送 Sent ✓ 对方角色能在下方留言列表里看到。The other role can see it in the notes list below."); void queryClient.invalidateQueries({ queryKey: ["teamNotes"] }); },
    onError: (e: Error) => setNoteErr(e.message || "发送失败，请再试一次。Could not send. Please try again."),
  });
  const placeholder = isPlaceholderRole(viewerRole);
  const roleInfo = VIEWER_ROLES.find((v) => v.key === viewerRole);
  const sample = sampleTasksForViewer(viewerRole, physicianMode, patients);
  const custom = (customQ.data?.tasks ?? []).filter((t) => t.roleKey === viewerRole && (viewerRole !== "doctor" || physicianMode === "clinical"));
  const totalCount = sample.length + custom.length;
  const doneCount = [...sample.map((t) => t.id), ...custom.map((t) => `custom-${t.id}`)].filter((id) => done.includes(id)).length;
  const notes = notesQ.data?.notes ?? [];
  const pidLink = (pid: string) => /^P\d{3}$/.test(pid) ? (
    <button type="button" className="font-bold underline" style={{ color: TEAL }} onClick={() => goRecord(pid)}>{pid}</button>
  ) : pid ? <span className="font-semibold">{pid}</span> : <span className="text-[var(--dim)]">团队 Team</span>;
  return (
    <section aria-label="My day" className="rounded-xl border-2 bg-[var(--surface)] p-4 shadow-sm" style={{ borderColor: TEAL }}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold" style={{ color: TEAL }}>我的今天 My day — {viewerName ?? viewerLabel(viewerRole)}</h3>
      </div>

      {placeholder ? (
        <div className="mt-3 rounded-lg bg-[#fbf3d9] p-4 text-sm">
          <p className="font-bold">新角色 — 待定义 New role — to be defined</p>
          <p className="mt-1">这个角色还没有定义，暂时没有任务。团队以后会在这里补上这个角色能看什么、每天要做什么。</p>
        </div>
      ) : null}

      {viewerRole === "doctor" ? (
        <div className="mt-3">
          <p className="text-sm font-semibold">医生有两种工作，分开看，不混在一张长清单里：<span className="text-[var(--dim)]">A physician's two kinds of work stay separate — switch between them:</span></p>
          <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Physician task lists">
            <button type="button" role="tab" aria-selected={physicianMode === "clinical"} className="rounded-lg px-4 py-2 text-sm font-bold" style={physicianMode === "clinical" ? { background: TEAL, color: "#fff" } : { border: `2px solid ${TEAL}`, color: TEAL }} onClick={() => setPhysicianMode("clinical")}>看诊 Seeing patients（{sampleTasksForViewer("doctor", "clinical", patients).length + (customQ.data?.tasks ?? []).filter((t) => t.roleKey === "doctor").length}）</button>
            <button type="button" role="tab" aria-selected={physicianMode === "admin"} className="rounded-lg px-4 py-2 text-sm font-bold" style={physicianMode === "admin" ? { background: TEAL, color: "#fff" } : { border: `2px solid ${TEAL}`, color: TEAL }} onClick={() => setPhysicianMode("admin")}>管理 Administration（{PHYSICIAN_ADMIN_TASKS.length}）</button>
          </div>
          <p className="mt-1 text-xs text-[var(--dim)]">{physicianMode === "clinical" ? "现在看的是看诊清单：预警、患者消息和随访。You are seeing the patient-care list: alerts, patient messages and follow-ups." : "现在看的是管理清单：排班、签署和模板复核，和看诊分开。You are seeing the administration list: rota, sign-offs and template reviews — kept apart from patient care."}</p>
        </div>
      ) : null}

      {!placeholder ? (
        <div className="mt-3">
          <p className="text-sm text-[var(--dim)]">{viewerLabel(viewerRole)} · 今天 {totalCount} 项· 已完成 {doneCount}/{totalCount} — 自己角色的任务排在最上面。Your own role's tasks are at the top. {roleInfo ? `可见范围 Sees: ${roleInfo.sees}` : ""}</p>
          {totalCount === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">暂无任务。No tasks yet — add one below.</p> : null}
          <ul className="mt-2 space-y-2">
            {sample.map((t) => {
              const d = done.includes(t.id);
              return (
                <li key={t.id} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 text-sm" style={d ? { opacity: 0.55 } : undefined}>
                  <input type="checkbox" aria-label={`Mark done: ${t.zh}`} className="mt-0.5 h-5 w-5 shrink-0" checked={d} onChange={(e) => setDone(e.target.checked ? [...done, t.id] : done.filter((x) => x !== t.id))} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: MYDAY_PRI_COLOR[t.pri] }}>{MYDAY_PRI_LABEL[t.pri]}</span>
                      {pidLink(t.pid)}
                      <span className="font-semibold">{t.type}</span>
                      <span className="text-xs text-[var(--dim)]">截止 Due {t.due}</span>
                    </span>
                    <span className={`mt-1 block ${d ? "line-through" : ""}`}>{t.zh}<br /><span className="text-xs text-[var(--dim)]">{t.en}</span></span>
                  </span>
                </li>
              );
            })}
            {custom.map((t) => {
              const id = `custom-${t.id}`;
              const d = done.includes(id);
              return (
                <li key={id} className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 text-sm" style={d ? { opacity: 0.55 } : undefined}>
                  <input type="checkbox" aria-label={`Mark done: ${t.text}`} className="mt-0.5 h-5 w-5 shrink-0" checked={d} onChange={(e) => setDone(e.target.checked ? [...done, id] : done.filter((x) => x !== id))} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: TEAL }}>今天 Today</span>
                      {t.patientId ? pidLink(t.patientId) : <span className="text-[var(--dim)]">团队 Team</span>}
                      <span className="rounded-full bg-[#e3efec] px-2 py-0.5 text-xs font-bold" style={{ color: TEAL }}>团队新加 Added by team</span>
                    </span>
                    <span className={`mt-1 block ${d ? "line-through" : ""}`}>{t.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            {showAdd ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">添加任务 Add a task</p>
                <div className="flex flex-wrap gap-2">
                  <label className="min-w-[220px] flex-1 text-sm">任务 Task
                    <input {...FIELDS.addMyDayTask.text} aria-label="New task text" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="例如：复查 P003 的饮食照片 e.g. Review P003 food photos" />
                  </label>
                  <label className="text-sm">患者 Patient（可空 Optional）
                    <select aria-label="New task patient" className="mt-1 block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={newTaskPid} onChange={(e) => setNewTaskPid(e.target.value)}>
                      <option value="">—</option>
                      {patients.map((x) => (<option key={x.id} value={x.id}>{x.id}</option>))}
                    </select></label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={addTaskMut.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => { setAddMsg(""); setAddErr(""); if (!newTaskText.trim()) { setAddErr("请先写下任务。Please write the task first."); return; } addTaskMut.mutate(); }}>{addTaskMut.isPending ? "添加中… Adding…" : "添加到我的清单 Add to my list"}</button>
                  <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" onClick={() => setShowAdd(false)}>收起 Close</button>
                </div>
                {addMsg ? <p className="text-sm" role="status" style={{ color: GREEN }}>{addMsg}</p> : null}
                {addErr ? <p className="text-sm" role="alert" style={{ color: RED }}>{addErr}</p> : null}
              </div>
            ) : (
              <button type="button" className="rounded-lg border-2 border-dashed px-4 py-2 text-sm font-semibold" style={{ borderColor: TEAL, color: TEAL }} onClick={() => setShowAdd(true)}>＋ 添加任务 Add a task</button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <button type="button" disabled className="rounded-lg border-2 border-dashed px-4 py-2 text-sm font-semibold opacity-60" style={{ borderColor: TEAL, color: TEAL }} aria-disabled="true">＋ 添加任务 Add a task — 角色定义后开放 Available once this role is defined</button>
        </div>
      )}

      <TeamGoalsStrip goRecord={goRecord} />

      <div className="mt-4 rounded-lg border border-[var(--border)] p-3">
        <p className="text-sm font-bold" style={{ color: TEAL }}>团队留言 Team notes — 角色之间沟通 Messages between roles</p>
        {viewerRole === "dietitian" ? (
          <div className="mt-2 space-y-2">
            <p className="text-sm">营养师只看营养工作，但可以在这里给其他角色留言，留言保存在本应用中。<br /><span className="text-xs text-[var(--dim)]">The dietitian sees dietitian work only, but can leave a note for another role here; notes are saved in this app.</span></p>
            <div className="flex flex-wrap gap-2">
              <label className="text-sm">留给 To
                <select aria-label="Note recipient role" className="ml-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={noteTo} onChange={(e) => setNoteTo(e.target.value)}>
                  {["医生 Physician", "运动/康复师 Exercise specialist", "心理/睡眠咨询师 Counselor", "健康教练 Health coach", "护士/技师 Nurse or technician", "前台 Front desk", "管理员 Admin"].map((r) => (<option key={r} value={r}>{r}</option>))}
                </select></label>
              <label className="text-sm">患者 Patient（可空 Optional）
                <select aria-label="Note patient" className="ml-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={notePid} onChange={(e) => setNotePid(e.target.value)}>
                  <option value="">—</option>
                  {patients.map((x) => (<option key={x.id} value={x.id}>{x.id}</option>))}
                </select></label>
            </div>
            <label className="block text-sm">留言 Note
              <textarea {...FIELDS.addTeamNote.text} aria-label="Note for another role" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" rows={2} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="例如：P001 的营养目标已更新，请教练这周跟进打卡。e.g. P001 nutrition goal updated — coach, please follow up on check-ins this week." />
            </label>
            <button type="button" disabled={noteMut.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => { setNoteMsg(""); setNoteErr(""); if (!noteText.trim()) { setNoteErr("请先写下留言。Please write the note first."); return; } noteMut.mutate(); }}>{noteMut.isPending ? "发送中… Sending…" : "发送留言 Send note"}</button>
            {noteMsg ? <p className="text-sm" role="status" style={{ color: GREEN }}>{noteMsg}</p> : null}
            {noteErr ? <p className="text-sm" role="alert" style={{ color: RED }}>{noteErr}</p> : null}
          </div>
        ) : null}
        <div className="mt-3">
          {notesQ.isPending ? <p className="text-sm text-[var(--dim)]">留言加载中… Loading notes…</p> : null}
          {notesQ.error ? <p className="text-sm" style={{ color: RED }}>留言加载失败 Failed to load notes.</p> : null}
          {notesQ.data && notes.length === 0 ? <p className="text-sm text-[var(--dim)]">还没有留言。用营养师身份发送第一条留言后会显示在这里。No notes yet — the first note sent as the dietitian will appear here.</p> : null}
          <ul className="space-y-2">
            {notes.slice(0, 8).map((n) => (
              <li key={n.id} className="rounded-lg bg-[var(--surface-alt)] p-2.5 text-sm">
                <span className="font-semibold">{n.fromRole}</span> <span className="text-[var(--dim)]">→</span> <span className="font-semibold">{n.toRole}</span>
                {n.patientId ? <span className="ml-2">{pidLink(n.patientId)}</span> : null}
                <span className="ml-2 text-xs text-[var(--dim)]">{new Date(n.createdAt).toLocaleString("zh-CN")}</span>
                <p className="mt-0.5">{n.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Work Progress summary (Dashboard card) ---------- */
const ROADMAP_PHASE_LABELS = [
  { cn: "第0期 · 摸底·设计·原型", en: "Phase 0" },
  { cn: "第7–10周 · 培训与启动", en: "Train & launch" },
  { cn: "第11–22周 · 试点", en: "Pilot" },
  { cn: "第23–26周 · 评估与推广", en: "Evaluate & scale" },
];

function RoadmapSummaryCard({ goProgress }: { goProgress: () => void }) {
  const roadmapQ = useQuery({ queryKey: ["roadmap"], queryFn: () => api.getRoadmapState({}) });
  const weekQ = useQuery({ queryKey: ["thisWeek"], queryFn: () => api.getThisWeekTasks({}) });
  const d = roadmapQ.data;
  const pct = d && d.total ? Math.round((d.done / d.total) * 100) : 0;
  const phase = d && d.currentPhaseIndex != null ? ROADMAP_PHASE_LABELS[d.currentPhaseIndex] : null;
  const due = weekQ.data?.dueThisWeek ?? [];
  const dueOpen = due.filter((t) => !t.isDone).length;
  return (
    <Card title="项目工作进展 Project work progress — 整个项目（六条工作线）Whole project, all six workstreams">
      {roadmapQ.isPending ? <p className="text-sm text-[var(--dim)]">加载中… Loading…</p> : null}
      {roadmapQ.error ? <p className="text-sm" style={{ color: RED }}>进展加载失败 Failed to load progress.</p> : null}
      {d ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[var(--surface-alt)] p-3">
              <div className="text-2xl font-bold" style={{ color: TEAL }}>{pct}%</div>
              <div className="text-xs">已完成 Done<br /><span className="text-[var(--dim)]">{d.done} of {d.total} tasks</span></div>
            </div>
            <div className="rounded-lg bg-[var(--surface-alt)] p-3">
              <div className="text-2xl font-bold" style={{ color: TEAL }}>{d.status === "active" && d.currentWeek ? `第${d.currentWeek}周` : "—"}</div>
              <div className="text-xs">{d.status === "active" ? <>当前阶段 Current phase<br /><span className="text-[var(--dim)]">{phase ? `${phase.cn} ${phase.en}` : ""} · Week {d.currentWeek}</span></> : d.status === "before_start" ? <>尚未开始 Not started yet<br /><span className="text-[var(--dim)]">Starts {d.startDate}</span></> : d.status === "finished" ? <>26周已结束 Finished<br /><span className="text-[var(--dim)]">All 26 weeks done</span></> : <>开始日期未填 No start date yet<br /><span className="text-[var(--dim)]">Add the Week 1 date on the Work Progress tab</span></>}</div>
            </div>
            <div className="rounded-lg bg-[var(--surface-alt)] p-3">
              <div className="text-2xl font-bold" style={{ color: TEAL }}>{d.startDate && d.status === "active" ? due.length : "—"}</div>
              <div className="text-xs">本周任务 Due this week<br /><span className="text-[var(--dim)]">{d.startDate && d.status === "active" ? `${dueOpen} still open 待完成` : "Set the start date to see them"}</span></div>
            </div>
          </div>
          <div className="mt-3"><Progress pct={pct} /></div>
          <button type="button" className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={goProgress}>查看工作进展 View Work Progress →</button>
        </>
      ) : null}
    </Card>
  );
}

/* The prototype's "today" for follow-up gaps: the latest sample date used
   across the entry form and task due dates. */
const SAMPLE_TODAY = "2026-11-23";
function daysSinceFollowUp(p: Patient): number {
  const a = new Date(`${SAMPLE_TODAY}T00:00:00`).getTime();
  const b = new Date(`${p.followUp}T00:00:00`).getTime();
  return Math.max(0, Math.round((a - b) / 86400000));
}
/* Share of patients whose HbA1c fell by at least 0.3 from their baseline
   (baseline as shown in the Record tab / data export). One definition, used
   by both the Dashboard KPI and the Public outcomes page so they agree. */
function hba1cDroppedCount(list: Patient[]): number {
  return list.filter((p) => baselineFor(p).hba1cPct - p.measures.hba1cPct >= 0.299).length;
}

function Dashboard({ patients, goRecord, viewerRole, viewerName, goProgress }: { patients: Patient[]; goRecord: (id: string) => void; viewerRole: ViewerRole; viewerName?: string; goProgress: () => void }) {
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const filtered = useMemo(() => applyFilters(patients, f), [patients, f]);
  const active = hasFilters(f);
  /* Counts always come from the loaded patient rows — never hard-coded — so
     the headers, donut and risk tiers cannot drift from the list itself. */
  const counts = { total: filtered.length, g: filtered.filter((p) => p.status === "绿").length, a: filtered.filter((p) => p.status === "黄").length, r: filtered.filter((p) => p.status === "红").length };
  const contacted14 = patients.length ? Math.round((patients.filter((p) => daysSinceFollowUp(p) <= 14).length / patients.length) * 100) : 0;
  const week12Done = patients.filter((p) => p.stage === "第24周").length;
  const hba1cDown = hba1cDroppedCount(patients);
  const homeRate = patients.length ? Math.round((patients.reduce((s, p) => s + p.checkinDays, 0) / (patients.length * 7)) * 100) : 0;
  const pendingFood = buildDataset(patients).foodLogs.filter((x) => String(x.status).includes("待点评")).length;
  const sourceCounts = (["医生转诊", "小程序", "社区筛查"] as const).map((s) => ({ zh: `${s} ${SOURCE_EN[s]}`, n: patients.filter((p) => p.source === s).length }));
  const reachOut = [...patients].sort((a, b) => daysSinceFollowUp(b) - daysSinceFollowUp(a)).slice(0, 2);
  const redIds = filtered.filter((p) => p.status === "红").map((p) => p.id);
  const amberIds = filtered.filter((p) => p.status === "黄").map((p) => p.id);
  const fewestCheckins = [...filtered].sort((a, b) => a.checkinDays - b.checkinDays).slice(0, 2);
  const glucose14 = (base: number, end: number) => Array.from({ length: 14 }, (_, i) => {
    const t = i / 13;
    return base + (end - base) * t + Math.sin(i * 1.7) * 0.12;
  });
  const trend = (from: number, to: number) => Array.from({ length: 12 }, (_, i) => from + ((to - from) * i) / 11 + Math.sin(i * 1.3) * 0.04);
  const [sub, setSub] = useState<"myday" | "overview" | "patients" | "trends">("myday");
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>运营看板 · 院后健康慢病管理数据平台</h2>
        <p className="text-sm text-[var(--dim)]">Houyuan Health · Chronic-disease data platform</p>
      </div>
      <SubTabs label="Dashboard sections" value={sub} onChange={setSub} tabs={[
        { key: "myday", zh: "我的今天", en: "My day" },
        { key: "overview", zh: "总览", en: "Overview" },
        { key: "patients", zh: "患者概况", en: "Patients at a glance" },
        { key: "trends", zh: "趋势与进度", en: "Trends & progress" },
      ]} />
      {sub === "myday" ? (
        <div className="space-y-4">
          <MyDayPanel viewerRole={viewerRole} viewerName={viewerName} goRecord={goRecord} patients={patients} />
          <p className="text-sm font-semibold" style={{ color: TEAL }}>患者总体进展在「总览 / 患者概况 / 趋势与进度」子标签里 — 所有角色都能看 General patient progress is under the Overview, Patients at a glance and Trends sub-tabs — visible to every role</p>
          {viewerRole === "doctor" ? (
            <div className="rounded-xl border-2 p-4" style={{ borderColor: RED, background: "#fdf0ee" }}>
              <p className="font-bold" style={{ color: RED }}>医生视图：预警优先 Physician view — alerts first</p>
              <p className="text-sm">当前 {HOME_ALERTS.filter((a) => a.level === "red").length} 条红色预警待处理（见「总览」子标签的居家监测预警表）。Red alerts need action today — see the home-monitoring alerts on the Overview sub-tab.</p>
            </div>
          ) : null}
          {viewerRole === "coach" ? (
            <div className="rounded-xl border-2 p-4" style={{ borderColor: TEAL, background: "var(--accent-light)" }}>
              <p className="font-bold" style={{ color: TEAL }}>教练视图：今日任务优先 Coach view — today's tasks first</p>
              <p className="text-sm">请先看上方「我的今天」的今日清单，再查看其他子标签的看板。Start with My day above, then review the board on the other sub-tabs.</p>
            </div>
          ) : null}
          <RoadmapSummaryCard goProgress={goProgress} />
        </div>
      ) : null}
      {sub === "overview" ? (
        <div className="space-y-4">
      <Card title="运营指标 Operations KPIs（v3）">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { zh: "入组人数", en: "Patients enrolled", v: `${patients.length}` },
            { zh: "近两周有联系", en: "Contacted in last 14 days", v: `${contacted14}%` },
            { zh: "完成第12周复评", en: "Reached week-12 re-test", v: `${week12Done}/${patients.length}` },
            { zh: "内脏脂肪平均变化", en: "Avg visceral fat change", v: "−8%" },
            { zh: "HbA1c下降≥0.3", en: "HbA1c fell ≥0.3", v: `${hba1cDown}/${patients.length}` },
            { zh: "近7天居家记录率", en: "Home-logging rate, 7 days", v: `${homeRate}%` },
            { zh: "待点评饮食照片", en: "Food photos pending review", v: `${pendingFood}` },
            { zh: "待回复患者消息", en: "Patient messages pending", v: "4" },
          ].map((k) => (
            <div key={k.zh} className="rounded-lg bg-[var(--surface-alt)] p-3">
              <div className="text-2xl font-bold" style={{ color: TEAL }}>{k.v}</div>
              <div className="text-xs">{k.zh}<br /><span className="text-[var(--dim)]">{k.en}</span></div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="居家监测预警 Home-monitoring alerts">
        <p className="mb-2 text-xs text-[var(--dim)]">阈值（由医生设定）：血糖 &lt;3.9 或 ≥13.9 红色；血压 ≥180/110 红色，≥160/100 黄色，≥140/90 黄色。Thresholds set by the clinic's physicians.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">编号 ID</th><th className="py-2 pr-2">级别 Level</th><th className="py-2 pr-2">内容 Detail</th><th className="py-2">日期 Date</th></tr></thead>
            <tbody>
              {HOME_ALERTS.map((a) => (
                <tr key={a.pid + a.zh} className="border-b border-[#f0e9d8]">
                  <td className="py-2 pr-2"><button type="button" className="font-bold underline" style={{ color: TEAL }} onClick={() => goRecord(a.pid)}>{a.pid}</button></td>
                  <td className="py-2 pr-2"><span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: a.level === "red" ? RED : AMBER }}>{a.level === "red" ? "紧急 Urgent" : "复核 Review"}</span></td>
                  <td className="py-2 pr-2">{a.zh}<br /><span className="text-xs text-[var(--dim)]">{a.en}</span></td>
                  <td className="py-2">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="各支柱需关注 Patients flagged per pillar">
          <div className="space-y-2 text-sm">
            {[
              { k: "nutrition", zh: "营养 Nutrition", red: 2, amber: 4 }, { k: "activity", zh: "运动 Activity", red: 1, amber: 3 },
              { k: "sleep", zh: "睡眠 Sleep", red: 2, amber: 5 }, { k: "stress", zh: "压力 Stress", red: 1, amber: 4 },
              { k: "social", zh: "社会联系 Social", red: 0, amber: 3 }, { k: "substances", zh: "戒烟限酒 Tobacco/alcohol", red: 1, amber: 2 },
              { k: "", zh: "医疗 Medical", red: 2, amber: 5 },
            ].map((r) => (
              <div key={r.zh} className="flex items-center gap-2">
                <span className="flex w-40 shrink-0 items-center gap-1.5 text-xs sm:text-sm">{r.k ? <PillarImg k={r.k} className="h-6 w-6 shrink-0 rounded-md object-cover" /> : null}{r.zh}</span>
                <div className="flex h-4 flex-1 overflow-hidden rounded bg-[#f1ead9]">
                  <div style={{ width: `${(r.red / 14) * 100}%`, background: RED }} />
                  <div style={{ width: `${(r.amber / 14) * 100}%`, background: "#d9a13b" }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs">{r.red} · {r.amber}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="风险分层 Risk tiers">
          <div className="space-y-2 text-sm">
            {[{ zh: "绿 Green", n: counts.g, c: GREEN }, { zh: "黄 Amber", n: counts.a, c: "#d9a13b" }, { zh: "红 Red", n: counts.r, c: RED }].map((r) => (
              <div key={r.zh} className="flex items-center gap-2">
                <span className="w-20 shrink-0">{r.zh}</span>
                <div className="h-4 flex-1 rounded bg-[#f1ead9]"><div className="h-4 rounded" style={{ width: `${counts.total ? (r.n / counts.total) * 100 : 0}%`, background: r.c }} /></div>
                <span className="w-6 text-right font-semibold">{r.n}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="患者来源与需联系 Referral sources & reach-out">
          <div className="space-y-2 text-sm">
            {sourceCounts.map((r) => (
              <div key={r.zh} className="flex items-center gap-2">
                <span className="w-36 shrink-0 text-xs sm:text-sm">{r.zh}</span>
                <div className="h-4 flex-1 rounded bg-[#f1ead9]"><div className="h-4 rounded" style={{ width: `${patients.length ? (r.n / patients.length) * 100 : 0}%`, background: TEAL }} /></div>
                <span className="w-6 text-right font-semibold">{r.n}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold">最久未联系 Longest since last contact（按随访日期，至 {SAMPLE_TODAY}）:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {reachOut.map((p, i) => (
              <li key={p.id}>{p.id} · {p.source} {SOURCE_EN[p.source]} · {p.status}灯 {STATUS_EN[p.status]} · {daysSinceFollowUp(p)} 天未联系 {daysSinceFollowUp(p)} days · 打卡 {p.checkinDays}/7{i === 0 ? " — 优先联系 Priority contact" : ""}</li>
            ))}
          </ul>
        </Card>
      </div>
        </div>
      ) : null}
      {sub === "patients" ? (
        <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { zh: "在管患者", en: "Active patients", v: counts.total, c: TEAL },
          { zh: "绿灯", en: "Green", v: counts.g, c: GREEN },
          { zh: "黄灯", en: "Amber", v: counts.a, c: AMBER },
          { zh: "红灯", en: "Red", v: counts.r, c: RED },
        ].map((k) => (
          <div key={k.zh} className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="text-3xl font-bold" style={{ color: k.c }}>{k.v}</div>
            <div className="text-sm">{k.zh} <span className="text-[var(--dim)]">{k.en}</span></div>
          </div>
        ))}
      </div>
      <Card>
        <FilterBar f={f} setF={setF} idPrefix="dash" />
        {active ? <p className="mt-1 text-sm">筛选结果 Filtered: {filtered.map((p) => p.id).join(", ") || "无 None"}</p> : null}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="状态分布 Status mix"><Donut green={counts.g} amber={counts.a} red={counts.r} /></Card>
        <Card title="需要关注 Needs attention">
          <p className="text-sm">红灯 {counts.r} 人 ({redIds.join(", ") || "无"}) · 黄灯 {counts.a} 人 ({amberIds.join(", ") || "无"})</p>
          <p className="mt-2 rounded-lg bg-[#fdecec] p-3 text-sm"><strong>优先处理：{redIds[0] ?? ""} 医生转诊（内科/心理），目标与打卡先停一停。</strong><br />
            <span className="text-[var(--dim)]">Priority: {redIds[0] ?? ""} physician referral (internal medicine / mental health); pause goals and check-ins.</span></p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>打卡最少 Fewest check-ins: {fewestCheckins.map((p) => `${p.id} ${p.checkinDays}/7`).join("、")}</li>
            <li>红灯需医生复核 Red — physician review: {redIds.join("、") || "无 None"}</li>
          </ul>
          <button type="button" className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => goRecord(redIds[0] ?? "P012")}>查看 {redIds[0] ?? "P012"} 档案 View {redIds[0] ?? "P012"} record</button>
        </Card>
      </div>
        </div>
      ) : null}
      {sub === "trends" ? (
        <div className="space-y-4">
      <Card title="指标变化：基线 → 最近一次 Change, baseline → latest">
        <div className="space-y-1.5">
          {CHANGE_BARS.map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="w-44 shrink-0 sm:w-64">{b.label}</span>
              <div className="relative h-4 flex-1 rounded bg-[#f1ead9]">
                <div className="absolute top-0 h-4 rounded" style={{ left: b.pct < 0 ? `${50 + b.pct * 2.4}%` : "50%", width: `${Math.abs(b.pct) * 2.4}%`, background: b.pct < 0 ? GREEN : "#3b82c4" }} />
                <div className="absolute top-0 h-4 w-0.5 bg-[#8a7f63]" style={{ left: "50%" }} />
              </div>
              <span className="w-16 shrink-0 text-right font-semibold" style={{ color: b.pct < 0 ? GREEN : "#3b82c4" }}>{b.pct > 0 ? "+" : ""}{b.pct}%</span>
            </div>
          ))}
        </div>
      </Card>
      <Card title="体重、血糖与血压：三个患者 · 最近14天 Weight, glucose and BP: 3 patients, last 14 days">
        <LineChart yMin={3.5} yMax={8} xLabels={["14天前 14 days ago", "今天 Today"]} series={[
          { label: "P001 空腹血糖 Fasting glucose", color: "#1d7a4f", points: glucose14(6.4, 5.8) },
          { label: "P006 空腹血糖 Fasting glucose", color: AMBER, points: glucose14(6.9, 6.2) },
          { label: "P012 空腹血糖 Fasting glucose", color: RED, points: glucose14(7.5, 6.8) },
        ]} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="每周执行进度 Weekly progress">
          <div className="space-y-3 text-sm">
            {[
              { zh: "饮食照片打卡", en: "Photo check-ins", done: 33, total: 84 },
              { zh: "团队点评", en: "Reviews", done: 18, total: 33 },
              { zh: "每日打卡", en: "Daily check-ins", done: 78, total: 98 },
              { zh: "目标完成", en: "Goals", done: 4, total: 14 },
            ].map((r) => (
              <div key={r.zh}>
                <div className="mb-1 flex justify-between"><span>{r.zh} <span className="text-[var(--dim)]">{r.en}</span></span><span className="font-semibold">{r.done}/{r.total} ({Math.round((r.done / r.total) * 100)}%)</span></div>
                <Progress pct={(r.done / r.total) * 100} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="本周活动计划 This week">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[430px] text-left text-sm">
              <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">日 Day</th><th className="py-2 pr-2">活动 Activity</th><th className="py-2 pr-2">患者数 Patients</th><th className="py-2">状态 Status</th></tr></thead>
              <tbody>
                {[
                  ["周一 Mon", "全员体重+血糖复测 All: weight + glucose retest", "14", "完成 Done"],
                  ["周三 Wed", "营养团课：外食点餐 Nutrition group class: eating out", "9", "进行中 In progress"],
                  ["周四 Thu", "运动评估与FMS复测 Fitness assessment and FMS retest", "6", "进行中 In progress"],
                  ["周五 Fri", "心理与睡眠复评 Mental-health and sleep re-assessment", "5", "待开始 Not started"],
                ].map((r) => (<tr key={r[0]} className="border-b border-[#f0e9d8]"><td className="py-2 pr-2 font-medium">{r[0]}</td><td className="py-2 pr-2">{r[1]}</td><td className="py-2 pr-2">{r[2]}</td><td className="py-2">{r[3]}</td></tr>))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card title="趋势：过去12周的指标均值（14名患者） 12-week average trend (14 patients)">
        <LineChart yMin={2.5} yMax={7.5} xLabels={["第1周 Week 1", "第12周 Week 12"]} series={[
          { label: "体重 Weight (缩放 scaled)", color: TEAL, points: trend(7.4, 7.1) },
          { label: "空腹血糖 Fasting glucose", color: GREEN, points: trend(6.0, 5.7) },
          { label: "收缩压 Systolic BP (缩放 scaled)", color: AMBER, points: trend(7.4, 7.0) },
        ]} />
      </Card>
        </div>
      ) : null}
    </div>
  );
}

/* ================= Patients ================= */
function Patients({ patients, goRecord, viewerRole }: { patients: Patient[]; goRecord: (id: string) => void; viewerRole: ViewerRole }) {
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("默认");
  const filtered = useMemo(() => {
    const list = applyFilters(patients, f, search);
    if (sort === "改善最大") return [...list].sort((a, b) => a.measures.hba1cPct - b.measures.hba1cPct);
    if (sort === "风险最高") {
      const rank = (s: string) => (s === "红" ? 0 : s === "黄" ? 1 : 2);
      return [...list].sort((a, b) => rank(a.status) - rank(b.status) || b.measures.systolic - a.measures.systolic);
    }
    return list;
  }, [patients, f, search, sort]);
  const active = hasFilters(f, search);
  void active;
  const [sub, setSub] = useState<"all" | "attention" | "ontrack" | "team">("all");
  const queryClient = useQueryClient();
  const [regOpen, setRegOpen] = useState(false);
  const [reg, setReg] = useState({ sex: "女", age: 50, source: "医生转诊", goal: "维持", followUp: "", consent: false });
  const [regMsg, setRegMsg] = useState("");
  const regMut = useMutation({
    mutationFn: async () => await api.registerPatient({ sex: reg.sex as "女" | "男", age: reg.age, source: reg.source as "医生转诊" | "小程序" | "社区筛查", goal: reg.goal as "维持" | "减重" | "增肌", followUp: reg.followUp, consentConfirmed: reg.consent }),
    onSuccess: (r) => { setRegMsg(`已登记 Registered as ${r.patientId}。下一步：① 在「团队成员」里给这位患者选团队角色、分人；② 在「团队录入」做第一次评估，录入真实测量 — 在那之前，这位患者显示为黄灯「待评估」，没有任何编造的数值。Next: choose team roles and people for this patient under Team members, then enter the first assessment in Staff entry — until then the patient shows amber "awaiting assessment" with no invented numbers.`); setRegOpen(false); void queryClient.invalidateQueries(); },
    onError: (e) => setRegMsg(`登记失败 Registration failed: ${e instanceof Error ? e.message : String(e)}`),
  });
  const needsAttention = (p: Patient) => p.status !== "绿" || p.checkinDays <= 2;
  const shown = filtered.filter((p) => (sub === "all" ? true : sub === "attention" ? needsAttention(p) : p.status === "绿"));
  const head = `全部 ${filtered.length} · 绿 ${filtered.filter((p) => p.status === "绿").length} · 黄 ${filtered.filter((p) => p.status === "黄").length} · 红 ${filtered.filter((p) => p.status === "红").length}`;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>患者列表 Patient list</h2>
        <p className="text-sm text-[var(--dim)]">{head}</p>
        {!canSeeClinical(viewerRole) ? <p className="mt-2 rounded-lg bg-[#fbf3d9] p-3 text-sm">{isPlaceholderRole(viewerRole) ? <>新角色视图（待定义）：临床数值已隐藏，待团队定义这个角色能看什么。New-role view (to be defined): clinical values are hidden until the team defines what this role can see.</> : <>前台视图：仅显示入组信息，临床数值已隐藏。Front-desk view: enrollment info only; clinical values are hidden on a need-to-know basis.</>}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => setRegOpen(!regOpen)}>登记新患者 Register a new patient</button>
        <span className="text-xs text-[var(--dim)]">链条第一步：前台登记 + 确认同意 → 建档 → 在「团队成员」分角色和人 → 「团队录入」做第一次评估。Step 1 of the chain: front-desk registration + consent → patient file → roles & people under Team members → first assessment in Staff entry.</span>
      </div>
      {regMsg ? <p className="rounded-lg bg-[var(--surface-alt)] p-3 text-sm" role="status">{regMsg}</p> : null}
      {regOpen ? (
        <Card title="新患者登记 New patient registration（前台 Front desk)">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">性别 Sex
              <select aria-label="New patient sex" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={reg.sex} onChange={(e) => setReg({ ...reg, sex: e.target.value })}>
                <option value="女">女 Female</option><option value="男">男 Male</option>
              </select>
            </label>
            <label className="text-sm">年龄 Age
              <input {...FIELDS.registerPatient.age} aria-label="New patient age" type="number" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={reg.age} onChange={(e) => setReg({ ...reg, age: Number(e.target.value) })} />
            </label>
            <label className="text-sm">来源 Referral source
              <select aria-label="New patient source" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={reg.source} onChange={(e) => setReg({ ...reg, source: e.target.value })}>
                {Object.keys(SOURCE_EN).map((s) => (<option key={s} value={s}>{s} {SOURCE_EN[s]}</option>))}
              </select>
            </label>
            <label className="text-sm">目标 Goal
              <select aria-label="New patient goal" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={reg.goal} onChange={(e) => setReg({ ...reg, goal: e.target.value })}>
                {Object.keys(GOAL_EN).map((g) => (<option key={g} value={g}>{g} {GOAL_EN[g]}</option>))}
              </select>
            </label>
            <label className="text-sm">第一次随访日期 First follow-up date
              <input aria-label="New patient first follow-up date" type="date" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={reg.followUp} onChange={(e) => setReg({ ...reg, followUp: e.target.value })} />
            </label>
            <label className="flex items-end gap-2 pb-1 text-sm">
              <input type="checkbox" aria-label="Consent obtained" className="h-5 w-5" checked={reg.consent} onChange={(e) => setReg({ ...reg, consent: e.target.checked })} />
              已取得入组同意与敏感信息单独同意 Consent obtained (enrollment + sensitive info)
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} disabled={regMut.isPending} onClick={() => { if (!reg.followUp) { setRegMsg("请先选第一次随访日期。Please pick the first follow-up date first."); return; } if (!reg.consent) { setRegMsg("请先确认已取得同意 — 没有同意不能登记。Please confirm consent was obtained first — no registration without consent."); return; } regMut.mutate(); }}>确认登记 Register</button>
            <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" onClick={() => setRegOpen(false)}>取消 Cancel</button>
          </div>
        </Card>
      ) : null}
      <StatusLegend />
      <SubTabs label="Patient list sections" value={sub} onChange={setSub} tabs={[
        { key: "all", zh: "全部患者", en: "All patients", count: filtered.length },
        { key: "attention", zh: "需关注", en: "Needs attention", count: filtered.filter(needsAttention).length },
        { key: "ontrack", zh: "绿灯 · 基本达标", en: "On track", count: filtered.filter((p) => p.status === "绿").length },
        { key: "team", zh: "团队成员", en: "Team members" },
      ]} />
      {sub === "team" ? <TeamMembersPanel patients={patients} /> : (<>
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">搜索 Search
            <input aria-label="Search patient ID" className="ml-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" placeholder="搜索患者ID Search patient ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label className="text-sm">排序 Sort
            <select aria-label="Sort patients" className="ml-1 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="默认">默认 Default</option><option value="改善最大">改善最大 Most improved</option><option value="风险最高">风险最高 Highest risk</option>
            </select></label>
        </div>
        <div className="mt-3"><FilterBar f={f} setF={setF} idPrefix="pat" /></div>
      </Card>
      <Card className="p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]">
              <th className="p-3">患者 Patient</th><th className="p-3">性别/年龄 Sex/Age</th><th className="p-3">来源 Source</th><th className="p-3">阶段 Stage</th><th className="p-3">随访 Follow-up</th><th className="p-3">目标 Goal</th><th className="p-3">状态 Status</th><th className="p-3">打卡 Check-in</th><th className="p-3">最近指标 Latest measures</th><th className="p-3"><span className="sr-only">操作 Action</span></th>
            </tr></thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-b border-[#f0e9d8]">
                  <td className="p-3 font-bold" style={{ color: TEAL }}>{p.id}</td>
                  <td className="p-3">{p.sex} {SEX_EN[p.sex]} / {p.age}</td>
                  <td className="p-3">{p.source}<br /><span className="text-xs text-[var(--dim)]">{SOURCE_EN[p.source]}</span></td>
                  <td className="p-3">{p.stage}<br /><span className="text-xs text-[var(--dim)]">{stageEn(p.stage)}</span></td>
                  <td className="p-3">{followShort(p.followUp)}</td>
                  <td className="p-3">{p.goal}<br /><span className="text-xs text-[var(--dim)]">{GOAL_EN[p.goal]}</span></td>
                  <td className="p-3"><Pill status={p.status} /><div className="mt-1.5 max-w-[220px] text-xs leading-snug text-[var(--dim)]">{statusWhyShort(p, viewerRole).zh}<br />{statusWhyShort(p, viewerRole).en}</div></td>
                  <td className="p-3">{p.checkinDays}/7{p.checkinDays <= 2 ? <span className="ml-1 rounded-full bg-[#f6e9c9] px-2 py-0.5 text-xs font-bold" style={{ color: "#7a5200" }}>需联系 Reach out</span> : null}</td>
                  <td className="p-3">{canSeeClinical(viewerRole) ? (hasNoMeasures(p) ? <span className="text-[var(--dim)]">待评估 — 还没有测量 Awaiting assessment — no measurements yet</span> : <>体重 {p.measures.weightKg}kg · HbA1c {p.measures.hba1cPct}% · 血压 {p.measures.systolic}/{p.measures.diastolic}</>) : <span className="text-[var(--dim)]">已隐藏 Hidden</span>}</td>
                  <td className="p-3"><button type="button" aria-label={`View ${p.id}`} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => goRecord(p.id)}>查看 View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 md:hidden">
          {shown.map((p) => (
            <div key={p.id} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex items-center justify-between"><span className="font-bold" style={{ color: TEAL }}>{p.id} · {p.sex} {p.age}岁</span><Pill status={p.status} /></div>
              <p className="mt-1.5 rounded-lg bg-[var(--surface-alt)] px-2 py-1.5 text-xs leading-snug">{statusWhyShort(p, viewerRole).zh}<br /><span className="text-[var(--dim)]">{statusWhyShort(p, viewerRole).en}</span></p>
              <p className="mt-1 text-sm">{p.source} · {p.stage} · 随访 {followShort(p.followUp)} · 目标 {p.goal} · 打卡 {p.checkinDays}/7{p.checkinDays <= 2 ? " · 需联系 Reach out" : ""}</p>
              <p className="text-sm text-[var(--dim)]">{canSeeClinical(viewerRole) ? (hasNoMeasures(p) ? "待评估 — 还没有测量 Awaiting assessment — no measurements yet" : <>体重 {p.measures.weightKg}kg · HbA1c {p.measures.hba1cPct}% · 血压 {p.measures.systolic}/{p.measures.diastolic}</>) : "临床数值已隐藏 Clinical values hidden"}</p>
              <button type="button" aria-label={`View ${p.id}`} className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => goRecord(p.id)}>查看 View</button>
            </div>
          ))}
        </div>
        {shown.length === 0 ? <p className="p-4 text-sm text-[var(--dim)]">这个子标签下没有符合条件的患者。No patients in this sub-tab match the filters.</p> : null}
      </Card>
      </>)}
    </div>
  );
}

/* ================= Record ================= */
const BASELINE_P001: Measures = {
  weightKg: 77.2, bodyFatPct: 36.9, visceralFat: 10, skeletalMuscleKg: 23.8,
  waistCm: 91, bmrKcal: 1373, overallScore: 67, autonomicBalance: 63,
  hba1cPct: 5.8, fastingGlucose: 6.2, ldl: 4.1, triglycerides: 2.8,
  systolic: 147, diastolic: 83, gripKg: 27, walk6m: 519, fmsTotal: 14,
  phq9: 9, gad7: 6, psqi: 7,
};
const MEASURE_ROWS: { key: keyof Measures; zh: string; en: string; unit: string }[] = [
  { key: "weightKg", zh: "体重", en: "Weight", unit: "kg" },
  { key: "bodyFatPct", zh: "体脂率", en: "Body fat", unit: "%" },
  { key: "visceralFat", zh: "内脏脂肪等级", en: "Visceral fat level", unit: "级" },
  { key: "skeletalMuscleKg", zh: "骨骼肌量", en: "Skeletal muscle", unit: "kg" },
  { key: "waistCm", zh: "腰围", en: "Waist", unit: "cm" },
  { key: "bmrKcal", zh: "基础代谢", en: "Basal metabolic rate", unit: "kcal" },
  { key: "overallScore", zh: "综合评分", en: "Overall score", unit: "分" },
  { key: "autonomicBalance", zh: "自主神经平衡", en: "Autonomic balance", unit: "分" },
  { key: "hba1cPct", zh: "HbA1c", en: "HbA1c", unit: "%" },
  { key: "fastingGlucose", zh: "空腹血糖", en: "Fasting glucose", unit: "mmol/L" },
  { key: "ldl", zh: "LDL", en: "LDL", unit: "mmol/L" },
  { key: "triglycerides", zh: "甘油三酯", en: "Triglycerides", unit: "mmol/L" },
  { key: "systolic", zh: "收缩压", en: "Systolic BP", unit: "mmHg" },
  { key: "diastolic", zh: "舒张压", en: "Diastolic BP", unit: "mmHg" },
  { key: "gripKg", zh: "握力", en: "Grip strength", unit: "kg" },
  { key: "walk6m", zh: "6分钟步行", en: "6-min walk", unit: "m" },
  { key: "fmsTotal", zh: "FMS总分", en: "FMS total", unit: "/21" },
  { key: "phq9", zh: "PHQ-9", en: "PHQ-9", unit: "分" },
  { key: "gad7", zh: "GAD-7", en: "GAD-7", unit: "分" },
  { key: "psqi", zh: "PSQI", en: "Sleep quality PSQI", unit: "分" },
];

function baselineFor(p: Patient): Measures {
  if (p.id === "P001") return BASELINE_P001;
  const b = { ...p.measures };
  (Object.keys(BASELINE_P001) as (keyof Measures)[]).forEach((k) => {
    const delta = BASELINE_P001[k] - 74.2; // placeholder replaced below
    void delta;
  });
  // Derive baseline from P001 deltas applied to this patient's latest values.
  (Object.keys(BASELINE_P001) as (keyof Measures)[]).forEach((k) => {
    const p001Latest = { weightKg: 74.2, bodyFatPct: 34.7, visceralFat: 9, skeletalMuscleKg: 24.3, waistCm: 88, bmrKcal: 1372, overallScore: 72, autonomicBalance: 69, hba1cPct: 5.5, fastingGlucose: 5.8, ldl: 3.8, triglycerides: 2.5, systolic: 140, diastolic: 79, gripKg: 28, walk6m: 542, fmsTotal: 15, phq9: 7, gad7: 5, psqi: 6 } as Measures;
    b[k] = Math.round((p.measures[k] + (BASELINE_P001[k] - p001Latest[k])) * 10) / 10;
  });
  return b;
}

function Plate({ veg, protein, staple }: { veg: number; protein: number; staple: number }) {
  return (
    <div className="mx-auto h-28 w-28 rounded-full border-4 border-white shadow" role="img" aria-label={`Plate: vegetables ${veg}%, protein ${protein}%, staples ${staple}%`}
      style={{ background: `conic-gradient(#5da85f 0% ${veg}%, #d98a4b ${veg}% ${veg + protein}%, #e8cf8f ${veg + protein}% 100%)` }} />
  );
}

function Record({ patients, selectedId, setSelectedId, viewerRole }: { patients: Patient[]; selectedId: string; setSelectedId: (id: string) => void; viewerRole?: ViewerRole }) {
  const p = patients.find((x) => x.id === selectedId) ?? patients[0];
  const [trendKey, setTrendKey] = useState<keyof Measures>("weightKg");
  const [sub, setSub] = useState<"overview" | "measures" | "foodmsg" | "visits">("overview");
  if (!p) return <p>暂无患者数据。No patient data.</p>;
  const base = baselineFor(p);
  const latest = p.measures;
  /* Home-monitoring lines run from THIS patient's baseline to THIS patient's
     latest values — an earlier version drew P001's line for everyone. */
  const glide = (from: number, to: number, wobble: number) => Array.from({ length: 14 }, (_, i) => Math.round((from + ((to - from) * i) / 13 + Math.sin(i * 1.4) * wobble) * 10) / 10);
  const glucoseSeries = glide(base.fastingGlucose, latest.fastingGlucose, 0.15);
  const sysSeries = glide(base.systolic, latest.systolic, 2);
  const diaSeries = glide(base.diastolic, latest.diastolic, 1.5);
  const gluMin = Math.floor((Math.min(...glucoseSeries) - 0.4) * 10) / 10;
  const gluMax = Math.ceil((Math.max(...glucoseSeries) + 0.4) * 10) / 10;
  const bpMin = Math.floor(Math.min(...diaSeries) - 6);
  const bpMax = Math.ceil(Math.max(...sysSeries) + 6);
  const trendRow = MEASURE_ROWS.find((r) => r.key === trendKey) ?? MEASURE_ROWS[0]!;
  const tp0 = base[trendKey];
  const tp2 = latest[trendKey];
  const trendPoints = [tp0, Math.round(((tp0 + tp2) / 2) * 10) / 10, tp2];
  const span = Math.max(1, Math.abs(tp0 - tp2) * 1.6);
  const mid = (tp0 + tp2) / 2;
  const goalBars: { zh: string; pct?: number; text: string }[] = p.id === "P001" ? [
    { zh: "体重 Weight", pct: 77, text: "基线 77.2kg → 最近 74.2kg → 目标 ≤73.3kg" },
    { zh: "腰围 Waist", pct: 50, text: "91cm → 88cm → ≤85cm" },
    { zh: "内脏脂肪 Visceral fat", pct: 100, text: "已达标 Reached · 10级 → 9级 → ≤9级" },
    { zh: "糖化血红蛋白 HbA1c", pct: 100, text: "已达标 Reached · 5.8% → 5.5% → ≤5.7%" },
    { zh: "收缩压 Systolic BP", pct: 41, text: "147mmHg → 140mmHg → ≤130mmHg" },
  ] : [
    /* No invented percentages for other patients: show their own baseline → latest only. */
    { zh: "体重 Weight", text: `基线 ${base.weightKg}kg → 最近 ${latest.weightKg}kg` },
    { zh: "糖化血红蛋白 HbA1c", text: `${base.hba1cPct}% → ${latest.hba1cPct}%` },
    { zh: "收缩压 Systolic BP", text: `${base.systolic}mmHg → ${latest.systolic}mmHg` },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>患者档案 Patient record</h2>
        <label className="text-sm">患者 Patient
          <select aria-label="Select patient" className="ml-1 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={p.id} onChange={(e) => setSelectedId(e.target.value)}>
            {patients.map((x) => (<option key={x.id} value={x.id}>{x.id}</option>))}
          </select></label>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-lg font-bold" style={{ color: TEAL }}>{p.id}</span>
          <span>{p.sex} {SEX_EN[p.sex]} · {p.age}岁 years</span>
          <Pill status={p.status} />
          <span>{p.goal} {GOAL_EN[p.goal]}</span>
          <span>{p.source} {SOURCE_EN[p.source]}</span>
          <span className="rounded-full bg-[#e3efec] px-2 py-0.5 text-xs font-semibold" style={{ color: TEAL }}>正常 OK</span>
          <span className="text-[var(--dim)]">阶段 {p.stage} {stageEn(p.stage)} · 随访 Follow-up {p.followUp} · 打卡 Check-in {p.checkinDays}/7</span>
        </div>
      </Card>
      <SubTabs label="Patient record sections" value={sub} onChange={setSub} tabs={[
        { key: "overview", zh: "概览", en: "Overview" },
        { key: "measures", zh: "指标与趋势", en: "Measures & trends" },
        { key: "foodmsg", zh: "饮食与消息", en: "Food & messages" },
        { key: "visits", zh: "就诊报告", en: "Visits" },
      ]} />
      {sub === "overview" ? (
        <>
      <StatusWhyPanel p={p} viewerRole={viewerRole} />
      <Card title="照护团队与任务 Care team & tasks for this patient">
        <PatientTeamRolesEditor patientId={p.id} />
      </Card>
      <Card title="目标阶梯与关键指标 Goal ladder and key indicators">
        <ul className="space-y-1.5 text-sm">
          <li><strong>6–12个月（长期 Long-term）</strong> — 12个月：糖化血红蛋白降到6.5%以下，体重减少7% (Medical)</li>
          <li><strong>3个月（中期 Mid-term）</strong> — 体重减少3–5%，内脏脂肪下降1级 (Nutrition)</li>
          <li><strong>本月（短期 Short-term）</strong> — 每周运动150分钟，打卡至少20天 (Physical activity)</li>
          <li><strong>本周 This week</strong> — 工作日午餐主食减半，小程序拍照记录 (Nutrition)</li>
        </ul>
        <div className="mt-4 space-y-3">
          {goalBars.map((g) => (
            <div key={g.zh} className="text-sm">
              <div className="mb-1 flex flex-wrap justify-between gap-2"><span className="font-medium">{g.zh}</span><span className="text-[var(--dim)]">{g.pct != null ? <>{g.pct >= 100 ? "已达标 Reached" : `${g.pct}%`} · </> : null}{g.text}</span></div>
              {g.pct != null ? <Progress pct={g.pct} color={g.pct >= 100 ? GREEN : TEAL} /> : null}
            </div>
          ))}
        </div>
      </Card>
      <Card title="六大支柱与医疗 Six pillars plus medical">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">支柱 Pillar</th><th className="py-2 pr-2">居家数据 Home data, 7 days</th><th className="py-2">团队最近评估 Latest team assessment</th></tr></thead>
            <tbody>
              {(p.id === "P001" ? [
                ["nutrition", "营养 Nutrition", "部分达标 Partly", "均衡餐 33% (3张照片) Balanced meals 33% (3 photos)"],
                ["activity", "运动 Physical activity", "达标 On track", "活动 238 分钟/7天 (goal 150) · 健康教练 · 2026-11-20：“本周做得很好！下周我们试试把快走加到35分钟？”"],
                ["sleep", "睡眠 Sleep", "部分达标 Partly", "平均睡眠 6.7 小时 Average sleep 6.7 h"],
                ["stress", "压力管理 Stress", "达标 On track", "压力 4.0/10，放松 1 天 Stress 4.0/10, relaxation 1 day"],
                ["social", "社会联系 Social connection", "达标 On track", "与亲友相处 4/7 天 Time with family/friends 4 of 7 days"],
                ["substances", "戒烟限酒 Tobacco/alcohol", "达标 On track", "吸烟 0 支，饮酒 0 杯 Smoking 0, drinks 0"],
                ["", "医疗 Medical", "部分达标 Partly", `血糖 ${latest.fastingGlucose}，收缩压 ${latest.systolic}，服药 50% Glucose ${latest.fastingGlucose}, systolic ${latest.systolic}, medication 50%`],
              ] : [
                /* Only P001 has a full home-log record in this dataset. For every
                   other patient, say so instead of showing P001's pillar data. */
                ["nutrition", "营养 Nutrition", "暂无居家记录 No home log yet", "待团队评估 To be assessed by the team"],
                ["activity", "运动 Physical activity", "暂无居家记录 No home log yet", "待团队评估 To be assessed by the team"],
                ["sleep", "睡眠 Sleep", "暂无居家记录 No home log yet", `PSQI ${latest.psqi} 分（最近一次量表）PSQI ${latest.psqi} at latest assessment`],
                ["stress", "压力管理 Stress", "暂无居家记录 No home log yet", `PHQ-9 ${latest.phq9} 分 · GAD-7 ${latest.gad7} 分（最近一次量表）Latest mood scales`],
                ["social", "社会联系 Social connection", "暂无居家记录 No home log yet", "待团队评估 To be assessed by the team"],
                ["substances", "戒烟限酒 Tobacco/alcohol", "暂无居家记录 No home log yet", "待团队评估 To be assessed by the team"],
                ["", "医疗 Medical", "见指标 See measures", `空腹血糖 ${latest.fastingGlucose} mmol/L，血压 ${latest.systolic}/${latest.diastolic} mmHg，HbA1c ${latest.hba1cPct}%（最近一次）Latest measures`],
              ]).map((r) => (<tr key={r[1]} className="border-b border-[#f0e9d8]"><td className="py-2 pr-2 font-medium"><span className="flex items-center gap-1.5">{r[0] ? <PillarImg k={r[0]} className="h-6 w-6 shrink-0 rounded-md object-cover" /> : null}{r[1]}</span></td><td className="py-2 pr-2">{r[2]}</td><td className="py-2">{r[3]}</td></tr>))}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      ) : null}
      {sub === "measures" ? (
        <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="居家监测（近14天）· 空腹血糖 Home monitoring · Fasting glucose (mmol/L)">
          <LineChart yMin={gluMin} yMax={gluMax} xLabels={["14天前 14 days ago", "今天 Today"]} series={[{ label: "空腹血糖 Fasting glucose", color: GREEN, points: glucoseSeries }]} />
        </Card>
        <Card title="居家监测（近14天）· 血压 Blood pressure (mmHg)">
          <LineChart yMin={bpMin} yMax={bpMax} xLabels={["14天前 14 days ago", "今天 Today"]} series={[
            { label: "● 收缩压 Systolic", color: TEAL, points: sysSeries },
            { label: "● 舒张压 Diastolic", color: AMBER, points: diaSeries },
          ]} />
        </Card>
      </div>
      {p.id === "P001" ? <p className="-mt-2 text-xs text-[var(--dim)]">华为运动健康 Huawei Health · 日均步数 Avg steps 6333 · 平均睡眠 Avg sleep 6.6 h</p> : null}
        </>
      ) : null}
      {sub === "foodmsg" ? (
        <>
      <Card title="饮食照片、团队记录与消息 Food photos, team notes and messages">
        {p.id !== "P001" ? <p className="text-sm">饮食照片、团队记录和消息目前只有 P001 一份完整记录；{p.id} 暂无饮食照片记录。<br /><span className="text-[var(--dim)]">Food photos, team notes and messages exist in full only for P001 in this dataset; {p.id} has no food-photo record yet.</span></p> : null}
        {p.id === "P001" ? (<>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { meal: "加餐 Snack", date: "2026-11-22", kcal: 520, status: "待点评 Pending", veg: 0, protein: 5, staple: 95, comment: "" },
            { meal: "晚餐 Dinner", date: "2026-11-20", kcal: 1150, status: "已点评 Reviewed", veg: 15, protein: 45, staple: 40, comment: "火锅可以吃：多点蔬菜和豆腐，油碟换成蒜泥加醋，宽粉减半。" },
            { meal: "晚餐 Dinner", date: "2026-11-19", kcal: 560, status: "已点评 Reviewed", veg: 50, protein: 30, staple: 20, comment: "很好，用玉米代替米饭是好选择。" },
          ].map((fd) => (
            <div key={fd.date + fd.meal} className="rounded-lg border border-[var(--border)] p-3 text-center text-sm">
              <Plate veg={fd.veg} protein={fd.protein} staple={fd.staple} />
              <p className="mt-2 font-semibold">{fd.meal} · {fd.date}</p>
              <p className="text-[var(--dim)]">约 {fd.kcal} kcal · {fd.status}</p>
              <p className="text-xs text-[var(--dim)]">蔬菜 {fd.veg}% · 蛋白 {fd.protein}% · 主食 {fd.staple}%</p>
              {fd.comment ? <p className="mt-1 text-left text-xs">点评：{fd.comment}</p> : null}
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-[#f4efe2] p-3 text-sm">
          <p><strong>团队记录 Team note</strong> · 2026-11-20 · 健康教练 Health coach · 运动 Physical activity</p>
          <p className="mt-1">本周做得很好！下周我们试试把快走加到35分钟？</p>
          <p className="text-[var(--dim)]">Great week! Shall we try 35-minute walks next week?</p>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-semibold">消息 Messages</p>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--dim)]">患者 Patient → 健康教练 Health coach · 运动 Exercise · 2026-11-19 09:12</p>
            <p>下雨天不能出去快走怎么办？</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[#eef6f3] p-3">
            <p className="text-xs text-[var(--dim)]">健康教练 Health coach · 2026-11-19 14:30</p>
            <p>可以在家做15分钟原地快走，再加10分钟弹力带，一样算完成目标。</p>
          </div>
        </div>
        </>) : null}
      </Card>
        </>
      ) : null}
      {sub === "measures" ? (
        <>
      {p.id === "P001" ? (
      <Card title="本周与上周 Week vs week（居家数据 Home data）">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">每周 Weekly</th><th className="py-2 pr-2">上周 Last</th><th className="py-2">本周 This</th></tr></thead>
            <tbody>
              {[
                ["日均步数 Avg daily steps", "5,940", "6,333"],
                ["活动分钟（合计） Active minutes (total)", "214", "238"],
                ["平均睡眠（小时） Avg sleep (h)", "6.4", "6.6"],
                ["平均压力 Avg stress", "4.6", "4.0"],
                ["空腹血糖均值 Avg fasting glucose", "6.1", "5.9"],
                ["打卡天数 Check-in days", "5", `${p.checkinDays}`],
              ].map((r) => (<tr key={r[0]} className="border-b border-[#f0e9d8]"><td className="py-2 pr-2">{r[0]}</td><td className="py-2 pr-2">{r[1]}</td><td className="py-2 font-semibold">{r[2]}</td></tr>))}
            </tbody>
          </table>
        </div>
      </Card>
      ) : (
      <Card title="本周与上周 Week vs week（居家数据 Home data）">
        <p className="text-sm">逐周居家对比需要连续的居家记录，目前只有 P001 有完整记录。{p.id} 本周打卡 {p.checkinDays}/7 天；空腹血糖基线 {base.fastingGlucose} → 最近 {latest.fastingGlucose} mmol/L。<br /><span className="text-[var(--dim)]">A week-by-week home comparison needs continuous home logs, which exist in full only for P001. {p.id} checked in {p.checkinDays}/7 days this week; fasting glucose baseline {base.fastingGlucose} → latest {latest.fastingGlucose} mmol/L.</span></p>
      </Card>
      )}
      <Card title="趋势 Trend">
        <label className="text-sm">指标 Measure
          <select aria-label="Trend measure" className="ml-1 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={trendKey} onChange={(e) => setTrendKey(e.target.value as keyof Measures)}>
            {MEASURE_ROWS.map((r) => (<option key={r.key} value={r.key}>{r.zh} {r.en}</option>))}
            <option value="systolic">收缩压/舒张压 Systolic/Diastolic BP</option>
          </select></label>
        <div className="mt-3">
          <LineChart yMin={mid - span / 2} yMax={mid + span / 2} xLabels={["第0周 Week 0", "第24周 Week 24"]} series={[{ label: `${trendRow.zh} ${trendRow.en} (${trendRow.unit})`, color: TEAL, points: trendPoints }]} />
          <p className="text-xs text-[var(--dim)]">第0周 {trendPoints[0]} · 第12周 {trendPoints[1]} · 第24周 {trendPoints[2]} {trendRow.unit}</p>
        </div>
      </Card>
      <Card title="基线与最近一次 Baseline vs latest">
        <p className="mb-2 text-xs text-[var(--dim)]">红色数值超出参考范围 Red values are outside the reference range</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">指标 Measure</th><th className="py-2 pr-2">基线 Baseline</th><th className="py-2 pr-2">最近 Latest</th><th className="py-2">变化 Change</th></tr></thead>
            <tbody>
              {MEASURE_ROWS.map((r) => {
                const b = base[r.key], l = latest[r.key];
                const d = Math.round((l - b) * 10) / 10;
                const out = (r.key === "systolic" && l >= 140) || (r.key === "hba1cPct" && l >= 6.5);
                return (
                  <tr key={r.key} className="border-b border-[#f0e9d8]">
                    <td className="py-1.5 pr-2">{r.zh} {r.en}</td>
                    <td className="py-1.5 pr-2">{r.key === "fmsTotal" ? `${b}/21` : `${b} ${r.unit}`}</td>
                    <td className="py-1.5 pr-2 font-medium" style={out ? { color: RED } : undefined}>{r.key === "fmsTotal" ? `${l}/21` : `${l} ${r.unit}`}</td>
                    <td className="py-1.5">{d > 0 ? `+${d}` : `${d}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      ) : null}
      {sub === "visits" ? (
        <>
      <Card title="每次检测的报告与记录 Reports and notes by visit">
        <div className="space-y-2">
          <details className="rounded-lg border border-[var(--border)] p-3">
            <summary className="cursor-pointer font-semibold">第0周 Week 0 · 2026-02-06</summary>
            <p className="mt-2 text-sm">基线检测：体重 {base.weightKg}kg · HbA1c {base.hba1cPct}% · 血压 {base.systolic}/{base.diastolic} mmHg。Baseline visit measures as in the table above.</p>
          </details>
          <details className="rounded-lg border border-[var(--border)] p-3">
            <summary className="cursor-pointer font-semibold">第12周 Week 12 · 2026-04-06</summary>
            <p className="mt-2 text-sm">中期复测：体重 {Math.round(((base.weightKg + latest.weightKg) / 2) * 10) / 10}kg，各项指标较基线改善。Mid-point retest; measures improved vs baseline.</p>
          </details>
          <details className="rounded-lg border border-[var(--border)] p-3" open>
            <summary className="cursor-pointer font-semibold">第24周 Week 24 · 2026-07-06</summary>
            <div className="mt-2 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>3D智能体测 3D body composition</strong><p>体重 {latest.weightKg}kg; 体脂率 {latest.bodyFatPct}%; 内脏脂肪等级 {latest.visceralFat}级; 骨骼肌量 {latest.skeletalMuscleKg}kg; 腰围 {latest.waistCm}cm; 基础代谢 {latest.bmrKcal}kcal</p><p className="text-[var(--dim)]">厂家报告摘要: “内脏脂肪等级{latest.visceralFat}，在标准范围内。”</p></div>
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>LIFE检测（字段待确认） LIFE system (fields to confirm)</strong><p>综合评分 {latest.overallScore}分; 自主神经平衡 {latest.autonomicBalance}分</p><p className="text-[var(--dim)]">摘要 “综合评分{latest.overallScore}分。(Real report fields to be confirmed.)”</p></div>
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>化验 Laboratory</strong><p>HbA1c {latest.hba1cPct}%; 空腹血糖 {latest.fastingGlucose}mmol/L; LDL {latest.ldl}mmol/L; 甘油三酯 {latest.triglycerides}mmol/L</p><p className="text-[var(--dim)]">摘要 “糖化血红蛋白{latest.hba1cPct}%，{latest.hba1cPct >= 6.5 ? "偏高，需医生复核" : latest.hba1cPct >= 5.7 ? "略高，需关注" : "正常"}。”</p></div>
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>体征 Vital signs</strong><p>收缩压 {latest.systolic}mmHg; 舒张压 {latest.diastolic}mmHg</p><p className="text-[var(--dim)]">摘要 “血压{latest.systolic}/{latest.diastolic} mmHg，{latest.systolic >= 140 || latest.diastolic >= 90 ? "偏高" : latest.systolic >= 130 || latest.diastolic >= 80 ? "接近上限" : "正常"}。”</p></div>
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>运动功能评估 Fitness assessment</strong><p>握力 {latest.gripKg}kg; 6分钟步行 {latest.walk6m}m; FMS总分 {latest.fmsTotal}/21</p><p className="text-[var(--dim)]">摘要 “握力{latest.gripKg}kg，6分钟步行{latest.walk6m}米。”</p></div>
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>心理与睡眠 Mood and sleep</strong><p>PHQ-9 {latest.phq9}分; GAD-7 {latest.gad7}分; PSQI {latest.psqi}分</p><p className="text-[var(--dim)]">摘要 “PHQ-9 {latest.phq9}分，{latest.phq9 >= 10 ? "建议咨询师随访" : "无明显抑郁"}。”</p></div>
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>医生评估 Physician assessment</strong><p>复评：较基线有改善，继续当前方案，下一阶段增加力量训练。</p></div>
              <div className="rounded-lg bg-[#f7f3e8] p-3"><strong>营养方案 Nutrition plan</strong><p>保持主食减量；增加早餐蛋白质；外出就餐选择清蒸、少油。</p></div>
            </div>
          </details>
        </div>
      </Card>
        </>
      ) : null}
    </div>
  );
}

/* ================= Staff entry ================= */
const WEEKS: { label: string; range: string }[] = [
  { label: "第1周 Week 1", range: "2026-02-02–02-08" }, { label: "第2周 Week 2", range: "2026-02-09–02-15" },
  { label: "第3周 Week 3", range: "2026-02-16–02-22" }, { label: "第4周 Week 4", range: "2026-02-23–03-01" },
  { label: "第5周 Week 5", range: "2026-03-02–03-08" }, { label: "第6周 Week 6", range: "2026-03-09–03-15" },
  { label: "第7周 Week 7", range: "2026-03-16–03-22" }, { label: "第8周 Week 8", range: "2026-03-23–03-29" },
  { label: "第9周 Week 9", range: "2026-03-30–04-05" }, { label: "第10周 Week 10", range: "2026-04-06–04-12" },
  { label: "第11周 Week 11", range: "2026-04-13–04-19" }, { label: "第12周 Week 12", range: "2026-04-20–04-26" },
];
const ROLES = ["医生 Physician", "营养师 Dietitian", "运动/康复师 Exercise specialist", "心理/睡眠咨询师 Counselor", "健康教练 Health coach", "护士/技师 Nurse or technician"];

type StaffTask = { id: string; pri: 0 | 1 | 2 | 3; pid: string; type: string; zh: string; en: string; due: string };
const PRI_LABEL = ["紧急 Urgent", "逾期/重要 Overdue", "今天 Today", "常规 Routine"];
const PRI_COLOR = [RED, AMBER, GREEN, "#8a7f63"];
function tasksForRole(role: string, patients?: Patient[]): StaffTask[] {
  const T: StaffTask[] = [];
  if (role.startsWith("医生")) {
    HOME_ALERTS.filter((a) => a.level === "red").forEach((a, i) => T.push({ id: `al-${i}`, pri: 0, pid: a.pid, type: "紧急预警 Urgent alert", zh: a.zh, en: a.en, due: "2026-11-23" }));
    T.push({ id: "fu-doc-1", pri: 2, pid: "P006", type: "患者消息 Message", zh: "身体不适：最近早上起来有点头晕，需要调整药吗？", en: "Reply to the patient", due: "2026-11-23" });
  }
  if (role.startsWith("营养师")) {
    T.push({ id: "food-1", pri: 3, pid: "P001", type: "饮食照片 Food photo", zh: "加餐 Snack 待确认AI分析", en: "Confirm the AI analysis below", due: "2026-11-22" });
    T.push({ id: "food-2", pri: 3, pid: "P009", type: "饮食照片 Food photo", zh: "午餐 Lunch 待确认AI分析", en: "Confirm the AI analysis below", due: "2026-11-22" });
    T.push({ id: "msg-rd-1", pri: 1, pid: "P003", type: "患者消息 Message", zh: "饮食 Food：这周有朋友聚会吃火锅，怎么吃比较好？", en: "Reply to the patient", due: "2026-11-23" });
  }
  if (role.startsWith("运动")) {
    T.push({ id: "pl-ex-1", pri: 2, pid: "P005", type: "运动需关注 Activity flag", zh: "活动 62 分钟/7天（目标150）", en: "62 active minutes in 7 days (goal 150)", due: "2026-11-23" });
    T.push({ id: "fu-ex-1", pri: 2, pid: "P010", type: "运动处方调整 Exercise review", zh: "根据体能检测更新运动处方", en: "Update the exercise prescription", due: "2026-11-24" });
  }
  if (role.startsWith("心理")) {
    const p012 = patients?.find((x) => x.id === "P012");
    const phq = p012?.measures.phq9;
    T.push({ id: "phq-1", pri: 2, pid: "P012", type: "PHQ-9 随访 PHQ-9 follow-up", zh: phq != null ? `最近检测 ${phq} 分，按计划随访` : "按计划随访", en: phq != null ? `Latest clinic score ${phq} — routine follow-up` : "Routine follow-up", due: "2026-11-23" });
    T.push({ id: "msg-mind-1", pri: 1, pid: "P011", type: "患者消息 Message", zh: "睡眠或压力：最近工作压力大，晚上一两点才睡着。", en: "Reply to the patient", due: "2026-11-23" });
  }
  if (role.startsWith("健康教练")) {
    T.push({ id: "rc-1", pri: 1, pid: "P012", type: "流失风险 Drop-out risk", zh: "9天未联系", en: "Not contacted in 9 days", due: "2026-11-23" });
    T.push({ id: "rc-2", pri: 2, pid: "P003", type: "流失风险 Drop-out risk", zh: "近5天没有居家记录", en: "No home log in 5 days", due: "2026-11-23" });
    T.push({ id: "msg-coach-1", pri: 2, pid: "P009", type: "患者消息 Message", zh: "其他 Other：下周出差，打卡和测血压怎么办？", en: "Reply to the patient", due: "2026-11-23" });
  }
  if (role.startsWith("护士")) {
    T.push({ id: "rt-1", pri: 3, pid: "P003", type: "复评 Re-test", zh: "第24周复评待做", en: "Week-24 re-test due", due: "2026-11-25" });
    T.push({ id: "rt-2", pri: 3, pid: "P005", type: "复评 Re-test", zh: "第24周复评待做", en: "Week-24 re-test due", due: "2026-11-25" });
    T.push({ id: "rt-3", pri: 3, pid: "P014", type: "复评 Re-test", zh: "第24周复评待做", en: "Week-24 re-test due", due: "2026-11-26" });
  }
  T.push({ id: `fu-${role}-a`, pri: 2, pid: "P001", type: "电话随访 Phone follow-up", zh: "检查本周SMART目标完成情况，更新信心评分", en: "Check this week's SMART goal and confidence", due: "2026-11-23" });
  return T.sort((a, b) => a.pri - b.pri);
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">{label}
      <input aria-label={label} type="number" step="any" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
    </label>
  );
}

type EntrySummary = ApiResponse<typeof api, "getState">["entries"][number];

function StaffEntry({ patients, goRecord, entries }: { patients: Patient[]; goRecord: (id: string) => void; entries: EntrySummary[] }) {
  const [doneTasks, setDoneTasks] = useState<string[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyMsg, setReplyMsg] = useState("");
  const [approved, setApproved] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [week, setWeek] = useState("第1周 Week 1");
  const [role, setRole] = useState(ROLES[0]!);
  const [patientId, setPatientId] = useState("P001");
  const [entryDate, setEntryDate] = useState("2026-11-23");
  const [labDate, setLabDate] = useState("2026-11-20");
  const [heightCm, setHeightCm] = useState(160);
  const [assessment, setAssessment] = useState("部分达标");
  const [goal, setGoal] = useState("维持");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [teamNote, setTeamNote] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const patient = patients.find((x) => x.id === patientId) ?? patients[0];
  const [sub, setSub] = useState<"tasks" | "actions" | "form" | "team" | "pricing" | "recent">("tasks");
  const [form, setForm] = useState<Measures | null>(null);
  const measures: Measures = form ?? patient?.measures ?? ({} as Measures);
  useEffect(() => { setForm(null); if (patient) { setGoal(patient.goal); } }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof Measures) => (v: number) => setForm({ ...measures, [k]: v });
  const save = useMutation({
    mutationFn: async () => await api.saveEntry({
      patientId, week, role, entryDate, labDate, heightCm, assessment, goal, weeklyGoal, teamNote, measures,
    }),
    onSuccess: (res) => {
      setSavedMsg(`已保存 Saved — ${res.patientId} 状态更新为 ${res.status} ${STATUS_EN[res.status] ?? ""}，已同步到患者档案、患者端与成果公示。`);
      void queryClient.invalidateQueries({ queryKey: ["state"] });
    },
    onError: (e) => setSavedMsg(`保存失败 Save failed: ${e instanceof Error ? e.message : String(e)}`),
  });
  if (!patient) return <p>暂无患者数据。No patient data.</p>;
  const section = "rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm";
  const grid = "mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4";
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>团队录入 Staff entry</h2>
        {role.startsWith("健康教练") ? <p className="mt-2 rounded-lg bg-[var(--accent-light)] p-3 text-sm">SMART目标构建：在「录入表单」子标签的「本周目标」按 具体 Specific · 可衡量 Measurable · 可实现 Achievable · 相关 Relevant · 有时限 Time-bound 填写，例如「晚饭后快走30分钟，每周一、三、五」。<br /><span className="text-[var(--dim)]">Coach SMART goal builder: write the weekly goal as Specific, Measurable, Achievable, Relevant, Time-bound.</span></p> : null}
        {role.startsWith("护士") ? <p className="mt-2 rounded-lg bg-[var(--accent-light)] p-3 text-sm">护士/技师：录入设备数值（体测、LIFE、化验、体征），并保留厂家原始报告备查。<br /><span className="text-[var(--dim)]">Nurse/technician: enter device values; keep the original maker report with the extracted values.</span></p> : null}
      </div>
      <Card>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm">周 Week
            <select aria-label="Week" className="ml-1 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={week} onChange={(e) => setWeek(e.target.value)}>
              {WEEKS.map((w) => (<option key={w.label} value={w.label}>{w.label} ({w.range})</option>))}
            </select></label>
          <label className="text-sm">角色 Role
            <select aria-label="Role" className="ml-1 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select></label>
          <label className="text-sm">患者 Patient
            <select aria-label="Entry patient" className="ml-1 rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {patients.map((x) => (<option key={x.id} value={x.id}>{x.id}</option>))}
            </select></label>
          <label className="text-sm">日期 Date
            <input aria-label="Entry date" type="date" className="ml-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </label>
        </div>
      </Card>
      <SubTabs label="Staff entry sections" value={sub} onChange={setSub} tabs={[
        { key: "tasks", zh: "今日工作", en: "Tasks today" },
        { key: "actions", zh: "快速处理", en: "Quick actions" },
        { key: "form", zh: "录入表单", en: "Entry form" },
        { key: "team", zh: "团队表单", en: "Team forms" },
        { key: "pricing", zh: "价格", en: "Pricing" },
        { key: "recent", zh: "最近录入", en: "Recent entries", count: entries.length },
      ]} />
      {sub === "team" ? <TeamFormsPanel patientId={patientId} week={week} entryDate={entryDate} /> : null}
      {sub === "pricing" ? <PricingPanel /> : null}
      {sub === "tasks" ? (
        <>
      <Card title="今日工作 My tasks today">
        {(() => {
          const tasks = tasksForRole(role, patients);
          const done = tasks.filter((t) => doneTasks.includes(t.id)).length;
          return (
            <>
              <p className="mb-2 text-sm text-[var(--dim)]">{role} · 已完成 done {done}/{tasks.length} · 勾选后即完成 Tick to complete</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">完成 Done</th><th className="py-2 pr-2">优先 Priority</th><th className="py-2 pr-2">患者 Patient</th><th className="py-2 pr-2">事项 Task</th><th className="py-2 pr-2">原因 Reason</th><th className="py-2">截止 Due</th></tr></thead>
                  <tbody>
                    {tasks.map((t) => {
                      const d = doneTasks.includes(t.id);
                      return (
                        <tr key={t.id} className="border-b border-[#f0e9d8]" style={d ? { opacity: 0.5 } : undefined}>
                          <td className="py-2 pr-2"><input type="checkbox" aria-label={`Mark task done for ${t.pid}`} className="h-5 w-5" checked={d} onChange={(e) => setDoneTasks(e.target.checked ? [...doneTasks, t.id] : doneTasks.filter((x) => x !== t.id))} /></td>
                          <td className="py-2 pr-2"><span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: PRI_COLOR[t.pri] }}>{PRI_LABEL[t.pri]}</span></td>
                          <td className="py-2 pr-2"><button type="button" className="font-bold underline" style={{ color: TEAL }} onClick={() => goRecord(t.pid)}>{t.pid}</button></td>
                          <td className="py-2 pr-2">{t.type}</td>
                          <td className="py-2 pr-2">{t.zh}<br /><span className="text-xs text-[var(--dim)]">{t.en}</span></td>
                          <td className="py-2">{t.due}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </Card>
        </>
      ) : null}
      {sub === "actions" ? (
        <>
        <Card title="快速处理 Quick actions">
          {role.startsWith("医生") ? <ul className="list-disc space-y-1.5 pl-5 text-sm">{HOME_ALERTS.map((a) => (<li key={a.pid + a.zh}><button type="button" className="font-semibold underline" style={{ color: TEAL }} onClick={() => goRecord(a.pid)}>{a.pid}</button> · {a.zh}</li>))}</ul> : null}
          {role.startsWith("营养师") ? (
            <div className="space-y-3 text-sm">
              {[{ pid: "P001", meal: "加餐 Snack", tip: "含糖饮料是血糖升高的主要来源：换成无糖茶或一小把坚果。" }, { pid: "P009", meal: "午餐 Lunch", tip: "接近理想餐盘：一半蔬菜、四分之一蛋白质、四分之一主食。" }].map((f) => (
                <div key={f.pid} className="rounded-lg border border-[var(--border)] p-3">
                  <p className="font-semibold">{f.pid} · {f.meal} · AI分析待确认 AI result to confirm</p>
                  <p className="text-[var(--dim)]">AI建议（需营养师确认后发送）：{f.tip}</p>
                  {approved.includes(f.pid) ? <p className="mt-1 font-semibold" style={{ color: GREEN }}>已确认并发送 Confirmed and sent</p> : <button type="button" className="mt-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => setApproved([...approved, f.pid])}>确认并发送 Confirm and send</button>}
                </div>
              ))}
            </div>
          ) : null}
          {role.startsWith("运动") ? <p className="text-sm">运动支柱红色标记：P005 活动 62 分钟/7天；P014 活动 75 分钟/7天。复评到期：P003、P006（FMS复测）。<br /><span className="text-[var(--dim)]">Activity flags and FMS re-tests due — open a record from My tasks today.</span></p> : null}
          {role.startsWith("心理") ? <p className="text-sm">PHQ-9 随访：P012 最近检测 {patients.find((x) => x.id === "P012")?.measures.phq9 ?? "—"} 分，按计划随访。睡眠需关注：P011 PSQI {patients.find((x) => x.id === "P011")?.measures.psqi ?? "—"} 分（睡眠质量偏低）。<br /><span className="text-[var(--dim)]">Mood and sleep flags — follow up from My tasks today.</span></p> : null}
          {role.startsWith("健康教练") ? <p className="text-sm">流失风险：P012（9天未联系）、P005（目标未完成）。SMART目标可用「录入表单」子标签的「本周目标」填写。<br /><span className="text-[var(--dim)]">Drop-out risks above; use the Entry form sub-tab to set a SMART weekly goal.</span></p> : null}
          {role.startsWith("护士") ? <p className="text-sm">设备数值录入：请在「录入表单」子标签录入化验、体测、体征等数值；原始报告文件与提取数值一并保存。<br /><span className="text-[var(--dim)]">Enter device values on the Entry form sub-tab; the original report is kept with the extracted values.</span></p> : null}
          <div className="mt-4 border-t border-[var(--border)] pt-3">
            <p className="text-sm font-semibold">回复患者消息 Reply to a patient message</p>
            <label className="mt-2 block text-sm">回复内容 Reply
              <textarea aria-label="Reply to patient message" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="例如：已收到，我们今天会电话联系您。e.g. Received — we will call you today." />
            </label>
            <button type="button" className="mt-2 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => { if (replyText.trim()) { setReplyMsg(`已发送给 ${patientId}（${role}），消息状态更新为已回复。Sent to ${patientId}; message marked answered.`); setReplyText(""); } else { setReplyMsg("请先填写回复内容。Please write a reply first."); } }}>发送回复 Send reply</button>
            {replyMsg ? <p className="mt-2 text-sm" role="status">{replyMsg}</p> : null}
          </div>
        </Card>
        </>
      ) : null}
      {sub === "recent" ? (
        <>
        <Card title="最近录入 Recent entries">
          {entries.length === 0 ? <p className="text-sm text-[var(--dim)]">暂无团队录入。用「录入表单」子标签保存后会显示在这里。No entries yet — saves from the Entry form sub-tab appear here.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px] text-left text-sm">
                <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">日期 Date</th><th className="py-2 pr-2">患者 Patient</th><th className="py-2 pr-2">角色 Role</th><th className="py-2">周次 Week</th></tr></thead>
                <tbody>{entries.slice(0, 10).map((e) => (<tr key={e.id} className="border-b border-[#f0e9d8]"><td className="py-2 pr-2">{e.entryDate}</td><td className="py-2 pr-2 font-semibold">{e.patientId}</td><td className="py-2 pr-2">{e.role}</td><td className="py-2">{e.week}</td></tr>))}</tbody>
              </table>
            </div>
          )}
        </Card>
        </>
      ) : null}
      {sub === "form" ? (
        <>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4">
        <section className={section}><h3 className="font-bold" style={{ color: TEAL }}>化验结果 Lab results</h3>
          <div className={grid}>
            <NumField label="HbA1c (%)" value={measures.hba1cPct} onChange={set("hba1cPct")} />
            <NumField label="空腹血糖 Fasting glucose (mmol/L)" value={measures.fastingGlucose} onChange={set("fastingGlucose")} />
            <NumField label="LDL (mmol/L)" value={measures.ldl} onChange={set("ldl")} />
            <NumField label="甘油三酯 Triglycerides (mmol/L)" value={measures.triglycerides} onChange={set("triglycerides")} />
            <label className="block text-sm">录入日期 Date of lab result
              <input aria-label="Date of lab result" type="date" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={labDate} onChange={(e) => setLabDate(e.target.value)} /></label>
          </div></section>
        <section className={section}><h3 className="font-bold" style={{ color: TEAL }}>体测 3D body composition</h3>
          <div className={grid}>
            <NumField label="体重 Weight (kg)" value={measures.weightKg} onChange={set("weightKg")} />
            <NumField label="体脂率 Body fat (%)" value={measures.bodyFatPct} onChange={set("bodyFatPct")} />
            <NumField label="内脏脂肪等级 Visceral fat level" value={measures.visceralFat} onChange={set("visceralFat")} />
            <NumField label="骨骼肌量 Skeletal muscle (kg)" value={measures.skeletalMuscleKg} onChange={set("skeletalMuscleKg")} />
            <NumField label="腰围 Waist (cm)" value={measures.waistCm} onChange={set("waistCm")} />
            <NumField label="基础代谢 BMR (kcal)" value={measures.bmrKcal} onChange={set("bmrKcal")} />
          </div></section>
        <section className={section}><h3 className="font-bold" style={{ color: TEAL }}>体征 Vital signs</h3>
          <div className={grid}>
            <NumField label="收缩压 Systolic BP (mmHg)" value={measures.systolic} onChange={set("systolic")} />
            <NumField label="舒张压 Diastolic BP (mmHg)" value={measures.diastolic} onChange={set("diastolic")} />
            <NumField label="身高 Height (cm)" value={heightCm} onChange={setHeightCm} />
          </div></section>
        <section className={section}><h3 className="font-bold" style={{ color: TEAL }}>运动功能 Fitness</h3>
          <div className={grid}>
            <NumField label="握力 Grip strength (kg)" value={measures.gripKg} onChange={set("gripKg")} />
            <NumField label="6分钟步行 6-min walk (m)" value={measures.walk6m} onChange={set("walk6m")} />
            <NumField label="FMS总分 FMS total (/21)" value={measures.fmsTotal} onChange={set("fmsTotal")} />
          </div></section>
        <section className={section}><h3 className="font-bold" style={{ color: TEAL }}>LIFE检测（字段待确认） LIFE (fields to confirm)</h3>
          <div className={grid}>
            <NumField label="综合评分 Overall score" value={measures.overallScore} onChange={set("overallScore")} />
            <NumField label="自主神经平衡 Autonomic balance" value={measures.autonomicBalance} onChange={set("autonomicBalance")} />
          </div></section>
        <section className={section}><h3 className="font-bold" style={{ color: TEAL }}>心理与睡眠 Mood and sleep</h3>
          <div className={grid}>
            <NumField label="PHQ-9" value={measures.phq9} onChange={set("phq9")} />
            <NumField label="GAD-7" value={measures.gad7} onChange={set("gad7")} />
            <NumField label="PSQI" value={measures.psqi} onChange={set("psqi")} />
          </div></section>
        <section className={section}><h3 className="font-bold" style={{ color: TEAL }}>评估与计划 Assessment and plan</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block text-sm">评估状态 Assessment
              <select aria-label="Assessment" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={assessment} onChange={(e) => setAssessment(e.target.value)}>
                <option value="达标">达标 On track</option><option value="部分达标">部分达标 Partly</option><option value="未达标">未达标 Not met</option><option value="需要医生转诊">需要医生转诊 Refer to physician</option>
              </select></label>
            <label className="block text-sm">目标 Goal
              <select aria-label="Goal" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm" value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option value="维持">维持 Maintain</option><option value="减重">减重 Lose weight</option><option value="增肌">增肌 Gain muscle</option>
              </select></label>
            <label className="block text-sm md:col-span-2">本周目标 This week's goal
              <input {...FIELDS.saveEntry.weeklyGoal} aria-label="This week's goal" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" value={weeklyGoal} onChange={(e) => setWeeklyGoal(e.target.value)} placeholder="例如：每周运动150分钟 e.g. 150 active minutes this week" /></label>
            <label className="block text-sm md:col-span-2">团队备注 Team note
              <textarea {...FIELDS.saveEntry.teamNote} aria-label="Team note" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" rows={3} value={teamNote} onChange={(e) => setTeamNote(e.target.value)} /></label>
          </div>
          <button type="submit" disabled={save.isPending} className="mt-4 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }}>{save.isPending ? "保存中… Saving…" : "保存 Save"}</button>
          {savedMsg ? <p className="mt-3 rounded-lg bg-[#e3efec] p-3 text-sm" role="status">{savedMsg} <button type="button" className="ml-2 font-semibold underline" onClick={() => goRecord(patientId)}>查看档案 View record</button></p> : null}
        </section>
      </form>
        </>
      ) : null}
    </div>
  );
}

/* ================= Patient app ================= */
const APP_TABS = [
  { key: "today", zh: "今天", en: "Today" },
  { key: "screener", zh: "问卷", en: "Screener" },
  { key: "food", zh: "营养", en: "Nutrition" },
  { key: "move", zh: "运动", en: "Activity" },
  { key: "check", zh: "打卡", en: "Check-in" },
  { key: "med", zh: "医疗", en: "Medical" },
  { key: "goal", zh: "目标", en: "Goals" },
] as const;
type AppTabKey = (typeof APP_TABS)[number]["key"];

/* ================= Log my day — personal week log + weekly analysis ================= */
type DailyLog = ApiResponse<typeof api, "listDailyLogs">["logs"][number];

function logDateKey(d: Date): string {
  const y = d.getFullYear(); const mo = String(d.getMonth() + 1).padStart(2, "0"); const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}
function parseLogKey(s: string): Date {
  const [y = 1970, m = 1, da = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, da);
}
function addDaysTo(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function mondayOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const WEEKDAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const VEG_WORDS = ["蔬菜", "青菜", "沙拉", "西兰花", "菠菜", "芹菜", "黄瓜", "番茄", "西红柿", "vegetable", "salad", "greens"];
const PROTEIN_WORDS = ["鸡蛋", "鱼", "鸡", "肉", "豆腐", "牛奶", "豆浆", "虾", "牛肉", "猪肉", "egg", "fish", "chicken", "tofu", "milk"];
const SUGAR_WORDS = ["奶茶", "可乐", "汽水", "蛋糕", "甜点", "糖水", "巧克力", "冰淇淋", "啤酒", "白酒", "红酒", "soda", "cake", "sugar"];
function mealsHit(meals: string, words: string[]): boolean {
  const t = meals.toLowerCase();
  return words.some((w) => t.includes(w.toLowerCase()));
}
function avgOf(xs: number[]): number | null { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }
function fmt1(v: number): string { return String(Math.round(v * 10) / 10); }

const WEARABLE_DEVICES = ["Apple Watch", "华为穿戴 Huawei wearable", "小米手环/手表 Xiaomi band or watch", "Fitbit", "其他 Other"] as const;

function LogMyDay() {
  const queryClient = useQueryClient();
  const logsQ = useQuery({ queryKey: ["dailyLogs"], queryFn: () => api.listDailyLogs({}) });
  const logs = useMemo(() => logsQ.data?.logs ?? [], [logsQ.data]);
  const byDate = useMemo(() => { const mp = new Map<string, DailyLog>(); for (const l of logs) mp.set(l.logDate, l); return mp; }, [logs]);
  const todayKey = useMemo(() => logDateKey(new Date()), []);
  const thisMonday = useMemo(() => mondayOfWeek(new Date()), []);
  const [weekStart, setWeekStart] = useState<Date>(thisMonday);
  const [selDate, setSelDate] = useState<string>(todayKey);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysTo(weekStart, i)), [weekStart]);
  const isThisWeek = logDateKey(weekStart) === logDateKey(thisMonday);

  const wearableQ = useQuery({ queryKey: ["wearableLink"], queryFn: () => api.getWearableLink({}) });
  const linkedDevice = wearableQ.data?.device ?? "";
  const hasWearable = linkedDevice !== "";
  const [devicePick, setDevicePick] = useState("");
  const [deviceMsg, setDeviceMsg] = useState("");
  useEffect(() => { if (wearableQ.data) setDevicePick(wearableQ.data.device); }, [wearableQ.data]);
  const saveDevice = useMutation({
    mutationFn: async () => await api.setWearableLink({ device: devicePick }),
    onSuccess: (r) => { setDeviceMsg(r.device ? `已记录：你用的是 ${r.device}。Recorded: you use ${r.device}.` : "已取消连接。Wearable unlinked."); void queryClient.invalidateQueries({ queryKey: ["wearableLink"] }); },
    onError: (e: Error) => setDeviceMsg(e.message || "保存失败，请再试一次。Could not save. Please try again."),
  });

  const [meals, setMeals] = useState("");
  const [photo, setPhoto] = useState<{ dataBase64: string; mimeType: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const [activity, setActivity] = useState("");
  const [highMin, setHighMin] = useState("0");
  const [moderateMin, setModerateMin] = useState("0");
  const [lowMin, setLowMin] = useState("0");
  const [sedentaryMin, setSedentaryMin] = useState("0");
  const [sleepHours, setSleepHours] = useState("7");
  const [sleepSource, setSleepSource] = useState<"manual" | "wearable">("manual");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");
  const [pavsDays, setPavsDays] = useState("");
  const [pavsMinutes, setPavsMinutes] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const reflectionsQ = useQuery({ queryKey: ["weeklyReflections"], queryFn: () => api.listWeeklyReflections({}) });
  const reflections = useMemo(() => reflectionsQ.data?.reflections ?? [], [reflectionsQ.data]);
  const reflByWeek = useMemo(() => { const mp = new Map<string, string>(); for (const r of reflections) mp.set(r.weekStart, r.text); return mp; }, [reflections]);
  const [reflText, setReflText] = useState("");
  const [reflLoadedWeek, setReflLoadedWeek] = useState<string | null>(null);
  const [reflMsg, setReflMsg] = useState("");
  const [reflErr, setReflErr] = useState("");

  useEffect(() => {
    if (!logsQ.data) return;
    if (loadedDate === selDate) return;
    const e = byDate.get(selDate);
    setMeals(e?.meals ?? "");
    setPhoto(null); setPhotoPreview(""); setPhotoRemoved(false); setPhotoErr("");
    setActivity(e?.activity ?? "");
    setHighMin(String(e?.highMinutes ?? 0));
    setModerateMin(String(e?.moderateMinutes ?? 0));
    setLowMin(String(e?.lowMinutes ?? 0));
    setSedentaryMin(String(e?.sedentaryMinutes ?? 0));
    setSleepHours(e ? String(e.sleepHours) : "7");
    setSleepSource(e?.sleepSource === "wearable" ? "wearable" : "manual");
    setMood(e?.mood ?? 3);
    setEnergy(e?.energy ?? 3);
    setNote(e?.note ?? "");
    setPavsDays(e?.pavsDays != null ? String(e.pavsDays) : "");
    setPavsMinutes(e?.pavsMinutes != null ? String(e.pavsMinutes) : "");
    setWeightKg(e?.weightKg != null ? String(e.weightKg) : "");
    setMsg(""); setErrMsg("");
    setLoadedDate(selDate);
  }, [logsQ.data, byDate, selDate, loadedDate]);

  useEffect(() => {
    if (!reflectionsQ.data) return;
    const wk = logDateKey(weekStart);
    if (reflLoadedWeek === wk) return;
    setReflText(reflByWeek.get(wk) ?? "");
    setReflMsg(""); setReflErr("");
    setReflLoadedWeek(wk);
  }, [reflectionsQ.data, reflByWeek, weekStart, reflLoadedWeek]);

  const onPickPhoto = async (f: File | null) => {
    setPhotoErr("");
    if (!f) return;
    if (f.type !== "image/jpeg" && f.type !== "image/png") { setPhotoErr("照片需要是 JPG 或 PNG 格式。The photo needs to be a JPG or PNG."); return; }
    try {
      const enc = await fileToBase64(f);
      setPhoto(enc);
      setPhotoPreview(URL.createObjectURL(f));
      setPhotoRemoved(false);
    } catch { setPhotoErr("照片读取失败，请再试一次。Could not read that photo — please try again."); }
  };

  const clampMin = (s: string) => Math.max(0, Math.min(1440, Math.round(Number(s) || 0)));
  const totalActiveMin = clampMin(highMin) + clampMin(moderateMin) + clampMin(lowMin);

  const pavsNumOrNull = (s: string) => { const t = s.trim(); if (t === "") return null; const n = Number(t); return Number.isFinite(n) ? Math.round(n) : null; };

  const save = useMutation({
    mutationFn: async () => await api.saveDailyLog({
      logDate: selDate,
      meals: meals.trim(),
      mealPhoto: photo,
      removeMealPhoto: photoRemoved && !photo,
      activity: activity.trim(),
      highMinutes: clampMin(highMin),
      moderateMinutes: clampMin(moderateMin),
      lowMinutes: clampMin(lowMin),
      sedentaryMinutes: clampMin(sedentaryMin),
      pavsDays: pavsNumOrNull(pavsDays),
      pavsMinutes: pavsNumOrNull(pavsMinutes),
      sleepHours: Math.max(0, Math.min(24, Number(sleepHours) || 0)),
      sleepSource,
      mood, energy,
      note: note.trim(),
      weightKg: weightKg.trim() === "" ? null : Number(weightKg),
    }),
    onSuccess: () => { setMsg("已保存 ✓ 这一天的记录会留下来，下面的本周分析也会跟着更新。Saved ✓ This day is kept, and the weekly analysis below updates too."); setLoadedDate(null); void queryClient.invalidateQueries({ queryKey: ["dailyLogs"] }); },
    onError: (e: Error) => setErrMsg(e.message || "保存失败，请再试一次。Could not save. Please try again."),
  });

  const submitLog = () => {
    setMsg(""); setErrMsg("");
    if (!meals.trim() && !activity.trim() && totalActiveMin === 0 && !note.trim() && !photo && !(existing?.mealPhotoUrl && !photoRemoved)) { setErrMsg("先写一点内容再保存：吃了什么、做了什么，或者今天的感觉，都可以。Write a little first — what you ate, what you did, or how today felt is enough."); return; }
    const pd = pavsNumOrNull(pavsDays); const pm = pavsNumOrNull(pavsMinutes);
    if (pd != null && (pd < 0 || pd > 7)) { setErrMsg("活动天数请填 0–7。Activity days should be 0–7."); return; }
    if (pm != null && (pm < 0 || pm > 1440)) { setErrMsg("活动分钟请填 0–1440。Activity minutes should be 0–1440."); return; }
    if (weightKg.trim() !== "") { const w = Number(weightKg); if (!Number.isFinite(w) || w < 20 || w > 400) { setErrMsg("体重看起来不对，请检查一下（20–400 kg），或者留空。That weight looks off — check it (20–400 kg) or leave it blank."); return; } }
    save.mutate();
  };

  const saveReflection = useMutation({
    mutationFn: async () => await api.saveWeeklyReflection({ weekStart: logDateKey(weekStart), text: reflText.trim() }),
    onSuccess: () => { setReflMsg("已保存 ✓ 这一周的小结会收进下面的日记本里。Saved ✓ This week's reflection is kept in your journal book below."); setReflLoadedWeek(null); void queryClient.invalidateQueries({ queryKey: ["weeklyReflections"] }); },
    onError: (e: Error) => setReflErr(e.message || "保存失败，请再试一次。Could not save. Please try again."),
  });

  const goWeek = (dir: number) => {
    const ns = addDaysTo(weekStart, dir * 7);
    setWeekStart(ns);
    const nk = logDateKey(ns);
    if (!weekDays.some((d) => logDateKey(d) === selDate) || dir !== 0) {
      const inNew = Array.from({ length: 7 }, (_, i) => logDateKey(addDaysTo(ns, i)));
      if (!inNew.includes(selDate)) setSelDate(dir < 0 ? inNew[6]! : (logDateKey(ns) === logDateKey(thisMonday) ? todayKey : nk));
    }
  };

  const selDt = parseLogKey(selDate);
  const selLabel = `${selDt.getMonth() + 1}月${selDt.getDate()}日 周${WEEKDAY_ZH[selDt.getDay()] ?? ""}${selDate === todayKey ? " · 今天 Today" : ""}`;
  const existing = byDate.get(selDate);

  /* ---- Weekly analysis (simple pattern rules over the displayed week) ---- */
  const weekLogs: DailyLog[] = weekDays.flatMap((d) => { const l = byDate.get(logDateKey(d)); return l ? [l] : []; });
  const logged = weekLogs.length;
  const thin = logged >= 1 && logged <= 2;
  const mealsDays = weekLogs.filter((l) => l.meals.trim() !== "").length;
  const vegDays = weekLogs.filter((l) => l.meals.trim() !== "" && mealsHit(l.meals, VEG_WORDS)).length;
  const proteinDays = weekLogs.filter((l) => l.meals.trim() !== "" && mealsHit(l.meals, PROTEIN_WORDS)).length;
  const sugarDays = weekLogs.filter((l) => l.meals.trim() !== "" && mealsHit(l.meals, SUGAR_WORDS)).length;
  const totalMinutes = weekLogs.reduce((a, l) => a + l.activityMinutes, 0);
  const highTotal = weekLogs.reduce((a, l) => a + l.highMinutes, 0);
  const moderateTotal = weekLogs.reduce((a, l) => a + l.moderateMinutes, 0);
  const lowTotal = weekLogs.reduce((a, l) => a + l.lowMinutes, 0);
  const sedentaryTotal = weekLogs.reduce((a, l) => a + l.sedentaryMinutes, 0);
  const mvpaTotal = highTotal + moderateTotal;
  const activeDays = weekLogs.filter((l) => l.activityMinutes > 0).length;
  const wearableSleepNights = weekLogs.filter((l) => l.sleepSource === "wearable" && l.sleepHours > 0).length;
  const sleepDays = weekLogs.filter((l) => l.sleepHours > 0);
  const avgSleep = avgOf(sleepDays.map((l) => l.sleepHours));
  const shortNights = sleepDays.filter((l) => l.sleepHours < 7).length;
  const avgMood = avgOf(weekLogs.map((l) => l.mood));
  const avgEnergy = avgOf(weekLogs.map((l) => l.energy));
  const weightEntries = weekLogs.filter((l) => l.weightKg != null);
  const firstW = weightEntries[0]; const lastW = weightEntries[weightEntries.length - 1];
  const weightLine = weightEntries.length >= 2 && firstW && lastW && firstW.weightKg != null && lastW.weightKg != null
    ? { zh: `体重：${firstW.weightKg} kg → ${lastW.weightKg} kg（${lastW.weightKg - firstW.weightKg > 0 ? "+" : ""}${fmt1(lastW.weightKg - firstW.weightKg)} kg）`, en: `Weight: ${firstW.weightKg} kg → ${lastW.weightKg} kg (${lastW.weightKg - firstW.weightKg > 0 ? "+" : ""}${fmt1(lastW.weightKg - firstW.weightKg)} kg)` }
    : null;

  const good: { zh: string; en: string }[] = [];
  const watch: { zh: string; en: string }[] = [];
  if (logged >= 5) good.push({ zh: `记录很坚持：这一周记了 ${logged} 天，规律看得很清楚。`, en: `Steady logging: ${logged} days this week — the patterns are easy to see.` });
  if (mvpaTotal >= 150) good.push({ zh: `活动量达标：中等+高强度共 ${mvpaTotal} 分钟，达到每周 150 分钟的目标。`, en: `Activity goal met: ${mvpaTotal} minutes of moderate + high intensity, reaching the 150-minute weekly goal.` });
  if (sedentaryTotal > 0 && logged >= 3 && sedentaryTotal / Math.max(1, weekLogs.filter((l) => l.sedentaryMinutes > 0).length) <= 480) good.push({ zh: `久坐时间不算长：平均每天约 ${Math.round(sedentaryTotal / Math.max(1, weekLogs.filter((l) => l.sedentaryMinutes > 0).length))} 分钟。`, en: `Sitting time is moderate: about ${Math.round(sedentaryTotal / Math.max(1, weekLogs.filter((l) => l.sedentaryMinutes > 0).length))} minutes a day on the days recorded.` });
  if (activeDays >= 4) good.push({ zh: `动起来的日子多：${activeDays} 天有活动记录。`, en: `Plenty of active days: activity logged on ${activeDays} days.` });
  if (avgSleep != null && avgSleep >= 7) good.push({ zh: `睡眠平均 ${fmt1(avgSleep)} 小时，在 7 小时以上。`, en: `Sleep averaged ${fmt1(avgSleep)} hours — at or above 7 hours.` });
  if (mealsDays >= 2 && vegDays >= Math.ceil(mealsDays / 2)) good.push({ zh: `多数记录饮食的日子都提到了蔬菜（${vegDays}/${mealsDays} 天）。`, en: `Vegetables showed up on most food-logged days (${vegDays} of ${mealsDays}).` });
  if (proteinDays >= 2) good.push({ zh: `${proteinDays} 天的饮食里有蛋、鱼、肉、豆制品或奶，蛋白质来源比较稳定。`, en: `Protein foods (egg, fish, meat, tofu, dairy) appeared on ${proteinDays} days.` });
  if (avgMood != null && avgMood >= 4) good.push({ zh: `心情平均 ${fmt1(avgMood)}/5，整体不错。`, en: `Mood averaged ${fmt1(avgMood)}/5 — generally good.` });

  if (shortNights >= 2) watch.push({ zh: `${shortNights} 个晚上睡不到 7 小时，睡眠是这一周最值得留意的地方。`, en: `${shortNights} nights were under 7 hours — sleep is the thing to watch this week.` });
  if (sugarDays >= 2) watch.push({ zh: `${sugarDays} 天的饮食里出现了含糖饮料、甜食或酒，可以留意一下频率。`, en: `Sugary drinks, sweets or alcohol appeared on ${sugarDays} days — worth watching the frequency.` });
  if (logged >= 3 && mvpaTotal < 60) watch.push({ zh: `中等+高强度活动偏少：目前共 ${mvpaTotal} 分钟，离每周 150 分钟的目标还有距离。`, en: `Moderate + high intensity activity is low so far: ${mvpaTotal} minutes, short of the 150-minute weekly goal.` });
  if (sedentaryTotal >= 600 && logged >= 3) watch.push({ zh: `久坐时间偏多：这一周记了 ${sedentaryTotal} 分钟久坐，可以每小时起来走一走。`, en: `A lot of sitting time: ${sedentaryTotal} minutes logged this week — try standing up and walking a little each hour.` });
  if (logged >= 3 && mealsDays < logged) watch.push({ zh: `${logged - mealsDays} 天还没有记饮食，饮食规律会看不全。`, en: `${logged - mealsDays} logged day(s) have no food entry, so the eating picture is incomplete.` });
  if (avgEnergy != null && logged >= 3 && avgEnergy <= 2.5) watch.push({ zh: `精力平均只有 ${fmt1(avgEnergy)}/5，可以和睡眠、活动一起看看原因。`, en: `Energy averaged only ${fmt1(avgEnergy)}/5 — look at it together with sleep and activity.` });
  if (mealsDays >= 3 && vegDays === 0) watch.push({ zh: `记录的饮食里还没有提到蔬菜，可以试着每餐加一份。`, en: `No vegetables mentioned in the food logs yet — try adding one portion per meal.` });

  /* ---- Journal book: each week's daily notes + weekly reflection on one page ---- */
  const journalWeeks = useMemo(() => {
    const map = new Map<string, { weekStart: Date; days: DailyLog[]; reflection: string }>();
    for (const l of logs) {
      const mon = mondayOfWeek(parseLogKey(l.logDate));
      const k = logDateKey(mon);
      const cur = map.get(k) ?? { weekStart: mon, days: [] as DailyLog[], reflection: "" };
      cur.days.push(l);
      map.set(k, cur);
    }
    for (const r of reflections) {
      const cur = map.get(r.weekStart) ?? { weekStart: parseLogKey(r.weekStart), days: [] as DailyLog[], reflection: "" };
      cur.reflection = r.text;
      map.set(r.weekStart, cur);
    }
    return [...map.values()]
      .filter((w) => w.days.some((d) => d.note.trim() !== "") || w.reflection.trim() !== "")
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [logs, reflections]);

  const dayLabel = (k: string) => { const d = parseLogKey(k); return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAY_ZH[d.getDay()] ?? ""}`; };

  const scaleBtn = (val: number, cur: number, set: (n: number) => void, label: string) => (
    <button key={val} type="button" aria-label={`${label} ${val}`} aria-pressed={cur === val} className="h-9 w-9 rounded-lg text-sm font-bold" style={cur === val ? { background: TEAL, color: "#fff" } : { border: "1px solid var(--border)", color: "var(--dim)" }} onClick={() => set(val)}>{val}</button>
  );

  const shownPhotoUrl = photo ? photoPreview : (!photoRemoved ? (existing?.mealPhotoUrl ?? "") : "");

  return (
    <>
      <Card title="连接穿戴设备 Link my wearable">
        <p className="text-sm">如果你有手表或手环，在这里选一下是哪一种，先把设备记下来。下一步：设备真正连上以后，睡眠和活动会自动填入；现在睡眠和活动都自己填。</p>
        <p className="mt-1 text-sm text-[var(--dim)]">If you wear a watch or band, pick which one here so it is on record. Next step: once a real device connection is built, sleep and activity will fill in automatically; for now you type them in yourself.</p>
        <p className="mt-1 text-sm">每天的那两个活动问题，不管有没有设备都会问——这是为了保持一致。以后设备真正连上，设备记录会显示在您的答案旁边，团队可以把两个数字放在一起看，了解自己报得准不准。</p>
        <p className="mt-1 text-sm text-[var(--dim)]">The two daily activity questions are asked every day, wearable or not — that keeps things consistent. Once a device is really connected, its numbers will appear next to your own answers, so the team can compare the two and see how accurate self-reporting is.</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block text-sm">我的穿戴设备 My wearable
            <select aria-label="My wearable device" className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" value={devicePick} onChange={(e) => setDevicePick(e.target.value)}>
              <option value="">未连接 None — I don&apos;t use one</option>
              {WEARABLE_DEVICES.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select></label>
          <button type="button" disabled={saveDevice.isPending || devicePick === linkedDevice} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: TEAL }} onClick={() => { setDeviceMsg(""); saveDevice.mutate(); }}>{saveDevice.isPending ? "保存中… Saving…" : "保存设置 Save"}</button>
        </div>
        {hasWearable ? <p className="mt-2 text-sm" role="status" style={{ color: GREEN }}>已记录：{linkedDevice}。设备自动同步是下一步 — 现在睡眠和活动先自己填。<br /><span className="text-xs text-[var(--dim)]">Recorded: {linkedDevice}. Automatic syncing from the device is a next step — for now, type sleep and activity in yourself.</span></p> : <p className="mt-2 text-sm text-[var(--dim)]">现在还没有连接设备 — 睡眠时长需要自己填。No wearable linked yet — sleep hours are typed in by hand.</p>}
        {deviceMsg ? <p className="mt-1 text-sm" role="status" style={{ color: GREEN }}>{deviceMsg}</p> : null}
      </Card>

      <Card title="记录我的一天 Log my day — 记满一周，看一周的规律">
        <p className="text-sm">每天花一分钟，写下吃了什么、做了什么、睡得怎么样。一两天看不出规律，记满一周，下面的分析就会清楚很多。</p>
        <p className="mt-1 text-sm text-[var(--dim)]">One minute a day: what you ate, what you did, how you slept. One or two days show little; a full week shows the pattern.</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" aria-label="Previous week" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold" onClick={() => goWeek(-1)}>← 上一周 Prev</button>
          <p className="text-center text-sm font-bold" style={{ color: TEAL }}>{weekDays[0] ? `${weekDays[0].getMonth() + 1}月${weekDays[0].getDate()}日` : ""} – {weekDays[6] ? `${weekDays[6].getMonth() + 1}月${weekDays[6].getDate()}日` : ""}{isThisWeek ? " · 本周 This week" : ""}</p>
          <button type="button" aria-label="Next week" disabled={isThisWeek} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold disabled:opacity-40" onClick={() => goWeek(1)}>下一周 Next →</button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1.5" role="group" aria-label="Days of this week">
          {weekDays.map((d) => {
            const k = logDateKey(d);
            const has = byDate.has(k);
            const isSel = k === selDate;
            const isFuture = k > todayKey;
            return (
              <button key={k} type="button" disabled={isFuture} aria-label={`${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAY_ZH[d.getDay()] ?? ""}${has ? "，已记录 logged" : ""}`} aria-pressed={isSel}
                className="rounded-lg px-1 py-2 text-center disabled:opacity-40"
                style={isSel ? { background: TEAL, color: "#fff" } : { border: "1px solid var(--border)" }}
                onClick={() => setSelDate(k)}>
                <span className="block text-xs">周{WEEKDAY_ZH[d.getDay()] ?? ""}</span>
                <span className="block text-base font-bold">{d.getDate()}</span>
                <span className="block text-[10px]">{k === todayKey ? "今天" : has ? "✓ 已记" : "未记"}</span>
              </button>
            );
          })}
        </div>

        <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); submitLog(); }}>
          <p className="text-sm font-bold" style={{ color: TEAL }}>{selLabel}{existing ? " · 已有记录 Saved entry — 修改后重新保存即可 Editing is fine, just save again" : ""}</p>
          <label className="block text-sm">今天吃了什么 What I ate（早餐、午餐、晚餐、加餐，简单写就行）
            <textarea {...FIELDS.saveDailyLog.meals} aria-label="What I ate today" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" rows={3} value={meals} onChange={(e) => setMeals(e.target.value)} placeholder="例如：早餐鸡蛋+豆浆；午餐米饭、青菜、清蒸鱼；晚餐面条、番茄鸡蛋汤 / e.g. Breakfast egg and soy milk; lunch rice, greens, steamed fish…" /></label>
          <div>
            <p className="text-sm">餐食照片 Meal photo（可不加 Optional）</p>
            {shownPhotoUrl ? (
              <div className="mt-1 flex items-start gap-3">
                <img src={shownPhotoUrl} alt="这一天的餐食照片 Photo of this day's meal" className="h-28 w-28 rounded-lg border border-[var(--border)] object-cover" />
                <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold" onClick={() => { setPhoto(null); setPhotoPreview(""); setPhotoRemoved(true); }}>删除照片 Remove photo</button>
              </div>
            ) : (
              <label className="mt-1 inline-block cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold">📷 加一张餐食照片 Add a meal photo
                <input type="file" accept="image/jpeg,image/png" aria-label="Add a photo of the meal" className="sr-only" onChange={(e) => { void onPickPhoto(e.target.files?.[0] ?? null); e.target.value = ""; }} />
              </label>
            )}
            {photoErr ? <p className="mt-1 text-sm" role="alert" style={{ color: RED }}>{photoErr}</p> : null}
          </div>
          <div>
            <label className="block text-sm">今天做了什么活动 Activity（散步、快走、家务、锻炼…）
              <input {...FIELDS.saveDailyLog.activity} type="text" aria-label="Activity today" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="例如：晚饭后快走 / e.g. Brisk walk after dinner" /></label>
            <div className="mt-2 rounded-lg bg-[var(--surface-alt)] p-3 text-sm">
              <p className="font-semibold">这个活动有多强？用「说话测试」想一想 How hard was it? Use the talk test:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li><strong>高强度 High:</strong> 活动时没法舒服地说话，例如跑步。You cannot talk comfortably, e.g. running.</li>
                <li><strong>中等强度 Moderate:</strong> 能说话，但不能唱歌，例如快走。You can talk but not sing, e.g. brisk walking.</li>
                <li><strong>低强度 Low:</strong> 能轻松聊天，例如慢慢散步。You can chat easily, e.g. easy walking.</li>
              </ul>
            </div>
          </div>
          <div>
            <p className="text-sm">今天的活动分钟，按强度分开填 Activity minutes by intensity（分钟 minutes）</p>
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="block text-sm">高强度 High<span className="block text-xs font-normal text-[var(--dim)]">说话都费劲：跑步、快骑 Can't talk comfortably: running, fast cycling</span>
                <input {...FIELDS.saveDailyLog.highMinutes} type="number" aria-label="High intensity minutes" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={highMin} onChange={(e) => setHighMin(e.target.value)} /></label>
              <label className="block text-sm">中等强度 Moderate<span className="block text-xs font-normal text-[var(--dim)]">能说话、不能唱歌：快走、慢骑 Can talk, not sing: brisk walking</span>
                <input {...FIELDS.saveDailyLog.moderateMinutes} type="number" aria-label="Moderate intensity minutes" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={moderateMin} onChange={(e) => setModerateMin(e.target.value)} /></label>
              <label className="block text-sm">低强度 Low<span className="block text-xs font-normal text-[var(--dim)]">能轻松聊天：散步、家务、拉伸 Can chat easily: strolling, housework</span>
                <input {...FIELDS.saveDailyLog.lowMinutes} type="number" aria-label="Low intensity minutes" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={lowMin} onChange={(e) => setLowMin(e.target.value)} /></label>
              <label className="block text-sm">久坐 Sedentary<span className="block text-xs font-normal text-[var(--dim)]">坐着办公、看电视 Sitting</span>
                <input {...FIELDS.saveDailyLog.sedentaryMinutes} type="number" aria-label="Sedentary minutes" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={sedentaryMin} onChange={(e) => setSedentaryMin(e.target.value)} /></label>
            </div>
            <p className="mt-1 text-xs text-[var(--dim)]">今天活动合计（不含久坐）：{totalActiveMin} 分钟。Total active today (not counting sitting): {totalActiveMin} minutes.</p>
          </div>
          <div className="rounded-lg bg-[var(--surface-alt)] p-3">
            <p className="text-sm font-bold" style={{ color: TEAL }}>每天都问的两个活动问题 Two activity questions we ask every day</p>
            <div className="mt-2 rounded-lg bg-[var(--surface)] p-3 text-sm">
              <p className="font-semibold">怎么算「中等到高强度」？用「说话测试」What counts as moderate to vigorous? Use the talk test:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li><strong>高强度 High:</strong> 活动时没法舒服地说话，例如跑步。You cannot talk comfortably, e.g. running.</li>
                <li><strong>中等强度 Moderate:</strong> 能说话，但不能唱歌，例如快走。You can talk but not sing, e.g. brisk walking.</li>
                <li><strong>低强度 Low</strong>（不算在内 Does not count here）<strong>:</strong> 能轻松聊天，例如慢慢散步。You can chat easily, e.g. easy walking.</li>
              </ul>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">过去 2 周里，平均每周有几天做中等到高强度的身体活动？<br /><span className="text-xs text-[var(--dim)]">For an average week in the last 2 weeks, how many days per week did you do moderate to vigorous physical activity?</span>
                <input {...FIELDS.saveDailyLog.pavsDays} type="number" inputMode="numeric" aria-label="Days per week of moderate to vigorous physical activity" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" value={pavsDays} onChange={(e) => setPavsDays(e.target.value)} placeholder="0–7" /></label>
              <label className="block text-sm">在那些天里，平均每天活动多少分钟？<br /><span className="text-xs text-[var(--dim)]">On those days, how many minutes on average?</span>
                <input {...FIELDS.saveDailyLog.pavsMinutes} type="number" inputMode="numeric" aria-label="Minutes of activity on those days" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm" value={pavsMinutes} onChange={(e) => setPavsMinutes(e.target.value)} placeholder="如 30" /></label>
            </div>
            {pavsDays.trim() !== "" && pavsMinutes.trim() !== "" && Number(pavsDays) > 0 ? (
              <p className="mt-2 text-sm" role="status">按您填的数字：每周约 {Number(pavsDays) * Number(pavsMinutes || 0)} 分钟中等到高强度活动（目标：每周至少 150 分钟）。<br /><span className="text-xs text-[var(--dim)]">From your answers: about {Number(pavsDays) * Number(pavsMinutes || 0)} minutes of moderate-to-vigorous activity a week (goal: at least 150 minutes a week).</span></p>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">昨晚睡了几小时 Sleep last night (hours)
                <input {...FIELDS.saveDailyLog.sleepHours} type="number" step="0.5" aria-label="Sleep hours" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={sleepHours} onChange={(e) => { setSleepHours(e.target.value); setSleepSource("manual"); }} /></label>
              {hasWearable ? (
                <p className="mt-1.5 text-xs text-[var(--dim)]">设备自动同步是下一步 — 现在请自己填睡眠时长。Automatic syncing from your device is a next step — please type your sleep hours in for now.</p>
              ) : (
                <p className="mt-1.5 text-xs text-[var(--dim)]">还没有连接穿戴设备，请自己填睡眠时长。No wearable linked — type your sleep hours in.</p>
              )}
            </div>
            <label className="block text-sm">体重 Weight kg（可不填 Optional）
              <input {...FIELDS.saveDailyLog.weightKg} type="number" step="0.1" aria-label="Weight in kg, optional" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="可不填 Optional" /></label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm">今天心情 Mood（1 很低 low – 5 很好 great）</p>
              <div className="mt-1 flex gap-1.5">{[1, 2, 3, 4, 5].map((v) => scaleBtn(v, mood, setMood, "Mood"))}</div>
            </div>
            <div>
              <p className="text-sm">今天精力 Energy（1 很低 low – 5 很满 full）</p>
              <div className="mt-1 flex gap-1.5">{[1, 2, 3, 4, 5].map((v) => scaleBtn(v, energy, setEnergy, "Energy"))}</div>
            </div>
          </div>
          <div className="rounded-xl border-2 p-3" style={{ background: "#fdf0c8", borderColor: "#dfae1e", color: "#1b2321" }}>
            <label className="block text-sm font-semibold">今天感觉怎么样？想写就写一点，一句话就很好——开心、累、心里有事，都可以写下来。<span className="block text-xs font-normal text-[#6b5d33]">How did today feel? Write a little if you like — a sentence is plenty. Anything on your mind is welcome here.（可不填 Optional）</span>
              <textarea {...FIELDS.saveDailyLog.note} aria-label="How today felt — a little note for today" className="mt-1.5 w-full rounded-lg border-2 bg-white px-3 py-2 text-sm font-normal text-[#1b2321]" style={{ borderColor: "#dfae1e" }} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：今天有点累，不过晚饭后出去走了走，心情好多了。/ e.g. I felt terrible this morning, but a walk after dinner helped." /></label>
            <p className="mt-1.5 text-xs text-[#6b5d33]">这些小日记会和每周小结一起，收进下面的「日记本」里，以后可以慢慢回看。These little notes are gathered with your weekly reflection into the journal book below, so you can look back on them later.</p>
          </div>
          <button type="submit" disabled={save.isPending} className="rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }}>{save.isPending ? "保存中… Saving…" : existing ? "保存修改 Save changes" : "保存这一天 Save this day"}</button>
          {logsQ.isPending ? <p className="text-sm text-[var(--dim)]">正在读取你的记录… Loading your logs…</p> : null}
          {msg ? <p className="text-sm" role="status" style={{ color: GREEN }}>{msg}</p> : null}
          {errMsg ? <p className="text-sm" role="alert" style={{ color: RED }}>{errMsg}</p> : null}
        </form>
      </Card>

      <Card title="本周分析 Weekly analysis">
        {logged === 0 ? (
          <p className="mt-3 text-sm">这一周还没有记录。在上面记下第一天，这里就会开始出现你的饮食、活动和睡眠小结；记满一周，规律最清楚。<br /><span className="text-[var(--dim)]">No entries this week yet. Log your first day above and a summary of your eating, activity and sleep will start to appear here; a full week makes the pattern clearest.</span></p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2 text-center text-xs">
              {[
                [`${logged}/7`, "已记录天数 Days logged"],
                [`${mvpaTotal}`, "中等+高强度分钟 Moderate+high min"],
                [avgSleep != null ? fmt1(avgSleep) : "—", "平均睡眠 Avg sleep (h)"],
                [avgMood != null ? `${fmt1(avgMood)}/5` : "—", "平均心情 Avg mood"],
                [avgEnergy != null ? `${fmt1(avgEnergy)}/5` : "—", "平均精力 Avg energy"],
              ].map(([v, l]) => (
                <div key={l} className="min-w-[86px] flex-1 rounded-lg border border-[var(--border)] p-2"><p className="text-lg font-bold" style={{ color: TEAL }}>{v}</p><p className="text-[var(--dim)]">{l}</p></div>
              ))}
            </div>
            {thin ? (
              <p className="rounded-lg bg-[#fbf3d9] p-3 text-sm">现在只记了 {logged} 天，画面还不完整——下面的小结只根据已有的记录，记满一周后规律会清楚得多。<br /><span className="text-[var(--dim)]">Only {logged} day(s) logged so far — the picture is still thin. The summary below uses only what is there; it gets much fuller as the week fills in.</span></p>
            ) : null}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-[var(--surface-alt)] p-3">
                <p className="text-sm font-bold" style={{ color: TEAL }}>吃 Eating patterns</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                  <li>{mealsDays} 天记录了饮食。<br /><span className="text-xs text-[var(--dim)]">Food logged on {mealsDays} day(s).</span></li>
                  {mealsDays > 0 ? <li>提到蔬菜 {vegDays} 天 · 提到蛋/鱼/肉/豆制品/奶 {proteinDays} 天。<br /><span className="text-xs text-[var(--dim)]">Vegetables mentioned on {vegDays} day(s); protein foods on {proteinDays} day(s).</span></li> : null}
                  {sugarDays > 0 ? <li>含糖饮料、甜食或酒出现 {sugarDays} 天。<br /><span className="text-xs text-[var(--dim)]">Sugary drinks, sweets or alcohol on {sugarDays} day(s).</span></li> : null}
                </ul>
              </div>
              <div className="rounded-lg bg-[var(--surface-alt)] p-3">
                <p className="text-sm font-bold" style={{ color: TEAL }}>动 Activity</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                  <li>本周活动共 {totalMinutes} 分钟，有活动的 {activeDays} 天。<br /><span className="text-xs text-[var(--dim)]">{totalMinutes} active minutes in total, active on {activeDays} day(s).</span></li>
                  <li>按强度分：高强度 {highTotal} 分钟 · 中等强度 {moderateTotal} 分钟 · 低强度 {lowTotal} 分钟 · 久坐 {sedentaryTotal} 分钟。<br /><span className="text-xs text-[var(--dim)]">By intensity: high {highTotal} min · moderate {moderateTotal} min · low {lowTotal} min · sedentary {sedentaryTotal} min.</span></li>
                  <li>{mvpaTotal >= 150 ? "中等+高强度已达到每周 150 分钟的目标。" : `中等+高强度共 ${mvpaTotal} 分钟，离每周 150 分钟的目标还差 ${150 - mvpaTotal} 分钟。`}<br /><span className="text-xs text-[var(--dim)]">{mvpaTotal >= 150 ? "Moderate + high intensity reached the 150-minute weekly goal." : `${mvpaTotal} minutes of moderate + high intensity — ${150 - mvpaTotal} minutes short of the 150-minute weekly goal.`}</span></li>
                </ul>
              </div>
              <div className="rounded-lg bg-[var(--surface-alt)] p-3">
                <p className="text-sm font-bold" style={{ color: TEAL }}>睡 Sleep</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                  {avgSleep != null ? <li>平均 {fmt1(avgSleep)} 小时；{shortNights} 个晚上不足 7 小时。<br /><span className="text-xs text-[var(--dim)]">Averaged {fmt1(avgSleep)} hours; {shortNights} night(s) under 7 hours.</span></li> : <li>还没有填睡眠时长。<br /><span className="text-xs text-[var(--dim)]">No sleep hours entered yet.</span></li>}
                  {wearableSleepNights > 0 ? <li>其中 {wearableSleepNights} 晚的睡眠来自穿戴设备。<br /><span className="text-xs text-[var(--dim)]">Sleep came from the wearable on {wearableSleepNights} night(s).</span></li> : null}
                  {weightLine ? <li>{weightLine.zh}<br /><span className="text-xs text-[var(--dim)]">{weightLine.en}</span></li> : null}
                </ul>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg p-3" style={{ background: "#eaf4ec" }}>
                <p className="text-sm font-bold" style={{ color: GREEN }}>做得好的 What's going well</p>
                {good.length ? (
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                    {good.map((g) => (<li key={g.zh}>{g.zh}<br /><span className="text-xs text-[var(--dim)]">{g.en}</span></li>))}
                  </ul>
                ) : <p className="mt-1 text-sm">继续记录，亮点会随着天数多起来。<br /><span className="text-xs text-[var(--dim)]">Keep logging — the bright spots build up as the days do.</span></p>}
              </div>
              <div className="rounded-lg p-3" style={{ background: "#fbf3d9" }}>
                <p className="text-sm font-bold" style={{ color: AMBER }}>需要留意的 What to watch</p>
                {watch.length ? (
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                    {watch.map((w) => (<li key={w.zh}>{w.zh}<br /><span className="text-xs text-[var(--dim)]">{w.en}</span></li>))}
                  </ul>
                ) : <p className="mt-1 text-sm">暂时没有明显的提醒项。<br /><span className="text-xs text-[var(--dim)]">Nothing stands out to watch yet.</span></p>}
              </div>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-[var(--dim)]">这份分析会先由营养师复核确认，再作为正式建议发给您。<br />This analysis is reviewed and confirmed by a dietitian before it is sent to you as advice.</p>
      </Card>

      <Card title="本周小结 Weekly reflection — 写给这一周的自己">
        <p className="text-sm">这一周，什么感觉稍微容易了一点？什么感觉难了一点？有没有什么想记住的，或者下周想试一试的？</p>
        <p className="mt-1 text-sm text-[var(--dim)]">This week, what felt a little easier, what felt harder, and is there anything you want to remember or try next week?</p>
        <p className="mt-1 text-xs text-[var(--dim)]">顺心的和不顺心的都可以写，遇到难处也可以写下来。不用有进步才写——每一周的样子，都值得记下来。（可不填 Optional）<br />Good things and hard things are both welcome, and so are barriers. There is no need to have improved to write — every week is worth remembering, just as it was.</p>
        <label className="mt-3 block text-sm">我这一周的小结 My reflection for {weekDays[0] ? `${weekDays[0].getMonth() + 1}月${weekDays[0].getDate()}日` : ""} – {weekDays[6] ? `${weekDays[6].getMonth() + 1}月${weekDays[6].getDate()}日` : ""} 这一周
          <textarea {...FIELDS.saveWeeklyReflection.text} aria-label="Weekly reflection" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" rows={4} value={reflText} onChange={(e) => setReflText(e.target.value)} placeholder="例如：这周晚饭后散步比上周容易坚持了；难的是下雨天不想出门。下周想试试在家原地走。/ e.g. Walking after dinner felt a little easier this week; rainy days felt harder. Next week I want to try marching in place at home." /></label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" disabled={saveReflection.isPending} className="rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => { setReflMsg(""); setReflErr(""); saveReflection.mutate(); }}>{saveReflection.isPending ? "保存中… Saving…" : reflByWeek.get(logDateKey(weekStart)) ? "保存修改 Save changes" : "保存本周小结 Save this week's reflection"}</button>
          {reflMsg ? <p className="text-sm" role="status" style={{ color: GREEN }}>{reflMsg}</p> : null}
          {reflErr ? <p className="text-sm" role="alert" style={{ color: RED }}>{reflErr}</p> : null}
        </div>
      </Card>

      <Card title="我的日记本 My journal book — 一周一页，一页一周">
        <p className="text-sm">每天的小日记和每周的小结，都收在这里，一周一页。日子久了，这些页连起来，就是您自己的健康故事，可以和健康数据一起慢慢回看。</p>
        {journalWeeks.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--dim)]">日记本还是空的。在上面的某一天写一句「今天感觉怎么样」，或者写下本周小结，第一页就会出现在这里。<br />Your journal book is still empty. Write a line in “How did today feel?” on any day above, or save a weekly reflection, and your first page will appear here.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {journalWeeks.map((w) => {
              const endD = addDaysTo(w.weekStart, 6);
              const notedDays = w.days.filter((d) => d.note.trim() !== "");
              const wSleep = avgOf(w.days.filter((d) => d.sleepHours > 0).map((d) => d.sleepHours));
              const wMvpa = w.days.reduce((a, d) => a + d.highMinutes + d.moderateMinutes, 0);
              return (
                <article key={logDateKey(w.weekStart)} className="rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4">
                  <p className="text-sm font-bold" style={{ color: DEEP }}>{w.weekStart.getMonth() + 1}月{w.weekStart.getDate()}日 – {endD.getMonth() + 1}月{endD.getDate()}日 · 这一周的一页<br /><span className="text-xs font-normal text-[var(--dim)]">Week of {w.weekStart.toLocaleDateString("en-GB")} – {endD.toLocaleDateString("en-GB")}</span></p>
                  <p className="mt-1 text-xs text-[var(--dim)]">这一周记了 {w.days.length} 天 · 中等+高强度活动 {wMvpa} 分钟{wSleep != null ? ` · 平均睡眠 ${fmt1(wSleep)} 小时` : ""}<br />Logged {w.days.length} day(s) · {wMvpa} minutes of moderate + high activity{wSleep != null ? ` · sleep averaged ${fmt1(wSleep)} hours` : ""}</p>
                  {notedDays.length ? (
                    <div className="mt-3 space-y-2">
                      {notedDays.map((d) => (
                        <div key={d.logDate} className="rounded-lg bg-[var(--surface)] p-3">
                          <p className="text-xs font-semibold text-[var(--dim)]">{dayLabel(d.logDate)}</p>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm">{d.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-sm text-[var(--dim)]">这一周还没有每天的小日记。No daily notes this week.</p>}
                  {w.reflection.trim() !== "" ? (
                    <div className="mt-3 rounded-lg p-3" style={{ background: "#eaf4ec" }}>
                      <p className="text-xs font-semibold" style={{ color: GREEN }}>本周小结 Weekly reflection</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm">{w.reflection}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}

function PatientApp({ patients }: { patients: Patient[] }) {
  const [appPid, setAppPid] = useState("P001");
  const [pageSub, setPageSub] = useState<"demo" | "log" | "senior">("demo");
  const [appTab, setAppTab] = useState<AppTabKey>("today");
  const [showContact, setShowContact] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [glucose, setGlucose] = useState("");
  const [glucoseMsg, setGlucoseMsg] = useState("");
  const [medTaken, setMedTaken] = useState<null | boolean>(null);
  const [msgText, setMsgText] = useState("");
  const [msgRole, setMsgRole] = useState("健康教练 Health coach");
  const [msgSent, setMsgSent] = useState("");
  const [weekDays, setWeekDays] = useState<boolean[]>([true, true, false, true, true, true, false]);
  /* The Resources page's "Go to the screener" button sets this flag, then
     switches to this tab; land the patient straight on the screener tab. */
  useEffect(() => {
    if (sessionStorage.getItem("openScreener") === "1") {
      sessionStorage.removeItem("openScreener");
      setPageSub("demo");
      setAppTab("screener");
    }
  }, []);
  const p = patients.find((x) => x.id === appPid) ?? patients[0];
  const checkins = [0.3, 0.7, 1.5, 1.8, 2, 1.2, 1, 2.5, 1.3, 0.5, 1, 0.5, 0.5, 2];
  const ringPct = 238 / 150;
  const R = 34, C = 2 * Math.PI * R;
  const submitGlucose = () => {
    const v = Number(glucose);
    if (!glucose || !Number.isFinite(v)) { setGlucoseMsg("请输入数值 Please enter a value."); return; }
    if (v < 3.9) setGlucoseMsg("血糖偏低：请立即吃约15克糖（如半杯果汁），15分钟后复测。医生团队已收到提醒。Low glucose: take about 15 g of sugar now and re-test in 15 minutes. The care team has been alerted.");
    else if (v >= 13.9) setGlucoseMsg("血糖很高：医生团队已收到提醒，今天会联系您。如有明显口渴、乏力或意识模糊，请立即就医。Very high glucose: the care team has been alerted and will call today.");
    else if (v >= 7) setGlucoseMsg("高于目标：已记录，团队会在下次随访时和您一起看。Above target: logged for review at the next check-in.");
    else setGlucoseMsg("已记录，在目标范围内，做得好！Logged and in range. Well done!");
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>患者端 Patient app</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="text-sm">患者 Patient
            <select aria-label="Patient" className="ml-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={appPid} onChange={(e) => setAppPid(e.target.value)}>
              {patients.map((x) => (<option key={x.id} value={x.id}>{x.id}</option>))}
            </select></label>
        </div>
      </div>
      <SubTabs label="Patient app sections" value={pageSub} onChange={setPageSub} tabs={[
        { key: "demo", zh: "小程序", en: "Mini-program" },
        { key: "log", zh: "记录我的一天", en: "Log my day" },
        { key: "senior", zh: "每日打卡", en: "Daily check-in" },
      ]} />
      {pageSub === "demo" ? (
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="mx-auto w-full max-w-[360px] rounded-[2rem] border-[10px] border-[#22312e] bg-[var(--surface)] shadow-xl">
          <div className="flex items-center justify-between px-4 pt-3 text-xs text-[var(--dim)]"><span>9:41</span><span className="text-sm font-bold" style={{ color: TEAL }}>院后健康 Houyuan Health</span><span>●●●</span></div>
          <div className="flex items-center justify-between px-4 pt-2">
            <span className="text-xs text-[var(--dim)]">{p?.id} · {p ? stageEn(p.stage) : ""}</span>
            <button type="button" className="rounded-lg px-2 py-1 text-xs font-bold text-white" style={{ background: TEAL }} onClick={() => setShowContact(!showContact)}>联系团队 Contact team</button>
          </div>
          {p && p.id !== "P001" ? (
            <p className="mx-4 mt-2 rounded-lg bg-[#fbf3d9] p-2 text-xs">手机里的步数、睡眠、饮食和运动分钟是 P001 的居家记录；{p.id} 本人的数值看「医疗」页的“我的指标”和「今天」的打卡天数。<br /><span className="text-[var(--dim)]">Steps, sleep, food and activity minutes in this phone are P001&apos;s home record. {p.id}&apos;s own values are under Medical (“My measures”) and the check-in count on Today.</span></p>
          ) : null}
          {showContact ? (
            <div className="space-y-2 p-4">
              <p className="rounded-lg bg-[#fdecec] p-2 text-xs font-semibold" style={{ color: RED }}>紧急情况请拨打 120，不要用消息。消息一般在1个工作日内回复。In an emergency call 120; do not use messages. Replies usually within one working day.</p>
              <label className="block text-xs">发给谁 To
                <select aria-label="Message recipient role" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={msgRole} onChange={(e) => setMsgRole(e.target.value)}>
                  {["医生 Physician", "营养师 Dietitian", "运动/康复师 Exercise specialist", "心理/睡眠咨询师 Counselor", "健康教练 Health coach", "不确定，由团队转给合适的人 Not sure — route for me"].map((r) => (<option key={r} value={r}>{r}</option>))}
                </select></label>
              <label className="block text-xs">内容 Message
                <textarea aria-label="Message to team" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" rows={3} value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="想问什么都可以 Ask anything" /></label>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => { if (msgText.trim()) { setMsgSent(`已发送给${msgRole}，会尽快回复。Sent — you will get a reply soon.`); setMsgText(""); } else { setMsgSent("请先填写内容。Please write a message first."); } }}>发送 Send</button>
              {msgSent ? <p className="text-xs" role="status">{msgSent}</p> : null}
              <div className="rounded-lg border border-[var(--border)] p-2 text-xs">
                <p className="text-[var(--dim)]">健康教练 Health coach · 2026-11-19 14:30</p>
                <p>可以在家做15分钟原地快走，再加10分钟弹力带，一样算完成目标。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {appTab === "today" ? (
                <>
                  <p className="text-base font-bold">早上好 Morning!</p>
                  <p className="text-xs text-[var(--dim)]">本周目标：每周运动150分钟 · 打卡 {p?.checkinDays ?? 6}/7天<br />This week's goal: 150 active minutes; checked in {p?.checkinDays ?? 6} of 7 days</p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { zh: "拍饮食照片", en: "Food photo", done: aiDone, tab: "food" as AppTabKey },
                      { zh: "身心打卡：睡眠、压力、烟酒、社交", en: "Daily check-in", done: checkedIn, tab: "check" as AppTabKey },
                      { zh: "晨起空腹血糖", en: "Fasting glucose", done: glucoseMsg !== "", tab: "med" as AppTabKey },
                      { zh: "测血压", en: "Blood pressure", done: false, tab: "med" as AppTabKey },
                      { zh: "按时服药", en: "Medication", done: medTaken !== null, tab: "med" as AppTabKey },
                    ].map((t) => (
                      <button key={t.zh} type="button" className="flex w-full items-center gap-2 rounded-lg bg-[var(--surface-alt)] p-2 text-left" onClick={() => setAppTab(t.tab)}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] text-white" style={{ borderColor: t.done ? GREEN : "#cbbf9e", background: t.done ? GREEN : "transparent" }}>{t.done ? "✓" : ""}</span>
                        <span>{t.zh} <span className="text-xs text-[var(--dim)]">{t.en}</span></span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-bold" style={{ color: TEAL }}>我的六大支柱（近7天）My six pillars, last 7 days</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[["nutrition", "营养 Nutrition", "部分达标 Partly", AMBER], ["activity", "运动 Activity", "达标 On track", GREEN], ["sleep", "睡眠 Sleep", "部分达标 Partly", AMBER], ["stress", "压力 Stress", "达标 On track", GREEN], ["social", "社会联系 Social", "达标 On track", GREEN], ["substances", "戒烟限酒 Tobacco/alcohol", "达标 On track", GREEN]].map(([k, zh, st, c]) => (
                        <div key={zh} className="rounded-lg border p-2" style={{ borderColor: "var(--border)", borderLeft: `5px solid ${c}` }}><PillarImg k={k ?? ""} className="mb-1 h-9 w-9 rounded-lg object-cover" /><p className="font-semibold">{zh}</p><p className="text-[var(--dim)]">{st}</p></div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--surface-alt)] p-2 text-xs">
                    <p className="font-semibold">来自团队 From your team · 健康教练 · 2026-11-20</p>
                    <p>本周做得很好！下周我们试试把快走加到35分钟？</p>
                  </div>
                </>
              ) : null}
              {appTab === "screener" ? (
                <>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>生活方式医学问卷 Lifestyle medicine screener</p>
                  <ScreenerForm />
                </>
              ) : null}
              {appTab === "food" ? (
                <>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>拍照记录饮食 Photo food diary</p>
                  <label className="block text-xs">哪一餐 Meal
                    <select aria-label="Meal" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"><option>早餐 Breakfast</option><option>午餐 Lunch</option><option>晚餐 Dinner</option><option>加餐 Snack</option></select></label>
                  <button type="button" className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => setAiDone(true)}>AI分析 Analyze</button>
                  {aiDone ? (
                    <div className="rounded-lg border border-[var(--border)] p-3 text-xs">
                      <p className="font-semibold">AI结果 AI result · 置信度 88%</p>
                      <div className="mt-2 flex justify-center"><Plate veg={50} protein={30} staple={20} /></div>
                      <p className="mt-1 text-center">蔬菜 50% · 蛋白 30% · 主食 20% · 约 560 kcal</p>
                      <p className="mt-1 rounded bg-[#eef6f3] p-2">很好，用玉米代替米饭是好选择。<br /><span className="text-[var(--dim)]">Good: corn in place of rice is a smart choice.</span></p>
                      <p className="mt-1 text-[var(--dim)]">已发送给营养师确认 Sent to the dietitian to confirm — AI结果须经营养师确认后生效。AI results take effect only after dietitian confirmation.</p>
                    </div>
                  ) : null}
                  {p?.id === "P001" ? <p className="text-xs text-[var(--dim)]">我的饮食记录 My food log：晚餐 2026-11-20 · 约1150 kcal · 已点评 Reviewed；晚餐 2026-11-19 · 约560 kcal · 已点评 Reviewed</p> : <p className="text-xs text-[var(--dim)]">我的饮食记录 My food log：{p?.id} 暂无饮食记录 No food entries yet for {p?.id}</p>}
                </>
              ) : null}
              {appTab === "move" ? (
                <>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>穿戴设备 Wearable</p>
                  <label className="block text-xs">数据来源 Data source
                    <select aria-label="Wearable source" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"><option>华为运动健康 Huawei Health</option><option>小米运动健康 Mi Fitness</option><option>微信运动 WeChat WeRun</option><option>Apple 健康 Apple Health</option><option>未连接 Not connected</option></select></label>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    {[["6333", "今日步数 Steps"], ["34", "活动分钟 Active min"], ["6.6", "昨晚睡眠 Sleep h"], ["68", "静息心率 Resting HR"]].map(([v, l]) => (
                      <div key={l} className="rounded-lg border border-[var(--border)] p-2"><p className="text-lg font-bold" style={{ color: TEAL }}>{v}</p><p className="text-[var(--dim)]">{l}</p></div>
                    ))}
                  </div>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>近14天步数 Steps, last 14 days</p>
                  <div className="flex h-16 items-end gap-1" role="img" aria-label="Daily steps bars">
                    {checkins.map((v, i) => (<div key={i} className="flex-1 rounded-t" style={{ height: `${(v / 2.5) * 52}px`, background: TEAL }} />))}
                  </div>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>本周运动 This week's exercise</p>
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 90 90" className="h-16 w-16" role="img" aria-label="Exercise ring 238 of 150 minutes">
                      <circle cx="45" cy="45" r={R} fill="none" stroke="#ece5d3" strokeWidth="10" />
                      <circle cx="45" cy="45" r={R} fill="none" stroke={GREEN} strokeWidth="10" strokeDasharray={`${Math.min(1, ringPct) * C} ${C}`} transform="rotate(-90 45 45)" strokeLinecap="round" />
                      <text x="45" y="49" textAnchor="middle" fontSize="13" fontWeight="700" fill={TEAL}>238</text>
                    </svg>
                    <p className="text-xs">238/150 分钟 minutes · 已超目标 Goal exceeded</p>
                  </div>
                </>
              ) : null}
              {appTab === "check" ? (
                <>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>今日身心打卡 Daily check-in · 约1分钟</p>
                  <div className="space-y-2 text-xs">
                    <label className="block">昨晚睡了几小时 Hours slept<input aria-label="Hours slept" type="number" step="0.5" min="0" max="16" defaultValue={6.5} className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" /></label>
                    <label className="block">今天压力 Stress today（0–10）<input aria-label="Stress today" type="number" min="0" max="10" defaultValue={4} className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" /></label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">吸烟（支）Cigarettes<input aria-label="Cigarettes" type="number" min="0" max="80" defaultValue={0} className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" /></label>
                      <label className="block">饮酒（杯）Drinks<input aria-label="Drinks" type="number" min="0" max="30" defaultValue={0} className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" /></label>
                    </div>
                    <label className="block">今天和家人朋友好好相处了吗？Quality time with family or friends?
                      <select aria-label="Social time today" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm"><option>是 Yes</option><option>没有 Not today</option></select></label>
                  </div>
                  <button type="button" className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => setCheckedIn(true)}>保存打卡 Save check-in</button>
                  {checkedIn ? <p className="text-xs" role="status" style={{ color: GREEN }}>已保存，今天做得不错！Saved. Nice work today!</p> : null}
                  <p className="text-xs text-[var(--dim)]">打卡记录 Check-in history（14天）：11月9日–22日，大部分日子已完成。Most days completed, Nov 9–22.</p>
                </>
              ) : null}
              {appTab === "med" ? (
                <>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>今天用药 Medication today</p>
                  <p className="rounded-lg bg-[var(--surface-alt)] p-2 text-xs">二甲双胍 Metformin 500mg 每日两次 twice daily（如医生已调整，以医嘱为准 Follow your physician's latest instruction）</p>
                  {medTaken === null ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" className="rounded-lg px-2 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => setMedTaken(true)}>已按时服药 Taken</button>
                      <button type="button" className="rounded-lg border px-2 py-2 text-sm font-semibold" style={{ borderColor: TEAL, color: TEAL }} onClick={() => setMedTaken(false)}>漏服 Missed</button>
                    </div>
                  ) : <p className="text-xs" role="status">{medTaken ? "今天已记录按时服药 Logged as taken today" : "已记录漏服。如何补服请先问医生或药师，可点上方“联系团队”。Logged as missed — ask your doctor or pharmacist first."}</p>}
                  <p className="text-sm font-bold" style={{ color: TEAL }}>记录血糖 Log glucose</p>
                  <div className="flex gap-2">
                    <input aria-label="Fasting glucose value" type="number" step="0.1" min="1" max="35" className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" placeholder="空腹血糖 mmol/L" value={glucose} onChange={(e) => setGlucose(e.target.value)} />
                    <button type="button" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={submitGlucose}>保存 Save</button>
                  </div>
                  {glucoseMsg ? <p className="rounded-lg bg-[#fbf3d9] p-2 text-xs" role="status">{glucoseMsg}</p> : null}
                  <p className="text-xs text-[var(--dim)]">阈值提示由诊所医生确定。Alert thresholds are set by the clinic's physicians. 本平台支持健康管理，不替代医疗建议。This platform supports care and does not replace medical advice.</p>
                  <p className="text-xs">我的指标 My measures：体重 {p?.measures.weightKg ?? 74.2}kg · HbA1c {p?.measures.hba1cPct ?? 5.5}% · 血压 {p?.measures.systolic ?? 140}/{p?.measures.diastolic ?? 79}</p>
                </>
              ) : null}
              {appTab === "goal" ? (
                <>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>关键指标进展 Key indicators</p>
                  <div className="space-y-2 text-xs">
                    {(p?.id === "P001" ? [
                      { zh: "体重 Weight", pct: 77 as number | undefined, text: `${p?.measures.weightKg ?? 74.2}kg / 目标 ≤73.3kg` },
                      { zh: "内脏脂肪 Visceral fat", pct: 90 as number | undefined, text: `${p?.measures.visceralFat ?? 9}级 / ≤9级` },
                      { zh: "HbA1c", pct: 96 as number | undefined, text: `${p?.measures.hba1cPct ?? 5.5}% / ≤5.7%` },
                      { zh: "血压 BP", pct: 71 as number | undefined, text: `${p?.measures.systolic ?? 140}/${p?.measures.diastolic ?? 79} / ≤130/80` },
                    ] : [
                      /* Progress percentages are P001's; other patients see their own values only. */
                      { zh: "体重 Weight", pct: undefined, text: `${p?.measures.weightKg ?? "—"}kg` },
                      { zh: "内脏脂肪 Visceral fat", pct: undefined, text: `${p?.measures.visceralFat ?? "—"}级 / ≤9级` },
                      { zh: "HbA1c", pct: undefined, text: `${p?.measures.hba1cPct ?? "—"}% / ≤5.7%` },
                      { zh: "血压 BP", pct: undefined, text: `${p?.measures.systolic ?? "—"}/${p?.measures.diastolic ?? "—"} / ≤130/80` },
                    ]).map((r) => (
                      <div key={r.zh}><div className="mb-0.5 flex justify-between"><span>{r.zh}</span><span className="text-[var(--dim)]">{r.text}{r.pct != null ? ` · ${r.pct}%` : ""}</span></div>{r.pct != null ? <Progress pct={r.pct} /> : null}</div>
                    ))}
                  </div>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>我的目标 My goals</p>
                  <ul className="space-y-1 text-xs">
                    <li><strong>长期 Long-term</strong> — HbA1c 降到6.5%以下，体重减少7%</li>
                    <li><strong>中期 Mid-term</strong> — 体重减少3–5%，内脏脂肪下降1级</li>
                    <li><strong>本周 This week</strong> — 工作日午餐主食减半，小程序拍照记录</li>
                  </ul>
                  <p className="text-sm font-bold" style={{ color: TEAL }}>本周打卡 This week — 点按切换 Tap to toggle</p>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {["一", "二", "三", "四", "五", "六", "日"].map((d, i) => (
                      <button key={d} type="button" aria-label={`Weekday ${d}`} aria-pressed={weekDays[i]} className="rounded-lg py-2 font-semibold" style={weekDays[i] ? { background: TEAL, color: "#fff" } : { border: "1px solid var(--border)" }} onClick={() => setWeekDays(weekDays.map((v, j) => (j === i ? !v : v)))}>{d}</button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--dim)]">已完成 {weekDays.filter(Boolean).length}/7 天 · 发送给健康教练 Send to my coach</p>
                </>
              ) : null}
            </div>
          )}
          {!showContact ? (
            <div className="grid grid-cols-7 border-t border-[var(--border)] text-center text-[10px]">
              {APP_TABS.map((t) => (
                <button key={t.key} type="button" aria-label={`Patient app tab ${t.en}`} className="py-2" style={appTab === t.key ? { color: TEAL, fontWeight: 700, boxShadow: "inset 0 2px 0 #1d6762" } : { color: "var(--dim)" }} onClick={() => setAppTab(t.key)}>{t.zh}<br />{t.en}</button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-4">
          <Card title="数据去向 Where each entry goes">
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li><strong>饮食照片</strong> → AI识别食物和份量 → 进入营养师待办 → 营养师确认后发回患者。Food photo → AI → dietitian queue → confirmed reply.</li>
              <li><strong>血糖、血压</strong> → 按医生设定的阈值判断 → 超标进入医生待办和运营看板。Glucose/BP → thresholds → physician queue and dashboard.</li>
              <li><strong>运动、睡眠</strong> → 从手机健康数据或手环同步 → 显示在档案趋势中。Activity/sleep → synced → record trends.</li>
              <li><strong>身心打卡</strong> → 汇入六大支柱概览，红色进入相应角色待办。Check-in → six pillars; red goes to the matching role.</li>
              <li><strong>联系团队</strong> → 按所选角色分发 → 回复显示在患者端。Contact team → routed by role → replies in the app.</li>
            </ol>
            <p className="mt-3 rounded-lg bg-[#fbf3d9] p-3 text-xs">真实系统：AI用国内模型、数据存放在国内服务器；穿戴设备接口（如华为运动健康）需开发者确认可用性。In the real system the AI uses a domestic model and data stays on servers in China; wearable interfaces (e.g. Huawei Health) need developer confirmation.</p>
          </Card>
          <Card title="患者端功能 Patient-app features">
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>拍照记录饮食、AI餐盘分析（营养师确认）— Photo food logging with AI plate analysis, dietitian-confirmed</li>
              <li>每日打卡（睡眠/压力/烟酒/社交）— Daily check-ins</li>
              <li>血糖/血压/服药记录与阈值提醒 — Glucose, BP and medication logging with threshold alerts</li>
              <li>本周目标与进度条、团队消息与点评 — Goals, progress, team messages and reviews</li>
              <li>化验与体测结果查看 — Lab and body-composition results</li>
            </ul>
          </Card>
          <Card title="上线前待确认 To confirm before launch">
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              <li>提醒时间与频率 — Reminder timing and frequency</li>
              <li>拍照识别准确率与人工复核流程 — Photo-recognition accuracy and human review flow</li>
              <li>数据同步频率（华为运动健康）— Sync frequency (Huawei Health)</li>
              <li>患者端是否显示化验数值 — Whether lab values show in the patient app</li>
              <li>未成年人/家属账号权限 — Minor / family account permissions</li>
            </ul>
          </Card>
          <Card title="患者端（小程序）使用流程 Patient mini-program flow">
            <ol className="space-y-2 text-sm">
              {["患者扫码进入 Patient scans a code", "绑定档案 Link the record", "每日打卡 Daily check-in", "拍照记录饮食 Photo-log food", "查看目标进度 View goal progress", "接收团队消息 Receive team messages"].map((s, i) => (
                <li key={s} className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: TEAL }}>{i + 1}</span>{s}</li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
      ) : null}
      {pageSub === "log" ? <LogMyDay /> : null}
      {pageSub === "senior" ? <SeniorCheckinPanel /> : null}
    </div>
  );
}

/* ================= Public outcomes ================= */
function PublicOutcomes({ patients }: { patients: Patient[] }) {
  const [sub, setSub] = useState<"overview" | "trends" | "cases">("overview");
  /* Completed week 12 = now at the week-24 stage; "in week 24" is its own card.
     Both match the Dashboard KPI, which counts the same way. */
  const done12 = patients.filter((p) => p.stage === "第24周").length;
  const done24 = patients.filter((p) => p.stage === "第24周").length;
  const hba1cDown = hba1cDroppedCount(patients);
  const hba1cPct = patients.length ? Math.round((hba1cDown / patients.length) * 100) : 0;
  const caseOf = (id: string) => patients.find((x) => x.id === id);
  const caseRows = ([
    { label: "A女士 42岁 Female, 42", p: caseOf("P001"), note: "坚持快走与主食减半 Kept walking and halved staples" },
    { label: "B男士 52岁 Male, 52", p: caseOf("P006"), note: "血压仍偏高，继续随访 BP still high, ongoing follow-up" },
    { label: "C女士 35岁 Female, 35", p: caseOf("P007"), note: "体重已达目标 Weight goal reached" },
  ] as const).filter((c) => c.p).map((c) => {
    const base = baselineFor(c.p!);
    const latest = c.p!.measures;
    const dw = Math.round((latest.weightKg - base.weightKg) * 10) / 10;
    const dh = Math.round((latest.hba1cPct - base.hba1cPct) * 10) / 10;
    return [c.label, `${base.weightKg}→${latest.weightKg}kg · HbA1c ${base.hba1cPct}→${latest.hba1cPct}%`, `体重 ${dw}kg · HbA1c ${dh}%`, c.note] as const;
  });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>成果公示 Public outcomes</h2>
        <p className="text-sm text-[var(--dim)]">院后健康慢病管理 · 匿名成果 Houyuan Health chronic-disease management · anonymous outcomes</p>
        <p className="mt-2 rounded-lg bg-[#fbf3d9] p-3 text-sm">仅显示汇总结果，不含任何个人信息；人数少于 5 人的组不显示（MIN_N=5 抑制规则）。真实系统中此页单独发布到官网或公众号，不需要登录。<br />Aggregate results only, no personal information; groups under 5 people are suppressed (MIN_N=5). In the real system this page is published on its own, with no login.</p>
      </div>
      <SubTabs label="Public outcomes sections" value={sub} onChange={setSub} tabs={[
        { key: "overview", zh: "总览", en: "Overview" },
        { key: "trends", zh: "趋势", en: "Trends" },
        { key: "cases", zh: "匿名案例", en: "Anonymous cases" },
      ]} />
      {sub === "overview" ? (
        <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { zh: "参加人数", en: "Participants", v: `${patients.length}` },
          { zh: "完成12周", en: "Completed 12 weeks", v: `${done12}` },
          { zh: "进入第24周", en: "In week 24", v: `${done24}` },
          { zh: "平均减重", en: "Average weight lost", v: "2.4 kg" },
          { zh: "HbA1c下降≥0.3", en: "HbA1c down ≥0.3", v: `${hba1cPct}% (${hba1cDown}/${patients.length})` },
        ].map((k) => (
          <div key={k.zh} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="text-2xl font-bold" style={{ color: TEAL }}>{k.v}</div>
            <div className="text-xs">{k.zh} <span className="text-[var(--dim)]">{k.en}</span></div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="各类指标改善的人数比例 Share who improved, by category">
          <div className="space-y-2 text-sm">
            {[
              { zh: "体重与体成分 Weight & body composition", pct: 71, c: TEAL },
              { zh: "血糖 Blood glucose", pct: 64, c: "#b86a1f" },
              { zh: "血压 Blood pressure", pct: 57, c: RED },
              { zh: "血脂 Blood lipids", pct: 62, c: "#8a5a9e" },
              { zh: "体能 Fitness", pct: 78, c: GREEN },
              { zh: "情绪与睡眠 Mood & sleep", pct: 69, c: "#5b6fa8" },
            ].map((r) => (
              <div key={r.zh} className="flex items-center gap-2">
                <span className="w-44 shrink-0 text-xs sm:text-sm">{r.zh}</span>
                <div className="h-4 flex-1 rounded bg-[#f1ead9]"><div className="h-4 rounded" style={{ width: `${r.pct}%`, background: r.c }} /></div>
                <span className="w-10 shrink-0 text-right font-semibold">{r.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="六大支柱：近7天达标比例 Six pillars on track, last 7 days">
          <div className="space-y-2 text-sm">
            {[
              { k: "nutrition", zh: "营养 Nutrition", pct: 43 }, { k: "activity", zh: "运动 Activity", pct: 64 }, { k: "sleep", zh: "睡眠 Sleep", pct: 36 },
              { k: "stress", zh: "压力 Stress", pct: 57 }, { k: "social", zh: "社会联系 Social", pct: 71 }, { k: "substances", zh: "戒烟限酒 Tobacco/alcohol", pct: 86 }, { k: "", zh: "医疗 Medical", pct: 50 },
            ].map((r) => (
              <div key={r.zh} className="flex items-center gap-2">
                <span className="flex w-44 shrink-0 items-center gap-1.5 text-xs sm:text-sm">{r.k ? <PillarImg k={r.k} className="h-6 w-6 shrink-0 rounded-md object-cover" /> : null}{r.zh}</span>
                <div className="h-4 flex-1 rounded bg-[#f1ead9]"><div className="h-4 rounded" style={{ width: `${r.pct}%`, background: GREEN }} /></div>
                <span className="w-10 shrink-0 text-right font-semibold">{r.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <p className="text-base font-semibold">参与 {patients.length} 人 · 平均减重 2.4 kg · 平均 HbA1c 下降 0.3% · 平均收缩压下降 6 mmHg</p>
        <p className="text-sm text-[var(--dim)]">{patients.length} participants · average weight loss 2.4 kg · average HbA1c down 0.3% · average systolic BP down 6 mmHg</p>
      </Card>
        </>
      ) : null}
      {sub === "trends" ? (
        <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="平均体重变化 Average weight change">
          <LineChart yMin={76} yMax={82} xLabels={["第0周 Week 0", "第24周 Week 24"]} series={[{ label: "平均体重 Average weight (kg)", color: TEAL, points: [81, 80.2, 79.5, 78.9, 78.6] }]} />
        </Card>
        <Card title="平均 HbA1c 变化 Average HbA1c change">
          <LineChart yMin={5.3} yMax={6.1} xLabels={["第0周 Week 0", "第24周 Week 24"]} series={[{ label: "平均 HbA1c Average HbA1c (%)", color: GREEN, points: [6.0, 5.9, 5.8, 5.7, 5.7] }]} />
        </Card>
      </div>
        </>
      ) : null}
      {sub === "cases" ? (
        <>
      <Card title="匿名案例 Anonymous cases">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">参与者 Participant</th><th className="py-2 pr-2">基线 → 24周 Baseline → 24 weeks</th><th className="py-2 pr-2">变化 Change</th><th className="py-2">备注 Note</th></tr></thead>
            <tbody>
              {caseRows.map((r) => (<tr key={r[0]} className="border-b border-[#f0e9d8]"><td className="py-2 pr-2 font-medium">{r[0]}</td><td className="py-2 pr-2">{r[1]}</td><td className="py-2 pr-2">{r[2]}</td><td className="py-2">{r[3]}</td></tr>))}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      ) : null}
    </div>
  );
}

/* ================= Data model ================= */
function buildDataset(patients: Patient[]) {
  const measures: Record<string, unknown>[] = [];
  patients.forEach((p) => {
    const base = baselineFor(p);
    [0, 12, 24].forEach((wk) => {
      const src = wk === 24 ? p.measures : wk === 0 ? base : (Object.fromEntries(Object.keys(base).map((k) => [k, Math.round(((base[k as keyof Measures] + p.measures[k as keyof Measures]) / 2) * 10) / 10])) as unknown as Measures);
      measures.push({ patientId: p.id, week: wk, ...src, labDate: p.followUp });
    });
  });
  const checkins: Record<string, unknown>[] = [];
  patients.forEach((p) => {
    for (let d = 0; d < 7; d++) {
      checkins.push({ patientId: p.id, date: `2026-11-${16 + d}`, weightKg: p.measures.weightKg, glucose: p.measures.fastingGlucose, systolic: p.measures.systolic, diastolic: p.measures.diastolic, minutes: 34, sleepHours: 6.6, stress: 4, cigarettes: 0, drinks: 0, socialDays: 4 });
    }
  });
  return {
    patients,
    measures,
    checkins,
    foodLogs: [
      { patientId: "P001", date: "2026-11-22", meal: "加餐 Snack", kcal: 520, vegPct: 0, proteinPct: 5, staplePct: 95, status: "待点评 Pending" },
      { patientId: "P001", date: "2026-11-20", meal: "晚餐 Dinner", kcal: 1150, vegPct: 15, proteinPct: 45, staplePct: 40, status: "已点评 Reviewed" },
      { patientId: "P001", date: "2026-11-19", meal: "晚餐 Dinner", kcal: 560, vegPct: 50, proteinPct: 30, staplePct: 20, status: "已点评 Reviewed" },
    ],
    messages: [
      { patientId: "P001", from: "患者 Patient", to: "健康教练 Health coach", topic: "运动 Exercise", text: "下雨天不能出去快走怎么办？", date: "2026-11-19 09:12" },
      { patientId: "P001", from: "健康教练 Health coach", to: "患者 Patient", topic: "运动 Exercise", text: "可以在家做15分钟原地快走，再加10分钟弹力带，一样算完成目标。", date: "2026-11-19 14:30" },
    ],
  };
}

function DataModel({ patients, entryCount }: { patients: Patient[]; entryCount: number }) {
  const queryClient = useQueryClient();
  const [sub, setSub] = useState<"tables" | "sources" | "forms" | "access">("tables");
  const [msg, setMsg] = useState("");
  const dataset = useMemo(() => buildDataset(patients), [patients]);
  const reset = useMutation({
    mutationFn: async () => await api.resetData({}),
    onSuccess: () => { setMsg("已重置。Reset complete."); void queryClient.invalidateQueries({ queryKey: ["state"] }); },
    onError: (e) => setMsg(`重置失败 Reset failed: ${e instanceof Error ? e.message : String(e)}`),
  });
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "houyuan-health-data.json"; a.click();
    URL.revokeObjectURL(url);
    setMsg("已导出 JSON。Exported dataset as JSON.");
  };
  /* Counts are taken from the same dataset the Export button downloads, so
     the cards can never disagree with the exported file. */
  const entities = [
    { name: "patients", count: `${dataset.patients.length}条 records`, fields: "id, sex, age, source, stage, followUp, goal, status, checkinDays, measures" },
    { name: "measures", count: `${dataset.measures.length}条 records`, fields: "patientId, week, weightKg, bodyFatPct, visceralFat, skeletalMuscleKg, waistCm, bmrKcal, overallScore, autonomicBalance, hba1cPct, fastingGlucose, ldl, triglycerides, systolic, diastolic, gripKg, walk6m, fmsTotal, phq9, gad7, psqi, labDate" },
    { name: "checkins", count: `${dataset.checkins.length}条 records`, fields: "patientId, date, weightKg, glucose, systolic, diastolic, minutes, sleepHours, stress, cigarettes, drinks, socialDays" },
    { name: "foodLogs", count: `${dataset.foodLogs.length}条 records`, fields: "patientId, date, meal, kcal, vegPct, proteinPct, staplePct, status" },
    { name: "messages", count: `${dataset.messages.length}条 records`, fields: "patientId, from, to, topic, text, date" },
  ];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>数据结构 Data model</h2>
        <p className="text-sm text-[var(--dim)]">字段定义与数据（JSON）Field definitions and data (JSON)</p>
      </div>
      <SubTabs label="Data model sections" value={sub} onChange={setSub} tabs={[
        { key: "tables", zh: "数据表与字段", en: "Tables & fields" },
        { key: "sources", zh: "数据来源", en: "Data sources" },
        { key: "forms", zh: "表单对照", en: "Forms map" },
        { key: "access", zh: "权限与数据管理", en: "Access & data management" },
      ]} />
      {sub === "forms" ? <FormsMapPanel /> : null}
      {sub === "tables" ? (
        <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {entities.map((e) => (
          <Card key={e.name}>
            <p className="font-mono text-base font-bold" style={{ color: TEAL }}>{e.name} <span className="text-xs font-normal text-[var(--dim)]">{e.count}</span></p>
            <p className="mt-1 break-words font-mono text-xs text-[var(--dim)]">{e.fields}</p>
          </Card>
        ))}
        <Card>
          <p className="font-mono text-base font-bold" style={{ color: TEAL }}>staffEntries <span className="text-xs font-normal text-[var(--dim)]">{entryCount}条 saved</span></p>
        </Card>
      </div>
      <Card title="字段参考 Field reference">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">字段 Field</th><th className="py-2 pr-2">类型 Type</th><th className="py-2">说明 Description</th></tr></thead>
            <tbody>
              {[
                ["id", "string", "患者编号 Patient ID"],
                ["sex", "string", "性别 Sex"],
                ["age", "number", "年龄 Age"],
                ["source", "string", "来源 Source"],
                ["stage", "string", "阶段 Stage"],
                ["followUp", "string", "最近随访 Latest follow-up"],
                ["goal", "string", "目标 Goal"],
                ["status", "string", "状态灯 Status light"],
                ["checkinDays", "number", "本周打卡天数 Check-ins this week"],
                ["measures", "object", "最近一次指标 Latest measures"],
              ].map((r) => (<tr key={r[0]} className="border-b border-[#f0e9d8]"><td className="py-1.5 pr-2 font-mono">{r[0]}</td><td className="py-1.5 pr-2">{r[1]}</td><td className="py-1.5">{r[2]}</td></tr>))}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      ) : null}
      {sub === "sources" ? <DataSourcesSection /> : null}
      {sub === "access" ? (
        <>
      <Card title="角色与权限（建议）Roles and access (suggested)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">角色 Role</th><th className="py-2 pr-2">可以录入 Can enter</th><th className="py-2">可以查看 Can see</th></tr></thead>
            <tbody>
              {[
                ["医生 Physician", "评估、分层、转诊 Assessment, tier, referral", "全部临床数据 All clinical data"],
                ["营养师 Dietitian", "营养方案、确认饮食照片 Plans, food-photo review", "饮食、体成分、化验 Food, body composition, labs"],
                ["运动/康复师 Exercise specialist", "运动处方 Exercise prescription", "运动、体能检测 Activity, fitness tests"],
                ["心理/睡眠咨询师 Counselor", "睡眠、压力评估与方法 Sleep and stress plans", "睡眠、压力、PHQ-9/GAD-7 Sleep, stress, mood scores"],
                ["健康教练 Coach", "沟通记录、SMART目标 Contacts, goals", "目标、居家数据、打卡 Goals, home data, check-ins"],
                ["护士/技师 Nurse/tech", "检测数值、上传报告 Device values, reports", "检测数据 Assessment data"],
                ["前台 Front desk", "入组与同意登记 Enrollment and consent", "仅入组信息 Enrollment only"],
                ["患者 Patient", "照片、读数、服药、打卡、消息 Photos, readings, medication, check-ins, messages", "自己的数据和团队回复 Own data and team replies"],
              ].map((r) => (<tr key={r[0]} className="border-b border-[#f0e9d8]"><td className="py-2 pr-2 font-medium">{r[0]}</td><td className="py-2 pr-2">{r[1]}</td><td className="py-2">{r[2]}</td></tr>))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-[var(--dim)]">健康数据属于敏感个人信息（PIPL），需单独同意；分析用副本不含姓名，仅用诊所编号。Health data is sensitive personal information under PIPL and needs separate consent; the analytics copy carries no names, clinic IDs only. 顶部角色切换器可查看不同角色看到的数据范围。Use the role switcher at the top to see what each role can see.</p>
      </Card>
      <Card title="数据管理 Data management">
        <div className="flex flex-wrap gap-3">
          <button type="button" className="rounded-lg px-4 py-2.5 font-semibold text-white" style={{ background: TEAL }} onClick={exportJson}>导出全部数据 Export all data (JSON)</button>
          <button type="button" className="rounded-lg border-2 px-4 py-2.5 font-semibold" style={{ borderColor: TEAL, color: TEAL }} onClick={() => { void navigator.clipboard?.writeText(JSON.stringify(dataset, null, 2)).then(() => setMsg("已复制全部数据 JSON。Copied all data as JSON.")).catch(() => setMsg("无法复制，请从下方查看 JSON。Copy blocked; view the JSON below.")); }}>复制全部数据 JSON Copy all data</button>
          <button type="button" disabled={reset.isPending} className="rounded-lg border-2 px-4 py-2.5 font-semibold disabled:opacity-60" style={{ borderColor: RED, color: RED }} onClick={() => reset.mutate()}>{reset.isPending ? "重置中… Resetting…" : "重置数据 Reset data"}</button>
        </div>
        {msg ? <p className="mt-3 rounded-lg bg-[#e3efec] p-3 text-sm" role="status">{msg}</p> : null}
      </Card>
      <Card title="查看 JSON 数据 View JSON data">
        <details>
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: TEAL }}>展开完整数据集 Expand full dataset</summary>
          <pre className="mt-3 max-h-[480px] overflow-auto rounded-lg bg-[#22312e] p-3 text-[11px] leading-relaxed text-[#d9efe8]">{JSON.stringify(dataset, null, 2)}</pre>
        </details>
      </Card>
        </>
      ) : null}
    </div>
  );
}

/* ================= Data sources (one-pager) ================= */
const DATA_SOURCES: { n: number; zh: string; en: string; fields: string; when: string; who: string; format: string; into: string }[] = [
  { n: 1, zh: "3D智能体测", en: "3D body composition", fields: "体重、体脂、内脏脂肪、肌肉、腰围、基础代谢 Weight, fat, visceral fat, muscle, waist, BMR", when: "第0/12/24周 Weeks 0/12/24", who: "技师 Technician", format: "厂家报告 PDF/Excel Maker report", into: "导出→解析→技师核对 Export → parse → technician check" },
  { n: 2, zh: "LIFE系统", en: "LIFE system", fields: "综合评分等（字段待确认）Scores — fields to confirm", when: "第0/12/24周 Weeks 0/12/24", who: "技师 Technician", format: "厂家报告 Maker report", into: "导出→解析→技师核对 Export → parse → technician check" },
  { n: 3, zh: "体能检测", en: "Fitness tests", fields: "握力、6分钟步行、FMS Grip, 6-min walk, FMS", when: "第0/12/24周 Weeks 0/12/24", who: "运动专员 Exercise specialist", format: "纸质/表格记录 Paper or sheet", into: "团队表单录入 Staff form" },
  { n: 4, zh: "化验", en: "Lab tests", fields: "HbA1c、血糖、血脂 HbA1c, glucose, lipids", when: "第0/12/24周 Weeks 0/12/24", who: "护士 Nurse", format: "化验单 Lab report", into: "导出→解析→护士核对 Export → parse → nurse check" },
  { n: 5, zh: "门诊体征", en: "Clinic vitals", fields: "血压、身高、心率 BP, height, heart rate", when: "每次到诊 Every visit", who: "护士 Nurse", format: "现场测量 On-site", into: "团队表单录入 Staff form" },
  { n: 6, zh: "问卷量表", en: "Questionnaires", fields: "PHQ-9、GAD-7、PSQI、生活方式问卷 Mood, sleep and lifestyle intake", when: "第0/12/24周 Weeks 0/12/24", who: "咨询师 Counselor", format: "纸质/小程序 Paper or mini-program", into: "团队表单或小程序 Staff form or mini-program" },
  { n: 7, zh: "团队记录", en: "Staff notes by role", fields: "按角色记录、按支柱标注 Notes tagged by pillar", when: "每次联系 Every contact", who: "各角色 Each role", format: "平台表单 Platform form", into: "团队表单录入 Staff form" },
  { n: 8, zh: "患者端小程序", en: "Patient app", fields: "饮食照片+AI结果、读数、服药、打卡、消息 Food photos + AI, readings, medication, check-ins, messages", when: "每日 Daily", who: "患者 Patient", format: "微信小程序 WeChat mini-program", into: "小程序直连 Mini-program sync" },
  { n: 9, zh: "穿戴与居家设备", en: "Wearables and home devices", fields: "步数、睡眠、心率、蓝牙血压/血糖 Steps, sleep, heart rate, Bluetooth BP and glucose", when: "每日自动 Daily automatic", who: "开发者 Developer", format: "手机健康数据/品牌接口 Phone health data or brand API", into: "接口同步 API sync" },
  { n: 10, zh: "入组与同意", en: "Enrollment and consent", fields: "转诊来源、套餐、知情同意、外院记录 Referral source, package, informed consent, outside records", when: "入组时 At enrollment", who: "前台 Front desk", format: "纸质签署+平台登记 Paper + platform registration", into: "平台登记 Platform registration" },
];
const SEND_CHECKLIST = [
  "每台设备一份去标识化示例报告（含 LIFE）One de-identified sample report per device (including LIFE)",
  "每台设备的导出方式（PDF、Excel/CSV 或数据接口）Each device's export options (PDF, Excel/CSV, or data connection)",
  "化验是院内完成还是合作医院 Labs in-house or a partner hospital",
  "患者已在用的手环、血压计、血糖仪品牌 Brands of bands, BP meters and glucose meters patients already use",
  "现行患者编号规则，以及每台设备保存什么（姓名、电话或编号）The current patient ID rule and what each device stores (name, phone or ID)",
];

function DataSourcesSection() {
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <>
      <Card title="数据来源 Data Sources（数据来源一页纸 One-pager）">
        <p className="mb-3 text-sm font-semibold">四条统一规则 Four unification rules</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>一个患者编号贯穿所有数据 — One patient ID links everything.</li>
          <li>一个数值一行 — One value per row.</li>
          <li>保留原始报告，并与提取的数值放在一起 — Keep the original report with the extracted values.</li>
          <li>录入时统一单位与时间：每项指标一个单位、北京时间、绑定到访周次 — Fix units and times on entry: one unit per measure, Beijing time, tied to a visit week.</li>
        </ol>
        <p className="mb-2 mt-4 text-sm font-semibold">标准记录格式 Standard record format（一行一个数值 One value per row）</p>
        <p className="rounded-lg bg-[var(--surface-alt)] p-3 font-mono text-xs">patient_id · visit_id · time · source · field · value · unit · checked_by · report_file</p>
        <p className="mt-2 text-xs text-[var(--dim)]">单位 Units：血糖 glucose mmol/L · 血脂 lipids mmol/L · 体重 weight kg · 腰围 waist cm · 血压 BP mmHg · HbA1c %</p>
      </Card>
      <Card title="十大数据来源 The 10 data sources" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">#</th><th className="py-2 pr-2">来源 Source</th><th className="py-2 pr-2">内容 Contents</th><th className="py-2 pr-2">时间 When</th><th className="py-2 pr-2">负责 Who</th><th className="py-2 pr-2">现格式 Current format</th><th className="py-2">如何入库 Into the database</th></tr></thead>
            <tbody>
              {DATA_SOURCES.map((s) => (
                <tr key={s.n} className="border-b border-[#f0e9d8]">
                  <td className="py-2 pr-2 font-bold" style={{ color: TEAL }}>{s.n}</td>
                  <td className="py-2 pr-2 font-medium">{s.zh}<br /><span className="text-xs text-[var(--dim)]">{s.en}</span></td>
                  <td className="py-2 pr-2">{s.fields}</td>
                  <td className="py-2 pr-2">{s.when}</td>
                  <td className="py-2 pr-2">{s.who}</td>
                  <td className="py-2 pr-2">{s.format}</td>
                  <td className="py-2">{s.into}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="需要院后健康提供 What Houyuan Health needs to send" className="mt-4">
        <div className="space-y-2">
          {SEND_CHECKLIST.map((item) => {
            const on = checked.includes(item);
            return (
              <label key={item} className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="checkbox" aria-label={item} className="mt-0.5 h-5 w-5 shrink-0" checked={on} onChange={(e) => setChecked(e.target.checked ? [...checked, item] : checked.filter((x) => x !== item))} />
                <span style={on ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{item}</span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--dim)]">已勾选 {checked.length}/{SEND_CHECKLIST.length}</p>
      </Card>
    </>
  );
}

/* ================= Safety & Compliance ================= */
const CONSENT_ROWS: { pid: string; enroll: string; sensitive: string; sharing: string }[] = [
  { pid: "P001", enroll: "已同意 2026-02-02", sensitive: "已单独同意 2026-02-02", sharing: "已同意（匿名汇总）2026-02-02" },
  { pid: "P002", enroll: "已同意 2026-02-03", sensitive: "已单独同意 2026-02-03", sharing: "未同意 Declined" },
  { pid: "P003", enroll: "已同意 2026-02-04", sensitive: "已单独同意 2026-02-04", sharing: "已同意（匿名汇总）2026-02-04" },
  { pid: "P005", enroll: "已同意 2026-02-05", sensitive: "已单独同意 2026-02-05", sharing: "未同意 Declined" },
  { pid: "P007", enroll: "已同意 2026-02-06", sensitive: "已单独同意 2026-02-06", sharing: "已同意（匿名汇总）2026-02-06" },
  { pid: "P012", enroll: "已同意 2026-02-07", sensitive: "已单独同意 2026-02-07", sharing: "未同意 Declined" },
];
const AUDIT_ROWS: { when: string; who: string; role: string; what: string; pid: string }[] = [
  { when: "2026-11-23 09:02", who: "医生账号 D01", role: "医生 Physician", what: "查看档案 Viewed record", pid: "P012" },
  { when: "2026-11-23 08:47", who: "营养师账号 R02", role: "营养师 Dietitian", what: "确认饮食照片 Confirmed food photo", pid: "P001" },
  { when: "2026-11-22 17:15", who: "教练账号 C03", role: "健康教练 Coach", what: "编辑周目标 Edited weekly goal", pid: "P009" },
  { when: "2026-11-22 15:30", who: "前台账号 F01", role: "前台 Front desk", what: "查看入组信息 Viewed enrollment（无临床数据）", pid: "P003" },
  { when: "2026-11-22 11:08", who: "护士账号 N01", role: "护士/技师 Nurse", what: "录入化验数值 Entered lab values", pid: "P005" },
  { when: "2026-11-21 20:41", who: "咨询师账号 M01", role: "咨询师 Counselor", what: "查看量表 Viewed questionnaires", pid: "P011" },
];

function SafetyCompliance({ viewerRole }: { viewerRole: ViewerRole }) {
  const [sub, setSub] = useState<"access" | "consent" | "privacy" | "checklist">("access");
  const [withdrawn, setWithdrawn] = useState<string[]>([]);
  const [auditRole, setAuditRole] = useState("全部");
  const [auditPid, setAuditPid] = useState("");
  const [erased, setErased] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loginMsg, setLoginMsg] = useState("");
  const auditFiltered = AUDIT_ROWS.filter((r) => (auditRole === "全部" || r.role.includes(auditRole)) && (!auditPid || r.pid.toLowerCase().includes(auditPid.toLowerCase())));
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>安全与合规 Safety & Compliance</h2>
      </div>
      <SubTabs label="Safety and compliance sections" value={sub} onChange={setSub} tabs={[
        { key: "access", zh: "访问与登录", en: "Access & sign-in" },
        { key: "consent", zh: "同意与审计", en: "Consent & audit" },
        { key: "privacy", zh: "隐私与临床安全", en: "Privacy & clinical safety" },
        { key: "checklist", zh: "中国上线清单", en: "China checklist" },
      ]} />
      {sub === "access" ? (
        <>
      <Card title="基于角色的访问 Role-based access（最小必要 Need-to-know）">
        <p className="text-sm">当前查看身份：<strong>{viewerLabel(viewerRole)}</strong> — {VIEWER_ROLES.find((v) => v.key === viewerRole)?.sees}。在页面顶部切换角色，即可看到患者列表等页面的可见范围随之变化。</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">角色 Role</th><th className="py-2">可见范围 Sees</th></tr></thead>
            <tbody>{VIEWER_ROLES.map((v) => (<tr key={v.key} className="border-b border-[#f0e9d8]" style={v.key === viewerRole ? { background: "var(--accent-light)" } : undefined}><td className="py-2 pr-2 font-medium">{v.zh} {v.en}</td><td className="py-2">{v.sees}</td></tr>))}</tbody>
          </table>
        </div>
      </Card>
      <Card title="登录 Sign-in">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">手机号 Phone<input aria-label="Phone number" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" placeholder="138…" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <label className="block text-sm">短信验证码 SMS code<input aria-label="SMS code" className="mt-1 w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" placeholder="6位数字 6 digits" value={code} onChange={(e) => setCode(e.target.value)} /></label>
          <div className="flex items-end"><button type="button" className="w-full rounded-lg px-4 py-2.5 font-semibold text-white" style={{ background: TEAL }} onClick={() => setLoginMsg(phone.trim() && code.trim() ? "登录成功（不校验、不保存手机号）。Sign-in ok — the number is not verified or stored." : "请填写手机号和验证码。Enter phone and code first.")}>登录 Sign in</button></div>
        </div>
        {loginMsg ? <p className="mt-2 text-sm" role="status">{loginMsg}</p> : null}
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--dim)]">
          <li>会话超时：无操作30分钟自动退出。Session timeout: signed out after 30 minutes idle.</li>
          <li>密码策略（管理员账号）：至少12位，含大小写字母、数字与符号；禁止复用最近5个密码。Password policy (admin accounts): 12+ characters with mixed case, digits and symbols; no reuse of the last 5.</li>
          <li>登录失败5次锁定账号并通知管理员。Five failed attempts lock the account and alert the admin.</li>
        </ul>
      </Card>
        </>
      ) : null}
      {sub === "consent" ? (
        <>
      <Card title="知情同意中心 Consent center">
        <p className="mb-2 text-xs text-[var(--dim)]">健康数据是敏感个人信息：入组同意、敏感信息单独同意、数据共享同意分别记录。撤回后该患者记录会被标记并停止共享。Consent is recorded separately; withdrawing flags the record and stops sharing.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">患者 Patient</th><th className="py-2 pr-2">入组同意 Enrollment</th><th className="py-2 pr-2">敏感信息单独同意 Sensitive info (separate)</th><th className="py-2 pr-2">数据共享同意 Sharing</th><th className="py-2">操作 Action</th></tr></thead>
            <tbody>
              {CONSENT_ROWS.map((r) => {
                const w = withdrawn.includes(r.pid);
                return (
                  <tr key={r.pid} className="border-b border-[#f0e9d8]" style={w ? { background: "#fdf0ee" } : undefined}>
                    <td className="py-2 pr-2 font-bold" style={{ color: TEAL }}>{r.pid}</td>
                    <td className="py-2 pr-2">{r.enroll}</td>
                    <td className="py-2 pr-2">{r.sensitive}</td>
                    <td className="py-2 pr-2">{w ? <strong style={{ color: RED }}>已撤回 Withdrawn — 记录已标记，停止共享</strong> : r.sharing}</td>
                    <td className="py-2">{w ? <span className="text-xs text-[var(--dim)]">已标记 Flagged</span> : <button type="button" className="rounded-lg border px-2 py-1 text-xs font-semibold" style={{ borderColor: RED, color: RED }} onClick={() => setWithdrawn([...withdrawn, r.pid])}>撤回共享同意 Withdraw</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="审计日志 Audit log">
        <div className="mb-3 flex flex-wrap gap-2">
          <label className="text-sm">角色 Role
            <select aria-label="Audit role filter" className="ml-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={auditRole} onChange={(e) => setAuditRole(e.target.value)}>
              <option value="全部">全部 All</option><option value="医生">医生 Physician</option><option value="营养师">营养师 Dietitian</option><option value="教练">健康教练 Coach</option><option value="前台">前台 Front desk</option><option value="护士">护士/技师 Nurse</option><option value="咨询师">咨询师 Counselor</option>
            </select></label>
          <label className="text-sm">患者 Patient
            <input aria-label="Audit patient filter" className="ml-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm" placeholder="如 P001" value={auditPid} onChange={(e) => setAuditPid(e.target.value)} /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">时间 When</th><th className="py-2 pr-2">账号 Who</th><th className="py-2 pr-2">角色 Role</th><th className="py-2 pr-2">操作 Action</th><th className="py-2">患者 Patient</th></tr></thead>
            <tbody>{auditFiltered.map((r) => (<tr key={r.when + r.who} className="border-b border-[#f0e9d8]"><td className="py-2 pr-2">{r.when}</td><td className="py-2 pr-2">{r.who}</td><td className="py-2 pr-2">{r.role}</td><td className="py-2 pr-2">{r.what}</td><td className="py-2 font-semibold">{r.pid}</td></tr>))}</tbody>
          </table>
        </div>
        {auditFiltered.length === 0 ? <p className="mt-2 text-sm text-[var(--dim)]">没有符合条件的记录。No matching entries.</p> : null}
      </Card>
        </>
      ) : null}
      {sub === "privacy" ? (
        <>
      <Card title="隐私与安全 Privacy & security">
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li><strong>传输与存储加密</strong>：全程 HTTPS/TLS 传输加密，数据库与备份静态加密（上线必需）。Encryption in transit and at rest — required before launch.</li>
          <li><strong>数据存放在中国境内</strong>：服务器与备份均在境内。Data residency: data stored in China.</li>
          <li><strong>不出境</strong>：未经数据出境安全评估，不向境外传输。No cross-border transfer without a security assessment.</li>
          <li><strong>保存与删除</strong>：按医疗与项目要求设定保存期限；患者可申请删除（删除权）。Retention limits, with a right-to-erasure process.</li>
          <li><strong>去标识化</strong>：分析与公示只用诊所编号，不含姓名；成果公示执行 MIN_N=5 抑制。De-identification: clinic IDs only in analytics; MIN_N=5 suppression on the public page.</li>
        </ul>
        <div className="mt-3 rounded-lg border border-[var(--border)] p-3">
          <p className="text-sm font-semibold">删除权 Right to erasure</p>
          <p className="text-xs text-[var(--dim)]">患者申请删除其可删除数据时：临床记录按法规保存，账号与联系方式删除并记录审计。When a patient requests erasure: contact/account data is erased and logged; clinical records are retained as the law requires.</p>
          {erased ? <p className="mt-2 text-sm font-semibold" style={{ color: GREEN }} role="status">已完成：账号与联系方式已删除，审计日志已记录。Done — account and contact data erased and logged.</p> : <button type="button" className="mt-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold" style={{ borderColor: RED, color: RED }} onClick={() => setErased(true)}>删除请求 Erasure request</button>}
        </div>
      </Card>
      <Card title="临床安全 Clinical safety">
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li><strong>预警阈值公开可见</strong>：血糖 &lt;3.9 或 ≥13.9 mmol/L 红色；血压 ≥180/110 红色、≥160/100 黄色、≥140/90 黄色 — 阈值由诊所医生设定。Alert thresholds are visible and set by the clinic's physicians.</li>
          <li><strong>120 紧急提示</strong>：患者端联系团队页与异常读数提示中均有。120 emergency notice in the patient app and in out-of-range reading messages.</li>
          <li><strong>AI 饮食分析须营养师确认</strong>后才发回患者。Dietitian confirmation of AI food analysis before it reaches the patient.</li>
          <li><strong>医生复核队列</strong>：红色预警与“身体不适”消息直达医生今日工作。Doctor review queue for red alerts and “feeling unwell” messages.</li>
          <li><strong>医疗免责声明</strong>：本平台支持健康管理，不替代医疗建议；不适请及时就医。Medical disclaimer: the platform supports care and does not replace medical advice.</li>
        </ul>
      </Card>
        </>
      ) : null}
      {sub === "checklist" ? (
        <>
      <Card title="中国上线合规清单 China launch checklist">
        <p className="mb-2 rounded-lg bg-[#fbf3d9] p-3 text-xs">上线前须经法律顾问核实。To be verified by counsel before launch.</p>
        <ul className="space-y-2 text-sm">
          {[
            ["ICP备案 Website filing （网站备案）", "在中国境内托管网站前必须完成备案。ICP filing is required before hosting a website in China."],
            ["经营性ICP许可证 Commercial ICP licence", "提供付费在线服务时需要。Required if providing paid online services."],
            ["网络安全等级保护（等保）MLPS graded protection", "健康平台通常为三级：定级、备案、测评、整改。Level 3 is typical for health platforms."],
            ["个人信息保护法 PIPL", "健康数据是敏感个人信息：需单独同意、目的限定、最小必要。Health data is sensitive personal information — separate consent, purpose limitation, data minimisation."],
            ["数据安全法 Data Security Law", "数据分类分级、风险监测与应急处置义务。Classification, monitoring and incident-response duties."],
            ["数据不出境 Data stays in China", "健康数据存放在境内；出境需安全评估。Health data stays in China; cross-border transfer needs an assessment."],
            ["边界说明 Boundary", "本平台是健康管理/生活方式平台，不是互联网诊疗：无诊断、无处方功能；在线诊疗需互联网医院牌照。This is a health-management / lifestyle platform, not online diagnosis — no diagnosis or prescription features; online diagnosis would need an internet-hospital licence."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-lg border border-[var(--border)] p-3"><p className="font-semibold">{t}</p><p className="text-[var(--dim)]">{d}</p></li>
          ))}
        </ul>
      </Card>
        </>
      ) : null}
    </div>
  );
}

/* ================= Work Progress (roadmap tracker) ================= */
type RoadmapState = ApiResponse<typeof api, "getRoadmapState">;
type RoadmapTask = RoadmapState["tasks"][number];

const ROADMAP_PHASES_UI = [
  { index: 0, weekStart: 1, weekEnd: 6, cn: "第0期 · 摸底·设计·原型", en: "Phase 0" },
  { index: 1, weekStart: 7, weekEnd: 10, cn: "第7–10周 · 培训与启动", en: "Train & launch" },
  { index: 2, weekStart: 11, weekEnd: 22, cn: "第11–22周 · 试点", en: "Pilot" },
  { index: 3, weekStart: 23, weekEnd: 26, cn: "第23–26周 · 评估与推广", en: "Evaluate & scale" },
];
const ROADMAP_WORKSTREAMS_UI = [
  { cn: "行政与商务", en: "Governance & commercial" },
  { cn: "经营与财务", en: "Business operations" },
  { cn: "生活方式医学服务", en: "Clinical program" },
  { cn: "人员与培训", en: "Workforce & training" },
  { cn: "大数据平台", en: "Big data platform" },
  { cn: "合规与数据安全", en: "Compliance & data security" },
];

function roadmapOwnerStyle(owner: RoadmapTask["owner"]) {
  if (owner === "ours") return { label: "我方 Our team", bg: "#DBEAFE", fg: "#1E40AF", border: "#2563EB" };
  if (owner === "container") return { label: "院后 Houyuan", bg: "#FFEDD5", fg: "#9A3412", border: "#EA580C" };
  return { label: "双方 Joint", bg: "#DCFCE7", fg: "#166534", border: "#16A34A" };
}
function roadmapFmtNice(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function roadmapPhaseDates(startDate: string | null, p: (typeof ROADMAP_PHASES_UI)[number]): string {
  if (!startDate) return `Week ${p.weekStart}–${p.weekEnd} · 第${p.weekStart}–${p.weekEnd}周`;
  const s = new Date(`${startDate}T00:00:00`);
  const a = new Date(s); a.setDate(a.getDate() + (p.weekStart - 1) * 7);
  const b = new Date(s); b.setDate(b.getDate() + p.weekEnd * 7 - 1);
  const f = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${f(a)} – ${f(b)} · Week ${p.weekStart}–${p.weekEnd}`;
}

function RoadmapTaskCard({ task, compact }: { task: RoadmapTask; compact?: boolean }) {
  const queryClient = useQueryClient();
  const [notesDraft, setNotesDraft] = useState(task.notes);
  const [savedMsg, setSavedMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  useEffect(() => { setNotesDraft(task.notes); }, [task.notes]);
  const mut = useMutation({
    mutationFn: async (args: { isDone?: boolean; notes?: string }) => await api.updateTask({ taskId: task.id, ...args }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["roadmap"] }); void queryClient.invalidateQueries({ queryKey: ["thisWeek"] }); setSavedMsg("已保存 Saved ✓"); setTimeout(() => setSavedMsg(""), 2000); },
    onError: (e: Error) => setErrMsg(e.message || "保存失败，请再试一次。Could not save. Please try again."),
  });
  const o = roadmapOwnerStyle(task.owner);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm" style={{ borderLeft: `5px solid ${o.border}`, opacity: task.isDone ? 0.75 : 1 }}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" aria-label={`Mark done: ${task.titleEn}`} checked={task.isDone} onChange={(e) => { setErrMsg(""); mut.mutate({ isDone: e.target.checked }); }} className="mt-1 h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className={`block text-[15px] font-medium leading-snug ${task.isDone ? "line-through" : ""}`}>{task.titleEn}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: o.bg, color: o.fg }}>{o.label}</span>
            <span className="text-xs text-[var(--dim)]">Week {task.weekStart}–{task.weekEnd}{task.dateStart ? ` · ${roadmapFmtNice(task.dateStart)} – ${roadmapFmtNice(task.dateEnd)}` : ""}</span>
          </span>
          {task.isDone ? <span className="mt-1 block text-[13px] font-semibold" style={{ color: GREEN }}>✓ 已完成 Done</span> : <span className="mt-1 block text-[13px] text-[var(--dim)]">待检查 Needs checking</span>}
        </span>
      </label>
      {!compact ? (
        <div className="mt-3 pl-8">
          <label htmlFor={`roadmap-notes-${task.id}`} className="text-[13px] font-medium text-[var(--dim)]">备注 Note (optional)</label>
          <div className="mt-1 flex gap-2">
            <input id={`roadmap-notes-${task.id}`} {...FIELDS.updateTask.notes} value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} placeholder="Add a short note…" className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm" />
            <button type="button" aria-label={`Save note for ${task.titleEn}`} onClick={() => { setErrMsg(""); mut.mutate({ notes: notesDraft }); }} className="shrink-0 rounded-lg px-3 font-semibold text-white" style={{ background: TEAL }}>保存 Save</button>
          </div>
          {savedMsg ? <p className="mt-1 text-[13px]" style={{ color: GREEN }}>{savedMsg}</p> : null}
          {errMsg ? <p className="mt-1 text-[13px]" style={{ color: RED }}>{errMsg}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function WorkProgress() {
  const queryClient = useQueryClient();
  const stateQ = useQuery({ queryKey: ["roadmap"], queryFn: () => api.getRoadmapState({}) });
  const weekQ = useQuery({ queryKey: ["thisWeek"], queryFn: () => api.getThisWeekTasks({}) });
  const [dateInput, setDateInput] = useState("");
  const [dateMsg, setDateMsg] = useState("");
  const [dateErr, setDateErr] = useState("");
  const [sub, setSub] = useState<"thisweek" | "roadmap">("thisweek");
  const serverDate = stateQ.data?.startDate ?? null;
  useEffect(() => { setDateInput(serverDate ?? ""); }, [serverDate]);
  const setDateMut = useMutation({
    mutationFn: async (date: string | null) => await api.setStartDate({ date }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["roadmap"] }); void queryClient.invalidateQueries({ queryKey: ["thisWeek"] }); setDateMsg("日期已保存 ✓ 本页所有日期已更新。Date saved ✓ All dates below have updated."); setTimeout(() => setDateMsg(""), 3500); },
    onError: (e: Error) => setDateErr(e.message || "日期保存失败。Could not save the date."),
  });
  if (stateQ.isPending) return <p className="py-10 text-center text-sm text-[var(--dim)]">正在加载路线图… Loading your roadmap…</p>;
  if (stateQ.error) return (
    <div className="py-10 text-center">
      <p className="font-semibold">路线图加载失败。Something went wrong loading the roadmap.</p>
      <button type="button" onClick={() => void stateQ.refetch()} className="mt-4 rounded-xl px-5 py-3 font-semibold text-white" style={{ background: TEAL }}>再试一次 Try again</button>
    </div>
  );
  const data = stateQ.data;
  const pct = data.total ? Math.round((data.done / data.total) * 100) : 0;
  const curPhase = data.currentPhaseIndex != null ? ROADMAP_PHASES_UI[data.currentPhaseIndex] : null;
  const weekData = weekQ.data;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>工作进展 · 团队共享进度 Work Progress — the team's shared view</h2>
        <p className="mt-1 text-sm">院后合作路线图 Houyuan Health Engagement Roadmap · 26周 · 4个阶段 · 6条工作线。这里是<strong>整个项目</strong>的进展——行政与商务、经营与财务、生活方式医学服务、人员与培训、大数据平台、合规与数据安全——不只是网站工作。打开网站就能一眼看到：团队在做什么、完成了什么、接下来做什么。</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white px-2.5 py-1 text-[#1E40AF]">● 我方 Our team</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[#9A3412]">● 院后 Houyuan</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-[#166534]">● 双方 Joint</span>
        </div>
      </div>

      <SubTabs label="Work progress sections" value={sub} onChange={setSub} tabs={[
        { key: "thisweek", zh: "本周", en: "This week" },
        { key: "roadmap", zh: "完整路线图", en: "Full roadmap" },
      ]} />
      {sub === "thisweek" ? (
        <>
      <Card title="📅 第1周开始日期 · Week 1 start date">
        <p className="text-sm text-[var(--dim)]">知道日期后填在这里，随时可以修改——本页所有日期会自动更新。Fill this in when you know it. You can change it any time — every date on this page updates automatically.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="roadmap-week1-date" className="sr-only">Week 1 start date</label>
          <input id="roadmap-week1-date" type="date" aria-label="Week 1 start date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-base font-medium" style={{ minHeight: "52px" }} />
          <button type="button" aria-label="Save Week 1 start date" onClick={() => { setDateErr(""); setDateMsg(""); if (!dateInput) { setDateErr("请先选择日期，或用「清除」删除已有日期。Please pick a date first, or use Clear to remove it."); return; } setDateMut.mutate(dateInput); }} className="rounded-xl px-5 text-base font-bold text-white" style={{ background: TEAL, minHeight: "52px" }}>保存日期 Save date</button>
          {serverDate ? <button type="button" aria-label="Clear Week 1 start date" onClick={() => { setDateErr(""); setDateMut.mutate(null); }} className="rounded-xl border border-[var(--border)] px-4 font-semibold" style={{ minHeight: "52px" }}>清除 Clear</button> : null}
        </div>
        {dateMsg ? <p className="mt-2 font-medium" style={{ color: GREEN }}>{dateMsg}</p> : null}
        {dateErr ? <p className="mt-2" style={{ color: RED }}>{dateErr}</p> : null}
        {serverDate ? <p className="mt-2 text-sm">第1周开始于 <strong>{roadmapFmtNice(serverDate)}</strong>，全部26周结束于 <strong>{roadmapFmtNice((() => { const d = new Date(`${serverDate}T00:00:00`); d.setDate(d.getDate() + 26 * 7 - 1); return d.toISOString().slice(0, 10); })())}</strong>。Week 1 starts <strong>{roadmapFmtNice(serverDate)}</strong>; the full 26 weeks end <strong>{roadmapFmtNice((() => { const d = new Date(`${serverDate}T00:00:00`); d.setDate(d.getDate() + 26 * 7 - 1); return d.toISOString().slice(0, 10); })())}</strong>.</p> : <p className="mt-2 text-sm font-medium" style={{ color: "#B45309" }}>⚠️ 还没有日期——下方计划先显示周次（第1–26周）。填好上面的日期后会自动换算。No date yet — the plan below shows week numbers (Week 1–26). Add the date above when you are ready.</p>}
      </Card>

      <section aria-label="This week" className="rounded-xl p-4 text-white shadow-sm" style={{ background: TEAL }}>
        <h3 className="text-lg font-bold">本周 · This week</h3>
        {!serverDate ? <div className="mt-2"><p className="text-sm">在上方填好第1周开始日期，这里就会显示本周要做和要检查的事项。Add your Week 1 start date above, and this panel will show exactly what to do and check this week.</p><p className="mt-2 text-sm opacity-90">提醒检查在每周日上午运行并读取本页进度——日期填好后，就能按本周任务提醒。A reminder check runs on Sunday mornings and reads this page — once the date is set, it can remind you about this week's tasks.</p></div> : null}
        {serverDate && data.status === "before_start" ? <p className="mt-2 text-sm">项目将于 {roadmapFmtNice(serverDate)} 开始——尚未开始。可以先准备下方的第0期任务。Your plan starts on {roadmapFmtNice(serverDate)} — not yet started. Get ready with the Phase 0 tasks below.</p> : null}
        {serverDate && data.status === "finished" ? <p className="mt-2 text-sm">26周已全部结束，做得好！请检查下方还有没有未勾选的任务。The 26 weeks are finished. Well done! Check any tasks still unticked below.</p> : null}
        {serverDate && data.status === "active" ? (
          <div className="mt-2">
            <p className="text-base font-semibold">现在是第 {data.currentWeek} 周 · You are in Week {data.currentWeek}{curPhase ? ` — ${curPhase.cn} (${curPhase.en})` : ""}</p>
            {weekData && weekData.overdue.length > 0 ? <p className="mt-2 rounded-lg bg-white/20 px-3 py-2 text-sm font-medium">⏰ 还有 {weekData.overdue.length} 项之前的任务未勾选——见下方。{weekData.overdue.length} earlier task{weekData.overdue.length > 1 ? "s are" : " is"} still unticked — see below.</p> : null}
            <div className="mt-3 space-y-2 text-[var(--text)]">
              {weekData && weekData.dueThisWeek.length === 0 ? <p className="text-white">本周阶段窗口内没有安排任务。No tasks are scheduled for this phase window.</p> : null}
              {weekData?.dueThisWeek.map((t) => <RoadmapTaskCard key={t.id} task={t} compact />)}
            </div>
            {weekData && weekData.overdue.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-[15px] font-bold">之前未完成 · Still to check from earlier</h4>
                <div className="mt-2 space-y-2 text-[var(--text)]">{weekData.overdue.map((t) => <RoadmapTaskCard key={t.id} task={t} compact />)}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <Card title="进度 · Progress">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm text-[var(--dim)]">整个项目全部36项任务 All {data.total} tasks across the whole project</span>
          <span className="text-lg font-bold" style={{ color: TEAL }}>{data.done} / {data.total} 已完成 done · {pct}%</span>
        </div>
        <div className="mt-3"><Progress pct={pct} /></div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ROADMAP_PHASES_UI.map((p) => {
            const pp = data.perPhase.find((x) => x.phaseIndex === p.index);
            const done = pp?.done ?? 0; const total = pp?.total ?? 0;
            const ppct = total ? Math.round((done / total) * 100) : 0;
            return (
              <div key={p.index} className="rounded-xl border border-[var(--border)] p-3">
                <p className="text-sm font-bold">{p.en}</p>
                <p className="text-xs text-[var(--dim)]">{p.cn}</p>
                <p className="mt-1 font-semibold">{done}/{total} · {ppct}%</p>
                <div className="mt-1.5"><Progress pct={ppct} /></div>
              </div>
            );
          })}
        </div>
      </Card>

        </>
      ) : null}
      {sub === "roadmap" ? (
        <>
      <div>
        <h3 className="text-lg font-bold" style={{ color: TEAL }}>完整路线图 · Full roadmap</h3>
        <p className="mt-1 text-sm text-[var(--dim)]">勾选方框把任务标为完成，也可以加一句备注。颜色表示负责人。Tap the box to mark a task done. Add a note if you like. Colours show who owns each task.</p>
        <div className="mt-4 space-y-4">
          {ROADMAP_WORKSTREAMS_UI.map((ws, wi) => (
            <Card key={wi} title={`${wi + 1}. ${ws.cn} · ${ws.en}`}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {ROADMAP_PHASES_UI.map((p) => {
                  const tasks = data.tasks.filter((t) => t.workstreamIndex === wi && t.phaseIndex === p.index);
                  return (
                    <div key={p.index} className="min-w-0">
                      <div className="mb-2 rounded-lg px-2.5 py-2" style={{ background: data.currentPhaseIndex === p.index ? "var(--accent-light)" : "var(--surface-alt)" }}>
                        <p className="text-sm font-bold">{p.en}</p>
                        <p className="text-xs text-[var(--dim)]">{p.cn}</p>
                        <p className="mt-0.5 text-xs font-medium">{roadmapPhaseDates(serverDate, p)}</p>
                      </div>
                      <div className="space-y-2">{tasks.length === 0 ? <p className="px-1 text-[13px] text-[var(--dim)]">—</p> : tasks.map((t) => <RoadmapTaskCard key={t.id} task={t} />)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
        </>
      ) : null}
      <p className="text-center text-sm text-[var(--dim)]">院后健康 · Houyuan Health — Paid diagnosis first; the program goes live after sign-off.</p>
    </div>
  );
}

/* ================= Helper (agents) ================= */
const HELPER_AGENTS: { icon: string; zh: string; en: string; descZh: string; descEn: string; lastCheck: string; result: string; ok: boolean }[] = [
  {
    icon: "🛠️",
    zh: "网站守护 Site watcher",
    en: "Site watcher",
    descZh: "每天检查网站有没有出错、链接有没有失效、页面能不能打开。简单的小问题它自己修好；修不了的，它会记下来提醒团队。",
    descEn: "Checks the site every day for errors, broken links and pages that stop working. It fixes simple problems itself and flags the rest for the team.",
    lastCheck: "上次检查 Last check：今天 08:00 Today 08:00",
    result: "结果 Result：全部页面正常，没有发现错误 All pages OK, no errors found",
    ok: true,
  },
  {
    icon: "🛡️",
    zh: "安全检查 Safety checker",
    en: "Safety checker",
    descZh: "检查安全和隐私规则有没有被遵守：谁能看什么数据、知情同意有没有记录、成果公示有没有不小心带出个人信息。",
    descEn: "Checks the safety and privacy rules are still met: who can see which data, consent is recorded, and public pages never show personal information.",
    lastCheck: "上次检查 Last check：今天 08:05 Today 08:05",
    result: "结果 Result：规则都符合；1 条提醒（见下方动态）Rules met; 1 reminder below",
    ok: true,
  },
  {
    icon: "⏰",
    zh: "任务提醒 Task reminder",
    en: "Task reminder",
    descZh: "每周日上午查看「工作进展」，把这一周要做、要检查的任务发出来提醒大家。开始日期填好后，它就按周提醒。",
    descEn: "Every Sunday morning it reads the Work Progress tab and sends a reminder of what needs doing or checking that week, once the start date is set.",
    lastCheck: "上次运行 Last run：周日 09:30 Sunday 09:30",
    result: "结果 Result：已发送本周提醒This week's reminder sent",
    ok: true,
  },
];
const HELPER_ACTIVITY: { when: string; zh: string; en: string }[] = [
  { when: "今天 08:00 Today", zh: "网站守护检查了全部页面——没有错误，链接都能打开。", en: "Site watcher checked all pages — no errors, all links open." },
  { when: "今天 08:05 Today", zh: "安全检查：成果公示页只有汇总数字，没有个人信息。", en: "Safety checker: the public outcomes page shows totals only, no personal details." },
  { when: "昨天 Yesterday", zh: "安全检查提醒：P009 有一张饮食照片还在等营养师点评。", en: "Safety checker flagged: one food photo for P009 is still waiting for the dietitian's review." },
  { when: "周日 09:30 Sunday", zh: "任务提醒已发送：本周要检查的任务清单。", en: "Task reminder sent: this week's list of tasks to check." },
  { when: "上周 Last week", zh: "网站守护修好了一个打不开的页面，并记录了下来。", en: "Site watcher fixed a page that would not open, and logged it." },
];

function Helper() {
  const queryClient = useQueryClient();
  const reportsQ = useQuery({ queryKey: ["helperReports"], queryFn: () => api.listProblemReports({}) });
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const submit = useMutation({
    mutationFn: async (t: string) => await api.reportProblem({ text: t }),
    onSuccess: () => { setText(""); setMsg("已提交，谢谢！问题已加到下方列表，团队会看到。Sent — thank you! Your problem is in the list below for the team to see."); void queryClient.invalidateQueries({ queryKey: ["helperReports"] }); },
    onError: (e: Error) => setErrMsg(e.message || "提交失败，请再试一次。Could not send. Please try again."),
  });
  const reports = reportsQ.data?.reports ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>智能助手 Helper — 在后台帮忙的小助手</h2>
        <p className="mt-1 text-sm">这三个小助手在后台自动工作：一个看着网站别出错，一个检查安全规则，一个每周提醒任务。你不用操作它们——这一页只是让你看看它们在做什么。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {HELPER_AGENTS.map((a) => (
          <Card key={a.en}>
            <p className="text-3xl" aria-hidden="true">{a.icon}</p>
            <p className="mt-2 text-base font-bold" style={{ color: TEAL }}>{a.zh}</p>
            <p className="mt-1 text-sm">{a.descZh}</p>
            <p className="mt-1 text-sm text-[var(--dim)]">{a.descEn}</p>
            <div className="mt-3 space-y-1 rounded-lg bg-[var(--surface-alt)] p-3 text-sm">
              <p>{a.lastCheck}</p>
              <p className="font-semibold" style={{ color: a.ok ? GREEN : RED }}>{a.result}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card title="最近动态 Recent activity">
        <ul className="space-y-2">
          {HELPER_ACTIVITY.map((r) => (
            <li key={r.zh} className="flex gap-3 rounded-lg border border-[var(--border)] p-3 text-sm">
              <span className="shrink-0 font-semibold" style={{ color: TEAL }}>{r.when}</span>
              <span>{r.zh}<br /><span className="text-xs text-[var(--dim)]">{r.en}</span></span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="报告问题 Report a problem">
        <p className="text-sm">发现什么不对？在这里写下来，提交后会出现在下方列表里，团队能看到，保存在本应用中。<br /><span className="text-[var(--dim)]">Something wrong? Write it here. When you send it, it appears in the list below for the team; reports are saved in this app.</span></p>
        <form className="mt-3" onSubmit={(e) => { e.preventDefault(); setMsg(""); setErrMsg(""); if (!text.trim()) { setErrMsg("请先写下问题。Please write the problem first."); return; } submit.mutate(text.trim()); }}>
          <label className="block text-sm">问题 Problem
            <textarea {...FIELDS.reportProblem.text} aria-label="Describe the problem" className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="例如：患者列表打不开 / e.g. The patient list will not open" />
          </label>
          <button type="submit" disabled={submit.isPending} className="mt-2 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }}>{submit.isPending ? "提交中… Sending…" : "提交问题 Send problem"}</button>
          {msg ? <p className="mt-2 text-sm" role="status" style={{ color: GREEN }}>{msg}</p> : null}
          {errMsg ? <p className="mt-2 text-sm" role="alert" style={{ color: RED }}>{errMsg}</p> : null}
        </form>
        <div className="mt-4">
          <p className="text-sm font-semibold">已报告的问题 Reported problems{reports.length ? `（${reports.length}）` : ""}</p>
          {reportsQ.isPending ? <p className="mt-1 text-sm text-[var(--dim)]">加载中… Loading…</p> : null}
          {reportsQ.error ? <p className="mt-1 text-sm" style={{ color: RED }}>列表加载失败 Failed to load the list.</p> : null}
          {reportsQ.data && reports.length === 0 ? <p className="mt-1 text-sm text-[var(--dim)]">还没有报告的问题。提交第一个问题后会显示在这里。No problems reported yet — yours will appear here.</p> : null}
          <ul className="mt-2 space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <p>{r.text}</p>
                <p className="mt-0.5 text-xs text-[var(--dim)]">{new Date(r.createdAt).toLocaleString("zh-CN")} · 待团队处理 Waiting for the team</p>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}

/* ================= Resources 资源 (patient education) =================
   Grouped by the six pillars of lifestyle medicine (American College of
   Lifestyle Medicine). Links were checked when this page was written; only
   links that opened successfully are shown — other sources are named
   without a link. Guideline values: US = Dietary Guidelines for Americans
   2020–2025; China = 中国居民膳食指南 (2022), Chinese Nutrition Society. */
const CDC_ACTIVITY_URL = "https://www.cdc.gov/physical-activity-basics/guidelines/";
const CDC_SLEEP_URL = "https://www.cdc.gov/sleep/about/";
const CDC_WELLBEING_URL = "https://www.cdc.gov/emotional-well-being/improve-your-emotional-well-being/index.html";
const CDC_WOMEN_URL = "https://www.cdc.gov/womens-health/features/age-just-a-number.html";
const CDC_DIABETES_URL = "https://www.cdc.gov/diabetes/pdfs/prevent/On-your-way-to-preventing-type-2-diabetes.pdf?2485ce93_page=3&b169400e_page=2";
const AHA_DIET_URL = "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/aha-diet-and-lifestyle-recommendations";
const CHINA_GUIDE_URL = "http://dg.cnsoc.org/article/04/x8zaxCk7QQ2wXw9UnNXJ_A.html";
const BADUANJIN_URL = "https://www.sport.gov.cn/qgzx/n5407/c860043/content.html";
const BADUANJIN_VIDEO_URL = "https://www.bilibili.com/video/BV1X4oKB7E17/";
const TIDE_URL = "https://tide.fm";

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: TEAL }}>{children} ↗</a>;
}

function ProteinCalculator() {
  const [weight, setWeight] = useState("");
  const w = Number(weight);
  const valid = Number.isFinite(w) && w >= 20 && w <= 400;
  const grams = valid ? Math.round(w * 0.8) : null;
  return (
    <div className="rounded-lg bg-[var(--surface-alt)] p-3">
      <p className="text-sm font-semibold">蛋白质计算 Protein calculator — 体重 × 0.8 克/公斤</p>
      <p className="mt-1 text-sm text-[var(--dim)]">健康成人每天蛋白质的最低需要量（推荐膳食供给量 RDA）是每公斤体重 0.8 克。例如体重 70 公斤：70 × 0.8 = 56 克/天。<br />The minimum daily protein need for a healthy adult (the RDA) is 0.8 g per kg of body weight. Example: 70 kg × 0.8 = 56 g a day.</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <label className="text-sm">体重 Body weight (kg)
          <input type="number" min={20} max={400} step="0.1" inputMode="decimal" aria-label="Body weight in kilograms" className="ml-2 w-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
        </label>
        {grams != null ? <p className="text-sm" role="status">每天至少约 <strong>{grams} 克</strong> 蛋白质，平均每餐约 <strong>{Math.round(grams / 3)} 克</strong> · At least about <strong>{grams} g</strong> of protein a day, roughly <strong>{Math.round(grams / 3)} g</strong> per meal</p> : <p className="text-sm text-[var(--dim)]">输入体重后显示结果 · Enter your weight to see the result</p>}
      </div>
      <p className="mt-2 text-xs text-[var(--dim)]">注意：有肾脏疾病或其他疾病的人，蛋白质和钠的摄入请遵医嘱，不要按这个一般数值自行调整。Note: people with kidney disease or other conditions should follow their own clinician's guidance on protein and sodium, not this general figure.</p>
    </div>
  );
}

/* ================= Lifestyle medicine screener form 生活方式医学筛查表 =================
   Fillable version of the ACLM / Loma Linda Short Assessment Form (2024),
   adapted for patients in China: no diet-screener questions (food is logged
   by meal photo in Log my day); substances = nicotine, alcohol, any other
   illicit drugs only, each gated by one past-year Yes/No with follow-ups
   only on Yes; a substance answered "No" stays collapsed on later weekly
   check-ins. Activity uses the two Physical Activity Vital Sign questions
   with the talk test; when a wearable is linked the two questions are
   skipped (minutes sync from the device) unless the patient chooses to
   type them in. Answers save to the app database; the latest save
   pre-fills the form so it can be filled in again later. */
type ScreenerLatest = ApiResponse<typeof api, "getScreenerState">["latest"];
type MotivationArea = "nutrition" | "activity" | "sleep" | "stress" | "social" | "substances";
type SubstanceKey = "nicotine" | "alcohol" | "otherDrugs";

const FREQ_OPTIONS: { v: number; zh: string; en: string }[] = [
  { v: 0, zh: "完全没有", en: "Not at all" },
  { v: 1, zh: "有几天", en: "Several days" },
  { v: 2, zh: "一半以上的天数", en: "More than half the days" },
  { v: 3, zh: "几乎每天", en: "Nearly every day" },
];
const SLEEP_BANDS: { k: string; zh: string; en: string }[] = [
  { k: "lt4", zh: "少于 4 小时", en: "Less than 4 hours" },
  { k: "b45", zh: "4–5 小时", en: "4–5 hours" },
  { k: "b56", zh: "5–6 小时", en: "5–6 hours" },
  { k: "b67", zh: "6–7 小时", en: "6–7 hours" },
  { k: "b78", zh: "7–8 小时", en: "7–8 hours" },
  { k: "b89", zh: "8–9 小时", en: "8–9 hours" },
  { k: "b9p", zh: "9 小时或更多", en: "9 hours or more" },
];
const MOTIVATION_AREAS: { k: MotivationArea; zh: string; en: string }[] = [
  { k: "nutrition", zh: "饮食", en: "Nutrition" },
  { k: "activity", zh: "身体活动", en: "Physical Activity" },
  { k: "sleep", zh: "睡眠", en: "Sleep" },
  { k: "stress", zh: "压力管理", en: "Stress Management" },
  { k: "social", zh: "社交联系", en: "Social Connectedness" },
  { k: "substances", zh: "远离有害物质", en: "Avoidance of Risky Substances" },
];

function ChoiceBtn({ selected, onClick, children, ariaLabel }: { selected: boolean; onClick: () => void; children: React.ReactNode; ariaLabel?: string }) {
  return (
    <button type="button" aria-pressed={selected} aria-label={ariaLabel} onClick={onClick}
      className="rounded-lg border px-3 py-2.5 text-left text-sm font-semibold"
      style={selected ? { background: TEAL, borderColor: TEAL, color: "#fff" } : { borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}>
      {children}
    </button>
  );
}

function FreqQuestion({ zh, en, value, onChange }: { zh: string; en: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-base">{zh}<br /><span className="text-sm text-[var(--dim)]">{en}</span></p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={en}>
        {FREQ_OPTIONS.map((o) => (
          <ChoiceBtn key={o.v} selected={value === o.v} onClick={() => onChange(o.v)} ariaLabel={`${o.zh} ${o.en}`}>
            {o.zh}<br /><span className="text-xs font-normal opacity-80">{o.en}</span>
          </ChoiceBtn>
        ))}
      </div>
    </div>
  );
}

function YesNo({ value, onChange, label }: { value: boolean | null; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label={label}>
      <ChoiceBtn selected={value === true} onClick={() => onChange(true)} ariaLabel={`${label} — 是 Yes`}>是 Yes</ChoiceBtn>
      <ChoiceBtn selected={value === false} onClick={() => onChange(false)} ariaLabel={`${label} — 没有 No`}>没有 No</ChoiceBtn>
    </div>
  );
}

function ScaleRow({ zh, en, value, onChange, min, max, lowZh, lowEn, highZh, highEn }: {
  zh: string; en: string; value: number | null; onChange: (v: number) => void;
  min: number; max: number; lowZh: string; lowEn: string; highZh: string; highEn: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base">{zh}<br /><span className="text-sm text-[var(--dim)]">{en}</span></p>
        <span className="shrink-0 text-2xl font-bold" style={{ color: TEAL }} aria-live="polite">{value == null ? "—" : value}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value ?? min} aria-label={en}
        onChange={(e) => onChange(Number(e.target.value))} className="h-10 w-full cursor-pointer" style={{ accentColor: TEAL }} />
      <div className="flex justify-between gap-2 text-xs text-[var(--dim)]">
        <span>{min} · {lowZh} {lowEn}</span>
        <span className="text-right">{max} · {highZh} {highEn}</span>
      </div>
      {value == null ? <p className="mt-0.5 text-xs text-[var(--dim)]">滑动上面的圆点来回答 · Slide the dot to answer</p> : null}
    </div>
  );
}

function RhythmBadge({ daily }: { daily: boolean }) {
  return (
    <span className="ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-xs font-bold text-white" style={{ background: daily ? TEAL : DEEP }}>
      {daily ? "每天 Daily" : "每周 Weekly"}
    </span>
  );
}

interface SubstanceState { used: boolean | null; amount: string; concern: number | null; replacement: boolean | null; quitInterest: boolean | null; revealed: boolean }
const EMPTY_SUBSTANCE: SubstanceState = { used: null, amount: "", concern: null, replacement: null, quitInterest: null, revealed: true };

function ScreenerForm() {
  const queryClient = useQueryClient();
  const stateQ = useQuery({ queryKey: ["screener"], queryFn: () => api.getScreenerState({}) });
  const wearableQ = useQuery({ queryKey: ["wearableLink"], queryFn: () => api.getWearableLink({}) });
  const linkedDevice = wearableQ.data?.device ?? "";

  const [importance, setImportance] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<MotivationArea[]>([]);
  const [actDays, setActDays] = useState("");
  const [actMinutes, setActMinutes] = useState("");
  const [actStrength, setActStrength] = useState("");
  const [sleepBand, setSleepBand] = useState<string | null>(null);
  const [sleepTired, setSleepTired] = useState<number | null>(null);
  const [phqInterest, setPhqInterest] = useState<number | null>(null);
  const [phqDown, setPhqDown] = useState<number | null>(null);
  const [meaningPurpose, setMeaningPurpose] = useState<number | null>(null);
  const [meaningConnected, setMeaningConnected] = useState<number | null>(null);
  const [subs, setSubs] = useState<Record<SubstanceKey, SubstanceState>>({ nicotine: { ...EMPTY_SUBSTANCE }, alcohol: { ...EMPTY_SUBSTANCE }, otherDrugs: { ...EMPTY_SUBSTANCE } });
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!stateQ.data || loaded) return;
    const l: ScreenerLatest = stateQ.data.latest;
    if (l) {
      setImportance(l.readinessImportance);
      setConfidence(l.readinessConfidence);
      setMotivation(l.motivationTop as MotivationArea[]);
      setActDays(l.activityDays != null ? String(l.activityDays) : "");
      setActMinutes(l.activityMinutes != null ? String(l.activityMinutes) : "");
      setActStrength(l.activityStrengthDays != null ? String(l.activityStrengthDays) : "");
      setSleepBand(l.sleepBand);
      setSleepTired(l.sleepTired);
      setPhqInterest(l.phqInterest);
      setPhqDown(l.phqDown);
      setMeaningPurpose(l.meaningPurpose);
      setMeaningConnected(l.meaningConnected);
      const fill = (s: { used: boolean | null; amountPerWeek: string; concern: number | null }, extra?: { replacement: boolean | null; quitInterest: boolean | null }): SubstanceState => ({
        used: s.used, amount: s.amountPerWeek, concern: s.concern,
        replacement: extra?.replacement ?? null, quitInterest: extra?.quitInterest ?? null,
        revealed: s.used !== false,
      });
      setSubs({ nicotine: fill(l.nicotine, l.nicotine), alcohol: fill(l.alcohol), otherDrugs: fill(l.otherDrugs) });
    }
    setLoaded(true);
  }, [stateQ.data, loaded]);

  const setSub = (k: SubstanceKey, patch: Partial<SubstanceState>) => setSubs((prev) => ({ ...prev, [k]: { ...prev[k], ...patch } }));

  const toggleMotivation = (k: MotivationArea) => {
    setMotivation((prev) => {
      if (prev.includes(k)) return prev.filter((x) => x !== k);
      if (prev.length >= 3) return prev;
      return [...prev, k];
    });
  };

  const numOrNull = (s: string) => { const t = s.trim(); if (t === "") return null; const n = Number(t); return Number.isFinite(n) ? Math.round(n) : null; };

  const save = useMutation({
    mutationFn: async () => await api.saveScreener({
      readinessImportance: importance,
      readinessConfidence: confidence,
      motivationTop: motivation,
      activityDays: numOrNull(actDays),
      activityMinutes: numOrNull(actMinutes),
      activityStrengthDays: numOrNull(actStrength),
      sleepBand: sleepBand as "lt4" | "b45" | "b56" | "b67" | "b78" | "b89" | "b9p" | null,
      sleepTired, phqInterest, phqDown, meaningPurpose, meaningConnected,
      nicotine: { used: subs.nicotine.used, amountPerWeek: subs.nicotine.amount.trim(), concern: subs.nicotine.concern, replacement: subs.nicotine.replacement, quitInterest: subs.nicotine.quitInterest },
      alcohol: { used: subs.alcohol.used, amountPerWeek: subs.alcohol.amount.trim(), concern: subs.alcohol.concern },
      otherDrugs: { used: subs.otherDrugs.used, amountPerWeek: subs.otherDrugs.amount.trim(), concern: subs.otherDrugs.concern },
    }),
    onSuccess: () => { setMsg("已保存 ✓ 下次打开这一页，会带出您这次的答案，可以接着修改。Saved ✓ Next time, this page will show these answers so you can update them."); void queryClient.invalidateQueries({ queryKey: ["screener"] }); },
    onError: (e: Error) => setErrMsg(e.message || "保存失败，请再试一次。Could not save. Please try again."),
  });

  const submit = () => {
    setMsg(""); setErrMsg("");
    const d = numOrNull(actDays); const mins = numOrNull(actMinutes); const str = numOrNull(actStrength);
    if (d != null && (d < 0 || d > 7)) { setErrMsg("活动天数请填 0–7。Activity days should be 0–7."); return; }
    if (mins != null && (mins < 0 || mins > 1440)) { setErrMsg("活动分钟请填 0–1440。Activity minutes should be 0–1440."); return; }
    if (str != null && (str < 0 || str > 7)) { setErrMsg("肌肉强化天数请填 0–7。Strength days should be 0–7."); return; }
    const anyAnswered = importance != null || confidence != null || motivation.length > 0 || d != null || mins != null || str != null
      || sleepBand != null || sleepTired != null || phqInterest != null || phqDown != null || meaningPurpose != null || meaningConnected != null
      || subs.nicotine.used != null || subs.alcohol.used != null || subs.otherDrugs.used != null;
    if (!anyAnswered) { setErrMsg("先回答至少一题再保存。Please answer at least one question before saving."); return; }
    save.mutate();
  };

  const substanceBlock = (k: SubstanceKey, zhName: string, enName: string, questionZh: string, questionEn: string, amountLabelZh: string, amountLabelEn: string, amountPlaceholder: string) => {
    const s = subs[k];
    if (!s.revealed) {
      return (
        <div className="rounded-lg bg-[var(--surface-alt)] p-3">
          <p className="text-sm"><strong>{zhName} {enName}：</strong>上次您回答过去一年没有使用。以后每周填写时这一题不会再出现。<br /><span className="text-[var(--dim)]">Last time you answered No for the past year, so this question stays hidden in later weekly check-ins.</span></p>
          <button type="button" className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold" style={{ color: TEAL }}
            onClick={() => setSub(k, { revealed: true })}>
            有变化，重新回答 Something changed — answer again
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div>
          <p className="text-base">{questionZh}<br /><span className="text-sm text-[var(--dim)]">{questionEn}</span></p>
          <div className="mt-2"><YesNo value={s.used} onChange={(v) => setSub(k, { used: v })} label={questionEn} /></div>
        </div>
        {s.used === true ? (
          <div className="space-y-4 rounded-lg bg-[var(--surface-alt)] p-3">
            <label className="block text-sm">{amountLabelZh} <span className="text-[var(--dim)]">{amountLabelEn}</span>
              {k === "nicotine" ? (
                <input {...FIELDS.saveScreener.nicotine.amountPerWeek} type="text" value={s.amount} onChange={(e) => setSub(k, { amount: e.target.value })} placeholder={amountPlaceholder} aria-label={amountLabelEn} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base" />
              ) : k === "alcohol" ? (
                <input {...FIELDS.saveScreener.alcohol.amountPerWeek} type="text" value={s.amount} onChange={(e) => setSub(k, { amount: e.target.value })} placeholder={amountPlaceholder} aria-label={amountLabelEn} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base" />
              ) : (
                <input {...FIELDS.saveScreener.otherDrugs.amountPerWeek} type="text" value={s.amount} onChange={(e) => setSub(k, { amount: e.target.value })} placeholder={amountPlaceholder} aria-label={amountLabelEn} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base" />
              )}
            </label>
            <ScaleRow zh="您有多担心它对健康的影响？" en="How concerned are you about its effect on your health?" value={s.concern} onChange={(v) => setSub(k, { concern: v })}
              min={1} max={10} lowZh="不担心" lowEn="Not concerned" highZh="非常担心" highEn="Very concerned" />
            {k === "nicotine" ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base">您现在是否在用尼古丁替代产品（如戒烟贴、戒烟口香糖）？<br /><span className="text-sm text-[var(--dim)]">Are you currently using nicotine replacement (such as patches or gum)?</span></p>
                  <div className="mt-2"><YesNo value={s.replacement} onChange={(v) => setSub(k, { replacement: v })} label="Currently using nicotine replacement" /></div>
                </div>
                <div>
                  <p className="text-base">您有兴趣戒烟吗？<br /><span className="text-sm text-[var(--dim)]">Are you interested in quitting?</span></p>
                  <div className="mt-2"><YesNo value={s.quitInterest} onChange={(v) => setSub(k, { quitInterest: v })} label="Interested in quitting" /></div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const count = stateQ.data?.count ?? 0;
  const latestAt = stateQ.data?.latestAt ? new Date(stateQ.data.latestAt) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold" style={{ color: TEAL }}>生活方式医学筛查表 Lifestyle medicine screener — 在线填写 Fill in online</h3>
        <p className="mt-1 text-sm text-[var(--dim)]">改编自美国生活方式医学学会（ACLM）与洛马林达大学的简短评估表（2024 年版），并按中国的情况做了调整。每天的问题问饮食、活动和睡眠；每周的问题问心情、意义与连接、改变的准备和动力、物质使用。答案会保存下来，下次打开会带出上次的答案，可以接着改。<br />Adapted from the ACLM / Loma Linda Short Assessment Form (2024), adjusted for patients in China. Daily questions cover food, activity and sleep; weekly questions cover mood, meaning and connectedness, readiness and motivation, and substance use. Answers are saved, and the form brings back your last answers so you can fill it in again later.</p>
        {count > 0 && latestAt ? <p className="mt-1 text-sm">您已经填写过 {count} 次 · 上次保存：{latestAt.toLocaleDateString("zh-CN")} {latestAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}<br /><span className="text-[var(--dim)]">You have filled this in {count} time(s) · Last saved {latestAt.toLocaleDateString("en-GB")} {latestAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span></p> : null}
      </div>

      <p className="text-base font-bold" style={{ color: DEEP }}>每天的问题 Daily questions</p>

      <Card title="饮食 Food">
        <p className="text-sm">饮食不用在这张表里填：在「患者端 · 记录我的一天」里，把每餐拍照上传就可以，团队会看照片了解您吃得怎么样。<br />Food is not asked on this form — in the Patient app tab, under Log my day, just take a photo of each meal; the team learns how you eat from the photos.</p>
      </Card>

      <Card>
        <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>身体活动 Physical activity<RhythmBadge daily /></h3>
        <div className="space-y-4">
          <div className="rounded-lg bg-[var(--surface-alt)] p-3 text-sm">
            <p className="font-semibold">怎么判断强度？用「说话测试」How to judge intensity — the talk test:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><strong>高强度 Vigorous:</strong> 活动时没法舒服地说话，例如跑步。You cannot talk comfortably, e.g. running.</li>
              <li><strong>中等强度 Moderate:</strong> 能说话，但不能唱歌，例如快走。You can talk but not sing, e.g. brisk walking.</li>
              <li><strong>低强度 Light:</strong> 能轻松聊天，例如慢慢散步。You can chat easily, e.g. easy walking.</li>
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">在过去 2 周里，平均每周有几天做中等到高强度的身体活动？<br /><span className="text-[var(--dim)]">For an average week in the last 2 weeks, how many days per week did you do moderate to vigorous physical activity?</span>
              <input {...FIELDS.saveScreener.activityDays} type="number" inputMode="numeric" value={actDays} onChange={(e) => setActDays(e.target.value)} placeholder="0–7" aria-label="Days per week of moderate to vigorous physical activity" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base" />
            </label>
            <label className="block text-sm">在那些天里，平均每天活动多少分钟？<br /><span className="text-[var(--dim)]">On those days, how many minutes on average?</span>
              <input {...FIELDS.saveScreener.activityMinutes} type="number" inputMode="numeric" value={actMinutes} onChange={(e) => setActMinutes(e.target.value)} placeholder="如 30" aria-label="Minutes of activity on those days" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base" />
            </label>
            <label className="block text-sm">（可选）平均每周有几天做肌肉强化活动，如举重、俯卧撑、深蹲？<br /><span className="text-[var(--dim)]">(Optional) How many days per week do you do muscle-strengthening activities, such as weights, push-ups or squats?</span>
              <input {...FIELDS.saveScreener.activityStrengthDays} type="number" inputMode="numeric" value={actStrength} onChange={(e) => setActStrength(e.target.value)} placeholder="0–7" aria-label="Days per week of muscle-strengthening activity" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-base" />
            </label>
          </div>
          {actDays !== "" && actMinutes !== "" && Number(actDays) > 0 ? (
            <p className="text-sm" role="status">按您填的数字：每周约 {Number(actDays) * Number(actMinutes || 0)} 分钟中等到高强度活动（目标：每周至少 150 分钟）。<br /><span className="text-[var(--dim)]">From your answers: about {Number(actDays) * Number(actMinutes || 0)} minutes of moderate-to-vigorous activity a week (goal: at least 150 minutes a week).</span></p>
          ) : null}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>睡眠 Sleep<RhythmBadge daily /></h3>
        <div className="space-y-5">
          <div>
            <p className="text-base">在过去 2 周里，您平均 24 小时睡多少小时？<br /><span className="text-sm text-[var(--dim)]">Over the last 2 weeks, how many hours of sleep did you average in a 24-hour period?</span></p>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Average hours of sleep in 24 hours">
              {SLEEP_BANDS.map((b) => (
                <ChoiceBtn key={b.k} selected={sleepBand === b.k} onClick={() => setSleepBand(b.k)} ariaLabel={`${b.zh} ${b.en}`}>{b.zh}</ChoiceBtn>
              ))}
            </div>
          </div>
          <FreqQuestion zh="在过去 2 周里，您有多经常在做日常事情时感到困倦、或难以保持清醒？" en="Over the last 2 weeks, how often did you feel tired or have difficulty staying awake during routine tasks?" value={sleepTired} onChange={setSleepTired} />
        </div>
      </Card>

      <p className="text-base font-bold" style={{ color: DEEP }}>每周的问题 Weekly questions</p>

      <Card>
        <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>心情 Mood<RhythmBadge daily={false} /></h3>
        <div className="space-y-5">
          <p className="text-sm text-[var(--dim)]">在过去 2 周里，您有多经常被下面这些问题困扰？Over the last 2 weeks, how often have you been bothered by:</p>
          <FreqQuestion zh="对事情没什么兴趣或乐趣" en="Little interest or pleasure in doing things" value={phqInterest} onChange={setPhqInterest} />
          <FreqQuestion zh="情绪低落、沮丧，或感到没有希望" en="Feeling down, depressed, or hopeless" value={phqDown} onChange={setPhqDown} />
          {phqInterest != null && phqDown != null ? <p className="text-sm" role="status">两题合计 {phqInterest + phqDown} 分（满分 6 分）。分数会和团队分享，分数高时团队会主动联系您。<br /><span className="text-[var(--dim)]">Total for the two questions: {phqInterest + phqDown} out of 6. Your team sees the score and will reach out if it is high.</span></p> : null}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>意义与连接 Meaning and connectedness<RhythmBadge daily={false} /></h3>
        <div className="space-y-5">
          <FreqQuestion zh="在过去 2 周里，您有多经常觉得生活有目标、有意义？" en="Over the last 2 weeks, how often have you felt like your life had purpose or meaning?" value={meaningPurpose} onChange={setMeaningPurpose} />
          <FreqQuestion zh="在过去 2 周里，您有多经常感到和支持您的人或群体有联系（例如家人、朋友、社区、信仰团体、大自然、瑜伽或冥想）？" en="Over the last 2 weeks, how often have you felt connected with any support network (e.g. community, spiritual, friends/family, nature, yoga, or meditation)?" value={meaningConnected} onChange={setMeaningConnected} />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>改变的准备 Readiness to change<RhythmBadge daily={false} /></h3>
        <div className="space-y-5">
          <ScaleRow zh="为了改善健康而改变或保持生活方式，对您来说有多重要？" en="How important is it to make or keep lifestyle changes to improve your health?" value={importance} onChange={setImportance}
            min={0} max={10} lowZh="还没准备好" lowEn="Not ready" highZh="非常愿意" highEn="Very ready" />
          <ScaleRow zh="您有多大信心能做到这些改变？" en="How confident are you to make or keep these changes?" value={confidence} onChange={setConfidence}
            min={0} max={10} lowZh="没有信心" lowEn="Not confident" highZh="非常有信心" highEn="Very confident" />
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>最想改变的方面 Motivation<RhythmBadge daily={false} /></h3>
        <p className="text-sm text-[var(--dim)]">请按顺序点选您最想改变的 3 个方面：第 1 个是最想改变的。点已选的可以取消。<br />Tap the 3 areas you are most motivated to change, in order — the first tap is your top choice. Tap a chosen area again to remove it.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {MOTIVATION_AREAS.map((a) => {
            const idx = motivation.indexOf(a.k);
            return (
              <ChoiceBtn key={a.k} selected={idx >= 0} onClick={() => toggleMotivation(a.k)} ariaLabel={`${a.zh} ${a.en}${idx >= 0 ? `, 第 ${idx + 1} 位 rank ${idx + 1}` : ""}`}>
                <PillarImg k={a.k} className="mb-1.5 h-10 w-10 rounded-lg object-cover" />
                {idx >= 0 ? <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold" style={{ color: TEAL }}>{idx + 1}</span> : null}
                {a.zh}<br /><span className="text-xs font-normal opacity-80">{a.en}</span>
              </ChoiceBtn>
            );
          })}
        </div>
        {motivation.length > 0 && motivation.length < 3 ? <p className="mt-2 text-sm text-[var(--dim)]">已选 {motivation.length} 个，还可以再选 {3 - motivation.length} 个。{motivation.length} chosen — you can pick {3 - motivation.length} more.</p> : null}
      </Card>

      <Card>
        <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>物质使用 Substance use<RhythmBadge daily={false} /></h3>
        <div className="space-y-6">
          <p className="text-sm text-[var(--dim)]">下面 3 题先问「是」或「没有」；回答「没有」就不用再填，这一题以后每周也不会再出现。回答「是」才会出现几个小问题。<br />Each of the 3 questions starts with Yes or No. If you answer No, there is nothing more to fill in, and that question will not come up again in later weekly check-ins. Follow-up questions only appear if you answer Yes.</p>
          {substanceBlock("nicotine", "尼古丁", "Nicotine",
            "在过去一年里，您用过尼古丁吗（香烟、电子烟、雪茄、嚼烟等）？",
            "Have you used nicotine in the past year (cigarettes, e-cigarettes/vaping, chewing tobacco, cigars)?",
            "每周大约用多少？请简单写一写", "How much per week? A short note is fine", "如：每天约 10 支香烟")}
          {substanceBlock("alcohol", "酒精", "Alcohol",
            "在过去一年里，您喝过酒吗？",
            "Have you used alcohol in the past year?",
            "每周大约喝多少？请简单写一写", "How much per week? A short note is fine", "如：每周 2 次，每次 1 杯啤酒")}
          {substanceBlock("otherDrugs", "其他非法药物", "Any other illicit drugs",
            "在过去一年里，您用过其他非法药物吗？",
            "Have you used any other illicit drugs in the past year?",
            "每周大约用多少？请简单写一写", "How much per week? A short note is fine", "如：每周 1 次")}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={submit} disabled={save.isPending}
          className="rounded-lg px-5 py-3 text-base font-bold text-white disabled:opacity-60" style={{ background: TEAL }}>
          {save.isPending ? "保存中… Saving…" : "保存 Save"}
        </button>
        {msg ? <p className="text-sm" role="status" style={{ color: GREEN }}>{msg}</p> : null}
        {errMsg ? <p className="text-sm" role="alert" style={{ color: RED }}>{errMsg}</p> : null}
      </div>
    </div>
  );
}

function Resources() {
  const [pillar, setPillar] = useState<"nutrition" | "activity" | "sleep" | "stress" | "social" | "substances">("nutrition");
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>资源 Resources — 患者教育 Patient education</h2>
        <p className="text-sm text-[var(--dim)]">按生活方式医学六大支柱整理（美国生活方式医学学会 American College of Lifestyle Medicine）。这里是一般健康教育，不是针对某一位患者的医疗建议；自己的情况请问您的医生或营养师。<br />Organised by the six pillars of lifestyle medicine. This is general education, not medical advice for any one patient — please ask your own doctor or dietitian about your situation.</p>
      </div>
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 space-y-1 text-sm">
            <p className="font-semibold">生活方式医学问卷 Lifestyle medicine screener</p>
            <p className="text-[var(--dim)]">问卷在患者端（小程序）里，是它自己的一个标签，点开就能填，不用在这里找。每天的问题问活动和睡眠；每周的问题问心情、意义与连接、改变的准备和动力、物质使用。<br />The screener lives in the Patient app (mini-program) as its own tab — tap it and fill it in there. Daily questions cover activity and sleep; weekly ones cover mood, meaning and connectedness, readiness, motivation and substance use.</p>
          </div>
          <button type="button" className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: TEAL }} onClick={() => { sessionStorage.setItem("openScreener", "1"); window.location.hash = "app"; window.scrollTo({ top: 0 }); }}>去填问卷 Go to the screener</button>
        </div>
      </Card>
      <div>
        <h3 className="text-lg font-bold" style={{ color: TEAL }}>学习资料 Learn more — 按支柱看 By pillar</h3>
      </div>
      <SubTabs label="Resource pillars" value={pillar} onChange={setPillar} tabs={[
        { key: "nutrition", zh: "饮食", en: "Nutrition" },
        { key: "activity", zh: "运动", en: "Activity" },
        { key: "sleep", zh: "睡眠", en: "Sleep" },
        { key: "stress", zh: "压力管理", en: "Stress" },
        { key: "social", zh: "社交", en: "Social" },
        { key: "substances", zh: "远离有害物质", en: "Avoiding substances" },
      ]} />
      {pillar === "nutrition" ? (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row">
              <img src={pillarNutrition} alt="一碗蔬菜、谷物和鸡蛋的插图 Illustration of a bowl of vegetables, grains and egg" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">以天然食物为主、多吃植物性食物：蔬菜、全谷物、豆类、水果、坚果，适量鱼、蛋、奶。少吃加工肉、含糖饮料和超加工食品。<br />Build meals around whole foods, mostly plants: vegetables, whole grains, beans, fruit and nuts, with moderate fish, eggs and dairy. Cut back on processed meat, sugary drinks and ultra-processed foods.</p>
                <p>按疾病看饮食 Eating with a condition:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li><strong>糖尿病 / 糖尿病前期 Diabetes &amp; prediabetes:</strong> 餐盘法（一半蔬菜、四分之一蛋白质、四分之一全谷物主食），少喝含糖饮料。See the CDC guide <SourceLink href={CDC_DIABETES_URL}>On Your Way to Preventing Type 2 Diabetes (CDC)</SourceLink></li>
                  <li><strong>心脏病 Heart disease:</strong> 多蔬果全谷物，选鱼和豆类代替红肉，少盐少饱和脂肪。See <SourceLink href={AHA_DIET_URL}>AHA Diet and Lifestyle Recommendations (American Heart Association)</SourceLink></li>
                  <li><strong>高血压 High blood pressure:</strong> 关键是少盐——见下方中美指南对照（中国指南：每天食盐不超过 5 克）。The key step is less salt — see the US/China comparison below.</li>
                </ul>
              </div>
            </div>
          </Card>
          <Card title="饮食指南对照 US and China food guidelines side by side">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">项目 Item</th><th className="py-2 pr-2">美国 United States</th><th className="py-2">中国 China</th></tr></thead>
                <tbody>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 pr-2 font-semibold">钠 / 食盐 Sodium / salt</td><td className="py-2 pr-2">美国心脏协会（AHA）标准：一般人每天钠不超过 2,300 毫克；有慢性疾病的人，尤其高血压，最好每天控制在 1,500 毫克以内。<br /><span className="text-[var(--dim)]">American Heart Association (AHA): no more than 2,300 mg of sodium a day for most people; with a chronic condition — especially high blood pressure — aim for less than 1,500 mg a day.</span></td><td className="py-2">食盐 ≤5 克/天（约合钠 2,000 毫克）</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 pr-2 font-semibold">添加糖 Added sugar</td><td className="py-2 pr-2">美国心脏协会（AHA）标准：添加糖控制在每天总热量的 6% 以内。换成好记的量——男士每天不超过 9 茶匙（36 克，约 150 千卡）；女士不超过 6 茶匙（25 克，约 100 千卡）；2 岁以上儿童不超过 25 克（6 茶匙）；2 岁以下不加糖。<br /><span className="text-[var(--dim)]">American Heart Association (AHA): keep added sugars below 6% of daily calories. In easy-to-picture amounts — men: no more than 9 teaspoons (36 g, about 150 calories) a day; women: no more than 6 teaspoons (25 g, about 100 calories); children over 2: no more than 25 g (6 teaspoons); under 2: no added sugar.</span></td><td className="py-2">≤50 克/天，最好 &lt;25 克/天</td></tr>
                  <tr><td className="py-2 pr-2 font-semibold">蛋白质 Protein</td><td className="py-2 pr-2">成人最低需要量 0.8 克/公斤体重/天</td><td className="py-2">蛋白质供能比 10–20%；通过食物摄入：鱼虾每周 300–500 克、畜禽肉每周 300–500 克、蛋类每周 300–350 克、奶 ≥300 毫升/天，常吃大豆制品</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[var(--dim)]">来源 Sources：钠与添加糖为美国心脏协会（AHA）标准 — American Heart Association, heart.org, “How Much Sodium Should I Eat Per Day?” and “How Much Sugar Is Too Much?”；蛋白质为美国《美国居民膳食指南 2020–2025》Dietary Guidelines for Americans 2020–2025；中国《中国居民膳食指南（2022）》，中国营养学会 Chinese Nutrition Society — <SourceLink href={CHINA_GUIDE_URL}>中国居民膳食指南官网 dg.cnsoc.org</SourceLink>。数值只收录能从官方指南核实的内容。Only values verified in the official guideline documents are shown.</p>
            <div className="mt-3"><ProteinCalculator /></div>
          </Card>
          <Card title="微量营养素：吃得少、作用大 Micronutrients — needed in tiny amounts, impossible to do without">
            <div className="space-y-2 text-sm">
              <p><strong>什么是微量营养素？</strong>就是维生素和矿物质。身体需要的量很少，却一天都不能少。和蛋白质、脂肪、碳水化合物不同，它们不提供热量，却管着骨骼、血液、免疫力、视力和精力。<br />Micronutrients are vitamins and minerals. The body needs them in tiny amounts but cannot do without them. Unlike protein, fat and carbohydrate, they give no energy — instead they keep bones, blood, immunity, eyesight and energy working.</p>
              <p><strong>「隐性饥饿」Hidden hunger:</strong> 饭吃得够、热量够，却缺微量营养素——肚子不饿，身体却在悄悄受影响：容易累、贫血、骨头变脆、抵抗力下降。据估计，中国约有 3 亿人受隐性饥饿影响。<br />Eating enough calories but missing micronutrients: you don't feel hungry, yet your health quietly suffers — tiredness, anaemia, weaker bones, lower immunity. An estimated 300 million people in China are affected.</p>
              <p><strong>中国人最容易缺哪些？</strong>钙（超过 97% 的成年人摄入不足）、维生素 B2（约 96%）、维生素 A 和维生素 B1（超过 85%）、维生素 C（超过 60%）、镁（超过 60%）、钾（81.9% 低于适宜摄入量）；维生素 D 缺乏在各个年龄段都很普遍。2023 年浙江一项 15,810 名成年人的调查也发现：维生素 B2 摄入不足 88.1%、维生素 E 87.6%、钙 81.6%。<br />The ones that run lowest in China: calcium (over 97% of adults below the recommended intake), riboflavin / vitamin B2 (about 96%), vitamin A and thiamin / B1 (over 85%), vitamin C (over 60%), magnesium (over 60%), potassium (81.9% below the adequate intake), and vitamin D deficiency is highly prevalent at all ages. A 2023 Zhejiang survey of 15,810 adults found the same pattern: riboflavin 88.1%, vitamin E 87.6% and calcium 81.6% inadequate.</p>
              <p><strong>怎么办？吃得杂，就够了大半。</strong>《中国居民膳食指南（2022）》建议：每天吃 12 种以上食物，每周 25 种以上。多挑营养密度高的：绿叶菜、西兰花、胡萝卜、菌菇；颜色丰富的水果（橙子、猕猴桃、莓类、苹果）；全谷物（燕麦、糙米、小米、玉米）；奶和奶制品、鸡蛋、豆腐、鱼虾、瘦肉。做法上蒸煮最能留住营养，少油炸。<br />The practical fix is variety: the Chinese Dietary Guidelines (2022) suggest 12 or more kinds of food a day and 25 or more a week. Choose nutrient-dense foods — leafy greens, broccoli, carrots, mushrooms; colourful fruits (orange, kiwi, berries, apple); whole grains (oats, brown rice, millet, corn); dairy, eggs, tofu, fish and shrimp, lean meat. Steaming keeps the most nutrients; avoid deep-frying.</p>
              <p className="text-xs text-[var(--dim)]">来源 Sources：(1) 中国营养学会《科学营养餐桌·全民高质量膳食促进行动报告》(2026); (2) Wang et al., Front. Nutr. 2025, 12:1638705 — <SourceLink href="https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1638705/full">Frontiers in Nutrition</SourceLink>; (3) 刘锐等《中国居民隐性饥饿问题现状、挑战与应对》，食品与机械 2024, 40(9), DOI 10.13652/j.spjx.1003.5788.2024.60110; (4) 《中国居民膳食指南（2022）》。</p>
            </div>
          </Card>
          <Card title="中国传统饮食智慧 Chinese food wisdom">
            <div className="space-y-3 text-sm">
              <p>中国的饮食智慧有几千年历史：食物既是滋养，也是良药；顺应季节、吃得有节制，就是最长久的养生。<br />Chinese food wisdom goes back thousands of years — food as nourishment and as medicine, eating with the seasons and in moderation.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { say: "民以食为天", en: "“Food is heaven for the people.”", today: "吃是第一位的大事——吃好，是健康的根基。Food comes first; eating well is the foundation of health." },
                  { say: "早吃好，午吃饱，晚吃少", en: "“Eat well at breakfast, eat your fill at lunch, eat little at dinner.”", today: "一天的安排有轻重：早餐要讲究，晚餐别过量。A good breakfast, a lighter dinner." },
                  { say: "清晨一杯水，生津又能润脾胃", en: "“A glass of water in the morning refreshes and wakes up the digestion.”", today: "起床先喝杯温水，帮身体和肠胃慢慢醒来。Start the day with a glass of water." },
                  { say: "朝食三片姜，胜过人参汤", en: "“Three slices of ginger in the morning beats ginseng soup.”", today: "日常小食材，用对了就是补。Simple everyday foods, used well, are the best tonic." },
                  { say: "药补不如食补", en: "“Food nourishes better than medicine.”", today: "好好吃饭，就是最好的补养。Good everyday eating is the best tonic." },
                  { say: "五谷为养，五果为助，五畜为益，五菜为充", en: "From the Yellow Emperor's Classic: “Grains nourish, fruits assist, meats benefit, vegetables fill.”", today: "餐盘的中心是五谷，再配上果、肉、菜——这就是均衡。A balanced plate with grains at the centre." },
                  { say: "食饮有节，起居有常", en: "From the Yellow Emperor's Classic: “Eat and drink with moderation, keep regular hours.”", today: "吃得有节制，作息有规律。Moderation in eating, regularity in daily life." },
                  { say: "不时不食", en: "From the Analects: “Don't eat out of season.”", today: "吃当季的食物，新鲜又合时令。Eat what the season offers." },
                  { say: "饭吃八分饱", en: "“Stop at 80% full.”", today: "留一点余地，肠胃没负担。Leave a little room — don't eat to bursting." },
                  { say: "饭后走一走，能活九十九", en: "“A short walk after meals keeps you well into old age.”", today: "饭后散散步，帮助消化，也算一天的活动量。A gentle walk after meals aids digestion and adds to the day's activity." },
                ].map((w) => (
                  <div key={w.say} className="rounded-lg bg-[var(--surface-alt)] p-3">
                    <p className="text-base font-bold" style={{ color: TEAL }}>{w.say}</p>
                    <p className="mt-0.5 text-[var(--dim)]">{w.en}</p>
                    <p className="mt-1">{w.today}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--dim)]">来源 Sources：《黄帝内经·素问》、《论语·乡党》，以及中国民间谚语。The Yellow Emperor's Classic of Medicine (Huangdi Neijing, Suwen), the Analects of Confucius, and Chinese folk sayings.</p>
            </div>
          </Card>
        </div>
      ) : null}
      {pillar === "activity" ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row">
            <img src={pillarActivity} alt="两位不同年龄的人一起快走的插图 Illustration of two people of different ages walking briskly together" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold">按人群看运动 Exercise by audience（美国疾病控制与预防中心 CDC 指南）:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>一般成人 General adults:</strong> 每周 150–300 分钟中等强度（如快走），或 75–150 分钟高强度；另加每周 ≥2 天肌肉强化。150–300 minutes of moderate activity a week (or 75–150 vigorous), plus muscle-strengthening on 2+ days.</li>
                <li><strong>青少年 Young people (6–17 岁）:</strong> 每天 ≥60 分钟中高强度活动。60+ minutes a day.</li>
                <li><strong>老年人 Older adults:</strong> 与成人相同，并加上平衡训练（如单脚站立、太极）。Same as adults, plus balance training.</li>
                <li><strong>女性 Women:</strong> 成人标准同样适用；经期、更年期不适时量力而行。See <SourceLink href={CDC_WOMEN_URL}>CDC women's health tips</SourceLink></li>
                <li><strong>孕妇 Pregnant women:</strong> 无并发症时每周 ≥150 分钟中等强度有氧活动，具体请先问产科医生。At least 150 minutes a week of moderate activity when there are no complications — check with your obstetrician first.</li>
                <li><strong>慢性病患者 People with chronic disease:</strong> 能做到时按成人标准；从少量开始、慢慢增加，运动中不舒服立即停下并告诉医生。Follow the adult guidelines as able; start low and go slow.</li>
              </ul>
              <p>完整指南 Full guidelines: <SourceLink href={CDC_ACTIVITY_URL}>CDC Physical Activity Guidelines</SourceLink></p>
            </div>
          </div>
        </Card>
      ) : null}
      {pillar === "activity" ? (
        <Card title="中国传统运动智慧 Chinese exercise wisdom">
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-[var(--surface-alt)] p-3">
                <p className="text-base font-bold" style={{ color: TEAL }}>饭后百步走，活到九十九</p>
                <p className="mt-0.5 text-[var(--dim)]">“Walk a hundred steps after a meal, live to ninety-nine.”</p>
              </div>
              <div className="rounded-lg bg-[var(--surface-alt)] p-3">
                <p className="text-base font-bold" style={{ color: TEAL }}>生命在于运动</p>
                <p className="mt-0.5 text-[var(--dim)]">“Life lies in movement.”</p>
              </div>
            </div>
            <p><strong>饭后散步，是值得一直保持的好习惯。</strong>吃完饭出去走走：帮助消化，活动活动筋骨，还能和邻里聊聊天、顺路去趟市场——身心都受益。不过也要诚实地说：慢慢散步强度比较轻，它是很好的日常活动，但光靠散步，还达不到指南建议的运动量。<br /><strong>The post-meal stroll is a habit worth keeping.</strong> A walk after eating aids digestion, gets you moving, and doubles as social time or a trip to the market. Just be honest about one thing: a gentle stroll is light — wonderful daily movement, but on its own it is not quite enough as exercise.</p>
            <p><strong>太极是太极——它本身就是一项很好的运动。</strong>不要把太极和饭后散步混为一谈：认真打一套太极是会出汗的，它把有氧、力量和平衡练在了一起。哈佛医学院的 Peter Wayne 博士指出：从有氧运动的角度看，太极大致相当于快走；从抗阻训练的角度看，一些研究中它的效果接近强度更大的力量训练。2018 年《美国医学会杂志·内科学》一项 670 名老年人的试验发现，与拉伸相比，太极让跌倒减少了 58%；一项哈佛附属机构汇总 12 项研究、共 2,901 人的分析还发现，太极对活动能力和平衡的改善优于常规运动。<br /><strong>Tai chi stands on its own — it is genuinely good exercise.</strong> Do not lump it in with the post-meal stroll: a proper tai chi session makes you sweat, combining aerobic work, strength and balance in one practice. Dr Peter Wayne of Harvard Medical School notes that, as an aerobic workout, tai chi is roughly the equivalent of a brisk walk, and as resistance training it matched more vigorous weight training in some studies. A 2018 JAMA Internal Medicine trial of 670 older adults found tai chi cut falls by 58% compared with stretching, and a Harvard-affiliated meta-analysis (12 studies, 2,901 people) found tai chi improved mobility and balance more than conventional exercise.</p>
            <p className="text-xs text-[var(--dim)]">来源 Sources：Harvard Health Publishing (health.harvard.edu)；JAMA Internal Medicine, 2018 — 太极预防老年人跌倒试验 Tai chi trial on fall prevention in older adults, 2018。</p>
            <p><strong>最容易被漏掉的一块：力量训练。</strong>走路和太极都很好，但大多数人几乎完全不做力量练习。中国和美国 CDC 的指南都建议每周 2 天肌肉强化活动。不用去健身房，在家就能开始：靠墙俯卧撑、坐下—站起练习、踮脚尖、用轻哑铃或弹力带练一练。从少做起，慢慢加，肌肉和骨头都会更结实，日常活动也更轻松。<br /><strong>The missing piece for most people: strength training.</strong> Walking and tai chi are wonderful, but most people do no muscle-strengthening at all. The Chinese and CDC guidelines both call for muscle strengthening on 2 days a week. No gym needed — start at home: wall push-ups, sit-to-stand practice, calf raises, light weights or a resistance band. Start small and build up; stronger muscles and bones make everyday life easier.</p>
            <p>总的来说，中国人的活动习惯底子很好——爱走路、爱太极、爱热闹。如果想让好处更完整，再加两样就够了：一是有一部分活动稍微「带点劲」，走到能说话、但不能唱歌的程度（就是本应用里用的「说话测试」），这正是中国和美国 CDC 指南说的每周 150 分钟中等强度活动；二是每周留两天练一练力量。习惯已经有了，加一点点，就更完整了。<br />In short, Chinese habits start from a real strength — walking, tai chi, staying active with others. To make them even better, add just two things: some movement with a bit more pace (fast enough to talk but not sing — the talk test in this app; that is the 150 minutes of moderate activity a week in the Chinese and CDC guidelines), and two days a week of simple strength work. The habits are already there — a little more brings the full benefit.</p>
          </div>
        </Card>
      ) : null}
      {pillar === "sleep" ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row">
            <img src={pillarSleep} alt="月亮下安睡的插图 Illustration of restful sleep under a crescent moon" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold">睡眠卫生小贴士 Sleep hygiene — 睡个好觉的日常习惯：</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>作息规律：</strong>每天同一时间睡、同一时间起，周末也尽量一样。Keep a regular schedule — the same bedtime and wake time every day, weekends too.</li>
                <li><strong>卧室环境：</strong>黑暗、安静、凉爽；床只用来睡觉。Make the bedroom dark, quiet and cool, and keep the bed for sleep.</li>
                <li><strong>睡前放下屏幕：</strong>睡前一小时不看手机、平板和电视，可以听听音乐、泡泡脚。No screens in the last hour before bed — try music or a warm foot soak instead.</li>
                <li><strong>晚间少刺激：</strong>下午晚些时候后不喝咖啡和浓茶，睡前不喝酒——酒并不能帮助睡得香。Limit caffeine (coffee, strong tea) later in the day, and avoid alcohol before bed — it does not help you sleep well.</li>
                <li><strong>白天动起来：</strong>白天多活动，睡眠会更深；但睡前两三小时别做剧烈运动。Be active during the day for deeper sleep, but avoid vigorous exercise in the last few hours before bed.</li>
                <li><strong>早上见光：</strong>起床后尽快到户外走走、晒晒太阳，帮身体定好生物钟。Get morning light — a walk outside soon after waking helps set your body clock.</li>
              </ul>
              <p>了解更多 Learn more: <SourceLink href={CDC_SLEEP_URL}>CDC — About Sleep</SourceLink></p>
            </div>
          </div>
        </Card>
      ) : null}
      {pillar === "stress" ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row">
            <img src={pillarStress} alt="一位女士在户外缓缓打太极、神情安详的插图 Illustration of a woman calmly practising tai chi outdoors" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="space-y-2 text-sm">
              <p>压力大时先照顾身体：规律睡眠、每天活动、好好吃饭。慢呼吸、短暂散步、和信任的人聊聊都有帮助。如果情绪低落、焦虑持续两周以上，或影响日常生活，请告诉您的医生或心理咨询师——这和看身体的病一样正常。<br />Start with the body: regular sleep, daily activity, proper meals. Slow breathing, a short walk, and talking to someone you trust all help. If low mood or anxiety lasts more than two weeks or affects daily life, tell your doctor or counselor — that is as normal as seeing a doctor for a physical problem.</p>
              <p className="font-semibold">可以试试的放松练习 Relaxation practices to try:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>太极 Tai chi:</strong> 动作慢、稳、安全，各个年龄都能练；公园里常有晨练团体，跟着一起练就行，对平衡和心情都有好处。Slow, steady and safe at any age — many parks have morning groups you can simply join; good for balance and mood.</li>
                <li><strong>八段锦 Baduanjin:</strong> 一套八个动作，约 12 分钟，不用器械、在家就能练，适合每天做。跟练视频：<SourceLink href={BADUANJIN_VIDEO_URL}>国家体育总局版八段锦跟练（哔哩哔哩）</SourceLink>；动作讲解：<SourceLink href={BADUANJIN_URL}>健身气功·八段锦（国家体育总局健身气功管理中心）</SourceLink>。A set of eight gentle movements, about 12 minutes, no equipment, easy to do at home every day.</li>
                <li><strong>瑜伽 Yoga:</strong> 从温和的开始——椅子瑜伽、阴瑜伽或睡前拉伸就很好，不要勉强做高难度动作，跟着社区或老年大学的课程更安全。Start gently — chair yoga, yin yoga or bedtime stretching; a community or seniors' university class is a safe way to learn.</li>
                <li><strong>正念冥想 Mindfulness:</strong> 每天 5–10 分钟，跟着中文引导音频慢慢呼吸、放松身体。中文应用：<SourceLink href={TIDE_URL}>潮汐 Tide — 中文正念冥想与呼吸练习</SourceLink>。Five to ten minutes a day with a Chinese guided audio: slow breathing, body relaxation.</li>
              </ul>
            </div>
          </div>
        </Card>
      ) : null}
      {pillar === "social" ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row">
            <img src={pillarSocial} alt="三位朋友坐在长椅上聊天的插图 Illustration of three friends talking on a bench" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="space-y-2 text-sm">
              <p>和家人、朋友保持联系对健康和坚持改变都有帮助：一起吃饭、一起散步、参加社区活动，或加入病友小组。孤单时主动打个电话，不必等别人先联系。<br />Staying connected helps both health and sticking with change: eat together, walk together, join community activities or a patient group. When you feel lonely, make the call first.</p>
              <p><SourceLink href={CDC_WELLBEING_URL}>CDC — Improve Your Emotional Well-Being</SourceLink></p>
            </div>
          </div>
        </Card>
      ) : null}
      {pillar === "substances" ? (
        <Card title="远离有害物质 Avoiding risky substances">
          <div className="flex flex-col gap-3 sm:flex-row">
            <img src={pillarSubstances} alt="一位男士端着一杯茶、向香烟和酒杯摆手说不的插图 Illustration of a man holding a cup of tea and waving no to a cigarette and a wine glass" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="space-y-2 text-sm">
              <p>不吸烟（包括电子烟），已经吸烟的尽早戒——戒烟任何时候都不晚，可以向您的医生要戒烟帮助。少喝酒或不喝酒；不要滥用药物。家里有人吸烟时，商量出无烟区，保护孩子和老人。<br />Do not smoke (including e-cigarettes); if you smoke, quitting at any age helps — ask your doctor for quit support. Drink little or no alcohol, and do not misuse medicines or drugs. If someone at home smokes, agree on smoke-free areas to protect children and older family members.</p>
              <p className="text-[var(--dim)]">需要帮助时，请先联系您的院后健康团队或当地戒烟门诊。For help, start with your Houyuan Health team or a local smoking-cessation clinic.</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

/* ================= App shell ================= */
const TABS = [
  { hash: "today", zh: "今日", en: "Today" },
  { hash: "dashboard", zh: "运营看板", en: "Dashboard" },
  { hash: "patients", zh: "患者列表", en: "Patients" },
  { hash: "record", zh: "患者档案", en: "Record" },
  { hash: "exercise", zh: "运动与认知", en: "Exercise & Brain" },
  { hash: "meds", zh: "用药与化验", en: "Medications & Labs" },
  { hash: "entry", zh: "团队录入", en: "Staff entry" },
  { hash: "app", zh: "患者端", en: "Patient app" },
  { hash: "public", zh: "成果公示", en: "Public outcomes" },
  { hash: "data", zh: "数据结构", en: "Data model" },
  { hash: "safety", zh: "安全与合规", en: "Safety & Compliance" },
  { hash: "progress", zh: "工作进展", en: "Work Progress" },
  { hash: "helper", zh: "智能助手", en: "Helper" },
  { hash: "resources", zh: "资源", en: "Resources" },
] as const;
type TabHash = (typeof TABS)[number]["hash"];

function tabFromHash(): TabHash {
  const h = window.location.hash.replace("#", "");
  return (TABS.some((t) => t.hash === h) ? h : "today") as TabHash;
}

export function App() {
  const [tab, setTab] = useState<TabHash>(() => tabFromHash());
  const [recordId, setRecordId] = useState("P001");
  const membersQ = useQuery({ queryKey: ["teamMembers"], queryFn: async () => await api.listTeamMembers({}) });
  const members = (membersQ.data?.members ?? []) as TeamMemberRow[];
  const [viewerPersonId, setViewerPersonId] = useState<number | null>(null);
  useEffect(() => {
    if (viewerPersonId === null && members.length > 0) {
      const doc = members.find((m) => m.roleKey === "doctor");
      setViewerPersonId((doc ?? members[0])?.id ?? null);
    }
  }, [members, viewerPersonId]);
  const viewerPerson = members.find((m) => m.id === viewerPersonId);
  const viewerRole: ViewerRole = (viewerPerson && VIEWER_ROLES.some((v) => v.key === viewerPerson.roleKey) ? viewerPerson.roleKey : "doctor") as ViewerRole;
  const viewerPersonLabel = viewerPerson ? personLabel(viewerPerson) : viewerLabel(viewerRole);
  const [showWelcome, setShowWelcome] = useState(true);
  const state = useQuery({ queryKey: ["state"], queryFn: () => api.getState({}) });
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (h: TabHash) => { window.location.hash = h; setTab(h); window.scrollTo({ top: 0 }); };
  const goRecord = (id: string) => { setRecordId(id); go("record"); };
  const patients = state.data?.patients ?? [];
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="pt-safe text-white" style={{ background: DEEP }}>
        <div className="mx-auto max-w-6xl px-4 pb-4 pt-5">
          <h1 className="text-xl font-bold sm:text-2xl">院后健康 · 慢病管理数据平台<span className="font-normal opacity-80"> Houyuan Health · Chronic-disease data platform</span></h1>
          <p className="mt-2 text-sm"><span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold sm:text-sm">网站名称: houyuanhealth.com — Website address: houyuanhealth.com</span> <span className="text-xs opacity-85">尚未注册 · Not registered yet</span></p>
          <div className="mt-3">
            <p className="text-xs font-semibold opacity-90">生活方式医学六大支柱 The six pillars of lifestyle medicine</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-3">
              {PILLARS.map((p) => (
                <figure key={p.key} className="text-center sm:w-[5.5rem]">
                  <img src={p.img} alt={p.alt} className="mx-auto h-12 w-12 rounded-xl object-cover" />
                  <figcaption className="mt-1 text-[11px] font-semibold leading-tight">{p.zh}<br /><span className="font-normal opacity-80">{p.en}</span></figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-white/10 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="viewer-role" className="font-semibold">查看身份 Viewing as</label>
              <select id="viewer-role" aria-label="Viewer role" className="rounded-lg px-2 py-1.5 text-sm text-[#1b2321]" value={viewerPersonId ?? ""} onChange={(e) => setViewerPersonId(Number(e.target.value))}>
                {members.length === 0 ? <option value="">加载中 Loading…</option> : null}
                {[...members].sort((a, b) => (a.name === "" ? 1 : 0) - (b.name === "" ? 1 : 0)).map((m) => (<option key={m.id} value={m.id}>{personLabel(m)}</option>))}
              </select>
              <span className="text-xs opacity-90">您正在以 {viewerPersonLabel} 身份查看 · You are viewing as {viewerPersonLabel} — {VIEWER_ROLES.find((v) => v.key === viewerRole)?.sees}</span>
            </div>
          </div>
        </div>
      </header>
      <nav aria-label="Main tabs" className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[92rem] gap-1 overflow-x-auto px-2 py-2">
          {TABS.map((t) => (
            <a key={t.hash} href={`#${t.hash}`} onClick={(e) => { e.preventDefault(); go(t.hash); }}
              aria-current={tab === t.hash ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === t.hash ? "text-white" : ""}`}
              style={tab === t.hash ? { background: TEAL } : { color: TEAL }}>
              {t.zh} <span className="hidden font-normal opacity-75 sm:inline">{t.en}</span>
            </a>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-4 pb-10">
        {showWelcome ? (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold" style={{ color: TEAL }}>欢迎使用 Welcome</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  <li>前三个标签是日常照护：「今日」24 小时清单、「运动与认知」、「用药与化验」，都能填、能存。The first three tabs are daily care — Today, Exercise &amp; Brain, Medications &amp; Labs — all fillable and saved.</li>
                  <li>看板上方有「我的今天」：先看自己的任务；医生的任务分「看诊 / 管理」两张清单。My day sits at the top of the Dashboard — your own tasks first, with a physician's patient-care and administration lists kept separate.</li>
                  <li>「团队录入 → 价格」可以给客户选套餐和单项服务、看合计，并保存客户的选择。Staff entry → Pricing: choose a package and services for a client, see the total, and save the choice.</li>
                  <li>「资源」页按六大支柱整理了患者教育内容；「工作进展」是整个项目的共享进度。Resources holds patient education by the six pillars; Work Progress tracks the whole project.</li>
                  <li>顶部按人名切换查看身份；「患者列表 → 团队成员」里每个人分一个角色、负责一位患者，在患者档案里勾选团队角色就会带来那个角色的任务。Switch the viewer by person at the top; under Patients → Team members each person holds one role for one patient, and ticking a patient's team roles brings that role's tasks.</li>
                </ul>
              </div>
              <button type="button" aria-label="Dismiss welcome" className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-sm" onClick={() => setShowWelcome(false)}>关闭 ✕</button>
            </div>
          </div>
        ) : null}
        {state.isPending ? <p className="py-10 text-center text-sm text-[var(--dim)]">加载中… Loading…</p> : null}
        {state.error ? <p className="py-10 text-center text-sm" style={{ color: RED }}>加载失败 Failed to load: {state.error instanceof Error ? state.error.message : String(state.error)}</p> : null}
        {state.data ? (
          <>
            {tab === "today" ? <TodayTab /> : null}
            {tab === "dashboard" ? <Dashboard patients={patients} goRecord={goRecord} viewerRole={viewerRole} viewerName={viewerPersonLabel} goProgress={() => go("progress")} /> : null}
            {tab === "patients" ? <Patients patients={patients} goRecord={goRecord} viewerRole={viewerRole} /> : null}
            {tab === "record" ? <Record patients={patients} selectedId={recordId} setSelectedId={setRecordId} viewerRole={viewerRole} /> : null}
            {tab === "exercise" ? <ExerciseBrainTab /> : null}
            {tab === "meds" ? <MedsLabsTab viewerLabel={viewerPersonLabel} viewerRole={viewerRole} people={members.filter((m) => m.name !== "").map((m) => personLabel(m))} /> : null}
            {tab === "entry" ? <StaffEntry patients={patients} goRecord={goRecord} entries={state.data.entries} /> : null}
            {tab === "app" ? <PatientApp patients={patients} /> : null}
            {tab === "public" ? <PublicOutcomes patients={patients} /> : null}
            {tab === "data" ? <DataModel patients={patients} entryCount={state.data.entryCount} /> : null}
            {tab === "safety" ? <SafetyCompliance viewerRole={viewerRole} /> : null}
            {tab === "progress" ? <WorkProgress /> : null}
            {tab === "helper" ? <Helper /> : null}
            {tab === "resources" ? <Resources /> : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
