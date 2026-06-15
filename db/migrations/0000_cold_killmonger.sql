CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"zone" text NOT NULL,
	"source" text NOT NULL,
	"overall_status" text NOT NULL,
	"compliance_score" double precision NOT NULL,
	"summary" text NOT NULL,
	"verdict" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scenario_id" text NOT NULL,
	"kitchen" text NOT NULL,
	"date_iso" text NOT NULL,
	"overall_risk" text NOT NULL,
	"total_leakage_idr" double precision NOT NULL,
	"summary" text NOT NULL,
	"reconciliation" jsonb NOT NULL,
	"assessment" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger" (
	"seq" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"ref_id" text,
	"payload_hash" text NOT NULL,
	"prev_hash" text NOT NULL,
	"hash" text NOT NULL
);
