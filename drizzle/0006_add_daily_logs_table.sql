CREATE TABLE `daily_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`log_date` text NOT NULL,
	`meals` text DEFAULT '' NOT NULL,
	`activity` text DEFAULT '' NOT NULL,
	`activity_minutes` integer DEFAULT 0 NOT NULL,
	`sleep_hours` real DEFAULT 0 NOT NULL,
	`mood` integer DEFAULT 3 NOT NULL,
	`energy` integer DEFAULT 3 NOT NULL,
	`weight_kg` real,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_logs_log_date_unique` ON `daily_logs` (`log_date`);
