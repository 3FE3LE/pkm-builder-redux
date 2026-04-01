import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/BuilderShared", () => ({
  TypeBadge: ({
    type,
    trailing,
    emphasis,
  }: {
    type: string;
    trailing?: number;
    emphasis?: string;
  }) => <span>{`${type}${trailing ? `-${trailing}` : ""}${emphasis ? `-${emphasis}` : ""}`}</span>,
}));

vi.mock("@/components/team/UI", () => ({
  CoverageBadge: ({
    type,
    bucket,
  }: {
    type: string;
    bucket: string;
  }) => <span>{`${type}-${bucket}`}</span>,
  StatBar: ({
    label,
    value,
  }: {
    label: string;
    value: number;
  }) => <div>{`${label}:${value}`}</div>,
}));

import {
  CoveragePanel,
  DefensiveThreatsPanel,
  TeamAverageStatsPanel,
  TeamRosterReadingPanel,
} from "@/components/team/workspace/AnalysisPanels";

describe("AnalysisPanels", () => {
  it("renders average stats and fallback when data is missing", () => {
    const { rerender } = render(
      <TeamAverageStatsPanel
        averageStats={{
          hp: 80,
          atk: 95,
          def: 70,
          spa: 88,
          spd: 75,
          spe: 90,
          bst: 498,
        }}
      />,
    );

    expect(screen.getByText("BST promedio")).toBeTruthy();
    expect(screen.getByText("HP promedio:80")).toBeTruthy();
    expect(screen.getByText("Spe promedio:90")).toBeTruthy();

    rerender(<TeamAverageStatsPanel averageStats={null} />);
    expect(screen.getByText("Completa especies válidas para calcular promedios.")).toBeTruthy();
  });

  it("renders coverage rows and their empty states", () => {
    const { rerender } = render(
      <CoveragePanel
        coveredCoverage={[
          { defenseType: "Water", bucket: "x2" },
          { defenseType: "Flying", bucket: "x4" },
        ]}
        uncoveredCoverage={[{ defenseType: "Steel", bucket: "x1" }]}
      />,
    );

    expect(screen.getByText("Water-x2")).toBeTruthy();
    expect(screen.getByText("Flying-x4")).toBeTruthy();
    expect(screen.getByText("Steel-x1")).toBeTruthy();

    rerender(<CoveragePanel coveredCoverage={[]} uncoveredCoverage={[]} />);
    expect(screen.getByText("Todavía no hay cobertura super efectiva clara.")).toBeTruthy();
    expect(screen.getByText("Sin datos.")).toBeTruthy();
  });

  it("renders defensive threats and empty defensive sections", () => {
    const { rerender } = render(
      <DefensiveThreatsPanel
        defensiveSections={{
          netWeak: [
            { attackType: "Ice", count: 2, severe: true },
            { attackType: "Rock", count: 1, severe: false },
          ],
          netResist: [{ attackType: "Water", count: 3 }],
        } as never}
      />,
    );

    expect(screen.getByText("Ice-2-danger")).toBeTruthy();
    expect(screen.getByText("Rock-1-normal")).toBeTruthy();
    expect(screen.getByText("Water-3-positive")).toBeTruthy();

    rerender(
      <DefensiveThreatsPanel
        defensiveSections={{ netWeak: [], netResist: [] } as never}
      />,
    );

    expect(screen.getByText("No aparece una amenaza defensiva clara por tipos en el equipo actual.")).toBeTruthy();
    expect(screen.getByText("Todavía no aparece una defensa tipada clara.")).toBeTruthy();
  });

  it("renders roster reading pills, notes and risk bands", () => {
    const { rerender } = render(
      <TeamRosterReadingPanel
        checkpointRisk={{
          totalRisk: 7.4,
          offense: { score: 8.2, summary: "Buen daño inmediato." },
          defense: { score: 6.3, summary: "Bulk aceptable." },
          speed: { score: 4.4, summary: "Velocidad ajustada." },
          roles: { score: 3.8, summary: "Faltan roles." },
          consistency: { score: 5.5, summary: "Inconsistente a ratos." },
          notes: ["Falta resistir hielo.", "Buen pivot.", "Necesita speed control.", "Extra note"],
        } as never}
      />,
    );

    expect(screen.getByText("7.4 / 10")).toBeTruthy();
    expect(screen.getByText("friccion alta")).toBeTruthy();
    expect(screen.getByText("Buen daño inmediato.")).toBeTruthy();
    expect(screen.getByText("Falta resistir hielo.")).toBeTruthy();
    expect(screen.getByText("Necesita speed control.")).toBeTruthy();
    expect(screen.queryByText("Extra note")).toBeNull();

    rerender(
      <TeamRosterReadingPanel
        checkpointRisk={{
          totalRisk: 5.2,
          offense: { score: 6, summary: "Ok." },
          defense: { score: 6, summary: "Ok." },
          speed: { score: 6, summary: "Ok." },
          roles: { score: 6, summary: "Ok." },
          consistency: { score: 6, summary: "Ok." },
          notes: [],
        } as never}
      />,
    );
    expect(screen.getByText("friccion media")).toBeTruthy();

    rerender(
      <TeamRosterReadingPanel
        checkpointRisk={{
          totalRisk: 3.4,
          offense: { score: 8.5, summary: "Ok." },
          defense: { score: 8.5, summary: "Ok." },
          speed: { score: 8.5, summary: "Ok." },
          roles: { score: 8.5, summary: "Ok." },
          consistency: { score: 8.5, summary: "Ok." },
          notes: [],
        } as never}
      />,
    );
    expect(screen.getByText("friccion baja")).toBeTruthy();
  });
});
