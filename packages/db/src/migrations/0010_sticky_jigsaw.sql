CREATE TYPE "public"."knowledge_source_kind" AS ENUM('manual-note', 'uploaded-file', 'url', 'integration');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_status" AS ENUM('draft', 'indexing', 'ready', 'failed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."knowledge_source_visibility" AS ENUM('private', 'shared', 'public');--> statement-breakpoint
CREATE TABLE "knowledge_chunk" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"source_id" text NOT NULL,
	"text" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"char_count" integer DEFAULT 0 NOT NULL,
	"vector_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_document" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"mime_type" text DEFAULT 'text/plain',
	"char_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_source" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "knowledge_source_kind" DEFAULT 'manual-note' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"user_id" text NOT NULL,
	"visibility" "knowledge_source_visibility" DEFAULT 'private' NOT NULL,
	"status" "knowledge_source_status" DEFAULT 'draft' NOT NULL,
	"error_message" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"vector_count" integer DEFAULT 0 NOT NULL,
	"embedding_model" text,
	"embedding_dimensions" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"indexed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "knowledge_source_access" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"user_id" text NOT NULL,
	"permission" text DEFAULT 'read' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_source_access_permission_check" CHECK ("knowledge_source_access"."permission" in ('read', 'write', 'admin'))
);
--> statement-breakpoint
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_document_id_knowledge_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_source_id_knowledge_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_document" ADD CONSTRAINT "knowledge_document_source_id_knowledge_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_source" ADD CONSTRAINT "knowledge_source_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_source_access" ADD CONSTRAINT "knowledge_source_access_source_id_knowledge_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_source_access" ADD CONSTRAINT "knowledge_source_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_chunk_document_id_idx" ON "knowledge_chunk" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunk_source_id_idx" ON "knowledge_chunk" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_chunk_vector_id_idx" ON "knowledge_chunk" USING btree ("vector_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_chunk_document_index_uidx" ON "knowledge_chunk" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "knowledge_document_source_id_idx" ON "knowledge_document" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_document_source_id_uidx" ON "knowledge_document" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_source_user_id_idx" ON "knowledge_source" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "knowledge_source_status_idx" ON "knowledge_source" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_source_kind_idx" ON "knowledge_source" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "knowledge_source_visibility_idx" ON "knowledge_source" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "knowledge_source_user_status_idx" ON "knowledge_source" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "knowledge_source_access_source_id_idx" ON "knowledge_source_access" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "knowledge_source_access_user_id_idx" ON "knowledge_source_access" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_source_access_source_user_uidx" ON "knowledge_source_access" USING btree ("source_id","user_id");