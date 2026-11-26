import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { fileToBase64 } from "@hatch/space-sdk/client";
import { actionFields } from "@hatch/space-sdk/fields" with { type: "macro" };
import type { Actions } from "../../server/src/actions";
import { T, LANG } from "./lang";
import { Dismissible } from "./ui";

/* Display helper for legacy stored strings that combine both languages
   ("每天一次 Once a day"): shows only the half for the current language.
   Stored values themselves never change. */
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
const AMBER = "#b8860b";
const RED = "#a63d32";

type SeniorCheckin = ApiResponse<typeof api, "listSeniorCheckins">["checkins"][number];
type ExerciseRecord = ApiResponse<typeof api, "listExerciseRecords">["records"][number];
type CognitiveRecord = ApiResponse<typeof api, "listCognitiveRecords">["records"][number];
type LabCheck = ApiResponse<typeof api, "listLabChecks">["checks"][number];

function SCard({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm ${className}`}>
      {title ? <h3 className="mb-3 text-[15px] font-bold" style={{ color: TEAL }}>{title}</h3> : null}
      {children}
    </section>
  );
}

function SSubTabs<T extends string>({ tabs, value, onChange, label }: {
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
            {T(t.zh, t.en)}
            {t.count != null ? <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-xs font-bold">{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

const INP = "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm";
const SEL = "mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm";

function dateKeyOf(d: Date): string {
  const y = d.getFullYear(); const mo = String(d.getMonth() + 1).padStart(2, "0"); const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}
function numOrNull(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}
function strOr(v: number | null | undefined): string { return v == null ? "" : String(v); }

/* ---------- Red flags — always visible on Today and Exercise ----------
   From the 24-hour checklist's red box and the care plan's stop signals:
   what to stop for, and what must be reported the same day. */
export function RedFlagBox() {
  return (
    <div className="rounded-xl border-2 p-4" style={{ borderColor: RED, background: "#fdeceb", color: "#57231e" }}>
      <p className="text-base font-bold" style={{ color: RED }}>{T("红色提醒 — 出现任何一条，立即停下", "Red flags — if any of these appear, stop at once")}</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
        <li><strong>{T("运动中立即停止并记录：", "Stop exercise at once and note it down: ")}</strong>{T("胸口闷痛/压迫感 · 明显心慌 · 气短比平时加重 · 头晕 · 面色发白 · 出冷汗 · 说话断句变短。站立时面色发白/发紫、腿发抖、撑不住、膝盖刺痛，马上扶住坐下。", "chest pain or pressure, strong palpitations, worse breathlessness, dizziness, pale face, cold sweat, speech breaking into short phrases. When standing: face turning pale or blue, legs shaking, cannot hold on, sharp knee pain — help them sit down immediately.")}</li>
        <li><strong>{T("发热不练：", "Fever means no training: ")}</strong>{T("当日发热（体温 ≥ 37.3℃）或任何感染症状，全日停训并就医评估。", "Fever (≥ 37.3 °C) or any infection signs that day: no training at all; get assessed.")}</li>
        <li><strong>{T("当天上报健康管理师/医生：", "Tell the health manager / doctor the same day: ")}</strong>{T("任何一次跌倒或差点跌倒（即使没受伤）；皮肤发红 30 分钟不退、破损、水泡；呛咳不止、声音变哑、进食量突然减半。", "any fall or near-fall (even unhurt); skin redness not fading within 30 minutes, broken skin or a blister; persistent choking cough, a hoarse voice, or eating suddenly halved.")}</li>
        <li><strong>{T("紧急情况先打电话，不要等网站回复。", "In an emergency, phone first — never wait for a website reply.")}</strong></li>
      </ul>
    </div>
  );
}

/* ================= Today 今日 — the 24-hour care checklist =================
   The checklist's page 1 (24-hour overview) as a screen: time / task / who,
   one tap per row, saved at once. Times are the home routine's own times
   from the checklist; each family's times can differ in the real system. */
type CareItem = { key: string; time: string; zh: string; en: string; who: "aide" | "family"; note?: string };
const CARE_ITEMS: CareItem[] = [
  { key: "morning-care", time: "06:00–07:30", zh: "晨间护理", en: "Morning care", who: "family", note: "全身擦洗（温水＋淡酒精）＋刷牙；换干净衣服；查皮肤" },
  { key: "protein-drink", time: "06:30–07:30", zh: "晨间营养饮", en: "Morning nutrition drink", who: "family", note: "医生开的蛋白营养饮：1 份＋双倍水，冲淡了喝" },
  { key: "breakfast-prep", time: "07:00–07:30", zh: "备早餐", en: "Prepare breakfast", who: "family", note: "备早餐，8:00 准时开饭" },
  { key: "get-up", time: "07:30–08:00", zh: "起床·穿衣", en: "Get up & dress", who: "aide", note: "三步起床，每步停 30 秒；锁刹车" },
  { key: "breakfast", time: "08:00–08:45", zh: "早餐·晨药", en: "Breakfast & morning medicine", who: "aide", note: "坐位 90°，小口慢咽；干稀分开；进食不说话" },
  { key: "breathing", time: "08:45–09:15", zh: "餐后呼吸训练", en: "Breathing exercises", who: "aide", note: "腹式＋缩唇呼吸：吸 3 秒、呼 6 秒" },
  { key: "exercise-a", time: "09:15–10:00", zh: "上午运动 A 组", en: "Morning exercise — Group A", who: "aide", note: "分 3 小节，每节 8 分钟，节间休息 5 分钟；动作见「运动与认知」页" },
  { key: "water-relief", time: "10:00–10:30", zh: "饮水·减压", en: "Water & pressure relief", who: "aide", note: "喝水；前倾/侧倾各 30 秒；查坐骨皮肤" },
  { key: "cognitive-1", time: "10:30–11:10", zh: "认知训练 ①", en: "Brain training 1", who: "aide", note: "怀旧相册＋手指操；不考记忆" },
  { key: "sunlight", time: "11:10–12:00", zh: "日光·自由活动", en: "Sunlight & free time", who: "aide", note: "晒太阳 15–20 分钟；避强光、保暖" },
  { key: "lunch", time: "12:00–13:00", zh: "午餐", en: "Lunch", who: "aide", note: "同早餐标准；餐后坐 30 分钟再午休" },
  { key: "nap", time: "13:00–14:30", zh: "午休", en: "Midday rest", who: "aide", note: "睡前排尿；醒后先坐 30 秒再起身" },
  { key: "wake-water", time: "14:30–15:00", zh: "起床·饮水", en: "Wake up & water", who: "aide", note: "温水 150–200ml；查皮肤（骶尾、足跟）" },
  { key: "exercise-b", time: "15:00–15:40", zh: "下午运动 B 组", en: "Afternoon exercise — Group B", who: "aide", note: "轻拉伸约 15 分钟；比上午更轻" },
  { key: "cognitive-2", time: "15:40–16:10", zh: "认知训练 ②", en: "Brain training 2", who: "aide", note: "音乐/算题/拼图；与上午不同" },
  { key: "social", time: "16:10–17:00", zh: "社交时段", en: "Social time", who: "aide", note: "聊天/视频/讲故事；多听不打断" },
  { key: "snack", time: "17:00–17:30", zh: "加餐", en: "Afternoon snack", who: "aide", note: "酸奶/软水果，少量；同正餐防护" },
  { key: "light-chores", time: "17:30–18:00", zh: "轻家务·自由", en: "Light chores & free time", who: "family" },
  { key: "evening-activity", time: "18:00–18:50", zh: "晚间活动", en: "Evening activity", who: "family", note: "活动 40–50 分钟" },
  { key: "dinner-prep", time: "19:00–20:00", zh: "休息·做晚饭", en: "Rest & make dinner", who: "family" },
  { key: "dinner", time: "20:00–20:30", zh: "晚餐", en: "Dinner", who: "family", note: "七分饱，减少夜里负担" },
  { key: "wash-relax", time: "20:30–21:00", zh: "洗漱·放松", en: "Wash & relax", who: "family", note: "轻清洁＋刷牙" },
  { key: "bed-check", time: "21:00–21:30", zh: "上床·睡前检查", en: "Bed & bedtime check", who: "family" },
  { key: "night-1", time: "23:00", zh: "夜间巡查 ①", en: "Night check 1", who: "family", note: "查排尿/尿布，湿了就换；翻身一次" },
  { key: "night-2", time: "03:00", zh: "夜间巡查 ②", en: "Night check 2", who: "family", note: "同第一次；翻身一次" },
];
const CARE_GROUPS: { titleZh: string; titleEn: string; keys: string[] }[] = [
  { titleZh: "晨间 · 家人", titleEn: "Morning · family", keys: ["morning-care", "protein-drink", "breakfast-prep"] },
  { titleZh: "白天 · 生活管家（7:30–17:30）", titleEn: "Daytime · care butler (7:30–17:30)", keys: ["get-up", "breakfast", "breathing", "exercise-a", "water-relief", "cognitive-1", "sunlight", "lunch", "nap", "wake-water", "exercise-b", "cognitive-2", "social", "snack"] },
  { titleZh: "晚间 · 家人", titleEn: "Evening · family", keys: ["light-chores", "evening-activity", "dinner-prep", "dinner", "wash-relax", "bed-check"] },
  { titleZh: "夜间 · 家人", titleEn: "Night · family", keys: ["night-1", "night-2"] },
];

function CareRow({ item, done, onToggle }: { item: CareItem; done: boolean; onToggle: (key: string, done: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#f0e9d8] py-2.5 last:border-0">
      <span className="w-[6.8rem] shrink-0 text-sm font-bold" style={{ color: TEAL }}>{item.time}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-snug">{T(item.zh, item.en)}</p>
        {item.note ? <p className="text-xs text-[var(--dim)]">{item.note}</p> : null}
      </div>
      <span className="hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold sm:inline-block"
        style={item.who === "aide" ? { background: "#e3efec", color: TEAL } : { background: "#fbf3d9", color: "#7a5b12" }}>
        {item.who === "aide" ? T("生活管家", "Care butler") : T("家人", "Family")}
      </span>
      <input type="checkbox" aria-label={T(`完成：${item.zh}`, `Done: ${item.en}`)} className="h-7 w-7 shrink-0"
        checked={done} onChange={(e) => onToggle(item.key, e.target.checked)} />
    </div>
  );
}

export function TodayTab() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => dateKeyOf(new Date()));
  const [sub, setSub] = useState<"full" | "aide" | "night" | "evening">("full");
  const [tickError, setTickError] = useState("");
  const careQ = useQuery({ queryKey: ["careDay", date], queryFn: () => api.getCareDay({ date }) });
  const ticks = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const t of careQ.data?.ticks ?? []) m.set(t.itemKey, t.done);
    return m;
  }, [careQ.data]);
  const doneCount = CARE_ITEMS.filter((i) => ticks.get(i.key)).length;
  const tick = useMutation({
    mutationFn: async (v: { itemKey: string; done: boolean }) => await api.setCareTick({ date, itemKey: v.itemKey, done: v.done }),
    onError: (e) => setTickError(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
    onSuccess: () => { setTickError(""); void queryClient.invalidateQueries({ queryKey: ["careDay", date] }); },
  });
  const onToggle = (key: string, done: boolean) => tick.mutate({ itemKey: key, done });

  const [hdr, setHdr] = useState<{ aide: string; family: string; note: string } | null>(null);
  const [hdrMsg, setHdrMsg] = useState("");
  useEffect(() => { setHdr(null); setHdrMsg(""); }, [date]);
  useEffect(() => {
    if (hdr === null && careQ.data) {
      setHdr({ aide: careQ.data.dayNote?.aideName ?? "", family: careQ.data.dayNote?.familyName ?? "", note: careQ.data.dayNote?.note ?? "" });
    }
  }, [careQ.data, hdr]);
  const saveHdr = useMutation({
    mutationFn: async () => await api.saveCareDayNote({ date, aideName: hdr?.aide ?? "", familyName: hdr?.family ?? "", note: hdr?.note ?? "" }),
    onSuccess: () => { setHdrMsg(T("已保存。", "Saved.")); void queryClient.invalidateQueries({ queryKey: ["careDay", date] }); },
    onError: (e) => setHdrMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });

  const itemsByKey = useMemo(() => { const m = new Map<string, CareItem>(); for (const i of CARE_ITEMS) m.set(i.key, i); return m; }, []);
  const renderGroup = (keys: string[]) => (
    <div>
      {keys.map((k) => { const it = itemsByKey.get(k); return it ? <CareRow key={k} item={it} done={!!ticks.get(k)} onToggle={onToggle} /> : null; })}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>{T("今日 — 24 小时照护清单", "Today — 24-hour care checklist")}</h2>
      </div>
      <RedFlagBox />
      <SCard>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold">{T("日期", "Date")}
            <input aria-label="Checklist date" type="date" className={INP} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="text-sm">{T("生活管家", "Care butler")}
            <input {...FIELDS.saveCareDayNote.aideName} aria-label="Care butler on duty" className={INP} value={hdr?.aide ?? ""} onChange={(e) => setHdr({ aide: e.target.value, family: hdr?.family ?? "", note: hdr?.note ?? "" })} placeholder={T("今天当班的生活管家名字", "Name of the care butler on duty today")} />
          </label>
          <label className="text-sm">{T("家人", "Family")}
            <input {...FIELDS.saveCareDayNote.familyName} aria-label="Family member on duty" className={INP} value={hdr?.family ?? ""} onChange={(e) => setHdr({ aide: hdr?.aide ?? "", family: e.target.value, note: hdr?.note ?? "" })} placeholder={T("今晚照护的家人名字", "Family member caring tonight")} />
          </label>
          <div className="pb-1 text-sm">
            <span className="font-bold" style={{ color: doneCount === CARE_ITEMS.length ? GREEN : TEAL }}>{T(`已完成 ${doneCount} / ${CARE_ITEMS.length}`, `Done ${doneCount} of ${CARE_ITEMS.length}`)}</span>
          </div>
        </div>
        <label className="mt-3 block text-sm">{T("今日小结与备注", "Notes for today")}
          <textarea {...FIELDS.saveCareDayNote.note} aria-label="Notes for today" className={INP} rows={2} value={hdr?.note ?? ""} onChange={(e) => setHdr({ aide: hdr?.aide ?? "", family: hdr?.family ?? "", note: e.target.value })} placeholder={T("今天有什么特别情况，写在这里。", "Anything unusual today — write it here.")} />
        </label>
        <button type="button" disabled={saveHdr.isPending} className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => saveHdr.mutate()}>
          {saveHdr.isPending ? T("保存中…", "Saving…") : T("保存当班人与备注", "Save names & note")}
        </button>
        {hdrMsg ? <p className="mt-2 text-sm" role="status">{hdrMsg}</p> : null}
        {tickError ? <p className="mt-2 text-sm" role="alert" style={{ color: RED }}>{tickError}</p> : null}
      </SCard>
      <SSubTabs label="Today sections" value={sub} onChange={setSub} tabs={[
        { key: "full", zh: "全天清单", en: "Full day" },
        { key: "aide", zh: "生活管家视图", en: "Care butler view" },
        { key: "night", zh: "家人视图（夜间）", en: "Family night view" },
        { key: "evening", zh: "晚上打卡", en: "Evening check-in" },
      ]} />
      {careQ.isPending ? <p className="py-6 text-center text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p> : null}
      {sub === "full" ? (
        <div className="space-y-4">
          {CARE_GROUPS.map((g) => (
            <SCard key={g.titleZh} title={T(g.titleZh, g.titleEn)}>{renderGroup(g.keys)}</SCard>
          ))}
        </div>
      ) : null}
      {sub === "aide" ? (
        <SCard title={T("生活管家日间工作表（7:30–17:30）", "Care butler's day sheet (7:30–17:30)")}>
          <Dismissible className="pr-8"><p className="mb-1 text-sm text-[var(--dim)]">{T("白天由生活管家做：做完一项点一下。运动中出现胸口闷痛、明显心慌、气短加重、头晕、面色发白、出冷汗，立即停止当日训练并记录；发热（≥37.3℃）全日停训。", "The care butler's daytime work — tap each item as it is done. Stop the day's training at once on any stop signal; no training at all on a fever day.")}</p></Dismissible>
          {renderGroup(CARE_GROUPS[1]!.keys)}
        </SCard>
      ) : null}
      {sub === "night" ? (
        <SCard title={T("夜间照护 — 家人（23:00–07:30）", "Night care — family (23:00–07:30)")}>
          <Dismissible className="pr-8"><p className="mb-1 text-sm text-[var(--dim)]">{T("晚上和清晨由家人做：23:00、03:00 各巡查一次，查排尿/尿布、翻身一次；皮肤发红或异常，早上告诉健康管理师。", "Family cover the night and early morning: checks at 23:00 and 03:00, one turn each time; report any skin redness in the morning.")}</p></Dismissible>
          {renderGroup([...CARE_GROUPS[3]!.keys, ...CARE_GROUPS[0]!.keys])}
        </SCard>
      ) : null}
      {sub === "evening" ? <EveningCheckinForm date={date} /> : null}
      <CatchupFiledList area="today" />
    </div>
  );
}

/* ---------- Evening check-in — the checklist's page-2 daily health check ----------
   One record per date, shared with the Patient app's daily check-in:
   fields this form does not send keep their saved values (server merges). */
function EveningCheckinForm({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const checkinsQ = useQuery({ queryKey: ["seniorCheckins"], queryFn: () => api.listSeniorCheckins({}) });
  const rec: SeniorCheckin | undefined = checkinsQ.data?.checkins.find((c) => c.checkDate === date);
  type F = { sys: string; dia: string; pulse: string; appetite: string; mealsPct: string; sleepHours: string; nightWakings: string; mood: string; discomfort: string; bowels: string; skinChecked: boolean; skinNote: string; trainingA: boolean; trainingB: boolean; incident: string; weightKg: string; filledBy: string };
  const [form, setForm] = useState<F | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { setForm(null); setMsg(""); }, [date]);
  useEffect(() => {
    if (form === null && checkinsQ.data) {
      setForm({
        sys: strOr(rec?.systolic), dia: strOr(rec?.diastolic), pulse: strOr(rec?.pulse),
        appetite: rec?.appetite ?? "", mealsPct: strOr(rec?.mealsPct),
        sleepHours: strOr(rec?.sleepHours), nightWakings: strOr(rec?.nightWakings),
        mood: rec?.mood ?? "", discomfort: rec?.discomfort ?? "", bowels: rec?.bowels ?? "",
        skinChecked: rec?.skinChecked ?? false, skinNote: rec?.skinNote ?? "",
        trainingA: rec?.trainingA ?? false, trainingB: rec?.trainingB ?? false,
        incident: rec?.incident ?? "", weightKg: strOr(rec?.weightKg),
        filledBy: rec?.filledBy && rec.filledBy.startsWith("患者") ? "家人 Family" : (rec?.filledBy || "生活管家 Care butler"),
      });
    }
  }, [checkinsQ.data, form, rec]);
  const save = useMutation({
    mutationFn: async () => {
      const f = form!;
      return await api.saveSeniorCheckin({
        checkDate: date,
        systolic: numOrNull(f.sys), diastolic: numOrNull(f.dia), pulse: numOrNull(f.pulse),
        appetite: f.appetite, mealsPct: numOrNull(f.mealsPct),
        sleepHours: numOrNull(f.sleepHours), nightWakings: numOrNull(f.nightWakings),
        mood: f.mood, discomfort: f.discomfort, bowels: f.bowels,
        skinChecked: f.skinChecked, skinNote: f.skinNote,
        trainingA: f.trainingA, trainingB: f.trainingB,
        incident: f.incident, weightKg: numOrNull(f.weightKg), filledBy: f.filledBy,
      });
    },
    onSuccess: () => { setMsg(T("已保存 — 这份打卡也会出现在患者端的每日打卡里。", "Saved — this check-in also shows in the Patient app's daily check-in.")); void queryClient.invalidateQueries({ queryKey: ["seniorCheckins"] }); },
    onError: (e) => setMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  if (!form) return <p className="py-6 text-center text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p>;
  const set = (k: keyof F) => (v: string | boolean) => setForm({ ...form, [k]: v });
  return (
    <SCard title={T("每日健康打卡 — 晚上 5 分钟", "Daily health check-in — five minutes at the end of the day")}>
      <p className="mb-3 text-sm text-[var(--dim)]">{T("大多是点选项，不用写长句子。异常事件要写清时间和现象，并马上上报，不要等。", "Mostly tapping options — no long sentences. For anything abnormal, note the time and what happened, and report it at once.")}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">{T("晨起血压 收缩压（mmHg）", "Morning BP — systolic (mmHg)")}
          <input aria-label="Morning systolic BP" type="number" inputMode="numeric" className={INP} value={form.sys} onChange={(e) => set("sys")(e.target.value)} /></label>
        <label className="block text-sm">{T("晨起血压 舒张压（mmHg）", "Morning BP — diastolic (mmHg)")}
          <input aria-label="Morning diastolic BP" type="number" inputMode="numeric" className={INP} value={form.dia} onChange={(e) => set("dia")(e.target.value)} /></label>
        <label className="block text-sm">{T("脉搏（次/分）", "Pulse (per minute)")}
          <input {...FIELDS.saveSeniorCheckin.pulse} aria-label="Pulse" type="number" inputMode="numeric" className={INP} value={form.pulse} onChange={(e) => set("pulse")(e.target.value)} /></label>
        <label className="block text-sm">{T("进食", "Appetite")}
          <select aria-label="Appetite" className={SEL} value={form.appetite} onChange={(e) => set("appetite")(e.target.value)}>
            <option value="">{T("— 未填 —", "— Not yet —")}</option><option value="好">{T("好", "Good")}</option><option value="一般">{T("一般", "Fair")}</option><option value="差">{T("差", "Poor")}</option>
          </select></label>
        <label className="block text-sm">{T("吃了几成（成，满分 10）", "How much eaten (out of 10)")}
          <input {...FIELDS.saveSeniorCheckin.mealsPct} aria-label="How much eaten" type="number" inputMode="decimal" className={INP} value={form.mealsPct} onChange={(e) => set("mealsPct")(e.target.value)} /></label>
        <label className="block text-sm">{T("睡眠（小时）", "Sleep (hours)")}
          <input {...FIELDS.saveSeniorCheckin.sleepHours} aria-label="Sleep hours" type="number" inputMode="decimal" className={INP} value={form.sleepHours} onChange={(e) => set("sleepHours")(e.target.value)} /></label>
        <label className="block text-sm">{T("夜醒次数", "Woke in the night (times)")}
          <input {...FIELDS.saveSeniorCheckin.nightWakings} aria-label="Night wakings" type="number" inputMode="numeric" className={INP} value={form.nightWakings} onChange={(e) => set("nightWakings")(e.target.value)} /></label>
        <label className="block text-sm">{T("情绪", "Mood")}
          <select aria-label="Mood" className={SEL} value={form.mood} onChange={(e) => set("mood")(e.target.value)}>
            <option value="">{T("— 未填 —", "— Not yet —")}</option><option value="平稳">{T("平稳", "Calm")}</option><option value="烦躁">{T("烦躁", "Restless")}</option><option value="淡漠">{T("淡漠", "Flat")}</option>
          </select></label>
        <label className="block text-sm">{T("体重（kg · 每周一次）", "Weight (kg · once a week)")}
          <input {...FIELDS.saveSeniorCheckin.weightKg} aria-label="Weight in kg" type="number" inputMode="decimal" className={INP} value={form.weightKg} onChange={(e) => set("weightKg")(e.target.value)} /></label>
        <label className="block text-sm sm:col-span-2">{T("哪里不舒服", "Any discomfort")}
          <input {...FIELDS.saveSeniorCheckin.discomfort} aria-label="Any discomfort" className={INP} value={form.discomfort} onChange={(e) => set("discomfort")(e.target.value)} placeholder={T("例如：右腿有点胀", "e.g. leg feels swollen")} /></label>
        <label className="block text-sm">{T("大小便", "Bowels & urine")}
          <input {...FIELDS.saveSeniorCheckin.bowels} aria-label="Bowels and urine" className={INP} value={form.bowels} onChange={(e) => set("bowels")(e.target.value)} placeholder={T("如：大便 1 次，小便正常", "e.g. bowels once, urine normal")} /></label>
        <label className="block text-sm">{T("皮肤异常部位", "Skin problem area")}
          <input {...FIELDS.saveSeniorCheckin.skinNote} aria-label="Skin problem area" className={INP} value={form.skinNote} onChange={(e) => set("skinNote")(e.target.value)} placeholder={T("没有异常就留空", "Leave blank if fine")} /></label>
        <label className="block text-sm">{T("填写人", "Filled by")}
          <select aria-label="Filled by" className={SEL} value={form.filledBy} onChange={(e) => set("filledBy")(e.target.value)}>
            {form.filledBy && form.filledBy !== "生活管家 Care butler" && form.filledBy !== "家人 Family" ? <option value={form.filledBy}>{form.filledBy}</option> : null}
            <option value="生活管家 Care butler">{T("生活管家", "Care butler")}</option><option value="家人 Family">{T("家人", "Family")}</option>
          </select></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" aria-label="Skin checked" className="h-5 w-5" checked={form.skinChecked} onChange={(e) => set("skinChecked")(e.target.checked)} />{T("皮肤已查", "Skin checked")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" aria-label="Group A training done" className="h-5 w-5" checked={form.trainingA} onChange={(e) => set("trainingA")(e.target.checked)} />{T("训练完成 A 组", "Group A done")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" aria-label="Group B training done" className="h-5 w-5" checked={form.trainingB} onChange={(e) => set("trainingB")(e.target.checked)} />{T("训练完成 B 组", "Group B done")}</label>
      </div>
      <label className="mt-3 block text-sm">{T("异常事件（写清时间＋现象）", "Abnormal events (note the time and what happened)")}
        <textarea {...FIELDS.saveSeniorCheckin.incident} aria-label="Abnormal events" className={INP} rows={2} value={form.incident} onChange={(e) => set("incident")(e.target.value)} placeholder={T("没有就留空。", "None — leave blank.")} />
      </label>
      <button type="button" disabled={save.isPending} className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => save.mutate()}>
        {save.isPending ? T("保存中…", "Saving…") : T("保存打卡", "Save check-in")}
      </button>
      {msg ? <p className="mt-2 text-sm" role="status">{msg}</p> : null}
    </SCard>
  );
}

/* ================= Exercise & Brain 运动与认知 =================
   The V2 standing progression + the 1125 seated A/B groups + the cognitive
   menu, each with its entry form. Safety pre-checks come first: BP, pulse,
   SpO2 and fever decide whether today is a training day at all. */
type ExAction = { key: string; zh: string; en: string; how: string; prescribed: string; caution: string };
const ACTIONS_A: ExAction[] = [
  { key: "a1", zh: "腹式呼吸", en: "Diaphragmatic breathing", how: "坐位，手放腹部，吸气鼓腹、呼气收腹", prescribed: "10 次 × 2 组", caution: "呼气比吸气长；头晕即停" },
  { key: "a2", zh: "坐位伸腿", en: "Seated leg extension", how: "坐稳，一条腿缓慢伸直悬空 5 秒，放下，换腿", prescribed: "8 次/侧", caution: "膝盖不甩；僵硬的腿幅度以不痛为准" },
  { key: "a3", zh: "坐位抬腿", en: "Seated leg lift", how: "大腿抬起离椅面 5 厘米停 3 秒", prescribed: "6 次/侧", caution: "身体不后仰借力" },
  { key: "a4", zh: "骨盆前后倾", en: "Pelvic tilts", how: "缓慢弓背—挺腰交替", prescribed: "8 次", caution: "动作幅度小、速度慢" },
  { key: "a5", zh: "上肢举瓶", en: "Arm raises with bottles", how: "双手各握 0.5kg 水瓶，前举—放下", prescribed: "8 次 × 2 组", caution: "肩痛即停；不用弹力带高强度" },
  { key: "a6", zh: "手指操", en: "Finger exercises", how: "握拳—张开，对指捏", prescribed: "10 次", caution: "配合计数，兼做认知" },
];
const ACTIONS_B: ExAction[] = [
  { key: "b1", zh: "颈肩环绕", en: "Neck & shoulder rolls", how: "缓慢耸肩、转头", prescribed: "各 8 次", caution: "速度极慢" },
  { key: "b2", zh: "踝泵", en: "Ankle pumps", how: "脚尖上勾—下踩交替（家属可辅助）", prescribed: "15 次/侧", caution: "促进回流，防血栓" },
  { key: "b3", zh: "僵硬腿轻柔拉伸", en: "Gentle stretch of the stiff leg", how: "家属托住小腿缓慢活动膝关节，不弹振", prescribed: "5 次", caution: "痉挛时立即停住，等它自己松开，绝不硬掰" },
  { key: "b4", zh: "坐位转体", en: "Seated trunk rotation", how: "双手抱肩，缓慢左右转", prescribed: "5 次/侧", caution: "幅度减半" },
];

const STANDING_PHASES: { title: string; goal: string; items: string[]; advance: string; checkpoint?: boolean }[] = [
  { title: "第 0 天 Day 0", goal: "先测一次基线 Take the baseline first", items: ["量体重、膝能弯多少度、扶着能站几秒、血压 / 脉搏 / 血氧、一天痉挛几次，全部实测填入（团队在「团队录入 → 团队表单 → 站立进阶监测」记录）", "没有基线，后面的进步就没有得比 — 不猜、不编。"], advance: "基线测完，填好，才开始第 1 周。" },
  { title: "第 1–2 周 Weeks 1–2", goal: "关节松开、腿不抽 Loosen the joints, calm the spasms", items: ["热敷按摩僵硬的腿 10 分钟", "被动屈膝 12 次 × 2 组", "踝泵 15 次 × 2 组", "臀桥 6 次 × 2 组", "腹式呼吸 10 次 × 2 组（坐稳，吸气鼓肚子、慢慢呼气）", "股四头肌等长收缩 6 次 × 2 组（膝下垫毛巾卷，膝盖往下压、大腿绷紧 5 秒）", "坐位平衡 5 次（坐稳不扶手，左右轻轻倾斜，坚持 10 秒）"], advance: "进阶判据：痉挛减少、被动屈膝角度比基线增大。" },
  { title: "第 3–4 周 Weeks 3–4", goal: "坐稳、脚能踩地 Sit steadily, feet flat on the floor", items: ["接着做第 1–2 周全部动作", "坐姿伸膝 8 次 × 2 组（勾脚慢慢伸直停 5 秒）", "坐位抬腿 6 次/侧", "床边踩地：坐床边，双脚踩地感受承重（有人扶），每次 30 秒 × 3", "站立床 / 踩秤：须康复治疗师在场，家属不自行操作"], advance: "★ 第 4 周检查点（见下）：达标才进下一阶段；未达标重复本阶段，不进扶站。", checkpoint: true },
  { title: "第 5–6 周 Weeks 5–6", goal: "扶着能站住 Stand with support", items: ["继续前面动作", "扶手坐站训练（坐下—站起）10 次 × 3 组", "原地踏步 10 次", "扶站：双手扶助行器或牢固扶手站立，从 5 分钟起，全程有人搀扶在旁，5–10 分钟", "站立床角度 45°→70°，按治疗师定的角度，不自己调高"], advance: "进阶判据：连续 1 周扶站稳定且无停止信号。" },
  { title: "第 7–8 周 Weeks 7–8", goal: "站稳、能挪小步 Stand steadily, take small steps", items: ["扶站时间延到 10–15 分钟", "站着左右挪重心", "扶着原地小步走", "室内辅助移步：治疗师评估允许后，扶助行器在室内走 5–10 米，每周 2–3 次", "每周测量一次：扶站秒数、膝角度、痉挛次数，交给健康管理师"], advance: "按治疗师判定进阶，不按固定天数。4 周版做到第 4 周检查点即为完整一疗程；8 周版走完四阶段。" },
];

const COG_MENU: { cat: string; en: string; what: string; how: string; mins: string }[] = [
  { cat: "语言·对话", en: "Conversation", what: "聊今天做了什么", how: "开放式提问，不考记忆；说不完整就等着，不替他说", mins: "10 分钟" },
  { cat: "语言·命名", en: "Naming", what: "认常见物品", how: "指着杯子、毛巾问“这是什么”，答不上就告诉他", mins: "5 分钟" },
  { cat: "语言·复述", en: "Repetition", what: "短句跟读", how: "慢慢重复一遍，不纠正口齿", mins: "5 分钟" },
  { cat: "怀旧回忆", en: "Reminiscing", what: "翻老照片讲过去", how: "只问开放式问题（“这是在哪拍的？”），不考记忆", mins: "15–20 分钟" },
  { cat: "手指精细", en: "Fine finger skills", what: "握拳张开、数豆子、拧瓶盖、叠毛巾", how: "顺带完成轻家务", mins: "10 分钟" },
  { cat: "音乐", en: "Music", what: "听年轻时熟悉的歌曲、跟着哼", how: "一起哼，不要求唱准", mins: "15 分钟" },
  { cat: "简单算题", en: "Simple sums", what: "10 以内加减、找零钱游戏", how: "答错不纠正，引导就好", mins: "10 分钟" },
  { cat: "分类配对", en: "Sorting & matching", what: "扑克牌配对、水果图片分类", how: "完不成一起做，不设输赢", mins: "10 分钟" },
];

function ActionTable({ title, note, actions, state, onChange }: {
  title: string; note: string; actions: ExAction[];
  state: Record<string, { done: boolean; actual: string }>;
  onChange: (key: string, v: { done: boolean; actual: string }) => void;
}) {
  return (
    <div>
      <p className="font-bold" style={{ color: TEAL }}>{title}</p>
      <p className="mb-2 text-xs text-[var(--dim)]">{note}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">{T("动作", "Action")}</th><th className="py-2 pr-2">{T("方法", "How")}</th><th className="py-2 pr-2">{T("处方", "Prescribed")}</th><th className="py-2 pr-2">{T("注意", "Caution")}</th><th className="py-2 pr-2">{T("完成", "Done")}</th><th className="py-2">{T("实际", "Actual")}</th></tr></thead>
          <tbody>
            {actions.map((a) => {
              const v = state[a.key] ?? { done: false, actual: "" };
              return (
                <tr key={a.key} className="border-b border-[#f0e9d8]">
                  <td className="py-2 pr-2 font-medium">{T(a.zh, a.en)}</td>
                  <td className="py-2 pr-2">{a.how}</td>
                  <td className="py-2 pr-2 whitespace-nowrap">{a.prescribed}</td>
                  <td className="py-2 pr-2">{a.caution}</td>
                  <td className="py-2 pr-2"><input type="checkbox" aria-label={`Done: ${a.zh}`} className="h-6 w-6" checked={v.done} onChange={(e) => onChange(a.key, { ...v, done: e.target.checked })} /></td>
                  <td className="py-2"><input aria-label={`Actual count for ${a.zh}`} className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm" value={v.actual} onChange={(e) => onChange(a.key, { ...v, actual: e.target.value })} placeholder={T("如 8次", "e.g. 8")} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExerciseEntryForm() {
  const queryClient = useQueryClient();
  const recordsQ = useQuery({ queryKey: ["exerciseRecords"], queryFn: () => api.listExerciseRecords({}) });
  const [date, setDate] = useState(() => dateKeyOf(new Date()));
  type F = { sys: string; dia: string; pulse: string; spo2: string; fever: boolean; actions: Record<string, { done: boolean; actual: string }>; groupA: boolean; groupB: boolean; standingDone: boolean; stopSignal: boolean; totalMinutes: string; discomfort: string };
  const [form, setForm] = useState<F | null>(null);
  const [msg, setMsg] = useState("");
  const rec: ExerciseRecord | undefined = recordsQ.data?.records.find((r) => r.recordDate === date);
  useEffect(() => { setForm(null); setMsg(""); }, [date]);
  useEffect(() => {
    if (form === null && recordsQ.data) {
      setForm({
        sys: strOr(rec?.preSystolic), dia: strOr(rec?.preDiastolic), pulse: strOr(rec?.prePulse), spo2: strOr(rec?.spo2),
        fever: rec?.fever ?? false, actions: rec?.actions ?? {},
        groupA: rec?.groupA ?? false, groupB: rec?.groupB ?? false,
        standingDone: rec?.standingDone ?? false, stopSignal: rec?.stopSignal ?? false,
        totalMinutes: rec ? String(rec.totalMinutes) : "", discomfort: rec?.discomfort ?? "",
      });
    }
  }, [recordsQ.data, form, rec]);
  const save = useMutation({
    mutationFn: async () => {
      const f = form!;
      return await api.saveExerciseRecord({
        recordDate: date,
        preSystolic: numOrNull(f.sys), preDiastolic: numOrNull(f.dia), prePulse: numOrNull(f.pulse), spo2: numOrNull(f.spo2),
        fever: f.fever, groupA: f.groupA, groupB: f.groupB, standingDone: f.standingDone, stopSignal: f.stopSignal,
        totalMinutes: numOrNull(f.totalMinutes) ?? 0, actions: f.actions, discomfort: f.discomfort,
      });
    },
    onSuccess: () => { setMsg(T("已保存。", "Saved.")); void queryClient.invalidateQueries({ queryKey: ["exerciseRecords"] }); },
    onError: (e) => setMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  if (!form) return <p className="py-6 text-center text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p>;
  const sys = numOrNull(form.sys); const dia = numOrNull(form.dia); const ox = numOrNull(form.spo2);
  const reasons: string[] = [];
  if (sys !== null && sys >= 160) reasons.push(`收缩压 ${sys} ≥ 160`);
  if (dia !== null && dia >= 100) reasons.push(`舒张压 ${dia} ≥ 100`);
  if (ox !== null && ox < 92) reasons.push(`血氧 ${ox}% < 92%`);
  if (form.fever) reasons.push("发热 ≥ 37.3℃ 或有感染症状");
  const blocked = reasons.length > 0;
  const checked = sys !== null || dia !== null || ox !== null || form.fever;
  const setAction = (key: string, v: { done: boolean; actual: string }) => setForm({ ...form, actions: { ...form.actions, [key]: v } });
  return (
    <div className="space-y-4">
      <SCard title={T("每日训练打卡", "Daily exercise check-in")}>
        <label className="block max-w-[220px] text-sm font-semibold">{T("日期", "Date")}
          <input aria-label="Exercise record date" type="date" className={INP} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <p className="mb-2 mt-4 font-bold" style={{ color: TEAL }}>{T("训练前先量", "Measure before training")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">{T("血压 收缩压（mmHg）", "BP — systolic (mmHg)")}
            <input aria-label="Pre-training systolic BP" type="number" inputMode="numeric" className={INP} value={form.sys} onChange={(e) => setForm({ ...form, sys: e.target.value })} /></label>
          <label className="block text-sm">{T("血压 舒张压（mmHg）", "BP — diastolic (mmHg)")}
            <input aria-label="Pre-training diastolic BP" type="number" inputMode="numeric" className={INP} value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} /></label>
          <label className="block text-sm">{T("脉搏（次/分）", "Pulse (per minute)")}
            <input aria-label="Pre-training pulse" type="number" inputMode="numeric" className={INP} value={form.pulse} onChange={(e) => setForm({ ...form, pulse: e.target.value })} /></label>
          <label className="block text-sm">{T("血氧 SpO2（%）", "SpO2 (%)")}
            <input {...FIELDS.saveExerciseRecord.spo2} aria-label="Pre-training SpO2" type="number" inputMode="decimal" className={INP} value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} /></label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" aria-label="Fever today" className="h-5 w-5" checked={form.fever} onChange={(e) => setForm({ ...form, fever: e.target.checked })} />{T("今天发热 ≥ 37.3℃ 或有感染症状", "Fever ≥ 37.3 °C or infection signs today")}</label>
        {checked ? (
          blocked ? (
            <p className="mt-3 rounded-lg border-2 p-3 text-sm font-semibold" style={{ borderColor: RED, background: "#fdeceb", color: "#57231e" }}>
              {T(`今天不练 — ${reasons.join("；")}。全日停训，记录下来，并告诉健康管理师。`, `Do not train today — ${reasons.join("; ")}. No training today; note it down and tell the health manager.`)}
            </p>
          ) : (
            <p className="mt-3 rounded-lg p-3 text-sm font-semibold" style={{ background: "#e3efec", color: TEAL }}>
              {T("可以训练 — 训练中出现任何停止信号，立即停下。", "OK to train — stop at once if any stop signal appears.")}
            </p>
          )
        ) : (
          <p className="mt-3 text-sm text-[var(--dim)]">{T("先填训练前血压、脉搏、血氧再决定今天练不练：血压 ≥ 160/100、血氧 < 92%、发热 ≥ 37.3℃ — 任何一条，今天不练。", "Fill in the pre-training numbers first: BP ≥ 160/100, SpO2 < 92%, or fever ≥ 37.3 °C — any one of them means no training today.")}</p>
        )}
      </SCard>
      <SCard>
        <ActionTable title={T("A 组 · 上午主训练（约 25 分钟）", "Group A — morning main session (about 25 minutes)")} note={T("总量约 25 分钟：分 3 小节，每节 8 分钟，节间休息 5 分钟；全程有人扶；坐位为主，全部禁止憋气。", "About 25 minutes in 3 parts of 8 minutes with 5-minute rests; someone alongside throughout; seated; never hold the breath.")}
          actions={ACTIONS_A} state={form.actions} onChange={setAction} />
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <ActionTable title={T("B 组 · 下午轻量（约 15 分钟）", "Group B — afternoon light session (about 15 minutes)")} note={T("约 15 分钟，强度比上午更低，以关节活动度和拉伸为主。", "About 15 minutes, lighter than the morning — joint movement and stretching.")}
            actions={ACTIONS_B} state={form.actions} onChange={setAction} />
        </div>
        <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" aria-label="Group A completed" className="h-5 w-5" checked={form.groupA} onChange={(e) => setForm({ ...form, groupA: e.target.checked })} />{T("A 组完成", "Group A done")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" aria-label="Group B completed" className="h-5 w-5" checked={form.groupB} onChange={(e) => setForm({ ...form, groupB: e.target.checked })} />{T("B 组完成", "Group B done")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" aria-label="Standing practice done" className="h-5 w-5" checked={form.standingDone} onChange={(e) => setForm({ ...form, standingDone: e.target.checked })} />{T("站立进阶今天练了", "Standing practice done")}</label>
            <label className="flex items-center gap-2"><input type="checkbox" aria-label="A stop signal appeared" className="h-5 w-5" checked={form.stopSignal} onChange={(e) => setForm({ ...form, stopSignal: e.target.checked })} />{T("出现停止信号", "A stop signal appeared")}</label>
          </div>
          <label className="block text-sm">{T("当日总时长（分钟）", "Total time today (minutes)")}
            <input {...FIELDS.saveExerciseRecord.totalMinutes} aria-label="Total exercise minutes today" type="number" inputMode="numeric" className={INP} value={form.totalMinutes} onChange={(e) => setForm({ ...form, totalMinutes: e.target.value })} /></label>
        </div>
        <label className="mt-3 block text-sm">{T("不适记录", "Discomfort / anything unusual")}
          <textarea {...FIELDS.saveExerciseRecord.discomfort} aria-label="Discomfort note" className={INP} rows={2} value={form.discomfort} onChange={(e) => setForm({ ...form, discomfort: e.target.value })} placeholder={T("没有就留空。", "None — leave blank.")} />
        </label>
        <button type="button" disabled={save.isPending} className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => save.mutate()}>
          {save.isPending ? T("保存中…", "Saving…") : T("保存训练打卡", "Save exercise record")}
        </button>
        {msg ? <p className="mt-2 text-sm" role="status">{msg}</p> : null}
      </SCard>
    </div>
  );
}

function CognitiveEntryForm() {
  const queryClient = useQueryClient();
  const recordsQ = useQuery({ queryKey: ["cognitiveRecords"], queryFn: () => api.listCognitiveRecords({}) });
  const [date, setDate] = useState(() => dateKeyOf(new Date()));
  type F = { mCat: string; mDone: boolean; mMins: string; aCat: string; aDone: boolean; aMins: string; differentOk: boolean; mood: string; response: string };
  const [form, setForm] = useState<F | null>(null);
  const [msg, setMsg] = useState("");
  const rec: CognitiveRecord | undefined = recordsQ.data?.records.find((r) => r.recordDate === date);
  useEffect(() => { setForm(null); setMsg(""); }, [date]);
  useEffect(() => {
    if (form === null && recordsQ.data) {
      setForm({
        mCat: rec?.morningCategory ?? "", mDone: rec?.morningDone ?? false, mMins: rec ? String(rec.morningMinutes) : "",
        aCat: rec?.afternoonCategory ?? "", aDone: rec?.afternoonDone ?? false, aMins: rec ? String(rec.afternoonMinutes) : "",
        differentOk: rec?.differentOk ?? false, mood: rec?.mood ?? "", response: rec?.response ?? "",
      });
    }
  }, [recordsQ.data, form, rec]);
  const save = useMutation({
    mutationFn: async () => {
      const f = form!;
      return await api.saveCognitiveRecord({
        recordDate: date,
        morningCategory: f.mCat, morningDone: f.mDone, morningMinutes: numOrNull(f.mMins) ?? 0,
        afternoonCategory: f.aCat, afternoonDone: f.aDone, afternoonMinutes: numOrNull(f.aMins) ?? 0,
        differentOk: f.differentOk, mood: f.mood, response: f.response,
      });
    },
    onSuccess: () => { setMsg(T("已保存。", "Saved.")); void queryClient.invalidateQueries({ queryKey: ["cognitiveRecords"] }); },
    onError: (e) => setMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  if (!form) return <p className="py-6 text-center text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p>;
  const catOptions = (v: string, label: string) => (
    <select aria-label={label} className={SEL} value={v} onChange={(e) => setForm({ ...form, ...(label.includes("Morning") ? { mCat: e.target.value } : { aCat: e.target.value }) })}>
      <option value="">{T("— 选类别 —", "— Pick a category —")}</option>
      {COG_MENU.map((c) => (<option key={c.cat} value={c.cat}>{T(c.cat, c.en)}</option>))}
    </select>
  );
  return (
    <SCard title={T("每日两段打卡 — 上午 ① / 下午 ②", "Two sessions a day — morning ① / afternoon ②")}>
      <label className="block max-w-[220px] text-sm font-semibold">{T("日期", "Date")}
        <input aria-label="Cognitive record date" type="date" className={INP} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="mb-2 font-bold" style={{ color: TEAL }}>{T("上午 ①", "Morning session")}</p>
          <label className="block text-sm">{T("类别", "Category")}{catOptions(form.mCat, "Morning category")}</label>
          <div className="mt-2 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" aria-label="Morning session done" className="h-5 w-5" checked={form.mDone} onChange={(e) => setForm({ ...form, mDone: e.target.checked })} />{T("完成", "Done")}</label>
            <label className="block flex-1 text-sm">{T("实际时长（分钟）", "Minutes")}
              <input aria-label="Morning session minutes" type="number" inputMode="numeric" className={INP} value={form.mMins} onChange={(e) => setForm({ ...form, mMins: e.target.value })} /></label>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3">
          <p className="mb-2 font-bold" style={{ color: TEAL }}>{T("下午 ②", "Afternoon session")}</p>
          <label className="block text-sm">{T("类别", "Category")}{catOptions(form.aCat, "Afternoon category")}</label>
          <div className="mt-2 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" aria-label="Afternoon session done" className="h-5 w-5" checked={form.aDone} onChange={(e) => setForm({ ...form, aDone: e.target.checked })} />{T("完成", "Done")}</label>
            <label className="block flex-1 text-sm">{T("实际时长（分钟）", "Minutes")}
              <input aria-label="Afternoon session minutes" type="number" inputMode="numeric" className={INP} value={form.aMins} onChange={(e) => setForm({ ...form, aMins: e.target.value })} /></label>
          </div>
        </div>
      </div>
      {form.mCat && form.aCat && form.mCat === form.aCat ? (
        <p className="mt-3 rounded-lg p-3 text-sm font-semibold" style={{ background: "#fbf3d9", color: "#7a5b12" }}>{T("两段选了同一类 — 换一段不一样的，两段不重样记得更牢。", "Both sessions are the same category — pick a different one for the afternoon; the two sessions should not repeat.")}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" aria-label="Two sessions were different" className="h-5 w-5" checked={form.differentOk} onChange={(e) => setForm({ ...form, differentOk: e.target.checked })} />{T("两段不重样确认", "The two sessions were different")}</label>
        <label className="block text-sm">{T("情绪 / 配合度", "Mood & cooperation")}
          <select aria-label="Mood and cooperation" className={SEL} value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}>
            <option value="">{T("— 未填 —", "— Not yet —")}</option><option value="平稳">{T("平稳", "Calm")}</option><option value="烦躁">{T("烦躁 — 立即停止", "Restless — stop at once")}</option><option value="淡漠">{T("淡漠", "Flat")}</option>
          </select></label>
      </div>
      <label className="mt-3 block text-sm">{T("反应记一下 — 一句话就好", "Response — one sentence is plenty")}
        <input {...FIELDS.saveCognitiveRecord.response} aria-label="Response note" className={INP} value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} placeholder={T("如：看到年轻时的照片很开心，聊了很久", "e.g. happy to see photos from younger days, talked for a long time")} />
      </label>
      <button type="button" disabled={save.isPending} className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => save.mutate()}>
        {save.isPending ? T("保存中…", "Saving…") : T("保存动脑打卡", "Save brain-training record")}
      </button>
      {msg ? <p className="mt-2 text-sm" role="status">{msg}</p> : null}
    </SCard>
  );
}

/* Weekly execution rates, computed from the real entries: the Today
   checklist ticks (25 items a day), the exercise check-ins and the
   brain-training check-ins. Denominator is Monday → today, so future
   days never drag the rate down. */
function WeekExecutionPanel({ exRecords, cogRecords }: { exRecords: ExerciseRecord[]; cogRecords: CognitiveRecord[] }) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKeyOf(today);
  const monday = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }, [today]);
  const weekDays = useMemo(() => {
    const out: { key: string; label: string }[] = [];
    const labels = LANG === "zh" ? ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(d.getDate() + i);
      out.push({ key: dateKeyOf(d), label: labels[i]! });
    }
    return out;
  }, [monday]);
  const fromKey = weekDays[0]!.key;
  const toKey = weekDays[6]!.key;
  const ticksQ = useQuery({ queryKey: ["careWeekTicks", fromKey, toKey], queryFn: () => api.getCareWeekTicks({ from: fromKey, to: toKey }) });

  const elapsed = weekDays.filter((d) => d.key <= todayKey);
  const doneByDay = new Map<string, number>();
  for (const t of ticksQ.data?.ticks ?? []) {
    if (t.done) doneByDay.set(t.careDate, (doneByDay.get(t.careDate) ?? 0) + 1);
  }
  const totalDone = elapsed.reduce((a, d) => a + (doneByDay.get(d.key) ?? 0), 0);
  const totalPossible = CARE_ITEMS.length * elapsed.length;
  const checklistRate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  const exDays = new Set(exRecords.filter((r) => r.recordDate >= fromKey && r.recordDate <= todayKey && (r.groupA || r.groupB || r.standingDone)).map((r) => r.recordDate)).size;
  const brainDays = new Set(cogRecords.filter((r) => r.recordDate >= fromKey && r.recordDate <= todayKey && r.morningDone && r.afternoonDone).map((r) => r.recordDate)).size;
  const exRate = elapsed.length > 0 ? Math.round((exDays / elapsed.length) * 100) : 0;
  const brainRate = elapsed.length > 0 ? Math.round((brainDays / elapsed.length) * 100) : 0;
  const hasAny = totalDone > 0 || exDays > 0 || brainDays > 0;

  const rateRow = (zh: string, en: string, rate: number, detail: string) => (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{T(zh, en)}</span>
        <span className="font-bold" style={{ color: TEAL }}>{rate}%</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[var(--surface-alt)]">
        <div className="h-full rounded-full" style={{ width: `${rate}%`, background: TEAL }} />
      </div>
      <p className="mt-0.5 text-xs text-[var(--dim)]">{detail}</p>
    </div>
  );

  return (
    <SCard title={T("本周执行率 — 按真实记录自动计算", "This week's execution — computed from the real records")}>
      {ticksQ.isPending ? <p className="text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p> : !hasAny ? (
        <p className="text-sm text-[var(--dim)]">{T("本周还没有记录。在「今日」清单打勾、或保存运动 / 动脑打卡后，这里会自动算出本周执行率。", "No records yet this week — tick the Today checklist or save exercise / brain-training check-ins and the rates appear here automatically.")}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((d) => {
              const done = doneByDay.get(d.key) ?? 0;
              const future = d.key > todayKey;
              return (
                <div key={d.key} className="rounded-lg border border-[var(--border)] px-1 py-2 text-center" style={d.key === todayKey ? { borderColor: TEAL, background: "#e3efec" } : undefined}>
                  <p className="text-[11px] font-semibold">{d.label}</p>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: future ? "var(--dim)" : TEAL }}>{future ? "—" : `${done}/${CARE_ITEMS.length}`}</p>
                  <p className="text-[11px] text-[var(--dim)]">{d.key.slice(5)}</p>
                </div>
              );
            })}
          </div>
          {rateRow("清单执行率", "Checklist", checklistRate, T(`周一到今天共完成 ${totalDone} / ${totalPossible} 项`, `${totalDone} of ${totalPossible} items done, Monday to today`))}
          {rateRow("运动执行", "Exercise", exRate, T(`本周已练 ${exDays} 天（坐位 A/B 组或站立，任一完成即算）`, `Trained on ${exDays} day(s) this week`))}
          {rateRow("动脑执行", "Brain training", brainRate, T(`本周两段都完成 ${brainDays} 天`, `Both sessions done on ${brainDays} day(s) this week`))}
          <div className="rounded-lg bg-[var(--surface-alt)] p-3 text-sm">
            <p className="font-bold" style={{ color: TEAL }}>{T("本周小结 — 给健康管理师", "Weekly summary — for the health manager")}</p>
            <p className="mt-1">{T(`${fromKey} 至 ${toKey}：清单执行率 ${checklistRate}%（${totalDone}/${totalPossible} 项），运动 ${exDays} 天，动脑 ${brainDays} 天。这份小结周日晚发给健康管理师，数字全部来自本周的真实记录。`, `${fromKey} to ${toKey}: checklist ${checklistRate}% (${totalDone}/${totalPossible} items), exercise on ${exDays} day(s), brain training on ${brainDays} day(s). Sent to the health manager on Sunday evening; every number comes from this week's real records.`)}</p>
          </div>
        </div>
      )}
    </SCard>
  );
}

