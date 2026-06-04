import { en } from "./en";
import { fr } from "./fr";

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

export type AppLanguage = keyof typeof resources;

export const SUPPORTED_LANGUAGES: AppLanguage[] = ["en", "fr"];
