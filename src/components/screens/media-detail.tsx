import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Link,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
  type DimensionValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StarRating } from "@/components/ui/star-rating";
import { Text } from "@/components/ui/text";
import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useMediaDetail } from "@/hooks/use-media-detail";
import { useMovieReviews } from "@/hooks/use-movie-reviews";
import { useMyReview } from "@/hooks/use-my-review";
import { useTheme } from "@/hooks/use-theme";
import { truncate } from "@/lib/format";
import { hapticTap } from "@/lib/haptics";
import { reviewSheetHref } from "@/lib/navigation";
import { tmdbImageUrl, type MediaType } from "@/lib/tmdb";
import {
  getMovieStats,
  ratingToStars,
  type MovieReviewStats,
  type Review,
} from "@/services/reviews";

type ThemeColors = ReturnType<typeof useTheme>;

interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

interface CrewMember {
  id: number;
  name: string;
  job?: string;
}

function metaLine(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join("  ·  ");
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function MediaDetail() {
  const params = useLocalSearchParams<{
    id: string;
    mediaType?: MediaType;
    title?: string;
    poster_path?: string;
    backdrop_path?: string;
  }>();

  const tmdbId = Number(params.id);
  const mediaType: MediaType = params.mediaType === "tv" ? "tv" : "movie";

  const router = useRouter();
  const theme = useTheme();
  const { accentHex } = useAccentColor();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const heroHeight = width * 0.92;

  const { detail, isLoading, error } = useMediaDetail(tmdbId, mediaType);
  const { review, refetch } = useMyReview(tmdbId, mediaType);
  const { reviews } = useMovieReviews(tmdbId, mediaType);
  const [stats, setStats] = useState<MovieReviewStats | null>(null);

  const loadStats = useCallback(() => {
    getMovieStats(tmdbId, mediaType)
      .then(setStats)
      .catch(() => setStats(null));
  }, [tmdbId, mediaType]);

  useEffect(() => loadStats(), [loadStats]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      loadStats();
    }, [refetch, loadStats]),
  );

  const title = detail?.title ?? params.title ?? "Untitled";
  const ambientUri = tmdbImageUrl(
    detail?.backdrop_path ??
      params.backdrop_path ??
      detail?.poster_path ??
      params.poster_path ??
      null,
    "w780",
  );
  const posterUri = tmdbImageUrl(
    detail?.poster_path ??
      params.poster_path ??
      detail?.backdrop_path ??
      params.backdrop_path ??
      null,
    "w500",
  );

  const year = (detail?.release_date ?? "").slice(0, 4) || undefined;
  const episodeRuntime = (detail?.episode_run_time as number[] | undefined)?.[0];
  const runtime = detail?.runtime
    ? `${detail.runtime} min`
    : episodeRuntime
      ? `${episodeRuntime} min`
      : undefined;
  const genres = detail?.genres?.map((g) => g.name).join(", ") || undefined;
  const seasons =
    typeof detail?.number_of_seasons === "number"
      ? `${detail.number_of_seasons}`
      : undefined;
  const tagline =
    typeof detail?.tagline === "string" && detail.tagline.length > 0
      ? detail.tagline
      : undefined;
  const status = typeof detail?.status === "string" ? detail.status : undefined;
  const voteAverage =
    typeof detail?.vote_average === "number" && detail.vote_average > 0
      ? detail.vote_average
      : undefined;
  const voteCount =
    typeof detail?.vote_count === "number" ? detail.vote_count : undefined;

  const credits = detail?.credits as
    | { cast?: CastMember[]; crew?: CrewMember[] }
    | undefined;
  const cast = (credits?.cast ?? []).slice(0, 16);
  const createdBy = (detail?.created_by as { name?: string }[] | undefined)
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(", ");
  const director =
    mediaType === "tv"
      ? createdBy || undefined
      : credits?.crew?.find((c) => c.job === "Director")?.name;
  const studio = (
    detail?.production_companies as { name?: string }[] | undefined
  )?.[0]?.name;
  const originalLanguage =
    typeof detail?.original_language === "string"
      ? detail.original_language.toUpperCase()
      : undefined;

  const myStars = review?.rating != null ? ratingToStars(review.rating) : 0;
  const hasReview = review != null;

  const histogram = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    for (const r of reviews) {
      if (r.rating == null) continue;
      const star = Math.round(ratingToStars(r.rating));
      const index = Math.min(4, Math.max(0, star - 1));
      buckets[index] += 1;
    }
    return buckets;
  }, [reviews]);
  const maxBucket = Math.max(1, ...histogram);

  const infoRows = [
    director
      ? { label: mediaType === "tv" ? "Creator" : "Director", value: director }
      : null,
    seasons ? { label: "Seasons", value: seasons } : null,
    detail?.release_date
      ? { label: "Release date", value: formatDate(detail.release_date)! }
      : null,
    runtime ? { label: "Runtime", value: runtime } : null,
    status ? { label: "Status", value: status } : null,
    originalLanguage ? { label: "Language", value: originalLanguage } : null,
    studio ? { label: "Studio", value: studio } : null,
  ].filter((row): row is { label: string; value: string } => row != null);

  function openReview(rating?: number) {
    hapticTap();
    router.push(reviewSheetHref({ id: tmdbId, mediaType, title, rating }));
  }

  function shareTitle() {
    Share.share({ message: title }).catch(() => {});
  }

  function openTmdb() {
    Linking.openURL(`https://www.themoviedb.org/${mediaType}/${tmdbId}`).catch(
      () => {},
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={hasReview ? "checkmark" : "plus"}
          variant="prominent"
          onPress={() => openReview(myStars || undefined)}>
          Mark as seen
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Menu icon="ellipsis">
          {hasReview ? (
            <Stack.Toolbar.MenuAction
              icon="star"
              onPress={() => openReview(myStars || undefined)}>
              Edit review
            </Stack.Toolbar.MenuAction>
          ) : null}
          <Stack.Toolbar.MenuAction icon="square.and.arrow.up" onPress={shareTitle}>
            Share
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="safari" onPress={openTmdb}>
            Open in TMDB
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>

      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.LG }}>
          <View
            style={[
              styles.hero,
              { width, height: heroHeight, paddingTop: insets.top + SPACING.MD },
            ]}>
            {ambientUri ? (
              <Image
                source={{ uri: ambientUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                blurRadius={60}
                transition={200}
              />
            ) : null}
            <LinearGradient
              colors={["transparent", "transparent", theme.background]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Link.AppleZoomTarget>
              <View style={styles.posterShadow}>
                <Image
                  source={posterUri ? { uri: posterUri } : undefined}
                  style={[
                    styles.posterCard,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            </Link.AppleZoomTarget>
          </View>

          <View style={styles.content}>
            <Text size="2xl" weight="bold" color={theme.text} fillWidth>
              {title}
            </Text>
            {tagline ? (
              <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
                {tagline}
              </Text>
            ) : null}
            {metaLine([year, runtime, genres]) ? (
              <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
                {metaLine([year, runtime, genres])}
              </Text>
            ) : null}
            {voteAverage ? (
              <Text size="sm" weight="semibold" color={theme.textSecondary} fillWidth>
                {metaLine([
                  `★ ${voteAverage.toFixed(1)}${voteCount ? ` (${voteCount})` : ""}`,
                  status,
                ])}
              </Text>
            ) : null}

            {error && !detail ? (
              <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
                {error}
              </Text>
            ) : null}

            {detail?.overview ? (
              <DetailSection title="About">
                <Text size="md" weight="regular" color={theme.textSecondary} fillWidth>
                  {detail.overview}
                </Text>
              </DetailSection>
            ) : null}

            {cast.length > 0 ? (
              <DetailSection title="Cast">
                <ScrollView
                  horizontal
                  style={styles.edgeToEdgeScroll}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.castRow, styles.edgeToEdgeScrollContent]}>
                  {cast.map((member) => (
                    <CastAvatar key={member.id} member={member} theme={theme} />
                  ))}
                </ScrollView>
              </DetailSection>
            ) : null}

            {infoRows.length > 0 ? (
              <DetailSection title="Information">
                <View style={styles.infoList}>
                  {infoRows.map((row, index) => (
                    <InfoRow
                      key={row.label}
                      label={row.label}
                      value={row.value}
                      theme={theme}
                      isLast={index === infoRows.length - 1}
                    />
                  ))}
                </View>
              </DetailSection>
            ) : null}

            <DetailSection title="Ratings & Reviews">
              {stats && stats.avg_rating != null && stats.rating_count > 0 ? (
                <View style={styles.ratingSummary}>
                  <View style={styles.ratingBig}>
                    <Text size="2xl" weight="heavy">
                      {stats.avg_rating.toFixed(1)}
                    </Text>
                    <Text size="xs" weight="semibold" color={theme.textSecondary}>
                      out of 5
                    </Text>
                  </View>
                  <View style={styles.histogram}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const fill: DimensionValue = `${
                        (histogram[star - 1] / maxBucket) * 100
                      }%`;
                      return (
                        <View
                          key={star}
                          style={[
                            styles.histTrack,
                            { backgroundColor: theme.backgroundElement },
                          ]}>
                          <View
                            style={[
                              styles.histFill,
                              { width: fill, backgroundColor: accentHex },
                            ]}
                          />
                        </View>
                      );
                    })}
                    <Text size="xs" weight="regular" color={theme.textSecondary}>
                      {`${stats.rating_count} Rating${
                        stats.rating_count === 1 ? "" : "s"
                      }`}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.tapToRate}>
                <Text size="sm" weight="regular" align="center" color={theme.textSecondary}>
                  {hasReview ? "Your rating" : "Tap to Rate:"}
                </Text>
                <View style={styles.tapStars}>
                  <StarRating
                    value={myStars}
                    size="xl"
                    emptyColor={accentHex}
                    onChange={(value) => openReview(value)}
                  />
                </View>
              </View>

              {reviews.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reviewRow}>
                  {reviews.slice(0, 10).map((item) => (
                    <ReviewCard key={item.id} review={item} theme={theme} />
                  ))}
                </ScrollView>
              ) : null}
            </DetailSection>

            {isLoading && !detail ? (
              <Text size="sm" weight="regular" color={theme.textSecondary} fillWidth>
                Loading…
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Text size="lg" weight="bold" color={theme.text} fillWidth>
        {title}
      </Text>
      {children}
    </View>
  );
}

