import { eden, unwrapEden } from "@/lib/eden";

import type { ImportResolution, ImportSummary } from "../types";

// Apply the user's picks for films that couldn't be matched automatically.
export async function resolveLetterboxdUnmatched(
  resolutions: ImportResolution[],
): Promise<ImportSummary> {
  return unwrapEden<ImportSummary>(eden.import.letterboxd.resolve.post({ resolutions }));
}
