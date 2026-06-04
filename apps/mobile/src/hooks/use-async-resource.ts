import {
  useCallback,
  useEffect,
  useState,
  type DependencyList,
  type Dispatch,
  type SetStateAction,
} from "react";

import { errorMessage } from "@/lib/format";

interface AsyncResource<T> {
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  isLoading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  refetch: () => void;
}

/**
 * Loads an async value into state with the standard lifecycle: `isLoading`,
 * `error`, stale-result guarding, and a `refetch()`. The effect re-runs when
 * any of `deps` change (the `fetcher` itself is intentionally not a dependency).
 * `setData`/`setError` are exposed so callers can apply optimistic mutations.
 */
export function useAsyncResource<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  initialData: T,
  fallbackMessage = "Something went wrong",
): AsyncResource<T> {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, fallbackMessage));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return { data, setData, isLoading, error, setError, refetch };
}
