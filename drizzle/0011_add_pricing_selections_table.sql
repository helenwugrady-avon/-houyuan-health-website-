CREATE TABLE `pricing_selections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_name` text DEFAULT '' NOT NULL,
	`package_label` text DEFAULT '' NOT NULL,
	`package_price` text DEFAULT '' NOT NULL,
	`services_json` text DEFAULT '[]' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
