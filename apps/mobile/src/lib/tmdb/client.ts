import i18n from "@/lib/i18n";

const TMDB_LOCALES: Record<string, string> = { en: "en-US", fr: "fr-FR" };

// Maps the app language onto a TMDB locale so movie titles, overviews and
// genres come back in the language the user is reading the app in.
export function tmdbLanguage(language = i18n.language): string {
  const lang = language?.split("-")[0] ?? "en";
  return TMDB_LOCALES[lang] ?? "en-US";
}
