CREATE TABLE "ai_eval_result" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_run_id" text,
	"scorer_id" text NOT NULL,
	"status" text DEFAULT 'skipped' NOT NULL,
	"score" numeric(8, 4),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_eval_result_status_check" CHECK ("ai_eval_result"."status" in ('passed', 'failed', 'skipped', 'error'))
);
--> statement-breakpoint
CREATE TABLE "ai_observability_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"user_id" text,
	"workflow_run_id" text,
	"usage_id" text,
	"thread_id" text,
	"message_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_observability_event_severity_check" CHECK ("ai_observability_event"."severity" in ('debug', 'info', 'warn', 'error'))
);
--> statement-breakpoint
CREATE TABLE "ai_workflow_run" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"workflow_name" text NOT NULL,
	"user_id" text,
	"thread_id" text,
	"message_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"input_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"failure_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_workflow_run_status_check" CHECK ("ai_workflow_run"."status" in ('queued', 'running', 'succeeded', 'failed', 'retrying', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "ai_eval_result" ADD CONSTRAINT "ai_eval_result_workflow_run_id_ai_workflow_run_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."ai_workflow_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observability_event" ADD CONSTRAINT "ai_observability_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observability_event" ADD CONSTRAINT "ai_observability_event_workflow_run_id_ai_workflow_run_id_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "public"."ai_workflow_run"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observability_event" ADD CONSTRAINT "ai_observability_event_usage_id_ai_usage_id_fk" FOREIGN KEY ("usage_id") REFERENCES "public"."ai_usage"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observability_event" ADD CONSTRAINT "ai_observability_event_thread_id_ai_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ai_thread"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_observability_event" ADD CONSTRAINT "ai_observability_event_message_id_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_workflow_run" ADD CONSTRAINT "ai_workflow_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_workflow_run" ADD CONSTRAINT "ai_workflow_run_thread_id_ai_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ai_thread"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_workflow_run" ADD CONSTRAINT "ai_workflow_run_message_id_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_eval_result_workflow_created_idx" ON "ai_eval_result" USING btree ("workflow_run_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_eval_result_scorer_created_idx" ON "ai_eval_result" USING btree ("scorer_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_eval_result_status_created_idx" ON "ai_eval_result" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ai_observability_event_type_created_idx" ON "ai_observability_event" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "ai_observability_event_severity_created_idx" ON "ai_observability_event" USING btree ("severity","created_at");--> statement-breakpoint
CREATE INDEX "ai_observability_event_workflow_created_idx" ON "ai_observability_event" USING btree ("workflow_run_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_observability_event_usage_created_idx" ON "ai_observability_event" USING btree ("usage_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_observability_event_user_created_idx" ON "ai_observability_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_workflow_run_workflow_created_idx" ON "ai_workflow_run" USING btree ("workflow_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_workflow_run_user_created_idx" ON "ai_workflow_run" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_workflow_run_thread_created_idx" ON "ai_workflow_run" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_workflow_run_status_created_idx" ON "ai_workflow_run" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ai_workflow_run_message_id_idx" ON "ai_workflow_run" USING btree ("message_id");