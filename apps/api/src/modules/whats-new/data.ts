// Source of truth for the "What's New" announcements served to the app.
// Ordered newest-first (index 0 = latest). Each release has a stable slug `id`
// used by the client to track what the user has already seen — independent of
// the app version. Publishing a new announcement = add a release here + deploy.

interface LocalizedText {
  en: string;
  fr: string;
}

interface WhatsNewFeature {
  icon: string;
  title: LocalizedText;
  description: LocalizedText;
}

interface WhatsNewRelease {
  id: string;
  features: WhatsNewFeature[];
}

export const WHATS_NEW_RELEASES: WhatsNewRelease[] = [
  {
    id: "person-pages",
    features: [
      {
        icon: "person.crop.rectangle.stack",
        title: { en: "Cast & Crew Pages", fr: "Fiches des acteurs" },
        description: {
          en: "Tap any cast member to explore their photo, bio, and filmography.",
          fr: "Touchez un acteur pour voir sa photo, sa bio et sa filmographie.",
        },
      },
    ],
  },
  {
    id: "you-may-also-like",
    features: [
      {
        icon: "rectangle.stack",
        title: { en: "You May Also Like", fr: "À voir aussi" },
        description: {
          en: "Discover related titles right on any movie or series page.",
          fr: "Trouvez des titres similaires directement sur chaque film ou série.",
        },
      },
    ],
  },
  {
    id: "letterboxd-account",
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
    id: "launch",
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
