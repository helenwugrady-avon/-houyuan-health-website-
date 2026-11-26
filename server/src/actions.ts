import { defineAction, z, type ActionsModule } from "@hatch/space-sdk";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import * as schema from "./schema";
import type { Ctx } from "@hatch/space-sdk";

const measuresShape = z.object({
  weightKg: z.number(),
  bodyFatPct: z.number(),
  visceralFat: z.number(),
  skeletalMuscleKg: z.number(),
  waistCm: z.number(),
  bmrKcal: z.number(),
  overallScore: z.number(),
  autonomicBalance: z.number(),
  hba1cPct: z.number(),
  fastingGlucose: z.number(),
  ldl: z.number(),
  triglycerides: z.number(),
  systolic: z.number(),
  diastolic: z.number(),
  gripKg: z.number(),
  walk6m: z.number(),
  fmsTotal: z.number(),
  phq9: z.number(),
  gad7: z.number(),
  psqi: z.number(),
});

const patientShape = z.object({
  id: z.string(),
  sex: z.string(),
  age: z.number(),
  source: z.string(),
  stage: z.string(),
  followUp: z.string(),
  goal: z.string(),
  status: z.string(),
  checkinDays: z.number(),
  measures: measuresShape,
});

type Measures = z.infer<typeof measuresShape>;
type PatientSeed = z.infer<typeof patientShape>;

const P001_MEASURES: Measures = {
  weightKg: 74.2, bodyFatPct: 34.7, visceralFat: 9, skeletalMuscleKg: 24.3,
  waistCm: 88, bmrKcal: 1372, overallScore: 72, autonomicBalance: 69,
  hba1cPct: 5.5, fastingGlucose: 5.8, ldl: 3.8, triglycerides: 2.5,
  systolic: 140, diastolic: 79, gripKg: 28, walk6m: 542, fmsTotal: 15,
  phq9: 7, gad7: 5, psqi: 6,
};

/* Each patient carries their OWN full measure set. An earlier seed reused
   P001's body-composition / fitness / mood values for everyone (only weight,
   HbA1c and BP varied), so every other patient's record, staff-entry form and
   patient app showed P001's numbers. Values below are sample data, distinct
   per patient and consistent with that patient's weight, HbA1c and BP. */
function m(base: Measures, weightKg: number, hba1cPct: number, systolic: number, diastolic: number): Measures {
  return { ...base, weightKg, hba1cPct, systolic, diastolic };
}

const SAMPLE_PATIENTS: PatientSeed[] = [
  { id: "P001", sex: "女", age: 42, source: "医生转诊", stage: "第24周", followUp: "2026-11-20", goal: "维持", status: "绿", checkinDays: 6, measures: P001_MEASURES },
  { id: "P002", sex: "女", age: 38, source: "小程序", stage: "第24周", followUp: "2026-11-18", goal: "维持", status: "黄", checkinDays: 5, measures: m({ weightKg: 0, bodyFatPct: 32.1, visceralFat: 7, skeletalMuscleKg: 23.1, waistCm: 82, bmrKcal: 1320, overallScore: 70, autonomicBalance: 66, hba1cPct: 0, fastingGlucose: 6.0, ldl: 3.5, triglycerides: 2.1, systolic: 0, diastolic: 0, gripKg: 26, walk6m: 530, fmsTotal: 14, phq9: 6, gad7: 4, psqi: 6 }, 68.4, 5.9, 138, 82) },
  { id: "P003", sex: "女", age: 51, source: "医生转诊", stage: "第12周", followUp: "2026-11-17", goal: "减重", status: "黄", checkinDays: 3, measures: m({ weightKg: 0, bodyFatPct: 38.2, visceralFat: 11, skeletalMuscleKg: 25.0, waistCm: 94, bmrKcal: 1410, overallScore: 64, autonomicBalance: 61, hba1cPct: 0, fastingGlucose: 6.3, ldl: 4.0, triglycerides: 2.9, systolic: 0, diastolic: 0, gripKg: 24, walk6m: 498, fmsTotal: 13, phq9: 8, gad7: 6, psqi: 8 }, 81.5, 6.1, 145, 88) },
  { id: "P004", sex: "男", age: 45, source: "小程序", stage: "第24周", followUp: "2026-11-19", goal: "维持", status: "绿", checkinDays: 6, measures: m({ weightKg: 0, bodyFatPct: 27.4, visceralFat: 10, skeletalMuscleKg: 30.2, waistCm: 92, bmrKcal: 1650, overallScore: 74, autonomicBalance: 70, hba1cPct: 0, fastingGlucose: 5.9, ldl: 3.6, triglycerides: 2.2, systolic: 0, diastolic: 0, gripKg: 36, walk6m: 560, fmsTotal: 16, phq9: 5, gad7: 3, psqi: 5 }, 82.1, 5.7, 135, 80) },
  { id: "P005", sex: "男", age: 47, source: "医生转诊", stage: "第12周", followUp: "2026-11-15", goal: "减重", status: "红", checkinDays: 2, measures: m({ weightKg: 0, bodyFatPct: 30.8, visceralFat: 13, skeletalMuscleKg: 31.5, waistCm: 101, bmrKcal: 1720, overallScore: 61, autonomicBalance: 58, hba1cPct: 0, fastingGlucose: 6.9, ldl: 4.3, triglycerides: 3.4, systolic: 0, diastolic: 0, gripKg: 34, walk6m: 487, fmsTotal: 12, phq9: 10, gad7: 7, psqi: 8 }, 89.3, 6.4, 152, 92) },
  { id: "P006", sex: "男", age: 52, source: "社区筛查", stage: "第12周", followUp: "2026-11-16", goal: "减重", status: "黄", checkinDays: 4, measures: m({ weightKg: 0, bodyFatPct: 31.5, visceralFat: 14, skeletalMuscleKg: 32.0, waistCm: 104, bmrKcal: 1745, overallScore: 62, autonomicBalance: 60, hba1cPct: 0, fastingGlucose: 6.6, ldl: 4.2, triglycerides: 3.1, systolic: 0, diastolic: 0, gripKg: 33, walk6m: 476, fmsTotal: 12, phq9: 8, gad7: 6, psqi: 7 }, 92.7, 6.2, 148, 90) },
  { id: "P007", sex: "女", age: 35, source: "小程序", stage: "第24周", followUp: "2026-11-21", goal: "维持", status: "绿", checkinDays: 7, measures: m({ weightKg: 0, bodyFatPct: 29.6, visceralFat: 6, skeletalMuscleKg: 22.4, waistCm: 78, bmrKcal: 1290, overallScore: 78, autonomicBalance: 74, hba1cPct: 0, fastingGlucose: 5.5, ldl: 3.1, triglycerides: 1.6, systolic: 0, diastolic: 0, gripKg: 27, walk6m: 575, fmsTotal: 17, phq9: 4, gad7: 3, psqi: 5 }, 63.8, 5.4, 128, 78) },
  { id: "P008", sex: "男", age: 58, source: "社区筛查", stage: "第24周", followUp: "2026-11-20", goal: "维持", status: "绿", checkinDays: 6, measures: m({ weightKg: 0, bodyFatPct: 28.9, visceralFat: 12, skeletalMuscleKg: 29.8, waistCm: 97, bmrKcal: 1620, overallScore: 68, autonomicBalance: 64, hba1cPct: 0, fastingGlucose: 6.0, ldl: 3.9, triglycerides: 2.6, systolic: 0, diastolic: 0, gripKg: 32, walk6m: 512, fmsTotal: 14, phq9: 6, gad7: 4, psqi: 7 }, 85.6, 5.8, 139, 84) },
  { id: "P009", sex: "女", age: 44, source: "医生转诊", stage: "第12周", followUp: "2026-11-18", goal: "减重", status: "黄", checkinDays: 5, measures: m({ weightKg: 0, bodyFatPct: 35.8, visceralFat: 10, skeletalMuscleKg: 24.8, waistCm: 90, bmrKcal: 1395, overallScore: 66, autonomicBalance: 63, hba1cPct: 0, fastingGlucose: 6.2, ldl: 3.9, triglycerides: 2.7, systolic: 0, diastolic: 0, gripKg: 25, walk6m: 505, fmsTotal: 13, phq9: 7, gad7: 5, psqi: 7 }, 76.9, 6.0, 142, 86) },
  { id: "P010", sex: "男", age: 49, source: "小程序", stage: "第24周", followUp: "2026-11-19", goal: "维持", status: "黄", checkinDays: 4, measures: m({ weightKg: 0, bodyFatPct: 29.7, visceralFat: 13, skeletalMuscleKg: 31.0, waistCm: 100, bmrKcal: 1705, overallScore: 63, autonomicBalance: 59, hba1cPct: 0, fastingGlucose: 6.7, ldl: 4.4, triglycerides: 3.3, systolic: 0, diastolic: 0, gripKg: 35, walk6m: 490, fmsTotal: 13, phq9: 9, gad7: 6, psqi: 8 }, 88.2, 6.3, 150, 91) },
  { id: "P011", sex: "女", age: 40, source: "小程序", stage: "第24周", followUp: "2026-11-21", goal: "维持", status: "绿", checkinDays: 6, measures: m({ weightKg: 0, bodyFatPct: 31.2, visceralFat: 7, skeletalMuscleKg: 23.6, waistCm: 81, bmrKcal: 1335, overallScore: 73, autonomicBalance: 69, hba1cPct: 0, fastingGlucose: 5.7, ldl: 3.4, triglycerides: 1.9, systolic: 0, diastolic: 0, gripKg: 27, walk6m: 548, fmsTotal: 16, phq9: 5, gad7: 4, psqi: 9 }, 66.5, 5.6, 131, 79) },
  { id: "P012", sex: "男", age: 55, source: "医生转诊", stage: "第12周", followUp: "2026-11-14", goal: "减重", status: "红", checkinDays: 1, measures: m({ weightKg: 0, bodyFatPct: 32.6, visceralFat: 15, skeletalMuscleKg: 32.4, waistCm: 107, bmrKcal: 1760, overallScore: 58, autonomicBalance: 55, hba1cPct: 0, fastingGlucose: 7.4, ldl: 4.6, triglycerides: 3.8, systolic: 0, diastolic: 0, gripKg: 31, walk6m: 462, fmsTotal: 11, phq9: 9, gad7: 8, psqi: 9 }, 94.8, 6.8, 158, 96) },
  { id: "P013", sex: "女", age: 37, source: "小程序", stage: "第24周", followUp: "2026-11-20", goal: "维持", status: "绿", checkinDays: 7, measures: m({ weightKg: 0, bodyFatPct: 30.1, visceralFat: 6, skeletalMuscleKg: 22.9, waistCm: 79, bmrKcal: 1305, overallScore: 76, autonomicBalance: 72, hba1cPct: 0, fastingGlucose: 5.6, ldl: 3.2, triglycerides: 1.7, systolic: 0, diastolic: 0, gripKg: 26, walk6m: 566, fmsTotal: 17, phq9: 4, gad7: 3, psqi: 5 }, 64.2, 5.5, 129, 77) },
  { id: "P014", sex: "男", age: 61, source: "社区筛查", stage: "第12周", followUp: "2026-11-17", goal: "减重", status: "黄", checkinDays: 3, measures: m({ weightKg: 0, bodyFatPct: 30.2, visceralFat: 14, skeletalMuscleKg: 30.6, waistCm: 102, bmrKcal: 1680, overallScore: 60, autonomicBalance: 57, hba1cPct: 0, fastingGlucose: 7.0, ldl: 4.5, triglycerides: 3.5, systolic: 0, diastolic: 0, gripKg: 30, walk6m: 455, fmsTotal: 11, phq9: 10, gad7: 7, psqi: 8 }, 90.4, 6.5, 151, 93) },
];

async function ensureSeeded(ctx: Ctx) {
  const db = ctx.db<typeof schema>();
  const existing = await db.select({ id: schema.patients.id }).from(schema.patients).limit(1);
  if (existing.length === 0) {
    for (const p of SAMPLE_PATIENTS) {
      await db.insert(schema.patients).values({
        id: p.id, sex: p.sex, age: p.age, source: p.source, stage: p.stage,
        followUp: p.followUp, goal: p.goal, status: p.status,
        checkinDays: p.checkinDays, measuresJson: JSON.stringify(p.measures),
      });
    }
    return;
  }
  /* Repair for installs seeded with the old shared-measures data: while no
     staff entry has ever been saved, no user-entered data exists yet, so it is
     safe to refresh the sample rows to the corrected per-patient measures.
     Once a staff entry exists, rows are left exactly as they are. */
  const entries = await db.select({ id: schema.staffEntries.id }).from(schema.staffEntries).limit(1);
  if (entries.length === 0) {
    for (const p of SAMPLE_PATIENTS) {
      await db.update(schema.patients)
        .set({
          sex: p.sex, age: p.age, source: p.source, stage: p.stage,
          followUp: p.followUp, goal: p.goal, status: p.status,
          checkinDays: p.checkinDays, measuresJson: JSON.stringify(p.measures),
        })
        .where(eq(schema.patients.id, p.id));
    }
  }
}

