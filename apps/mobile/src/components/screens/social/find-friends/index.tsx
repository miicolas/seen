import { Section } from "@expo/ui/swift-ui";
import { Stack } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeSyntheticEvent, TextInputFocusEventData } from "react-native";

import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { useProfileSearch } from "@/hooks/social/use-profile-search";

import { ProfileList } from "../profile-list";
import { ProfileListRow, profileRowKey } from "../profile-list-row";
import { SocialLoading } from "../social-loading";
import { ContactSuggestions } from "./contact-suggestions";

// "Find Friends": a people search bar over the catalog, with contact-based
// suggestions shown when the query is empty.
export function FindFriends() {
  const { t } = useTranslation();
  const [term, setTerm] = useState("");
  const search = useProfileSearch(term);
  const trimmed = term.trim();

  return (
    <>
      <Stack.SearchBar
        placeholder={t("social.searchPlaceholder")}
        onChangeText={(event: NativeSyntheticEvent<TextInputFocusEventData>) =>
          setTerm(event.nativeEvent.text)
        }
        onCancelButtonPress={() => setTerm("")}
        onClose={() => setTerm("")}
      />

      {trimmed.length === 0 ? (
        <ContactSuggestions />
      ) : search.isLoading ? (
        <SocialLoading />
      ) : search.error ? (
        <ContentUnavailable
          icon="exclamationmark.triangle"
          title={t("social.noResults")}
          description={search.error}
        />
      ) : search.data.length > 0 ? (
        <ProfileList>
          <Section title={t("social.resultsTitle")}>
            {search.data.map((card) => (
              <ProfileListRow key={profileRowKey(card)} card={card} />
            ))}
          </Section>
        </ProfileList>
      ) : (
        <ContentUnavailable icon="magnifyingglass" title={t("social.noResults")} />
      )}
    </>
  );
}
