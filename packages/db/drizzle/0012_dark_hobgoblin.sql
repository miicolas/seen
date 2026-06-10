CREATE TABLE "feed_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"section" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"source" text NOT NULL,
	"score" real NOT NULL,
	"rank" integer NOT NULL,
	"anchor_title" text,
	"region" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_entries_section_check" CHECK ("feed_entries"."section" in ('today', 'because_you_rated', 'trending', 'available_tonight', 'discovery')),
	CONSTRAINT "feed_entries_media_type_check" CHECK ("feed_entries"."media_type" in ('movie', 'tv')),
	CONSTRAINT "feed_entries_source_check" CHECK ("feed_entries"."source" in ('content', 'collaborative', 'trending', 'availability', 'social'))
);
--> statement-breakpoint
ALTER TABLE "feed_entries" ADD CONSTRAINT "feed_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_entries_user_idx" ON "feed_entries" USING btree ("user_id","computed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "feed_entries_user_entry_unique" ON "feed_entries" USING btree ("user_id","section","tmdb_id","media_type");