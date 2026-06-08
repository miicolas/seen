import { Fragment, type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { SectionHeader } from "@/components/discover/section-header";
import { SPACING } from "@/constants/design-tokens";
import { MaxContentWidth } from "@/constants/theme";
import type { MediaType } from "@/lib/tmdb";
import { trackImpression, type RecommendationSource } from "@/services/events";

const DEFAULT_PEEK = 0.16;

type ImpressionRef = { tmdbId: number; mediaType: MediaType };

interface ShelfProps<T> {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  onSeeAll?: () => void;
  hideHeader?: boolean;
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number, cardWidth: number) => ReactNode;
  visibleCards: number;
  peek?: number;
  snap?: boolean;
  // When set, records a recommendation impression for each item as it scrolls
  // into view (once per item/source/position, deduped in the events queue).
  impressionSource?: RecommendationSource;
  impressionItem?: (item: T, index: number) => ImpressionRef | null;
}

export function Shelf<T>({
  title,
  eyebrow,
  subtitle,
  onSeeAll,
  hideHeader,
  data,
  keyExtractor,
  renderItem,
  visibleCards,
  peek = DEFAULT_PEEK,
  snap = false,
  impressionSource,
  impressionItem,
}: ShelfProps<T>) {
  const { width } = useWindowDimensions();
  const recordedRef = useRef<Set<number>>(new Set());
  // Stable per-instance id so two shelves sharing an impressionSource don't dedupe
  // each other's cards in the events queue.
  const scope = useId();

  const usable = Math.min(width, MaxContentWidth) - SPACING.MD * 2 - SPACING.MD;
  const cardWidth = usable / (visibleCards + peek);
  const step = cardWidth + SPACING.MD;
  const viewport = Math.min(width, MaxContentWidth);

  const recordVisible = useCallback(
    (scrollX: number) => {
      if (!impressionSource || !impressionItem) return;
      const first = Math.max(0, Math.floor((scrollX - SPACING.MD) / step));
      const last = Math.min(data.length - 1, Math.floor((scrollX + viewport - SPACING.MD) / step));
      for (let i = first; i <= last; i += 1) {
        if (recordedRef.current.has(i)) continue;
        const ref = impressionItem(data[i], i);
        if (!ref) continue;
        recordedRef.current.add(i);
        trackImpression({
          tmdbId: ref.tmdbId,
          mediaType: ref.mediaType,
          source: impressionSource,
          position: i,
          scope,
        });
      }
    },
    [data, impressionItem, impressionSource, scope, step, viewport],
  );

  // Record whatever is on screen at rest; scrolling records the rest.
  useEffect(() => {
    recordedRef.current = new Set();
    recordVisible(0);
  }, [recordVisible]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      recordVisible(event.nativeEvent.contentOffset.x);
    },
    [recordVisible],
  );

  if (data.length === 0) return null;

  return (
    <View style={styles.container}>
      {hideHeader ? null : (
        <SectionHeader
          title={title ?? ""}
          eyebrow={eyebrow}
          subtitle={subtitle}
          onSeeAll={onSeeAll}
        />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snap ? cardWidth + SPACING.MD : undefined}
        snapToAlignment="start"
        onScroll={impressionSource ? onScroll : undefined}
        scrollEventThrottle={200}
        contentContainerStyle={styles.content}>
        {data.map((item, index) => (
          <Fragment key={keyExtractor(item, index)}>{renderItem(item, index, cardWidth)}</Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.SM,
  },
  content: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
});
