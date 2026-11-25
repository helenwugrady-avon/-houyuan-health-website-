CREATE TABLE `care_ticks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`care_date` text NOT NULL,
	`item_key` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `care_ticks_date_item_unique` ON `care_ticks` (`care_date`,`item_key`);
--> statement-breakpoint
CREATE TABLE `care_day_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`care_date` text NOT NULL,
	`aide_name` text DEFAULT '' NOT NULL,
	`family_name` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `care_day_notes_care_date_unique` ON `care_day_notes` (`care_date`);
--> statement-breakpoint
CREATE TABLE `exercise_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`record_date` text NOT NULL,
	`pre_systolic` integer,
	`pre_diastolic` integer,
	`pre_pulse` integer,
	`spo2` real,
	`fever` integer DEFAULT 0 NOT NULL,
	`group_a` integer DEFAULT 0 NOT NULL,
	`group_b` integer DEFAULT 0 NOT NULL,
	`standing_done` integer DEFAULT 0 NOT NULL,
	`stop_signal` integer DEFAULT 0 NOT NULL,
	`total_minutes` integer DEFAULT 0 NOT NULL,
	`actions_json` text DEFAULT '{}' NOT NULL,
	`discomfort` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_records_record_date_unique` ON `exercise_records` (`record_date`);
--> statement-breakpoint
CREATE TABLE `cognitive_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`record_date` text NOT NULL,
	`morning_category` text DEFAULT '' NOT NULL,
	`morning_done` integer DEFAULT 0 NOT NULL,
	`morning_minutes` integer DEFAULT 0 NOT NULL,
	`afternoon_category` text DEFAULT '' NOT NULL,
	`afternoon_done` integer DEFAULT 0 NOT NULL,
	`afternoon_minutes` integer DEFAULT 0 NOT NULL,
	`different_ok` integer DEFAULT 0 NOT NULL,
	`mood` text DEFAULT '' NOT NULL,
	`response` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_records_record_date_unique` ON `cognitive_records` (`record_date`);
--> statement-breakpoint
CREATE TABLE `senior_checkins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`check_date` text NOT NULL,
	`systolic` integer,
	`diastolic` integer,
	`pulse` integer,
	`appetite` text DEFAULT '' NOT NULL,
	`meals_pct` real,
	`sleep_hours` real,
	`night_wakings` integer,
	`sleep_quality` integer,
	`mood` text DEFAULT '' NOT NULL,
	`discomfort` text DEFAULT '' NOT NULL,
	`bowels` text DEFAULT '' NOT NULL,
	`skin_checked` integer DEFAULT 0 NOT NULL,
	`skin_note` text DEFAULT '' NOT NULL,
	`training_a` integer DEFAULT 0 NOT NULL,
	`training_b` integer DEFAULT 0 NOT NULL,
	`incident` text DEFAULT '' NOT NULL,
	`weight_kg` real,
	`filled_by` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `senior_checkins_check_date_unique` ON `senior_checkins` (`check_date`);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`drug_name` text NOT NULL,
	`dose` text DEFAULT '' NOT NULL,
	`frequency` text DEFAULT '' NOT NULL,
	`time_of_day` text DEFAULT '' NOT NULL,
	`start_date` text DEFAULT '' NOT NULL,
	`end_date` text DEFAULT '' NOT NULL,
	`prescribed_by` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`missed_action` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `medication_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medication_id` integer NOT NULL,
	`log_date` text NOT NULL,
	`status` text NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medication_logs_med_date_unique` ON `medication_logs` (`medication_id`,`log_date`);
--> statement-breakpoint
CREATE TABLE `lab_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`test_name` text NOT NULL,
	`frequency` text DEFAULT '' NOT NULL,
	`next_due` text DEFAULT '' NOT NULL,
	`last_result` text DEFAULT '' NOT NULL,
	`abnormal` integer DEFAULT 0 NOT NULL,
	`doctor_note` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `standing_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_label` text DEFAULT '' NOT NULL,
	`record_date` text NOT NULL,
	`bed_angle` real,
	`stand_seconds` integer,
	`knee_angle` real,
	`spasm_per_day` integer,
	`systolic` integer,
	`diastolic` integer,
	`pulse` integer,
	`spo2` real,
	`met_standard` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nutrition_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` text DEFAULT '' NOT NULL,
	`weight_kg` real NOT NULL,
	`energy_factor` real NOT NULL,
	`protein_factor` real NOT NULL,
	`fat_pct` real NOT NULL,
	`carb_pct` real NOT NULL,
	`total_kcal` real NOT NULL,
	`protein_g` real NOT NULL,
	`fat_g` real NOT NULL,
	`carb_g` real NOT NULL,
	`protein_kcal` real NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
