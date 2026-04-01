import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/BuilderShared", () => ({
  FilterCombobox: ({
    options,
    renderOption,
    onChange,
  }: {
    options: string[];
    renderOption?: (option: string, selected: boolean) => ReactNode;
    onChange: (value: string) => void;
  }) => (
    <div>
      {options.map((option) => (
        <button key={option} type="button" onClick={() => onChange(option)}>
          {renderOption ? renderOption(option, option === options[0]) : option}
        </button>
      ))}
    </div>
  ),
  InfoHint: ({ text }: { text?: string }) => <span>{text ?? "no-hint"}</span>,
  ItemSprite: ({ name }: { name: string }) => <span>{name}</span>,
  PokemonSprite: ({ species }: { species: string }) => <span>{species}</span>,
  SpeciesCombobox: ({
    onChange,
  }: {
    onChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onChange("Pikachu")}>
      choose-species
    </button>
  ),
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

vi.mock("@/components/team/UI", () => ({
  CoverageBadge: ({
    label,
    bucket,
  }: {
    label: string;
    bucket: string;
  }) => <span>{`${label}-${bucket}`}</span>,
  StatCard: ({ label, value }: { label: string; value: string }) => (
    <div>{`${label}:${value}`}</div>
  ),
}));

vi.mock("@/components/team/Radar", () => ({
  EffectiveStatsRadar: ({ level }: { level: number }) => <div>{`radar-${level}`}</div>,
  buildSummaryStats: () => ({
    hp: 100,
    atk: 80,
    def: 70,
    spa: 90,
    spd: 75,
    spe: 110,
  }),
}));

vi.mock("@/components/ui/Input", () => ({
  Input: ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (event: { target: { value: string } }) => void;
  }) => (
    <button type="button" onClick={() => onChange({ target: { value: "999" } })}>
      {`input-${value}`}
    </button>
  ),
}));

import {
  buildCompareState,
  CompareMemberPanel,
  ComparisonSummary,
} from "@/components/team/tools/compare/ComparePanels";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

function createMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    species: "Lucario",
    nickname: "Lucario",
    locked: false,
    shiny: false,
    level: 30,
    gender: "unknown",
    nature: "Serious",
    ability: "Prankster",
    item: "",
    moves: [],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ...overrides,
  } as never;
}

function createResolved(overrides: Record<string, unknown> = {}) {
  return {
    species: "Lucario",
    spriteUrl: "/lucario.png",
    animatedSpriteUrl: "/lucario.gif",
    abilities: ["Steadfast", "Inner Focus"],
    resolvedTypes: ["Fighting", "Steel"],
    resolvedStats: {
      hp: 70,
      atk: 110,
      def: 70,
      spa: 115,
      spd: 70,
      spe: 90,
      bst: 525,
    },
    nextEvolutions: [],
    ...overrides,
  } as never;
}

