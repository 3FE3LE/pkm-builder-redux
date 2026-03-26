import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  buildEvolutionEligibility: vi.fn(() => []),
  buildSpriteUrls: vi.fn((species: string) => ({
    spriteUrl: `${species}-sprite`,
    animatedSpriteUrl: `${species}-animated`,
  })),
  resolvePokemonProfile: vi.fn(() => ({
    abilities: ["Steadfast", "Inner Focus"],
  })),
}));

vi.mock("@/lib/domain/evolutionEligibility", () => ({
  buildEvolutionEligibility: mocked.buildEvolutionEligibility,
}));

vi.mock("@/lib/domain/names", () => ({
  buildSpriteUrls: mocked.buildSpriteUrls,
  normalizeName: (value: string) => value.toLowerCase(),
}));

vi.mock("@/lib/teamAnalysis", () => ({
  resolvePokemonProfile: mocked.resolvePokemonProfile,
}));

import { useBuilderModalActions } from "@/hooks/useBuilderModalActions";

function createDeps() {
  const updateMember = vi.fn();
  const setMovePickerState = vi.fn();
  const setMoveModalTab = vi.fn();
  const setExpandedMoveKey = vi.fn();
  const setEvolutionState = vi.fn();
  const setEvolvingIds = vi.fn();
  const setCompareMembers = vi.fn();

  const deps = {
    data: {
      speciesCatalog: [{ name: "Servine", dex: 496 }],
      docs: {},
      pokemonIndex: {},
    },
    store: {
      editorMemberId: "member-1",
      evolutionConstraints: { level: true, gender: true, timeOfDay: true },
      updateMember,
    },
    ui: {
      compareMembers: [
        { id: "a", species: "", moves: [], locked: false },
        { id: "b", species: "", moves: [], locked: false },
      ],
      movePickerState: null as { memberId: string; slotIndex: number | null } | null,
      localTime: { ready: true, period: "day", label: "12:00 PM" },
      evolutionState: null as {
        memberId: string;
        currentSpecies: string;
        nextOptions: unknown[];
        selectedNext: string | null;
      } | null,
      setCompareMembers,
      setMovePickerState,
      setMoveModalTab,
      setExpandedMoveKey,
      setEvolutionState,
      setEvolvingIds,
    },
    derived: {
      editorResolved: undefined as
        | {
            key: string;
            species: string;
            spriteUrl: string;
            animatedSpriteUrl: string;
            nextEvolutions: string[];
          }
        | undefined,
      activeModalMember: undefined as
        | {
            key: string;
            species: string;
            spriteUrl: string;
            animatedSpriteUrl: string;
            nextEvolutions: string[];
          }
        | undefined,
      resolvedTeam: [] as Array<{
        key: string;
        species: string;
        spriteUrl: string;
        animatedSpriteUrl: string;
        nextEvolutions: string[];
      }>,
    },
  };

  return {
    deps,
    spies: {
      updateMember,
      setMovePickerState,
      setMoveModalTab,
      setExpandedMoveKey,
      setEvolutionState,
      setEvolvingIds,
      setCompareMembers,
    },
  };
}

describe("useBuilderModalActions", () => {
  beforeEach(() => {
    mocked.buildEvolutionEligibility.mockReset();
    mocked.buildSpriteUrls.mockClear();
    mocked.resolvePokemonProfile.mockClear();
    mocked.resolvePokemonProfile.mockReturnValue({
      abilities: ["Steadfast", "Inner Focus"],
    });
  });

  it("opens the move picker for the editor member and resets modal UI state", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderModalActions(deps as never);

    actions.openMovePickerForEditor(2);

    expect(spies.setMovePickerState).toHaveBeenCalledWith({
      memberId: "member-1",
      slotIndex: 2,
    });
    expect(spies.setMoveModalTab).toHaveBeenCalledWith("levelUp");
    expect(spies.setExpandedMoveKey).toHaveBeenCalledWith(null);
  });

  it("only closes the picker after a move is actually applied", () => {
    const { deps, spies } = createDeps();
    deps.ui.movePickerState = { memberId: "member-1", slotIndex: null };
    spies.updateMember.mockImplementation((_memberId, updater) => {
      updater({ moves: ["Tackle"] });
    });

    const actions = useBuilderModalActions(deps as never);
    actions.pickMove("Vine Whip");

    expect(spies.updateMember).toHaveBeenCalled();
    expect(spies.setMovePickerState).toHaveBeenCalledWith(null);
    expect(spies.setExpandedMoveKey).toHaveBeenCalledWith(null);
  });

  it("keeps the picker open when the move selection is rejected", () => {
    const { deps, spies } = createDeps();
    deps.ui.movePickerState = { memberId: "member-1", slotIndex: null };
    spies.updateMember.mockImplementation((_memberId, updater) => {
      updater({ moves: ["Tackle"] });
    });

    const actions = useBuilderModalActions(deps as never);
    actions.pickMove("Tackle");

    expect(spies.updateMember).toHaveBeenCalled();
    expect(spies.setMovePickerState).not.toHaveBeenCalledWith(null);
  });

  it("builds evolution modal state from an eligible next evolution", () => {
    const { deps, spies } = createDeps();
    deps.derived.editorResolved = {
      key: "member-1",
      species: "Snivy",
      spriteUrl: "snivy-sprite",
      animatedSpriteUrl: "snivy-animated",
      nextEvolutions: ["Servine"],
    };
    deps.derived.resolvedTeam = [deps.derived.editorResolved];
    mocked.buildEvolutionEligibility.mockReturnValue([
      { species: "Servine", eligible: true, reasons: [] },
    ] as never);

    const actions = useBuilderModalActions(deps as never);
    actions.requestEvolutionForMember("member-1");

    expect(mocked.buildEvolutionEligibility).toHaveBeenCalled();
    expect(spies.setEvolutionState).toHaveBeenCalledWith({
      memberId: "member-1",
      currentSpecies: "Snivy",
      currentSpriteUrl: "snivy-sprite",
      currentAnimatedSpriteUrl: "snivy-animated",
      nextOptions: [
        {
          species: "Servine",
          spriteUrl: "Servine-sprite",
          animatedSpriteUrl: "Servine-animated",
          eligible: true,
          reasons: [],
        },
      ],
      selectedNext: "Servine",
    });
  });

  it("confirms an evolution and clears the evolving flag after the timeout", () => {
    vi.useFakeTimers();
    const { deps, spies } = createDeps();
    deps.derived.editorResolved = {
      key: "member-1",
      species: "Riolu",
      spriteUrl: "riolu-sprite",
      animatedSpriteUrl: "riolu-animated",
      nextEvolutions: ["Lucario"],
      abilities: ["Prankster", "Steadfast"],
      ability: "Prankster",
    } as never;
    deps.ui.evolutionState = {
      memberId: "member-1",
      currentSpecies: "Snivy",
      nextOptions: [],
      selectedNext: "Servine",
    };

    const actions = useBuilderModalActions(deps as never);
    actions.confirmEvolution("Lucario");

    expect(spies.setEvolvingIds).toHaveBeenCalled();
    expect(spies.updateMember).toHaveBeenCalledWith(
      "member-1",
      expect.any(Function),
    );
    const updater = spies.updateMember.mock.calls[0]?.[1];
    expect(
      updater({
        species: "Riolu",
        ability: "Prankster",
      }),
    ).toMatchObject({
      species: "Lucario",
      ability: "Steadfast",
    });
    expect(spies.setEvolutionState).toHaveBeenCalledWith(null);

    vi.runAllTimers();

    expect(spies.setEvolvingIds).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