async function loadPatients(ctx: Ctx): Promise<PatientSeed[]> {
  const db = ctx.db<typeof schema>();
  const rows = await db.select().from(schema.patients).orderBy(asc(schema.patients.id));
  return rows.map((r) => ({
    id: r.id, sex: r.sex, age: r.age, source: r.source, stage: r.stage,
    followUp: r.followUp, goal: r.goal, status: r.status, checkinDays: r.checkinDays,
    measures: JSON.parse(r.measuresJson) as Measures,
  }));
}

/* ================= Roadmap tracker (Work Progress tab) =================
   Canonical plan from Helen's Houyuan Health Engagement Roadmap image —
   same data and behaviour as the standalone tracker artifact. */
type RoadmapOwner = "ours" | "container" | "joint";

interface RoadmapTaskDef {
  id: string;
  workstreamIndex: number;
  phaseIndex: number;
  titleEn: string;
  owner: RoadmapOwner;
}

const ROADMAP_PHASES = [
  { index: 0, weekStart: 1, weekEnd: 6, labelCn: "第0期 · 摸底·设计·原型", labelEn: "Phase 0" },
  { index: 1, weekStart: 7, weekEnd: 10, labelCn: "第7–10周 · 培训与启动", labelEn: "Train & launch" },
  { index: 2, weekStart: 11, weekEnd: 22, labelCn: "第11–22周 · 试点", labelEn: "Pilot (12 wks)" },
  { index: 3, weekStart: 23, weekEnd: 26, labelCn: "第23–26周 · 评估与推广", labelEn: "Evaluate & scale" },
] as const;

const ROADMAP_WORKSTREAMS = [
  { cn: "行政与商务", en: "Governance & commercial" },
  { cn: "经营与财务", en: "Business operations" },
  { cn: "生活方式医学服务", en: "Clinical program" },
  { cn: "人员与培训", en: "Workforce & training" },
  { cn: "大数据平台", en: "Big data platform" },
  { cn: "合规与数据安全", en: "Compliance & data security" },
] as const;

const ROADMAP_TASKS: RoadmapTaskDef[] = [
  { id: "g1", workstreamIndex: 0, phaseIndex: 0, titleEn: "Sign Phase 0 agreement: scope, fee, IP, confidentiality", owner: "joint" },
  { id: "g2", workstreamIndex: 0, phaseIndex: 0, titleEn: "Confirm signer, decision-maker and budget", owner: "container" },
  { id: "g3", workstreamIndex: 0, phaseIndex: 1, titleEn: "Gate: plan signed off, final 50% paid, path chosen", owner: "joint" },
  { id: "g4", workstreamIndex: 0, phaseIndex: 2, titleEn: "Monthly steering call with written decisions", owner: "joint" },
  { id: "g5", workstreamIndex: 0, phaseIndex: 3, titleEn: "Decide on scale-up and next-phase contract", owner: "joint" },
  { id: "b1", workstreamIndex: 1, phaseIndex: 0, titleEn: "Submit financials, client ledger, prices, staff, sites, hospital agreement", owner: "container" },
  { id: "b2", workstreamIndex: 1, phaseIndex: 0, titleEn: "Diagnostic report and business plan", owner: "ours" },
  { id: "b3", workstreamIndex: 1, phaseIndex: 1, titleEn: "Launch program packages and pricing", owner: "container" },
  { id: "b4", workstreamIndex: 1, phaseIndex: 2, titleEn: "Referrals: growth-clinic parents, hospital, returning clients", owner: "container" },
  { id: "b5", workstreamIndex: 1, phaseIndex: 2, titleEn: "Monthly conversion and revenue review", owner: "ours" },
  { id: "b6", workstreamIndex: 1, phaseIndex: 3, titleEn: "Revised pricing and scale-up plan", owner: "ours" },
  { id: "c1", workstreamIndex: 2, phaseIndex: 0, titleEn: "Program design, risk tiers, 10 SOPs, patient materials", owner: "ours" },
  { id: "c2", workstreamIndex: 2, phaseIndex: 0, titleEn: "Medical director signs referral thresholds", owner: "container" },
  { id: "c3", workstreamIndex: 2, phaseIndex: 1, titleEn: "Finalize SOPs, health plan and consent forms", owner: "joint" },
  { id: "c4", workstreamIndex: 2, phaseIndex: 2, titleEn: "Enroll 20–30 patients and deliver the program", owner: "container" },
  { id: "c5", workstreamIndex: 2, phaseIndex: 2, titleEn: "Track monthly retention; act on dropouts", owner: "joint" },
  { id: "c6", workstreamIndex: 2, phaseIndex: 3, titleEn: "Pilot outcomes report (week-12 re-test)", owner: "ours" },
  { id: "w1", workstreamIndex: 3, phaseIndex: 0, titleEn: "Name trainees, health managers and a coordinator", owner: "container" },
  { id: "w2", workstreamIndex: 3, phaseIndex: 0, titleEn: "Adapt 8-module curriculum and Chinese role-plays", owner: "ours" },
  { id: "w3", workstreamIndex: 3, phaseIndex: 1, titleEn: "Training two half-days a week; skills check", owner: "ours" },
  { id: "w4", workstreamIndex: 3, phaseIndex: 1, titleEn: "Staff attend and practice on site", owner: "container" },
  { id: "w5", workstreamIndex: 3, phaseIndex: 2, titleEn: "Monthly case coaching and feedback on recordings", owner: "ours" },
  { id: "w6", workstreamIndex: 3, phaseIndex: 2, titleEn: "Record sessions with patient consent", owner: "container" },
  { id: "w7", workstreamIndex: 3, phaseIndex: 3, titleEn: "Plan the next cohort and internal trainers", owner: "joint" },
  { id: "d1", workstreamIndex: 4, phaseIndex: 0, titleEn: "Send one sample report per device; old IT contract and code", owner: "container" },
  { id: "d2", workstreamIndex: 4, phaseIndex: 0, titleEn: "Data dictionary and sample-data prototype", owner: "ours" },
  { id: "d3", workstreamIndex: 4, phaseIndex: 1, titleEn: "Build in China: database, WeChat mini-program, security", owner: "ours" },
  { id: "d4", workstreamIndex: 4, phaseIndex: 1, titleEn: "Load real reports; check extracted values", owner: "container" },
  { id: "d5", workstreamIndex: 4, phaseIndex: 2, titleEn: "Enter data on schedule", owner: "container" },
  { id: "d6", workstreamIndex: 4, phaseIndex: 2, titleEn: "Monthly dashboard review", owner: "joint" },
  { id: "d7", workstreamIndex: 4, phaseIndex: 3, titleEn: "Platform v2 from pilot feedback", owner: "ours" },
  { id: "k1", workstreamIndex: 5, phaseIndex: 0, titleEn: "Provide licenses and marketing materials", owner: "container" },
  { id: "k2", workstreamIndex: 5, phaseIndex: 0, titleEn: "Agree data rules: real data stays in China", owner: "joint" },
  { id: "k3", workstreamIndex: 5, phaseIndex: 1, titleEn: "Review claims; draft PIPL consent and de-identification", owner: "ours" },
  { id: "k4", workstreamIndex: 5, phaseIndex: 2, titleEn: "Patient consent; share de-identified summaries only", owner: "container" },
  { id: "k5", workstreamIndex: 5, phaseIndex: 3, titleEn: "Ethics approval and consent if publishing", owner: "joint" },
];

function parseRoadmapDate(s: string): Date | null {
  const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!mm) return null;
  const y = Number(mm[1]); const mo = Number(mm[2]); const d = Number(mm[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}
function fmtRoadmapDate(dt: Date): string {
  const y = dt.getFullYear(); const mo = String(dt.getMonth() + 1).padStart(2, "0"); const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}
function addRoadmapDays(dt: Date, days: number): Date { const n = new Date(dt); n.setDate(n.getDate() + days); return n; }

function computeRoadmapCurrent(startStr: string | null) {
  if (!startStr) return { currentWeek: null as number | null, currentPhaseIndex: null as number | null, status: "not_started" as const };
  const start = parseRoadmapDate(startStr);
  if (!start) return { currentWeek: null, currentPhaseIndex: null, status: "not_started" as const };
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0) return { currentWeek: null, currentPhaseIndex: null, status: "before_start" as const };
  const week = Math.floor(diffDays / 7) + 1;
  if (week > 26) return { currentWeek: week, currentPhaseIndex: null, status: "finished" as const };
  const phase = ROADMAP_PHASES.find((p) => week >= p.weekStart && week <= p.weekEnd);
  return { currentWeek: week, currentPhaseIndex: phase ? phase.index : null, status: "active" as const };
}

const roadmapTaskOut = z.object({
  id: z.string(), workstreamIndex: z.number(), phaseIndex: z.number(),
  workstreamCn: z.string(), workstreamEn: z.string(), titleEn: z.string(),
  owner: z.enum(["ours", "container", "joint"]),
  weekStart: z.number(), weekEnd: z.number(),
  dateStart: z.string().nullable(), dateEnd: z.string().nullable(),
  isDone: z.boolean(), notes: z.string(),
});
type RoadmapTaskOut = z.infer<typeof roadmapTaskOut>;

const roadmapStateResponse = z.object({
  startDate: z.string().nullable(),
  currentWeek: z.number().nullable(),
  currentPhaseIndex: z.number().nullable(),
  status: z.enum(["not_started", "before_start", "active", "finished"]),
  total: z.number(), done: z.number(),
  perPhase: z.array(z.object({ phaseIndex: z.number(), total: z.number(), done: z.number() })),
  tasks: z.array(roadmapTaskOut),
});
type RoadmapState = z.infer<typeof roadmapStateResponse>;

async function loadRoadmapState(ctx: Ctx): Promise<RoadmapState> {
  const db = ctx.db<typeof schema>();
  const settingRows = await db.select().from(schema.roadmapSettings);
  const startDate: string | null = settingRows[0]?.week1StartDate ?? null;
  const progressRows = await db.select().from(schema.roadmapTaskProgress);
  const map = new Map<string, { isDone: boolean; notes: string }>();
  for (const r of progressRows) map.set(r.taskId, { isDone: r.isDone === 1, notes: r.notes ?? "" });
  const tasks: RoadmapTaskOut[] = ROADMAP_TASKS.map((t) => {
    const phase = ROADMAP_PHASES[t.phaseIndex]!;
    const ws = ROADMAP_WORKSTREAMS[t.workstreamIndex]!;
    const st = map.get(t.id);
    let dateStart: string | null = null; let dateEnd: string | null = null;
    if (startDate) {
      const s = parseRoadmapDate(startDate);
      if (s) { dateStart = fmtRoadmapDate(addRoadmapDays(s, (phase.weekStart - 1) * 7)); dateEnd = fmtRoadmapDate(addRoadmapDays(s, phase.weekEnd * 7 - 1)); }
    }
    return {
      id: t.id, workstreamIndex: t.workstreamIndex, phaseIndex: t.phaseIndex,
      workstreamCn: ws.cn, workstreamEn: ws.en,
      titleEn: t.titleEn, owner: t.owner,
      weekStart: phase.weekStart, weekEnd: phase.weekEnd,
      dateStart, dateEnd,
      isDone: st?.isDone ?? false, notes: st?.notes ?? "",
    };
  });
  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  const perPhase = ROADMAP_PHASES.map((p) => {
    const pt = tasks.filter((t) => t.phaseIndex === p.index);
    return { phaseIndex: p.index, total: pt.length, done: pt.filter((t) => t.isDone).length };
  });
  const cur = computeRoadmapCurrent(startDate);
  return { startDate, tasks, total, done, perPhase, currentWeek: cur.currentWeek, currentPhaseIndex: cur.currentPhaseIndex, status: cur.status };
}

