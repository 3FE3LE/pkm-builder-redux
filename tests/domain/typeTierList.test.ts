import { describe, expect, it } from "vitest";

import {
  buildTypeCoverageSummary,
  buildDefensiveTypeTierList,
  buildOffensiveTypeTierList,
  rankRosterByTyping,
} from "@/lib/domain/typeTierList";

describe("typeTierList", () => {
  it("ranks strong offensive typings above weak ones", () => {
    const offensive = buildOffensiveTypeTierList();
    const groundIce = offensive.find((entry) => entry.combo.label === "Ice / Ground");
    const normal = offensive.find((entry) => entry.combo.id === "normal");

    expect(groundIce).toBeDefined();
    expect(normal).toBeDefined();
    expect(groundIce!.score).toBeLessThanOrEqual(100);
    expect(normal!.score).toBeGreaterThanOrEqual(0);
    expect(groundIce!.score).toBeGreaterThan(normal!.score);
    expect(groundIce!.rank).toBeLessThan(normal!.rank);
  });

  it("ranks strong defensive typings above fragile ones", () => {
    const defensive = buildDefensiveTypeTierList();
    const steelFairy = defensive.find((entry) => entry.combo.id === "steel-fairy");
    const ice = defensive.find((entry) => entry.combo.id === "ice");

    expect(steelFairy).toBeDefined();
    expect(ice).toBeDefined();
    expect(steelFairy!.score).toBeLessThanOrEqual(100);
    expect(ice!.score).toBeGreaterThanOrEqual(0);
    expect(steelFairy!.score).toBeGreaterThan(ice!.score);
    expect(steelFairy!.rank).toBeLessThan(ice!.rank);
  });

  it("ranks roster members by their typing score", () => {
    const ranked = rankRosterByTyping([
      {
        key: "lucario",
        species: "Lucario",
        resolvedTypes: ["Fighting", "Steel"],
      },
      {
        key: "articuno",
        species: "Articuno",
        resolvedTypes: ["Ice", "Flying"],
      },
    ]);

    expect(ranked).toHaveLength(2);
    expect(ranked[0]?.species).toBe("Lucario");
    expect(ranked[0]!.offense.score).toBeLessThanOrEqual(100);
    expect(ranked[0]!.defense.score).toBeLessThanOrEqual(100);
    expect(ranked[0]!.overallScore).toBeGreaterThan(ranked[1]!.overallScore);
  });

  it("builds a coverage summary for a selected attacker and defender typing", () => {
    const summary = buildTypeCoverageSummary("Electric", ["Water", "Flying"]);

    expect(summary.multiplier).toBe(4);
    expect(summary.superEffectiveTargets).toBeGreaterThan(0);
    expect(summary.bestTargets.some((target) => target.label === "Water / Flying")).toBe(true);
  });
});
