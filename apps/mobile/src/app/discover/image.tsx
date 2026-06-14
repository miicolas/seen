import { Redirect, useLocalSearchParams, type Href } from "expo-router";

export default function LegacyDiscoverImageRoute() {
  const params = useLocalSearchParams();

  return <Redirect href={{ pathname: "/(tabs)/search/image", params } as Href} />;
}
