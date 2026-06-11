import { describe, expect, it } from "bun:test";

import { buildReason } from "./friend-signal";

describe("buildReason", () => {
  it("credits a single friend with their action", () => {
    expect(buildReason([{ username: "alice", action: "review" }])).toBe("@alice reviewed this");
    expect(buildReason([{ username: "alice", action: "watched" }])).toBe("@alice watched this");
    expect(buildReason([{ username: "alice", action: "watchlist" }])).toBe(
      "@alice added this to their watchlist",
    );
  });

  it("prefers review over watched over watchlist for the primary credit", () => {
    expect(
      buildReason([
        { username: "carol", action: "watchlist" },
        { username: "bob", action: "watched" },
        { username: "alice", action: "review" },
      ]),
    ).toBe("@alice and 2 others");
    expect(
      buildReason([
        { username: "carol", action: "watchlist" },
        { username: "bob", action: "watched" },
      ]),
    ).toBe("@bob and 1 other");
  });

  it("returns null with no entries", () => {
    expect(buildReason([])).toBeNull();
  });
});
