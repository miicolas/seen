CREATE TABLE "watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	CONSTRAINT "watchlist_user_media_unique" UNIQUE("user_id","tmdb_id","media_type"),
	CONSTRAINT "watchlist_media_type_check" CHECK ("watchlist"."media_type" in ('movie', 'tv')),
	CONSTRAINT "watchlist_visibility_check" CHECK ("watchlist"."visibility" in ('private'))
);
--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "watchlist_user_added_idx" ON "watchlist" USING btree ("user_id","added_at");--> statement-breakpoint
CREATE INDEX "watchlist_user_media_type_added_idx" ON "watchlist" USING btree ("user_id","media_type","added_at");