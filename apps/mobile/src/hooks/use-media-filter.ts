import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MEDIA_FILTER_OPTIONS, type MediaFilterOption } from "@/constants/media-filters";
import { hapticSelection } from "@/lib/haptics";
import type { MediaFilter } from "@/lib/tmdb";

export type LabeledMediaFilterOption = MediaFilterOption & { label: string };

// Shared all/movie/tv filter state for screens with a nav-bar filter menu.
// Labels resolve from the screen's own i18n namespace ("discover.filterAll", …).
export function useMediaFilter(namespace: "discover" | "watchlist") {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<MediaFilter>("all");

  const options: LabeledMediaFilterOption[] = useMemo(
    () =>
      MEDIA_FILTER_OPTIONS.map((option) => ({
        ...option,
        label: t(`${namespace}.${option.labelKey}`),
      })),
    [namespace, t],
  );

  const activeOption = options.find((option) => option.value === filter) ?? options[0];

  function selectFilter(value: MediaFilter) {
    setFilter(value);
    hapticSelection();
  }

  return { filter, options, activeOption, selectFilter };
}
