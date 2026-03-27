import { beforeEach, describe, expect, it, vi } from "vitest";

import { getWorldData } from "../lib/worldData";
import {
  findWorldArea,
  findWorldGifts,
  findWorldItems,
  findWorldTrades,
  normalizeWorldName,
} from "../lib/worldDataSchema";

describe("worldData", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("loads bundled world reference data", () => {
    const worldData = getWorldData();

    expect(worldData.gifts).toContainEqual(
      expect.objectContaining({
        name: "Snivy, Tepig or Oshawott",
        location: "Aspertia City, Lookout Spot.",
      }),
    );
    expect(worldData.trades).toContainEqual(
      expect.objectContaining({
        name: "Togepi Trade",
        requested: "a Meowth",
        received: "Togepi",
      }),
    );
    expect(worldData.items).toContainEqual(
      expect.objectContaining({
        area: "Route 19",
      }),
    );
    expect(worldData.wildAreas).toContainEqual(
      expect.objectContaining({
        area: "Aspertia City",
      }),
    );
  });

  it("normalizes and finds world entries by area or partial location", () => {
    const worldData = getWorldData();

    expect(normalizeWorldName("Aspertia City, Lookout Spot.")).toBe("aspertia city lookout spot");

    expect(findWorldArea(worldData.wildAreas, "aspertia-city")).toEqual(
      expect.objectContaining({
        area: "Aspertia City",
      }),
    );
    expect(findWorldGifts(worldData.gifts, "lookout spot")).toContainEqual(
      expect.objectContaining({
        name: "Snivy, Tepig or Oshawott",
      }),
    );
    expect(findWorldTrades(worldData.trades, "route-4")).toContainEqual(
      expect.objectContaining({
        name: "Togepi Trade",
      }),
    );
    expect(findWorldItems(worldData.items, "route 19")).toEqual(
      expect.objectContaining({
        area: "Route 19",
      }),
    );
  });

  it("returns empty results when no world entry matches", () => {
    const worldData = getWorldData();

    expect(findWorldArea(worldData.wildAreas, "missing area")).toBeUndefined();
    expect(findWorldGifts(worldData.gifts, "missing area")).toEqual([]);
    expect(findWorldTrades(worldData.trades, "missing area")).toEqual([]);
    expect(findWorldItems(worldData.items, "missing area")).toBeUndefined();
  });

  it("returns empty arrays when reference files are missing", async () => {
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/tmp/pkm-builder-redux-missing-reference");

    try {
      const { getWorldData: getWorldDataWithMissingFiles } = await import("../lib/worldData");
      expect(getWorldDataWithMissingFiles()).toEqual({
        gifts: [],
        trades: [],
        items: [],
        wildAreas: [],
      });
    } finally {
      cwdSpy.mockRestore();
    }
  });
});
