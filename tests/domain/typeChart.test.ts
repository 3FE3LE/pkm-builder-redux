import { describe, expect, it } from "vitest";

import {
  getMultiplierBucket,
  getMultiplierLabel,
  getTypeEffectiveness,
  getTypeSurfaceStyle,
} from "../../lib/domain/typeChart";

describe("typeChart", () => {
  it("returns themed surface styles and fallback values for unknown types", () => {
    expect(getTypeSurfaceStyle("Fire")).toEqual(
      expect.objectContaining({
        backgroundColor: "var(--type-fire)",
        color: "var(--type-fire-text)",
      }),
    );

    expect(getTypeSurfaceStyle("???", "var(--surface-fallback)")).toEqual(
      expect.objectContaining({
        backgroundColor: "var(--surface-fallback)",
        color: "var(--text)",
      }),
    );
  });

  it("computes effectiveness and buckets across all threshold branches", () => {
    expect(getTypeEffectiveness("Fire", ["Grass", "Steel"])).toBe(4);
    expect(getTypeEffectiveness("Fire", ["Grass"])).toBe(2);
    expect(getTypeEffectiveness("Fire", ["Water"])).toBe(0.5);
    expect(getTypeEffectiveness("Fire", ["Water", "Dragon"])).toBe(0.25);
    expect(getTypeEffectiveness("Normal", ["Ghost"])).toBe(0);

    expect(getMultiplierBucket(4)).toBe("x4");
    expect(getMultiplierBucket(2)).toBe("x2");
    expect(getMultiplierBucket(1)).toBe("x1");
    expect(getMultiplierBucket(0.5)).toBe("x0.5");
    expect(getMultiplierBucket(0.25)).toBe("x0.25");
    expect(getMultiplierBucket(0)).toBe("x0");
  });

  it("maps multiplier buckets to localized labels", () => {
    expect(getMultiplierLabel("x4")).toBe("ultra efectivo");
    expect(getMultiplierLabel("x2")).toBe("super efectivo");
    expect(getMultiplierLabel("x1")).toBe("efectivo");
    expect(getMultiplierLabel("x0.5")).toBe("resistido");
    expect(getMultiplierLabel("x0.25")).toBe("muy resistido");
    expect(getMultiplierLabel("x0")).toBe("inmune");
  });
});
