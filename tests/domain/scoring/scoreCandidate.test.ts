import { describe, it, expect } from "vitest";
import { buildPokemonProfile } from "@/lib/domain/profiles/buildPokemonProfile";
import { buildTeamSnapshot } from "@/lib/domain/profiles/buildTeamSnapshot";
import { scoreCandidate, scoreCandidates } from "@/lib/domain/scoring/scoreCandidate";
import { buildScoreExplanation } from "@/lib/domain/scoring/explainScore";
import type { CheckpointProfile, ScoringPreferences } from "@/lib/domain/profiles/types";

const PREFS: ScoringPreferences = {
  preferReduxUpgrades: false,
  excludeExactTypeDuplicates: false,
  excludeLegendaries: false,
  excludePseudoLegendaries: false,
  playstyle: "balanced",
  favoriteTypes: [],
  avoidedTypes: [],
  preferredRoles: [],
};

const CASTELIA_CHECKPOINT: CheckpointProfile = {
  id: "castelia",
  label: "Castelia",
  preferredCoverage: ["Electric", "Flying", "Water", "Ground"],
  preferredResists: ["Normal", "Fighting"],
  speedPressure: "high",
  speedThreshold: 105,
  projectedLevel: 30,
};

function makeSerperiorProfile() {
  return buildPokemonProfile({
    id: "serperior",
    name: "Serperior",
    types: ["Grass"],
    stats: { hp: 75, atk: 75, def: 95, spa: 75, spd: 95, spe: 113, bst: 528 },
    ability: "Contrary",
    abilities: ["Overgrow", "Contrary"],
    moves: [
      { name: "Leaf Storm", type: "Grass", damageClass: "special", power: 130 },
      { name: "Giga Drain", type: "Grass", damageClass: "special", power: 75 },
      { name: "Coil", type: "Normal", damageClass: "status", power: null },
      { name: "Slam", type: "Normal", damageClass: "physical", power: 80 },
    ],
    reduxFlags: { hasTypeChanges: false, hasAbilityChanges: true, hasStatChanges: false },
  });
}

function makeLucarioProfile() {
  return buildPokemonProfile({
    id: "lucario",
    name: "Lucario",
    types: ["Fighting", "Steel"],
    stats: { hp: 70, atk: 110, def: 70, spa: 115, spd: 70, spe: 90, bst: 525 },
    ability: "Inner Focus",
    abilities: ["Steadfast", "Inner Focus", "Justified"],
    moves: [
      { name: "Close Combat", type: "Fighting", damageClass: "physical", power: 120 },
      { name: "Flash Cannon", type: "Steel", damageClass: "special", power: 80 },
      { name: "Swords Dance", type: "Normal", damageClass: "status", power: null },
      { name: "Extreme Speed", type: "Normal", damageClass: "physical", power: 80 },
    ],
  });
}

function makeMareepProfile() {
  return buildPokemonProfile({
    id: "mareep",
    name: "Mareep",
    types: ["Electric"],
    stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35, bst: 280 },
    ability: "Static",
    abilities: ["Static"],
    moves: [
      { name: "Thundershock", type: "Electric", damageClass: "special", power: 40 },
      { name: "Thunder Wave", type: "Electric", damageClass: "status", power: null },
    ],
    terminalTypes: ["Electric"],
    terminalStats: { hp: 90, atk: 75, def: 85, spa: 115, spd: 90, spe: 55, bst: 510 },
    terminalAbilities: ["Static"],
    terminalMoves: [
      { name: "Thunderbolt", type: "Electric", damageClass: "special", power: 90 },
      { name: "Power Gem", type: "Rock", damageClass: "special", power: 80 },
      { name: "Thunder Wave", type: "Electric", damageClass: "status", power: null },
      { name: "Cotton Guard", type: "Grass", damageClass: "status", power: null },
    ],
  });
}

