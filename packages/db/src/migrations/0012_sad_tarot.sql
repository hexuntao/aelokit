CREATE TABLE "ai_cost_event" (
	"id" text PRIMARY KEY NOT NULL,
	"usage_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"model_id" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"estimated_cost_usd" numeric(12, 6),
	"estimated_credits" integer,
	"currency_code" text,
	"source" text DEFAULT 'unknown' NOT NULL,
	"status" text DEFAULT 'estimated' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_cost_event_source_check" CHECK ("ai_cost_event"."source" in ('model-metadata', 'provider-reported', 'manual-estimate', 'unknown')),
	CONSTRAINT "ai_cost_event_status_check" CHECK ("ai_cost_event"."status" in ('estimated', 'final', 'failed', 'no_charge'))
);
--> statement-breakpoint
CREATE TABLE "ai_credit_reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"usage_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reservation_status" text DEFAULT 'reserved' NOT NULL,
	"settlement_status" text DEFAULT 'pending' NOT NULL,
	"refund_status" text DEFAULT 'not_required' NOT NULL,
	"reserved_credits" integer DEFAULT 0 NOT NULL,
	"settled_credits" integer,
	"refunded_credits" integer,
	"failure_reason" text,
	"expires_at" timestamp,
	"reserved_at" timestamp,
	"settled_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credit_reservation_reservation_status_check" CHECK ("ai_credit_reservation"."reservation_status" in ('preflight_passed', 'preflight_failed', 'reserved', 'reservation_failed', 'cancelled', 'timeout', 'rate_limited')),
	CONSTRAINT "ai_credit_reservation_settlement_status_check" CHECK ("ai_credit_reservation"."settlement_status" in ('pending', 'settled', 'settlement_failed', 'no_charge', 'cancelled', 'timeout', 'rate_limited')),
	CONSTRAINT "ai_credit_reservation_refund_status_check" CHECK ("ai_credit_reservation"."refund_status" in ('not_required', 'refunded', 'refund_failed', 'no_charge', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN "billing_mode" text DEFAULT 'audit_only' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN "billing_status" text DEFAULT 'audit_only' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD COLUMN "billing_reference" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_cost_event" ADD CONSTRAINT "ai_cost_event_usage_id_ai_usage_id_fk" FOREIGN KEY ("usage_id") REFERENCES "public"."ai_usage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cost_event" ADD CONSTRAINT "ai_cost_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cost_event" ADD CONSTRAINT "ai_cost_event_provider_id_ai_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_provider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cost_event" ADD CONSTRAINT "ai_cost_event_model_id_ai_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_model"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cost_event" ADD CONSTRAINT "ai_cost_event_provider_model_fk" FOREIGN KEY ("provider_id","model_id") REFERENCES "public"."ai_model"("provider_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_reservation" ADD CONSTRAINT "ai_credit_reservation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_cost_event_usage_id_idx" ON "ai_cost_event" USING btree ("usage_id");--> statement-breakpoint
CREATE INDEX "ai_cost_event_user_created_idx" ON "ai_cost_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_cost_event_provider_model_created_idx" ON "ai_cost_event" USING btree ("provider_id","model_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_cost_event_status_created_idx" ON "ai_cost_event" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ai_credit_reservation_usage_id_idx" ON "ai_credit_reservation" USING btree ("usage_id");--> statement-breakpoint
CREATE INDEX "ai_credit_reservation_user_created_idx" ON "ai_credit_reservation" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_credit_reservation_status_idx" ON "ai_credit_reservation" USING btree ("reservation_status","settlement_status","refund_status");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_credit_reservation_usage_id_uidx" ON "ai_credit_reservation" USING btree ("usage_id");--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_billing_mode_check" CHECK ("ai_usage"."billing_mode" in ('audit_only', 'credits'));--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_billing_status_check" CHECK ("ai_usage"."billing_status" in ('audit_only', 'preflight_passed', 'preflight_failed', 'reserved', 'reservation_failed', 'settled', 'settlement_failed', 'refunded', 'refund_failed', 'no_charge', 'cancelled', 'timeout', 'rate_limited'));