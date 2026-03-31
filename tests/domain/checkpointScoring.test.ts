import { describe, expect, it } from "vitest";

import { buildCheckpointRiskSnapshot } from "@/lib/domain/checkpointScoring";

describe("checkpointScoring", () => {
  it("uses speed tiers from typing summary instead of low-level effective speed", () => {
    const snapshot = buildCheckpointRiskSnapshot({
      checkpointId: "league",
      team: [
        buildMember("Rapidash", ["Fire"], 105),
        buildMember("Serperior", ["Grass"], 113),
        buildMember("Lucario", ["Fighting", "Steel"], 90),
        buildMember("Masquerain", ["Bug", "Flying"], 80, ["tailwind"]),
      ],
    });

    expect(snapshot.speed.score).toBeGreaterThan(0);
    expect(snapshot.speed.summary).toContain("speed tier 105");
    expect(snapshot.speed.summary).toContain("2 slots");
  });
});

function buildMember(
  species: string,
  resolvedTypes: string[],
  speed: number,
  moves: string[] = [],
) {
  return {
    species,
    resolvedTypes,
    resolvedStats: {
      hp: 80,
      atk: 80,
      def: 80,
      spa: 80,
      spd: 80,
      spe: speed,
      bst: 400 + speed,
    },
    summaryStats: {
      hp: 80,
      atk: 80,
      def: 80,
      spa: 80,
      spd: 80,
      spe: speed,
      bst: 400 + speed,
    },
    effectiveStats: {
      hp: 26,
      atk: 14,
      def: 14,
      spa: 14,
      spd: 14,
      spe: 12,
      bst: 94,
    },
    moves: moves.map((name) => ({
      name,
      damageClass: "status",
    })),
  };
}
