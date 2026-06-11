import {
  Group,
  Host,
  HStack,
  RNHostView,
  ScrollView,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  id as idModifier,
  padding,
  scrollPosition,
  scrollTargetBehavior,
  scrollTargetLayout,
} from "@expo/ui/swift-ui/modifiers";
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from "react-native";

import { ShareCard } from "@/components/insights/share/share-card";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "@/components/insights/share/share-card-frame";
import { SPACING } from "@/constants/design-tokens";
import { useAnalyticsShareRecap } from "@/hooks/analytics/use-analytics-share-recap";
import { useAccentColor } from "@/hooks/use-accent-color";
import type { ShareTemplate } from "@/services/analytics";

function TemplatePage({
  template,
  accent,
  onCardRef,
}: {
  template: ShareTemplate;
  accent: string;
  onCardRef: (template: ShareTemplate, node: View | null) => void;
}) {
  const recap = useAnalyticsShareRecap(template);

  return (
    // Key by readiness: RN content hosted in SwiftUI goes stale on in-place
    // React updates, so the loading → card swap must remount the host.
    <Group key={`${template}:${recap.data ? "ready" : "loading"}`} modifiers={[idModifier(template)]}>
      <RNHostView matchContents>
        {recap.isLoading || !recap.data ? (
          <View style={styles.placeholder}>
            <ActivityIndicator />
          </View>
        ) : (
          <View ref={(node) => onCardRef(template, node)} collapsable={false}>
            <ShareCard recap={recap.data} accent={accent} />
          </View>
        )}
      </RNHostView>
    </Group>
  );
}

// Native SwiftUI paged preview of the share templates: a horizontal ScrollView
// with view-aligned snapping. SwiftUI owns the scrolling (an RN ScrollView
// inside a formSheet gets its frame hijacked by react-native-screens); the
// cards stay RN so react-native-view-shot can snapshot them.
export function TemplateCarousel({
  templates,
  initialTemplate,
  onTemplateChange,
  onCardRef,
}: {
  templates: ShareTemplate[];
  initialTemplate: ShareTemplate;
  onTemplateChange: (template: ShareTemplate) => void;
  onCardRef: (template: ShareTemplate, node: View | null) => void;
}) {
  const { width } = useWindowDimensions();
  const { accentHex } = useAccentColor();
  const activeId = useNativeState<string | null>(initialTemplate);
  const sidePadding = Math.max(0, (width - SHARE_CARD_WIDTH) / 2);

  return (
    <Host matchContents={false} useViewportSizeMeasurement style={styles.host}>
      <ScrollView
        axes="horizontal"
        showsIndicators={false}
        modifiers={[
          scrollTargetBehavior("viewAligned"),
          scrollPosition(activeId, {
            onChange: (value) => {
              const template = templates.find((entry) => entry === value);
              if (template) onTemplateChange(template);
            },
          }),
        ]}>
        <HStack
          spacing={SPACING.MD}
          modifiers={[scrollTargetLayout(), padding({ horizontal: sidePadding })]}>
          {templates.map((template) => (
            <TemplatePage
              key={template}
              template={template}
              accent={accentHex}
              onCardRef={onCardRef}
            />
          ))}
        </HStack>
      </ScrollView>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    height: SHARE_CARD_HEIGHT,
  },
  placeholder: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
});
