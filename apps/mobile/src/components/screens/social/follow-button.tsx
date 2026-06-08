import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFollowActions } from "@/hooks/social/use-follow-actions";
import type { SocialProfileCard } from "@/services/social";

const BUTTON_WIDTH = 120;

// The follow / following / requested / follow-back control for a profile card.
// Owns its own follow/unfollow mutation, so it can be dropped into any list row.
export function FollowButton({ card }: { card: SocialProfileCard }) {
  const { t } = useTranslation();
  const { follow, unfollow, isPending } = useFollowActions(card.id);

  if (card.is_me) return null;

  const isActive = card.is_following || card.request_status === "pending";
  const title = card.is_following
    ? t("social.following")
    : card.request_status === "pending"
      ? t("social.requested")
      : card.follows_me
        ? t("social.followBack")
        : t("social.follow");

  const onPress = () => {
    if (isActive) void unfollow();
    else void follow();
  };

  return (
    <Button
      title={title}
      onPress={onPress}
      variant={isActive ? "soft" : "solid"}
      size="sm"
      width={BUTTON_WIDTH}
      loading={isPending}
    />
  );
}
