import { Image as PosterImage } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FieldRow } from "@/components/ui/field-row";
import { type ObservableText } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";
import { LAYOUT } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useTheme } from "@/hooks/use-theme";
import { hapticTap } from "@/lib/haptics";

export interface ReviewFormProps {
  mediaTitle: string;
  mediaSubtitle?: string;
  posterUri?: string;
  stars: number;
  onStarsChange: (value: number) => void;
  reviewTitleState: ObservableText;
  onTitleChange?: (value: string) => void;
  commentState: ObservableText;
  onCommentChange?: (value: string) => void;
  nickname: string | null;
  error: string | null;
}

export function ReviewForm({
  mediaTitle,
  mediaSubtitle,
  posterUri,
  stars,
  onStarsChange,
  reviewTitleState,
  onTitleChange,
  commentState,
  onCommentChange,
  nickname,
  error,
}: ReviewFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accentHex } = useAccentColor();

  const subtitle = mediaSubtitle?.trim();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.mediaRow}>
          {posterUri ? (
            <PosterImage
              source={{ uri: posterUri }}
              contentFit="cover"
              style={styles.poster}
            />
          ) : (
            <View
              style={[
                styles.poster,
                styles.posterFallback,
                { backgroundColor: theme.backgroundElement },
              ]}
            >
              <SymbolView
                name="film"
                size={34}
                tintColor={theme.textSecondary}
              />
            </View>
          )}
          <View style={styles.mediaText}>
            <Text
              numberOfLines={2}
              style={[styles.mediaTitle, { color: theme.text }]}
            >
              {mediaTitle}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={2}
                style={[styles.mediaSubtitle, { color: theme.textSecondary }]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.ratingRow}>
          <Text style={[styles.ratingLabel, { color: theme.textSecondary }]}>
            {t("review.tapToRate")}
          </Text>
          <StarRating
            value={stars}
            onChange={onStarsChange}
            size="md"
            emptyColor={theme.backgroundSelected}
          />
        </View>

        <View
          style={[
            styles.fieldsPanel,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <FieldRow
            label={t("review.titleLabel")}
            placeholder={t("review.optional")}
            state={reviewTitleState}
            onChangeText={onTitleChange}
          />
          <View
            style={[
              styles.divider,
              { backgroundColor: theme.backgroundSelected },
            ]}
          />
          <FieldRow
            label={t("review.reviewLabel")}
            multiline
            placeholder={t("review.optional")}
            state={commentState}
            onChangeText={onCommentChange}
          />
        </View>

        <Pressable onPress={() => hapticTap()} style={styles.nicknameHitSlop}>
          <Text style={[styles.nickname, { color: accentHex }]}>
            {nickname ?? t("review.addNickname")}
          </Text>
        </Pressable>

        {error ? (
          <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: LAYOUT.SCREEN_PADDING,
    paddingTop: 12,
  },
  content: {
    width: "100%",
    maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
    alignSelf: "center",
  },
  mediaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  poster: {
    width: 52,
    height: 52,
    borderRadius: 9,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  posterFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  mediaText: {
    flex: 1,
    minWidth: 0,
  },
  mediaTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 0,
  },
  mediaSubtitle: {
    marginTop: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
    letterSpacing: 0,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: "400",
  },
  fieldsPanel: {
    borderRadius: 12,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: LAYOUT.FIELD_ROW_PADDING,
  },
  nicknameHitSlop: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: LAYOUT.FIELD_ROW_PADDING,
  },
  nickname: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
    letterSpacing: 0,
  },
  error: {
    paddingHorizontal: LAYOUT.FIELD_ROW_PADDING,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    letterSpacing: 0,
  },
});
