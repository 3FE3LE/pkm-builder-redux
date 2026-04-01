import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/BuilderShared", () => ({
  TypeBadge: ({
    type,
    emphasis,
  }: {
    type: string;
    emphasis?: string;
  }) => <span>{`${type}${emphasis ? `-${emphasis}` : ""}`}</span>,
}));

import { IntelligencePanel } from "@/components/team/checkpoints/IntelligencePanel";

describe("IntelligencePanel", () => {
  it("renders swap opportunities with status tones and upside badges", () => {
    render(
      <IntelligencePanel
        teamSize={6}
        supportsContextualSwaps
        checkpointRisk={{
          roleSnapshot: {
            members: [],
            coveredRoles: [],
            missingRoles: [],
            compositionNotes: [],
          },
        } as never}
        swapOpportunities={[
          {
            id: "swap-1",
            replacedSpecies: "Pignite",
            candidateSpecies: "Mareep",
            area: "Virbank",
            riskDelta: 1.8,
            scoreDelta: 4.1,
            candidateRole: "bulkyPivot",
            attackUpsides: ["Flying"],
            defenseUpsides: ["Water"],
          },
          {
            id: "swap-2",
            replacedSpecies: "Patrat",
            candidateSpecies: "Riolu",
            area: "Floccesy",
            riskDelta: 1.0,
            scoreDelta: 2.2,
            candidateRole: "cleaner",
            attackUpsides: [],
            defenseUpsides: [],
          },
          {
            id: "swap-3",
            replacedSpecies: "Pidove",
            candidateSpecies: "Magnemite",
            area: "Virbank Complex",
            riskDelta: 0.4,
            scoreDelta: 1.5,
            candidateRole: "support",
            attackUpsides: ["Rock"],
            defenseUpsides: ["Ice"],
          },
        ] as never}
      />,
    );

    expect(screen.getByText("Swaps del tramo")).toBeTruthy();
    expect(screen.getByText("Pignite")).toBeTruthy();
    expect(screen.getByText("Mareep entra mejor ahora desde Virbank.")).toBeTruthy();
    expect(screen.getByText("change")).toBeTruthy();
    expect(screen.getByText("watch")).toBeTruthy();
    expect(screen.getByText("keep")).toBeTruthy();
    expect(screen.getByText("role bulkyPivot")).toBeTruthy();
    expect(screen.getByText("risk -1.8")).toBeTruthy();
    expect(screen.getByText("score +4.1")).toBeTruthy();
    expect(screen.getByText("Flying-positive")).toBeTruthy();
    expect(screen.getByText("Water-positive")).toBeTruthy();
    expect(screen.getByText("Rock-positive")).toBeTruthy();
    expect(screen.getByText("Ice-positive")).toBeTruthy();
  });

  it("renders role intelligence, buckets and composition notes", () => {
    render(
      <IntelligencePanel
        teamSize={4}
        supportsContextualSwaps={false}
        swapOpportunities={[]}
        checkpointRisk={{
          roleSnapshot: {
            members: [
              {
                species: "Lucario",
                naturalRole: "wallbreaker",
                recommendedRole: "speedControl",
                compositionNote: "Cubre presión inmediata.",
                alternativeRoles: ["cleaner", "revengeKiller"],
                reasons: ["Buen STAB", "Buen speed tier"],
              },
              {
                species: "Mareep",
                naturalRole: "support",
                recommendedRole: "bulkyPivot",
                compositionNote: "",
                alternativeRoles: [],
                reasons: [],
              },
            ],
            coveredRoles: ["wallbreaker", "support"],
            missingRoles: ["defensiveGlue"],
            compositionNotes: ["Falta un inmunidad a tierra.", "Buen balance ofensivo."],
          },
        } as never}
      />,
    );

    expect(screen.queryByText("Swaps del tramo")).toBeNull();
    expect(screen.getByText("Roles detectados")).toBeTruthy();
    expect(screen.getByText("Lucario")).toBeTruthy();
    expect(screen.getByText("natural wallbreaker")).toBeTruthy();
    expect(screen.getByText("team speed control")).toBeTruthy();
    expect(screen.getByText("Cubre presión inmediata.")).toBeTruthy();
    expect(screen.getByText("Tambien puede jugar como cleaner, revenge killer.")).toBeTruthy();
    expect(screen.getByText("Buen STAB · Buen speed tier")).toBeTruthy();
    expect(screen.getByText("wallbreaker, support")).toBeTruthy();
    expect(screen.getByText("glue")).toBeTruthy();
    expect(screen.getByText("Falta un inmunidad a tierra.")).toBeTruthy();
    expect(screen.getByText("Buen balance ofensivo.")).toBeTruthy();
  });

  it("hides swaps when team size or feature support do not qualify and shows empty role buckets", () => {
    render(
      <IntelligencePanel
        teamSize={5}
        supportsContextualSwaps={false}
        swapOpportunities={[
          {
            id: "swap-hidden",
            replacedSpecies: "Pidove",
            candidateSpecies: "Magnemite",
            area: "Virbank Complex",
            riskDelta: 1,
            scoreDelta: 1,
            candidateRole: "support",
            attackUpsides: [],
            defenseUpsides: [],
          },
        ] as never}
        checkpointRisk={{
          roleSnapshot: {
            members: [],
            coveredRoles: [],
            missingRoles: [],
            compositionNotes: [],
          },
        } as never}
      />,
    );

    expect(screen.queryByText("Swaps del tramo")).toBeNull();
    expect(screen.getAllByText("ninguno").length).toBe(2);
  });
});