function makeScizorProfile() {
  return buildPokemonProfile({
    id: "scizor",
    name: "Scizor",
    types: ["Bug", "Steel"],
    stats: { hp: 70, atk: 130, def: 100, spa: 55, spd: 80, spe: 65, bst: 500 },
    ability: "Technician",
    abilities: ["Swarm", "Technician", "Light Metal"],
    moves: [
      { name: "Bullet Punch", type: "Steel", damageClass: "physical", power: 40 },
      { name: "U-turn", type: "Bug", damageClass: "physical", power: 70 },
      { name: "Swords Dance", type: "Normal", damageClass: "status", power: null },
      { name: "Bug Bite", type: "Bug", damageClass: "physical", power: 60 },
    ],
  });
}

describe("buildPokemonProfile", () => {
  it("Serperior with Contrary gets high ceiling from synergy, not hardcoding", () => {
    const profile = makeSerperiorProfile();

    expect(profile.abilityEffects).toEqual([{ kind: "invertStatChanges" }]);
    expect(profile.synergies.some((s) => s.tag === "snowball")).toBe(true);
    expect(profile.ceilingScore).toBeGreaterThanOrEqual(8);
    expect(profile.floorScore).toBeLessThan(profile.ceilingScore);
    expect(profile.volatility).toBeGreaterThanOrEqual(2);
  });

  it("Scizor with Technician + Bullet Punch + Swords Dance gets tech-spike or setup-close", () => {
    const profile = makeScizorProfile();

    expect(profile.abilityEffects.some((e) => e.kind === "lowPowerAmplify")).toBe(true);
    expect(profile.ceilingScore).toBeGreaterThan(4);
    expect(profile.primaryRole).toBeDefined();
  });

  it("Lucario with Close Combat gets selfDropDamage move effect", () => {
    const profile = makeLucarioProfile();

    expect(profile.moveEffects.some((e) => e.kind === "selfDropDamage")).toBe(true);
    expect(profile.moveEffects.some((e) => e.kind === "setup")).toBe(true);
    expect(profile.moveEffects.some((e) => e.kind === "priority")).toBe(true);
  });

  it("Mareep gets evolution growth from terminal stats", () => {
    const profile = makeMareepProfile();

    expect(profile.evolutionGrowth).toBeGreaterThan(0);
    expect(profile.terminalStats).toBeDefined();
    expect(profile.terminalStats!.bst).toBeGreaterThan(profile.stats.bst);
  });

  it("computes redux score from flags", () => {
    const profile = makeSerperiorProfile();
    expect(profile.reduxScore).toBe(2); // hasAbilityChanges only
  });
});

describe("buildTeamSnapshot", () => {
  it("identifies uncovered and unresisted types", () => {
    const team = buildTeamSnapshot([makeLucarioProfile(), makeMareepProfile()]);

    expect(team.size).toBe(2);
    expect(team.uncoveredTypes.length).toBeGreaterThan(0);
    expect(team.unresistedTypes.length).toBeGreaterThan(0);
  });

  it("detects missing and filled roles", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);

    expect(team.filledRoles.size).toBeGreaterThan(0);
    expect(team.missingRoles.length).toBeGreaterThan(0);
  });

  it("computes phys/spec balance", () => {
    const team = buildTeamSnapshot([
      makeLucarioProfile(),
      makeMareepProfile(),
    ]);

    expect(typeof team.physSpecBalance).toBe("number");
    expect(team.physSpecBalance).toBeGreaterThanOrEqual(-1);
    expect(team.physSpecBalance).toBeLessThanOrEqual(1);
  });

  it("collects type signatures for duplicate detection", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    expect(team.typeSignatures.has("Fighting|Steel")).toBe(true);
  });
});

