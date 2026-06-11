import type { TFunction } from "i18next";

import type { SocialProfileCard } from "@/services/social";

const MAX_SEGMENTS = 2;

function pluralSuffix(count: number): string {
  return count === 1 ? "" : "s";
}

// The social-context line under a profile name, e.g. "Followed by Marie · 12
// followers". Joins the most relevant segments (contact name, mutuals,
// follower count, seen count) with " · ", capped at two.
export function buildProfileSubtitle(
  t: TFunction,
  card: SocialProfileCard,
  options?: { contactName?: string | null },
): string | null {
  const segments: string[] = [];

  if (options?.contactName) {
    segments.push(options.contactName);
  }

  const mutualName = card.mutual_followers?.[0]?.full_name;
  const mutualCount = card.mutual_followers_count ?? 0;
  if (mutualName) {
    const others = mutualCount - 1;
    segments.push(
      others > 0
        ? t("social.followedByOthers", {
            name: mutualName,
            count: others,
            plural: pluralSuffix(others),
          })
        : t("social.followedBy", { name: mutualName }),
    );
  }

  const followers = card.followers_count ?? 0;
  if (segments.length < MAX_SEGMENTS && followers > 0) {
    segments.push(
      t("social.followersCount", { count: followers, plural: pluralSuffix(followers) }),
    );
  }

  const seen = card.seen_count ?? 0;
  if (segments.length < MAX_SEGMENTS && seen > 0) {
    segments.push(t("social.seenCount", { count: seen, plural: pluralSuffix(seen) }));
  }

  return segments.length > 0 ? segments.slice(0, MAX_SEGMENTS).join(" · ") : null;
}
