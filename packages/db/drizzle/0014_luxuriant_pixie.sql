CREATE TABLE "watch_session_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"inviter_id" text NOT NULL,
	"invitee_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_session_invitations_session_invitee_unique" UNIQUE("session_id","invitee_id"),
	CONSTRAINT "watch_session_invitations_status_check" CHECK ("watch_session_invitations"."status" in ('pending', 'accepted', 'declined', 'canceled', 'expired')),
	CONSTRAINT "watch_session_invitations_no_self_invite" CHECK ("watch_session_invitations"."inviter_id" <> "watch_session_invitations"."invitee_id")
);
--> statement-breakpoint
CREATE TABLE "watch_session_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'host' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_progress_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_session_participants_session_user_unique" UNIQUE("session_id","user_id"),
	CONSTRAINT "watch_session_participants_role_check" CHECK ("watch_session_participants"."role" in ('host', 'guest')),
	CONSTRAINT "watch_session_participants_status_check" CHECK ("watch_session_participants"."status" in ('active', 'paused', 'completed', 'abandoned')),
	CONSTRAINT "watch_session_participants_position_check" CHECK ("watch_session_participants"."position_seconds" >= 0),
	CONSTRAINT "watch_session_participants_duration_check" CHECK ("watch_session_participants"."duration_seconds" > 0)
);
--> statement-breakpoint
CREATE TABLE "watch_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" text NOT NULL,
	"media_type" text NOT NULL,
	"tmdb_id" bigint NOT NULL,
	"season_number" integer,
	"episode_number" integer,
	"episode_tmdb_id" bigint,
	"title" text NOT NULL,
	"poster_path" text,
	"duration_seconds" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_sessions_media_type_check" CHECK ("watch_sessions"."media_type" in ('movie', 'episode')),
	CONSTRAINT "watch_sessions_status_check" CHECK ("watch_sessions"."status" in ('active', 'completed', 'canceled')),
	CONSTRAINT "watch_sessions_duration_check" CHECK ("watch_sessions"."duration_seconds" > 0),
	CONSTRAINT "watch_sessions_episode_fields_check" CHECK (("watch_sessions"."media_type" = 'movie' and "watch_sessions"."season_number" is null and "watch_sessions"."episode_number" is null and "watch_sessions"."episode_tmdb_id" is null) or ("watch_sessions"."media_type" = 'episode' and "watch_sessions"."season_number" is not null and "watch_sessions"."episode_number" is not null))
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"device_id" text,
	"platform" text DEFAULT 'ios' NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "watch_session_invitations" ADD CONSTRAINT "watch_session_invitations_session_id_watch_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."watch_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_session_invitations" ADD CONSTRAINT "watch_session_invitations_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_session_invitations" ADD CONSTRAINT "watch_session_invitations_invitee_id_user_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_session_participants" ADD CONSTRAINT "watch_session_participants_session_id_watch_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."watch_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_session_participants" ADD CONSTRAINT "watch_session_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_sessions" ADD CONSTRAINT "watch_sessions_host_id_user_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "watch_session_invitations_invitee_status_created_idx" ON "watch_session_invitations" USING btree ("invitee_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "watch_session_participants_one_active_per_user" ON "watch_session_participants" USING btree ("user_id") WHERE "watch_session_participants"."status" = 'active';--> statement-breakpoint
CREATE INDEX "watch_session_participants_user_status_progress_idx" ON "watch_session_participants" USING btree ("user_id","status","last_progress_at");--> statement-breakpoint
CREATE INDEX "watch_session_participants_session_idx" ON "watch_session_participants" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "watch_sessions_host_status_idx" ON "watch_sessions" USING btree ("host_id","status");--> statement-breakpoint
CREATE INDEX "watch_sessions_media_idx" ON "watch_sessions" USING btree ("media_type","tmdb_id");--> statement-breakpoint
CREATE INDEX "push_tokens_user_idx" ON "push_tokens" USING btree ("user_id");