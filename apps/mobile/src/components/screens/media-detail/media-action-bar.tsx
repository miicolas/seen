import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { IconButton } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";

interface BarAction {
  caption: string;
  onPress: () => void;
  disabled?: boolean;
}

interface MediaActionBarProps {
  accentHex: string;
  // Big accent play circle in the middle; caption carries the runtime / resume hint.
  watch?: BarAction & { loading?: boolean };
  // Eye toggle — "seen" is the brand action, filled once rated.
  rate?: BarAction & { active: boolean };
  // Bookmark toggle, hidden by callers once a rating exists.
  watchlist?: BarAction & { active: boolean };
}

function Action({ caption, children }: { caption: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.action}>
      <View style={styles.circleSlot}>{children}</View>
      <Text size="xs" weight="medium" color={theme.textSecondary} inline>
        {caption}
      </Text>
    </View>
  );
}

// Icon-only action row under the media summary: rate (eye) · play · watchlist,
// each a native Liquid Glass circle with a small caption. The prominent
// extra-large play is the primary; the sides are neutral glass.
export function MediaActionBar({ accentHex, watch, rate, watchlist }: MediaActionBarProps) {
  return (
    <View style={styles.row}>
      {rate ? (
        <Action caption={rate.caption}>
          <IconButton
            icon={rate.active ? "eye.fill" : "eye"}
            accessibilityLabel={rate.caption}
            onPress={rate.onPress}
            variant="glass"
            tintColor={accentHex}
            disabled={rate.disabled}
            symbolTransitionValue={rate.active}
          />
        </Action>
      ) : null}

      {watch ? (
        <Action caption={watch.caption}>
          <IconButton
            icon="play.fill"
            accessibilityLabel={watch.caption}
            onPress={watch.onPress}
            variant="prominent"
            size="extraLarge"
            tintColor={accentHex}
            iconColor="#FFFFFF"
            disabled={watch.disabled || watch.loading}
          />
        </Action>
      ) : null}

      {watchlist ? (
        <Action caption={watchlist.caption}>
          <IconButton
            icon={watchlist.active ? "bookmark.fill" : "bookmark"}
            accessibilityLabel={watchlist.caption}
            onPress={watchlist.onPress}
            variant="glass"
            tintColor={accentHex}
            disabled={watchlist.disabled}
            symbolTransitionValue={watchlist.active}
          />
        </Action>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: SPACING.XL,
    marginTop: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  action: {
    alignItems: "center",
    gap: SPACING.XS,
  },
  // Equal-height slot so the smaller side circles align with the play circle.
  circleSlot: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
