import { asNumber, asRecord, asString } from "../../../lib/coerce";
import type { GenreDto } from "../model";

export function toGenre(raw: unknown): GenreDto {
  const obj = asRecord(raw);
  return {
    id: asNumber(obj.id) ?? 0,
    name: asString(obj.name) ?? "",
  };
}

export function toGenres(value: unknown): GenreDto[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(toGenre);
}
