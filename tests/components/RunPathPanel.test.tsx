import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PathPanel as RunPathPanel } from "@/components/team/checkpoints/PathPanel";

function createEncounter(overrides: Record<string, unknown>) {
  return {
    id: "encounter",
    order: 1,
    label: "Encounter",
    category: "gym",
    affiliation: "independent",
    mode: "challenge",
    mandatory: true,
    levelCap: 10,
    documentation: "documented",
    ...overrides,
  } as never;
}

describe("RunPathPanel", () => {
  it("marks the next available encounter, toggles unlocked rows, and blocks locked ones", async () => {
    const user = userEvent.setup();
    const onToggleEncounter = vi.fn();

    render(
      <RunPathPanel
        encounters={[
          createEncounter({ id: "mandatory-1", order: 1, label: "Cheren", mandatory: true, team: ["Patrat"] }),
          createEncounter({ id: "optional-2", order: 2, label: "Wattson", mandatory: false, affiliation: "hoenn-leaders", team: ["Magnemite"] }),
          createEncounter({ id: "mandatory-3", order: 3, label: "Roxie", mandatory: true, affiliation: "unova-league", team: ["Koffing"] }),
        ]}
        completedEncounterIds={[]}
        speciesCatalog={[
          { name: "Patrat", dex: 504 },
          { name: "Magnemite", dex: 81 },
          { name: "Koffing", dex: 109 },
        ]}
        starterKey="tepig"
        onToggleEncounter={onToggleEncounter}
      />,
    );

    expect(screen.getByText("0/3")).toBeTruthy();
    expect(screen.getByText("next")).toBeTruthy();
    expect(screen.getByText("optional")).toBeTruthy();
    expect(screen.getByText("hoenn leaders")).toBeTruthy();
    expect(screen.getAllByTitle("Primero debes marcar Cheren.").length).toBe(2);
    expect(screen.getByText("Primero marca Cheren.")).toBeTruthy();
    expect(screen.getAllByText("Lv cap 10").length).toBe(3);

    await user.click(screen.getByText("Cheren").closest("button") as HTMLButtonElement);
    expect(onToggleEncounter).toHaveBeenCalledWith("mandatory-1");

    await user.click(screen.getByText("Wattson").closest("button") as HTMLButtonElement);
    expect(onToggleEncounter).toHaveBeenCalledTimes(1);
  });

  it("shows visible bosses by starter, team fallback, partial tag and sprite fallbacks", () => {
    const { container } = render(
      <RunPathPanel
        encounters={[
          createEncounter({
            id: "hugh-1",
            order: 1,
            label: "Hugh",
            affiliation: "rival",
            bosses: [
              { label: "If you picked Tepig", team: ["Oshawott", "Pansear"] },
              { label: "If you picked Snivy", team: ["Tepig", "Pansage"] },
              { label: "Bianca", team: ["Munna"] },
            ],
          }),
          createEncounter({
            id: "subway",
            order: 2,
            label: "Subway Bosses",
            affiliation: "facility",
            documentation: "partial",
          }),
        ]}
        completedEncounterIds={["hugh-1"]}
        speciesCatalog={[
          { name: "Oshawott", dex: 501 },
          { name: "Pansear", dex: 513 },
          { name: "Munna", dex: 517 },
        ]}
        starterKey="tepig"
        onToggleEncounter={vi.fn()}
      />,
    );

    expect(screen.getByText("If you picked Tepig")).toBeTruthy();
    expect(screen.queryByText("If you picked Snivy")).toBeNull();
    expect(screen.getByText("Bianca")).toBeTruthy();
    expect(screen.getByText("partial")).toBeTruthy();
    expect(screen.getByText("team sprites pending")).toBeTruthy();
    expect(screen.getByText("facility")).toBeTruthy();
    expect(container.querySelector('img[alt="Oshawott"]')).toBeTruthy();
    expect(container.querySelector('img[alt="Munna"]')).toBeTruthy();
  });

  it("builds the mobile summary window from the last completed encounter and respects maxHeight", () => {
    const { container } = render(
      <RunPathPanel
        encounters={[
          createEncounter({ id: "e1", order: 1, label: "One", mandatory: true }),
          createEncounter({ id: "e2", order: 2, label: "Two", mandatory: false }),
          createEncounter({ id: "e3", order: 3, label: "Three", mandatory: false }),
          createEncounter({ id: "e4", order: 4, label: "Four", mandatory: true }),
          createEncounter({ id: "e5", order: 5, label: "Five", mandatory: false }),
        ]}
        completedEncounterIds={["e1", "e2"]}
        speciesCatalog={[]}
        starterKey="snivy"
        onToggleEncounter={vi.fn()}
        maxHeight={321.4}
        variant="mobile-summary"
      />,
    );

    expect(screen.queryByText("One")).toBeNull();
    expect(screen.getByText("Two")).toBeTruthy();
    expect(screen.getByText("Three")).toBeTruthy();
    expect(screen.getByText("Four")).toBeTruthy();
    expect(screen.queryByText("Five")).toBeNull();
    expect((container.firstChild as HTMLElement)?.getAttribute("style") ?? "").toContain("height: 321px");
  });
});
