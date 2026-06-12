import { Group, Host, HStack, RNHostView, ScrollView, useNativeState } from "@expo/ui/swift-ui";
import {
  id as idModifier,
  padding,
  scrollPosition,
  scrollTargetBehavior,
  scrollTargetLayout,
} from "@expo/ui/swift-ui/modifiers";
import { useWindowDimensions, View } from "react-native";

import { ShareCard } from "@/components/insights/share/share-card";
import {
  SHARE_CARD_SIZES,
  type ShareCardFormat,
} from "@/components/insights/share/share-card-frame";
import { SPACING } from "@/constants/design-tokens";
import { useAccentColor } from "@/hooks/use-accent-color";
import type { ShareRecap, ShareTemplate } from "@/services/analytics";

// The story card is taller than the sheet preview; render it full-size (so the
// capture is crisp) and scale it down visually to fit.
const STORY_PREVIEW_SCALE = 0.62;

// Native SwiftUI paged preview of the share templates: a horizontal ScrollView
// with view-aligned snapping. SwiftUI owns the scrolling (an RN ScrollView
// inside a formSheet gets its frame hijacked by react-native-screens); the
// cards stay RN so react-native-view-shot can snapshot them. All recaps are
// loaded BEFORE this mounts: RN content hosted in SwiftUI goes stale on
// in-place React updates, so the host must mount once with final content
// (keyed by format for the only allowed swap).
export function TemplateCarousel({
  templates,
  recaps,
  initialTemplate,
  format,
  onTemplateChange,
  onCardRef,
}: {
  templates: ShareTemplate[];
  recaps: Record<ShareTemplate, ShareRecap>;
  initialTemplate: ShareTemplate;
  format: ShareCardFormat;
  onTemplateChange: (template: ShareTemplate) => void;
  onCardRef: (template: ShareTemplate, node: View | null) => void;
}) {
  const { width } = useWindowDimensions();
  const { accentHex } = useAccentColor();
  const activeId = useNativeState<string | null>(initialTemplate);
  const size = SHARE_CARD_SIZES[format];
  const scale = format === "story" ? STORY_PREVIEW_SCALE : 1;
  const previewWidth = size.width * scale;
  const previewHeight = size.height * scale;
  const sidePadding = Math.max(0, (width - previewWidth) / 2);

  return (
    <Host
      key={format}
      matchContents={false}
      useViewportSizeMeasurement
      style={{ height: previewHeight }}>
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
            <Group key={template} modifiers={[idModifier(template)]}>
              <RNHostView matchContents>
                <View style={{ width: previewWidth, height: previewHeight }}>
                  <View
                    ref={(node) => onCardRef(template, node)}
                    collapsable={false}
                    style={[
                      { width: size.width, height: size.height },
                      scale !== 1 && {
                        transform: [{ scale }],
                        transformOrigin: "top left",
                      },
                    ]}>
                    <ShareCard recap={recaps[template]} accent={accentHex} format={format} />
                  </View>
                </View>
              </RNHostView>
            </Group>
          ))}
        </HStack>
      </ScrollView>
    </Host>
  );
}
