import { HttpError } from "./http-error";

type InsertOrGetArgs<T> = {
  insert: () => Promise<T[]>;
  find: () => Promise<T[]>;
  errorMessage: string;
};

// Shared idempotent-write shape: run an insert with `onConflictDoNothing` +
// `returning`, and on conflict fall back to reading the existing row. The
// `inserted` flag lets callers run first-write-only side effects (e.g. a
// similarity refresh) without re-firing them on repeats.
export async function insertOrGet<T>({
  insert,
  find,
  errorMessage,
}: InsertOrGetArgs<T>): Promise<{ row: T; inserted: boolean }> {
  const [inserted] = await insert();
  if (inserted) return { row: inserted, inserted: true };

  const [existing] = await find();
  if (!existing) throw new HttpError(500, errorMessage);
  return { row: existing, inserted: false };
}
