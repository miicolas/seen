ALTER TABLE "episode_reviews" ADD COLUMN "runtime_minutes" integer;--> statement-breakpoint
ALTER TABLE "episode_reviews" ADD COLUMN "runtime_confidence" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "episode_reviews" ADD COLUMN "watched_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "watched_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "episode_reviews" SET "watched_at" = "created_at";--> statement-breakpoint
UPDATE "reviews" SET "watched_at" = "created_at";--> statement-breakpoint
CREATE INDEX "episode_reviews_user_watched_idx" ON "episode_reviews" USING btree ("user_id","watched_at");--> statement-breakpoint
CREATE INDEX "reviews_user_watched_idx" ON "reviews" USING btree ("user_id","watched_at");--> statement-breakpoint
ALTER TABLE "episode_reviews" ADD CONSTRAINT "episode_reviews_runtime_confidence_check" CHECK ("episode_reviews"."runtime_confidence" in ('exact', 'estimated', 'unknown'));