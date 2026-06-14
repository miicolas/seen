import { Redirect, useLocalSearchParams, type Href } from "expo-router";

export default function LegacyDiscoverMediaRoute() {
  const params = useLocalSearchParams();

  return <Redirect href={{ pathname: "/(tabs)/search/[id]", params } as Href} />;
}
