import { describe, expect, it } from "vitest";

import { isHeldItem } from "@/lib/domain/items";

describe("isHeldItem", () => {
  it("includes type-enhancement items like Charcoal", () => {
    expect(
      isHeldItem({
        category: "Type Enhancement",
        effect: "Held: Fire-Type moves from holder do 20% more damage.",
      }),
    ).toBe(true);
  });

  it("includes species-specific held items even if effect text is terse", () => {
    expect(
      isHeldItem({
        category: "Species Specific",
        effect: "Doubles Cubone or Marowak's Attack.",
      }),
    ).toBe(true);
  });

  it("excludes non-held gameplay items", () => {
    expect(
      isHeldItem({
        category: "Gameplay",
        effect: "Ride quickly to travel around the region.",
      }),
    ).toBe(false);
  });
});
