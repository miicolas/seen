import type { SFSymbol } from "sf-symbols-typescript";

import type { AppLanguage } from "@/lib/i18n/locales/resources";

export type LocalizedText = Record<AppLanguage, string>;

export interface WhatsNewFeature {
  icon: SFSymbol;
  title: LocalizedText;
  description: LocalizedText;
}

export interface WhatsNewRelease {
  id: string;
  features: WhatsNewFeature[];
}
