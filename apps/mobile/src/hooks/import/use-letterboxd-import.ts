import { profileKeys } from "@seen/shared";
import { useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useState } from "react";

import { useInvalidateAnalytics } from "@/hooks/analytics/use-invalidate-analytics";
import { errorMessage } from "@/lib/format";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/haptics";
import {
  importLetterboxdFile,
  importLetterboxdRss,
  type ImportResolution,
  type ImportSummary,
  resolveLetterboxdUnmatched,
} from "@/services/import";

const PICKER_TYPES = [
  "application/zip",
  "public.zip-archive",
  "text/csv",
  "public.comma-separated-values-text",
  "text/comma-separated-values",
];

interface LetterboxdImport {
  isImporting: boolean;
  error: string | null;
  importFromUsername: (username: string) => Promise<ImportSummary | null>;
  importFromFile: () => Promise<ImportSummary | null>;
  resolve: (resolutions: ImportResolution[]) => Promise<ImportSummary | null>;
  clearError: () => void;
}

export function useLetterboxdImport(): LetterboxdImport {
  const queryClient = useQueryClient();
  const invalidateAnalytics = useInvalidateAnalytics();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (task: () => Promise<ImportSummary>): Promise<ImportSummary | null> => {
      setError(null);
      setIsImporting(true);
      try {
        const result = await task();
        // Surface the imported ratings/watchlist immediately.
        queryClient.invalidateQueries({ queryKey: ["watchlist", "list"] });
        queryClient.invalidateQueries({ queryKey: profileKeys.activity() });
        invalidateAnalytics();
        hapticSuccess();
        return result;
      } catch (err) {
        hapticError();
        setError(errorMessage(err, "Import failed. Please try again."));
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    [queryClient, invalidateAnalytics],
  );

  const importFromUsername = useCallback(
    (username: string) => {
      hapticTap();
      return run(() => importLetterboxdRss(username));
    },
    [run],
  );

  const importFromFile = useCallback(async () => {
    hapticTap();
    const picked = await DocumentPicker.getDocumentAsync({
      type: PICKER_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return null;
    return run(() =>
      importLetterboxdFile({
        uri: asset.uri,
        name: asset.name ?? "letterboxd.zip",
        mimeType: asset.mimeType ?? undefined,
      }),
    );
  }, [run]);

  const resolve = useCallback(
    (resolutions: ImportResolution[]) => {
      if (!resolutions.length) return Promise.resolve(null);
      return run(() => resolveLetterboxdUnmatched(resolutions));
    },
    [run],
  );

  const clearError = useCallback(() => setError(null), []);

  return { isImporting, error, importFromUsername, importFromFile, resolve, clearError };
}