describe("CompareModalSections", () => {
  it("reconciles an invalid ability to one valid for the resolved species", async () => {
    const onChangeMember = vi.fn();

    const state = buildCompareState(
      createMember(),
      createResolved(),
      [],
      [],
      "clear",
    );

    render(
      <CompareMemberPanel
        index={0}
        state={state}
        speciesCatalog={[]}
        heldItemCatalog={[]}
        onChangeMember={onChangeMember}
      />,
    );

    await waitFor(() => {
      expect(onChangeMember).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ ability: "Steadfast" }),
      );
    });
  });

  it("updates species, preserves custom nicknames, and wires level/nature/ability/item controls", async () => {
    const user = userEvent.setup();
    const onChangeMember = vi.fn();

    const state = buildCompareState(
      createMember({ nickname: "Aura", ability: "Inner Focus", item: "Choice Specs" }),
      createResolved({ nextEvolutions: ["Mega-ish"] }),
      [{ name: "Inner Focus", effect: "No flinch" }],
      [{ name: "Choice Specs", effect: "Boosts SpA", sprite: "/specs.png" }],
      "sun",
    );

    render(
      <CompareMemberPanel
        index={1}
        state={state}
        speciesCatalog={[]}
        heldItemCatalog={[{ name: "Choice Specs", effect: "Boosts SpA", sprite: "/specs.png" }]}
        onChangeMember={onChangeMember}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "choose-species" })[0]);
    expect(onChangeMember).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ species: "Pikachu", nickname: "Aura" }),
    );

    await user.click(screen.getByText("input-30"));
    expect(onChangeMember).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ level: 100 }),
    );

    await user.click(screen.getByRole("button", { name: "Adamant" }));
    expect(onChangeMember).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ nature: "Adamant" }),
    );

    await user.click(screen.getByText("Steadfast"));
    expect(onChangeMember).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ ability: "Steadfast" }),
    );

    await user.click(screen.getAllByText("Choice Specs")[0]!);
    expect(onChangeMember).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ item: "Choice Specs" }),
    );

    expect(screen.getByText("BST:525")).toBeTruthy();
    expect(screen.getByText("Spe:110")).toBeTruthy();
    expect(screen.getByText("radar-30")).toBeTruthy();
    expect(screen.getByText("Boosts SpA")).toBeTruthy();
  });

  it("syncs nickname with species when the nickname still matches the old species and shows the invalid-species fallback", async () => {
    const user = userEvent.setup();
    const onChangeMember = vi.fn();

    const syncedState = buildCompareState(
      createMember({ nickname: "Lucario" }),
      createResolved(),
      [],
      [],
      "clear",
    );

    const { rerender } = render(
      <CompareMemberPanel
        index={0}
        state={syncedState}
        speciesCatalog={[]}
        heldItemCatalog={[]}
        onChangeMember={onChangeMember}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "choose-species" })[0]);
    expect(onChangeMember).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ species: "Pikachu", nickname: "Pikachu" }),
    );

    const invalidState = buildCompareState(
      createMember({ species: "", nickname: "" }),
      undefined,
      [],
      [],
      "clear",
    );

    rerender(
      <CompareMemberPanel
        index={0}
        state={invalidState}
        speciesCatalog={[]}
        heldItemCatalog={[]}
        onChangeMember={onChangeMember}
      />,
    );

    expect(screen.getByText("Selecciona una especie válida para comparar.")).toBeTruthy();
  });

  it("builds compare state with catalog fallbacks and defensive buckets", () => {
    const state = buildCompareState(
      createMember({ ability: "Steadfast", item: "Choice Specs" }),
      createResolved(),
      [{ name: "Steadfast", effect: "Speed rises after flinching." }],
      [{ name: "Choice Specs", effect: "Boosts SpA" }],
      "clear",
    );

    expect(state.abilityDetails?.effect).toContain("flinching");
    expect(state.itemDetails?.effect).toContain("Boosts");
    expect(state.abilityOptions).toEqual(["Steadfast", "Inner Focus"]);
    expect(state.summaryStats?.spa).toBe(90);
    expect(state.effectiveStats?.hp).toBeGreaterThan(0);
    expect(state.weaknesses.length).toBeGreaterThan(0);
    expect(state.resistances.length).toBeGreaterThan(0);
  });

  it("renders comparison summary deltas and fallback buckets", () => {
    render(
      <ComparisonSummary
        left={
          {
            resolved: { resolvedStats: { bst: 600 } },
            summaryStats: { hp: 100, atk: 120, def: 90, spa: 110, spd: 95, spe: 105 },
            weaknesses: [{ attackType: "Ground", buckets: { x4: 1, x2: 0 } }],
            resistances: [{ attackType: "Ghost", buckets: { x0: 0, "x0.25": 1, "x0.5": 0 } }],
          } as never
        }
        right={
          {
            resolved: { resolvedStats: { bst: 580 } },
            summaryStats: { hp: 90, atk: 100, def: 95, spa: 90, spd: 100, spe: 80 },
            weaknesses: [],
            resistances: [],
          } as never
        }
      />,
    );

    expect(screen.getByText("Ground-x4")).toBeTruthy();
    expect(screen.getByText("Ghost-x0.25")).toBeTruthy();
    expect(screen.getByText("Sin debilidades")).toBeTruthy();
    expect(screen.getByText("Sin resistencias")).toBeTruthy();
    expect(screen.getByText("+25")).toBeTruthy();
    expect(screen.getAllByText("-5")).toHaveLength(2);
  });

  it("does not reconcile ability when species is empty or the current ability is already valid", async () => {
    const onChangeMember = vi.fn();

    const { rerender } = render(
      <CompareMemberPanel
        index={0}
        state={buildCompareState(
          createMember({ species: "", ability: "Steadfast" }),
          createResolved(),
          [],
          [],
          "clear",
        )}
        speciesCatalog={[]}
        heldItemCatalog={[]}
        onChangeMember={onChangeMember}
      />,
    );

    await waitFor(() => {
      expect(onChangeMember).not.toHaveBeenCalled();
    });

    rerender(
      <CompareMemberPanel
        index={0}
        state={buildCompareState(
          createMember({ ability: "Steadfast" }),
          createResolved(),
          [],
          [],
          "clear",
        )}
        speciesCatalog={[]}
        heldItemCatalog={[]}
        onChangeMember={onChangeMember}
      />,
    );

    await waitFor(() => {
      expect(onChangeMember).not.toHaveBeenCalled();
    });
  });

  it("clamps level input and renders empty ability options", async () => {
    const user = userEvent.setup();
    const onChangeMember = vi.fn();

    render(
      <CompareMemberPanel
        index={1}
        state={buildCompareState(
          createMember({ species: "", nickname: "", ability: "" }),
          undefined,
          [],
          [],
          "clear",
        )}
        speciesCatalog={[]}
        heldItemCatalog={[]}
        onChangeMember={onChangeMember}
      />,
    );

    await user.click(screen.getByText("input-30"));
    expect(onChangeMember).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ level: 100 }),
    );
  });

  it("renders null-safe comparison summary values and resistance buckets", () => {
    render(
      <ComparisonSummary
        left={
          {
            resolved: undefined,
            summaryStats: undefined,
            weaknesses: [],
            resistances: [{ attackType: "Electric", buckets: { x0: 1, "x0.25": 0, "x0.5": 0 } }],
          } as never
        }
        right={
          {
            resolved: undefined,
            summaryStats: undefined,
            weaknesses: [],
            resistances: [{ attackType: "Bug", buckets: { x0: 0, "x0.25": 0, "x0.5": 1 } }],
          } as never
        }
      />,
    );

    expect(screen.getByText("Electric-x0")).toBeTruthy();
    expect(screen.getByText("Bug-x0.5")).toBeTruthy();
    expect(screen.getAllByText("-")).not.toHaveLength(0);
  });
});
