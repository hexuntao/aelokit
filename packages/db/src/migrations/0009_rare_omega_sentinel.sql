CREATE TABLE "ai_agent" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"instructions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visibility" text DEFAULT 'system' NOT NULL,
	"status" text DEFAULT 'enabled' NOT NULL,
	"default_provider_id" text,
	"default_model_id" text,
	"tool_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skill_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_agent_visibility_check" CHECK ("ai_agent"."visibility" in ('system', 'public', 'private')),
	CONSTRAINT "ai_agent_status_check" CHECK ("ai_agent"."status" in ('enabled', 'disabled', 'deprecated'))
);
--> statement-breakpoint
CREATE TABLE "ai_message" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"parent_message_id" text,
	"role" text NOT NULL,
	"runtime_format" text DEFAULT 'aisdk-v6' NOT NULL,
	"status" text DEFAULT 'complete' NOT NULL,
	"sort_order" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "ai_message_role_check" CHECK ("ai_message"."role" in ('system', 'user', 'assistant', 'tool')),
	CONSTRAINT "ai_message_runtime_format_check" CHECK ("ai_message"."runtime_format" = 'aisdk-v6'),
	CONSTRAINT "ai_message_status_check" CHECK ("ai_message"."status" in ('streaming', 'complete', 'error', 'aborted'))
);
--> statement-breakpoint
CREATE TABLE "ai_message_part" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"part_type" text NOT NULL,
	"runtime_part_type" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tool_call_id" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_message_part_type_check" CHECK ("ai_message_part"."part_type" in ('text', 'reasoning', 'tool-call', 'tool-result', 'file', 'image', 'source', 'data'))
);
--> statement-breakpoint
CREATE TABLE "ai_model" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"provider_model_id" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"context_window_tokens" integer,
	"max_output_tokens" integer,
	"input_cost_per_million_tokens" numeric(12, 6),
	"output_cost_per_million_tokens" numeric(12, 6),
	"cached_input_cost_per_million_tokens" numeric(12, 6),
	"cost_currency_code" text,
	"cost_metadata_updated_at" timestamp,
	"status" text DEFAULT 'enabled' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_model_status_check" CHECK ("ai_model"."status" in ('enabled', 'disabled', 'deprecated'))
);
--> statement-breakpoint
CREATE TABLE "ai_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"documentation_url" text,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'enabled' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_status_check" CHECK ("ai_provider"."status" in ('enabled', 'disabled', 'deprecated'))
);
--> statement-breakpoint
CREATE TABLE "ai_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"agent_id" text,
	"provider_id" text,
	"model_id" text,
	"title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "ai_thread_status_check" CHECK ("ai_thread"."status" in ('active', 'archived', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "ai_tool_call" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"message_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"tool_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"provider_executed" boolean DEFAULT false NOT NULL,
	"error_code" text,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tool_call_status_check" CHECK ("ai_tool_call"."status" in ('pending', 'running', 'success', 'error', 'timeout'))
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text,
	"message_id" text,
	"provider_id" text NOT NULL,
	"model_id" text NOT NULL,
	"provider_model_id" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"cached_input_tokens" integer,
	"reasoning_tokens" integer,
	"estimated_cost_usd" numeric(12, 6),
	"cost_currency_code" text,
	"cost_estimate_source" text,
	"status" text NOT NULL,
	"failure_reason" text,
	"error_code" text,
	"error_message" text,
	"request_duration_ms" integer,
	"raw_usage" jsonb,
	"provider_metadata" jsonb,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_status_check" CHECK ("ai_usage"."status" in ('success', 'error', 'timeout', 'rate_limited')),
	CONSTRAINT "ai_usage_cost_estimate_source_check" CHECK ("ai_usage"."cost_estimate_source" is null or "ai_usage"."cost_estimate_source" in ('model-metadata', 'provider-reported', 'manual-estimate', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "ai_user_model_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"model_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ai_model_provider_id_id_uidx" ON "ai_model" USING btree ("provider_id","id");--> statement-breakpoint
ALTER TABLE "ai_agent" ADD CONSTRAINT "ai_agent_default_provider_id_ai_provider_id_fk" FOREIGN KEY ("default_provider_id") REFERENCES "public"."ai_provider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent" ADD CONSTRAINT "ai_agent_default_model_id_ai_model_id_fk" FOREIGN KEY ("default_model_id") REFERENCES "public"."ai_model"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent" ADD CONSTRAINT "ai_agent_default_model_fk" FOREIGN KEY ("default_provider_id","default_model_id") REFERENCES "public"."ai_model"("provider_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_thread_id_ai_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ai_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_parent_message_id_ai_message_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message_part" ADD CONSTRAINT "ai_message_part_message_id_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_message_part" ADD CONSTRAINT "ai_message_part_tool_call_id_ai_tool_call_id_fk" FOREIGN KEY ("tool_call_id") REFERENCES "public"."ai_tool_call"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model" ADD CONSTRAINT "ai_model_provider_id_ai_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_provider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_thread" ADD CONSTRAINT "ai_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_thread" ADD CONSTRAINT "ai_thread_agent_id_ai_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."ai_agent"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_thread" ADD CONSTRAINT "ai_thread_provider_id_ai_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_provider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_thread" ADD CONSTRAINT "ai_thread_model_id_ai_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_model"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_thread" ADD CONSTRAINT "ai_thread_model_fk" FOREIGN KEY ("provider_id","model_id") REFERENCES "public"."ai_model"("provider_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tool_call" ADD CONSTRAINT "ai_tool_call_thread_id_ai_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ai_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tool_call" ADD CONSTRAINT "ai_tool_call_message_id_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_thread_id_ai_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ai_thread"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_message_id_ai_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."ai_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_provider_id_ai_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_provider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_model_id_ai_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_model"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_provider_model_fk" FOREIGN KEY ("provider_id","model_id") REFERENCES "public"."ai_model"("provider_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_user_model_setting" ADD CONSTRAINT "ai_user_model_setting_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_user_model_setting" ADD CONSTRAINT "ai_user_model_setting_provider_id_ai_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_provider"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_user_model_setting" ADD CONSTRAINT "ai_user_model_setting_model_id_ai_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_model"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_user_model_setting" ADD CONSTRAINT "ai_user_model_setting_provider_model_fk" FOREIGN KEY ("provider_id","model_id") REFERENCES "public"."ai_model"("provider_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_agent_visibility_status_idx" ON "ai_agent" USING btree ("visibility","status");--> statement-breakpoint
CREATE INDEX "ai_agent_default_model_idx" ON "ai_agent" USING btree ("default_provider_id","default_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_agent_slug_uidx" ON "ai_agent" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "ai_message_thread_sort_idx" ON "ai_message" USING btree ("thread_id","sort_order");--> statement-breakpoint
CREATE INDEX "ai_message_thread_created_idx" ON "ai_message" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_message_parent_id_idx" ON "ai_message" USING btree ("parent_message_id");--> statement-breakpoint
CREATE INDEX "ai_message_status_idx" ON "ai_message" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_message_thread_sort_uidx" ON "ai_message" USING btree ("thread_id","sort_order");--> statement-breakpoint
CREATE INDEX "ai_message_part_message_sort_idx" ON "ai_message_part" USING btree ("message_id","sort_order");--> statement-breakpoint
CREATE INDEX "ai_message_part_type_idx" ON "ai_message_part" USING btree ("part_type");--> statement-breakpoint
CREATE INDEX "ai_message_part_tool_call_id_idx" ON "ai_message_part" USING btree ("tool_call_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_message_part_message_sort_uidx" ON "ai_message_part" USING btree ("message_id","sort_order");--> statement-breakpoint
CREATE INDEX "ai_model_provider_id_idx" ON "ai_model" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "ai_model_status_idx" ON "ai_model" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_model_provider_status_idx" ON "ai_model" USING btree ("provider_id","status");--> statement-breakpoint
CREATE INDEX "ai_model_sort_order_idx" ON "ai_model" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_model_provider_model_id_uidx" ON "ai_model" USING btree ("provider_id","provider_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_model_provider_default_uidx" ON "ai_model" USING btree ("provider_id") WHERE "ai_model"."is_default" = true;--> statement-breakpoint
CREATE INDEX "ai_provider_status_idx" ON "ai_provider" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_provider_sort_order_idx" ON "ai_provider" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "ai_thread_user_status_updated_idx" ON "ai_thread" USING btree ("user_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "ai_thread_user_created_idx" ON "ai_thread" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_thread_agent_id_idx" ON "ai_thread" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "ai_thread_model_idx" ON "ai_thread" USING btree ("provider_id","model_id");--> statement-breakpoint
CREATE INDEX "ai_tool_call_thread_created_idx" ON "ai_tool_call" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_tool_call_message_id_idx" ON "ai_tool_call" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ai_tool_call_status_idx" ON "ai_tool_call" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_tool_call_tool_name_idx" ON "ai_tool_call" USING btree ("tool_name");--> statement-breakpoint
CREATE INDEX "ai_usage_user_created_idx" ON "ai_usage" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_thread_created_idx" ON "ai_usage" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_message_id_idx" ON "ai_usage" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ai_usage_provider_model_created_idx" ON "ai_usage" USING btree ("provider_id","model_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_status_created_idx" ON "ai_usage" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ai_user_model_setting_provider_model_idx" ON "ai_user_model_setting" USING btree ("provider_id","model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_user_model_setting_user_id_uidx" ON "ai_user_model_setting" USING btree ("user_id");
