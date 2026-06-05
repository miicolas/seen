import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources, SUPPORTED_LANGUAGES, type AppLanguage } from "./locales/resources";

const FALLBACK: AppLanguage = "en";

export function detectDeviceLanguage(): AppLanguage {
  try {
    return getLocales()[0]?.languageCode === "fr" ? "fr" : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

if (!i18n.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member
  i18n.use(initReactI18next).init({
    resources,
    lng: detectDeviceLanguage(),
    fallbackLng: FALLBACK,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: "translation",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnNull: false,
    // Inline resources => initialize synchronously so `t` is ready on the very
    // first render. Without this, init is async and `t` returns raw keys.
    initAsync: false,
  });
}

export default i18n;
