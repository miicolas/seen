import { Fragment, type ReactNode } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { SectionHeader } from "@/components/discover/section-header";
import { SPACING } from "@/constants/design-tokens";
import { MaxContentWidth } from "@/constants/theme";

const DEFAULT_PEEK = 0.16;

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
}: ShelfProps<T>) {
  const { width } = useWindowDimensions();

  if (data.length === 0) return null;

  const usable = Math.min(width, MaxContentWidth) - SPACING.MD * 2 - SPACING.MD;
  const cardWidth = usable / (visibleCards + peek);

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
        contentContainerStyle={styles.content}>
        {data.map((item, index) => (
          <Fragment key={keyExtractor(item, index)}>
            {renderItem(item, index, cardWidth)}
          </Fragment>
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