describe("scoreCandidate", () => {
  it("Serperior scores well on a team lacking Grass coverage", () => {
    const team = buildTeamSnapshot([makeLucarioProfile(), makeMareepProfile()]);
    const score = scoreCandidate(
      makeSerperiorProfile(),
      team,
      null,
      CASTELIA_CHECKPOINT,
      PREFS,
    );

    expect(score.finalScore).toBeGreaterThan(40);
    expect(score.breakdown.powerCeiling.raw).toBeGreaterThan(60);
    expect(score.verdict).not.toBe("weak");
    expect(score.topSignals.length).toBeGreaterThan(0);
  });

  it("penalizes type duplicates on the team", () => {
    const lucario1 = makeLucarioProfile();
    const lucario2 = { ...makeLucarioProfile(), id: "lucario2", name: "Lucario2" };
    const team = buildTeamSnapshot([lucario1]);

    const score = scoreCandidate(lucario2, team, null, CASTELIA_CHECKPOINT, PREFS);
    expect(score.breakdown.teamImpact.signals).toContainEqual(
      expect.stringContaining("duplicado"),
    );
  });

  it("rewards filling a missing role", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    // Mareep should fill some missing role
    const score = scoreCandidate(makeMareepProfile(), team, null, CASTELIA_CHECKPOINT, PREFS);

    // Should have some positive team impact
    expect(score.breakdown.teamImpact.raw).toBeGreaterThan(20);
  });

  it("stability floor reflects Serperior volatility", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    const score = scoreCandidate(makeSerperiorProfile(), team, null, CASTELIA_CHECKPOINT, PREFS);

    // Serperior has moderate floor due to frailty + setup dependency
    expect(score.breakdown.stabilityFloor.raw).toBeLessThan(80);
    expect(score.breakdown.stabilityFloor.raw).toBeGreaterThan(20);
  });

  it("redux value reflects ability changes", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    const score = scoreCandidate(makeSerperiorProfile(), team, null, CASTELIA_CHECKPOINT, PREFS);

    expect(score.breakdown.reduxValue.raw).toBeGreaterThan(0);
  });

  it("changes preference affinity for favorite versus avoided types", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    const liked = scoreCandidate(makeSerperiorProfile(), team, null, CASTELIA_CHECKPOINT, {
      ...PREFS,
      favoriteTypes: ["Grass"],
    });
    const avoided = scoreCandidate(makeSerperiorProfile(), team, null, CASTELIA_CHECKPOINT, {
      ...PREFS,
      avoidedTypes: ["Grass"],
    });

    expect(liked.breakdown.preferenceAffinity.raw).toBeGreaterThan(avoided.breakdown.preferenceAffinity.raw);
  });

  it("applies role and season boosts when they match the candidate", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    const boosted = scoreCandidate(makeSerperiorProfile(), team, null, CASTELIA_CHECKPOINT, {
      ...PREFS,
      preferredRoles: ["support"],
      currentSeason: "spring",
    });

    expect(boosted.breakdown.preferenceAffinity.raw).toBeGreaterThan(50);
  });
});

describe("scoreCandidates", () => {
  it("ranks candidates by finalScore descending", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    const candidates = [
      makeSerperiorProfile(),
      makeMareepProfile(),
      makeScizorProfile(),
    ];
    const scores = scoreCandidates(candidates, team, null, CASTELIA_CHECKPOINT, PREFS);

    expect(scores[0].rank).toBe(1);
    expect(scores[1].rank).toBe(2);
    expect(scores[2].rank).toBe(3);
    expect(scores[0].finalScore).toBeGreaterThanOrEqual(scores[1].finalScore);
    expect(scores[1].finalScore).toBeGreaterThanOrEqual(scores[2].finalScore);
  });
});

describe("buildScoreExplanation", () => {
  it("produces a non-empty explanation string", () => {
    const team = buildTeamSnapshot([makeLucarioProfile()]);
    const score = scoreCandidate(makeSerperiorProfile(), team, null, CASTELIA_CHECKPOINT, PREFS);
    const explanation = buildScoreExplanation(score);

    expect(explanation.length).toBeGreaterThan(0);
    expect(explanation).toContain("(");
    // Should contain verdict label
    expect(
      explanation.includes("Excelente") ||
      explanation.includes("sólida") ||
      explanation.includes("situacional") ||
      explanation.includes("limitada"),
    ).toBe(true);
  });
});
