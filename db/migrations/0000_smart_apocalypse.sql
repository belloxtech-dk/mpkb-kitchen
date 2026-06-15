CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`zone` text NOT NULL,
	`source` text NOT NULL,
	`overall_status` text NOT NULL,
	`compliance_score` real NOT NULL,
	`summary` text NOT NULL,
	`verdict` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`kind` text NOT NULL,
	`ref_id` text,
	`payload_hash` text NOT NULL,
	`prev_hash` text NOT NULL,
	`hash` text NOT NULL
);
