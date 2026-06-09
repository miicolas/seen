// SDK 56 deprecated the functional API on the package root in favor of a new
// class-based API; the legacy subpath keeps the functional calls we rely on
// (getContactsAsync / permissions / Fields) without the deprecation error.
import * as Contacts from "expo-contacts/legacy";
import * as Crypto from "expo-crypto";

import {
  buildContactHashPayload,
  DEFAULT_CONTACT_HASH_SALT,
  normalizeContactValue,
  type ContactIdentifierKind,
} from "@seen/shared";

import type { ContactIdentifierHash, LocalContact } from "./types";

// Must match the API's CONTACT_HASH_SALT, or device hashes won't line up with
// server-stored ones. See packages/shared/src/contacts.ts for the privacy note.
const SALT = process.env.EXPO_PUBLIC_CONTACT_HASH_SALT ?? DEFAULT_CONTACT_HASH_SALT;

export type ContactsAccess = "granted" | "limited" | "denied" | "undetermined";

async function hashValue(kind: ContactIdentifierKind, value: string): Promise<string | null> {
  const normalized = normalizeContactValue(kind, value);
  if (!normalized) return null;
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    buildContactHashPayload(SALT, kind, normalized),
  );
}

type ContactsPermission = Awaited<ReturnType<typeof Contacts.getPermissionsAsync>>;

function toAccess(permission: ContactsPermission): ContactsAccess {
  const status = String(permission.status);
  if (status !== "granted") return status === "denied" ? "denied" : "undetermined";
  // iOS 18 limited contact access reports granted + accessPrivileges "limited".
  if (permission.accessPrivileges === "limited") return "limited";
  return "granted";
}

export async function getContactsAccess(): Promise<ContactsAccess> {
  return toAccess(await Contacts.getPermissionsAsync());
}

export async function requestContactsAccess(): Promise<ContactsAccess> {
  return toAccess(await Contacts.requestPermissionsAsync());
}

// iOS 18+: when access is limited, let the user add more contacts to the selection.
export async function presentLimitedAccessPicker(): Promise<void> {
  const present = (Contacts as { presentAccessPickerAsync?: () => Promise<unknown> })
    .presentAccessPickerAsync;
  if (typeof present === "function") await present();
}

// Read contacts and derive salted hashes on-device. Plaintext emails/phones never
// leave the device — only the hashes (and the local names) stay here.
//
// Only emails are hashed: the API only stores verified-email hashes, so sending
// phone hashes would be wasted work (and waste the request's identifier budget)
// against a column nothing ever populates. Re-add phone hashing when the server
// gains verified-phone identifiers.
export async function loadLocalContacts(): Promise<LocalContact[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.Emails],
  });

  // Hash every contact's emails in parallel instead of awaiting one at a time,
  // so a large address book doesn't serialize thousands of native crypto calls.
  const contacts = await Promise.all(
    data.map(async (contact): Promise<LocalContact | null> => {
      const hashes = await Promise.all(
        (contact.emails ?? []).map((email) =>
          email.email ? hashValue("email", email.email) : null,
        ),
      );
      const identifiers: ContactIdentifierHash[] = hashes
        .filter((hash): hash is string => Boolean(hash))
        .map((hash) => ({ kind: "email", hash }));
      if (identifiers.length === 0) return null;
      return { name: contact.name ?? "Contact", identifiers };
    }),
  );

  return contacts.filter((contact): contact is LocalContact => contact !== null);
}
