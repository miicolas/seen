import { Stack, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeSyntheticEvent, TextInputFocusEventData } from "react-native";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useProfileSearch } from "@/hooks/social/use-profile-search";
import { useTheme } from "@/hooks/use-theme";
import { socialProfileHref } from "@/lib/navigation";

import { ProfileCardRow } from "../profile-card-row";
import { SocialLoading } from "../social-loading";
import { SocialScrollView } from "../social-scroll-view";
import { ContactSuggestions } from "./contact-suggestions";

// "Find Friends": a people search bar over the catalog, with contact-based
// suggestions shown when the query is empty.
export function FindFriends() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const search = useProfileSearch(term);
  const trimmed = term.trim();

  const openProfile = useCallback(
    (id: string) => {
      router.push(socialProfileHref(id));
    },
    [router],
  );

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

      <SocialScrollView keyboardDismissMode="on-drag">
        {trimmed.length > 0 ? (
          search.isLoading ? (
            <SocialLoading />
          ) : search.data.length > 0 ? (
            <View style={styles.list}>
              {search.data.map((card) => (
                <ProfileCardRow key={card.id} card={card} onPress={() => openProfile(card.id)} />
              ))}
            </View>
          ) : (
            <EmptyState icon="magnifyingglass" title={t("social.noResults")} />
          )
        ) : (
          <ContactSuggestions onOpenProfile={openProfile} />
        )}

        {search.error ? (
          <Text size="sm" color={theme.error} fillWidth>
            {search.error}
          </Text>
        ) : null}
      </SocialScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SPACING.MD,
  },
});
