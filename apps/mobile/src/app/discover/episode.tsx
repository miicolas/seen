import { Redirect, useLocalSearchParams, type Href } from "expo-router";

export default function LegacyDiscoverEpisodeRoute() {
  const params = useLocalSearchParams();

  return <Redirect href={{ pathname: "/(tabs)/search/episode", params } as Href} />;
}
