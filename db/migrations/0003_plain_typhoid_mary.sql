ALTER TABLE "user" ADD COLUMN "last_sign_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "sign_in_count" integer DEFAULT 0 NOT NULL;