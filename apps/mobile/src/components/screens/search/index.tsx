import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeSyntheticEvent, TextInputFocusEventData } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchResults } from "@/components/discover/search-results";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useMediaFilter } from "@/hooks/use-media-filter";
import { useMyProfile } from "@/hooks/profiles/use-my-profile";
import { useInvitations } from "@/hooks/watch-sessions/use-invitations";
import { hapticTap } from "@/lib/haptics";

import { SearchFeed } from "./search-feed";
import { SearchToolbar } from "./search-toolbar";

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] ?? "";
}

export function Search() {
  const { t } = useTranslation();
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const { user } = useAuthContext();
  const profile = useMyProfile();
  const { accentHex } = useAccentColor();
  const { filter, options, selectFilter } = useMediaFilter("discover");
  const { inbox } = useInvitations();
  const [query, setQuery] = useState("");

  const isSearching = query.trim().length > 0;
  const bottomInset = safeAreaInsets.bottom + BottomTabInset + Spacing.three;
  const pendingInvitations = inbox.data?.length ?? 0;
  const name = firstName(profile.data?.full_name) || firstName(user?.name);
  const title = name ? t("search.titleWithName", { name }) : t("search.title");

  function handleSearchText(event: NativeSyntheticEvent<TextInputFocusEventData>) {
    setQuery(event.nativeEvent.text);
  }

  return (
    <>
      <Stack.Screen options={{ title }} />

      <SearchToolbar
        filter={filter}
        options={options}
        onSelect={selectFilter}
        invitationCount={pendingInvitations}
        invitationTintColor={accentHex}
        invitationLabel={t("watch.inboxTitle")}
        onOpenInvitations={() => {
          hapticTap();
          router.push("/watch-invitations");
        }}
      />

      <Stack.SearchBar
        placeholder={t("discover.searchPlaceholder")}
        onChangeText={handleSearchText}
        onCancelButtonPress={() => setQuery("")}
        onClose={() => setQuery("")}
      />

      {isSearching ? (
        <SearchResults query={query} filter={filter} bottomInset={bottomInset} />
      ) : (
        <SearchFeed filter={filter} bottomInset={bottomInset} />
      )}
    </>
  );
}
