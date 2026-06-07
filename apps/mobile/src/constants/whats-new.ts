import type { SFSymbol } from "sf-symbols-typescript";

import type { AppLanguage } from "@/lib/i18n/locales/resources";

export type LocalizedText = Record<AppLanguage, string>;

export interface WhatsNewFeature {
  icon: SFSymbol;
  title: LocalizedText;
  description: LocalizedText;
}

export interface WhatsNewRelease {
  version: string;
  features: WhatsNewFeature[];
}

export const WHATS_NEW_RELEASES: WhatsNewRelease[] = [
  {
    version: "1.1.0",
    features: [
      {
        icon: "square.and.arrow.down",
        title: { en: "Letterboxd Import", fr: "Import Letterboxd" },
        description: {
          en: "Bring your Letterboxd history with you in just a few taps.",
          fr: "Importez votre historique Letterboxd en quelques instants.",
        },
      },
      {
        icon: "person.crop.circle",
        title: { en: "Account Settings", fr: "Réglages du compte" },
        description: {
          en: "Manage your account and preferences from one place.",
          fr: "Gérez votre compte et vos préférences au même endroit.",
        },
      },
    ],
  },
  {
    version: "1.0.0",
    features: [
      {
        icon: "star",
        title: { en: "Ratings & Reviews", fr: "Notes & critiques" },
        description: {
          en: "Rate everything you watch and write reviews to remember why.",
          fr: "Notez tout ce que vous regardez et écrivez des critiques pour vous souvenir.",
        },
      },
      {
        icon: "bookmark",
        title: { en: "Watchlist", fr: "Watchlist" },
        description: {
          en: "Save movies and series to watch later, all in one place.",
          fr: "Gardez films et séries à regarder plus tard, au même endroit.",
        },
      },
      {
        icon: "magnifyingglass",
        title: { en: "Discover", fr: "Découvrir" },
        description: {
          en: "Browse what's trending and find your next favorite.",
          fr: "Parcourez les tendances et trouvez votre prochain coup de cœur.",
        },
      },
    ],
  },
];

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((part) => parseInt(part, 10) || 0);
  const pb = b.split(".").map((part) => parseInt(part, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}

export function getLatestApplicableRelease(
  releases: WhatsNewRelease[],
  appVersion: string,
): WhatsNewRelease | null {
  const applicable = releases.filter(
    (release) => compareVersions(release.version, appVersion) <= 0,
  );
  if (applicable.length === 0) return null;
  return applicable.reduce((latest, release) =>
    compareVersions(release.version, latest.version) > 0 ? release : latest,
  );
}

export function shouldShowWhatsNew(latestVersion: string, lastSeenVersion: string | null): boolean {
  if (lastSeenVersion === null) return false;
  return compareVersions(latestVersion, lastSeenVersion) > 0;
}
