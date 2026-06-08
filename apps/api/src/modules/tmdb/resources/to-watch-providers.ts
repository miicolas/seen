import { asNumber, asRecord, asString } from "../../../lib/coerce";

export type ProviderRef = {
  providerId: number;
  name: string;
  logoPath: string | null;
};

export type WatchProvidersResource = {
  region: string;
  link: string | null;
  flatrate: ProviderRef[];
  rent: ProviderRef[];
  buy: ProviderRef[];
};

function toProviderList(value: unknown): ProviderRef[] {
  if (!Array.isArray(value)) return [];
  const out: ProviderRef[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    const providerId = asNumber(record.provider_id);
    const name = asString(record.provider_name);
    if (providerId === undefined || !name) continue;
    out.push({
      providerId,
      name,
      logoPath: asString(record.logo_path) ?? null,
    });
  }
  return out;
}

export function toWatchProviders(
  raw: Record<string, unknown> | undefined,
  region: string,
): WatchProvidersResource {
  const results = asRecord(asRecord(raw?.["watch/providers"]).results);
  const regionEntry = asRecord(results[region]);
  return {
    region,
    link: asString(regionEntry.link) ?? null,
    flatrate: toProviderList(regionEntry.flatrate),
    rent: toProviderList(regionEntry.rent),
    buy: toProviderList(regionEntry.buy),
  };
}
