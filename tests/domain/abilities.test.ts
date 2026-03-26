import { describe, expect, it } from "vitest";

import { reconcileAbilitySelection } from "../../lib/domain/abilities";

describe("reconcileAbilitySelection", () => {
  it("keeps the current ability when it is valid for the species", () => {
    expect(
      reconcileAbilitySelection("Inner Focus", ["Steadfast", "Inner Focus"]),
    ).toBe("Inner Focus");
  });

  it("falls back to the first valid ability when the current one is invalid", () => {
    expect(
      reconcileAbilitySelection("Prankster", ["Steadfast", "Inner Focus"]),
    ).toBe("Steadfast");
  });

  it("returns an empty string when the species has no available abilities", () => {
    expect(reconcileAbilitySelection("Prankster", [])).toBe("");
  });
});
