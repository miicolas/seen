import { describe, expect, it } from "bun:test";

import { sectionizePool, type PoolRow } from "./sectionize-pool";

// A realistic 200-row pool: mixed scores, ~5 anchors backing groups of titles,
// trending/availability flags, and a quality/popularity spread.
function buildPool(size = 200): PoolRow[] {
  const rows: PoolRow[] = [];
  for (let i = 0; i < size; i += 1) {
    const anchorIndex = i % 8 < 4 ? i % 4 : null;
    rows.push({
      tmdbId: 1000 + i,
      mediaType: i % 3 === 0 ? "tv" : "movie",
      score: 1 - i / size,
      rank: i,
      components: {
        content: 0.5,
        ...(i % 5 === 0 ? { trendingGlobal: 0.8 } : {}),
        ...(i % 4 === 0 ? { availability: 1 as const } : { availability: 0 as const }),
      },
      anchorTmdbId: anchorIndex !== null ? 1 + anchorIndex : null,
      anchorMediaType: anchorIndex !== null ? "movie" : null,
      anchorTitle: anchorIndex !== null ? `Anchor ${anchorIndex}` : null,
      popularity: (i * 7) % 120,
      voteAverage: 5.5 + ((i * 13) % 30) / 10,
      voteCount: 50 + ((i * 37) % 3000),
    });
  }
  return rows;
}

describe("sectionizePool", () => {
  const pool = buildPool();

  it("is deterministic for a given salt", () => {
    const first = sectionizePool(pool, "user:FR:abc");
    const second = sectionizePool(pool, "user:FR:abc");
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("produces a visibly different feed for a different salt", () => {
    const a = sectionizePool(pool, "user:FR:salt-a");
    const b = sectionizePool(pool, "user:FR:salt-b");

    const todayA = a.find((s) => s.key === "today")!.rows.map((r) => r.tmdbId);
    const todayB = b.find((s) => s.key === "today")!.rows.map((r) => r.tmdbId);
    expect(todayA.join(",")).not.toBe(todayB.join(","));
  });

  it("rotates because_you_rated anchors across salts", () => {
    const anchorsFor = (salt: string) =>
      sectionizePool(pool, `user:FR:${salt}`)
        .filter((s) => s.key === "because_you_rated")
        .map((s) => s.anchorTitle)
        .join("|");
    const seen = new Set(["a", "b", "c", "d", "e"].map(anchorsFor));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("emits multiple anchored rows with distinct anchors", () => {
    const anchored = sectionizePool(pool, "user:FR:0").filter(
      (s) => s.key === "because_you_rated",
    );
    expect(anchored.length).toBeGreaterThanOrEqual(2);
    const titles = anchored.map((s) => s.anchorTitle);
    expect(new Set(titles).size).toBe(titles.length);
    for (const section of anchored) expect(section.anchorTitle).not.toBeNull();
  });

  it("caps how many sections a title appears in", () => {
    const counts = new Map<number, number>();
    for (const section of sectionizePool(pool, "user:FR:0")) {
      for (const row of section.rows) {
        counts.set(row.tmdbId, (counts.get(row.tmdbId) ?? 0) + 1);
      }
    }
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });

  it("omits shelves that cannot fill to a minimum size", () => {
    const tiny = buildPool(6).map((row) => ({ ...row, components: { content: 0.5 } }));
    const sections = sectionizePool(tiny, "user:FR:0");
    // No trending/availability components → those shelves must be absent, not
    // rendered with 1-2 posters.
    expect(sections.find((s) => s.key === "trending")).toBeUndefined();
    expect(sections.find((s) => s.key === "available_tonight")).toBeUndefined();
  });
});