export function ExerciseBrainTab() {
  const [sub, setSub] = useState<"standing" | "seated" | "brain" | "records">("standing");
  const exQ = useQuery({ queryKey: ["exerciseRecords"], queryFn: () => api.listExerciseRecords({}) });
  const cogQ = useQuery({ queryKey: ["cognitiveRecords"], queryFn: () => api.listCognitiveRecords({}) });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>{T("运动与认知", "Exercise & Brain")}</h2>
        <Dismissible className="pr-8"><p className="text-sm text-[var(--dim)]">{T("站立进阶是核心，坐位 A/B 组照常做，动脑每天两段。练之前先量血压、脉搏、血氧；站立床、助行器站立、负重必须有康复治疗师在场，家属只做床上和坐位的安全动作。", "The standing progression is the core plan, the seated A/B groups run alongside, and brain training happens twice a day. Measure BP, pulse and SpO2 before training; standing-bed, walker-standing and weight-bearing work only ever happens with the rehab therapist present.")}</p></Dismissible>
      </div>
      <div className="rounded-xl border-2 p-4" style={{ borderColor: AMBER, background: "#fdf6dd", color: "#5c4a10" }}>
        <p className="font-bold">{T("练之前先过这一关", "Before any training, pass this check")}</p>
        <p className="mt-1 text-sm">{T(<>训练前血压 ≥ 160/100、血氧 &lt; 92%、发热 ≥ 37.3℃ 或有感染症状 — 任何一条，<strong>今天不练</strong>。训练中出现停止信号（胸闷、心慌、气短、头晕、出冷汗、说话断句变短）立即停下坐下休息。</>, <>Pre-training BP ≥ 160/100, SpO2 &lt; 92%, fever ≥ 37.3 °C or infection signs — any one means <strong>no training today</strong>. A stop signal during training means stop and sit down at once.</>)}</p>
      </div>
      <SSubTabs label="Exercise and brain sections" value={sub} onChange={setSub} tabs={[
        { key: "standing", zh: "站立进阶", en: "Standing progression" },
        { key: "seated", zh: "坐位 A/B 组", en: "Seated A/B + check-in" },
        { key: "brain", zh: "动脑训练", en: "Brain training" },
        { key: "records", zh: "训练记录", en: "Records" },
      ]} />
      {sub === "standing" ? (
        <div className="space-y-4">
          {STANDING_PHASES.map((p) => (
            <SCard key={p.title} title={`${L(p.title)} — ${L(p.goal)}`}>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {p.items.map((it) => (<li key={it}>{it}</li>))}
              </ul>
              <p className="mt-2 rounded-lg p-3 text-sm font-semibold" style={p.checkpoint ? { background: "#fbf3d9", color: "#7a5b12" } : { background: "#e3efec", color: TEAL }}>{p.advance}</p>
              {p.checkpoint ? <p className="mt-2 text-sm text-[var(--dim)]">{T("检查点由康复治疗师判定，在「团队录入 → 团队表单 → 第 4 周检查点」里记录：膝角度比第 0 天增大、痉挛减少、坐位稳、双脚能踩地。", "The therapist records the verdict under Staff entry → Team forms → Week-4 checkpoint: knee angle up from Day 0, fewer spasms, steady sitting, feet flat on the floor.")}</p> : null}
            </SCard>
          ))}
          <RedFlagBox />
        </div>
      ) : null}
      {sub === "seated" ? <ExerciseEntryForm /> : null}
      {sub === "brain" ? (
        <div className="space-y-4">
          <SCard title={T("认知与语言菜单", "Cognitive & language menu")}>
            <Dismissible className="pr-8"><p className="mb-2 text-sm text-[var(--dim)]">{T("每天两段：上午一段、下午一段，两段不重样。不考记忆、不设输赢、不催促；做不完不勉强。目标是保持现有的交流能力。情绪明显烦躁时停止，改为听音乐或安静陪伴。", "Two sessions a day, different content each time. No memory tests, no winning or losing, no hurrying. The goal is to keep today's communication ability. Stop if the person becomes clearly restless.")}</p></Dismissible>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">{T("类别", "Category")}</th><th className="py-2 pr-2">{T("今天做什么", "Activity")}</th><th className="py-2 pr-2">{T("怎么做", "How")}</th><th className="py-2">{T("多久", "Duration")}</th></tr></thead>
                <tbody>
                  {COG_MENU.map((c) => (
                    <tr key={c.cat} className="border-b border-[#f0e9d8]">
                      <td className="py-2 pr-2 font-medium">{T(c.cat, c.en)}</td>
                      <td className="py-2 pr-2">{c.what}</td>
                      <td className="py-2 pr-2">{c.how}</td>
                      <td className="py-2 whitespace-nowrap">{c.mins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SCard>
          <CognitiveEntryForm />
        </div>
      ) : null}
      {sub === "records" ? (
        <div className="space-y-4">
          <WeekExecutionPanel exRecords={exQ.data?.records ?? []} cogRecords={cogQ.data?.records ?? []} />
          <SCard title={T("运动打卡记录", "Exercise records")}>
            {(exQ.data?.records.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--dim)]">{T("还没有训练记录。在「坐位 A/B 组」里填好每日训练打卡并保存，就会显示在这里。", "No exercise records yet — save a daily check-in on the Seated A/B sub-tab and it will appear here.")}</p>
            ) : (
              <div className="space-y-2">
                {exQ.data!.records.map((r) => (
                  <div key={r.recordDate} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                    <p className="font-semibold">{r.recordDate}
                      <span className="ml-2 font-normal text-[var(--dim)]">{T("训练前：", "Before: ")}{r.preSystolic != null && r.preDiastolic != null ? T(`血压 ${r.preSystolic}/${r.preDiastolic}`, `BP ${r.preSystolic}/${r.preDiastolic}`) : T("血压未填", "BP not filled")}{r.prePulse != null ? T(` · 脉搏 ${r.prePulse}`, ` · pulse ${r.prePulse}`) : ""}{r.spo2 != null ? ` · SpO2 ${r.spo2}%` : ""}{r.fever ? T(" · 发热", " · fever") : ""}</span>
                    </p>
                    <p className="mt-1">{T(`A 组 ${r.groupA ? "✓ 完成" : "—"} · B 组 ${r.groupB ? "✓ 完成" : "—"} · 站立进阶 ${r.standingDone ? "✓ 练了" : "—"} · 总时长 ${r.totalMinutes} 分钟`, `Group A ${r.groupA ? "✓ done" : "—"} · Group B ${r.groupB ? "✓ done" : "—"} · Standing ${r.standingDone ? "✓ done" : "—"} · Total ${r.totalMinutes} minutes`)}
                      {r.stopSignal ? <span className="ml-2 font-bold" style={{ color: RED }}>{T("出现停止信号", "Stop signal appeared")}</span> : null}
                    </p>
                    {r.discomfort ? <p className="mt-1 text-[var(--dim)]">{T("不适：", "Discomfort: ")}{r.discomfort}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </SCard>
          <SCard title={T("动脑打卡记录", "Brain-training records")}>
            {(cogQ.data?.records.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--dim)]">{T("还没有动脑记录。在「动脑训练」里保存每日两段打卡，就会显示在这里。", "No brain-training records yet — save the two daily sessions on the Brain training sub-tab.")}</p>
            ) : (
              <div className="space-y-2">
                {cogQ.data!.records.map((r) => (
                  <div key={r.recordDate} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                    <p className="font-semibold">{r.recordDate}{r.mood ? <span className="ml-2 font-normal text-[var(--dim)]">{T("情绪 ", "Mood ")}{L(r.mood)}</span> : null}</p>
                    <p className="mt-1">{T(`上午 ① ${r.morningCategory ? L(r.morningCategory) : "—"} ${r.morningDone ? `✓ ${r.morningMinutes} 分钟` : "未完成"} · 下午 ② ${r.afternoonCategory ? L(r.afternoonCategory) : "—"} ${r.afternoonDone ? `✓ ${r.afternoonMinutes} 分钟` : "未完成"}${r.differentOk ? " · 两段不重样 ✓" : ""}`, `Morning ① ${r.morningCategory ? L(r.morningCategory) : "—"} ${r.morningDone ? `✓ ${r.morningMinutes} min` : "not done"} · Afternoon ② ${r.afternoonCategory ? L(r.afternoonCategory) : "—"} ${r.afternoonDone ? `✓ ${r.afternoonMinutes} min` : "not done"}${r.differentOk ? " · two different ✓" : ""}`)}</p>
                    {r.response ? <p className="mt-1 text-[var(--dim)]">{T("反应：", "Response: ")}{r.response}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </SCard>
          <CatchupFiledList area="exercise" />
        </div>
      ) : null}
    </div>
  );
}

/* ================= Medications & Labs 用药与化验 =================
   Two brand-new screens from the sitemap. The medication list and the lab
   schedule start EMPTY — Helen will provide the real prescription and the
   blood-work schedule later; nothing is invented here. */
const MED_FREQUENCIES = ["每天一次 Once a day", "每天两次 Twice a day", "每天三次 Three times a day", "每隔一天 Every other day", "每周一次 Once a week", "每月一次 Once a month", "每两个月一次 Every two months", "按需 When needed"];
const MED_TIMES = ["早上（早餐时）Morning, with breakfast", "中午（午餐时）Midday, with lunch", "晚上（晚餐时）Evening, with dinner", "睡前 Bedtime", "早上＋晚上 Morning & evening"];
const LAB_FREQUENCIES = ["每周 Weekly", "每月 Monthly", "每季度 Every 3 months", "每年 Yearly", "按需 When arranged"];

/* One attachment per medication / lab entry, three ways to upload:
   a JPG/PNG photo (of the paper document, or of a PDF on screen), the PDF
   file itself, or an Excel file (.xls/.xlsx). The family uploads; the nurse
   or doctor reads it and types the values in; it stays as the source. */
type PendingUpload = { dataBase64: string; mimeType: string; fileName: string };
type AttachmentInfo = { fileKind?: string; fileName?: string; photoUrl?: string | null };

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", pdf: "application/pdf",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
function kindOfMime(mimeType: string): "photo" | "pdf" | "excel" | null {
  if (mimeType === "image/jpeg" || mimeType === "image/png") return "photo";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.ms-excel" || mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "excel";
  return null;
}

function AttachmentBox({ kind, name, url, large }: { kind: string; name: string; url: string; large?: boolean }) {
  const size = large ? "h-20 w-20" : "h-16 w-16";
  if (kind === "photo" && url) return <img src={url} alt={name || T("附件", "Attachment")} className={`${size} shrink-0 rounded-lg border border-[var(--border)] object-cover`} />;
  return (
    <div className={`flex ${size} shrink-0 flex-col items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-1 text-center`}>
      <span className="text-xs font-bold" style={{ color: TEAL }}>{kind === "pdf" ? "PDF" : kind === "excel" ? "Excel" : T("文件", "File")}</span>
      <span className="mt-0.5 w-full truncate text-[9px] text-[var(--dim)]">{name}</span>
    </div>
  );
}

function UploadField({ heading, hint, existing, upload, preview, removed, setUpload, setPreview, setRemoved, setErr, disabled }: {
  heading: string; hint: string;
  existing: AttachmentInfo | null;
  upload: PendingUpload | null; preview: string; removed: boolean;
  setUpload: (u: PendingUpload | null) => void; setPreview: (s: string) => void; setRemoved: (b: boolean) => void; setErr: (s: string) => void;
  disabled?: boolean;
}) {
  const shown = upload
    ? { kind: kindOfMime(upload.mimeType) ?? "", name: upload.fileName, url: preview }
    : (!removed && existing?.fileKind ? { kind: existing.fileKind, name: existing.fileName ?? "", url: existing.photoUrl ?? "" } : null);
  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <p className="text-sm">{heading}</p>
      <p className="mt-0.5 text-xs text-[var(--dim)]">{T("三种方式选一种：① 照片（JPG/PNG — 拍纸质的，或拍屏幕上的 PDF）② PDF 文件 ③ Excel 文件（.xls / .xlsx）。", "Three ways, pick one: a photo (JPG/PNG — of the paper, or of the PDF on screen), the PDF file itself, or an Excel file (.xls/.xlsx).")}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        {shown ? <AttachmentBox kind={shown.kind} name={shown.name} url={shown.url} large /> : null}
        {disabled ? <p className="rounded-lg bg-[#fbf3d9] p-2 text-xs">{T("生活管家不上传文件 — 生活管家只负责每日照护和喂药打勾；处方和报告由家人或团队成员（健康管理师、营养师、康复师、心理咨询师、档案录入员）上传。", "The care butler does not upload files — the care butler ticks off daily care and doses. Uploads are done by family or a care team member (health manager, dietitian, rehab therapist, psychologist, records clerk).")}</p> : null}
        {!disabled ? <input type="file" accept="image/jpeg,image/png,.pdf,.xls,.xlsx" aria-label={heading} className="text-sm"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
            const mime = kindOfMime(file.type) ? file.type : (EXT_MIME[ext] ?? "");
            if (!kindOfMime(mime)) { setErr(T("只能传照片（JPG/PNG）、PDF 或 Excel 文件。", "Only a JPG/PNG photo, a PDF, or an Excel file.")); return; }
            const enc = await fileToBase64(file);
            setUpload({ dataBase64: enc.dataBase64, mimeType: mime, fileName: file.name });
            setPreview(kindOfMime(mime) === "photo" ? URL.createObjectURL(file) : "");
            setRemoved(false);
          }} /> : null}
        {shown && !disabled ? <button type="button" className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: RED, color: RED }} onClick={() => { setUpload(null); setPreview(""); setRemoved(true); }}>{T("移除附件", "Remove attachment")}</button> : null}
      </div>
      {shown && shown.kind !== "photo" ? <p className="mt-1 text-xs text-[var(--dim)]">{T("已附文件：", "Attached file: ")}{shown.name}</p> : null}
      <p className="mt-1 text-xs text-[var(--dim)]">{hint}</p>
    </div>
  );
}

type MedFormState = { drugName: string; dose: string; frequency: string; timeOfDay: string; startDate: string; endDate: string; prescribedBy: string; notes: string; missedAction: string; active: boolean; photoUrl?: string | null; fileName?: string; fileKind?: string; enteredBy?: string };
const EMPTY_MED: MedFormState = { drugName: "", dose: "", frequency: "", timeOfDay: "", startDate: "", endDate: "", prescribedBy: "", notes: "", missedAction: "", active: true, enteredBy: "" };

function EnteredByField({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  if (options.length === 0) return null;
  return (
    <label className="block text-sm">{T("录入人（姓名 + 角色）", "Entered by (name + role)")}
      <select aria-label="Entered by" className={SEL} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </label>
  );
}
function byOptionsFor(current: string | undefined, defaultBy: string, people: string[]): string[] {
  return Array.from(new Set([defaultBy, ...people, current ?? ""].filter((x) => x !== "")));
}

function MedicationForm({ initial, onSaved, people, defaultBy, canUpload }: { initial: MedFormState; onSaved: () => void; people: string[]; defaultBy: string; canUpload: boolean }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState<MedFormState>(initial);
  const [err, setErr] = useState("");
  const [upload, setUpload] = useState<PendingUpload | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadRemoved, setUploadRemoved] = useState(false);
  useEffect(() => { setF(initial); setErr(""); setUpload(null); setUploadPreview(""); setUploadRemoved(false); }, [initial]);
  const save = useMutation({
    mutationFn: async (payload: Parameters<typeof api.saveMedication>[0]) => await api.saveMedication(payload),
    onSuccess: () => { setUpload(null); setUploadPreview(""); setUploadRemoved(false); void queryClient.invalidateQueries({ queryKey: ["medications"] }); onSaved(); },
    onError: (e) => setErr(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  const editingId = (initial as MedFormState & { id?: number }).id;
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!f.drugName.trim()) { setErr(T("请先填写药名。", "Please enter the medicine name first.")); return; }
      const { photoUrl: _p, fileName: _fn, fileKind: _fk, ...fields } = f;
      save.mutate({ ...(editingId ? { id: editingId } : {}), ...fields, enteredBy: f.enteredBy || defaultBy, upload, removeUpload: uploadRemoved });
    }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block text-sm">{T("药名 *", "Medicine name *")}
        <input {...FIELDS.saveMedication.drugName} aria-label="Medicine name" className={INP} value={f.drugName} onChange={(e) => setF({ ...f, drugName: e.target.value })} placeholder={T("照药盒/处方填写", "Exactly as on the prescription")} /></label>
      <label className="block text-sm">{T("剂量（每次吃多少）", "Dose (how much each time)")}
        <input {...FIELDS.saveMedication.dose} aria-label="Dose" className={INP} value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} placeholder={T("如：1 片 / 20 mg", "e.g. 1 tablet / 20 mg")} /></label>
      <label className="block text-sm">{T("频次", "How often")}
        <select aria-label="Frequency" className={SEL} value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })}>
          <option value="">{T("— 选择 —", "— Pick —")}</option>
          {MED_FREQUENCIES.map((x) => (<option key={x} value={x}>{L(x)}</option>))}
        </select></label>
      <label className="block text-sm">{T("时间（和吃饭对上）", "Time of day (tied to meals)")}
        <select aria-label="Time of day" className={SEL} value={f.timeOfDay} onChange={(e) => setF({ ...f, timeOfDay: e.target.value })}>
          <option value="">{T("— 选择 —", "— Pick —")}</option>
          {MED_TIMES.map((x) => (<option key={x} value={x}>{L(x)}</option>))}
        </select></label>
      <label className="block text-sm">{T("开始日期", "Start date")}
        <input {...FIELDS.saveMedication.startDate} aria-label="Start date" type="date" className={INP} value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></label>
      <label className="block text-sm">{T("结束日期（长期吃就留空）", "End date (leave blank if long-term)")}
        <input {...FIELDS.saveMedication.endDate} aria-label="End date" type="date" className={INP} value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></label>
      <label className="block text-sm">{T("开药医生", "Prescribed by")}
        <input {...FIELDS.saveMedication.prescribedBy} aria-label="Prescribed by" className={INP} value={f.prescribedBy} onChange={(e) => setF({ ...f, prescribedBy: e.target.value })} /></label>
      <label className="block text-sm">{T("注意事项", "Notes")}
        <input {...FIELDS.saveMedication.notes} aria-label="Medication notes" className={INP} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder={T("如：和饭一起吃", "e.g. take with food")} /></label>
      <label className="block text-sm">{T("漏了怎么办（按医嘱事先写好）", "If a dose is missed (written in advance, per the doctor)")}
        <input {...FIELDS.saveMedication.missedAction} aria-label="If a dose is missed" className={INP} value={f.missedAction} onChange={(e) => setF({ ...f, missedAction: e.target.value })} placeholder={T("如：想起来时补吃；接近下一次就跳过", "e.g. take it when remembered; skip if near the next dose")} /></label>
      <EnteredByField value={f.enteredBy || defaultBy} options={byOptionsFor(f.enteredBy, defaultBy, people)} onChange={(v) => setF({ ...f, enteredBy: v })} />
      <UploadField
        heading={T("处方附件（家人或团队成员上传）", "Prescription attachment (family or care team uploads)")}
        hint={T("档案录入员照着附件，把药名、剂量、频次、时间、开药医生录清楚；涉及用药的问题，由合作会诊医师书面确认。附件就留在这条记录旁边，是药单的出处。", "The records clerk reads the attachment and types in the name, dose, frequency, times and prescriber; medicine questions are confirmed in writing by the consulting physician. The attachment stays with the entry as the source.")}
        existing={initial}
        upload={upload} preview={uploadPreview} removed={uploadRemoved}
        setUpload={setUpload} setPreview={setUploadPreview} setRemoved={setUploadRemoved} setErr={setErr}
        disabled={!canUpload}
      />
      <div className="flex items-end gap-3 pb-1">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" aria-label="Still taking this medicine" className="h-5 w-5" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />{T("正在吃", "Active")}</label>
        <button type="submit" disabled={save.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: TEAL }}>
          {save.isPending ? T("保存中…", "Saving…") : editingId ? T("保存修改", "Save changes") : T("加到药单", "Add to the list")}
        </button>
      </div>
      {err ? <p className="text-sm sm:col-span-2 lg:col-span-3" role="alert" style={{ color: RED }}>{err}</p> : null}
    </form>
  );
}

type LabFormState = { testName: string; frequency: string; nextDue: string; lastResult: string; abnormal: boolean; doctorNote: string; photoUrl?: string | null; fileName?: string; fileKind?: string; enteredBy?: string };
const EMPTY_LAB: LabFormState = { testName: "", frequency: "", nextDue: "", lastResult: "", abnormal: false, doctorNote: "", enteredBy: "" };

function LabCheckForm({ initial, onSaved, people, defaultBy, canUpload }: { initial: LabFormState; onSaved: () => void; people: string[]; defaultBy: string; canUpload: boolean }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState<LabFormState>(initial);
  const [err, setErr] = useState("");
  const [upload, setUpload] = useState<PendingUpload | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadRemoved, setUploadRemoved] = useState(false);
  useEffect(() => { setF(initial); setErr(""); setUpload(null); setUploadPreview(""); setUploadRemoved(false); }, [initial]);
  const save = useMutation({
    mutationFn: async (payload: Parameters<typeof api.saveLabCheck>[0]) => await api.saveLabCheck(payload),
    onSuccess: () => { setUpload(null); setUploadPreview(""); setUploadRemoved(false); void queryClient.invalidateQueries({ queryKey: ["labChecks"] }); onSaved(); },
    onError: (e) => setErr(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  const editingId = (initial as LabFormState & { id?: number }).id;
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!f.testName.trim()) { setErr(T("请先填写检查项目。", "Please enter the test name first.")); return; }
      const { photoUrl: _p, fileName: _fn, fileKind: _fk, ...fields } = f;
      save.mutate({ ...(editingId ? { id: editingId } : {}), ...fields, enteredBy: f.enteredBy || defaultBy, upload, removeUpload: uploadRemoved });
    }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block text-sm">{T("检查项目 *", "Test *")}
        <input {...FIELDS.saveLabCheck.testName} aria-label="Test name" className={INP} value={f.testName} onChange={(e) => setF({ ...f, testName: e.target.value })} placeholder={T("如：血常规、生化、BNP、超声心动图", "e.g. full blood count, biochemistry, BNP, echocardiogram")} /></label>
      <label className="block text-sm">{T("频次", "How often")}
        <select aria-label="Lab frequency" className={SEL} value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value })}>
          <option value="">{T("— 选择 —", "— Pick —")}</option>
          {LAB_FREQUENCIES.map((x) => (<option key={x} value={x}>{L(x)}</option>))}
        </select></label>
      <label className="block text-sm">{T("下次日期", "Next due")}
        <input {...FIELDS.saveLabCheck.nextDue} aria-label="Next due date" type="date" className={INP} value={f.nextDue} onChange={(e) => setF({ ...f, nextDue: e.target.value })} /></label>
      <label className="block text-sm">{T("最近结果", "Latest result")}
        <input {...FIELDS.saveLabCheck.lastResult} aria-label="Latest result" className={INP} value={f.lastResult} onChange={(e) => setF({ ...f, lastResult: e.target.value })} placeholder={T("数值＋日期", "Value + date")} /></label>
      <label className="block text-sm">{T("医生意见", "Doctor's follow-up")}
        <input {...FIELDS.saveLabCheck.doctorNote} aria-label="Doctor's follow-up note" className={INP} value={f.doctorNote} onChange={(e) => setF({ ...f, doctorNote: e.target.value })} /></label>
      <EnteredByField value={f.enteredBy || defaultBy} options={byOptionsFor(f.enteredBy, defaultBy, people)} onChange={(v) => setF({ ...f, enteredBy: v })} />
      <UploadField
        heading={T("化验报告附件（家人或团队成员上传）", "Lab report attachment (family or care team uploads)")}
        hint={T("化验结果多是 PDF 或纸质报告。档案录入员照着附件，把项目、数值、日期、哪家实验室录清楚；附件就留在这条记录旁边，是数值的出处。", "Lab results usually arrive as a PDF or on paper. The records clerk reads the attachment and types in the test, the value, the date and which lab; the attachment stays with the entry as the source.")}
        existing={initial}
        upload={upload} preview={uploadPreview} removed={uploadRemoved}
        setUpload={setUpload} setPreview={setUploadPreview} setRemoved={setUploadRemoved} setErr={setErr}
        disabled={!canUpload}
      />
      <div className="flex items-end gap-3 pb-1">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" aria-label="Latest result was abnormal" className="h-5 w-5" checked={f.abnormal} onChange={(e) => setF({ ...f, abnormal: e.target.checked })} />{T("结果异常", "Abnormal")}</label>
        <button type="submit" disabled={save.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: TEAL }}>
          {save.isPending ? T("保存中…", "Saving…") : editingId ? T("保存修改", "Save changes") : T("加到安排", "Add to schedule")}
        </button>
      </div>
      {err ? <p className="text-sm sm:col-span-2 lg:col-span-3" role="alert" style={{ color: RED }}>{err}</p> : null}
    </form>
  );
}

