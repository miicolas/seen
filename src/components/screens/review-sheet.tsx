import {
  Button as SwiftUIButton,
  Form,
  Host,
  HStack,
  Image,
  Section,
  Spacer,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

import { useAccentColor } from "@/hooks/use-accent-color";
import { useMyReview } from "@/hooks/use-my-review";
import { useTheme } from "@/hooks/use-theme";
import { truncate } from "@/lib/format";
import { hapticDelete, hapticSelection, hapticSuccess } from "@/lib/haptics";
import type { MediaType } from "@/lib/tmdb";
import { ratingToStars, starsToRating } from "@/services/reviews";

const STARS = [0, 1, 2, 3, 4] as const;

function symbolFor(value: number, index: number): SFSymbol {
  if (value >= index + 1) return "star.fill";
  if (value >= index + 0.5) return "star.leadinghalf.filled";
  return "star";
}

export function ReviewSheet() {
  const params = useLocalSearchParams<{
    id: string;
    mediaType?: MediaType;
    title?: string;
    rating?: string;
  }>();

  const tmdbId = Number(params.id);
  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";
  const title = params.title ?? "Untitled";
  const presetRating = params.rating ? Number(params.rating) : 0;

  const router = useRouter();
  const theme = useTheme();
  const { review, isLoading, isSaving, save, remove } = useMyReview(
    tmdbId,
    mediaType,
  );

  async function handleSave(stars: number, comment: string) {
    const trimmed = comment.trim();
    try {
      await save({
        rating: stars > 0 ? starsToRating(stars) : null,
        comment: trimmed.length > 0 ? trimmed : null,
      });
      hapticSuccess();
      router.back();
    } catch {
      // error surfaced via the hook; keep the sheet open
    }
  }

  async function handleDelete() {
    try {
      await remove();
      hapticDelete();
      router.back();
    } catch {
      // keep the sheet open on failure
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: truncate(title, 26) }} />
      <ReviewForm
        initialStars={
          review?.rating != null ? ratingToStars(review.rating) : presetRating
        }
        initialComment={review?.comment ?? ""}
        hasReview={review != null}
        isSaving={isSaving}
        onSave={handleSave}
        onDelete={handleDelete}
        onCancel={() => router.back()}
      />
    </>
  );
}

interface ReviewFormProps {
  initialStars: number;
  initialComment: string;
  hasReview: boolean;
  isSaving: boolean;
  onSave: (stars: number, comment: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}

function ReviewForm({
  initialStars,
  initialComment,
  hasReview,
  isSaving,
  onSave,
  onDelete,
  onCancel,
}: ReviewFormProps) {
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const commentState = useNativeState(initialComment);
  const [stars, setStars] = useState(initialStars);
  const [comment, setComment] = useState(initialComment);

  const canSave = stars > 0 || comment.trim().length > 0;

  function pickStars(next: number) {
    hapticSelection();
    setStars(next);
  }

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={onCancel}>Cancel</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          variant="prominent"
          disabled={!canSave || isSaving}
          onPress={() => onSave(stars, comment)}>
          Save
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <Host style={styles.host}>
        <Form>
          <Section title="How many stars?">
            <HStack spacing={10} modifiers={[frame({ maxWidth: Infinity })]}>
              <Spacer />
              {STARS.map((index) => {
                const symbol = symbolFor(stars, index);
                return (
                  <Image
                    key={index}
                    systemName={symbol}
                    size={34}
                    color={symbol === "star" ? theme.textSecondary : accentHex}
                    onPress={() => pickStars(index + 1)}
                  />
                );
              })}
              <Spacer />
            </HStack>
          </Section>

          <Section title="Comment">
            <TextField
              placeholder="Write a comment…"
              text={commentState}
              onTextChange={setComment}
              axis="vertical"
              modifiers={[frame({ minHeight: 96 })]}
            />
          </Section>

          {hasReview ? (
            <Section>
              <SwiftUIButton
                role="destructive"
                label="Delete review"
                onPress={onDelete}
                modifiers={[frame({ maxWidth: Infinity })]}
              />
            </Section>
          ) : null}
        </Form>
      </Host>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  host: {
    flex: 1,
  },
});