/* ================= Lifestyle medicine screener (Resources tab) =================
   Fillable form adapted from the ACLM / Loma Linda Short Assessment Form
   (2024 update), adapted for patients in China per Helen's decisions:
   no diet-screener food-frequency questions (food is logged by meal photo
   in Log my day); substance use asks only nicotine, alcohol and any other
   illicit drugs (no separate marijuana question), each gated by one
   Yes/No past-year question with follow-ups only when Yes. Frequency
   answers are 0–3 (Not at all / Several days / More than half the days /
   Nearly every day); null = not answered yet. */
const freqAnswer = z.number().int().min(0).max(3).nullable();
const substanceAnswerShape = z.object({
  used: z.boolean().nullable(),
  amountPerWeek: z.string().max(200),
  concern: z.number().int().min(1).max(10).nullable(),
});
const screenerAnswersShape = z.object({
  readinessImportance: z.number().int().min(0).max(10).nullable(),
  readinessConfidence: z.number().int().min(0).max(10).nullable(),
  motivationTop: z.array(z.enum(["nutrition", "activity", "sleep", "stress", "social", "substances"])).max(3),
  activityDays: z.number().int().min(0).max(7).nullable(),
  activityMinutes: z.number().int().min(0).max(1440).nullable(),
  activityStrengthDays: z.number().int().min(0).max(7).nullable(),
  sleepBand: z.enum(["lt4", "b45", "b56", "b67", "b78", "b89", "b9p"]).nullable(),
  sleepTired: freqAnswer,
  phqInterest: freqAnswer,
  phqDown: freqAnswer,
  meaningPurpose: freqAnswer,
  meaningConnected: freqAnswer,
  nicotine: substanceAnswerShape.extend({
    replacement: z.boolean().nullable(),
    quitInterest: z.boolean().nullable(),
  }),
  alcohol: substanceAnswerShape,
  otherDrugs: substanceAnswerShape,
});
type ScreenerAnswers = z.infer<typeof screenerAnswersShape>;

const entrySummary = z.object({
  id: z.number(),
  patientId: z.string(),
  week: z.string(),
  role: z.string(),
  entryDate: z.string(),
});

const stateResponse = z.object({
  patients: z.array(patientShape),
  entryCount: z.number(),
  entries: z.array(entrySummary),
});

/* ---- Shared upload handling for Medications & Labs attachments ----
   One attachment per entry, three kinds: a JPG/PNG photo (of the paper
   document or of a PDF on screen), the PDF file itself, or an Excel file
   (.xls/.xlsx). The blob key lives in the row's photo_key column; file_name
   and file_kind say what it is. The family uploads; the nurse or doctor
   reads it and types the values in; the file stays as the source. */
type UploadArg = { dataBase64: string; mimeType: string; fileName: string };

function uploadKindOf(mimeType: string): "photo" | "pdf" | "excel" | null {
  if (mimeType === "image/jpeg" || mimeType === "image/png") return "photo";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.ms-excel" || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "excel";
  return null;
}

