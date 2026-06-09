// Deterministic content-feature encoder. Pure and dependency-free so it produces
// byte-identical output across Bun (API) and Node (Trigger tasks): no Math.random,
// no locale, no platform hashing. Tokens (e.g. "genre:28", "keyword:818") are
// hashed into a fixed-width signed vector via the hashing trick, then L2-normalized.
//
// Bump ENCODER_VERSION whenever the token vocabulary, weights, or hashing change,
// so stored media_features / user_taste_vectors rows can be detected as stale.

export const ENCODER_VERSION = 1;
export const VECTOR_DIMENSIONS = 256;

// FNV-1a 32-bit. Pure integer math kept in the unsigned 32-bit range via `>>> 0`.
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

function fnv1a(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

export type WeightedToken = { token: string; weight: number };

// Accumulate weighted tokens into a VECTOR_DIMENSIONS vector. Each token picks a
// bucket from one hash and a sign (+1/-1) from a second hash of the same token —
// the sign hash makes collisions unbiased in expectation. Returns null when the
// vector has no magnitude (no usable tokens), so callers skip persisting it.
export function encode(tokens: WeightedToken[]): number[] | null {
  const vec = new Array<number>(VECTOR_DIMENSIONS).fill(0);

  for (const { token, weight } of tokens) {
    if (!weight) continue;
    const bucket = fnv1a(token) % VECTOR_DIMENSIONS;
    const sign = fnv1a(`${token}#sign`) & 1 ? 1 : -1;
    vec[bucket] += sign * weight;
  }

  return l2Normalize(vec);
}

// Normalize to unit length; returns null for a zero vector.
export function l2Normalize(vec: number[]): number[] | null {
  let sumSquares = 0;
  for (const value of vec) sumSquares += value * value;
  if (sumSquares === 0) return null;
  const norm = Math.sqrt(sumSquares);
  return vec.map((value) => value / norm);
}

// Weighted sum of already-normalized vectors, renormalized to unit length. Used
// to blend per-media vectors into a single user taste vector. Returns null when
// the blend collapses to zero (e.g. opposing equal-weight signals cancel out).
export function blendNormalized(parts: { vector: number[]; weight: number }[]): number[] | null {
  if (parts.length === 0) return null;
  const acc = new Array<number>(VECTOR_DIMENSIONS).fill(0);
  for (const { vector, weight } of parts) {
    if (!weight || vector.length !== VECTOR_DIMENSIONS) continue;
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) acc[i] += vector[i] * weight;
  }
  return l2Normalize(acc);
}
