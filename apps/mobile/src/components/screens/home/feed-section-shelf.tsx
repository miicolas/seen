import { useTranslation } from "react-i18next";

import { HeroCard } from "@/components/discover/hero-card";
import { PosterCard } from "@/components/discover/poster-card";
import { Shelf } from "@/components/discover/shelf";
import type { FeedEntry, FeedSection } from "@/services/recommendations";

const keyOf = (entry: FeedEntry, index: number) => `${entry.media_type}-${entry.id}-${index}`;

const impressionRef = (entry: FeedEntry) => ({
  tmdbId: entry.id,
  mediaType: entry.media_type,
});

// One "For You" section as a shelf: the lead section gets hero treatment, the
// rest are poster rows. Impressions are credited to the section's source.
export function FeedSectionShelf({ section }: { section: FeedSection }) {
  const { t } = useTranslation();
  const isHero = section.key === "today";

  const titles: Record<FeedSection["key"], string> = {
    today: t("home.sections.today"),
    because_you_rated: t("home.sections.becauseYouRated", {
      title: section.anchorTitle ?? "",
    }),
    trending: t("home.sections.trending"),
    acclaimed: t("home.sections.acclaimed"),
    available_tonight: t("home.sections.availableTonight"),
    hidden_gems: t("home.sections.hiddenGems"),
    discovery: t("home.sections.discovery"),
  };

  return (
    <Shelf
      title={titles[section.key]}
      snap={isHero}
      data={section.entries}
      keyExtractor={keyOf}
      visibleCards={isHero ? 1.05 : 2.2}
      impressionSource={section.source}
      impressionItem={impressionRef}
      renderItem={(entry, _index, cardWidth) =>
        isHero ? (
          <HeroCard
            movie={entry}
            width={cardWidth}
            base="home"
            eyebrow={t("home.sections.todayEyebrow")}
          />
        ) : (
          <PosterCard movie={entry} width={cardWidth} base="home" />
        )
      }
    />
  );
}
