import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      layout: _layout,
      ...props
    }: {
      children?: ReactNode;
      layout?: unknown;
    }) => <div {...props}>{children}</div>,
    article: ({
      children,
      layout: _layout,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      ...props
    }: {
      children?: ReactNode;
      layout?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
    }) => <article {...props}>{children}</article>,
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  PokemonSprite: ({
    species,
    spriteUrl,
  }: {
    species: string;
    spriteUrl?: string;
  }) => <span>{`sprite-${species}-${spriteUrl ?? "none"}`}</span>,
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

import { RecommendationsPanel } from "@/components/team/checkpoints/RecommendationsPanel";

function fakeV2Score(finalScore: number) {
  const dim = { raw: finalScore, weighted: finalScore * 0.2, signals: [] };
  return {
    finalScore,
    rank: 1,
    breakdown: {
      teamImpact: dim,
      contextAdvantage: dim,
      stabilityFloor: dim,
      powerCeiling: dim,
      preferenceAffinity: dim,
      reduxValue: dim,
    },
    topSignals: [],
    synergyTags: [],
    verdict: finalScore >= 70 ? "strong" : finalScore >= 50 ? "solid" : "situational",
  };
}

function fakeV2Profile(floor: number, ceiling: number) {
  return { floorScore: floor, ceilingScore: ceiling, volatility: ceiling - floor };
}