/* ================= Catch-up entries 补录中心 — shared labels & filed lists =================
   One record, two doors: an item filed on the Catch-up entries page is
   stored once (catchup_entries) and the destination screens below read the
   same rows filtered by link area — nothing is copied. */
export const CATCHUP_TYPES: { key: string; zh: string; en: string; area: string }[] = [
  { key: "prescription", zh: "处方", en: "Prescription", area: "meds" },
  { key: "lab", zh: "化验报告", en: "Lab report", area: "meds" },
  { key: "care", zh: "每日照护单", en: "Daily care sheet", area: "today" },
  { key: "exercise", zh: "运动记录", en: "Exercise record", area: "exercise" },
  { key: "nutrition", zh: "营养记录", en: "Nutrition record", area: "exercise" },
  { key: "sleep", zh: "睡眠记录", en: "Sleep record", area: "today" },
  { key: "brain", zh: "动脑训练记录", en: "Brain-training record", area: "exercise" },
  { key: "assessment", zh: "评估表", en: "Assessment form", area: "record" },
  { key: "opinion", zh: "医师书面意见", en: "Physician's written opinion", area: "record" },
  { key: "other", zh: "其他", en: "Other", area: "record" },
];
export const CATCHUP_AREAS: { key: string; zh: string; en: string; tab: string }[] = [
  { key: "meds", zh: "用药与化验", en: "Medications & Labs", tab: "meds" },
  { key: "exercise", zh: "运动与认知", en: "Exercise & Brain", tab: "exercise" },
  { key: "today", zh: "今日打卡", en: "Today check-in", tab: "today" },
  { key: "record", zh: "患者档案", en: "Patient record", tab: "record" },
  { key: "entry", zh: "团队录入", en: "Staff entry", tab: "entry" },
];
export function catchupTypeLabel(key: string): string {
  const t = CATCHUP_TYPES.find((x) => x.key === key);
  return t ? T(t.zh, t.en) : key;
}
export function catchupAreaLabel(key: string): string {
  const a = CATCHUP_AREAS.find((x) => x.key === key);
  return a ? T(a.zh, a.en) : key;
}
export function catchupPatientLabel(patientId: string): string {
  if (patientId === "patient-zero") return T("Patient Zero · 爸爸", "Patient Zero · Dad");
  if (patientId === "") return T("未指定患者", "No patient specified");
  return patientId;
}

