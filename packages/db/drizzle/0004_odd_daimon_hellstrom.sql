CREATE TABLE "interaction_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" bigint,
	"media_type" text,
	"type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interaction_events_type_check" CHECK ("interaction_events"."type" in ('opened_detail', 'viewed_trailer', 'searched', 'search_query', 'shared', 'clicked_streaming', 'added_watchlist', 'removed_watchlist', 'marked_watched', 'rated', 'reviewed', 'liked', 'dismissed', 'not_interested')),
	CONSTRAINT "interaction_events_media_type_check" CHECK ("interaction_events"."media_type" is null or "interaction_events"."media_type" in ('movie', 'tv'))
);
--> statement-breakpoint
CREATE TABLE "recommendation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"source" text NOT NULL,
	"position" integer NOT NULL,
	"shown_at" timestamp with time zone DEFAULT now() NOT NULL,
	"clicked" boolean DEFAULT false NOT NULL,
	"added_to_watchlist" boolean DEFAULT false NOT NULL,
	"marked_watched" boolean DEFAULT false NOT NULL,
	"rated" boolean DEFAULT false NOT NULL,
	"shared" boolean DEFAULT false NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"time_spent_ms" integer,
	CONSTRAINT "recommendation_events_source_check" CHECK ("recommendation_events"."source" in ('content', 'collaborative', 'trending', 'availability', 'social')),
	CONSTRAINT "recommendation_events_media_type_check" CHECK ("recommendation_events"."media_type" in ('movie', 'tv'))
);
--> statement-breakpoint
ALTER TABLE "interaction_events" ADD CONSTRAINT "interaction_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interaction_events_user_idx" ON "interaction_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "interaction_events_media_idx" ON "interaction_events" USING btree ("tmdb_id","type");--> statement-breakpoint
CREATE INDEX "recommendation_events_user_idx" ON "recommendation_events" USING btree ("user_id","shown_at");--> statement-breakpoint
CREATE INDEX "recommendation_events_media_idx" ON "recommendation_events" USING btree ("tmdb_id");