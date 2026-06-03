import { useEffect, useState } from "react";

import { errorMessage } from "@/lib/format";
import { getMovieDetail, type MediaType, type TmdbMovieDetail } from "@/lib/tmdb";

interface MediaDetailState {
  detail: TmdbMovieDetail | null;
  isLoading: boolean;
  error: string | null;
}

export function useMediaDetail(
  tmdbId: number,
  mediaType: MediaType,
): MediaDetailState {
  const [detail, setDetail] = useState<TmdbMovieDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMovieDetail(tmdbId, mediaType);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Failed to load details"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType]);

  return { detail, isLoading, error };
}