type CatchupEntryRow = ApiResponse<typeof api, "listCatchupEntries">["entries"][number];

export function CatchupEntryRowView({ e, showPatient = true }: { e: CatchupEntryRow; showPatient?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3 text-sm">
      <div className="flex gap-3">
        {e.fileKind ? <AttachmentBox kind={e.fileKind} name={e.fileName} url={e.fileUrl ?? ""} /> : null}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: TEAL }}>{catchupTypeLabel(e.entryType)}</span>
            {showPatient ? <span className="ml-2">{catchupPatientLabel(e.patientId)}</span> : null}
            <span className="ml-2 font-normal text-[var(--dim)]">{T(`属于 ${e.belongsDate}`, `Belongs to ${e.belongsDate}`)}</span>
          </p>
          {e.note ? <p className="mt-1">{e.note}</p> : null}
          <p className="mt-0.5 text-xs text-[var(--dim)]">
            {e.fileName ? <>{T("附件：", "File: ")}{e.fileName} · </> : null}
            {T(`归类到「${catchupAreaLabel(e.linkArea)}」`, `Filed under ${catchupAreaLabel(e.linkArea)}`)}
            {e.enteredBy ? <> · {T("录入：", "Entered by: ")}{e.enteredBy}</> : null}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The catch-up items that belong to one destination screen, read from the
    same single store the Catch-up page writes to. Renders nothing when the
    area has no filed items yet, so destination screens stay clean. */
