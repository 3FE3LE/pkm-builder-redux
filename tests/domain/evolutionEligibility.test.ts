import { describe, expect, it } from "vitest";

import { buildEvolutionEligibility } from "../../lib/domain/evolutionEligibility";
import type { RemoteEvolutionDetail, ResolvedTeamMember } from "../../lib/teamAnalysis";

function buildMember(overrides: Partial<ResolvedTeamMember> = {}): ResolvedTeamMember {
  return {
    key: "riolu-1",
    species: "Riolu",
    supportsGender: true,
    resolvedTypes: ["Fighting"],
    resolvedStats: {
      hp: 40,
      atk: 70,
      def: 40,
      spa: 35,
      spd: 40,
      spe: 60,
      bst: 285,
    },
    summaryStats: {
      hp: 40,
      atk: 70,
      def: 40,
      spa: 35,
      spd: 40,
      spe: 60,
      bst: 285,
    },
    abilities: ["Steadfast"],
    moves: [],
    ...overrides,
  };
}

const READY_DAY = { ready: true, period: "day" as const, label: "día" };
const PREFER_ALL = { level: true, gender: true, timeOfDay: true };

describe("buildEvolutionEligibility", () => {
  it("returns an empty list when the member has no next evolutions", () => {
    expect(buildEvolutionEligibility(undefined, [], READY_DAY, PREFER_ALL)).toEqual([]);
    expect(buildEvolutionEligibility(buildMember({ nextEvolutions: [] }), [], READY_DAY, PREFER_ALL)).toEqual(
      [],
    );
  });

  it("treats an evolution as eligible when there is no matching detail entry", () => {
    const result = buildEvolutionEligibility(
      buildMember({
        nextEvolutions: ["Lucario"],
        evolutionDetails: [{ target: "Gallade", minLevel: 20 }],
      }),
      [],
      READY_DAY,
      PREFER_ALL,
    );

    expect(result).toEqual([{ species: "Lucario", eligible: true, reasons: [] }]);
  });

  it("marks the target as eligible when any evolution path passes", () => {
    const details: RemoteEvolutionDetail[] = [
      { target: "Lucario", minLevel: 40, timeOfDay: "night" },
      { target: "Lucario", minLevel: 20, timeOfDay: "day" },
    ];

    const result = buildEvolutionEligibility(
      buildMember({
        level: 24,
        nextEvolutions: ["Lucario"],
        evolutionDetails: details,
      }),
      [],
      READY_DAY,
      PREFER_ALL,
    );

    expect(result).toEqual([{ species: "Lucario", eligible: true, reasons: [] }]);
  });

  it("merges unique failure reasons across all blocked evolution paths", () => {
    const result = buildEvolutionEligibility(
      buildMember({
        level: 18,
        gender: "male",
        nextEvolutions: ["Lucario"],
        evolutionDetails: [
          { target: "lucario", minLevel: 30, timeOfDay: "night", gender: 1 },
          { target: "Lucario", minLevel: 30, relativePhysicalStats: 0 },
        ],
      }),
      [],
      READY_DAY,
      PREFER_ALL,
    );

    expect(result).toEqual([
      {
        species: "Lucario",
        eligible: false,
        reasons: [
          "Requiere Lv 30",
          "Requiere noche (ahora día)",
          "Requiere género hembra",
          "Requiere Atk = Def",
        ],
      },
    ]);
  });

  it("reports pending browser time and respects disabled preferences", () => {
    const result = buildEvolutionEligibility(
      buildMember({
        level: 10,
        gender: "male",
        nextEvolutions: ["Espeon"],
        evolutionDetails: [{ target: "Espeon", minLevel: 20, timeOfDay: "day", gender: 1 }],
      }),
      [],
      { ready: false, period: "night", label: "noche" },
      { level: false, gender: false, timeOfDay: true },
    );

    expect(result).toEqual([
      {
        species: "Espeon",
        eligible: false,
        reasons: ["Esperando la hora local del navegador"],
      },
    ]);
  });
});
