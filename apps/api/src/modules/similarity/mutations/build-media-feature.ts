import { db } from "@seen/db";
import { mediaFeatures } from "@seen/db/schema";
import { and, eq } from "@seen/db/orm";

import { getMediaDetail, type MediaType } from "../../tmdb";
import type { MovieDetailDto } from "../../tmdb/model";
import { encode, ENCODER_VERSION } from "../encoder";
import { extractMediaTokens } from "../tokens";

type BuiltFeature = {
  embedding: number[];
  tokens: { token: string; weight: number }[];
};

// Pure: detail DTO → normalized feature vector (or null when the title has no
// usable content signals). No DB or network access.
export function buildMediaFeature(detail: MovieDetailDto): BuiltFeature | null {
  const tokens = extractMediaTokens(detail);
  const embedding = encode(tokens);
  if (!embedding) return null;
  return { embedding, tokens };
}

async function upsertMediaFeature(
  tmdbId: number,
  mediaType: MediaType,
  built: BuiltFeature,
): Promise<void> {
  const now = new Date();
  const values = {
    tmdbId,
    mediaType,
    embedding: built.embedding,
    features: built.tokens,
    encoderVersion: ENCODER_VERSION,
    builtAt: now,
    updatedAt: now,
  };
  await db
    .insert(mediaFeatures)
    .values(values)
    .onConflictDoUpdate({
      target: [mediaFeatures.tmdbId, mediaFeatures.mediaType],
      set: {
        embedding: values.embedding,
        features: values.features,
        encoderVersion: values.encoderVersion,
        builtAt: now,
        updatedAt: now,
      },
    });
}

// Rebuild and persist the feature vector for one title (used by the Trigger task
// and the keyword backfill). Fetches the cached/TMDB detail, encodes, upserts.
export async function rebuildMediaFeature(
  tmdbId: number,
  mediaType: MediaType,
): Promise<number[] | null> {
  const detail = await getMediaDetail(mediaType, tmdbId);
  const built = buildMediaFeature(detail);
  if (!built) return null;
  await upsertMediaFeature(tmdbId, mediaType, built);
  return built.embedding;
}

// Return the current feature vector, building it on demand if missing or stale.
// Keeps candidate generation correct even when the background worker hasn't run.
export async function ensureMediaFeature(
  tmdbId: number,
  mediaType: MediaType,
): Promise<number[] | null> {
  const [row] = await db
    .select({ embedding: mediaFeatures.embedding, encoderVersion: mediaFeatures.encoderVersion })
    .from(mediaFeatures)
    .where(and(eq(mediaFeatures.tmdbId, tmdbId), eq(mediaFeatures.mediaType, mediaType)))
    .limit(1);

  if (row && row.encoderVersion === ENCODER_VERSION) return row.embedding;
  return rebuildMediaFeature(tmdbId, mediaType);
}
