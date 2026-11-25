ALTER TABLE `daily_logs` ADD COLUMN `note` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `daily_logs` ADD COLUMN `pavs_days` integer;
--> statement-breakpoint
ALTER TABLE `daily_logs` ADD COLUMN `pavs_minutes` integer;
--> statement-breakpoint
CREATE TABLE `weekly_reflections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_start` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_reflections_week_start_unique` ON `weekly_reflections` (`week_start`);
