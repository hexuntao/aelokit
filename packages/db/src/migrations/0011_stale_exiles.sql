CREATE TABLE "ai_memory_draft" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"mastra_thread_id" text,
	"mastra_message_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "ai_memory_draft_status_check" CHECK ("ai_memory_draft"."status" in ('pending', 'confirmed', 'deleted'))
);
--> statement-breakpoint
ALTER TABLE "ai_memory_draft" ADD CONSTRAINT "ai_memory_draft_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_memory_draft_user_status_idx" ON "ai_memory_draft" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "ai_memory_draft_user_created_idx" ON "ai_memory_draft" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_memory_draft_mastra_thread_uidx" ON "ai_memory_draft" USING btree ("mastra_thread_id") WHERE "ai_memory_draft"."mastra_thread_id" is not null;