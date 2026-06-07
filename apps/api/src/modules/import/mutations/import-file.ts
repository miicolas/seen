import { HttpError } from "../../../lib/http-error";
import { parseLetterboxdExport } from "../queries/parse-csv";
import { type ImportSummary, MAX_IMPORT_ROWS } from "../shared";
import { runImport } from "./run-import";

// Import a Letterboxd export uploaded as the full `.zip` or a single `.csv`.
export async function importFromFile(userId: string, file: File): Promise<ImportSummary> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  let rows;
  try {
    rows = parseLetterboxdExport(bytes, file.name || "export.csv");
  } catch {
    throw new HttpError(
      400,
      "Couldn't read this file. Upload your Letterboxd export .zip or a .csv.",
    );
  }

  if (!rows.length) {
    throw new HttpError(400, "No ratings, reviews or watchlist entries found in this file.");
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new HttpError(
      413,
      `This export has ${rows.length} entries; the limit is ${MAX_IMPORT_ROWS}. Please split it and import in parts.`,
    );
  }

  return runImport(userId, rows);
}
