import { db } from "@seen/db";
import { episodeReviews, movies, profiles, reviews, user as authUser } from "@seen/db/schema";
import { desc, eq, inArray } from "drizzle-orm";

import { HttpError } from "../../lib/http-error";
import { toApiRow } from "../../lib/rows";

type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  userMetadata?: Record<string, unknown> | null;
};

type MediaType = "movie" | "tv";

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function defaultFullName(user: AuthUser) {
  const metadata = user.userMetadata;
  return (
    stringValue(metadata?.full_name) ??
    stringValue(metadata?.name) ??
    stringValue(user.name) ??
    stringValue(user.email?.split("@")[0]) ??
    "User"
  );
}

function sanitizedUsernameBase(user: AuthUser) {
  const source = user.email?.split("@")[0] ?? user.name ?? "user";
  const sanitized = source
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "");

  return (sanitized.length >= 3 ? sanitized : "user").slice(0, 20);
}

function defaultUsername(user: AuthUser, withSuffix = false) {
  const base = sanitizedUsernameBase(user);
  if (!withSuffix) return base;

  const suffix = `_${user.id.replaceAll("-", "").slice(0, 6)}`;
  return `${base.slice(0, Math.max(3, 20 - suffix.length))}${suffix}`;
}

function isUniqueViolation(error: unknown) {
  return (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  );
}

function assertProfileInput(input: {
  fullName: string;
  username: string;
  avatarPath?: string | null;
}) {
  const fullName = input.fullName.trim();
  const username = input.username.trim().toLowerCase();

  if (!fullName) {
    throw new HttpError(400, "Name is required.", "full-name-required");
  }

  if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
    throw new HttpError(
      400,
      "Username must be 3-20 lowercase letters, numbers, dots or underscores.",
      "username-invalid",
    );
  }

  return { fullName, username };
}

export async function getOrCreateMyProfile(user: AuthUser) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (existing) return toApiRow(existing);

  const input = {
    id: user.id,
    fullName: defaultFullName(user),
    username: defaultUsername(user),
  };

  const insertProfile = (username: string) =>
    db
      .insert(profiles)
      .values({ ...input, username })
      .returning();

  try {
    const [created] = await insertProfile(input.username);
    return toApiRow(created);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  const [retried] = await insertProfile(defaultUsername(user, true));
  return toApiRow(retried);
}

export async function updateMyProfile(
  userId: string,
  input: {
    fullName: string;
    username: string;
    avatarPath?: string | null;
  },
) {
  const { fullName, username } = assertProfileInput(input);
  const patch: {
    fullName: string;
    username: string;
    avatarPath?: string | null;
  } = { fullName, username };

  if (Object.hasOwn(input, "avatarPath")) {
    patch.avatarPath = input.avatarPath ?? null;
  }

  const result = await db
    .update(profiles)
    .set(patch)
    .where(eq(profiles.id, userId))
    .returning()
    .catch((error) => {
      if (isUniqueViolation(error)) {
        throw new HttpError(
          409,
          "That username is already taken.",
          "username-taken",
        );
      }
      throw error;
    });

  const profile = result[0];
  if (!profile) throw new HttpError(404, "Profile not found");
  return toApiRow(profile);
}

async function getMoviesForActivity(
  keys: { tmdbId: number; mediaType: MediaType }[],
) {
  const ids = [...new Set(keys.map((key) => key.tmdbId))];
  const allowed = new Set(keys.map((key) => `${key.tmdbId}:${key.mediaType}`));
  if (!ids.length) return new Map<string, typeof movies.$inferSelect>();

  const rows = await db
    .select()
    .from(movies)
    .where(inArray(movies.tmdbId, ids));

  return new Map(
    rows
      .filter((movie) => allowed.has(`${movie.tmdbId}:${movie.mediaType}`))
      .map((movie) => [`${movie.tmdbId}:${movie.mediaType}`, movie]),
  );
}

function mediaSubtitle(
  movie: typeof movies.$inferSelect | undefined,
  mediaType: MediaType,
) {
  const label = mediaType === "tv" ? "Series" : "Movie";
  const year = movie?.releaseDate?.slice(0, 4);
  return year ? `${label} - ${year}` : label;
}

export async function getMyProfileActivity(userId: string, limit = 12) {
  const pageSize = Math.max(1, Math.min(50, limit));

  const [reviewRows, episodeRows] = await Promise.all([
    db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(pageSize),
    db
      .select()
      .from(episodeReviews)
      .where(eq(episodeReviews.userId, userId))
      .orderBy(desc(episodeReviews.createdAt))
      .limit(pageSize),
  ]);

  const movieMap = await getMoviesForActivity([
    ...reviewRows.map((review) => ({
      tmdbId: review.tmdbId,
      mediaType: review.mediaType as MediaType,
    })),
    ...episodeRows.map((episode) => ({
      tmdbId: episode.seriesTmdbId,
      mediaType: "tv" as const,
    })),
  ]);

  const mediaItems = reviewRows.map((review) => {
    const mediaType = review.mediaType as MediaType;
    const movie = movieMap.get(`${review.tmdbId}:${mediaType}`);
    return toApiRow({
      id: review.id,
      kind: "media" as const,
      createdAt: review.createdAt,
      rating: review.rating,
      reviewTitle: review.title,
      comment: review.comment,
      mediaTitle: movie?.title ?? (mediaType === "tv" ? "Series" : "Movie"),
      mediaSubtitle: mediaSubtitle(movie, mediaType),
      posterPath: movie?.posterPath ?? null,
      mediaType,
      tmdbId: review.tmdbId,
    });
  });

  const episodeItems = episodeRows.map((episode) => {
    const series = movieMap.get(`${episode.seriesTmdbId}:tv`);
    return toApiRow({
      id: episode.id,
      kind: "episode" as const,
      createdAt: episode.createdAt,
      rating: episode.rating,
      reviewTitle: episode.title,
      comment: episode.comment,
      mediaTitle: series?.title ?? "Series",
      mediaSubtitle: `Season ${episode.seasonNumber} - Episode ${episode.episodeNumber}`,
      posterPath: series?.posterPath ?? null,
      mediaType: "tv" as const,
      tmdbId: episode.seriesTmdbId,
    });
  });

  return [...mediaItems, ...episodeItems]
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() -
        new Date(left.created_at).getTime(),
    )
    .slice(0, pageSize);
}

export async function deleteMyAccount(userId: string): Promise<void> {
  await db.delete(authUser).where(eq(authUser.id, userId));
}