export function CatchupFiledList({ area, patientId }: { area: string; patientId?: string }) {
  const q = useQuery({ queryKey: ["catchupEntries"], queryFn: () => api.listCatchupEntries({}) });
  const rows = (q.data?.entries ?? []).filter((e) => e.linkArea === area && (patientId === undefined || e.patientId === patientId));
  if (q.isPending || rows.length === 0) return null;
  return (
    <SCard title={T("补录中心归过来的文件", "Filed here from Catch-up entries")}>
      <p className="mb-2 text-xs text-[var(--dim)]">{T("这些是在「补录中心」补录的同一条记录，按它属于的日期排在这里 — 不是副本。", "These are the same single records filed on the Catch-up entries page, shown here under the date they belong to — not copies.")}</p>
      <div className="space-y-2">
        {rows.map((e) => (<CatchupEntryRowView key={e.id} e={e} showPatient={patientId === undefined} />))}
      </div>
    </SCard>
  );
}

export function MedsLabsTab({ viewerLabel = "", viewerRole = "", people = [] }: { viewerLabel?: string; viewerRole?: string; people?: string[] }) {
  const canUpload = viewerRole !== "aide";
  const queryClient = useQueryClient();
  const [sub, setSub] = useState<"list" | "daily" | "labs">("list");
  const medsQ = useQuery({ queryKey: ["medications"], queryFn: () => api.listMedications({}) });
  const labsQ = useQuery({ queryKey: ["labChecks"], queryFn: () => api.listLabChecks({}) });
  const meds = medsQ.data?.medications ?? [];
  const logs = medsQ.data?.logs ?? [];
  const checks = labsQ.data?.checks ?? [];
  const [editingMed, setEditingMed] = useState<(MedFormState & { id?: number }) | null>(null);
  const [editingLab, setEditingLab] = useState<(LabFormState & { id?: number }) | null>(null);
  const [tickDate, setTickDate] = useState(() => dateKeyOf(new Date()));
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [tickMsg, setTickMsg] = useState("");
  const delMed = useMutation({
    mutationFn: async (id: number) => await api.deleteMedication({ id }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["medications"] }),
  });
  const delLab = useMutation({
    mutationFn: async (id: number) => await api.deleteLabCheck({ id }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["labChecks"] }),
  });
  const logMed = useMutation({
    mutationFn: async (v: { medicationId: number; status: "taken" | "missed" | "none"; reason: string }) =>
      await api.logMedication({ medicationId: v.medicationId, logDate: tickDate, status: v.status, reason: v.reason, enteredBy: viewerLabel }),
    onSuccess: () => { setTickMsg(T("已保存。", "Saved.")); void queryClient.invalidateQueries({ queryKey: ["medications"] }); },
    onError: (e) => setTickMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  const todayKey = dateKeyOf(new Date());
  const dueState = (c: LabCheck): { labelZh: string; labelEn: string; color: string } | null => {
    if (!c.nextDue) return null;
    if (c.nextDue < todayKey) return { labelZh: `已到期（${c.nextDue}）`, labelEn: `Overdue (${c.nextDue})`, color: RED };
    const soon = new Date(`${todayKey}T00:00:00`); soon.setDate(soon.getDate() + 14);
    if (c.nextDue <= dateKeyOf(soon)) return { labelZh: `快到了（${c.nextDue}）`, labelEn: `Due soon (${c.nextDue})`, color: AMBER };
    return { labelZh: `下次 ${c.nextDue}`, labelEn: `Next ${c.nextDue}`, color: TEAL };
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: TEAL }}>{T("用药与化验", "Medications & Labs")}</h2>
        <Dismissible className="pr-8"><p className="text-sm text-[var(--dim)]">{T("药单在这一页维护，每天的吃药打勾从这里生成到「今日」。检查安排（比如年度大血检、每月血检）也在这里，到期会提醒。", "The medication list lives here; each day's taken-ticks flow from it. Lab checks — a full blood check yearly, blood work monthly — are scheduled here too, with due-date reminders.")}</p></Dismissible>
      </div>
      <div className="rounded-xl border-2 p-4" style={{ borderColor: AMBER, background: "#fdf6dd", color: "#5c4a10" }}>
        <p className="text-sm"><strong>{T("这个网站只记录：医生开了什么药、药吃没吃。", "This site only records what was prescribed and whether each dose was taken.")}</strong>{T("改药、停药、加药，都是医生的决定。分工：家人或团队成员（健康管理师、营养师、康复师、心理咨询师、档案录入员）把处方传上来（照片、PDF 或 Excel 都行，生活管家不传文件）；档案录入员照着附件把药单录清楚，健康管理师复核；喂药的人（生活管家或家人）每次喂完在「每日打勾」里点一下，每条记录都写清是谁录的。漏服怎么办，按医嘱事先写好，不临场决定。", " Changing, stopping or adding a medicine is always the doctor's decision. Who does what: family or a care team member (health manager, dietitian, rehab therapist, psychologist, records clerk) uploads the prescription (photo, PDF or Excel — the care butler does not upload); the records clerk reads it and types the list in, and the health manager checks it; whoever gives the medicine (care butler or family) ticks it off under Daily ticks, and every entry records who did it. What to do about a missed dose is written down in advance, from the doctor's instructions.")}</p>
      </div>
      <SSubTabs label="Medications and labs sections" value={sub} onChange={setSub} tabs={[
        { key: "list", zh: "用药清单", en: "Medication list", count: meds.length },
        { key: "daily", zh: "每日打勾", en: "Daily ticks" },
        { key: "labs", zh: "检查安排", en: "Lab checks", count: checks.length },
      ]} />
      {sub === "list" ? (
        <div className="space-y-4">
          <SCard title={T("药单", "Medication list")}>
            {medsQ.isPending ? <p className="text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p> : meds.length === 0 ? (
              <p className="text-sm text-[var(--dim)]">{T("还没有录入药物。药单由主治医生开好后，照着处方在下面一条一条录入 — 药名、剂量、频次、时间、开药医生都写清楚。第一份药单之后会提供，现在先把位置留好。", "No medicines entered yet. When the doctor's prescription is provided, enter it below exactly as written — name, dose, frequency, time, prescriber. The first real list is still to come; the screen is ready for it.")}</p>
            ) : (
              <div className="space-y-2">
                {meds.map((m) => (
                  <div key={m.id} className="rounded-lg border border-[var(--border)] p-3 text-sm" style={m.active ? undefined : { opacity: 0.55 }}>
                    <div className="flex gap-3">
                      {m.fileKind ? <AttachmentBox kind={m.fileKind} name={m.fileName} url={m.photoUrl ?? ""} /> : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{m.drugName}{m.dose ? ` · ${m.dose}` : ""} <span className="font-normal text-[var(--dim)]">{L(m.frequency)}{m.timeOfDay ? ` · ${L(m.timeOfDay)}` : ""}</span>{m.active ? null : <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">{T("已停用", "Stopped")}</span>}</p>
                        <p className="mt-0.5 text-[var(--dim)]">
                          {m.prescribedBy ? T(`开药医生 ${m.prescribedBy} · `, `Prescribed by ${m.prescribedBy} · `) : ""}{m.startDate ? T(`从 ${m.startDate} 起`, `from ${m.startDate}`) : ""}{m.endDate ? T(` 到 ${m.endDate}`, ` to ${m.endDate}`) : ""}
                          {m.notes ? <><br />{T("注意：", "Note: ")}{m.notes}</> : null}
                          {m.missedAction ? <><br />{T("漏了怎么办：", "If missed: ")}{m.missedAction}</> : null}
                          {m.fileName ? <><br />{T("附件：", "Attachment: ")}{m.fileName}</> : null}
                          {m.enteredBy ? <><br />{T("录入：", "Entered by: ")}{m.enteredBy}</> : null}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold" onClick={() => setEditingMed({ id: m.id, drugName: m.drugName, dose: m.dose, frequency: m.frequency, timeOfDay: m.timeOfDay, startDate: m.startDate, endDate: m.endDate, prescribedBy: m.prescribedBy, notes: m.notes, missedAction: m.missedAction, active: m.active, photoUrl: m.photoUrl, fileName: m.fileName, fileKind: m.fileKind, enteredBy: m.enteredBy })}>{T("编辑", "Edit")}</button>
                      <button type="button" className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: RED, color: RED }} onClick={() => delMed.mutate(m.id)}>{T("删除", "Delete")}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SCard>
          <SCard title={editingMed ? T("编辑药物", "Edit medicine") : T("加一种药", "Add a medicine")}>
            {editingMed ? <button type="button" className="mb-3 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold" onClick={() => setEditingMed(null)}>{T("取消编辑，改加新药", "Cancel edit — add new instead")}</button> : null}
            <MedicationForm initial={editingMed ?? EMPTY_MED} onSaved={() => setEditingMed(null)} people={people} defaultBy={viewerLabel} canUpload={canUpload} />
          </SCard>
        </div>
      ) : null}
      {sub === "daily" ? (
        <SCard title={T("每天吃药打勾", "Daily medication ticks")}>
          <label className="block max-w-[220px] text-sm font-semibold">{T("日期", "Date")}
            <input aria-label="Medication tick date" type="date" className={INP} value={tickDate} onChange={(e) => setTickDate(e.target.value)} />
          </label>
          {meds.filter((m) => m.active).length === 0 ? (
            <p className="mt-3 text-sm text-[var(--dim)]">{T("药单还是空的 — 先在「用药清单」里录入药物，这里的打勾会自动按药单生成。", "The list is empty — enter medicines on the Medication list sub-tab first, and the daily ticks are generated from it.")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {meds.filter((m) => m.active).map((m) => {
                const log = logs.find((l) => l.medicationId === m.id && l.logDate === tickDate);
                return (
                  <div key={m.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                    <p className="font-semibold">{m.drugName}{m.dose ? ` · ${m.dose}` : ""} <span className="font-normal text-[var(--dim)]">{L(m.timeOfDay)}</span></p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" aria-pressed={log?.status === "taken"} className="rounded-lg px-4 py-2 font-semibold text-white" style={{ background: log?.status === "taken" ? GREEN : "#9db8b2" }} onClick={() => logMed.mutate({ medicationId: m.id, status: "taken", reason: "" })}>{T("吃了 ✓", "Taken ✓")}</button>
                      <button type="button" aria-pressed={log?.status === "missed"} className="rounded-lg px-4 py-2 font-semibold text-white" style={{ background: log?.status === "missed" ? RED : "#c4a49e" }} onClick={() => logMed.mutate({ medicationId: m.id, status: "missed", reason: reasons[m.id] ?? log?.reason ?? "" })}>{T("漏了", "Missed")}</button>
                      {log ? <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold" onClick={() => logMed.mutate({ medicationId: m.id, status: "none", reason: "" })}>{T("清除", "Clear")}</button> : null}
                      {log?.status === "taken" ? <span className="font-semibold" style={{ color: GREEN }}>{T("已记录吃了", "Taken, recorded")}</span> : null}
                      {log?.status === "missed" ? <span className="font-semibold" style={{ color: RED }}>{T("已记录漏服", "Missed, recorded")}</span> : null}
                      {log?.enteredBy ? <span className="text-xs text-[var(--dim)]">{T(`由 ${log.enteredBy} 打勾`, `Ticked by ${log.enteredBy}`)}</span> : null}
                    </div>
                    {log?.status === "missed" || (reasons[m.id] ?? "") !== "" ? (
                      <div className="mt-2">
                        <label className="block text-sm">{T("漏服原因", "Reason")}
                          <input {...FIELDS.logMedication.reason} aria-label={`Missed reason for ${m.drugName}`} className={INP} value={reasons[m.id] ?? log?.reason ?? ""} onChange={(e) => setReasons({ ...reasons, [m.id]: e.target.value })} placeholder={T("如：睡过头了", "e.g. overslept")} />
                        </label>
                        <button type="button" className="mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: TEAL }} onClick={() => logMed.mutate({ medicationId: m.id, status: "missed", reason: reasons[m.id] ?? "" })}>{T("保存原因", "Save reason")}</button>
                        {m.missedAction ? <p className="mt-2 rounded-lg bg-[#fbf3d9] p-2 text-xs">{T("漏了怎么办（医嘱）：", "What to do, per the doctor: ")}{m.missedAction}</p> : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          {tickMsg ? <p className="mt-3 text-sm" role="status">{tickMsg}</p> : null}
        </SCard>
      ) : null}
      {sub === "labs" ? (
        <div className="space-y-4">
          <SCard title={T("检查安排", "Lab-check schedule")}>
            {labsQ.isPending ? <p className="text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p> : checks.length === 0 ? (
              <p className="text-sm text-[var(--dim)]">{T("还没有检查安排。血检安排之后会提供，现在先把位置留好。", "No lab checks scheduled yet — the blood-work schedule is still to come; the screen is ready for it.")}</p>
            ) : (
              <div className="space-y-2">
                {checks.map((c) => {
                  const due = dueState(c);
                  return (
                    <div key={c.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                      <div className="flex gap-3">
                        {c.fileKind ? <AttachmentBox kind={c.fileKind} name={c.fileName} url={c.photoUrl ?? ""} /> : null}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{c.testName} <span className="font-normal text-[var(--dim)]">{L(c.frequency)}</span>
                            {due ? <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: due.color }}>{T(due.labelZh, due.labelEn)}</span> : null}
                            {c.abnormal ? <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: RED }}>{T("结果异常", "Abnormal")}</span> : null}
                          </p>
                          {c.lastResult ? <p className="mt-0.5">{T("最近结果：", "Latest result: ")}{c.lastResult}</p> : null}
                          {c.doctorNote ? <p className="mt-0.5 text-[var(--dim)]">{T("医生意见：", "Doctor: ")}{c.doctorNote}</p> : null}
                          {c.fileName ? <p className="mt-0.5 text-xs text-[var(--dim)]">{T("附件：", "Attachment: ")}{c.fileName}</p> : null}
                          {c.enteredBy ? <p className="mt-0.5 text-xs text-[var(--dim)]">{T("录入：", "Entered by: ")}{c.enteredBy}</p> : null}
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold" onClick={() => setEditingLab({ id: c.id, testName: c.testName, frequency: c.frequency, nextDue: c.nextDue, lastResult: c.lastResult, abnormal: c.abnormal, doctorNote: c.doctorNote, photoUrl: c.photoUrl, fileName: c.fileName, fileKind: c.fileKind, enteredBy: c.enteredBy })}>{T("编辑", "Edit")}</button>
                        <button type="button" className="rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: RED, color: RED }} onClick={() => delLab.mutate(c.id)}>{T("删除", "Delete")}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SCard>
          <SCard title={editingLab ? T("编辑检查", "Edit lab check") : T("加一项检查", "Add a lab check")}>
            {editingLab ? <button type="button" className="mb-3 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold" onClick={() => setEditingLab(null)}>{T("取消编辑，改加新项", "Cancel edit — add new instead")}</button> : null}
            <LabCheckForm initial={editingLab ?? EMPTY_LAB} onSaved={() => setEditingLab(null)} people={people} defaultBy={viewerLabel} canUpload={canUpload} />
          </SCard>
        </div>
      ) : null}
      <CatchupFiledList area="meds" />
    </div>
  );
}

/* ================= Patient app — senior-care daily check-in =================
   The person themselves (or family helping) reports: mood, appetite, sleep,
   discomfort, plus a weekly weight. Same record as the Today tab's evening
   check-in — fill once, used everywhere. */
export function SeniorCheckinPanel() {
  const queryClient = useQueryClient();
  const checkinsQ = useQuery({ queryKey: ["seniorCheckins"], queryFn: () => api.listSeniorCheckins({}) });
  const [date, setDate] = useState(() => dateKeyOf(new Date()));
  type F = { mood: string; appetite: string; sleepHours: string; sleepQuality: number | null; discomfort: string; weightKg: string };
  const [form, setForm] = useState<F | null>(null);
  const [msg, setMsg] = useState("");
  const rec: SeniorCheckin | undefined = checkinsQ.data?.checkins.find((c) => c.checkDate === date);
  useEffect(() => { setForm(null); setMsg(""); }, [date]);
  useEffect(() => {
    if (form === null && checkinsQ.data) {
      setForm({
        mood: rec?.mood ?? "", appetite: rec?.appetite ?? "",
        sleepHours: strOr(rec?.sleepHours), sleepQuality: rec?.sleepQuality ?? null,
        discomfort: rec?.discomfort ?? "", weightKg: strOr(rec?.weightKg),
      });
    }
  }, [checkinsQ.data, form, rec]);
  const save = useMutation({
    mutationFn: async () => {
      const f = form!;
      return await api.saveSeniorCheckin({
        checkDate: date, mood: f.mood, appetite: f.appetite,
        sleepHours: numOrNull(f.sleepHours), sleepQuality: f.sleepQuality,
        discomfort: f.discomfort, weightKg: numOrNull(f.weightKg),
        filledBy: "患者/家人 Patient or family",
      });
    },
    onSuccess: () => { setMsg(T("已保存，谢谢。今天的打卡团队也能在「今日」页看到。", "Saved, thank you — the team sees this on the Today page too.")); void queryClient.invalidateQueries({ queryKey: ["seniorCheckins"] }); },
    onError: (e) => setMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  const recent = (checkinsQ.data?.checkins ?? []).slice(0, 7);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <SCard title={T("每日打卡 — 今天感觉怎么样？", "Daily check-in — how do you feel today?")}>
        <label className="mt-3 block max-w-[220px] text-sm font-semibold">{T("日期", "Date")}
          <input aria-label="Check-in date" type="date" className={INP} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {!form ? <p className="py-4 text-center text-sm text-[var(--dim)]">{T("加载中…", "Loading…")}</p> : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">{T("心情", "Mood")}
                <select aria-label="Mood" className={SEL} value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}>
                  <option value="">{T("— 选一个 —", "— Pick one —")}</option><option value="平稳">{T("平稳", "Calm")}</option><option value="烦躁">{T("烦躁", "Restless")}</option><option value="淡漠">{T("淡漠", "Flat / withdrawn")}</option>
                </select></label>
              <label className="block text-sm">{T("胃口", "Appetite")}
                <select aria-label="Appetite" className={SEL} value={form.appetite} onChange={(e) => setForm({ ...form, appetite: e.target.value })}>
                  <option value="">{T("— 选一个 —", "— Pick one —")}</option><option value="好">{T("好", "Good")}</option><option value="一般">{T("一般", "Fair")}</option><option value="差">{T("差", "Poor")}</option>
                </select></label>
              <label className="block text-sm">{T("昨晚睡了几个小时", "Sleep last night (hours)")}
                <input {...FIELDS.saveSeniorCheckin.sleepHours} aria-label="Sleep hours" type="number" inputMode="decimal" className={INP} value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: e.target.value })} /></label>
              <label className="block text-sm">{T("体重（kg · 每周称一次）", "Weight (kg · once a week)")}
                <input {...FIELDS.saveSeniorCheckin.weightKg} aria-label="Weight in kg" type="number" inputMode="decimal" className={INP} value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} /></label>
            </div>
            <div className="mt-3">
              <p className="text-sm">{T("睡得好吗？", "How well did you sleep?")}</p>
              <div className="mt-1 flex gap-2" role="group" aria-label="Sleep quality 1 to 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-pressed={form.sleepQuality === n} aria-label={`Sleep quality ${n} of 5`}
                    className="h-11 w-11 rounded-full text-base font-bold"
                    style={form.sleepQuality === n ? { background: TEAL, color: "#fff" } : { border: "2px solid var(--border)", color: "var(--dim)" }}
                    onClick={() => setForm({ ...form, sleepQuality: n })}>{n}</button>
                ))}
                <span className="self-center text-xs text-[var(--dim)]">{T("1 很差 · 5 很好", "1 Poor · 5 Great")}</span>
              </div>
            </div>
            <label className="mt-3 block text-sm">{T("哪里不舒服？", "Anything uncomfortable?")}
              <textarea {...FIELDS.saveSeniorCheckin.discomfort} aria-label="Anything uncomfortable" className={INP} rows={2} value={form.discomfort} onChange={(e) => setForm({ ...form, discomfort: e.target.value })} placeholder={T("没有不舒服就留空。", "Nothing — leave it blank.")} />
            </label>
            <button type="button" disabled={save.isPending} className="mt-3 w-full rounded-lg px-5 py-3 text-base font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => save.mutate()}>
              {save.isPending ? T("保存中…", "Saving…") : T("保存今天的打卡", "Save today's check-in")}
            </button>
            {msg ? <p className="mt-2 text-sm" role="status">{msg}</p> : null}
          </>
        )}
      </SCard>
      <SCard title={T("最近的打卡", "Recent check-ins")}>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--dim)]">{T("还没有打卡记录。填好上面第一天的，就会显示在这里。", "No check-ins yet — the first one you save appears here.")}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((c) => (
              <div key={c.checkDate} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <p className="font-semibold">{c.checkDate}{c.filledBy ? <span className="ml-2 text-xs font-normal text-[var(--dim)]">{L(c.filledBy)}</span> : null}</p>
                <p className="mt-0.5">
                  {T(c.mood ? `心情 ${L(c.mood)} · ` : "", c.mood ? `Mood ${L(c.mood)} · ` : "")}{T(c.appetite ? `胃口 ${L(c.appetite)} · ` : "", c.appetite ? `Appetite ${L(c.appetite)} · ` : "")}{c.sleepHours != null ? T(`睡眠 ${c.sleepHours} 小时`, `Sleep ${c.sleepHours} h`) : ""}{c.sleepQuality != null ? ` (${c.sleepQuality}/5)` : ""}{c.weightKg != null ? T(` · 体重 ${c.weightKg} kg`, ` · Weight ${c.weightKg} kg`) : ""}
                </p>
                {c.discomfort ? <p className="mt-0.5 text-[var(--dim)]">{T("不舒服：", "Uncomfortable: ")}{c.discomfort}</p> : null}
                {c.incident ? <p className="mt-0.5 font-semibold" style={{ color: RED }}>{T("异常事件：", "Abnormal event: ")}{c.incident}</p> : null}
              </div>
            ))}
          </div>
        )}
      </SCard>
    </div>
  );
}

/* ================= Staff Entry — team forms =================
   The V2 team sheets and T01 weekly forms as screens: standing monitoring
   (therapist, weekly), the nutrition calculation (corrected formula),
   weekly tracking & follow-up, and the Week-4 checkpoint verdict. */
function calcNutrition(weightKg: number, energyFactor: number, proteinFactor: number, fatPct: number, carbPct: number) {
  const totalKcal = Math.round(weightKg * energyFactor);
  const proteinG = Math.round(weightKg * proteinFactor);
  const fatG = Math.round((totalKcal * (fatPct / 100)) / 9);
  const carbG = Math.round((totalKcal * (carbPct / 100)) / 4);
  const proteinKcal = proteinG * 4;
  return { totalKcal, proteinG, fatG, carbG, proteinKcal };
}
const MEAL_SPLIT = [
  { meal: "早餐 Breakfast", pct: 25, time: "07:30" },
  { meal: "午餐 Lunch", pct: 35, time: "11:30" },
  { meal: "加餐 Snack", pct: 10, time: "16:30" },
  { meal: "晚餐 Dinner", pct: 30, time: "18:00" },
];

export function TeamFormsPanel({ patientId, week, entryDate }: { patientId: string; week: string; entryDate: string }) {
  const queryClient = useQueryClient();
  const standingQ = useQuery({ queryKey: ["standingRecords"], queryFn: () => api.listStandingRecords({}) });
  const plansQ = useQuery({ queryKey: ["nutritionPlans"], queryFn: () => api.listNutritionPlans({}) });
  const formsQ = useQuery({ queryKey: ["teamForms"], queryFn: () => api.listTeamForms({}) });
  const delStanding = useMutation({
    mutationFn: async (id: number) => await api.deleteStandingRecord({ id }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["standingRecords"] }),
  });

  /* Standing monitoring */
  const [st, setSt] = useState({ weekLabel: "", date: entryDate, bedAngle: "", standSeconds: "", kneeAngle: "", spasmPerDay: "", sys: "", dia: "", pulse: "", spo2: "", met: "", note: "" });
  const [stMsg, setStMsg] = useState("");
  const saveStanding = useMutation({
    mutationFn: async () => await api.saveStandingRecord({
      weekLabel: st.weekLabel, recordDate: st.date,
      bedAngle: numOrNull(st.bedAngle), standSeconds: numOrNull(st.standSeconds), kneeAngle: numOrNull(st.kneeAngle),
      spasmPerDay: numOrNull(st.spasmPerDay), systolic: numOrNull(st.sys), diastolic: numOrNull(st.dia),
      pulse: numOrNull(st.pulse), spo2: numOrNull(st.spo2), metStandard: st.met === "yes", note: st.note,
    }),
    onSuccess: () => { setStMsg(T("已保存。", "Saved.")); void queryClient.invalidateQueries({ queryKey: ["standingRecords"] }); },
    onError: (e) => setStMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });

  /* Nutrition calculation */
  const [weight, setWeight] = useState("");
  const [ef, setEf] = useState("27.5");
  const [pf, setPf] = useState("1.35");
  const [fatPct, setFatPct] = useState("25");
  const [carbPct, setCarbPct] = useState("55");
  const [nutMsg, setNutMsg] = useState("");
  const wNum = numOrNull(weight);
  const calc = wNum !== null && wNum > 0 ? calcNutrition(wNum, numOrNull(ef) ?? 27.5, numOrNull(pf) ?? 1.35, numOrNull(fatPct) ?? 25, numOrNull(carbPct) ?? 55) : null;
  const savePlan = useMutation({
    mutationFn: async () => await api.saveNutritionPlan({
      patientId, weightKg: wNum!, energyFactor: numOrNull(ef) ?? 27.5, proteinFactor: numOrNull(pf) ?? 1.35,
      fatPct: numOrNull(fatPct) ?? 25, carbPct: numOrNull(carbPct) ?? 55,
    }),
    onSuccess: () => { setNutMsg(T("已保存 — 目标克数由健康管理师确认后再交给家属。", "Saved — targets are confirmed by the health manager before they go to the family.")); void queryClient.invalidateQueries({ queryKey: ["nutritionPlans"] }); },
    onError: (e) => setNutMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });

  /* Follow-up + Week-4 checkpoint */
  const [fu, setFu] = useState({ exerciseDays: "", dietDays: "", sleepDays: "", goalVsActual: "", feedback: "", medicalProgress: "", teamAdvice: "", adjustPlan: false, contactDoctor: false, nextFocus: "" });
  const [fuMsg, setFuMsg] = useState("");
  const saveFollowup = useMutation({
    mutationFn: async () => await api.saveTeamForm({
      patientId, week, formType: "followup", entryDate,
      payload: {
        exerciseDays: numOrNull(fu.exerciseDays) ?? "", dietDays: numOrNull(fu.dietDays) ?? "", sleepDays: numOrNull(fu.sleepDays) ?? "",
        goalVsActual: fu.goalVsActual, feedback: fu.feedback, medicalProgress: fu.medicalProgress, teamAdvice: fu.teamAdvice,
        adjustPlan: fu.adjustPlan, contactDoctor: fu.contactDoctor, nextFocus: fu.nextFocus,
      },
    }),
    onSuccess: () => { setFuMsg(T("已保存 — 也会出现在「最近录入」里。", "Saved — it also appears under Recent entries.")); void queryClient.invalidateQueries({ queryKey: ["teamForms"] }); void queryClient.invalidateQueries({ queryKey: ["state"] }); },
    onError: (e) => setFuMsg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });
  const [w4, setW4] = useState({ kneeImproved: false, spasmReduced: false, sitsSteadily: false, feetFlat: false, verdict: "", therapist: "" });
  const [w4Msg, setW4Msg] = useState("");
  const saveWeek4 = useMutation({
    mutationFn: async () => await api.saveTeamForm({
      patientId, week, formType: "week4", entryDate,
      payload: { kneeImproved: w4.kneeImproved, spasmReduced: w4.spasmReduced, sitsSteadily: w4.sitsSteadily, feetFlat: w4.feetFlat, verdict: w4.verdict, therapist: w4.therapist },
    }),
    onSuccess: () => { setW4Msg(T("已保存。", "Saved.")); void queryClient.invalidateQueries({ queryKey: ["teamForms"] }); void queryClient.invalidateQueries({ queryKey: ["state"] }); },
    onError: (e) => setW4Msg(`${T("保存失败", "Save failed")}: ${e instanceof Error ? e.message : String(e)}`),
  });

  const FU_LABELS: Record<string, string> = {
    exerciseDays: "运动执行（天）Exercise days", dietDays: "饮食执行（天）Diet days", sleepDays: "睡眠执行（天）Sleep days",
    goalVsActual: "本周目标 / 实际完成 Goal vs actual", feedback: "客户反馈 Feedback", medicalProgress: "医学随访进展 Medical progress",
    teamAdvice: "团队建议 Team advice", adjustPlan: "调整计划 Adjust plan", contactDoctor: "联系医生 Contact doctor", nextFocus: "下周重点 Next week's focus",
    kneeImproved: "膝角度比第 0 天增大 Knee angle up from Day 0", spasmReduced: "痉挛减少 Fewer spasms", sitsSteadily: "坐位稳 Sits steadily",
    feetFlat: "双脚能踩地 Feet flat on the floor", verdict: "判定 Verdict", therapist: "判定人 Therapist",
  };
  const fmtVal = (v: string | number | boolean) => (typeof v === "boolean" ? (v ? T("是", "Yes") : T("否", "No")) : String(v));

  return (
    <div className="space-y-4">
      <SCard title={T("站立进阶监测 — 康复治疗师每周填", "Standing monitoring — weekly, by the rehab therapist")}>
        <Dismissible className="pr-8"><p className="mb-3 text-sm text-[var(--dim)]">{T("进阶以第 0 天实测基线为准：连续 1 周达到本阶段目标且无停止信号，才进下一阶段；未达标重复本阶段。房颤脉搏与心率可能不一致，要同时测；血氧 < 92% 及时就医。家属不自行判定达标。", "Progress is judged against the Day-0 measured baseline, never against fixed numbers: a stage is passed only after a full week at its target with no stop signals, otherwise the stage repeats. With atrial fibrillation, pulse and heart rate can differ — measure both; SpO2 < 92% needs prompt medical review. The therapist judges — family never judge a stage passed on their own.")}</p></Dismissible>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">{T("周次", "Week")}
            <input {...FIELDS.saveStandingRecord.weekLabel} aria-label="Standing week label" className={INP} value={st.weekLabel} onChange={(e) => setSt({ ...st, weekLabel: e.target.value })} placeholder={T("如：第 3 周", "e.g. Week 3")} /></label>
          <label className="block text-sm">{T("日期", "Date")}
            <input aria-label="Standing record date" type="date" className={INP} value={st.date} onChange={(e) => setSt({ ...st, date: e.target.value })} /></label>
          <label className="block text-sm">{T("站立床角度（°）", "Bed angle (°)")}
            <input {...FIELDS.saveStandingRecord.bedAngle} aria-label="Standing bed angle" type="number" inputMode="decimal" className={INP} value={st.bedAngle} onChange={(e) => setSt({ ...st, bedAngle: e.target.value })} /></label>
          <label className="block text-sm">{T("扶站时间（秒）", "Supported standing (seconds)")}
            <input {...FIELDS.saveStandingRecord.standSeconds} aria-label="Supported standing seconds" type="number" inputMode="numeric" className={INP} value={st.standSeconds} onChange={(e) => setSt({ ...st, standSeconds: e.target.value })} /></label>
          <label className="block text-sm">{T("膝被动角度（°）", "Passive knee angle (°)")}
            <input {...FIELDS.saveStandingRecord.kneeAngle} aria-label="Passive knee angle" type="number" inputMode="decimal" className={INP} value={st.kneeAngle} onChange={(e) => setSt({ ...st, kneeAngle: e.target.value })} /></label>
          <label className="block text-sm">{T("痉挛次数（次/天）", "Spasms (per day)")}
            <input {...FIELDS.saveStandingRecord.spasmPerDay} aria-label="Spasms per day" type="number" inputMode="numeric" className={INP} value={st.spasmPerDay} onChange={(e) => setSt({ ...st, spasmPerDay: e.target.value })} /></label>
          <label className="block text-sm">{T("血压（mmHg）", "BP (mmHg)")}
            <span className="mt-1 flex gap-2">
              <input aria-label="Standing systolic BP" type="number" inputMode="numeric" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={st.sys} onChange={(e) => setSt({ ...st, sys: e.target.value })} placeholder={T("收缩", "Systolic")} />
              <input aria-label="Standing diastolic BP" type="number" inputMode="numeric" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={st.dia} onChange={(e) => setSt({ ...st, dia: e.target.value })} placeholder={T("舒张", "Diastolic")} />
            </span></label>
          <label className="block text-sm">{T("脉搏 / 血氧 SpO2（%）", "Pulse / SpO2 (%)")}
            <span className="mt-1 flex gap-2">
              <input {...FIELDS.saveStandingRecord.pulse} aria-label="Standing pulse" type="number" inputMode="numeric" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={st.pulse} onChange={(e) => setSt({ ...st, pulse: e.target.value })} placeholder={T("脉搏", "Pulse")} />
              <input {...FIELDS.saveStandingRecord.spo2} aria-label="Standing SpO2" type="number" inputMode="decimal" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-sm" value={st.spo2} onChange={(e) => setSt({ ...st, spo2: e.target.value })} placeholder="SpO2" />
            </span></label>
          <label className="block text-sm">{T("是否达标", "Stage standard met")}
            <select aria-label="Stage standard met" className={SEL} value={st.met} onChange={(e) => setSt({ ...st, met: e.target.value })}>
              <option value="">{T("待判定", "Not judged yet")}</option><option value="yes">{T("达标", "Met")}</option><option value="no">{T("未达标 — 重复本阶段", "Not met — repeat this stage")}</option>
            </select></label>
          <label className="block text-sm lg:col-span-3">{T("本周动作 / 异常处理", "This week's work & anything abnormal")}
            <input {...FIELDS.saveStandingRecord.note} aria-label="Standing week note" className={INP} value={st.note} onChange={(e) => setSt({ ...st, note: e.target.value })} /></label>
        </div>
        <button type="button" disabled={saveStanding.isPending} className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => saveStanding.mutate()}>
          {saveStanding.isPending ? T("保存中…", "Saving…") : T("保存监测记录", "Save monitoring record")}
        </button>
        {stMsg ? <p className="mt-2 text-sm" role="status">{stMsg}</p> : null}
        {(standingQ.data?.records.length ?? 0) > 0 ? (
          <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
            {standingQ.data!.records.map((r) => (
              <div key={r.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <p className="font-semibold">{r.weekLabel || T("周次未填", "Week not filled")} · {r.recordDate}
                  {r.metStandard ? <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: GREEN }}>{T("达标", "Met")}</span> : null}
                  <button type="button" className="ml-3 text-xs font-semibold underline" style={{ color: RED }} onClick={() => delStanding.mutate(r.id)}>{T("删除", "Delete")}</button>
                </p>
                <p className="mt-0.5 text-[var(--dim)]">
                  {T(r.bedAngle != null ? `站立床 ${r.bedAngle}° · ` : "", r.bedAngle != null ? `Bed ${r.bedAngle}° · ` : "")}{T(r.standSeconds != null ? `扶站 ${r.standSeconds} 秒 · ` : "", r.standSeconds != null ? `Standing ${r.standSeconds} s · ` : "")}{T(r.kneeAngle != null ? `膝角度 ${r.kneeAngle}° · ` : "", r.kneeAngle != null ? `Knee ${r.kneeAngle}° · ` : "")}{T(r.spasmPerDay != null ? `痉挛 ${r.spasmPerDay} 次/天 · ` : "", r.spasmPerDay != null ? `Spasms ${r.spasmPerDay}/day · ` : "")}{T(r.systolic != null && r.diastolic != null ? `血压 ${r.systolic}/${r.diastolic} · ` : "", r.systolic != null && r.diastolic != null ? `BP ${r.systolic}/${r.diastolic} · ` : "")}{T(r.pulse != null ? `脉搏 ${r.pulse} · ` : "", r.pulse != null ? `Pulse ${r.pulse} · ` : "")}{r.spo2 != null ? `SpO2 ${r.spo2}%` : ""}
                </p>
                {r.note ? <p className="mt-0.5">{r.note}</p> : null}
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-[var(--dim)]">{T("还没有监测记录 — 第 0 天先把基线测好填进来。", "No monitoring records yet — Day 0 starts with the measured baseline.")}</p>}
      </SCard>

      <SCard title={T("营养计算 — 填体重自动算", "Nutrition calculation — calculated from the measured weight")}>
        <Dismissible className="pr-8"><p className="mb-3 text-sm text-[var(--dim)]">{T("体重是第 0 天实测的；没测之前这里留空，显示「待填体重」，不编数字。蛋白供能按正确公式算：蛋白质克数 × 4 kcal/克。蛋白质目标与肾功能有冲突时，上限由营养科 / 肾科裁决，本表只给区间参考，不是营养处方。", "The weight must be the Day-0 measured weight — until then this stays empty and no numbers are invented. Protein energy uses the corrected formula: protein grams × 4 kcal/g. Where the protein target conflicts with kidney function, the dietitian / kidney specialist decides the cap; this is an estimate, not a prescription.")}</p></Dismissible>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm font-semibold">{T("体重（kg）*", "Weight (kg) *")}
            <input {...FIELDS.saveNutritionPlan.weightKg} aria-label="Measured weight in kg" type="number" inputMode="decimal" className={INP} value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={T("待填体重", "Awaiting weight")} /></label>
          <label className="block text-sm">{T("能量系数（kcal/kg · 25–30）", "Energy factor (kcal/kg · 25–30)")}
            <input aria-label="Energy factor" type="number" inputMode="decimal" className={INP} value={ef} onChange={(e) => setEf(e.target.value)} /></label>
          <label className="block text-sm">{T("蛋白系数（g/kg · 1.2–1.5）", "Protein factor (g/kg · 1.2–1.5)")}
            <input aria-label="Protein factor" type="number" inputMode="decimal" className={INP} value={pf} onChange={(e) => setPf(e.target.value)} /></label>
          <label className="block text-sm">{T("脂肪供能比（% · 20–30）", "Fat share (% · 20–30)")}
            <input {...FIELDS.saveNutritionPlan.fatPct} aria-label="Fat share percent" type="number" inputMode="decimal" className={INP} value={fatPct} onChange={(e) => setFatPct(e.target.value)} /></label>
          <label className="block text-sm">{T("碳水供能比（% · 45–60 · 优先低 GI）", "Carb share (% · 45–60 · low-GI first)")}
            <input {...FIELDS.saveNutritionPlan.carbPct} aria-label="Carb share percent" type="number" inputMode="decimal" className={INP} value={carbPct} onChange={(e) => setCarbPct(e.target.value)} /></label>
        </div>
        {calc ? (
          <div className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { labelZh: "每日总能量", labelEn: "Total energy", value: `${calc.totalKcal} kcal`, subZh: `体重 ${wNum} kg × 系数 ${ef}`, subEn: `Weight ${wNum} kg × factor ${ef}` },
                { labelZh: "蛋白质", labelEn: "Protein", value: `${calc.proteinG} g`, subZh: `蛋白供能 ${calc.proteinG} g × 4 = ${calc.proteinKcal} kcal`, subEn: `Protein energy ${calc.proteinG} g × 4 = ${calc.proteinKcal} kcal` },
                { labelZh: "脂肪", labelEn: "Fat", value: `${calc.fatG} g`, subZh: `总能量 × ${fatPct}% ÷ 9`, subEn: `Total energy × ${fatPct}% ÷ 9` },
                { labelZh: "碳水化合物", labelEn: "Carbohydrate", value: `${calc.carbG} g`, subZh: `总能量 × ${carbPct}% ÷ 4 · 优先低 GI`, subEn: `Total energy × ${carbPct}% ÷ 4 · low-GI first` },
              ].map((b) => (
                <div key={b.labelZh} className="rounded-lg bg-[var(--accent-light)] p-3">
                  <p className="text-xs text-[var(--dim)]">{T(b.labelZh, b.labelEn)}</p>
                  <p className="text-xl font-bold" style={{ color: TEAL }}>{b.value}</p>
                  <p className="text-xs text-[var(--dim)]">{T(b.subZh, b.subEn)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">{T("餐次", "Meal")}</th><th className="py-2 pr-2">{T("占比", "Share")}</th><th className="py-2 pr-2">{T("能量", "Energy")}</th><th className="py-2 pr-2">{T("蛋白", "Protein")}</th><th className="py-2 pr-2">{T("脂肪", "Fat")}</th><th className="py-2">{T("碳水", "Carbs")}</th></tr></thead>
                <tbody>
                  {MEAL_SPLIT.map((s) => (
                    <tr key={s.meal} className="border-b border-[#f0e9d8]">
                      <td className="py-1.5 pr-2 font-medium">{L(s.meal)} <span className="text-xs font-normal text-[var(--dim)]">{s.time}</span></td>
                      <td className="py-1.5 pr-2">{s.pct}%</td>
                      <td className="py-1.5 pr-2">{Math.round(calc.totalKcal * s.pct / 100)} kcal</td>
                      <td className="py-1.5 pr-2">{Math.round(calc.proteinG * s.pct / 100)} g</td>
                      <td className="py-1.5 pr-2">{Math.round(calc.fatG * s.pct / 100)} g</td>
                      <td className="py-1.5">{Math.round(calc.carbG * s.pct / 100)} g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" disabled={savePlan.isPending} className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => savePlan.mutate()}>
              {savePlan.isPending ? T("保存中…", "Saving…") : T(`保存计算（${patientId}）`, `Save calculation (${patientId})`)}
            </button>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-[#fbf3d9] p-3 text-sm font-semibold" style={{ color: "#7a5b12" }}>{T("待填体重 — 第 0 天实测后填入，这里才会算出目标。", "Awaiting a measured weight — enter the Day-0 measured weight and the targets are calculated here.")}</p>
        )}
        {nutMsg ? <p className="mt-2 text-sm" role="status">{nutMsg}</p> : null}
        {(plansQ.data?.plans.length ?? 0) > 0 ? (
          <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
            <p className="text-sm font-bold" style={{ color: TEAL }}>{T("已保存的计算", "Saved calculations")}</p>
            {plansQ.data!.plans.map((p) => (
              <p key={p.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <strong>{p.patientId || "—"}</strong>{T(` · 体重 ${p.weightKg} kg · 总能量 ${p.totalKcal} kcal · 蛋白 ${p.proteinG} g（供能 ${p.proteinKcal} kcal）· 脂肪 ${p.fatG} g · 碳水 ${p.carbG} g`, ` · Weight ${p.weightKg} kg · Total ${p.totalKcal} kcal · Protein ${p.proteinG} g (${p.proteinKcal} kcal) · Fat ${p.fatG} g · Carbs ${p.carbG} g`)}
                <span className="block text-xs text-[var(--dim)]">{p.createdAt.slice(0, 10)}{T(` · 系数 能量 ${p.energyFactor} / 蛋白 ${p.proteinFactor} / 脂肪 ${p.fatPct}% / 碳水 ${p.carbPct}%`, ` · Factors: energy ${p.energyFactor} / protein ${p.proteinFactor} / fat ${p.fatPct}% / carbs ${p.carbPct}%`)}</span>
              </p>
            ))}
          </div>
        ) : null}
      </SCard>

      <SCard title={T("周追踪与随访 — 健康管理师每周五填", "Weekly tracking & follow-up — every Friday, by the health manager")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">{T("运动执行（天，0–7）", "Exercise days (0–7)")}
            <input aria-label="Exercise days this week" type="number" inputMode="numeric" className={INP} value={fu.exerciseDays} onChange={(e) => setFu({ ...fu, exerciseDays: e.target.value })} /></label>
          <label className="block text-sm">{T("饮食执行（天，0–7）", "Diet days (0–7)")}
            <input aria-label="Diet days this week" type="number" inputMode="numeric" className={INP} value={fu.dietDays} onChange={(e) => setFu({ ...fu, dietDays: e.target.value })} /></label>
          <label className="block text-sm">{T("睡眠执行（天，0–7）", "Sleep days (0–7)")}
            <input aria-label="Sleep days this week" type="number" inputMode="numeric" className={INP} value={fu.sleepDays} onChange={(e) => setFu({ ...fu, sleepDays: e.target.value })} /></label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-sm">{T("本周目标 / 实际完成", "Goal vs actual")}
            <textarea aria-label="Goal versus actual" className={INP} rows={2} value={fu.goalVsActual} onChange={(e) => setFu({ ...fu, goalVsActual: e.target.value })} /></label>
          <label className="block text-sm">{T("客户反馈（含患者报告）", "Feedback, incl. patient-reported")}
            <textarea aria-label="Client feedback" className={INP} rows={2} value={fu.feedback} onChange={(e) => setFu({ ...fu, feedback: e.target.value })} /></label>
          <label className="block text-sm">{T("医学随访进展", "Medical progress")}
            <textarea aria-label="Medical progress" className={INP} rows={2} value={fu.medicalProgress} onChange={(e) => setFu({ ...fu, medicalProgress: e.target.value })} /></label>
          <label className="block text-sm">{T("团队建议", "Team advice")}
            <textarea aria-label="Team advice" className={INP} rows={2} value={fu.teamAdvice} onChange={(e) => setFu({ ...fu, teamAdvice: e.target.value })} /></label>
          <label className="block text-sm md:col-span-2">{T("下周重点", "Next week's focus")}
            <input aria-label="Next week's focus" className={INP} value={fu.nextFocus} onChange={(e) => setFu({ ...fu, nextFocus: e.target.value })} /></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" aria-label="Adjust the plan" className="h-5 w-5" checked={fu.adjustPlan} onChange={(e) => setFu({ ...fu, adjustPlan: e.target.checked })} />{T("是否调整计划", "Adjust the plan")}</label>
          <label className="flex items-center gap-2"><input type="checkbox" aria-label="Contact the doctor" className="h-5 w-5" checked={fu.contactDoctor} onChange={(e) => setFu({ ...fu, contactDoctor: e.target.checked })} />{T("是否需联系医生", "Contact the doctor")}</label>
        </div>
        <button type="button" disabled={saveFollowup.isPending} className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => saveFollowup.mutate()}>
          {saveFollowup.isPending ? T("保存中…", "Saving…") : T(`保存随访（${patientId} · ${week}）`, `Save follow-up (${patientId} · ${week})`)}
        </button>
        {fuMsg ? <p className="mt-2 text-sm" role="status">{fuMsg}</p> : null}
      </SCard>

      <SCard title={T("第 4 周检查点 — 康复治疗师判定", "Week-4 checkpoint — judged by the rehab therapist")}>
        <Dismissible className="pr-8"><p className="mb-3 text-sm text-[var(--dim)]">{T("四条都达到才进扶站；未达标就重复第 3–4 周，不强行进阶。判定按第 0 天实测，不按固定角度。", "All four criteria must be met before supported standing begins; if not, weeks 3–4 repeat. Judged against the Day-0 baseline, never against fixed angles.")}</p></Dismissible>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {([
            ["kneeImproved", "膝角度比第 0 天增大", "Passive knee angle larger than Day 0"],
            ["spasmReduced", "痉挛减少", "Fewer spasms"],
            ["sitsSteadily", "坐位稳", "Sits steadily"],
            ["feetFlat", "双脚能踩地", "Both feet flat on the floor"],
          ] as const).map(([k, zh, en]) => (
            <label key={k} className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-3">
              <input type="checkbox" aria-label={`${zh} ${en}`} className="h-5 w-5" checked={w4[k]} onChange={(e) => setW4({ ...w4, [k]: e.target.checked })} />{T(zh, en)}
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">{T("判定", "Verdict")}
            <select aria-label="Week 4 verdict" className={SEL} value={w4.verdict} onChange={(e) => setW4({ ...w4, verdict: e.target.value })}>
              <option value="">{T("— 选择 —", "— Pick —")}</option>
              <option value="达标 — 进入下一阶段（扶站）">{T("达标 — 进入下一阶段（扶站）", "Met — move on to supported standing")}</option>
              <option value="未达标 — 重复第 3–4 周">{T("未达标 — 重复第 3–4 周", "Not met — repeat weeks 3–4")}</option>
            </select></label>
          <label className="block text-sm">{T("判定人", "Therapist")}
            <input aria-label="Checkpoint therapist" className={INP} value={w4.therapist} onChange={(e) => setW4({ ...w4, therapist: e.target.value })} /></label>
        </div>
        <button type="button" disabled={saveWeek4.isPending} className="mt-3 rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-60" style={{ background: TEAL }} onClick={() => saveWeek4.mutate()}>
          {saveWeek4.isPending ? T("保存中…", "Saving…") : T(`保存检查点（${patientId}）`, `Save checkpoint (${patientId})`)}
        </button>
        {w4Msg ? <p className="mt-2 text-sm" role="status">{w4Msg}</p> : null}
      </SCard>

      <SCard title={T("最近的团队表单", "Recent team forms")}>
        {(formsQ.data?.forms.length ?? 0) === 0 ? (
          <p className="text-sm text-[var(--dim)]">{T("还没有随访或检查点记录。", "No follow-up or checkpoint records yet.")}</p>
        ) : (
          <div className="space-y-2">
            {formsQ.data!.forms.map((f) => (
              <div key={f.id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                <p className="font-semibold">{f.formType === "followup" ? T("周追踪与随访", "Follow-up") : T("第 4 周检查点", "Week-4 checkpoint")} · {f.patientId} · {f.week} · {f.entryDate}</p>
                <ul className="mt-1 space-y-0.5 text-[var(--dim)]">
                  {Object.entries(f.payload).filter(([, v]) => v !== "" && v !== false).map(([k, v]) => (
                    <li key={k}>{L(FU_LABELS[k] ?? k)}{T("：", ": ")}{typeof v === "string" && (k === "verdict") ? L(v) : fmtVal(v)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </SCard>
    </div>
  );
}

/* ================= Forms map 表单对照 (Data model sub-tab) =================
   The sitemap's two mapping tables as a screen: every form Helen sent,
   the screen it became, and who fills it in. */
const FORM_MAP_ROWS: { form: string; screenZh: string; screenEn: string; who: string }[] = [
  { form: "24 小时清单 · 24 小时总览（06:00 起）", screenZh: "今日 → 全天清单", screenEn: "Today → Full day", who: "生活管家（白天）/ 家人（晚间）" },
  { form: "24 小时清单 · 护工日间工作表", screenZh: "今日 → 生活管家视图", screenEn: "Today → Care butler view", who: "生活管家" },
  { form: "24 小时清单 · 夜间照护（家人）", screenZh: "今日 → 家人视图（夜间）", screenEn: "Today → Family night view", who: "家人" },
  { form: "24 小时清单 · 每日健康打卡", screenZh: "今日 → 晚上打卡；患者端 → 每日打卡（同一份记录）", screenEn: "Today → Evening check-in; Patient app → Daily check-in (same record)", who: "家人 / 生活管家 / 患者本人" },
  { form: "1125 运动表 · 坐位 A 组（上午）/ B 组（下午）＋ 每日训练打卡", screenZh: "运动与认知 → 坐位 A/B 组（训练前先量血压、脉搏、血氧）", screenEn: "Exercise & Brain → Seated A/B (measure BP, pulse, SpO2 first)", who: "生活管家 / 家人" },
  { form: "V2 客户版 · 站立进阶训练（8 周 4 阶段）", screenZh: "运动与认知 → 站立进阶", screenEn: "Exercise & Brain → Standing progression", who: "家人 / 生活管家执行；康复师判定进阶" },
  { form: "V2 客户版 · 营养饮食计划（每日三餐）", screenZh: "今日清单里的吃饭行；目标克数来自团队录入 → 营养计算", screenEn: "The meal rows on Today; target grams from Staff entry → Nutrition calculation", who: "家人 / 生活管家打勾" },
  { form: "1125 认知表 ＋ V2 客户版 · 认知与语言菜单", screenZh: "运动与认知 → 动脑训练（上午 / 下午各一段）", screenEn: "Exercise & Brain → Brain training (morning / afternoon)", who: "生活管家 / 家人" },
  { form: "V2 客户版 · 常规睡眠", screenZh: "资源 → 睡眠；睡眠小时记在每日打卡里", screenEn: "Resources → Sleep; sleep hours go in the daily check-in", who: "家人 / 患者" },
  { form: "T02 客户版（7 表 · 通用模板）", screenZh: "患者端 → 家属门户（今日清单的母版，以后新患者照此）", screenEn: "Patient app → Family Portal (the master copy of the Today checklist for future patients)", who: "家属、患者" },
  { form: "V2 团队版 · 站立进阶监测（8 周）", screenZh: "团队录入 → 团队表单 → 站立进阶监测", screenEn: "Staff entry → Team forms → Standing monitoring", who: "康复治疗师（每周）" },
  { form: "V2 团队版 · 营养计算表", screenZh: "团队录入 → 团队表单 → 营养计算（公式已修正：蛋白供能 = 蛋白质克数 × 4）", screenEn: "Staff entry → Team forms → Nutrition calculation (formula corrected: protein kcal = protein g × 4)", who: "健康管理师 / 营养师（第 0 天实测体重后）" },
  { form: "V2 团队版 · 语言认知记录（周记录）", screenZh: "团队录入 → 团队表单 → 周追踪与随访；每日两段在动脑训练里记", screenEn: "Staff entry → Team forms → Weekly follow-up; the two daily sessions are recorded under Brain training", who: "团队（每周）" },
  { form: "T01 团队版 · 周追踪、随访", screenZh: "团队录入 → 团队表单 → 周追踪与随访", screenEn: "Staff entry → Team forms → Weekly tracking & follow-up", who: "团队 / 健康管理师（每周）" },
  { form: "站立进阶 · 第 4 周检查点", screenZh: "团队录入 → 团队表单 → 第 4 周检查点", screenEn: "Staff entry → Team forms → Week-4 checkpoint", who: "康复治疗师判定" },
  { form: "检测录入：3D 体测、LIFE、化验、体征、体能", screenZh: "团队录入 → 录入表单", screenEn: "Staff entry → Entry form", who: "技师 / 护士 / 运动师（第 0 / 12 / 24 周）" },
  { form: "团队记录（医生、营养、运动、心理、教练、护士）", screenZh: "团队录入 → 录入表单（先选角色）", screenEn: "Staff entry → Entry form (pick the role first)", who: "各角色（每次接触）" },
  { form: "用药清单（新增）", screenZh: "用药与化验 → 用药清单；每天打勾在 用药与化验 → 每日打勾", screenEn: "Medications & Labs → Medication list; daily ticks under Medications & Labs → Daily ticks", who: "医师开单后由档案录入员录入；家人 / 生活管家打勾" },
  { form: "检查安排（新增：年度大血检、每月血检）", screenZh: "用药与化验 → 检查安排", screenEn: "Medications & Labs → Lab checks", who: "团队 / 医生" },
  { form: "生活方式医学筛查表（ACLM / Loma Linda 简版，中国版）", screenZh: "患者端 → 问卷（手机里的第二个标签）", screenEn: "Patient app → Screener (the second tab in the phone)", who: "患者 / 咨询师" },
  { form: "登记与同意；外院资料", screenZh: "患者列表（入组信息）；安全与合规 → 同意与审计", screenEn: "Patients (enrollment); Safety & Compliance → Consent & audit", who: "前台（入组时）" },
  { form: "数据来源一页纸（10 类来源 ＋ 4 条统一规则）", screenZh: "数据结构 → 数据来源", screenEn: "Data model → Data sources", who: "团队" },
  { form: "漏录补录（处方、化验报告、四类记录、评估表、医师书面意见等文件）", screenZh: "补录中心 — 选患者、选类型、选它属于的日期，上传后自动归到对应页面", screenEn: "Catch-up entries — pick the patient, the type and the date it belongs to; the file then shows in its proper place", who: "家人 / 团队成员（生活管家只查看，不上传）" },
  { form: "MDT 组织架构与岗位职责（YH-PLAT-ORG-001 / 002）", screenZh: "顶部查看身份（9 个岗位＋家属）与各角色能打开的页面；安全与合规 → 访问与登录", screenEn: "The viewer switcher at the top (nine posts + family) and each role's pages; Safety & Compliance → Access & sign-in", who: "平台总负责人定岗" },
];

export function FormsMapPanel() {
  return (
    <SCard title={T("表单对照 — 每张表变成哪个页面", "Forms map — which screen each form became")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-[var(--border)] text-[var(--dim)]"><th className="py-2 pr-2">{T("来源表", "Source form")}</th><th className="py-2 pr-2">{T("变成哪个页面", "Screen")}</th><th className="py-2">{T("谁填", "Who fills it")}</th></tr></thead>
          <tbody>
            {FORM_MAP_ROWS.map((r) => (
              <tr key={r.form} className="border-b border-[#f0e9d8]">
                <td className="py-2 pr-2 font-medium">{r.form}</td>
                <td className="py-2 pr-2">{T(r.screenZh, r.screenEn)}</td>
                <td className="py-2">{r.who}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dismissible className="pr-8"><p className="mt-3 text-sm text-[var(--dim)]">{T("还空着的位置：用药清单（等医生药单）、检查安排里的血检日期（等安排）、营养计算的体重（等第 0 天实测）。这些都不编数字，给了就填进去。", "Open slots, kept empty on purpose: the medication list (waiting for the doctor's prescription), the blood-work dates in Lab checks (waiting for the schedule), and the nutrition weight (waiting for the Day-0 measurement). Nothing is invented to fill them.")}</p></Dismissible>
    </SCard>
  );
}
