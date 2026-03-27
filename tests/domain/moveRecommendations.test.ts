import { describe, expect, it } from "vitest";

import { getMoveRecommendations } from "../../lib/domain/moveRecommendations";

describe("getMoveRecommendations", () => {
  it("returns an empty list when the member has no learnsets", () => {
    expect(
      getMoveRecommendations({
        member: {
          resolvedTypes: ["Grass"],
          moves: [],
        },
        uncoveredTypes: ["Water"],
      }),
    ).toEqual([]);
  });

  it("filters current and overleveled moves, then keeps the best duplicate entry", () => {
    const recommendations = getMoveRecommendations({
      member: {
        resolvedTypes: ["Electric"],
        level: 20,
        effectiveStats: { atk: 45, spa: 85, def: 50, spd: 60 },
        moves: [{ name: "Thunder Shock" }],
        learnsets: {
          levelUp: [
            {
              level: 19,
              move: "Shock Wave",
              details: { type: "Electric", damageClass: "special", power: 60, accuracy: 100 },
            },
            {
              level: 30,
              move: "Thunderbolt",
              details: { type: "Electric", damageClass: "special", power: 90, accuracy: 100 },
            },
          ],
          machines: [
            {
              source: "TM24",
              move: "Shock Wave",
              details: { type: "Electric", damageClass: "special", power: 90, accuracy: 100 },
            },
          ],
        },
      },
      uncoveredTypes: ["Water"],
      maxLevelDelta: 5,
    });

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]).toEqual(
      expect.objectContaining({
        move: "Shock Wave",
        source: "TM24",
        adjustedPower: 90,
      }),
    );
  });

  it("scores attacking moves by stab, preferred attacking stat, coverage, and power", () => {
    const [recommendation] = getMoveRecommendations({
      member: {
        resolvedTypes: ["Fire"],
        effectiveStats: { atk: 105, spa: 70, def: 70, spd: 70 },
        moves: [],
        learnsets: {
          levelUp: [
            {
              level: 1,
              move: "Flare Blitz",
              details: {
                type: "Fire",
                damageClass: "physical",
                power: 120,
                accuracy: 100,
                description: "A reckless charge attack that may inflict recoil damage.",
              },
            },
          ],
          machines: [],
        },
      },
      uncoveredTypes: ["Grass", "Steel", "Water", "Bug"],
    });

    expect(recommendation).toEqual(
      expect.objectContaining({
        move: "Flare Blitz",
        type: "Fire",
        damageClass: "physical",
      }),
    );
    expect(recommendation.reasons).toContain("STAB");
    expect(recommendation.reasons).toContain("fits Atk");
    expect(recommendation.reasons).toContain("covers Grass / Steel");
    expect(recommendation.reasons).toContain("high power");
    expect(recommendation.score).toBeGreaterThan(80);
  });

  it("labels status moves as utility when they have no stronger selling point", () => {
    const [recommendation] = getMoveRecommendations({
      member: {
        resolvedTypes: ["Grass"],
        effectiveStats: { atk: 60, spa: 60, def: 60, spd: 60 },
        moves: [],
        learnsets: {
          levelUp: [
            {
              level: 1,
              move: "Toxic",
              details: { type: "Poison", damageClass: "status", power: null, accuracy: 90 },
            },
          ],
          machines: [],
        },
      },
      uncoveredTypes: [],
    });

    expect(recommendation.reasons).toEqual(["utility"]);
    expect(recommendation.score).toBe(-18);
  });

  it("applies weather and power modifiers before ranking recommendations", () => {
    const recommendations = getMoveRecommendations({
      member: {
        resolvedTypes: ["Water"],
        item: "MysticWater",
        ability: "Technician",
        effectiveStats: { atk: 70, spa: 95, def: 70, spd: 70 },
        moves: [],
        learnsets: {
          levelUp: [
            {
              level: 1,
              move: "Weather Ball",
              details: { type: "Normal", damageClass: "special", power: 50, accuracy: 100 },
            },
            {
              level: 1,
              move: "Swift",
              details: { type: "Normal", damageClass: "special", power: 60, accuracy: 100 },
            },
          ],
          machines: [],
        },
      },
      uncoveredTypes: ["Ground", "Rock", "Fire"],
      weather: "rain",
    });

    expect(recommendations[0]).toEqual(
      expect.objectContaining({
        move: "Swift",
        adjustedPower: 90,
      }),
    );
    expect(recommendations).toContainEqual(
      expect.objectContaining({
        move: "Weather Ball",
        type: "Water",
        power: 100,
        adjustedPower: 90,
      }),
    );
    const weatherBall = recommendations.find((entry) => entry.move === "Weather Ball");
    expect(weatherBall?.reasons).toContain("fits SpA");
  });
});
