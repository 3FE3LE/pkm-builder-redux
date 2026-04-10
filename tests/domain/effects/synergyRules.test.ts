import { describe, it, expect } from "vitest";
import { evaluateSynergies } from "@/lib/domain/effects/synergyRules";
import type { AbilityEffect, MoveEffect, ItemEffect } from "@/lib/domain/effects/types";

describe("evaluateSynergies", () => {
  it("matches invert-selfdrop for Contrary + Leaf Storm pattern", () => {
    const abilities: AbilityEffect[] = [{ kind: "invertStatChanges" }];
    const moves: MoveEffect[] = [
      { kind: "selfDropDamage", category: "special", powerBand: 4, droppedStat: "spa", stages: -2 },
      { kind: "damage", category: "special", powerBand: 3 },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const snowball = result.find((r) => r.tag === "snowball");
    expect(snowball).toBeDefined();
    expect(snowball!.score).toBe(5.6);
    // Dedup: should NOT also include "invert-base" (1.4)
    expect(result.find((r) => r.ruleId === "invert-base")).toBeUndefined();
  });

  it("matches invert-base when Contrary has no self-drop moves", () => {
    const abilities: AbilityEffect[] = [{ kind: "invertStatChanges" }];
    const moves: MoveEffect[] = [
      { kind: "damage", category: "special", powerBand: 3 },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const base = result.find((r) => r.ruleId === "invert-base");
    expect(base).toBeDefined();
    expect(base!.score).toBe(1.4);
  });

  it("matches autospeed-protect for Speed Boost + Protect pattern", () => {
    const abilities: AbilityEffect[] = [{ kind: "autoSpeedBoost" }];
    const moves: MoveEffect[] = [
      { kind: "protection" },
      { kind: "damage", category: "physical", powerBand: 3 },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const speedSnowball = result.find((r) => r.tag === "speed-snowball");
    expect(speedSnowball).toBeDefined();
    expect(speedSnowball!.score).toBe(4.0);
    expect(result.find((r) => r.ruleId === "autospeed-base")).toBeUndefined();
  });

  it("matches lowpower-spike when Technician has 2+ priority moves", () => {
    const abilities: AbilityEffect[] = [{ kind: "lowPowerAmplify", threshold: 60 }];
    const moves: MoveEffect[] = [
      { kind: "priority", value: 1, category: "physical" },
      { kind: "priority", value: 1, category: "physical" },
      { kind: "damage", category: "physical", powerBand: 3 },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const spike = result.find((r) => r.tag === "tech-spike");
    expect(spike).toBeDefined();
    expect(spike!.score).toBe(2.8);
  });

  it("falls back to lowpower-base when Technician has only 1 priority move", () => {
    const abilities: AbilityEffect[] = [{ kind: "lowPowerAmplify", threshold: 60 }];
    const moves: MoveEffect[] = [
      { kind: "priority", value: 1, category: "physical" },
      { kind: "damage", category: "physical", powerBand: 3 },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const base = result.find((r) => r.tag === "tech-passive");
    expect(base).toBeDefined();
    expect(base!.score).toBe(1.2);
  });

  it("matches priostatus-control for Prankster + status moves", () => {
    const abilities: AbilityEffect[] = [{ kind: "priorityOnStatus" }];
    const moves: MoveEffect[] = [
      { kind: "status", inflicts: "paralysis" },
      { kind: "screen", defense: "physical" },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const control = result.find((r) => r.tag === "priority-control");
    expect(control).toBeDefined();
    expect(control!.score).toBe(2.6);
  });

  it("matches offmult-base for Huge Power / Pure Power", () => {
    const abilities: AbilityEffect[] = [
      { kind: "offensiveMultiplier", stat: "atk", factor: 2 },
    ];
    const result = evaluateSynergies(abilities, [], []);

    const power = result.find((r) => r.tag === "raw-power");
    expect(power).toBeDefined();
    expect(power!.score).toBe(3.6);
  });

  it("matches statuspow-facade for Guts + Facade pattern", () => {
    const abilities: AbilityEffect[] = [{ kind: "statusPowerUp", stat: "atk" }];
    const moves: MoveEffect[] = [
      { kind: "statusBoostedDamage", category: "physical", powerBand: 3 },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const wallbreak = result.find((r) => r.tag === "status-wallbreak");
    expect(wallbreak).toBeDefined();
    expect(wallbreak!.score).toBe(2.8);
  });

  it("matches regen-pivot for Regenerator + pivot move", () => {
    const abilities: AbilityEffect[] = [{ kind: "pivotRecovery", fraction: 1 / 3 }];
    const moves: MoveEffect[] = [
      { kind: "pivot", category: "physical" },
      { kind: "damage", category: "physical", powerBand: 3 },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    const pivot = result.find((r) => r.tag === "sustainable-pivot");
    expect(pivot).toBeDefined();
    expect(pivot!.score).toBe(2.1);
  });

  it("matches sheerforce-lifeorb when both effects are present", () => {
    const abilities: AbilityEffect[] = [{ kind: "sheerForce" }];
    const items: ItemEffect[] = [{ kind: "lifeOrb" }];
    const result = evaluateSynergies(abilities, [], items);

    const forceOrb = result.find((r) => r.tag === "force-orb");
    expect(forceOrb).toBeDefined();
    expect(forceOrb!.score).toBe(2.4);
  });

  it("matches setup-priority for move-only synergy", () => {
    const moves: MoveEffect[] = [
      { kind: "setup", stat: "atk", stages: 2 },
      { kind: "priority", value: 1, category: "physical" },
    ];
    const result = evaluateSynergies([], moves, []);

    const setupClose = result.find((r) => r.tag === "setup-close");
    expect(setupClose).toBeDefined();
    expect(setupClose!.score).toBe(1.4);
  });

  it("matches hazard-phaze for hazard + anti-setup", () => {
    const moves: MoveEffect[] = [
      { kind: "hazard", layer: "stealthRock" },
      { kind: "antiSetup", method: "whirlwind" },
    ];
    const result = evaluateSynergies([], moves, []);

    const hazStack = result.find((r) => r.tag === "hazard-stack");
    expect(hazStack).toBeDefined();
    expect(hazStack!.score).toBe(1.2);
  });

  it("returns empty when no effects match any rule", () => {
    const abilities: AbilityEffect[] = [{ kind: "other", tag: "uninteresting" }];
    const moves: MoveEffect[] = [
      { kind: "damage", category: "physical", powerBand: 2 },
    ];
    const result = evaluateSynergies(abilities, moves, []);
    expect(result.length).toBe(0);
  });

  it("can match multiple independent synergies", () => {
    const abilities: AbilityEffect[] = [{ kind: "pivotRecovery", fraction: 1 / 3 }];
    const moves: MoveEffect[] = [
      { kind: "pivot", category: "physical" },
      { kind: "hazard", layer: "stealthRock" },
      { kind: "antiSetup", method: "whirlwind" },
    ];
    const result = evaluateSynergies(abilities, moves, []);

    expect(result.find((r) => r.tag === "sustainable-pivot")).toBeDefined();
    expect(result.find((r) => r.tag === "hazard-stack")).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});
