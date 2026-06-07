import { apiBaseUrl, getAuthHeaders } from "@/lib/auth-client";
import { uploadFormData } from "@/lib/upload-form-data";

import type { ImportFileInput, ImportSummary } from "../types";

// Eden treaty can't carry files, so this posts raw multipart FormData. The upload
// goes through XMLHttpRequest (via uploadFormData) because Expo's global `fetch`
// rejects React Native's `{ uri }` file parts ("Unsupported FormDataPart
// implementation"); XHR preserves the original filename the server parses by.
export async function importLetterboxdFile(input: ImportFileInput): Promise<ImportSummary> {
  const form = new FormData();
  form.append("file", {
    uri: input.uri,
    name: input.name,
    type: input.mimeType ?? "application/octet-stream",
  } as unknown as Blob);

  const result = await uploadFormData(
    `${apiBaseUrl}/import/letterboxd/file`,
    await getAuthHeaders(),
    form,
  );

  if (!result.ok) {
    const error = (result.payload as { error?: string } | null)?.error;
    throw new Error(error ?? "Import failed.");
  }

  return result.payload as ImportSummary;
}
