CREATE TABLE "follow_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" text NOT NULL,
	"target_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follow_requests_requester_target_unique" UNIQUE("requester_id","target_id"),
	CONSTRAINT "follow_requests_no_self" CHECK ("follow_requests"."requester_id" <> "follow_requests"."target_id"),
	CONSTRAINT "follow_requests_status_check" CHECK ("follow_requests"."status" in ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" text NOT NULL,
	"followee_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_followee_unique" UNIQUE("follower_id","followee_id"),
	CONSTRAINT "follows_no_self_follow" CHECK ("follows"."follower_id" <> "follows"."followee_id")
);
--> statement-breakpoint
CREATE TABLE "profile_contact_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_contact_identifiers_user_kind_hash_unique" UNIQUE("user_id","kind","hash"),
	CONSTRAINT "profile_contact_identifiers_kind_check" CHECK ("profile_contact_identifiers"."kind" in ('email', 'phone'))
);
--> statement-breakpoint
ALTER TABLE "watchlist" DROP CONSTRAINT "watchlist_visibility_check";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "follow_policy" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_visibility" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "default_watchlist_visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "contact_discovery_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "follow_requests" ADD CONSTRAINT "follow_requests_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_requests" ADD CONSTRAINT "follow_requests_target_id_user_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_id_user_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_contact_identifiers" ADD CONSTRAINT "profile_contact_identifiers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "follow_requests_target_status_created_idx" ON "follow_requests" USING btree ("target_id","status","created_at");--> statement-breakpoint
CREATE INDEX "follows_followee_created_idx" ON "follows" USING btree ("followee_id","created_at");--> statement-breakpoint
CREATE INDEX "follows_follower_created_idx" ON "follows" USING btree ("follower_id","created_at");--> statement-breakpoint
CREATE INDEX "profile_contact_identifiers_kind_hash_idx" ON "profile_contact_identifiers" USING btree ("kind","hash");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_follow_policy_check" CHECK ("profiles"."follow_policy" in ('open', 'approval_required'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_profile_visibility_check" CHECK ("profiles"."profile_visibility" in ('public', 'followers'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_default_watchlist_visibility_check" CHECK ("profiles"."default_watchlist_visibility" in ('private', 'followers', 'public'));--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_visibility_check" CHECK ("watchlist"."visibility" in ('private', 'followers', 'public'));