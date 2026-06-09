CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "media_features" (
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"embedding" vector(256) NOT NULL,
	"features" jsonb,
	"encoder_version" integer DEFAULT 1 NOT NULL,
	"built_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_features_tmdb_id_media_type_pk" PRIMARY KEY("tmdb_id","media_type"),
	CONSTRAINT "media_features_media_type_check" CHECK ("media_features"."media_type" in ('movie', 'tv'))
);
--> statement-breakpoint
CREATE TABLE "user_taste_vectors" (
	"user_id" text PRIMARY KEY NOT NULL,
	"embedding" vector(256) NOT NULL,
	"encoder_version" integer DEFAULT 1 NOT NULL,
	"signal_count" integer DEFAULT 0 NOT NULL,
	"built_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_taste_vectors" ADD CONSTRAINT "user_taste_vectors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_features_embedding_hnsw" ON "media_features" USING hnsw ("embedding" vector_cosine_ops);