CREATE TABLE "media_providers" (
	"tmdb_id" bigint NOT NULL,
	"media_type" text NOT NULL,
	"region" text NOT NULL,
	"provider_id" bigint NOT NULL,
	"offer_type" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_providers_tmdb_id_media_type_region_provider_id_offer_type_pk" PRIMARY KEY("tmdb_id","media_type","region","provider_id","offer_type"),
	CONSTRAINT "media_providers_media_type_check" CHECK ("media_providers"."media_type" in ('movie', 'tv')),
	CONSTRAINT "media_providers_offer_type_check" CHECK ("media_providers"."offer_type" in ('flatrate', 'rent', 'buy', 'ads', 'free'))
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"provider_id" bigint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo_path" text,
	"display_priority" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_platforms" (
	"user_id" text NOT NULL,
	"provider_id" bigint NOT NULL,
	"region" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_platforms_user_provider_region_unique" UNIQUE("user_id","provider_id","region")
);
--> statement-breakpoint
ALTER TABLE "user_platforms" ADD CONSTRAINT "user_platforms_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_platforms" ADD CONSTRAINT "user_platforms_provider_id_providers_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("provider_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_providers_region_provider_idx" ON "media_providers" USING btree ("region","provider_id");--> statement-breakpoint
CREATE INDEX "user_platforms_user_idx" ON "user_platforms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_platforms_user_region_idx" ON "user_platforms" USING btree ("user_id","region");