// Shared contact-identifier normalization + hash-payload construction.
//
// Lives here so the mobile client (which hashes contacts on-device with
// expo-crypto) and the API (which hashes verified Seen emails with node crypto)
// derive byte-identical inputs. Any divergence here silently breaks matching.
//
// Privacy note: identifiers are hashed with a shared application salt, not a
// server-only secret — the device must reproduce the same hash to match without
// sending plaintext. A salted SHA-256 defeats generic precomputed rainbow tables
// but is NOT strong anonymization: emails and especially phone numbers are low
// entropy, so a leak of the stored hashes is brute-forceable. Treat the contact
// identifiers table as sensitive accordingly.

export type ContactIdentifierKind = "email" | "phone";

export const DEFAULT_CONTACT_HASH_SALT = "seen-contact-v1";

export function normalizeEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length < 3 || !trimmed.includes("@")) return null;
  return trimmed;
}

// Best-effort E.164-ish normalization for v1: keep digits and a single leading
// `+`. Without per-region parsing we can't fully canonicalize national numbers,
// so phone matching is opportunistic until verified-phone data exists.
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (digits.length < 7) return null;
  return `${hasPlus ? "+" : ""}${digits}`;
}

export function normalizeContactValue(kind: ContactIdentifierKind, value: string): string | null {
  return kind === "email" ? normalizeEmail(value) : normalizePhone(value);
}

export function buildContactHashPayload(
  salt: string,
  kind: ContactIdentifierKind,
  normalizedValue: string,
): string {
  return `${salt}:${kind}:${normalizedValue}`;
}
