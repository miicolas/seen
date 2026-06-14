import { Redirect, useLocalSearchParams, type Href } from "expo-router";

export default function LegacyHomeEpisodeRoute() {
  const params = useLocalSearchParams();

  return <Redirect href={{ pathname: "/(tabs)/search/episode", params } as Href} />;
}
