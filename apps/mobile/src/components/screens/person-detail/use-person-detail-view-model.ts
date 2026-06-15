import { useLocalSearchParams } from "expo-router";

import { usePersonDetail } from "@/hooks/tmdb/use-person-detail";
import { useMediaRouteBase } from "@/hooks/use-media-route-base";
import { tmdbImageUrl } from "@/lib/tmdb";

export function usePersonDetailViewModel() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const personId = Number(params.id);
  const base = useMediaRouteBase();

  const { person, isLoading, error } = usePersonDetail(personId);

  const name = person?.name ?? params.name ?? "";
  const profileUri = tmdbImageUrl(person?.profile_path ?? null, "w500");

  return {
    personId,
    base,
    name,
    profileUri,
    role: person?.known_for_department ?? null,
    biography: person?.biography ?? null,
    acting: person?.acting ?? [],
    crew: person?.crew ?? [],
    isLoading,
    error,
  };
}
