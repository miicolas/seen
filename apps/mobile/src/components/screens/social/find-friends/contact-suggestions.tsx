import { Button, Section } from "@expo/ui/swift-ui";
import { useTranslation } from "react-i18next";

import { useContactMatches } from "@/hooks/social/use-contact-matches";
import { hapticTap } from "@/lib/haptics";

import { ProfileList } from "../profile-list";
import { ProfileListRow, profileRowKey } from "../profile-list-row";
import { ContactPermissionGate } from "./contact-permission-gate";

// The contacts side of Find Friends: gates on permission, then shows Seen
// profiles matched from the user's (on-device hashed) contacts as a native
// inset list section.
export function ContactSuggestions() {
  const { t } = useTranslation();
  const contacts = useContactMatches();

  const gate = (
    <ContactPermissionGate
      access={contacts.access}
      checking={contacts.checking}
      isLoading={contacts.isLoading}
      hasMatches={contacts.matches.length > 0}
      error={contacts.error}
      onRequestAccess={() => void contacts.requestAccess()}
      onAddMore={() => void contacts.addMoreContacts()}
    />
  );

  if (contacts.checking || contacts.isLoading || contacts.matches.length === 0) {
    return gate;
  }

  return (
    <ProfileList>
      <Section title={t("social.contactsTitle")}>
        {contacts.matches.map((match) => (
          <ProfileListRow
            key={profileRowKey(match.profile)}
            card={match.profile}
            contactName={match.contactName}
          />
        ))}
        {contacts.access === "limited" ? (
          <Button
            systemImage="person.crop.circle.badge.plus"
            label={t("social.addMoreContacts")}
            onPress={() => {
              hapticTap();
              void contacts.addMoreContacts();
            }}
          />
        ) : null}
      </Section>
    </ProfileList>
  );
}
