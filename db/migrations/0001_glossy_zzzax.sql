CREATE TABLE `finance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`scenario_id` text NOT NULL,
	`kitchen` text NOT NULL,
	`date_iso` text NOT NULL,
	`overall_risk` text NOT NULL,
	`total_leakage_idr` real NOT NULL,
	`summary` text NOT NULL,
	`reconciliation` text NOT NULL,
	`assessment` text NOT NULL
);
