CREATE TABLE "not_interested" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "not_interested_user_media_unique" UNIQUE("user_id","tmdb_id","media_type"),
	CONSTRAINT "not_interested_media_type_check" CHECK ("not_interested"."media_type" in ('movie', 'tv'))
);
--> statement-breakpoint
ALTER TABLE "not_interested" ADD CONSTRAINT "not_interested_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "not_interested_user_created_idx" ON "not_interested" USING btree ("user_id","created_at");