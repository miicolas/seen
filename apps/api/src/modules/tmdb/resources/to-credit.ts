import { asNumber, asRecord, asString } from "../../../lib/coerce";
import type { CreditDto } from "../model";

export function toCredit(raw: unknown): CreditDto {
  const obj = asRecord(raw);
  return {
    id: asNumber(obj.id) ?? 0,
    name: asString(obj.name),
    original_name: asString(obj.original_name),
    character: asString(obj.character) ?? null,
    job: asString(obj.job) ?? null,
    department: asString(obj.department) ?? null,
    profile_path: asString(obj.profile_path) ?? null,
  };
}

export function toCredits(value: unknown): CreditDto[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(toCredit);
}
