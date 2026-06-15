import {
  BottomSheet,
  Group,
  Host,
  ScrollView as SwiftUIScrollView,
  Text as SwiftUIText,
  VStack,
} from "@expo/ui/swift-ui";
import {
  font,
  foregroundStyle,
  frame,
  padding,
  presentationBackground,
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { FONT_SIZE, LINE_HEIGHT, SPACING } from "@/constants/design-tokens";
import { useTheme } from "@/hooks/use-theme";
import { transparentize } from "@/lib/color";
import { hapticTap } from "@/lib/haptics";

import { DetailSection } from "./detail-section";

const OVERVIEW_PREVIEW_LIMIT = 250;
const PREVIEW_LINES = 3;
const PREVIEW_FADE_WIDTH = 116;
const PREVIEW_LINE_HEIGHT = LINE_HEIGHT.SM;

export function OverviewSection({ overview, title }: { overview?: string | null; title?: string }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isPresented, setIsPresented] = useState(false);
  const trimmedOverview = overview?.trim() ?? "";
  const sectionTitle = title ?? t("mediaDetail.about");

  if (!trimmedOverview) return null;

  const isLong = trimmedOverview.length >= OVERVIEW_PREVIEW_LIMIT;
  const transparentBackground = transparentize(theme.background);

  function handleOpenSheet() {
    hapticTap();
    setIsPresented(true);
  }

  return (
    <>
      <DetailSection title={sectionTitle}>
        {isLong ? (
          <View style={styles.preview}>
            <Text
              size="sm"
              weight="regular"
              color={theme.textSecondary}
              fillWidth
              numberOfLines={PREVIEW_LINES}>
              {trimmedOverview}
            </Text>
            <LinearGradient
              colors={[transparentBackground, theme.background, theme.background]}
              locations={[0, 0.58, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              pointerEvents="none"
              style={styles.previewFade}
            />
            <Pressable
              accessibilityLabel={t("mediaDetail.readFullSynopsis")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleOpenSheet}
              style={[styles.moreButton, { backgroundColor: theme.background }]}>
              <Text size="sm" weight="bold" color={theme.text} align="center" fillWidth>
                {t("mediaDetail.more")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
            {trimmedOverview}
          </Text>
        )}
      </DetailSection>

      {isLong ? (
        <Host style={styles.sheetHost} pointerEvents="none">
          <BottomSheet isPresented={isPresented} onIsPresentedChange={setIsPresented}>
            <Group
              modifiers={[
                presentationDetents(["medium", "large"]),
                presentationDragIndicator("visible"),
                presentationBackground(theme.background),
              ]}>
              <SwiftUIScrollView>
                <VStack
                  alignment="leading"
                  spacing={SPACING.MD}
                  modifiers={[
                    padding({
                      top: SPACING.LG,
                      bottom: SPACING.LG,
                      leading: SPACING.MD,
                      trailing: SPACING.MD,
                    }),
                    frame({ maxWidth: Infinity, alignment: "topLeading" }),
                  ]}>
                  <SwiftUIText
                    modifiers={[
                      font({ size: FONT_SIZE.XL, weight: "bold" }),
                      foregroundStyle(theme.text),
                    ]}>
                    {sectionTitle}
                  </SwiftUIText>
                  <SwiftUIText
                    modifiers={[
                      font({ size: FONT_SIZE.MD, weight: "regular" }),
                      foregroundStyle(theme.textSecondary),
                    ]}>
                    {trimmedOverview}
                  </SwiftUIText>
                </VStack>
              </SwiftUIScrollView>
            </Group>
          </BottomSheet>
        </Host>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  preview: {
    minHeight: PREVIEW_LINE_HEIGHT * PREVIEW_LINES,
    position: "relative",
  },
  previewFade: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: PREVIEW_FADE_WIDTH,
    height: PREVIEW_LINE_HEIGHT,
  },
  moreButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    minWidth: 54,
    height: PREVIEW_LINE_HEIGHT,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: SPACING.SM,
  },
  sheetHost: {
    position: "absolute",
  },
});
