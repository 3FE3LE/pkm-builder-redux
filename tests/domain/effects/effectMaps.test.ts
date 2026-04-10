import { describe, it, expect } from "vitest";
import { resolveAbilityEffects } from "@/lib/domain/effects/abilityMap";
import { resolveMoveEffects, resolveAllMoveEffects } from "@/lib/domain/effects/moveMap";
import { resolveItemEffects } from "@/lib/domain/effects/itemMap";

describe("resolveAbilityEffects", () => {
  it("resolves Contrary to invertStatChanges", () => {
    const effects = resolveAbilityEffects("Contrary", []);
    expect(effects).toEqual([{ kind: "invertStatChanges" }]);
  });

  it("resolves Huge Power to offensiveMultiplier", () => {
    const effects = resolveAbilityEffects("Huge Power", []);
    expect(effects[0]).toMatchObject({ kind: "offensiveMultiplier", stat: "atk", factor: 2 });
  });

  it("resolves from ability pool when active ability has no entry", () => {
    const effects = resolveAbilityEffects("Overgrow", ["Contrary"]);
    expect(effects).toEqual([{ kind: "invertStatChanges" }]);
  });

  it("returns empty for unknown abilities", () => {
    const effects = resolveAbilityEffects("Run Away", []);
    expect(effects).toEqual([]);
  });

  it("handles null ability gracefully", () => {
    const effects = resolveAbilityEffects(null, null);
    expect(effects).toEqual([]);
  });

  it("normalizes casing and spacing", () => {
    const effects = resolveAbilityEffects("speed boost", []);
    expect(effects[0]).toMatchObject({ kind: "autoSpeedBoost" });
  });

  it("resolves Levitate to Ground immunity", () => {
    const effects = resolveAbilityEffects("Levitate", []);
    expect(effects[0]).toMatchObject({ kind: "immunity", immuneTo: ["Ground"] });
  });

  it("resolves Flash Fire to type nullify with boost", () => {
    const effects = resolveAbilityEffects("Flash Fire", []);
    expect(effects[0]).toMatchObject({
      kind: "typeNullify",
      absorbType: "Fire",
      grants: "boost",
    });
  });
});

describe("resolveMoveEffects", () => {
  it("resolves Leaf Storm to selfDropDamage", () => {
    const effects = resolveMoveEffects("Leaf Storm", { damageClass: "special", power: 130 });
    expect(effects[0]).toMatchObject({
      kind: "selfDropDamage",
      category: "special",
      powerBand: 4,
    });
  });

  it("resolves U-turn to pivot", () => {
    const effects = resolveMoveEffects("U-turn", { damageClass: "physical", power: 70 });
    expect(effects[0]).toMatchObject({ kind: "pivot", category: "physical" });
  });

  it("resolves Swords Dance to setup", () => {
    const effects = resolveMoveEffects("Swords Dance", { damageClass: "status" });
    expect(effects[0]).toMatchObject({ kind: "setup", stat: "atk", stages: 2 });
  });

  it("auto-classifies unknown physical moves from data", () => {
    const effects = resolveMoveEffects("Crunch", { damageClass: "physical", power: 80 });
    expect(effects[0]).toMatchObject({ kind: "damage", category: "physical", powerBand: 3 });
  });

  it("auto-classifies high-power special moves", () => {
    const effects = resolveMoveEffects("Flamethrower", { damageClass: "special", power: 90 });
    expect(effects[0]).toMatchObject({ kind: "damage", category: "special", powerBand: 4 });
  });

  it("returns empty for unknown status moves without override", () => {
    const effects = resolveMoveEffects("Growl", { damageClass: "status" });
    expect(effects).toEqual([]);
  });

  it("returns empty when no move data provided", () => {
    const effects = resolveMoveEffects("Unknown Move", undefined);
    expect(effects).toEqual([]);
  });

  it("resolves Thunder Wave to both speedControl and status", () => {
    const effects = resolveMoveEffects("Thunder Wave", { damageClass: "status" });
    expect(effects.length).toBe(2);
    expect(effects.find((e) => e.kind === "speedControl")).toBeDefined();
    expect(effects.find((e) => e.kind === "status")).toBeDefined();
  });

  it("resolves Stealth Rock to hazard", () => {
    const effects = resolveMoveEffects("Stealth Rock", { damageClass: "status" });
    expect(effects[0]).toMatchObject({ kind: "hazard", layer: "stealthRock" });
  });

  it("resolves Protect to protection", () => {
    const effects = resolveMoveEffects("Protect", { damageClass: "status" });
    expect(effects[0]).toMatchObject({ kind: "protection" });
  });
});

describe("resolveAllMoveEffects", () => {
  it("resolves multiple moves and collects all effects", () => {
    const moves = [
      { name: "Leaf Storm", damageClass: "special" as const, power: 130 },
      { name: "Giga Drain", damageClass: "special" as const, power: 75 },
      { name: "Coil", damageClass: "status" as const, power: null },
    ];
    const effects = resolveAllMoveEffects(moves);

    expect(effects.some((e) => e.kind === "selfDropDamage")).toBe(true);
    expect(effects.some((e) => e.kind === "draining")).toBe(true);
    expect(effects.some((e) => e.kind === "setup")).toBe(true);
  });
});

describe("resolveItemEffects", () => {
  it("resolves Choice Band", () => {
    const effects = resolveItemEffects("Choice Band");
    expect(effects[0]).toMatchObject({ kind: "choiceLock", stat: "atk", factor: 1.5 });
  });

  it("resolves Life Orb", () => {
    const effects = resolveItemEffects("Life Orb");
    expect(effects[0]).toMatchObject({ kind: "lifeOrb" });
  });

  it("resolves Flame Orb to statusOrb", () => {
    const effects = resolveItemEffects("Flame Orb");
    expect(effects[0]).toMatchObject({ kind: "statusOrb", inflicts: "burn" });
  });

  it("returns empty for null item", () => {
    expect(resolveItemEffects(null)).toEqual([]);
  });

  it("returns empty for unknown item", () => {
    expect(resolveItemEffects("Potion")).toEqual([]);
  });
});
