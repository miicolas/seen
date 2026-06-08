import { socialKeys } from "@seen/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { errorMessage } from "@/lib/format";
import {
  getContactsAccess,
  loadLocalContacts,
  matchContacts,
  presentLimitedAccessPicker,
  requestContactsAccess,
  type ContactsAccess,
} from "@/services/social";

// Drives the contact-suggestions flow: tracks contacts permission, and once
// granted (or limited) reads contacts, hashes them on-device, and matches them
// against Seen profiles.
export function useContactMatches() {
  const queryClient = useQueryClient();
  const [access, setAccess] = useState<ContactsAccess>("undetermined");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    getContactsAccess()
      .then((value) => active && setAccess(value))
      .catch(() => active && setAccess("denied"))
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, []);

  const canRead = access === "granted" || access === "limited";

  const query = useQuery({
    queryKey: socialKeys.contactMatches(),
    queryFn: async () => matchContacts(await loadLocalContacts()),
    enabled: canRead,
  });

  const requestAccess = useCallback(async () => {
    const next = await requestContactsAccess();
    setAccess(next);
    if (next === "granted" || next === "limited") {
      queryClient.invalidateQueries({ queryKey: socialKeys.contactMatches() });
    }
    return next;
  }, [queryClient]);

  const addMoreContacts = useCallback(async () => {
    await presentLimitedAccessPicker();
    queryClient.invalidateQueries({ queryKey: socialKeys.contactMatches() });
  }, [queryClient]);

  return {
    access,
    checking,
    matches: query.data ?? [],
    isLoading: canRead && query.isLoading,
    error: query.error ? errorMessage(query.error, "Couldn't match contacts.") : null,
    requestAccess,
    addMoreContacts,
    refetch: query.refetch,
  };
}
