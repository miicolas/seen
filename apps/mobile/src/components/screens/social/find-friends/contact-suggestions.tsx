import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

import { GlassButton } from "@/components/ui/button";
import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useContactMatches } from "@/hooks/social/use-contact-matches";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

import { ProfileCardRow } from "../profile-card-row";
import { SocialLoading } from "../social-loading";

// The contacts side of Find Friends: gates on permission, then shows Seen
// profiles matched from the user's (on-device hashed) contacts.
export function ContactSuggestions({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const contacts = useContactMatches();

  const request = useCallback(() => {
    hapticTap();
    void contacts.requestAccess();
  }, [contacts]);

  const addMore = useCallback(() => {
    hapticTap();
    void contacts.addMoreContacts();
  }, [contacts]);

  if (contacts.checking) {
    return <SocialLoading minHeight={160} />;
  }

  if (contacts.access === "undetermined") {
    return (
      <ContentUnavailable
        icon="person.2"
        title={t("social.contactsPrompt")}
        description={t("social.contactsPromptHint")}
        action={<GlassButton title={t("social.enableContacts")} onPress={request} size="sm" />}
      />
    );
  }

  if (contacts.access === "denied") {
    return (
      <ContentUnavailable
        icon="person.2.slash"
        title={t("social.contactsDenied")}
        description={t("social.contactsPromptHint")}
      />
    );
  }

  if (contacts.isLoading) {
    return <SocialLoading minHeight={160} />;
  }

  // Contacts are granted but nobody matched yet: instead of a bare line, guide
  // the user to the search bar (which finds people by name or @username).
  if (contacts.matches.length === 0) {
    return (
      <ContentUnavailable
        icon="magnifyingglass"
        title={t("social.searchTitle")}
        description={contacts.error ?? t("social.searchHint")}
        action={
          contacts.access === "limited" ? (
            <GlassButton title={t("social.addMoreContacts")} onPress={addMore} size="sm" />
          ) : undefined
        }
      />
    );
  }

  return (
    <View style={styles.section}>
      <Text size="sm" weight="bold" color={theme.textSecondary} fillWidth>
        {t("social.contactsTitle")}
      </Text>

      <View style={styles.list}>
        {contacts.matches.map((match) => (
          <ProfileCardRow
            key={match.profile.id}
            card={match.profile}
            subtitle={match.contactName ?? undefined}
            onPress={() => onOpenProfile(match.profile.id)}
          />
        ))}
      </View>

      {contacts.error ? (
        <Text size="sm" color={theme.error} fillWidth>
          {contacts.error}
        </Text>
      ) : null}

      {contacts.access === "limited" ? (
        <GlassButton title={t("social.addMoreContacts")} onPress={addMore} size="sm" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: SPACING.MD,
  },
  list: {
    gap: SPACING.MD,
  },
});
