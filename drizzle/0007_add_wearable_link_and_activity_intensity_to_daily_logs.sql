ALTER TABLE `daily_logs` ADD COLUMN `meal_photo_key` text;
--> statement-breakpoint
ALTER TABLE `daily_logs` ADD COLUMN `high_minutes` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `daily_logs` ADD COLUMN `moderate_minutes` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `daily_logs` ADD COLUMN `low_minutes` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `daily_logs` ADD COLUMN `sedentary_minutes` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `daily_logs` ADD COLUMN `sleep_source` text DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
UPDATE `daily_logs` SET `moderate_minutes` = `activity_minutes` WHERE `activity_minutes` > 0 AND `high_minutes` = 0 AND `moderate_minutes` = 0 AND `low_minutes` = 0;
--> statement-breakpoint
CREATE TABLE `wearable_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`device` text DEFAULT '' NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
