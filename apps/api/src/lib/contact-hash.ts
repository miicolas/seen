import { createHash } from "node:crypto";

import {
  buildContactHashPayload,
  normalizeContactValue,
  type ContactIdentifierKind,
} from "@seen/shared";

import { env } from "../env";

// Hash a contact identifier the same way the mobile client does (salted SHA-256
// hex over the normalized value). Returns null when the value can't be normalized.
export function hashContactValue(kind: ContactIdentifierKind, value: string): string | null {
  const normalized = normalizeContactValue(kind, value);
  if (!normalized) return null;
  return createHash("sha256")
    .update(buildContactHashPayload(env.contactHashSalt, kind, normalized))
    .digest("hex");
}
