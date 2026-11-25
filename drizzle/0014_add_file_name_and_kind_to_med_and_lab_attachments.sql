ALTER TABLE `medications` ADD COLUMN `file_name` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `medications` ADD COLUMN `file_kind` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `lab_checks` ADD COLUMN `file_name` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `lab_checks` ADD COLUMN `file_kind` text DEFAULT '' NOT NULL;