async function storeUpload(ctx: Ctx, folder: string, upload: UploadArg): Promise<{ key: string; kind: "photo" | "pdf" | "excel" }> {
  const kind = uploadKindOf(upload.mimeType);
  if (!kind) throw new Error("Please upload a JPG/PNG photo, a PDF file, or an Excel file (.xls/.xlsx).");
  const binary = atob(upload.dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const key = `${folder}/${Date.now()}`;
  await ctx.blobs.put(key, bytes, { contentType: upload.mimeType });
  return { key, kind };
}

const uploadShape = z.object({
  dataBase64: z.string().max(14_000_000),
  mimeType: z.string().max(120),
  fileName: z.string().max(200),
});

export const Actions = {
  getState: defineAction({
    description: "Returns all patients with their latest measures, seeding the spec sample data on first load.",
    request: z.object({}),
    response: stateResponse,
    async handler(ctx): Promise<z.infer<typeof stateResponse>> {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const patients = await loadPatients(ctx);
      const rows = await db
        .select({
          id: schema.staffEntries.id,
          patientId: schema.staffEntries.patientId,
          week: schema.staffEntries.week,
          role: schema.staffEntries.role,
          entryDate: schema.staffEntries.entryDate,
        })
        .from(schema.staffEntries)
        .orderBy(asc(schema.staffEntries.id));
      return { patients, entryCount: rows.length, entries: rows.slice(-20).reverse() };
    },
  }),

  registerPatient: defineAction({
    description: "Registers a new patient (chain step 1: registration + consent → patient file in Patient Management). The front desk records sex, age, referral source, goal and the first follow-up date, and must confirm consent was obtained first. The patient starts at Baseline stage, amber (awaiting the first assessment), check-ins 0, and with NO measurements — every measure stays zero until the first assessment is entered through Staff entry (saveEntry), which writes the real values and the real colour.",
    request: z.object({
      sex: z.enum(["女", "男"]),
      age: z.number().int().min(0).max(120),
      source: z.enum(["医生转诊", "小程序", "社区筛查"]),
      goal: z.enum(["维持", "减重", "增肌"]),
      followUp: z.string().min(10).max(10),
      consentConfirmed: z.boolean(),
    }),
    response: z.object({ ok: z.literal(true), patientId: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; patientId: string }> {
      if (!args.consentConfirmed) throw new Error("Consent must be obtained and confirmed before registering a patient.");
      if (!parseRoadmapDate(args.followUp)) throw new Error("Please pick a valid first follow-up date.");
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const rows = await db.select({ id: schema.patients.id }).from(schema.patients);
      let maxN = 0;
      for (const r of rows) { const n = Number(r.id.replace(/\D/g, "")); if (Number.isFinite(n) && n > maxN) maxN = n; }
      const patientId = `P${String(maxN + 1).padStart(3, "0")}`;
      const zeroMeasures: Measures = {
        weightKg: 0, bodyFatPct: 0, visceralFat: 0, skeletalMuscleKg: 0,
        waistCm: 0, bmrKcal: 0, overallScore: 0, autonomicBalance: 0,
        hba1cPct: 0, fastingGlucose: 0, ldl: 0, triglycerides: 0,
        systolic: 0, diastolic: 0, gripKg: 0, walk6m: 0, fmsTotal: 0,
        phq9: 0, gad7: 0, psqi: 0,
      };
      await db.insert(schema.patients).values({
        id: patientId, sex: args.sex, age: args.age, source: args.source, stage: "基线",
        followUp: args.followUp, goal: args.goal, status: "黄", checkinDays: 0,
        measuresJson: JSON.stringify(zeroMeasures),
      });
      ctx.invalidateQueries();
      return { ok: true as const, patientId };
    },
  }),

  saveEntry: defineAction({
    description: "Saves a staff entry for a patient and updates that patient's measures, status and goal.",
    request: z.object({
      patientId: z.string().min(1).max(10),
      week: z.string().min(1).max(40),
      role: z.string().min(1).max(40),
      entryDate: z.string().min(1).max(20),
      labDate: z.string().max(20),
      heightCm: z.number().min(0).max(300),
      assessment: z.string().min(1).max(40),
      goal: z.string().min(1).max(40),
      weeklyGoal: z.string().max(500),
      teamNote: z.string().max(2000),
      measures: measuresShape,
    }),
    response: z.object({ ok: z.literal(true), status: z.string(), patientId: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; status: string; patientId: string }> {
      await ensureSeeded(ctx);
      const db = ctx.db<typeof schema>();
      const status =
        args.assessment === "达标" ? "绿" :
        args.assessment === "部分达标" ? "黄" : "红";
      await db.insert(schema.staffEntries).values({
        patientId: args.patientId, week: args.week, role: args.role,
        entryDate: args.entryDate,
        payloadJson: JSON.stringify(args),
      });
      await db.update(schema.patients)
        .set({
          measuresJson: JSON.stringify(args.measures),
          status, goal: args.goal, followUp: args.entryDate,
        })
        .where(eq(schema.patients.id, args.patientId));
      ctx.invalidateQueries();
      return { ok: true as const, status, patientId: args.patientId };
    },
  }),

  resetData: defineAction({
    description: "Deletes all staff entries and restores the 14 sample patients from the spec.",
    request: z.object({}),
    response: stateResponse,
    async handler(ctx): Promise<z.infer<typeof stateResponse>> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.staffEntries);
      await db.delete(schema.patients);
      for (const p of SAMPLE_PATIENTS) {
        await db.insert(schema.patients).values({
          id: p.id, sex: p.sex, age: p.age, source: p.source, stage: p.stage,
          followUp: p.followUp, goal: p.goal, status: p.status,
          checkinDays: p.checkinDays, measuresJson: JSON.stringify(p.measures),
        });
      }
      ctx.invalidateQueries();
      return { patients: SAMPLE_PATIENTS, entryCount: 0, entries: [] };
    },
  }),

  getRoadmapState: defineAction({
    description: "Returns the project roadmap (Work Progress tab) start date, current week and phase, overall progress, and every task with its done status and notes. Use this to check project progress.",
    request: z.object({}),
    response: roadmapStateResponse,
    async handler(ctx): Promise<RoadmapState> {
      return await loadRoadmapState(ctx);
    },
  }),

  getThisWeekTasks: defineAction({
    description: "Returns roadmap tasks due this week and overdue unchecked tasks, based on the saved Week 1 start date and today's date. Use this for reminder checks.",
    request: z.object({}),
    response: z.object({
      startDate: z.string().nullable(),
      currentWeek: z.number().nullable(),
      currentPhaseIndex: z.number().nullable(),
      status: z.enum(["not_started", "before_start", "active", "finished"]),
      dueThisWeek: z.array(roadmapTaskOut),
      overdue: z.array(roadmapTaskOut),
      uncheckedCount: z.number(),
    }),
    async handler(ctx) {
      const s = await loadRoadmapState(ctx);
      if (!s.startDate || s.currentWeek == null) {
        return { startDate: s.startDate, currentWeek: s.currentWeek, currentPhaseIndex: s.currentPhaseIndex, status: s.status, dueThisWeek: [] as RoadmapTaskOut[], overdue: [] as RoadmapTaskOut[], uncheckedCount: s.tasks.filter((t) => !t.isDone).length };
      }
      const cw = s.currentWeek;
      const dueThisWeek = s.tasks.filter((t) => cw >= t.weekStart && cw <= t.weekEnd);
      const overdue = s.tasks.filter((t) => !t.isDone && t.weekEnd < cw);
      return { startDate: s.startDate, currentWeek: s.currentWeek, currentPhaseIndex: s.currentPhaseIndex, status: s.status, dueThisWeek, overdue, uncheckedCount: s.tasks.filter((t) => !t.isDone).length };
    },
  }),

  setStartDate: defineAction({
    description: "Saves or clears the roadmap Week 1 start date (YYYY-MM-DD). All phase and task dates are computed from this date.",
    request: z.object({ date: z.string().max(10).nullable() }),
    response: z.object({ ok: z.boolean(), startDate: z.string().nullable() }),
    async handler(ctx, args) {
      const db = ctx.db<typeof schema>();
      let val: string | null = null;
      if (args.date && args.date.trim() !== "") {
        const trimmed = args.date.trim();
        if (!parseRoadmapDate(trimmed)) throw new Error("Please pick a valid date.");
        val = trimmed;
      }
      const existing = await db.select().from(schema.roadmapSettings);
      if (existing.length === 0) {
        await db.insert(schema.roadmapSettings).values({ id: 1, week1StartDate: val });
      } else {
        await db.update(schema.roadmapSettings).set({ week1StartDate: val }).where(eq(schema.roadmapSettings.id, 1));
      }
      ctx.invalidateQueries();
      return { ok: true, startDate: val };
    },
  }),

  updateTask: defineAction({
    description: "Updates one roadmap task: mark it done or not done, and/or save a short note for it.",
    request: z.object({
      taskId: z.string().min(1).max(10),
      isDone: z.boolean().optional(),
      notes: z.string().max(500).optional(),
    }),
    response: z.object({ ok: z.boolean() }),
    async handler(ctx, args) {
      if (!ROADMAP_TASKS.some((t) => t.id === args.taskId)) throw new Error("Unknown task.");
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.roadmapTaskProgress).where(eq(schema.roadmapTaskProgress.taskId, args.taskId));
      const cur = existing[0];
      const isDoneVal = args.isDone !== undefined ? (args.isDone ? 1 : 0) : (cur?.isDone ?? 0);
      const notesVal = args.notes !== undefined ? args.notes : (cur?.notes ?? "");
      if (!cur) {
        await db.insert(schema.roadmapTaskProgress).values({ taskId: args.taskId, isDone: isDoneVal, notes: notesVal, updatedAt: new Date() });
      } else {
        await db.update(schema.roadmapTaskProgress).set({ isDone: isDoneVal, notes: notesVal, updatedAt: new Date() }).where(eq(schema.roadmapTaskProgress.taskId, args.taskId));
      }
      ctx.invalidateQueries();
      return { ok: true };
    },
  }),

  listProblemReports: defineAction({
    description: "Lists problem reports submitted on the Helper tab, newest first (demo feature).",
    request: z.object({}),
    response: z.object({
      reports: z.array(z.object({ id: z.number(), text: z.string(), createdAt: z.string() })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.helperProblemReports).orderBy(desc(schema.helperProblemReports.id)).limit(50);
      return { reports: rows.map((r) => ({ id: r.id, text: r.text, createdAt: r.createdAt.toISOString() })) };
    },
  }),

  reportProblem: defineAction({
    description: "Saves a problem report from the Helper tab so the team can see it in the reported-problems list (demo feature).",
    request: z.object({ text: z.string().trim().min(1).max(1000) }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.helperProblemReports).values({ text: args.text }).returning({ id: schema.helperProblemReports.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  listTeamNotes: defineAction({
    description: "Lists team notes left by one role for another role on the My day panel, newest first (demo feature).",
    request: z.object({}),
    response: z.object({
      notes: z.array(z.object({ id: z.number(), fromRole: z.string(), toRole: z.string(), patientId: z.string(), text: z.string(), createdAt: z.string() })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.teamNotes).orderBy(desc(schema.teamNotes.id)).limit(50);
      return { notes: rows.map((r) => ({ id: r.id, fromRole: r.fromRole, toRole: r.toRole, patientId: r.patientId, text: r.text, createdAt: r.createdAt.toISOString() })) };
    },
  }),

  addTeamNote: defineAction({
    description: "Saves a note from one team role to another role on the My day panel (demo communication feature).",
    request: z.object({
      fromRole: z.string().trim().min(1).max(60),
      toRole: z.string().trim().min(1).max(60),
      patientId: z.string().max(10).default(""),
      text: z.string().trim().min(1).max(1000),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.teamNotes).values({ fromRole: args.fromRole, toRole: args.toRole, patientId: args.patientId ?? "", text: args.text }).returning({ id: schema.teamNotes.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  listMyDayTasks: defineAction({
    description: "Lists extra My day tasks added through the demo add-a-task box, newest first.",
    request: z.object({}),
    response: z.object({
      tasks: z.array(z.object({ id: z.number(), roleKey: z.string(), text: z.string(), patientId: z.string(), createdAt: z.string() })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.myDayTasks).orderBy(desc(schema.myDayTasks.id)).limit(100);
      return { tasks: rows.map((r) => ({ id: r.id, roleKey: r.roleKey, text: r.text, patientId: r.patientId, createdAt: r.createdAt.toISOString() })) };
    },
  }),

  listDailyLogs: defineAction({
    description: "Lists the personal daily logs (food with optional meal photo, activity split by intensity, the two always-asked activity questions, sleep and its source, mood, the day's journal note, weight) saved from the Patient app's Log my day section, oldest first.",
    request: z.object({}),
    response: z.object({
      logs: z.array(z.object({
        logDate: z.string(), meals: z.string(), mealPhotoUrl: z.string().nullable(), activity: z.string(),
        activityMinutes: z.number(),
        highMinutes: z.number(), moderateMinutes: z.number(), lowMinutes: z.number(), sedentaryMinutes: z.number(),
        sleepHours: z.number(), sleepSource: z.string(),
        mood: z.number(), energy: z.number(), note: z.string(),
        pavsDays: z.number().nullable(), pavsMinutes: z.number().nullable(),
        weightKg: z.number().nullable(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.dailyLogs).orderBy(asc(schema.dailyLogs.logDate)).limit(400);
      const logs = [];
      for (const r of rows) {
        logs.push({
          logDate: r.logDate, meals: r.meals,
          mealPhotoUrl: r.mealPhotoKey ? await ctx.blobs.getUrl(r.mealPhotoKey) : null,
          activity: r.activity,
          activityMinutes: r.activityMinutes,
          highMinutes: r.highMinutes, moderateMinutes: r.moderateMinutes,
          lowMinutes: r.lowMinutes, sedentaryMinutes: r.sedentaryMinutes,
          sleepHours: r.sleepHours, sleepSource: r.sleepSource,
          mood: r.mood, energy: r.energy, note: r.note,
          pavsDays: r.pavsDays, pavsMinutes: r.pavsMinutes,
          weightKg: r.weightKg,
        });
      }
      return { logs };
    },
  }),

  saveDailyLog: defineAction({
    description: "Saves (or replaces) one day's personal log from the Patient app's Log my day section: meals with an optional meal photo, activity split into high/moderate/low/sedentary minutes, the two always-asked Physical Activity Vital Sign answers (days per week, minutes per day — asked every day even with a wearable linked), sleep hours and whether they came from a wearable or were typed in, mood, energy, an optional free-text journal note for the day, and optional weight. One entry per date.",
    request: z.object({
      logDate: z.string().min(10).max(10),
      meals: z.string().max(2000).default(""),
      mealPhoto: z.object({ dataBase64: z.string().max(14_000_000), mimeType: z.string().max(60) }).nullable().default(null),
      removeMealPhoto: z.boolean().default(false),
      activity: z.string().max(500).default(""),
      highMinutes: z.number().int().min(0).max(1440).default(0),
      moderateMinutes: z.number().int().min(0).max(1440).default(0),
      lowMinutes: z.number().int().min(0).max(1440).default(0),
      sedentaryMinutes: z.number().int().min(0).max(1440).default(0),
      pavsDays: z.number().int().min(0).max(7).nullable().default(null),
      pavsMinutes: z.number().int().min(0).max(1440).nullable().default(null),
      sleepHours: z.number().min(0).max(24).default(0),
      sleepSource: z.enum(["manual", "wearable"]).default("manual"),
      mood: z.number().int().min(1).max(5).default(3),
      energy: z.number().int().min(1).max(5).default(3),
      note: z.string().max(2000).default(""),
      weightKg: z.number().min(20).max(400).nullable().default(null),
    }),
    response: z.object({ ok: z.literal(true), logDate: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; logDate: string }> {
      if (!parseRoadmapDate(args.logDate)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const existingRows = await db.select().from(schema.dailyLogs).where(eq(schema.dailyLogs.logDate, args.logDate));
      const existing = existingRows[0];
      let mealPhotoKey: string | null = existing?.mealPhotoKey ?? null;
      if (args.removeMealPhoto) {
        if (mealPhotoKey) { await ctx.blobs.delete(mealPhotoKey); }
        mealPhotoKey = null;
      }
      if (args.mealPhoto) {
        if (args.mealPhoto.mimeType !== "image/jpeg" && args.mealPhoto.mimeType !== "image/png") {
          throw new Error("Meal photo must be a JPEG or PNG image.");
        }
        const binary = atob(args.mealPhoto.dataBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const key = `meal-photos/${args.logDate}-${Date.now()}`;
        await ctx.blobs.put(key, bytes, { contentType: args.mealPhoto.mimeType });
        if (mealPhotoKey && mealPhotoKey !== key) { await ctx.blobs.delete(mealPhotoKey); }
        mealPhotoKey = key;
      }
      const vals = {
        meals: args.meals, mealPhotoKey, activity: args.activity,
        activityMinutes: args.highMinutes + args.moderateMinutes + args.lowMinutes,
        highMinutes: args.highMinutes, moderateMinutes: args.moderateMinutes,
        lowMinutes: args.lowMinutes, sedentaryMinutes: args.sedentaryMinutes,
        pavsDays: args.pavsDays, pavsMinutes: args.pavsMinutes,
        sleepHours: args.sleepHours, sleepSource: args.sleepSource,
        mood: args.mood, energy: args.energy, note: args.note, weightKg: args.weightKg,
      };
      if (!existing) {
        await db.insert(schema.dailyLogs).values({ logDate: args.logDate, ...vals });
      } else {
        await db.update(schema.dailyLogs).set({ ...vals, updatedAt: new Date() }).where(eq(schema.dailyLogs.logDate, args.logDate));
      }
      ctx.invalidateQueries();
      return { ok: true as const, logDate: args.logDate };
    },
  }),

  listWeeklyReflections: defineAction({
    description: "Lists the saved weekly reflections from the Log my day journal (one per week, keyed by the week's Monday date), oldest first. Together with the daily journal notes these form the patient's journal book.",
    request: z.object({}),
    response: z.object({
      reflections: z.array(z.object({ weekStart: z.string(), text: z.string(), updatedAt: z.string() })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.weeklyReflections).orderBy(asc(schema.weeklyReflections.weekStart)).limit(400);
      return { reflections: rows.map((r) => ({ weekStart: r.weekStart, text: r.text, updatedAt: r.updatedAt.toISOString() })) };
    },
  }),

  saveWeeklyReflection: defineAction({
    description: "Saves (or replaces) the weekly reflection for one week in the Log my day journal, keyed by the week's Monday date (YYYY-MM-DD). The reflection answers the neutral weekly probe about what felt easier, what felt harder, and what to remember or try next week.",
    request: z.object({
      weekStart: z.string().min(10).max(10),
      text: z.string().max(4000).default(""),
    }),
    response: z.object({ ok: z.literal(true), weekStart: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; weekStart: string }> {
      if (!parseRoadmapDate(args.weekStart)) throw new Error("Please pick a valid week.");
      const db = ctx.db<typeof schema>();
      const existingRows = await db.select().from(schema.weeklyReflections).where(eq(schema.weeklyReflections.weekStart, args.weekStart));
      if (existingRows.length === 0) {
        await db.insert(schema.weeklyReflections).values({ weekStart: args.weekStart, text: args.text });
      } else {
        await db.update(schema.weeklyReflections).set({ text: args.text, updatedAt: new Date() }).where(eq(schema.weeklyReflections.weekStart, args.weekStart));
      }
      ctx.invalidateQueries();
      return { ok: true as const, weekStart: args.weekStart };
    },
  }),

  getWearableLink: defineAction({
    description: "Returns which wearable device the patient has linked in the Log my day section (empty string = none linked). The prototype only records the choice; real syncing comes with the real site.",
    request: z.object({}),
    response: z.object({ device: z.string() }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.wearableSettings);
      return { device: rows[0]?.device ?? "" };
    },
  }),

  setWearableLink: defineAction({
    description: "Saves which wearable device the patient uses in the Log my day section (empty string unlinks it). Records the choice only — no real device syncing in the prototype.",
    request: z.object({ device: z.string().max(60) }),
    response: z.object({ ok: z.literal(true), device: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; device: string }> {
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.wearableSettings);
      if (existing.length === 0) {
        await db.insert(schema.wearableSettings).values({ id: 1, device: args.device });
      } else {
        await db.update(schema.wearableSettings).set({ device: args.device, updatedAt: new Date() }).where(eq(schema.wearableSettings.id, 1));
      }
      ctx.invalidateQueries();
      return { ok: true as const, device: args.device };
    },
  }),

  getScreenerState: defineAction({
    description: "Returns the most recently saved lifestyle medicine screener answers (Resources tab form) so the form can pre-fill, plus how many times it has been filled in.",
    request: z.object({}),
    response: z.object({
      latest: screenerAnswersShape.nullable(),
      latestAt: z.string().nullable(),
      count: z.number(),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.screenerResponses).orderBy(desc(schema.screenerResponses.id)).limit(1);
      const all = await db.select({ id: schema.screenerResponses.id }).from(schema.screenerResponses);
      const row = rows[0];
      if (!row) return { latest: null, latestAt: null, count: 0 };
      let latest: ScreenerAnswers | null = null;
      try { latest = screenerAnswersShape.parse(JSON.parse(row.payloadJson)); } catch { latest = null; }
      return { latest, latestAt: row.createdAt.toISOString(), count: all.length };
    },
  }),

  saveScreener: defineAction({
    description: "Saves one filled-in lifestyle medicine screener from the Resources tab (adapted ACLM / Loma Linda short form, China-adapted). Each save is kept as a new dated response; the newest one pre-fills the form next time.",
    request: screenerAnswersShape,
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.screenerResponses).values({ payloadJson: JSON.stringify(args) }).returning({ id: schema.screenerResponses.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  addMyDayTask: defineAction({
    description: "Adds a task to a role's My day list through the demo add-a-task box, so the team can fill in real tasks later.",
    request: z.object({
      roleKey: z.string().trim().min(1).max(40),
      text: z.string().trim().min(1).max(500),
      patientId: z.string().max(10).default(""),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.myDayTasks).values({ roleKey: args.roleKey, text: args.text, patientId: args.patientId ?? "" }).returning({ id: schema.myDayTasks.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  /* ================= Senior-care module (sitemap rebuild) =================
     The forms Helen sent, as screens: the 24-hour checklist becomes the
     Today tab; the exercise and cognitive sheets become Exercise & Brain;
     the medication list and lab schedule become Medications & Labs; the
     team sheets (standing monitoring, nutrition calculation, weekly
     tracking & follow-up, Week-4 checkpoint) become Staff Entry team forms.
     Structure only — no patient's values are seeded anywhere here. */

  getCareDay: defineAction({
    description: "Returns one day's 24-hour care checklist ticks and the day header (aide name, family name, day note) for the Today tab.",
    request: z.object({ date: z.string().min(10).max(10) }),
    response: z.object({
      ticks: z.array(z.object({ itemKey: z.string(), done: z.boolean() })),
      dayNote: z.object({ aideName: z.string(), familyName: z.string(), note: z.string() }).nullable(),
    }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.date)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const tickRows = await db.select().from(schema.careTicks).where(eq(schema.careTicks.careDate, args.date));
      const noteRows = await db.select().from(schema.careDayNotes).where(eq(schema.careDayNotes.careDate, args.date));
      const n = noteRows[0];
      return {
        ticks: tickRows.map((r) => ({ itemKey: r.itemKey, done: r.done === 1 })),
        dayNote: n ? { aideName: n.aideName, familyName: n.familyName, note: n.note } : null,
      };
    },
  }),

  getCareWeekTicks: defineAction({
    description: "Returns all 24-hour checklist ticks between two dates (inclusive), so the Exercise & Brain tab can compute this week's execution rates from the real daily ticks.",
    request: z.object({ from: z.string().min(10).max(10), to: z.string().min(10).max(10) }),
    response: z.object({
      ticks: z.array(z.object({ careDate: z.string(), itemKey: z.string(), done: z.boolean() })),
    }),
    async handler(ctx, args) {
      if (!parseRoadmapDate(args.from) || !parseRoadmapDate(args.to)) throw new Error("Please pick valid dates.");
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.careTicks)
        .where(and(gte(schema.careTicks.careDate, args.from), lte(schema.careTicks.careDate, args.to)))
        .orderBy(asc(schema.careTicks.careDate));
      return { ticks: rows.map((r) => ({ careDate: r.careDate, itemKey: r.itemKey, done: r.done === 1 })) };
    },
  }),

  setCareTick: defineAction({
    description: "Ticks or unticks one item on one day's 24-hour care checklist (Today tab). One tap per item, saved straight away.",
    request: z.object({
      date: z.string().min(10).max(10),
      itemKey: z.string().trim().min(1).max(60),
      done: z.boolean(),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      if (!parseRoadmapDate(args.date)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.careTicks)
        .where(eq(schema.careTicks.careDate, args.date));
      const cur = existing.find((r) => r.itemKey === args.itemKey);
      if (!cur) {
        await db.insert(schema.careTicks).values({ careDate: args.date, itemKey: args.itemKey, done: args.done ? 1 : 0 });
      } else {
        await db.update(schema.careTicks).set({ done: args.done ? 1 : 0, updatedAt: new Date() })
          .where(eq(schema.careTicks.id, cur.id));
      }
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  saveCareDayNote: defineAction({
    description: "Saves the Today checklist day header for one date: who is on duty (aide name, family name) and the end-of-day note.",
    request: z.object({
      date: z.string().min(10).max(10),
      aideName: z.string().max(60).default(""),
      familyName: z.string().max(60).default(""),
      note: z.string().max(2000).default(""),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      if (!parseRoadmapDate(args.date)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.careDayNotes).where(eq(schema.careDayNotes.careDate, args.date));
      const vals = { aideName: args.aideName, familyName: args.familyName, note: args.note };
      if (existing.length === 0) {
        await db.insert(schema.careDayNotes).values({ careDate: args.date, ...vals });
      } else {
        await db.update(schema.careDayNotes).set({ ...vals, updatedAt: new Date() }).where(eq(schema.careDayNotes.careDate, args.date));
      }
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  saveExerciseRecord: defineAction({
    description: "Saves one day's exercise record from the Exercise & Brain tab: pre-training BP/pulse/SpO2 and fever flag (the safety pre-check), per-action done/actual counts for the seated A and B groups, standing done, whether a stop signal appeared, total minutes and any discomfort note. One record per date.",
    request: z.object({
      recordDate: z.string().min(10).max(10),
      preSystolic: z.number().int().min(0).max(300).nullable().default(null),
      preDiastolic: z.number().int().min(0).max(200).nullable().default(null),
      prePulse: z.number().int().min(0).max(250).nullable().default(null),
      spo2: z.number().min(0).max(100).nullable().default(null),
      fever: z.boolean().default(false),
      groupA: z.boolean().default(false),
      groupB: z.boolean().default(false),
      standingDone: z.boolean().default(false),
      stopSignal: z.boolean().default(false),
      totalMinutes: z.number().int().min(0).max(1440).default(0),
      actions: z.record(z.string().max(60), z.object({ done: z.boolean(), actual: z.string().max(60) })).default({}),
      discomfort: z.string().max(2000).default(""),
    }),
    response: z.object({ ok: z.literal(true), recordDate: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; recordDate: string }> {
      if (!parseRoadmapDate(args.recordDate)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const vals = {
        preSystolic: args.preSystolic, preDiastolic: args.preDiastolic, prePulse: args.prePulse,
        spo2: args.spo2, fever: args.fever ? 1 : 0,
        groupA: args.groupA ? 1 : 0, groupB: args.groupB ? 1 : 0,
        standingDone: args.standingDone ? 1 : 0, stopSignal: args.stopSignal ? 1 : 0,
        totalMinutes: args.totalMinutes, actionsJson: JSON.stringify(args.actions),
        discomfort: args.discomfort,
      };
      const existing = await db.select().from(schema.exerciseRecords).where(eq(schema.exerciseRecords.recordDate, args.recordDate));
      if (existing.length === 0) {
        await db.insert(schema.exerciseRecords).values({ recordDate: args.recordDate, ...vals });
      } else {
        await db.update(schema.exerciseRecords).set({ ...vals, updatedAt: new Date() }).where(eq(schema.exerciseRecords.recordDate, args.recordDate));
      }
      ctx.invalidateQueries();
      return { ok: true as const, recordDate: args.recordDate };
    },
  }),

  listExerciseRecords: defineAction({
    description: "Lists saved daily exercise records (Exercise & Brain tab), newest date first.",
    request: z.object({}),
    response: z.object({
      records: z.array(z.object({
        recordDate: z.string(),
        preSystolic: z.number().nullable(), preDiastolic: z.number().nullable(),
        prePulse: z.number().nullable(), spo2: z.number().nullable(),
        fever: z.boolean(), groupA: z.boolean(), groupB: z.boolean(),
        standingDone: z.boolean(), stopSignal: z.boolean(),
        totalMinutes: z.number(),
        actions: z.record(z.string(), z.object({ done: z.boolean(), actual: z.string() })),
        discomfort: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.exerciseRecords).orderBy(desc(schema.exerciseRecords.recordDate)).limit(120);
      return {
        records: rows.map((r) => {
          let actions: Record<string, { done: boolean; actual: string }> = {};
          try { actions = JSON.parse(r.actionsJson) as typeof actions; } catch { actions = {}; }
          return {
            recordDate: r.recordDate,
            preSystolic: r.preSystolic, preDiastolic: r.preDiastolic,
            prePulse: r.prePulse, spo2: r.spo2,
            fever: r.fever === 1, groupA: r.groupA === 1, groupB: r.groupB === 1,
            standingDone: r.standingDone === 1, stopSignal: r.stopSignal === 1,
            totalMinutes: r.totalMinutes, actions, discomfort: r.discomfort,
          };
        }),
      };
    },
  }),

  saveCognitiveRecord: defineAction({
    description: "Saves one day's cognitive training record from the Exercise & Brain tab: morning and afternoon sessions (category, done, minutes), whether the two sessions were different, the person's mood/cooperation, and a short response note. One record per date.",
    request: z.object({
      recordDate: z.string().min(10).max(10),
      morningCategory: z.string().max(60).default(""),
      morningDone: z.boolean().default(false),
      morningMinutes: z.number().int().min(0).max(600).default(0),
      afternoonCategory: z.string().max(60).default(""),
      afternoonDone: z.boolean().default(false),
      afternoonMinutes: z.number().int().min(0).max(600).default(0),
      differentOk: z.boolean().default(false),
      mood: z.string().max(20).default(""),
      response: z.string().max(2000).default(""),
    }),
    response: z.object({ ok: z.literal(true), recordDate: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; recordDate: string }> {
      if (!parseRoadmapDate(args.recordDate)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const vals = {
        morningCategory: args.morningCategory, morningDone: args.morningDone ? 1 : 0, morningMinutes: args.morningMinutes,
        afternoonCategory: args.afternoonCategory, afternoonDone: args.afternoonDone ? 1 : 0, afternoonMinutes: args.afternoonMinutes,
        differentOk: args.differentOk ? 1 : 0, mood: args.mood, response: args.response,
      };
      const existing = await db.select().from(schema.cognitiveRecords).where(eq(schema.cognitiveRecords.recordDate, args.recordDate));
      if (existing.length === 0) {
        await db.insert(schema.cognitiveRecords).values({ recordDate: args.recordDate, ...vals });
      } else {
        await db.update(schema.cognitiveRecords).set({ ...vals, updatedAt: new Date() }).where(eq(schema.cognitiveRecords.recordDate, args.recordDate));
      }
      ctx.invalidateQueries();
      return { ok: true as const, recordDate: args.recordDate };
    },
  }),

  listCognitiveRecords: defineAction({
    description: "Lists saved daily cognitive training records (Exercise & Brain tab), newest date first.",
    request: z.object({}),
    response: z.object({
      records: z.array(z.object({
        recordDate: z.string(),
        morningCategory: z.string(), morningDone: z.boolean(), morningMinutes: z.number(),
        afternoonCategory: z.string(), afternoonDone: z.boolean(), afternoonMinutes: z.number(),
        differentOk: z.boolean(), mood: z.string(), response: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.cognitiveRecords).orderBy(desc(schema.cognitiveRecords.recordDate)).limit(120);
      return {
        records: rows.map((r) => ({
          recordDate: r.recordDate,
          morningCategory: r.morningCategory, morningDone: r.morningDone === 1, morningMinutes: r.morningMinutes,
          afternoonCategory: r.afternoonCategory, afternoonDone: r.afternoonDone === 1, afternoonMinutes: r.afternoonMinutes,
          differentOk: r.differentOk === 1, mood: r.mood, response: r.response,
        })),
      };
    },
  }),

  saveSeniorCheckin: defineAction({
    description: "Saves (merging with anything already saved for that date) one day's senior-care health check-in. The Today tab's evening check-in and the Patient app's daily check-in write to the same record: fields a form does not send keep their saved values, so the aide/family evening form and the patient's own mood/appetite/sleep/discomfort report never wipe each other out. One record per date.",
    request: z.object({
      checkDate: z.string().min(10).max(10),
      systolic: z.number().int().min(0).max(300).nullable().optional(),
      diastolic: z.number().int().min(0).max(200).nullable().optional(),
      pulse: z.number().int().min(0).max(250).nullable().optional(),
      appetite: z.string().max(20).optional(),
      mealsPct: z.number().min(0).max(10).nullable().optional(),
      sleepHours: z.number().min(0).max(24).nullable().optional(),
      nightWakings: z.number().int().min(0).max(30).nullable().optional(),
      sleepQuality: z.number().int().min(1).max(5).nullable().optional(),
      mood: z.string().max(20).optional(),
      discomfort: z.string().max(2000).optional(),
      bowels: z.string().max(200).optional(),
      skinChecked: z.boolean().optional(),
      skinNote: z.string().max(500).optional(),
      trainingA: z.boolean().optional(),
      trainingB: z.boolean().optional(),
      incident: z.string().max(2000).optional(),
      weightKg: z.number().min(20).max(400).nullable().optional(),
      filledBy: z.string().max(40).optional(),
    }),
    response: z.object({ ok: z.literal(true), checkDate: z.string() }),
    async handler(ctx, args): Promise<{ ok: true; checkDate: string }> {
      if (!parseRoadmapDate(args.checkDate)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const existingRows = await db.select().from(schema.seniorCheckins).where(eq(schema.seniorCheckins.checkDate, args.checkDate));
      const cur = existingRows[0];
      const merged = {
        systolic: args.systolic !== undefined ? args.systolic : (cur?.systolic ?? null),
        diastolic: args.diastolic !== undefined ? args.diastolic : (cur?.diastolic ?? null),
        pulse: args.pulse !== undefined ? args.pulse : (cur?.pulse ?? null),
        appetite: args.appetite !== undefined ? args.appetite : (cur?.appetite ?? ""),
        mealsPct: args.mealsPct !== undefined ? args.mealsPct : (cur?.mealsPct ?? null),
        sleepHours: args.sleepHours !== undefined ? args.sleepHours : (cur?.sleepHours ?? null),
        nightWakings: args.nightWakings !== undefined ? args.nightWakings : (cur?.nightWakings ?? null),
        sleepQuality: args.sleepQuality !== undefined ? args.sleepQuality : (cur?.sleepQuality ?? null),
        mood: args.mood !== undefined ? args.mood : (cur?.mood ?? ""),
        discomfort: args.discomfort !== undefined ? args.discomfort : (cur?.discomfort ?? ""),
        bowels: args.bowels !== undefined ? args.bowels : (cur?.bowels ?? ""),
        skinChecked: args.skinChecked !== undefined ? (args.skinChecked ? 1 : 0) : (cur?.skinChecked ?? 0),
        skinNote: args.skinNote !== undefined ? args.skinNote : (cur?.skinNote ?? ""),
        trainingA: args.trainingA !== undefined ? (args.trainingA ? 1 : 0) : (cur?.trainingA ?? 0),
        trainingB: args.trainingB !== undefined ? (args.trainingB ? 1 : 0) : (cur?.trainingB ?? 0),
        incident: args.incident !== undefined ? args.incident : (cur?.incident ?? ""),
        weightKg: args.weightKg !== undefined ? args.weightKg : (cur?.weightKg ?? null),
        filledBy: args.filledBy !== undefined ? args.filledBy : (cur?.filledBy ?? ""),
      };
      if (!cur) {
        await db.insert(schema.seniorCheckins).values({ checkDate: args.checkDate, ...merged });
      } else {
        await db.update(schema.seniorCheckins).set({ ...merged, updatedAt: new Date() }).where(eq(schema.seniorCheckins.checkDate, args.checkDate));
      }
      ctx.invalidateQueries();
      return { ok: true as const, checkDate: args.checkDate };
    },
  }),

  listSeniorCheckins: defineAction({
    description: "Lists saved senior-care daily health check-ins (Today evening check-in and Patient app daily check-in share these records), newest date first.",
    request: z.object({}),
    response: z.object({
      checkins: z.array(z.object({
        checkDate: z.string(),
        systolic: z.number().nullable(), diastolic: z.number().nullable(), pulse: z.number().nullable(),
        appetite: z.string(), mealsPct: z.number().nullable(),
        sleepHours: z.number().nullable(), nightWakings: z.number().nullable(), sleepQuality: z.number().nullable(),
        mood: z.string(), discomfort: z.string(), bowels: z.string(),
        skinChecked: z.boolean(), skinNote: z.string(),
        trainingA: z.boolean(), trainingB: z.boolean(),
        incident: z.string(), weightKg: z.number().nullable(), filledBy: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.seniorCheckins).orderBy(desc(schema.seniorCheckins.checkDate)).limit(180);
      return {
        checkins: rows.map((r) => ({
          checkDate: r.checkDate,
          systolic: r.systolic, diastolic: r.diastolic, pulse: r.pulse,
          appetite: r.appetite, mealsPct: r.mealsPct,
          sleepHours: r.sleepHours, nightWakings: r.nightWakings, sleepQuality: r.sleepQuality,
          mood: r.mood, discomfort: r.discomfort, bowels: r.bowels,
          skinChecked: r.skinChecked === 1, skinNote: r.skinNote,
          trainingA: r.trainingA === 1, trainingB: r.trainingB === 1,
          incident: r.incident, weightKg: r.weightKg, filledBy: r.filledBy,
        })),
      };
    },
  }),

  listTeamMembers: defineAction({
    description: "Lists the Team members (Patient Management): each real person assigned to one role and to the patient they serve in that role. Roles follow the MDT structure (YH-PLAT-ORG-001): platform lead, sales consultant, records clerk, health manager, dietitian, rehab therapist, psychologist, care butler, family — plus the consulting physician from the partner hospital 德阳德善居医院， an external contributor who does not log in. The first call seeds the people Helen has named — Helen, her sister and her brother as the family role for her dad (Patient Zero), and her dad as Patient Zero — plus empty slots for the MDT posts the org chart marks vacant （待补）; names are never invented. On later calls, any MDT slot that is missing entirely is added once, empty. Different patients can have different members.",
    request: z.object({}),
    response: z.object({
      members: z.array(z.object({
        id: z.number(), name: z.string(), roleKey: z.string(), patientId: z.string(), note: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const mdtSlots: { name: string; roleKey: string; patientId: string; note: string }[] = [
        { name: "", roleKey: "lead", patientId: "", note: "运营负责人本人 The operations lead · 在岗 In post" },
        { name: "", roleKey: "sales", patientId: "", note: "运营负责人兼 Held by the operations lead for now · 待补 Vacant" },
        { name: "", roleKey: "clerk", patientId: "", note: "生活管家兼 Covered by the care butler for now · 待补 Vacant" },
        { name: "", roleKey: "manager", patientId: "", note: "虚位待补 Vacant — to fill in" },
        { name: "", roleKey: "dietitian", patientId: "", note: "虚位待补 Vacant — to fill in（可兼职 Part-time possible）" },
        { name: "", roleKey: "exercise", patientId: "", note: "虚位待补 Vacant — to fill in（可兼职 Part-time possible）" },
        { name: "", roleKey: "counselor", patientId: "", note: "虚位待补 Vacant — to fill in（可兼职 Part-time possible）" },
        { name: "", roleKey: "aide", patientId: "", note: "虚位待补 Vacant — to fill in" },
        { name: "", roleKey: "physician", patientId: "", note: "德阳德善居医院（合作医院）· 外部会诊医师，不登录系统 — 书面意见由档案录入员上传归档 Partner hospital — external consultant, does not log in; written opinions are uploaded by the records clerk" },
      ];
      const existing = await db.select().from(schema.teamMembers).orderBy(asc(schema.teamMembers.id));
      if (existing.length === 0) {
        const seed: { name: string; roleKey: string; patientId: string; note: string }[] = [
          { name: "Helen", roleKey: "family", patientId: "patient-zero", note: "家人 Family" },
          { name: "姐姐 Sister", roleKey: "family", patientId: "patient-zero", note: "家人 Family — 真名待填 Real name to fill in" },
          { name: "哥哥 Brother", roleKey: "family", patientId: "patient-zero", note: "家人 Family — 真名待填 Real name to fill in" },
          { name: "爸爸 Dad", roleKey: "patient", patientId: "patient-zero", note: "Patient Zero · 第一位患者 First patient" },
          ...mdtSlots,
        ];
        for (const s of seed) { await db.insert(schema.teamMembers).values(s); }
        const rows = await db.select().from(schema.teamMembers).orderBy(asc(schema.teamMembers.id));
        return { members: rows.map((r) => ({ id: r.id, name: r.name, roleKey: r.roleKey, patientId: r.patientId, note: r.note })) };
      }
      const have = new Set(existing.map((m) => m.roleKey));
      const missing = mdtSlots.filter((s) => !have.has(s.roleKey));
      if (missing.length > 0) {
        for (const s of missing) { await db.insert(schema.teamMembers).values(s); }
        const rows = await db.select().from(schema.teamMembers).orderBy(asc(schema.teamMembers.id));
        return { members: rows.map((r) => ({ id: r.id, name: r.name, roleKey: r.roleKey, patientId: r.patientId, note: r.note })) };
      }
      return { members: existing.map((r) => ({ id: r.id, name: r.name, roleKey: r.roleKey, patientId: r.patientId, note: r.note })) };
    },
  }),

  saveTeamMember: defineAction({
    description: "Adds a team member, or updates one when an id is given: the person's name (blank means an empty slot to fill in later), the ONE role they are assigned to, and the patient they serve in that role (a patient id, 'patient-zero' for Helen's dad, or blank for not assigned yet).",
    request: z.object({
      id: z.number().int().positive().optional(),
      name: z.string().max(80).default(""),
      roleKey: z.string().min(1).max(40),
      patientId: z.string().max(40).default(""),
      note: z.string().max(300).default(""),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      const vals = { name: args.name.trim(), roleKey: args.roleKey, patientId: args.patientId, note: args.note };
      if (args.id) {
        await db.update(schema.teamMembers).set(vals).where(eq(schema.teamMembers.id, args.id));
        ctx.invalidateQueries();
        return { ok: true as const, id: args.id };
      }
      const inserted = await db.insert(schema.teamMembers).values(vals).returning({ id: schema.teamMembers.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  deleteTeamMember: defineAction({
    description: "Removes a person (or an empty slot) from the Team members list.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, args.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  listPatientTeamRoles: defineAction({
    description: "Lists which roles are on each patient's team (patient_id + role_key pairs). Choosing a role for a patient brings that role's task list for that patient. Patient Zero starts with the MDT roles from the org chart (family, health manager, dietitian, rehab therapist, psychologist, care butler, consulting physician) — the structure of his care plan; other patients start with none chosen. On an existing database, the psychologist and consulting-physician roles are added to Patient Zero's team once if neither is there yet.",
    request: z.object({}),
    response: z.object({
      pairs: z.array(z.object({ patientId: z.string(), roleKey: z.string() })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.patientTeamRoles).orderBy(asc(schema.patientTeamRoles.id));
      if (existing.length === 0) {
        const roles = ["family", "manager", "dietitian", "exercise", "counselor", "aide", "physician"];
        for (const roleKey of roles) { await db.insert(schema.patientTeamRoles).values({ patientId: "patient-zero", roleKey }); }
        const rows = await db.select().from(schema.patientTeamRoles).orderBy(asc(schema.patientTeamRoles.id));
        return { pairs: rows.map((r) => ({ patientId: r.patientId, roleKey: r.roleKey })) };
      }
      const pzRoles = new Set(existing.filter((r) => r.patientId === "patient-zero").map((r) => r.roleKey));
      if (!pzRoles.has("counselor") && !pzRoles.has("physician")) {
        for (const roleKey of ["counselor", "physician"]) { await db.insert(schema.patientTeamRoles).values({ patientId: "patient-zero", roleKey }); }
        const rows = await db.select().from(schema.patientTeamRoles).orderBy(asc(schema.patientTeamRoles.id));
        return { pairs: rows.map((r) => ({ patientId: r.patientId, roleKey: r.roleKey })) };
      }
      return { pairs: existing.map((r) => ({ patientId: r.patientId, roleKey: r.roleKey })) };
    },
  }),

  setPatientTeamRole: defineAction({
    description: "Adds a role to a patient's team (on=true) or removes it (on=false). Adding a role brings that role's tasks for that patient; the person who does them is the team member assigned to that role for that patient.",
    request: z.object({
      patientId: z.string().min(1).max(40),
      roleKey: z.string().min(1).max(40),
      on: z.boolean(),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.patientTeamRoles)
        .where(and(eq(schema.patientTeamRoles.patientId, args.patientId), eq(schema.patientTeamRoles.roleKey, args.roleKey)));
      if (args.on && rows.length === 0) {
        await db.insert(schema.patientTeamRoles).values({ patientId: args.patientId, roleKey: args.roleKey });
      } else if (!args.on) {
        for (const r of rows) { await db.delete(schema.patientTeamRoles).where(eq(schema.patientTeamRoles.id, r.id)); }
      }
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  listMedications: defineAction({
    description: "Lists the medication list (each entry with its uploaded prescription attachment — a photo URL for a photo, or the file name and kind for a PDF/Excel file) and the daily taken/missed ticks (Medications & Labs tab). The list starts empty — the doctor's actual prescription is entered here when provided; the site only records what was prescribed and whether it was taken, it never prescribes.",
    request: z.object({}),
    response: z.object({
      medications: z.array(z.object({
        id: z.number(), drugName: z.string(), dose: z.string(), frequency: z.string(),
        timeOfDay: z.string(), startDate: z.string(), endDate: z.string(),
        prescribedBy: z.string(), notes: z.string(), missedAction: z.string(), active: z.boolean(),
        photoUrl: z.string().nullable(), fileName: z.string(), fileKind: z.string(), enteredBy: z.string(),
      })),
      logs: z.array(z.object({
        id: z.number(), medicationId: z.number(), logDate: z.string(),
        status: z.string(), reason: z.string(), enteredBy: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const meds = await db.select().from(schema.medications).orderBy(asc(schema.medications.id));
      const logs = await db.select().from(schema.medicationLogs).orderBy(desc(schema.medicationLogs.logDate)).limit(1000);
      return {
        medications: await Promise.all(meds.map(async (r) => ({
          id: r.id, drugName: r.drugName, dose: r.dose, frequency: r.frequency,
          timeOfDay: r.timeOfDay, startDate: r.startDate, endDate: r.endDate,
          prescribedBy: r.prescribedBy, notes: r.notes, missedAction: r.missedAction,
          active: r.active === 1,
          photoUrl: r.photoKey && r.fileKind === "photo" ? await ctx.blobs.getUrl(r.photoKey) : null,
          fileName: r.fileName, fileKind: r.fileKind, enteredBy: r.enteredBy,
        }))),
        logs: logs.map((r) => ({ id: r.id, medicationId: r.medicationId, logDate: r.logDate, status: r.status, reason: r.reason, enteredBy: r.enteredBy })),
      };
    },
  }),

  saveMedication: defineAction({
    description: "Adds a medicine to the medication list, or updates it when an id is given: name, dose, frequency, time of day (tied to meals), start/end dates, prescribing doctor, notes, what to do if a dose is missed (written down in advance, per the doctor's instructions), and optionally one uploaded prescription attachment from the family — a JPG/PNG photo, a PDF file, or an Excel file, stored as an owned blob and kept as the source (removeUpload deletes it).",
    request: z.object({
      id: z.number().int().positive().optional(),
      drugName: z.string().trim().min(1).max(200),
      dose: z.string().max(100).default(""),
      frequency: z.string().max(60).default(""),
      timeOfDay: z.string().max(60).default(""),
      startDate: z.string().max(20).default(""),
      endDate: z.string().max(20).default(""),
      prescribedBy: z.string().max(100).default(""),
      notes: z.string().max(1000).default(""),
      missedAction: z.string().max(1000).default(""),
      active: z.boolean().default(true),
      upload: uploadShape.nullable().default(null),
      removeUpload: z.boolean().default(false),
      enteredBy: z.string().max(120).default(""),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      let photoKey: string | null = null;
      let fileName = "";
      let fileKind = "";
      let enteredBy = args.enteredBy;
      if (args.id) {
        const existing = (await db.select().from(schema.medications).where(eq(schema.medications.id, args.id)))[0];
        photoKey = existing?.photoKey ?? null;
        fileName = existing?.fileName ?? "";
        fileKind = existing?.fileKind ?? "";
        if (!enteredBy) enteredBy = existing?.enteredBy ?? "";
      }
      if (args.removeUpload) {
        if (photoKey) { await ctx.blobs.delete(photoKey); }
        photoKey = null; fileName = ""; fileKind = "";
      }
      if (args.upload) {
        const stored = await storeUpload(ctx, "prescription-files", args.upload);
        if (photoKey && photoKey !== stored.key) { await ctx.blobs.delete(photoKey); }
        photoKey = stored.key; fileKind = stored.kind;
        fileName = args.upload.fileName.trim() || (stored.kind === "photo" ? "处方照片 Prescription photo" : stored.kind === "pdf" ? "处方 PDF Prescription PDF" : "处方表格 Prescription spreadsheet");
      }
      const vals = {
        drugName: args.drugName, dose: args.dose, frequency: args.frequency,
        timeOfDay: args.timeOfDay, startDate: args.startDate, endDate: args.endDate,
        prescribedBy: args.prescribedBy, notes: args.notes, missedAction: args.missedAction,
        active: args.active ? 1 : 0, photoKey, fileName, fileKind, enteredBy,
      };
      if (args.id) {
        await db.update(schema.medications).set({ ...vals, updatedAt: new Date() }).where(eq(schema.medications.id, args.id));
        ctx.invalidateQueries();
        return { ok: true as const, id: args.id };
      }
      const inserted = await db.insert(schema.medications).values(vals).returning({ id: schema.medications.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  deleteMedication: defineAction({
    description: "Removes a medicine from the medication list together with its taken/missed ticks.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const existing = (await db.select().from(schema.medications).where(eq(schema.medications.id, args.id)))[0];
      if (existing?.photoKey) { await ctx.blobs.delete(existing.photoKey); }
      await db.delete(schema.medicationLogs).where(eq(schema.medicationLogs.medicationId, args.id));
      await db.delete(schema.medications).where(eq(schema.medications.id, args.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  logMedication: defineAction({
    description: "Records one day's tick for one medicine on the Medications & Labs daily-ticks screen: taken, or missed with a reason — plus who ticked it (the person giving the medicine: aide or family). Status 'none' clears the tick.",
    request: z.object({
      medicationId: z.number().int().positive(),
      logDate: z.string().min(10).max(10),
      status: z.enum(["taken", "missed", "none"]),
      reason: z.string().max(500).default(""),
      enteredBy: z.string().max(120).default(""),
    }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      if (!parseRoadmapDate(args.logDate)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const existing = await db.select().from(schema.medicationLogs)
        .where(eq(schema.medicationLogs.medicationId, args.medicationId));
      const cur = existing.find((r) => r.logDate === args.logDate);
      if (args.status === "none") {
        if (cur) await db.delete(schema.medicationLogs).where(eq(schema.medicationLogs.id, cur.id));
      } else if (!cur) {
        await db.insert(schema.medicationLogs).values({ medicationId: args.medicationId, logDate: args.logDate, status: args.status, reason: args.reason, enteredBy: args.enteredBy });
      } else {
        await db.update(schema.medicationLogs).set({ status: args.status, reason: args.reason, enteredBy: args.enteredBy || cur.enteredBy, updatedAt: new Date() }).where(eq(schema.medicationLogs.id, cur.id));
      }
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  listLabChecks: defineAction({
    description: "Lists the lab-check schedule (Medications & Labs tab): each test, how often, next due date, last result, abnormal flag, the doctor's note, and the uploaded lab report attachment when the family has provided one (a photo URL for a photo of the paper report or of the PDF on screen, or the file name and kind for a PDF/Excel file — the upload stays as the source of the typed values). Starts empty — the schedule (e.g. monthly blood work, annual full blood check) is entered as the doctor arranges it.",
    request: z.object({}),
    response: z.object({
      checks: z.array(z.object({
        id: z.number(), testName: z.string(), frequency: z.string(), nextDue: z.string(),
        lastResult: z.string(), abnormal: z.boolean(), doctorNote: z.string(),
        photoUrl: z.string().nullable(), fileName: z.string(), fileKind: z.string(), enteredBy: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.labChecks).orderBy(asc(schema.labChecks.id));
      return {
        checks: await Promise.all(rows.map(async (r) => ({
          id: r.id, testName: r.testName, frequency: r.frequency, nextDue: r.nextDue,
          lastResult: r.lastResult, abnormal: r.abnormal === 1, doctorNote: r.doctorNote,
          photoUrl: r.photoKey && r.fileKind === "photo" ? await ctx.blobs.getUrl(r.photoKey) : null,
          fileName: r.fileName, fileKind: r.fileKind, enteredBy: r.enteredBy,
        }))),
      };
    },
  }),

  saveLabCheck: defineAction({
    description: "Adds a lab check to the schedule, or updates it when an id is given: test name, frequency, next due date, last result, whether it was abnormal, the doctor's follow-up note, and optionally one uploaded lab report attachment from the family — a JPG/PNG photo (of the paper report or of the PDF on screen), the PDF file itself, or an Excel file, stored as an owned blob and kept as the source of the typed values (removeUpload deletes it).",
    request: z.object({
      id: z.number().int().positive().optional(),
      testName: z.string().trim().min(1).max(200),
      frequency: z.string().max(60).default(""),
      nextDue: z.string().max(20).default(""),
      lastResult: z.string().max(500).default(""),
      abnormal: z.boolean().default(false),
      doctorNote: z.string().max(1000).default(""),
      upload: uploadShape.nullable().default(null),
      removeUpload: z.boolean().default(false),
      enteredBy: z.string().max(120).default(""),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      let photoKey: string | null = null;
      let fileName = "";
      let fileKind = "";
      let enteredBy = args.enteredBy;
      if (args.id) {
        const existing = (await db.select().from(schema.labChecks).where(eq(schema.labChecks.id, args.id)))[0];
        photoKey = existing?.photoKey ?? null;
        fileName = existing?.fileName ?? "";
        fileKind = existing?.fileKind ?? "";
        if (!enteredBy) enteredBy = existing?.enteredBy ?? "";
      }
      if (args.removeUpload) {
        if (photoKey) { await ctx.blobs.delete(photoKey); }
        photoKey = null; fileName = ""; fileKind = "";
      }
      if (args.upload) {
        const stored = await storeUpload(ctx, "lab-report-files", args.upload);
        if (photoKey && photoKey !== stored.key) { await ctx.blobs.delete(photoKey); }
        photoKey = stored.key; fileKind = stored.kind;
        fileName = args.upload.fileName.trim() || (stored.kind === "photo" ? "化验报告照片 Lab report photo" : stored.kind === "pdf" ? "化验报告 PDF Lab report PDF" : "化验报告表格 Lab report spreadsheet");
      }
      const vals = {
        testName: args.testName, frequency: args.frequency, nextDue: args.nextDue,
        lastResult: args.lastResult, abnormal: args.abnormal ? 1 : 0, doctorNote: args.doctorNote,
        photoKey, fileName, fileKind, enteredBy,
      };
      if (args.id) {
        await db.update(schema.labChecks).set({ ...vals, updatedAt: new Date() }).where(eq(schema.labChecks.id, args.id));
        ctx.invalidateQueries();
        return { ok: true as const, id: args.id };
      }
      const inserted = await db.insert(schema.labChecks).values(vals).returning({ id: schema.labChecks.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  deleteLabCheck: defineAction({
    description: "Removes one lab check from the schedule.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const existing = (await db.select().from(schema.labChecks).where(eq(schema.labChecks.id, args.id)))[0];
      if (existing?.photoKey) { await ctx.blobs.delete(existing.photoKey); }
      await db.delete(schema.labChecks).where(eq(schema.labChecks.id, args.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  saveStandingRecord: defineAction({
    description: "Saves one weekly standing-progression monitoring record from the Staff Entry team forms (rehab therapist): week, date, standing-bed angle, supported-standing seconds, passive knee angle, spasms per day, BP, pulse, SpO2, whether the stage standard was met, and notes.",
    request: z.object({
      weekLabel: z.string().max(40).default(""),
      recordDate: z.string().min(10).max(10),
      bedAngle: z.number().min(0).max(90).nullable().default(null),
      standSeconds: z.number().int().min(0).max(86400).nullable().default(null),
      kneeAngle: z.number().min(0).max(180).nullable().default(null),
      spasmPerDay: z.number().int().min(0).max(200).nullable().default(null),
      systolic: z.number().int().min(0).max(300).nullable().default(null),
      diastolic: z.number().int().min(0).max(200).nullable().default(null),
      pulse: z.number().int().min(0).max(250).nullable().default(null),
      spo2: z.number().min(0).max(100).nullable().default(null),
      metStandard: z.boolean().default(false),
      note: z.string().max(2000).default(""),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      if (!parseRoadmapDate(args.recordDate)) throw new Error("Please pick a valid date.");
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.standingRecords).values({
        weekLabel: args.weekLabel, recordDate: args.recordDate,
        bedAngle: args.bedAngle, standSeconds: args.standSeconds, kneeAngle: args.kneeAngle,
        spasmPerDay: args.spasmPerDay, systolic: args.systolic, diastolic: args.diastolic,
        pulse: args.pulse, spo2: args.spo2, metStandard: args.metStandard ? 1 : 0, note: args.note,
      }).returning({ id: schema.standingRecords.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  listStandingRecords: defineAction({
    description: "Lists saved weekly standing-progression monitoring records (Staff Entry team forms), newest first.",
    request: z.object({}),
    response: z.object({
      records: z.array(z.object({
        id: z.number(), weekLabel: z.string(), recordDate: z.string(),
        bedAngle: z.number().nullable(), standSeconds: z.number().nullable(),
        kneeAngle: z.number().nullable(), spasmPerDay: z.number().nullable(),
        systolic: z.number().nullable(), diastolic: z.number().nullable(),
        pulse: z.number().nullable(), spo2: z.number().nullable(),
        metStandard: z.boolean(), note: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.standingRecords).orderBy(desc(schema.standingRecords.id)).limit(60);
      return {
        records: rows.map((r) => ({
          id: r.id, weekLabel: r.weekLabel, recordDate: r.recordDate,
          bedAngle: r.bedAngle, standSeconds: r.standSeconds,
          kneeAngle: r.kneeAngle, spasmPerDay: r.spasmPerDay,
          systolic: r.systolic, diastolic: r.diastolic,
          pulse: r.pulse, spo2: r.spo2,
          metStandard: r.metStandard === 1, note: r.note,
        })),
      };
    },
  }),

  deleteStandingRecord: defineAction({
    description: "Deletes one standing-progression monitoring record (e.g. saved by mistake).",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      await db.delete(schema.standingRecords).where(eq(schema.standingRecords.id, args.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),

  saveNutritionPlan: defineAction({
    description: "Calculates and saves a daily nutrition target from a measured weight (Staff Entry team forms, nutrition calculation). Formulas: total energy = weight × energy factor; protein = weight × protein factor; fat = total × fat share ÷ 9; carbohydrate = total × carb share ÷ 4; protein energy = protein grams × 4 kcal (the corrected formula — the source sheet's 6,820 kcal figure was an error). Returns the computed values.",
    request: z.object({
      patientId: z.string().max(10).default(""),
      weightKg: z.number().min(20).max(400),
      energyFactor: z.number().min(10).max(60).default(27.5),
      proteinFactor: z.number().min(0.5).max(3).default(1.35),
      fatPct: z.number().min(0).max(100).default(25),
      carbPct: z.number().min(0).max(100).default(55),
    }),
    response: z.object({
      ok: z.literal(true), id: z.number(),
      totalKcal: z.number(), proteinG: z.number(), fatG: z.number(), carbG: z.number(), proteinKcal: z.number(),
    }),
    async handler(ctx, args): Promise<{ ok: true; id: number; totalKcal: number; proteinG: number; fatG: number; carbG: number; proteinKcal: number }> {
      const db = ctx.db<typeof schema>();
      const totalKcal = Math.round(args.weightKg * args.energyFactor);
      const proteinG = Math.round(args.weightKg * args.proteinFactor);
      const fatG = Math.round((totalKcal * (args.fatPct / 100)) / 9);
      const carbG = Math.round((totalKcal * (args.carbPct / 100)) / 4);
      const proteinKcal = proteinG * 4;
      const inserted = await db.insert(schema.nutritionPlans).values({
        patientId: args.patientId, weightKg: args.weightKg,
        energyFactor: args.energyFactor, proteinFactor: args.proteinFactor,
        fatPct: args.fatPct, carbPct: args.carbPct,
        totalKcal, proteinG, fatG, carbG, proteinKcal,
      }).returning({ id: schema.nutritionPlans.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0, totalKcal, proteinG, fatG, carbG, proteinKcal };
    },
  }),

  listNutritionPlans: defineAction({
    description: "Lists saved nutrition calculations (Staff Entry team forms), newest first.",
    request: z.object({}),
    response: z.object({
      plans: z.array(z.object({
        id: z.number(), patientId: z.string(), weightKg: z.number(),
        energyFactor: z.number(), proteinFactor: z.number(), fatPct: z.number(), carbPct: z.number(),
        totalKcal: z.number(), proteinG: z.number(), fatG: z.number(), carbG: z.number(), proteinKcal: z.number(),
        createdAt: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.nutritionPlans).orderBy(desc(schema.nutritionPlans.id)).limit(30);
      return {
        plans: rows.map((r) => ({
          id: r.id, patientId: r.patientId, weightKg: r.weightKg,
          energyFactor: r.energyFactor, proteinFactor: r.proteinFactor, fatPct: r.fatPct, carbPct: r.carbPct,
          totalKcal: r.totalKcal, proteinG: r.proteinG, fatG: r.fatG, carbG: r.carbG, proteinKcal: r.proteinKcal,
          createdAt: r.createdAt.toISOString(),
        })),
      };
    },
  }),

  saveTeamForm: defineAction({
    description: "Saves a Staff Entry team form — the weekly tracking & follow-up record, or the Week-4 standing checkpoint verdict — into the shared staff-entries store, so it also appears in Recent entries. Payload fields are short strings, numbers or yes/no values.",
    request: z.object({
      patientId: z.string().min(1).max(10),
      week: z.string().min(1).max(40),
      formType: z.enum(["followup", "week4"]),
      entryDate: z.string().min(1).max(20),
      payload: z.record(z.string().max(60), z.union([z.string().max(2000), z.number(), z.boolean()])),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      const role = args.formType === "followup" ? "随访 Follow-up" : "第4周检查点 Week-4 checkpoint";
      const inserted = await db.insert(schema.staffEntries).values({
        patientId: args.patientId, week: args.week, role,
        entryDate: args.entryDate, payloadJson: JSON.stringify(args.payload),
      }).returning({ id: schema.staffEntries.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  listTeamForms: defineAction({
    description: "Lists saved Staff Entry team forms (weekly tracking & follow-up records and Week-4 checkpoint verdicts) with their filled-in fields, newest first.",
    request: z.object({}),
    response: z.object({
      forms: z.array(z.object({
        id: z.number(), patientId: z.string(), week: z.string(),
        formType: z.enum(["followup", "week4"]), entryDate: z.string(),
        payload: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.staffEntries).orderBy(desc(schema.staffEntries.id)).limit(200);
      const forms: { id: number; patientId: string; week: string; formType: "followup" | "week4"; entryDate: string; payload: Record<string, string | number | boolean> }[] = [];
      for (const r of rows) {
        const formType = r.role === "随访 Follow-up" ? "followup" : r.role === "第4周检查点 Week-4 checkpoint" ? "week4" : null;
        if (!formType) continue;
        let payload: Record<string, string | number | boolean> = {};
        try { payload = JSON.parse(r.payloadJson) as typeof payload; } catch { payload = {}; }
        forms.push({ id: r.id, patientId: r.patientId, week: r.week, formType, entryDate: r.entryDate, payload });
        if (forms.length >= 30) break;
      }
      return { forms };
    },
  }),

  savePricingSelection: defineAction({
    description: "Saves a client's pricing choices from the Staff entry → Pricing sub-tab: one package plus any add-on services picked from the decided price list, so the team can see what each client chose.",
    request: z.object({
      clientName: z.string().trim().max(60),
      packageLabel: z.string().trim().max(120),
      packagePrice: z.string().trim().max(60),
      services: z.array(z.object({
        label: z.string().trim().min(1).max(120),
        price: z.string().trim().max(60),
      })).max(40),
      note: z.string().trim().max(500),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      const inserted = await db.insert(schema.pricingSelections).values({
        clientName: args.clientName,
        packageLabel: args.packageLabel,
        packagePrice: args.packagePrice,
        servicesJson: JSON.stringify(args.services),
        note: args.note,
      }).returning({ id: schema.pricingSelections.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  listPricingSelections: defineAction({
    description: "Lists saved client pricing selections from the Staff entry → Pricing sub-tab, newest first.",
    request: z.object({}),
    response: z.object({
      selections: z.array(z.object({
        id: z.number(), clientName: z.string(), packageLabel: z.string(), packagePrice: z.string(),
        services: z.array(z.object({ label: z.string(), price: z.string() })),
        note: z.string(), createdAt: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.pricingSelections).orderBy(desc(schema.pricingSelections.id)).limit(50);
      return {
        selections: rows.map((r) => {
          let services: { label: string; price: string }[] = [];
          try {
            const parsed = JSON.parse(r.servicesJson) as unknown;
            if (Array.isArray(parsed)) {
              services = parsed.filter((s): s is { label: string; price: string } =>
                typeof s === "object" && s !== null && typeof (s as { label?: unknown }).label === "string" && typeof (s as { price?: unknown }).price === "string");
            }
          } catch { services = []; }
          return { id: r.id, clientName: r.clientName, packageLabel: r.packageLabel, packagePrice: r.packagePrice, services, note: r.note, createdAt: r.createdAt.toISOString() };
        }),
      };
    },
  }),
  listCatchupEntries: defineAction({
    description: "Lists catch-up entries from the Catch-up entries page （补录中心）: missed entries filed in one central place — patient, type (prescription, lab report, daily care sheet, exercise / nutrition / sleep / brain-training record, assessment form, physician's written opinion, other), the date the entry belongs to (may be in the past), the service/area it links to, an optional uploaded file, a short note, and who entered it. The destination screens read these same rows filtered by link area, so a filed item also appears in its proper place — one record, never a copy.",
    request: z.object({}),
    response: z.object({
      entries: z.array(z.object({
        id: z.number(), patientId: z.string(), entryType: z.string(), belongsDate: z.string(),
        linkArea: z.string(), note: z.string(), fileUrl: z.string().nullable(),
        fileName: z.string(), fileKind: z.string(), enteredBy: z.string(), createdAt: z.string(),
      })),
    }),
    async handler(ctx) {
      const db = ctx.db<typeof schema>();
      const rows = await db.select().from(schema.catchupEntries).orderBy(desc(schema.catchupEntries.id)).limit(200);
      return {
        entries: await Promise.all(rows.map(async (r) => ({
          id: r.id, patientId: r.patientId, entryType: r.entryType, belongsDate: r.belongsDate,
          linkArea: r.linkArea, note: r.note,
          fileUrl: r.fileKey && r.fileKind === "photo" ? await ctx.blobs.getUrl(r.fileKey) : null,
          fileName: r.fileName, fileKind: r.fileKind, enteredBy: r.enteredBy,
          createdAt: r.createdAt.toISOString(),
        }))),
      };
    },
  }),

  saveCatchupEntry: defineAction({
    description: "Files one catch-up entry in the Catch-up entries page （补录中心）: the patient it belongs to, what it is, the date the entry belongs to (today or any earlier date — this page exists for missed entries), the service/area it links to so it also shows in its proper place, a short note, who entered it, and optionally one uploaded file — a JPG/PNG photo, a PDF file, or an Excel file, stored as an owned blob and kept attached to the entry.",
    request: z.object({
      patientId: z.string().max(40).default(""),
      entryType: z.enum(["prescription", "lab", "care", "exercise", "nutrition", "sleep", "brain", "assessment", "opinion", "other"]),
      belongsDate: z.string().min(10).max(10),
      linkArea: z.enum(["meds", "exercise", "today", "record", "entry"]),
      note: z.string().max(1000).default(""),
      upload: uploadShape.nullable().default(null),
      enteredBy: z.string().max(120).default(""),
    }),
    response: z.object({ ok: z.literal(true), id: z.number() }),
    async handler(ctx, args): Promise<{ ok: true; id: number }> {
      const db = ctx.db<typeof schema>();
      let fileKey: string | null = null;
      let fileName = "";
      let fileKind = "";
      if (args.upload) {
        const stored = await storeUpload(ctx, "catchup-files", args.upload);
        fileKey = stored.key; fileKind = stored.kind;
        fileName = args.upload.fileName.trim() || (stored.kind === "photo" ? "补录照片 Catch-up photo" : stored.kind === "pdf" ? "补录文件 PDF Catch-up PDF" : "补录表格 Catch-up spreadsheet");
      }
      const inserted = await db.insert(schema.catchupEntries).values({
        patientId: args.patientId, entryType: args.entryType, belongsDate: args.belongsDate,
        linkArea: args.linkArea, note: args.note, fileKey, fileName, fileKind, enteredBy: args.enteredBy,
      }).returning({ id: schema.catchupEntries.id });
      ctx.invalidateQueries();
      return { ok: true as const, id: inserted[0]?.id ?? 0 };
    },
  }),

  deleteCatchupEntry: defineAction({
    description: "Removes one catch-up entry (and its uploaded file) from the Catch-up entries page.",
    request: z.object({ id: z.number().int().positive() }),
    response: z.object({ ok: z.literal(true) }),
    async handler(ctx, args): Promise<{ ok: true }> {
      const db = ctx.db<typeof schema>();
      const existing = (await db.select().from(schema.catchupEntries).where(eq(schema.catchupEntries.id, args.id)))[0];
      if (existing?.fileKey) { await ctx.blobs.delete(existing.fileKey); }
      await db.delete(schema.catchupEntries).where(eq(schema.catchupEntries.id, args.id));
      ctx.invalidateQueries();
      return { ok: true as const };
    },
  }),
} satisfies ActionsModule;
