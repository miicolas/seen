import { Group, RNHostView } from "@expo/ui/swift-ui";
import { listRowInsets, onAppear as onAppearModifier } from "@expo/ui/swift-ui/modifiers";
import { useRouter } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { socialProfileHref } from "@/lib/navigation";
import type { SocialProfileCard } from "@/services/social";

import { ProfileCardRow } from "./profile-card-row";

// Total horizontal inset eaten by the inset List margins + our listRowInsets
// (same budget as watchlist-row). RNHostView has no width of its own, so the
// row pins an explicit width for text to truncate correctly.
const ROW_HORIZONTAL_INSET = 64;

// Key the row by its follow state: RN content hosted in a SwiftUI List goes
// stale on in-place React updates, so a state flip must remount the host.
export function profileRowKey(card: SocialProfileCard): string {
  return `${card.id}:${card.is_following}:${card.request_status}`;
}

// A ProfileCardRow hosted inside the native ProfileList. Navigates to the
// profile on tap; `onReveal` fires when the row scrolls into view (used on the
// last row to page in more).
export function ProfileListRow({
  card,
  contactName,
  onReveal,
}: {
  card: SocialProfileCard;
  contactName?: string | null;
  onReveal?: () => void;
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const rowWidth = width - ROW_HORIZONTAL_INSET;

  const rowModifiers = [listRowInsets({ top: 8, bottom: 8, leading: 16, trailing: 16 })];
  if (onReveal) rowModifiers.push(onAppearModifier(onReveal));

  return (
    <Group modifiers={rowModifiers}>
      <RNHostView matchContents>
        <View style={StyleSheet.flatten([styles.row, { width: rowWidth }])}>
          <ProfileCardRow
            card={card}
            contactName={contactName}
            onPress={() => router.push(socialProfileHref(card.id))}
          />
        </View>
      </RNHostView>
    </Group>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "center",
  },
});
