import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { hapticSelection } from "@/lib/haptics";

export default function AppTabs() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
      screenListeners={{ tabPress: () => hapticSelection() }}
      minimizeBehavior="automatic">
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>{t("tabs.discover")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/explore.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="watchlist">
        <NativeTabs.Trigger.Label>{t("tabs.watchlist")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t("tabs.profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
