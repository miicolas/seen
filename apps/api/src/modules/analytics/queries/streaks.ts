import { buildStreaks, type Streaks } from "../helpers";
import { resolveTimeZone } from "../tz";
import { fetchWatchedDayKeys } from "./fetch-watched-days";

export async function getStreaks(userId: string, timezone: string | undefined): Promise<Streaks> {
  const tz = resolveTimeZone(timezone);
  const dayKeys = await fetchWatchedDayKeys(userId, tz);
  return buildStreaks(dayKeys, tz);
}
