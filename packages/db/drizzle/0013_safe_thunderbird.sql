ALTER TABLE "feed_entries" DROP CONSTRAINT "feed_entries_section_check";--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "components" jsonb;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "anchor_tmdb_id" bigint;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "anchor_media_type" text;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "primary_genre_id" integer;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "director_key" text;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "popularity" real;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "vote_average" real;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD COLUMN "vote_count" integer;--> statement-breakpoint
ALTER TABLE "feed_entries" ADD CONSTRAINT "feed_entries_anchor_media_type_check" CHECK ("feed_entries"."anchor_media_type" is null or "feed_entries"."anchor_media_type" in ('movie', 'tv'));--> statement-breakpoint
ALTER TABLE "feed_entries" ADD CONSTRAINT "feed_entries_section_check" CHECK ("feed_entries"."section" in ('pool', 'today', 'because_you_rated', 'trending', 'available_tonight', 'discovery', 'acclaimed', 'hidden_gems'));