import { Form, Host, Picker, Section, Text as SwiftUIText, Toggle } from "@expo/ui/swift-ui";
import { pickerStyle, tag, tint } from "@expo/ui/swift-ui/modifiers";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useMyProfile } from "@/hooks/profiles/use-my-profile";
import { useUpdatePrivacy } from "@/hooks/profiles/use-update-privacy";
import { useAccentColor } from "@/hooks/use-accent-color";
import { hapticSelection } from "@/lib/haptics";
import type { PrivacyInput, WatchlistVisibility } from "@/services/profiles";

// Native SwiftUI privacy form: follow policy, profile visibility, default
// watchlist visibility and contact discovery. Each control saves immediately.
export function PrivacySettings() {
  const { t } = useTranslation();
  const { accentHex } = useAccentColor();
  const profile = useMyProfile();
  const { update } = useUpdatePrivacy();
  const data = profile.data;

  const save = useCallback(
    (input: PrivacyInput) => {
      hapticSelection();
      void update(input);
    },
    [update],
  );

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Host matchContents ignoreSafeArea="keyboard" style={styles.host}>
      <Form modifiers={[tint(accentHex)]}>
        <Section title={t("privacy.followsSection")} footer={t("privacy.requireApprovalHint")}>
          <Toggle
            isOn={data.follow_policy === "approval_required"}
            onIsOnChange={(on) => save({ followPolicy: on ? "approval_required" : "open" })}
            label={t("privacy.requireApproval")}
          />
        </Section>

        <Section title={t("privacy.profileSection")} footer={t("privacy.privateProfileHint")}>
          <Toggle
            isOn={data.profile_visibility === "followers"}
            onIsOnChange={(on) => save({ profileVisibility: on ? "followers" : "public" })}
            label={t("privacy.privateProfile")}
          />
        </Section>

        <Section title={t("privacy.watchlistSection")} footer={t("privacy.watchlistHint")}>
          <Picker
            selection={data.default_watchlist_visibility}
            onSelectionChange={(value: WatchlistVisibility) =>
              save({ defaultWatchlistVisibility: value })
            }
            modifiers={[pickerStyle("menu"), tint(accentHex)]}>
            <SwiftUIText modifiers={[tag("private")]}>{t("privacy.visibilityPrivate")}</SwiftUIText>
            <SwiftUIText modifiers={[tag("followers")]}>
              {t("privacy.visibilityFollowers")}
            </SwiftUIText>
            <SwiftUIText modifiers={[tag("public")]}>{t("privacy.visibilityPublic")}</SwiftUIText>
          </Picker>
        </Section>

        <Section title={t("privacy.discoverySection")} footer={t("privacy.contactDiscoveryHint")}>
          <Toggle
            isOn={data.contact_discovery_enabled}
            onIsOnChange={(on) => save({ contactDiscoveryEnabled: on })}
            label={t("privacy.contactDiscovery")}
          />
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
