import { describe, expect, it } from "vitest";

import { buildMemberLens } from "../../lib/domain/memberLens";
import type { ResolvedTeamMember } from "../../lib/teamAnalysis";

function buildMember(overrides: Partial<ResolvedTeamMember> = {}): ResolvedTeamMember {
  return {
    key: "slot-1",
    species: "Serperior",
    supportsGender: true,
    resolvedTypes: ["Grass"],
    abilities: ["Overgrow"],
    ability: "Overgrow",
    nature: "Timid",
    item: "",
    effectiveStats: {
      hp: 75,
      atk: 75,
      def: 95,
      spa: 95,
      spd: 95,
      spe: 113,
      bst: 548,
    },
    summaryStats: {
      hp: 75,
      atk: 75,
      def: 95,
      spa: 95,
      spd: 95,
      spe: 113,
      bst: 548,
    },
    resolvedStats: {
      hp: 75,
      atk: 75,
      def: 95,
      spa: 95,
      spd: 95,
      spe: 113,
      bst: 548,
    },
    moves: [],
    ...overrides,
  };
}

describe("buildMemberLens", () => {
  it("returns the pending-slot fallback when the member is missing", () => {
    const result = buildMemberLens(undefined);

    expect(result.role).toBe("sin lectura");
    expect(result.tags).toEqual(["slot pendiente"]);
    expect(result.axes).toEqual({
      pressure: 0,
      utility: 0,
      setup: 0,
      pivot: 0,
      sustain: 0,
      speedControl: 0,
    });
  });

  it("classifies a support-heavy utility slot and aggregates support needs uniquely", () => {
    const result = buildMemberLens(
      buildMember({
        species: "Whimsicott",
        resolvedTypes: ["Grass", "Fairy"],
        item: "",
        moves: [
          { name: "Reflect", damageClass: "status" },
          { name: "Leech Seed", damageClass: "status" },
          { name: "Thunder Wave", damageClass: "status" },
          { name: "Taunt", damageClass: "status" },
        ],
      }),
    );

    expect(result.role).toBe("support enabler");
    expect(result.axes.utility).toBeGreaterThanOrEqual(56);
    expect(result.supportNeeds).toContain("breaker o cleaner que capitalice los turnos que abre");
    expect(result.supportNeeds).toContain("switch-in o presión sólida contra Ice");
    expect(result.supportNeeds).toContain("respuesta estable a Fire o Bug");
  });

  it("identifies a setup win condition with pivot-dependent support requirements", () => {
    const result = buildMemberLens(
      buildMember({
        species: "Scrafty",
        resolvedTypes: ["Dark", "Fighting"],
        item: "Lum Berry",
        effectiveStats: {
          hp: 65,
          atk: 120,
          def: 115,
          spa: 45,
          spd: 115,
          spe: 58,
          bst: 518,
        },
        summaryStats: {
          hp: 65,
          atk: 120,
          def: 115,
          spa: 45,
          spd: 115,
          spe: 58,
          bst: 518,
        },
        moves: [
          { name: "Dragon Dance", damageClass: "status" },
          { name: "Bulk Up", damageClass: "status" },
          { name: "Drain Punch", damageClass: "physical", power: 75, adjustedPower: 75, hasStab: true },
          { name: "Crunch", damageClass: "physical", power: 80, adjustedPower: 80, hasStab: true },
          { name: "Mach Punch", damageClass: "physical", power: 40, adjustedPower: 40, hasStab: true },
        ],
      }),
    );

    expect(result.role).toBe("setup wincon");
    expect(result.supportNeeds).toContain("pivots que le den entrada segura");
    expect(result.supportNeeds).toContain("soporte para debilitar checks antes del sweep");
    expect(result.supportNeeds).not.toContain("speed control secundario");
  });

  it("prefers tempo pivot over raw pressure when the kit enables initiative", () => {
    const result = buildMemberLens(
      buildMember({
        species: "Mienshao",
        item: "Life Orb",
        effectiveStats: {
          hp: 65,
          atk: 125,
          def: 60,
          spa: 95,
          spd: 60,
          spe: 122,
          bst: 527,
        },
        summaryStats: {
          hp: 65,
          atk: 125,
          def: 60,
          spa: 95,
          spd: 60,
          spe: 122,
          bst: 527,
        },
        moves: [
          { name: "U Turn", damageClass: "physical", power: 70, adjustedPower: 70 },
          { name: "Knock Off", damageClass: "physical", power: 65, adjustedPower: 65 },
          { name: "High Jump Kick", damageClass: "physical", power: 130, adjustedPower: 130, hasStab: true },
          { name: "Stone Edge", damageClass: "physical", power: 100, adjustedPower: 100 },
        ],
      }),
    );

    expect(result.role).toBe("tempo pivot");
    expect(result.axes.pivot).toBeGreaterThanOrEqual(58);
    expect(result.supportNeeds).toContain("compañero que aproveche los cambios forzados");
  });

  it("classifies a heavy attacker as a primary breaker", () => {
    const result = buildMemberLens(
      buildMember({
        species: "Darmanitan",
        resolvedTypes: ["Fire"],
        item: "Choice Band",
        effectiveStats: {
          hp: 105,
          atk: 160,
          def: 55,
          spa: 30,
          spd: 55,
          spe: 95,
          bst: 500,
        },
        summaryStats: {
          hp: 105,
          atk: 160,
          def: 55,
          spa: 30,
          spd: 55,
          spe: 95,
          bst: 500,
        },
        moves: [
          { name: "Flare Blitz", damageClass: "physical", power: 120, adjustedPower: 120, hasStab: true },
          { name: "Superpower", damageClass: "physical", power: 120, adjustedPower: 120 },
          { name: "Rock Slide", damageClass: "physical", power: 75, adjustedPower: 75 },
          { name: "Earthquake", damageClass: "physical", power: 100, adjustedPower: 100 },
        ],
      }),
    );

    expect(result.role).toBe("primary breaker");
    expect(result.axes.pressure).toBeGreaterThanOrEqual(65);
  });

  it("identifies speed control profiles and asks for secondary support when they are slow and lack priority", () => {
    const result = buildMemberLens(
      buildMember({
        species: "Porygon2",
        resolvedTypes: ["Normal"],
        item: "Eviolite",
        effectiveStats: {
          hp: 85,
          atk: 80,
          def: 90,
          spa: 105,
          spd: 95,
          spe: 60,
          bst: 515,
        },
        summaryStats: {
          hp: 85,
          atk: 80,
          def: 90,
          spa: 105,
          spd: 95,
          spe: 60,
          bst: 515,
        },
        moves: [
          { name: "Thunder Wave", damageClass: "status" },
          { name: "Icy Wind", damageClass: "status" },
          { name: "Electroweb", damageClass: "status" },
          { name: "Rock Tomb", damageClass: "status" },
        ],
      }),
    );

    expect(result.role).toBe("speed control");
    expect(result.supportNeeds).toContain("speed control secundario");
  });

  it("reads slow recovery-centric slots as bulky glue and flags underdefined passive sets", () => {
    const result = buildMemberLens(
      buildMember({
        species: "Umbreon",
        resolvedTypes: ["Dark"],
        item: "",
        effectiveStats: {
          hp: 95,
          atk: 65,
          def: 130,
          spa: 60,
          spd: 150,
          spe: 65,
          bst: 565,
        },
        summaryStats: {
          hp: 95,
          atk: 65,
          def: 130,
          spa: 60,
          spd: 150,
          spe: 65,
          bst: 565,
        },
        moves: [
          { name: "Recover", damageClass: "status" },
          { name: "Rest", damageClass: "status" },
          { name: "Wish", damageClass: "status" },
          { name: "Heal Bell", damageClass: "status" },
          { name: "Splash", damageClass: "status" },
        ],
      }),
    );

    expect(result.role).toBe("bulky glue");
    expect(result.supportNeeds).toContain("speed control secundario");
    expect(result.supportNeeds).toContain("item definido para cerrar su plan");
    expect(result.supportNeeds).toContain("movimientos que definan mejor su función");
  });
});
