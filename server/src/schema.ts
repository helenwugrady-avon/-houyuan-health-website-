import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  sex: text("sex").notNull(),
  age: integer("age").notNull(),
  source: text("source").notNull(),
  stage: text("stage").notNull(),
  followUp: text("follow_up").notNull(),
  goal: text("goal").notNull(),
  status: text("status").notNull(),
  checkinDays: integer("checkin_days").notNull(),
  measuresJson: text("measures_json").notNull(),
});

export const roadmapSettings = sqliteTable("roadmap_settings", {
  id: integer("id").primaryKey(),
  week1StartDate: text("week1_start_date"),
});

export const roadmapTaskProgress = sqliteTable("roadmap_task_progress", {
  taskId: text("task_id").primaryKey(),
  isDone: integer("is_done").notNull().default(0),
  notes: text("notes").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const helperProblemReports = sqliteTable("helper_problem_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const teamNotes = sqliteTable("team_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromRole: text("from_role").notNull(),
  toRole: text("to_role").notNull(),
  patientId: text("patient_id").notNull().default(""),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const myDayTasks = sqliteTable("my_day_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roleKey: text("role_key").notNull(),
  text: text("text").notNull(),
  patientId: text("patient_id").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const dailyLogs = sqliteTable("daily_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logDate: text("log_date").notNull().unique(),
  meals: text("meals").notNull().default(""),
  mealPhotoKey: text("meal_photo_key"),
  activity: text("activity").notNull().default(""),
  activityMinutes: integer("activity_minutes").notNull().default(0),
  highMinutes: integer("high_minutes").notNull().default(0),
  moderateMinutes: integer("moderate_minutes").notNull().default(0),
  lowMinutes: integer("low_minutes").notNull().default(0),
  sedentaryMinutes: integer("sedentary_minutes").notNull().default(0),
  sleepHours: real("sleep_hours").notNull().default(0),
  sleepSource: text("sleep_source").notNull().default("manual"),
  mood: integer("mood").notNull().default(3),
  energy: integer("energy").notNull().default(3),
  note: text("note").notNull().default(""),
  pavsDays: integer("pavs_days"),
  pavsMinutes: integer("pavs_minutes"),
  weightKg: real("weight_kg"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const weeklyReflections = sqliteTable("weekly_reflections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStart: text("week_start").notNull().unique(),
  text: text("text").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const wearableSettings = sqliteTable("wearable_settings", {
  id: integer("id").primaryKey(),
  device: text("device").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const screenerResponses = sqliteTable("screener_responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---- Senior-care module (sitemap rebuild, 2026-11-25) ----
   Generic structure only: the forms Helen sent (24-hour checklist, exercise
   and cognitive sheets, V2 client/team sheets) as entry forms. No patient's
   values are stored in code; rows appear only when someone fills a form. */

export const careTicks = sqliteTable("care_ticks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careDate: text("care_date").notNull(),
  itemKey: text("item_key").notNull(),
  done: integer("done").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const careDayNotes = sqliteTable("care_day_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  careDate: text("care_date").notNull().unique(),
  aideName: text("aide_name").notNull().default(""),
  familyName: text("family_name").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const exerciseRecords = sqliteTable("exercise_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recordDate: text("record_date").notNull().unique(),
  preSystolic: integer("pre_systolic"),
  preDiastolic: integer("pre_diastolic"),
  prePulse: integer("pre_pulse"),
  spo2: real("spo2"),
  fever: integer("fever").notNull().default(0),
  groupA: integer("group_a").notNull().default(0),
  groupB: integer("group_b").notNull().default(0),
  standingDone: integer("standing_done").notNull().default(0),
  stopSignal: integer("stop_signal").notNull().default(0),
  totalMinutes: integer("total_minutes").notNull().default(0),
  actionsJson: text("actions_json").notNull().default("{}"),
  discomfort: text("discomfort").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const cognitiveRecords = sqliteTable("cognitive_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recordDate: text("record_date").notNull().unique(),
  morningCategory: text("morning_category").notNull().default(""),
  morningDone: integer("morning_done").notNull().default(0),
  morningMinutes: integer("morning_minutes").notNull().default(0),
  afternoonCategory: text("afternoon_category").notNull().default(""),
  afternoonDone: integer("afternoon_done").notNull().default(0),
  afternoonMinutes: integer("afternoon_minutes").notNull().default(0),
  differentOk: integer("different_ok").notNull().default(0),
  mood: text("mood").notNull().default(""),
  response: text("response").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const seniorCheckins = sqliteTable("senior_checkins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  checkDate: text("check_date").notNull().unique(),
  systolic: integer("systolic"),
  diastolic: integer("diastolic"),
  pulse: integer("pulse"),
  appetite: text("appetite").notNull().default(""),
  mealsPct: real("meals_pct"),
  sleepHours: real("sleep_hours"),
  nightWakings: integer("night_wakings"),
  sleepQuality: integer("sleep_quality"),
  mood: text("mood").notNull().default(""),
  discomfort: text("discomfort").notNull().default(""),
  bowels: text("bowels").notNull().default(""),
  skinChecked: integer("skin_checked").notNull().default(0),
  skinNote: text("skin_note").notNull().default(""),
  trainingA: integer("training_a").notNull().default(0),
  trainingB: integer("training_b").notNull().default(0),
  incident: text("incident").notNull().default(""),
  weightKg: real("weight_kg"),
  filledBy: text("filled_by").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const medications = sqliteTable("medications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  drugName: text("drug_name").notNull(),
  dose: text("dose").notNull().default(""),
  frequency: text("frequency").notNull().default(""),
  timeOfDay: text("time_of_day").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  prescribedBy: text("prescribed_by").notNull().default(""),
  notes: text("notes").notNull().default(""),
  missedAction: text("missed_action").notNull().default(""),
  photoKey: text("photo_key"),
  fileName: text("file_name").notNull().default(""),
  fileKind: text("file_kind").notNull().default(""),
  enteredBy: text("entered_by").notNull().default(""),
  active: integer("active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const medicationLogs = sqliteTable("medication_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  medicationId: integer("medication_id").notNull(),
  logDate: text("log_date").notNull(),
  status: text("status").notNull(),
  reason: text("reason").notNull().default(""),
  enteredBy: text("entered_by").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const labChecks = sqliteTable("lab_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  testName: text("test_name").notNull(),
  frequency: text("frequency").notNull().default(""),
  nextDue: text("next_due").notNull().default(""),
  lastResult: text("last_result").notNull().default(""),
  abnormal: integer("abnormal").notNull().default(0),
  doctorNote: text("doctor_note").notNull().default(""),
  photoKey: text("photo_key"),
  fileName: text("file_name").notNull().default(""),
  fileKind: text("file_kind").notNull().default(""),
  enteredBy: text("entered_by").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const standingRecords = sqliteTable("standing_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekLabel: text("week_label").notNull().default(""),
  recordDate: text("record_date").notNull(),
  bedAngle: real("bed_angle"),
  standSeconds: integer("stand_seconds"),
  kneeAngle: real("knee_angle"),
  spasmPerDay: integer("spasm_per_day"),
  systolic: integer("systolic"),
  diastolic: integer("diastolic"),
  pulse: integer("pulse"),
  spo2: real("spo2"),
  metStandard: integer("met_standard").notNull().default(0),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const nutritionPlans = sqliteTable("nutrition_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull().default(""),
  weightKg: real("weight_kg").notNull(),
  energyFactor: real("energy_factor").notNull(),
  proteinFactor: real("protein_factor").notNull(),
  fatPct: real("fat_pct").notNull(),
  carbPct: real("carb_pct").notNull(),
  totalKcal: real("total_kcal").notNull(),
  proteinG: real("protein_g").notNull(),
  fatG: real("fat_g").notNull(),
  carbG: real("carb_g").notNull(),
  proteinKcal: real("protein_kcal").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---- Pricing (Staff entry → Pricing sub-tab, 2026-11-25) ----
   A client's saved choices from the decided price list: one package plus
   any add-on services. The price list itself is reference content in the
   client (from the 2026-11-25 finance decision); only choices persist. */
export const pricingSelections = sqliteTable("pricing_selections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientName: text("client_name").notNull().default(""),
  packageLabel: text("package_label").notNull().default(""),
  packagePrice: text("package_price").notNull().default(""),
  servicesJson: text("services_json").notNull().default("[]"),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/* ---- People model (2026-11-25) ----
   Real people, each assigned to ONE role and to the patient they serve in
   that role. Different patients have different team members. Care-team
   roles start as empty slots (name = "") to fill in with real names later.
   patient_team_roles: which roles are on a given patient's team — choosing
   a role brings that role's task list for that patient. Family is a role
   like any other; family members linked to a patient see that patient's
   complete picture (the Family Portal). patient_id "patient-zero" is
   Helen's dad; "" means not assigned to a patient yet. */
export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default(""),
  roleKey: text("role_key").notNull(),
  patientId: text("patient_id").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const patientTeamRoles = sqliteTable("patient_team_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull(),
  roleKey: text("role_key").notNull(),
});

export const staffEntries = sqliteTable("staff_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: text("patient_id").notNull(),
  week: text("week").notNull(),
  role: text("role").notNull(),
  entryDate: text("entry_date").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
