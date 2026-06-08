import { attributeDiscovery, type DiscoveryFlow } from "../helpers";
import type { AnalyticsRange } from "../shared";
import { fetchDiscoveryEvents } from "./fetch-discovery-events";
import { getAnalyticsPeriod } from "./period";

export async function getDiscoveryFlow(
  userId: string,
  range: AnalyticsRange,
  timezone: string | undefined,
): Promise<DiscoveryFlow> {
  const { period } = getAnalyticsPeriod(range, timezone);
  const { impressions, interactions } = await fetchDiscoveryEvents(userId, period);
  return attributeDiscovery(impressions, interactions, period);
}
