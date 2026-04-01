import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  buildSummaryStats: vi.fn(),
}));

vi.mock("@/components/team/Radar", () => ({
  buildSummaryStats: mocked.buildSummaryStats,
  EffectiveStatsRadar: ({ level, nature }: { level: number; nature: string }) => (
    <div>{`radar-${level}-${nature}`}</div>
  ),
}));

vi.mock("@/components/team/RoleAxes", () => ({
  RoleAxesCard: ({ role }: { role: { roleLabel?: string } }) => (
    <div>{role.roleLabel ?? "role-card"}</div>
  ),
}));

vi.mock("@/components/team/UI", () => ({
  MetaBadge: ({ label }: { label: string }) => <div>{label}</div>,
  MiniPill: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SpreadInput: ({
    label,
    onChange,
    error,
  }: {
    label: string;
    onChange: (value: number) => void;
    error?: string;
  }) => (
    <div>
      <button
        type="button"
        aria-label={label}
        onClick={() => onChange(label === "HP" ? -5 : label === "ATK" ? 999 : 42)}
      >
        {label}
      </button>
      {error ? <span>{error}</span> : null}
    </div>
  ),
  StatBar: ({ label, value }: { label: string; value: number }) => (
    <div>{`${label}:${value}`}</div>
  ),
}));

import { StatsSection } from "@/components/team/editor/StatsSection";

function createMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    species: "Riolu",
    nickname: "Rio",
    locked: false,
    shiny: false,
    level: 20,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { hp: 12, atk: 14, def: 16, spa: 18, spd: 20, spe: 22 },
    evs: { hp: 40, atk: 50, def: 60, spa: 70, spd: 80, spe: 90 },
    ...overrides,
  };
}

describe("EditorStatsSection", () => {
  it("shows the empty fallback when there is no resolved species data", () => {
    mocked.buildSummaryStats.mockReset();

    render(
      <StatsSection
        member={createMember() as never}
        currentLevel={20}
        currentNature="Serious"
        currentAbility=""
        currentItem=""
        weather="clear"
        abilityCatalog={[]}
        itemCatalog={[]}
        hasEvolution={false}
        getIssue={() => undefined}
        updateEditorMember={vi.fn()}
      />,
    );

    expect(screen.getByText(/completa una especie válida/i)).toBeTruthy();
    expect(screen.queryByText(/bst/i)).toBeNull();
    expect(screen.getByText("EV 390/510")).toBeTruthy();
  });

  it("renders radar, role axes, summary bars, modifiers, and clamps iv/ev updates", async () => {
    mocked.buildSummaryStats.mockReset();
    mocked.buildSummaryStats.mockReturnValue({
      hp: 81,
      atk: 97,
      def: 75,
      spa: 88,
      spd: 70,
      spe: 101,
      bst: 512,
    });

    const user = userEvent.setup();
    const updateEditorMember = vi.fn();

    render(
      <StatsSection
        member={createMember() as never}
        resolved={
          {
            resolvedStats: {
              hp: 70,
              atk: 80,
              def: 65,
              spa: 75,
              spd: 60,
              spe: 90,
              bst: 440,
            },
            resolvedTypes: ["Fighting"],
            statModifiers: [
              { source: "Ability", stat: "atk", label: "Huge Power" },
            ],
            abilityDetails: { name: "Huge Power", effect: "Doubles Attack." },
            itemDetails: { name: "Choice Scarf", effect: "Boosts Speed." },
          } as never
        }
        roleRecommendation={{ roleLabel: "speed control" } as never}
        currentLevel={35}
        currentNature="Jolly"
        currentAbility="Huge Power"
        currentItem="Choice Scarf"
        weather="sun"
        abilityCatalog={[]}
        itemCatalog={[]}
        hasEvolution
        getIssue={(field) =>
          field === "evs"
            ? "Too many EVs"
            : field === "ivs.hp"
              ? "HP IV issue"
              : field === "evs.hp"
                ? "HP EV issue"
                : undefined
        }
        updateEditorMember={updateEditorMember}
      />,
    );

    expect(screen.getByText("BST 440")).toBeTruthy();
    expect(screen.getByText("radar-35-Jolly")).toBeTruthy();
    expect(screen.getByText("speed control")).toBeTruthy();
    expect(screen.getByText("Ability: Huge Power")).toBeTruthy();
    expect(screen.getByText("HP:81")).toBeTruthy();
    expect(screen.getByText("Spe:101")).toBeTruthy();
    expect(screen.getByText("Too many EVs")).toBeTruthy();
    expect(screen.getByText("HP IV issue")).toBeTruthy();
    expect(screen.getByText("HP EV issue")).toBeTruthy();
    expect(mocked.buildSummaryStats).toHaveBeenCalledWith(
      expect.objectContaining({ bst: 440 }),
      expect.any(Object),
      expect.any(Array),
    );

    await user.click(screen.getAllByRole("button", { name: "HP" })[0]!);
    let updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({
      ivs: expect.objectContaining({ hp: 0 }),
    });

    await user.click(screen.getAllByRole("button", { name: "ATK" })[0]!);
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({
      ivs: expect.objectContaining({ atk: 31 }),
    });

    await user.click(screen.getAllByRole("button", { name: "HP" }).at(-1)!);
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({
      evs: expect.objectContaining({ hp: 0 }),
    });

    await user.click(screen.getAllByRole("button", { name: "ATK" }).at(-1)!);
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({
      evs: expect.objectContaining({ atk: 252 }),
    });
  });
});
