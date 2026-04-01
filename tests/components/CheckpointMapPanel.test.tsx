import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/team/UI", () => ({
  AreaSourceCard: ({
    source,
    activeSpecies,
  }: {
    source: { area: string };
    activeSpecies?: string;
  }) => <div>{`${source.area}-${activeSpecies ?? "none"}`}</div>,
}));

import { MapPanel as CheckpointMapPanel } from "@/components/team/checkpoints/MapPanel";

describe("CheckpointMapPanel", () => {
  it("renders only visible source cards and forwards the active species", () => {
    render(
      <CheckpointMapPanel
        activeMember={{ species: "Lucario" } as never}
        sourceCards={[
          {
            area: "Virbank Complex",
            encounters: ["Mareep"],
            gifts: [],
            trades: [],
            items: [],
          },
          {
            area: "Castelia Sewers",
            encounters: [],
            gifts: ["Eevee"],
            trades: [],
            items: [],
          },
          {
            area: "Empty Area",
            encounters: [],
            gifts: [],
            trades: [],
            items: [],
          },
        ]}
        speciesCatalog={[]}
        itemCatalog={[]}
      />,
    );

    expect(screen.getByText("Locations")).toBeTruthy();
    expect(screen.getByText("Virbank Complex-Lucario")).toBeTruthy();
    expect(screen.getByText("Castelia Sewers-Lucario")).toBeTruthy();
    expect(screen.queryByText("Empty Area-Lucario")).toBeNull();
  });

  it("shows the dataset fallback when no sources are visible", () => {
    render(
      <CheckpointMapPanel
        sourceCards={[
          {
            area: "Empty Area",
            encounters: [],
            gifts: [],
            trades: [],
            items: [],
          },
        ]}
        speciesCatalog={[]}
        itemCatalog={[]}
      />,
    );

    expect(
      screen.getByText("No hay fuentes registradas para este checkpoint en el dataset actual."),
    ).toBeTruthy();
  });
});
