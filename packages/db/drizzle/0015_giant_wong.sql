CREATE TABLE "media_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"media_type" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"title" text NOT NULL,
	"poster_path" text,
	"message" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_recommendations_media_type_check" CHECK ("media_recommendations"."media_type" in ('movie', 'tv')),
	CONSTRAINT "media_recommendations_no_self" CHECK ("media_recommendations"."sender_id" <> "media_recommendations"."recipient_id")
);
--> statement-breakpoint
ALTER TABLE "media_recommendations" ADD CONSTRAINT "media_recommendations_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_recommendations" ADD CONSTRAINT "media_recommendations_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_recommendations_recipient_idx" ON "media_recommendations" USING btree ("recipient_id","read_at","created_at");