import { db } from "@seen/db";
import { watchSessionParticipants, watchSessions } from "@seen/db/schema";
import { and, eq, inArray, isNull } from "@seen/db/orm";

import { HttpError } from "../../../lib/http-error";
import { resolveEpisodeRuntime } from "../../episode-reviews/queries/resolve-episode-runtime";
import { getMediaDetail } from "../../tmdb/queries/media-detail";
import { applyParticipantAction } from "../session-state";
import { pauseActiveParticipants, serializeSession, toProgress, type SessionDto } from "../shared";

export type StartSessionInput = {
  media_type: "movie" | "episode";
  tmdb_id: number;
  season_number?: number | null;
  episode_number?: number | null;
  episode_tmdb_id?: number | null;
  duration_seconds?: number | null;
};

type ResolvedMedia = {
  title: string;
  posterPath: string | null;
  durationSeconds: number | null;
};

async function resolveMedia(input: StartSessionInput): Promise<ResolvedMedia> {
  if (input.media_type === "movie") {
    const detail = await getMediaDetail("movie", input.tmdb_id);
    return {
      title: detail.title ?? "Untitled",
      posterPath: detail.poster_path ?? null,
      durationSeconds: detail.runtime ? detail.runtime * 60 : null,
    };
  }
  const [series, runtime] = await Promise.all([
    getMediaDetail("tv", input.tmdb_id),
    resolveEpisodeRuntime(input.tmdb_id, input.season_number!, input.episode_number!),
  ]);
  return {
    title: series.title ?? "Untitled",
    posterPath: series.poster_path ?? null,
    durationSeconds: runtime.runtimeMinutes ? runtime.runtimeMinutes * 60 : null,
  };
}

export async function startSession(userId: string, input: StartSessionInput): Promise<SessionDto> {
  if (
    input.media_type === "episode" &&
    (input.season_number == null || input.episode_number == null)
  ) {
    throw new HttpError(400, "An episode session needs a season and episode number.");
  }

  const reused = await resumeExistingSession(userId, input);
  if (reused) return reused;

  const media = await resolveMedia(input);
  const durationSeconds = media.durationSeconds ?? input.duration_seconds ?? null;
  if (!durationSeconds) {
    throw new HttpError(
      422,
      "The runtime is unknown — set a duration to start watching.",
      "DURATION_REQUIRED",
    );
  }

  const now = new Date();
  return await db.transaction(async (tx) => {
    await pauseActiveParticipants(tx, userId, now);
    const [session] = await tx
      .insert(watchSessions)
      .values({
        hostId: userId,
        mediaType: input.media_type,
        tmdbId: input.tmdb_id,
        seasonNumber: input.media_type === "episode" ? input.season_number : null,
        episodeNumber: input.media_type === "episode" ? input.episode_number : null,
        episodeTmdbId: input.media_type === "episode" ? (input.episode_tmdb_id ?? null) : null,
        title: media.title,
        posterPath: media.posterPath,
        durationSeconds,
      })
      .returning();
    const [me] = await tx
      .insert(watchSessionParticipants)
      .values({
        sessionId: session!.id,
        userId,
        role: "host",
        status: "active",
        durationSeconds,
        startedAt: now,
        lastProgressAt: now,
      })
      .returning();
    return serializeSession(session!, me!, now);
  });
}

async function resumeExistingSession(
  userId: string,
  input: StartSessionInput,
): Promise<SessionDto | null> {
  const [existing] = await db
    .select({ session: watchSessions, me: watchSessionParticipants })
    .from(watchSessionParticipants)
    .innerJoin(watchSessions, eq(watchSessions.id, watchSessionParticipants.sessionId))
    .where(
      and(
        eq(watchSessionParticipants.userId, userId),
        inArray(watchSessionParticipants.status, ["active", "paused", "abandoned"]),
        eq(watchSessions.status, "active"),
        eq(watchSessions.mediaType, input.media_type),
        eq(watchSessions.tmdbId, input.tmdb_id),
        input.media_type === "episode"
          ? and(
              eq(watchSessions.seasonNumber, input.season_number!),
              eq(watchSessions.episodeNumber, input.episode_number!),
            )
          : isNull(watchSessions.seasonNumber),
      ),
    )
    .limit(1);
  if (!existing) return null;

  const now = new Date();
  if (existing.me.status === "active") return serializeSession(existing.session, existing.me, now);

  const result = applyParticipantAction(toProgress(existing.me), { type: "resume" }, now);
  if (!result.ok) return serializeSession(existing.session, existing.me, now);
  await db.transaction(async (tx) => {
    await pauseActiveParticipants(tx, userId, now, existing.me.id);
    await tx
      .update(watchSessionParticipants)
      .set(result.patch)
      .where(eq(watchSessionParticipants.id, existing.me.id));
  });
  return serializeSession(existing.session, { ...existing.me, ...result.patch }, now);
}