describe("RecommendationsPanel", () => {
  it("renders capture recommendations and sends a species to IV calc", async () => {
    const user = userEvent.setup();
    const onSendToIvCalc = vi.fn();

    render(
      <RecommendationsPanel
        teamSize={4}
        captureRecommendations={[
          {
            id: "cap-1",
            species: "Mareep",
            source: "Gift",
            area: "Virbank",
            role: "bulkyPivot",
            projectedMoves: ["Thunder Wave"],
            delta: {
              riskDelta: 1.8,
              scoreDelta: 4.4,
            },
            candidateMember: {
              resolvedStats: { bst: 365 },
              resolvedTypes: ["Electric"],
            },
            v2Score: fakeV2Score(62),
            v2Profile: fakeV2Profile(5.5, 7.0),
          } as never,
          {
            id: "cap-2",
            species: "Zorua",
            source: "Wild",
            area: "Lostlorn",
            role: "utility",
            projectedMoves: [],
            delta: {
              riskDelta: 1.2,
              scoreDelta: 2.1,
            },
            candidateMember: {
              resolvedStats: { bst: 330 },
              resolvedTypes: ["Dark"],
            },
            v2Score: fakeV2Score(48),
            v2Profile: fakeV2Profile(4.0, 5.5),
          } as never,
        ]}
        swapOpportunities={[]}
        supportsContextualSwaps={false}
        nextEncounter={{ label: "Virbank Complex" } as never}
        speciesCatalog={[
          { name: "Mareep", dex: 179 },
          { name: "Zorua", dex: 570 },
        ]}
        onSendToIvCalc={onSendToIvCalc}
      />,
    );

    expect(screen.getByText("Capturas nuevas")).toBeTruthy();
    expect(screen.getByText("Mareep")).toBeTruthy();
    expect(screen.getByText("Gift · Virbank")).toBeTruthy();
    expect(screen.queryByText("Captura sugerida")).toBeNull();
    expect(screen.queryByText("bulkyPivot")).toBeNull();
    const mareepCard = screen.getByText("Mareep").closest("article");
    expect(mareepCard).toBeTruthy();
    const mareepScope = within(mareepCard as HTMLElement);
    expect(mareepScope.getAllByLabelText("Score").length).toBeGreaterThan(0);
    expect(mareepScope.getAllByText("Veredicto").length).toBeGreaterThan(0);
    expect(mareepScope.getAllByText("62").length).toBeGreaterThan(0);
    expect(mareepScope.getAllByLabelText("Piso").length).toBeGreaterThan(0);
    expect(mareepScope.getByText("5.5")).toBeTruthy();
    expect(mareepScope.getAllByLabelText("Techo").length).toBeGreaterThan(0);
    expect(mareepScope.getByText("7.0")).toBeTruthy();
    expect(screen.getByText("Electric")).toBeTruthy();
    expect(screen.getByText("Dark")).toBeTruthy();
    expect(screen.getByText("sprite-Mareep-https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/179.png")).toBeTruthy();

    await user.click(mareepCard as HTMLElement);
    expect(screen.getByText("Motivos de la recomendación")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Mandar al IV Calc" }));
    expect(onSendToIvCalc).toHaveBeenCalledWith("Mareep");
  });

  it("renders the capture empty state and hides captures when the team is full", () => {
    const { rerender } = render(
      <RecommendationsPanel
        teamSize={3}
        captureRecommendations={[]}
        swapOpportunities={[]}
        supportsContextualSwaps={false}
        nextEncounter={{ label: "Route 4" } as never}
        speciesCatalog={[]}
      />,
    );

    expect(
      screen.getByText("No hay una captura nueva claramente mejor para Route 4 con las fuentes activas."),
    ).toBeTruthy();

    rerender(
      <RecommendationsPanel
        teamSize={6}
        captureRecommendations={[]}
        swapOpportunities={[]}
        supportsContextualSwaps={false}
        nextEncounter={null}
        speciesCatalog={[]}
      />,
    );

    expect(screen.queryByText("Capturas nuevas")).toBeNull();
  });

  it("renders swap opportunities and their empty state rules", () => {
    const { rerender } = render(
      <RecommendationsPanel
        teamSize={6}
        captureRecommendations={[]}
        swapOpportunities={[
          {
            id: "swap-1",
            replacedSpecies: "Pignite",
            candidateSpecies: "Mareep",
            source: "Gift",
            area: "Virbank",
            riskDelta: 1.5,
            scoreDelta: 3.7,
            replacedRole: "breaker",
            candidateRole: "pivot",
            currentMember: {
              resolvedTypes: ["Fire", "Fighting"],
              resolvedStats: { bst: 418 },
              summaryStats: { spe: 62 },
            },
            candidateMember: {
              resolvedTypes: ["Electric"],
              resolvedStats: { bst: 365 },
              summaryStats: { spe: 55 },
            },
          } as never,
        ]}
        supportsContextualSwaps
        nextEncounter={null}
        speciesCatalog={[]}
      />,
    );

    expect(screen.getByText("Swaps del tramo")).toBeTruthy();
    expect(screen.getByText("Pignite to Mareep")).toBeTruthy();
    expect(screen.getByText("Gift · Virbank")).toBeTruthy();
    expect(screen.getByText("-1.5 risk")).toBeTruthy();
    expect(screen.getByText("score +3.7")).toBeTruthy();
    expect(screen.getByText("Sale")).toBeTruthy();
    expect(screen.getByText("Entra")).toBeTruthy();
    expect(screen.getByText("Fire")).toBeTruthy();
    expect(screen.getByText("Electric")).toBeTruthy();
    expect(screen.getByText("418")).toBeTruthy();
    expect(screen.getByText("55")).toBeTruthy();

    rerender(
      <RecommendationsPanel
        teamSize={5}
        captureRecommendations={[]}
        swapOpportunities={[]}
        supportsContextualSwaps={false}
        nextEncounter={null}
        speciesCatalog={[]}
      />,
    );

    expect(
      screen.getByText("No hay un swap claro para este checkpoint con las fuentes disponibles del tramo."),
    ).toBeTruthy();
  });

  it("respects the showCaptures and showSwaps toggles", () => {
    render(
      <RecommendationsPanel
        teamSize={5}
        captureRecommendations={[
          {
            id: "cap-hidden",
            species: "Snivy",
            source: "Wild",
            area: "Route 1",
            role: "cleaner",
            projectedMoves: [],
            delta: { riskDelta: 1, scoreDelta: 1 },
            candidateMember: {
              resolvedStats: { bst: 308 },
              resolvedTypes: ["Grass"],
            },
            v2Score: fakeV2Score(40),
            v2Profile: fakeV2Profile(4, 5),
          } as never,
        ]}
        swapOpportunities={[
          {
            id: "swap-hidden",
            replacedSpecies: "Patrat",
            candidateSpecies: "Riolu",
            source: "Gift",
            riskDelta: 1,
            scoreDelta: 1,
            currentMember: { resolvedTypes: ["Normal"] },
            candidateMember: { resolvedTypes: ["Fighting"] },
          } as never,
        ]}
        supportsContextualSwaps
        nextEncounter={null}
        speciesCatalog={[]}
        showCaptures={false}
        showSwaps={false}
      />,
    );

    expect(screen.queryByText("Capturas nuevas")).toBeNull();
    expect(screen.queryByText("Swaps del tramo")).toBeNull();
  });
});
