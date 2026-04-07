import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  buildSummaryStats,
  EffectiveStatsRadar,
  getRadarScaleRatio,
} from "@/components/team/shared/StatRadar";

const baseStats = {
  hp: 78,
  atk: 84,
  def: 78,
  spa: 109,
  spd: 85,
  spe: 100,
  bst: 534,
} as const;

describe("StatRadar", () => {
  it("builds summary stats with nature and stat modifiers applied", () => {
    const summary = buildSummaryStats(
      baseStats,
      { up: "spa", down: "atk" },
      [{ source: "ability", label: "Speed x1.5", stat: "spe", multiplier: 1.5 }],
    );

    expect(summary.hp).toBe(78);
    expect(summary.atk).toBe(76);
    expect(summary.spa).toBe(120);
    expect(summary.spe).toBe(150);
    expect(summary.bst).toBe(534);
  });

  it("renders the radar layers, labels, values, and legend", () => {
    const { container } = render(
      <EffectiveStatsRadar
        effectiveStats={{
          hp: 153,
          atk: 104,
          def: 98,
          spa: 177,
          spd: 105,
          spe: 183,
          bst: 820,
        }}
        baseStats={baseStats}
        level={50}
        nature="Timid"
        ivs={{ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }}
        evs={{ spa: 252, spe: 252 }}
        statModifiers={[{ source: "ability", label: "Speed x1.5", stat: "spe", multiplier: 1.5 }]}
        natureEffect={{ up: "spe", down: "atk" }}
      />,
    );

    expect(screen.getByText("Atk↓")).toBeTruthy();
    expect(screen.getByText("Spe↑")).toBeTruthy();
    expect(screen.getByText("153")).toBeTruthy();
    expect(screen.getByText("183")).toBeTruthy();
    expect(screen.getByText("base")).toBeTruthy();
    expect(screen.getByText("+ IV")).toBeTruthy();
    expect(screen.getByText("+ EV")).toBeTruthy();
    expect(container.querySelectorAll("polygon")).toHaveLength(7);
    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(container.querySelectorAll("circle")).toHaveLength(18);
  });

  it("uses a compressed fixed radar scale with diminishing gains at high stats", () => {
    const minRatio = getRadarScaleRatio(5);
    const midRatio = getRadarScaleRatio(200);
    const highRatio = getRadarScaleRatio(400);
    const veryHighRatio = getRadarScaleRatio(600);
    const maxRatio = getRadarScaleRatio(500);

    expect(minRatio).toBeGreaterThan(0);
    expect(midRatio).toBeGreaterThan(minRatio);
    expect(highRatio).toBeGreaterThan(midRatio);
    expect(veryHighRatio).toBeGreaterThan(highRatio);
    expect(maxRatio).toBeCloseTo(1, 5);
    expect(maxRatio - veryHighRatio).toBeLessThan(highRatio - midRatio);
  });
});
