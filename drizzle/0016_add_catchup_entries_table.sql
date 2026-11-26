CREATE TABLE `catchup_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` text DEFAULT '' NOT NULL,
	`entry_type` text NOT NULL,
	`belongs_date` text NOT NULL,
	`link_area` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`file_key` text,
	`file_name` text DEFAULT '' NOT NULL,
	`file_kind` text DEFAULT '' NOT NULL,
	`entered_by` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
