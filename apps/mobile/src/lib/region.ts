import { getLocales } from "expo-localization";

const DEFAULT_REGION = "FR";

export function getRegion(): string {
  const code = getLocales()[0]?.regionCode;
  return code && code.length > 0 ? code.toUpperCase() : DEFAULT_REGION;
}
