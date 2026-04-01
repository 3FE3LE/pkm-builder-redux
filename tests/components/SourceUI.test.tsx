import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  motion: {
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
  ItemSprite: ({
    name,
    sprite,
  }: {
    name: string;
    sprite?: string | null;
  }) => <span>{`item-${name}-${sprite ?? "none"}`}</span>,
}));

import {
  AreaSourceCard,
  RecommendedCard,
} from "@/components/team/SourceUI";

describe("SourceUI", () => {
  it("renders a recommended card with positive replace delta details", () => {
    render(
      <RecommendedCard
        member={{
          species: "Mareep",
          source: "Gift",
          reason: "Cubre mejor el midgame.",
          role: "bulkyPivot",
          roleLabel: "Bulky Pivot",
          teamFitNote: "Mejora el pivoting.",
          roleReason: "Aporta Volt Switch.",
          area: "Virbank",
        }}
        delta={
          {
            action: "replace",
            replacedSlot: "Pignite",
            riskDelta: 1.5,
            projectedRisk: 4.2,
            scoreDelta: 6.4,
            offenseDelta: 2.1,
            defenseDelta: 4.2,
            speedDelta: -1.2,
            rolesDelta: 5.1,
            consistencyDelta: 0,
            roleLabel: "Bulky Pivot",
            teamFitNote: "Entra mejor al core.",
            roleReason: "Mitiga agua y volador.",
            gains: ["Volt Switch", "Bulk"],
            losses: ["Ground immunity"],
            projectedMoves: ["Thunder Shock", "Thunder Wave"],
          } as never
        }
      />,
    );

    expect(screen.getByText("Mareep")).toBeTruthy();
    expect(screen.getByText("Gift")).toBeTruthy();
    expect(screen.getAllByText("Bulky Pivot").length).toBe(2);
    expect(screen.getByText("Virbank")).toBeTruthy();
    expect(screen.getByText("Mejor si reemplaza a Pignite")).toBeTruthy();
    expect(screen.getByText("Risk -1.5 -> 4.2/10")).toBeTruthy();
    expect(screen.getByText("+6.4 score")).toBeTruthy();
    expect(screen.getByText("Gana: Volt Switch · Bulk")).toBeTruthy();
    expect(screen.getByText("Pierde: Ground immunity")).toBeTruthy();
    expect(screen.getByText("Moves proyectados: Thunder Shock / Thunder Wave")).toBeTruthy();
  });

  it("renders skip deltas and plain recommendations without delta", () => {
    const { rerender } = render(
      <RecommendedCard
        member={{
          species: "Zorua",
          source: "Trade",
          reason: "Puede cubrir utility.",
          role: "support",
          roleLabel: "Support",
          teamFitNote: "Flexible.",
          roleReason: "Buen utility.",
        }}
        delta={
          {
            action: "skip",
            replacedSlot: null,
            riskDelta: 0,
            projectedRisk: 5.5,
            scoreDelta: -2,
            offenseDelta: -5,
            defenseDelta: 0,
            speedDelta: 0,
            rolesDelta: -1,
            consistencyDelta: -4,
            roleLabel: "Support",
            teamFitNote: "No cabe.",
            roleReason: "Slots locked.",
            gains: [],
            losses: [],
            projectedMoves: [],
          } as never
        }
      />,
    );

    expect(screen.getByText("No hay slot elegible")).toBeTruthy();
    expect(screen.getByText("Todos los slots candidatos estan locked o fuera de regla.")).toBeTruthy();
    expect(screen.getByText("locked")).toBeTruthy();

    rerender(
      <RecommendedCard
        member={{
          species: "Snivy",
          source: "Wild",
          reason: "Starter alternativo.",
          role: "cleaner",
          roleLabel: "Cleaner",
          teamFitNote: "Escala bien.",
          roleReason: "Speed buena.",
        }}
      />,
    );

    expect(screen.getByText("Snivy")).toBeTruthy();
    expect(screen.queryByText("Impacto estimado")).toBeNull();
  });

  it("renders add deltas with higher risk copy and fallback impact title", () => {
    const { rerender } = render(
      <RecommendedCard
        member={{
          species: "Magnemite",
          source: "Wild",
          reason: "Puede entrar como sexto slot.",
          role: "support",
          roleLabel: "Support",
          teamFitNote: "Da utility.",
          roleReason: "Checkea amenazas de agua.",
        }}
        delta={
          {
            action: "add",
            replacedSlot: null,
            riskDelta: -1.2,
            projectedRisk: 6.1,
            scoreDelta: 1.5,
            offenseDelta: 0,
            defenseDelta: 2,
            speedDelta: 0,
            rolesDelta: 1,
            consistencyDelta: 0,
            roleLabel: "Support",
            teamFitNote: "Se suma sin reemplazo.",
            roleReason: "Aporta resistencias.",
            gains: [],
            losses: [],
            projectedMoves: [],
          } as never
        }
      />,
    );

    expect(screen.getByText("Mejor como slot nuevo")).toBeTruthy();
    expect(screen.getByText("Sube el riesgo +1.2 si entra ahora")).toBeTruthy();

    rerender(
      <RecommendedCard
        member={{
          species: "Staryu",
          source: "Gift",
          reason: "Puede rellenar coverage.",
          role: "cleaner",
          roleLabel: "Cleaner",
          teamFitNote: "Flexible.",
          roleReason: "Speed alta.",
        }}
        delta={
          {
            action: "replace",
            replacedSlot: null,
            riskDelta: 0.2,
            projectedRisk: 4.9,
            scoreDelta: -0.5,
            offenseDelta: -1,
            defenseDelta: 0,
            speedDelta: 1,
            rolesDelta: 0,
            consistencyDelta: 0,
            roleLabel: "Cleaner",
            teamFitNote: "Puede encajar.",
            roleReason: "Solo si falta speed.",
            gains: [],
            losses: [],
            projectedMoves: [],
          } as never
        }
      />,
    );

    expect(screen.getByText("Impacto estimado")).toBeTruthy();
  });

  it("renders area source rows with highlights, trades, items and fallbacks", () => {
    const { container } = render(
      <AreaSourceCard
        source={{
          area: "Virbank Complex",
          encounters: ["Mareep", "Rotom-Wash (special)"],
          gifts: ["Eevee"],
          trades: ["Lucario for Leftovers", "Axew -> Potion"],
          items: ["Leftovers x2", "Potion -> Lucario"],
        }}
        activeSpecies="Mareep"
        speciesCatalog={[
          { name: "Mareep", dex: 179 },
          { name: "Rotom", dex: 479 },
          { name: "Eevee", dex: 133 },
          { name: "Lucario", dex: 448 },
          { name: "Axew", dex: 610 },
        ]}
        itemCatalog={[
          { name: "Leftovers", effect: "Recovers HP", sprite: "/leftovers.png" },
          { name: "Potion", effect: "Heals 20 HP", sprite: null },
        ]}
      />,
    );

    expect(screen.getByText("Virbank Complex")).toBeTruthy();
    expect(screen.getByText("wild 2")).toBeTruthy();
    expect(screen.getByText("gift 1")).toBeTruthy();
    expect(screen.getByText("trade 2")).toBeTruthy();
    expect(screen.getByText("item 2")).toBeTruthy();
    expect(screen.getByText("Mareep")).toBeTruthy();
    expect(screen.getByText("Rotom-Wash (special)")).toBeTruthy();
    expect(screen.getByText("Lucario for Leftovers")).toBeTruthy();
    expect(screen.getByText("Axew -> Potion")).toBeTruthy();
    expect(screen.getByText("Leftovers x2")).toBeTruthy();
    expect(screen.getByText("Potion -> Lucario")).toBeTruthy();
    expect(screen.getAllByText("item-Leftovers-/leftovers.png").length).toBe(2);
    expect(screen.getByText("item-Potion-none")).toBeTruthy();

    const mareepChip = screen.getByText("Mareep").closest("span.text-primary-soft");
    expect(mareepChip).toBeTruthy();
    expect(container.querySelector('img[alt="Rotom-Wash"]')).toBeTruthy();
    expect(container.querySelector('img[alt="Lucario"]')).toBeTruthy();
  });

  it("shows empty list fallback and item effect popovers when present", () => {
    render(
      <AreaSourceCard
        source={{
          area: "Route 1",
          encounters: [],
          gifts: [],
          trades: [],
          items: ["Potion"],
        }}
        speciesCatalog={[]}
        itemCatalog={[{ name: "Potion", effect: "Heals 20 HP", sprite: "/potion.png" }]}
      />,
    );

    expect(screen.queryByText("Nada registrado.")).toBeNull();
    expect(screen.queryByText("Wild")).toBeNull();
    expect(screen.queryByText("Gift")).toBeNull();
    expect(screen.queryByText("Trade")).toBeNull();
    expect(screen.getByText("Item")).toBeTruthy();
    expect(screen.getByText("Heals 20 HP")).toBeTruthy();
    fireEvent.mouseOver(screen.getByText("Potion"));
    expect(screen.getByText("Heals 20 HP")).toBeTruthy();
  });

  it("handles empty source groups and relation fallbacks without references", () => {
    render(
      <AreaSourceCard
        source={{
          area: "Lostlorn",
          encounters: [""],
          gifts: ["Rotom-Fan"],
          trades: ["Axew for ", "Mareep -> "],
          items: ["Rare Candy x2 -> ", "Odd Keystone"],
        }}
        activeSpecies="Rotom"
        speciesCatalog={[
          { name: "Rotom", dex: 479 },
          { name: "Mareep", dex: 179 },
        ]}
        itemCatalog={[]}
      />,
    );

    expect(screen.getByText("Gift")).toBeTruthy();
    expect(screen.getByText("Trade")).toBeTruthy();
    expect(screen.getByText("Item")).toBeTruthy();
    expect(screen.getByText("Rotom-Fan")).toBeTruthy();
    expect(screen.getByText("Axew for")).toBeTruthy();
    expect(screen.getByText("Mareep ->")).toBeTruthy();
    expect(screen.getByText("Rare Candy x2 ->")).toBeTruthy();
    expect(screen.getByText("Odd Keystone")).toBeTruthy();
  });

  it("falls back to the raw entry when a relation has an empty primary side", () => {
    render(
      <AreaSourceCard
        source={{
          area: "Castelia",
          encounters: [],
          gifts: [],
          trades: [" -> Potion", " for Leftovers"],
          items: [" -> Potion"],
        }}
        speciesCatalog={[{ name: "Potion", dex: 0 }]}
        itemCatalog={[{ name: "Potion", effect: "Heals 20 HP", sprite: null }]}
      />,
    );

    expect(screen.getAllByText("-> Potion").length).toBeGreaterThan(0);
    expect(screen.getAllByText("for Leftovers").length).toBeGreaterThan(0);
    expect(
      screen.getByText((content) => content.includes("item--> Potion-none")),
    ).toBeTruthy();
  });
});
