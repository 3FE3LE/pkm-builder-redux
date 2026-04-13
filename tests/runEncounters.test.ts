import { describe, expect, it } from "vitest";

import {
  challengeRunEncounters,
  getFurthestMilestoneId,
  getContextualSourceAreas,
  getNextRelevantEncounter,
  getPendingMandatoryBeforeEncounter,
  getRunEncounterCatalog,
  mapEncounterOrderToMilestoneId,
} from "../lib/runEncounters";

describe("runEncounters", () => {
  it("returns the challenge encounter catalog by default", () => {
    expect(getRunEncounterCatalog()).toEqual(challengeRunEncounters);
    expect(getRunEncounterCatalog("challenge")).toEqual(challengeRunEncounters);
  });

  it("prefers the next pending mandatory encounter, then any remaining one, then the last entry", () => {
    const encounters = [
      { id: "optional-1", order: 1, mandatory: false },
      { id: "mandatory-1", order: 2, mandatory: true },
      { id: "optional-2", order: 3, mandatory: false },
    ] as const;

    expect(getNextRelevantEncounter(encounters as never, [])?.id).toBe("mandatory-1");
    expect(getNextRelevantEncounter(encounters as never, ["mandatory-1"])?.id).toBe("optional-1");
    expect(getNextRelevantEncounter(encounters as never, ["optional-1", "mandatory-1", "optional-2"])?.id).toBe(
      "optional-2",
    );
  });

  it("finds the earliest pending mandatory battle before a target encounter", () => {
    const encounters = [
      { id: "a", order: 1, mandatory: true },
      { id: "b", order: 2, mandatory: false },
      { id: "c", order: 3, mandatory: true },
      { id: "d", order: 4, mandatory: false },
    ] as const;

    expect(getPendingMandatoryBeforeEncounter(encounters as never, [], "d")?.id).toBe("a");
    expect(getPendingMandatoryBeforeEncounter(encounters as never, ["a"], "d")?.id).toBe("c");
    expect(getPendingMandatoryBeforeEncounter(encounters as never, ["a", "c"], "d")).toBeNull();
    expect(getPendingMandatoryBeforeEncounter(encounters as never, [], "missing")).toBeNull();
  });

  it("maps encounter order to the expected milestone buckets", () => {
    expect(mapEncounterOrderToMilestoneId(1)).toBe("opening");
    expect(mapEncounterOrderToMilestoneId(5)).toBe("floccesy");
    expect(mapEncounterOrderToMilestoneId(9)).toBe("virbank");
    expect(mapEncounterOrderToMilestoneId(13)).toBe("castelia");
    expect(mapEncounterOrderToMilestoneId(17)).toBe("driftveil");
    expect(mapEncounterOrderToMilestoneId(22)).toBe("mistralton");
    expect(mapEncounterOrderToMilestoneId(27)).toBe("undella");
    expect(mapEncounterOrderToMilestoneId(34)).toBe("humilau");
    expect(mapEncounterOrderToMilestoneId(40)).toBe("league");
    expect(mapEncounterOrderToMilestoneId(41)).toBe("postgame");
  });

  it("returns the right source areas for each progression band", () => {
    expect(getContextualSourceAreas(2)).toEqual(["Aspertia City", "Route 19"]);
    expect(getContextualSourceAreas(5)).toEqual([
      "Aspertia City",
      "Route 19",
      "Route 20 - Spring",
      "Floccesy Ranch",
      "Floccesy Town",
    ]);
    expect(getContextualSourceAreas(7)).toEqual([
      "Aspertia City",
      "Route 19",
      "Route 20 - Spring",
      "Floccesy Ranch",
      "Floccesy Town",
      "Virbank City",
      "Virbank Complex - Outside",
      "Virbank Complex - Inside",
    ]);
    expect(getContextualSourceAreas(8)).toEqual([
      "Aspertia City",
      "Route 19",
      "Route 20 - Spring",
      "Floccesy Ranch",
      "Floccesy Town",
      "Virbank City",
      "Virbank Complex - Outside",
      "Virbank Complex - Inside",
    ]);
    expect(getContextualSourceAreas(12)).toEqual([
      "Aspertia City",
      "Route 19",
      "Route 20 - Spring",
      "Floccesy Ranch",
      "Floccesy Town",
      "Virbank City",
      "Virbank Complex - Outside",
      "Virbank Complex - Inside",
      "Castelia City",
      "Castelia Sewers",
      "Relic Passage - Castelia",
      "Route 4",
    ]);
    expect(getContextualSourceAreas(15)).toContain("Chargestone Cave");
    expect(getContextualSourceAreas(21)).toContain("Seaside Cave - Lower Floor");
    expect(getContextualSourceAreas(25)).toContain("Giants Chasm - Plasma Airship Area");
    expect(getContextualSourceAreas(33)).toContain("Victory Road - Lower Mountainside");
    expect(getContextualSourceAreas(42)).toContain("Pinwheel Forest - Inside");
    expect(getContextualSourceAreas(42)).toContain("P2 Laboratory");
    expect(getContextualSourceAreas(42)).toContain("Route 19");
    expect(getContextualSourceAreas(42)).toContain("Chargestone Cave");
  });

  it("resolves seasonal source areas from the active season instead of using a score bonus", () => {
    expect(getContextualSourceAreas(5, "winter")).toEqual([
      "Aspertia City",
      "Route 19",
      "Route 20 - Winter",
      "Floccesy Ranch",
      "Floccesy Town",
    ]);
    expect(getContextualSourceAreas(17, "winter")).toContain("Route 6 - Winter");
    expect(getContextualSourceAreas(17, "summer")).toContain("Route 6 - Spring, Summer, Autumn");
  });

  it("prefers the furthest milestone when store progress is ahead of the next unresolved battle", () => {
    expect(getFurthestMilestoneId("castelia", "driftveil")).toBe("driftveil");
    expect(getFurthestMilestoneId("humilau", "castelia")).toBe("humilau");
  });
});
