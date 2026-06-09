// Backend-only content-similarity core (#12). Exposes typed functions for the
// feed/ranking work (#14) to consume — no HTTP controller or mobile UI yet.
export * from "./shared";
export { ENCODER_VERSION, VECTOR_DIMENSIONS } from "./encoder";
export { enqueueSimilarityRefresh } from "./enqueue-refresh";
export { getContentCandidates } from "./queries";
export {
  ensureMediaFeature,
  rebuildMediaFeature,
  ensureUserTaste,
  rebuildUserTaste,
} from "./mutations";
