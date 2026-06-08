CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "likes_user_media_kind_unique" UNIQUE("user_id","tmdb_id","media_type","kind"),
	CONSTRAINT "likes_media_type_check" CHECK ("likes"."media_type" in ('movie', 'tv')),
	CONSTRAINT "likes_kind_check" CHECK ("likes"."kind" in ('like', 'favorite'))
);
--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "likes_user_kind_created_idx" ON "likes" USING btree ("user_id","kind","created_at");