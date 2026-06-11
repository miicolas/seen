import { useTranslation } from "react-i18next";

import { GlassButton } from "@/components/ui/button";
import { ContentUnavailable } from "@/components/ui/content-unavailable";
import { hapticTap } from "@/lib/haptics";
import type { ContactsAccess } from "@/services/social";

import { SocialLoading } from "../social-loading";

// The pre-list states of the contacts flow: permission prompts, loading, and
// the "nobody matched" hint. Returns null when matched rows should render
// instead (see ContactSuggestions).
export function ContactPermissionGate({
  access,
  checking,
  isLoading,
  hasMatches,
  error,
  onRequestAccess,
  onAddMore,
}: {
  access: ContactsAccess;
  checking: boolean;
  isLoading: boolean;
  hasMatches: boolean;
  error: string | null;
  onRequestAccess: () => void;
  onAddMore: () => void;
}) {
  const { t } = useTranslation();

  if (checking || isLoading) {
    return <SocialLoading minHeight={160} />;
  }

  if (access === "undetermined") {
    return (
      <ContentUnavailable
        icon="person.2"
        title={t("social.contactsPrompt")}
        description={t("social.contactsPromptHint")}
        action={
          <GlassButton
            title={t("social.enableContacts")}
            onPress={() => {
              hapticTap();
              onRequestAccess();
            }}
            size="sm"
          />
        }
      />
    );
  }

  if (access === "denied") {
    return (
      <ContentUnavailable
        icon="person.2.slash"
        title={t("social.contactsDenied")}
        description={t("social.contactsPromptHint")}
      />
    );
  }

  // Contacts are granted but nobody matched yet: instead of a bare line, guide
  // the user to the search bar (which finds people by name or @username).
  if (!hasMatches) {
    return (
      <ContentUnavailable
        icon="magnifyingglass"
        title={t("social.searchTitle")}
        description={error ?? t("social.searchHint")}
        action={
          access === "limited" ? (
            <GlassButton
              title={t("social.addMoreContacts")}
              onPress={() => {
                hapticTap();
                onAddMore();
              }}
              size="sm"
            />
          ) : undefined
        }
      />
    );
  }

  return null;
}
