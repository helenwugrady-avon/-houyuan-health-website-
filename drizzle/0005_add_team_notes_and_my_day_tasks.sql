CREATE TABLE `team_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_role` text NOT NULL,
	`to_role` text NOT NULL,
	`patient_id` text NOT NULL DEFAULT '',
	`text` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `my_day_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role_key` text NOT NULL,
	`text` text NOT NULL,
	`patient_id` text NOT NULL DEFAULT '',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
