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
            abilities?: string[];
            ability?: string;
          }
        | undefined,
      activeModalMember: undefined as
        | {
            key: string;
            species: string;
            spriteUrl: string;
            animatedSpriteUrl: string;
            nextEvolutions: string[];
            abilities?: string[];
            ability?: string;
          }
        | undefined,
      resolvedTeam: [] as Array<{
        key: string;
        species: string;
        spriteUrl: string;
        animatedSpriteUrl: string;
        nextEvolutions: string[];
        abilities?: string[];
        ability?: string;
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

  it("updates a compare slot by index", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderModalActions(deps as never);

    actions.updateCompareMember(1, { id: "c", species: "Lucario", moves: [], locked: true } as never);

    expect(spies.setCompareMembers).toHaveBeenCalledWith(expect.any(Function));
    const updater = spies.setCompareMembers.mock.calls[0]?.[0];
    expect(updater(deps.ui.compareMembers)).toEqual([
      deps.ui.compareMembers[0],
      { id: "c", species: "Lucario", moves: [], locked: true },
    ]);
  });

  it("opens and closes the move picker through direct member actions", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderModalActions(deps as never);

    actions.openMovePickerForMember("member-2", 3);
    actions.closeMovePicker();

    expect(spies.setMovePickerState).toHaveBeenNthCalledWith(1, {
      memberId: "member-2",
      slotIndex: 3,
    });
    expect(spies.setMoveModalTab).toHaveBeenCalledWith("levelUp");
    expect(spies.setExpandedMoveKey).toHaveBeenNthCalledWith(1, null);
    expect(spies.setMovePickerState).toHaveBeenNthCalledWith(2, null);
    expect(spies.setExpandedMoveKey).toHaveBeenNthCalledWith(2, null);
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

  it("ignores editor picker requests when there is no editor member", () => {
    const { deps, spies } = createDeps();
    deps.store.editorMemberId = null as never;

    const actions = useBuilderModalActions(deps as never);
    actions.openMovePickerForEditor(1);

    expect(spies.setMovePickerState).not.toHaveBeenCalled();
  });

  it("does nothing when trying to pick a move without an active picker state", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderModalActions(deps as never);

    actions.pickMove("Vine Whip");

    expect(spies.updateMember).not.toHaveBeenCalled();
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

  it("ignores editor evolution requests when there is no editable evolution target", () => {
    const { deps, spies } = createDeps();
    deps.store.editorMemberId = null as never;

    const actions = useBuilderModalActions(deps as never);
    actions.requestEvolution();

    expect(mocked.buildEvolutionEligibility).not.toHaveBeenCalled();
    expect(spies.setEvolutionState).not.toHaveBeenCalled();
  });

  it("builds evolution modal state from the editor member request", () => {
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
    actions.requestEvolution();

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

  it("uses resolvedTeam fallback for evolution requests and ignores fully ineligible results", () => {
    const { deps, spies } = createDeps();
    deps.derived.resolvedTeam = [
      {
        key: "member-2",
        species: "Pichu",
        spriteUrl: "pichu-sprite",
        animatedSpriteUrl: "pichu-animated",
        nextEvolutions: ["Pikachu"],
      },
    ];
    mocked.buildEvolutionEligibility.mockReturnValue([
      { species: "Pikachu", eligible: false, reasons: ["Friendship required"] },
    ] as never);

    const actions = useBuilderModalActions(deps as never);
    actions.requestEvolutionForMember("member-2");

    expect(mocked.buildEvolutionEligibility).toHaveBeenCalled();
    expect(spies.setEvolutionState).not.toHaveBeenCalled();
  });

  it("does nothing when requesting evolution for a member without known next evolutions", () => {
    const { deps, spies } = createDeps();
    deps.derived.resolvedTeam = [
      {
        key: "member-2",
        species: "Tauros",
        spriteUrl: "tauros-sprite",
        animatedSpriteUrl: "tauros-animated",
        nextEvolutions: [],
      },
    ];

    const actions = useBuilderModalActions(deps as never);
    actions.requestEvolutionForMember("member-2");

    expect(spies.setEvolutionState).not.toHaveBeenCalled();
  });

  it("updates and clears evolution modal state", () => {
    const { deps, spies } = createDeps();
    deps.ui.evolutionState = {
      memberId: "member-1",
      currentSpecies: "Snivy",
      nextOptions: [],
      selectedNext: "Servine",
    };

    const actions = useBuilderModalActions(deps as never);
    actions.selectEvolution("Serperior");
    actions.cancelEvolution();

    expect(spies.setEvolutionState).toHaveBeenNthCalledWith(1, expect.any(Function));
    const updater = spies.setEvolutionState.mock.calls[0]?.[0];
    expect(updater(deps.ui.evolutionState)).toEqual({
      ...deps.ui.evolutionState,
      selectedNext: "Serperior",
    });
    expect(spies.setEvolutionState).toHaveBeenNthCalledWith(2, null);
  });

  it("ignores confirmEvolution when there is no active evolution state", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderModalActions(deps as never);

    actions.confirmEvolution("Lucario");

    expect(spies.updateMember).not.toHaveBeenCalled();
    expect(spies.setEvolvingIds).not.toHaveBeenCalled();
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
      currentSpecies: "Riolu",
      nextOptions: [],
      selectedNext: "Lucario",
    };

    const actions = useBuilderModalActions(deps as never);
    actions.confirmEvolution("Lucario");

    expect(spies.setEvolvingIds).toHaveBeenCalled();
    expect(spies.updateMember).toHaveBeenCalledWith("member-1", expect.any(Function));
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

  it("uses active modal fallback and preserves the current ability when no indexed match exists", () => {
    vi.useFakeTimers();
    const { deps, spies } = createDeps();
    deps.derived.activeModalMember = {
      key: "member-2",
      species: "Eevee",
      spriteUrl: "eevee-sprite",
      animatedSpriteUrl: "eevee-animated",
      nextEvolutions: ["Umbreon"],
      abilities: ["Run Away"],
      ability: "Adaptability",
    } as never;
    deps.ui.evolutionState = {
      memberId: "member-2",
      currentSpecies: "Eevee",
      nextOptions: [],
      selectedNext: "Umbreon",
    };
    mocked.resolvePokemonProfile.mockReturnValue({
      abilities: ["Synchronize"],
    });

    const actions = useBuilderModalActions(deps as never);
    actions.confirmEvolution("Umbreon");

    const updater = spies.updateMember.mock.calls[0]?.[1];
    expect(
      updater({
        species: "Eevee",
        ability: "Adaptability",
      }),
    ).toMatchObject({
      species: "Umbreon",
      ability: "Synchronize",
    });

    vi.runAllTimers();
    vi.useRealTimers();
  });
});
