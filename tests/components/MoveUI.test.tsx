import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  MoveCueIcons,
  MovePowerBadge,
  MoveSlotSurface,
  getMoveProfileFit,
  getMoveStabStyle,
  getMoveSurfaceClass,
  getMoveSurfaceStyle,
} from "@/components/team/MoveUI";

describe("MoveUI", () => {
  it("resolves move profile fit for physical, special, defensive status, and null cases", () => {
    const member = {
      effectiveStats: {
        hp: 80,
        atk: 95,
        def: 70,
        spa: 85,
        spd: 60,
        spe: 90,
        bst: 480,
      },
    };

    expect(getMoveProfileFit(undefined, { damageClass: "physical" })).toEqual(null);
    expect(getMoveProfileFit(member as never, { damageClass: "physical" })).toEqual({
      kind: "offense",
      stat: "atk",
    });
    expect(getMoveProfileFit(member as never, { damageClass: "special" })).toEqual(null);
    expect(
      getMoveProfileFit(
        {
          effectiveStats: {
            ...member.effectiveStats,
            atk: 70,
            spa: 105,
            def: 55,
            spd: 90,
          },
        } as never,
        { damageClass: "special" },
      ),
    ).toEqual({
      kind: "offense",
      stat: "spa",
    });
    expect(getMoveProfileFit(member as never, { damageClass: "status" })).toEqual({
      kind: "defense",
      stat: "def",
    });
    expect(
      getMoveProfileFit(
        {
          effectiveStats: {
            ...member.effectiveStats,
            def: 50,
            spd: 95,
          },
        } as never,
        { damageClass: "status" },
      ),
    ).toEqual({
      kind: "defense",
      stat: "spd",
    });
    expect(getMoveProfileFit(member as never, { damageClass: "other" })).toEqual(null);
  });

  it("provides fallback and stab-aware surface styles", () => {
    expect(getMoveSurfaceStyle(undefined)).toEqual({
      background: "var(--surface-3)",
      color: "var(--text)",
    });
    expect(getMoveSurfaceStyle("Electric")).toEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String),
        color: expect.any(String),
      }),
    );
    expect(getMoveStabStyle("Electric")).toEqual({
      "--stab-glow": expect.stringContaining("color-mix"),
    });
    expect(getMoveSurfaceClass("Electric", false)).toContain("border-line");
    expect(getMoveSurfaceClass("Electric", true)).toContain("stab-frame");
  });

  it("renders slot titles and power badges with fit and stab cues", () => {
    render(
      <>
        <MoveSlotSurface
          move={{
            name: "Thunderbolt",
            type: "Electric",
            hasStab: true,
            damageClass: "special",
            power: 90,
            adjustedPower: 135,
          }}
          member={
            {
              effectiveStats: {
                hp: 80,
                atk: 60,
                def: 70,
                spa: 110,
                spd: 85,
                spe: 100,
                bst: 505,
              },
            } as never
          }
        />
        <MoveSlotSurface
          move={{
            name: "Calm Mind",
            type: undefined,
            hasStab: false,
            damageClass: "status",
            power: null,
            adjustedPower: null,
          }}
          member={
            {
              effectiveStats: {
                hp: 80,
                atk: 60,
                def: 65,
                spa: 110,
                spd: 95,
                spe: 100,
                bst: 510,
              },
            } as never
          }
          title="Custom move title"
        />
        <MovePowerBadge damageClass="physical" power={80} adjustedPower={120} />
      </>,
    );

    const thunderbolt = screen.getByTitle("Fits SpA profile");
    expect(thunderbolt.className).toContain("fit-offense-surface");
    expect(thunderbolt.className).toContain("move-stab-surface");
    expect(screen.getByText("90→135")).toBeTruthy();

    const calmMind = screen.getByTitle("Custom move title");
    expect(calmMind.className).toContain("fit-defense-surface");
    expect(screen.getByText("80→120")).toBeTruthy();
  });

  it("renders cue icons only when stab or fit is present", () => {
    const { rerender, container } = render(<MoveCueIcons />);
    expect(container.innerHTML).toBe("");

    rerender(<MoveCueIcons fit={{ kind: "offense", stat: "atk" }} />);
    expect(screen.getByTitle("Aprovecha Atk")).toBeTruthy();
    expect(screen.queryByTitle("STAB")).toBeNull();

    rerender(<MoveCueIcons hasStab fit={{ kind: "defense", stat: "spd" }} />);
    expect(screen.getByTitle("Aprovecha SpD")).toBeTruthy();
    expect(screen.getByTitle("STAB")).toBeTruthy();
  });
});
