CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_metadata" jsonb,
	"app_metadata" jsonb,
	"invited_at" timestamp,
	"last_sign_in_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episode_rating_stats" (
	"series_tmdb_id" bigint NOT NULL,
	"season_number" integer NOT NULL,
	"episode_number" integer NOT NULL,
	"sum_rating" bigint DEFAULT 0 NOT NULL,
	"rating_count" bigint DEFAULT 0 NOT NULL,
	"histogram" integer[] DEFAULT '{0,0,0,0,0,0,0,0,0,0}'::integer[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "episode_rating_stats_series_tmdb_id_season_number_episode_number_pk" PRIMARY KEY("series_tmdb_id","season_number","episode_number")
);
--> statement-breakpoint
CREATE TABLE "episode_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"series_tmdb_id" bigint NOT NULL,
	"episode_tmdb_id" bigint NOT NULL,
	"season_number" integer NOT NULL,
	"episode_number" integer NOT NULL,
	"rating" smallint NOT NULL,
	"title" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "episode_reviews_user_episode_unique" UNIQUE("user_id","series_tmdb_id","season_number","episode_number"),
	CONSTRAINT "episode_reviews_season_number_check" CHECK ("episode_reviews"."season_number" >= 0),
	CONSTRAINT "episode_reviews_episode_number_check" CHECK ("episode_reviews"."episode_number" > 0),
	CONSTRAINT "episode_reviews_rating_range" CHECK ("episode_reviews"."rating" between 1 and 10),
	CONSTRAINT "episode_reviews_has_content" CHECK ("episode_reviews"."rating" is not null or ("episode_reviews"."title" is not null and length(btrim("episode_reviews"."title")) > 0) or ("episode_reviews"."comment" is not null and length(btrim("episode_reviews"."comment")) > 0))
);
--> statement-breakpoint
CREATE TABLE "media_rating_stats" (
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"sum_rating" bigint DEFAULT 0 NOT NULL,
	"rating_count" bigint DEFAULT 0 NOT NULL,
	"review_count" bigint DEFAULT 0 NOT NULL,
	"histogram" integer[] DEFAULT '{0,0,0,0,0,0,0,0,0,0}'::integer[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_rating_stats_tmdb_id_media_type_pk" PRIMARY KEY("tmdb_id","media_type")
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"title" text NOT NULL,
	"original_title" text,
	"overview" text,
	"release_date" date,
	"poster_path" text,
	"backdrop_path" text,
	"vote_average" numeric,
	"vote_count" integer,
	"popularity" numeric,
	"runtime" integer,
	"genres" jsonb,
	"language" text DEFAULT 'fr-FR' NOT NULL,
	"detail" jsonb,
	"detail_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_tmdb_id_media_type_pk" PRIMARY KEY("tmdb_id","media_type"),
	CONSTRAINT "movies_media_type_check" CHECK ("movies"."media_type" in ('movie', 'tv'))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"avatar_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "profiles_full_name_not_blank" CHECK (length(btrim("profiles"."full_name")) > 0),
	CONSTRAINT "profiles_username_format" CHECK ("profiles"."username" = lower("profiles"."username") and "profiles"."username" ~ '^[a-z0-9_.]{3,20}$')
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"rating" smallint,
	"title" text,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_user_movie_unique" UNIQUE("user_id","tmdb_id","media_type"),
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" is null or "reviews"."rating" between 1 and 10),
	CONSTRAINT "reviews_has_content" CHECK ("reviews"."rating" is not null or ("reviews"."title" is not null and length(btrim("reviews"."title")) > 0) or ("reviews"."comment" is not null and length(btrim("reviews"."comment")) > 0))
);
--> statement-breakpoint
CREATE TABLE "series_rating_stats" (
	"series_tmdb_id" bigint PRIMARY KEY NOT NULL,
	"sum_of_episode_avgs" numeric DEFAULT 0 NOT NULL,
	"episodes_with_ratings" integer DEFAULT 0 NOT NULL,
	"total_rating_count" bigint DEFAULT 0 NOT NULL,
	"histogram" integer[] DEFAULT '{0,0,0,0,0,0,0,0,0,0}'::integer[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_reviews" ADD CONSTRAINT "episode_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_user_id_fk" FOREIGN KEY ("id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "episode_reviews_series_idx" ON "episode_reviews" USING btree ("series_tmdb_id","created_at");--> statement-breakpoint
CREATE INDEX "episode_reviews_episode_idx" ON "episode_reviews" USING btree ("series_tmdb_id","season_number","episode_number","created_at");--> statement-breakpoint
CREATE INDEX "episode_reviews_user_idx" ON "episode_reviews" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_movie_idx" ON "reviews" USING btree ("tmdb_id","media_type","created_at");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id","created_at");
