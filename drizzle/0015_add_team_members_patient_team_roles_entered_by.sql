CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`role_key` text NOT NULL,
	`patient_id` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `patient_team_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` text NOT NULL,
	`role_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patient_team_roles_pair` ON `patient_team_roles` (`patient_id`, `role_key`);
--> statement-breakpoint
ALTER TABLE `medications` ADD COLUMN `entered_by` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `lab_checks` ADD COLUMN `entered_by` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `medication_logs` ADD COLUMN `entered_by` text DEFAULT '' NOT NULL;
