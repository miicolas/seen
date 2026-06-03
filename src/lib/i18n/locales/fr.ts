import type { en } from "./en";

export const fr: typeof en = {
  home: {
    welcome: "Bienvenue 👋",
    signedInAs: "Connecté en tant que",
    signOut: "Se déconnecter",
  },
  onboarding: {
    title: "Tout ce que tu as vu, au même endroit",
    subtitle: "Note, critique et garde une trace de tes films et séries",
    devSignIn: "Connexion dev",
    authenticating: "Connexion...",
    appleUnavailable:
      "La connexion avec Apple n'est pas disponible sur cet appareil.",
    authError: "La connexion avec Apple a échoué. Réessaie.",
    devAuthError: "La connexion dev a échoué. Réinitialise le seed Supabase local.",
  },
  discover: {
    filterAll: "Tout",
    filterMovies: "Films",
    filterSeries: "Séries",
    searchPlaceholder: "Rechercher films & séries",
    trendingTitle: "Tendances",
    eyebrowAll: "Films & Séries",
    eyebrowMovies: "Films",
    eyebrowSeries: "Séries",
    topTodayTitle: "Top 10 du jour",
    topTodayEyebrow: "Classement",
    newReleasesTitle: "Nouveautés",
    freshAll: "Films et séries récents",
    freshMovies: "Films récents",
    freshSeries: "Séries récentes",
    noResults: "Aucun résultat pour « {{query}} »",
    genreAction: "Action",
    genreComedy: "Comédie",
    genreSciFiFantasy: "Science-fiction & Fantastique",
  },
  tabs: {
    home: "Accueil",
    discover: "Découvrir",
  },
};