function CastAvatar({
  member,
  theme,
}: {
  member: CastMember;
  theme: ThemeColors;
}) {
  const avatar = tmdbImageUrl(member.profile_path, "w185");
  return (
    <View style={styles.castItem}>
      <Image
        source={avatar ? { uri: avatar } : undefined}
        style={[styles.castAvatar, { backgroundColor: theme.backgroundElement }]}
        contentFit="cover"
        transition={200}
      />
      <Text
        size="xs"
        weight="semibold"
        align="center"
        color={theme.text}
        fillWidth
        numberOfLines={1}>
        {truncate(member.name, 18)}
      </Text>
      {member.character ? (
        <Text
          size="xs"
          weight="regular"
          align="center"
          color={theme.textSecondary}
          fillWidth
          numberOfLines={1}>
          {truncate(member.character, 18)}
        </Text>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
  theme,
  isLast,
}: {
  label: string;
  value: string;
  theme: ThemeColors;
  isLast: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        isLast
          ? null
          : {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: theme.backgroundSelected,
            },
      ]}>
      <Text size="sm" weight="regular" color={theme.textSecondary}>
        {label}
      </Text>
      <Text size="sm" weight="medium">
        {value}
      </Text>
    </View>
  );
}

function ReviewCard({ review, theme }: { review: Review; theme: ThemeColors }) {
  return (
    <View style={[styles.reviewCard, { backgroundColor: theme.backgroundElement }]}>
      {review.rating != null ? (
        <StarRating value={ratingToStars(review.rating)} size="xs" readOnly />
      ) : null}
      {review.comment ? (
        <Text size="sm" weight="regular">
          {truncate(review.comment, 180)}
        </Text>
      ) : null}
      <Text size="xs" weight="regular" color={theme.textSecondary}>
        {formatDate(review.created_at) ?? ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  posterShadow: {
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  posterCard: {
    width: 150,
    height: 225,
    borderRadius: 14,
    borderCurve: "continuous",
  },
  content: {
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    gap: SPACING.SM,
  },
  section: {
    gap: SPACING.SM,
    paddingTop: SPACING.MD,
  },
  castRow: {
    gap: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  edgeToEdgeScroll: {
    marginHorizontal: -SPACING.MD,
  },
  edgeToEdgeScrollContent: {
    paddingHorizontal: SPACING.MD,
  },
  castItem: {
    width: 88,
    gap: SPACING.XS,
  },
  castAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  infoList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.SM,
    gap: SPACING.MD,
  },
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  ratingBig: {
    alignItems: "center",
  },
  histogram: {
    flex: 1,
    gap: SPACING.XS,
  },
  histTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  histFill: {
    height: 6,
    borderRadius: 3,
  },
  tapToRate: {
    alignItems: "center",
    gap: SPACING.SM,
    paddingVertical: SPACING.MD,
  },
  tapStars: {
    alignItems: "center",
  },
  reviewRow: {
    gap: SPACING.MD,
    paddingVertical: SPACING.XS,
  },
  reviewCard: {
    width: 260,
    gap: SPACING.SM,
    padding: SPACING.MD,
    borderRadius: 16,
    borderCurve: "continuous",
  },
});
