import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";

import { MiniPlayer } from "@/components/mini-player";
import { Colors } from "@/constants/theme";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useCurrentSession } from "@/hooks/watch-sessions/use-current-session";
import { useLiveActivity } from "@/hooks/watch-sessions/use-live-activity";
import { hapticSelection } from "@/lib/haptics";

export default function AppTabs() {
  const { t } = useTranslation();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const { accentHex } = useAccentColor();
  const { data: session } = useCurrentSession();
  useLiveActivity(session);

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      tintColor={accentHex}
      screenListeners={{ tabPress: () => hapticSelection() }}
      minimizeBehavior="onScrollDown">
      {session ? (
        <NativeTabs.BottomAccessory>
          <MiniPlayer session={session} />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label hidden>{t("tabs.search")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="watchlist">
        <NativeTabs.Trigger.Label hidden>{t("tabs.watchlist")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="insights">
        <NativeTabs.Trigger.Label hidden>{t("tabs.insights")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label hidden>{t("tabs.profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
