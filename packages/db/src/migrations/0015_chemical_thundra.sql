CREATE TABLE "ai_entitlement_policy" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"status" text DEFAULT 'enabled' NOT NULL,
	"allowed_model_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"knowledge_enabled" boolean DEFAULT true NOT NULL,
	"memory_enabled" boolean DEFAULT true NOT NULL,
	"tools_enabled" boolean DEFAULT false NOT NULL,
	"max_credits_per_request" integer,
	"monthly_credits" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_entitlement_policy_status_check" CHECK ("ai_entitlement_policy"."status" in ('enabled', 'disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_entitlement_policy_plan_id_uidx" ON "ai_entitlement_policy" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "ai_entitlement_policy_status_idx" ON "ai_entitlement_policy" USING btree ("status");