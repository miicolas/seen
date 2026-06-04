export type MediaType = "movie" | "tv";

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
  };
}
