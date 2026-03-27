import { beforeEach, describe, expect, it } from "vitest";

import { createEditable, useBuilderStore } from "../../lib/builderStore";
import { createEmptyRunState } from "../../lib/runState";

describe("builderStore updateMember", () => {
  beforeEach(() => {
    const member = createEditable("Snivy");
    member.moves = ["Tackle"];

    const run = createEmptyRunState();
    run.roster.pokemonLibrary = [member];
    run.roster.currentTeam = [member];
    run.roster.compositions = [
      { id: "main-team", name: "Main Team", memberIds: [member.id] },
    ];
    run.roster.activeCompositionId = "main-team";
    run.roster.activeMemberId = member.id;
    run.roster.editorMemberId = member.id;

    useBuilderStore.setState({
      hydrated: true,
      run,
    });
  });

  it("keeps currentTeam in sync when updating a member from pokemonLibrary", () => {
    const memberId = useBuilderStore.getState().run.roster.currentTeam[0]?.id;
    expect(memberId).toBeTruthy();

    useBuilderStore.getState().updateMember(memberId!, (member) => ({
      ...member,
      moves: [...member.moves, "Vine Whip"],
    }));

    const roster = useBuilderStore.getState().run.roster;
    expect(roster.pokemonLibrary[0]?.moves).toEqual(["Tackle", "Vine Whip"]);
    expect(roster.currentTeam[0]?.moves).toEqual(["Tackle", "Vine Whip"]);
  });

  it("ignores updates for unknown members", () => {
    const before = useBuilderStore.getState().run.roster.pokemonLibrary[0];

    useBuilderStore.getState().updateMember("missing-id", (member) => ({
      ...member,
      nickname: "Ghost",
    }));

    expect(useBuilderStore.getState().run.roster.pokemonLibrary[0]).toEqual(before);
  });

  it("adds a pc member back into the active composition", () => {
    const roster = useBuilderStore.getState().run.roster;
    const bench = createEditable("Purrloin");
    useBuilderStore.setState({
      hydrated: true,
      run: {
        ...useBuilderStore.getState().run,
        roster: {
          ...roster,
          pokemonLibrary: [...roster.pokemonLibrary, bench],
          pcBoxIds: [bench.id],
        },
      },
    });

    const restored = useBuilderStore.getState().restoreMemberFromPc(bench.id);
    const nextRoster = useBuilderStore.getState().run.roster;

    expect(restored).toBe(true);
    expect(nextRoster.pcBoxIds).not.toContain(bench.id);
    expect(nextRoster.compositions[0]?.memberIds).toContain(bench.id);
    expect(nextRoster.activeMemberId).toBe(bench.id);
  });

  it("moves a member to pc only when the composition would still have another member", () => {
    const first = useBuilderStore.getState().run.roster.currentTeam[0]!;
    const second = createEditable("Purrloin");
    second.moves = ["Scratch"];

    const run = useBuilderStore.getState().run;
    useBuilderStore.setState({
      hydrated: true,
      run: {
        ...run,
        roster: {
          ...run.roster,
          pokemonLibrary: [...run.roster.pokemonLibrary, second],
          currentTeam: [...run.roster.currentTeam, second],
          compositions: [
            {
              ...run.roster.compositions[0]!,
              memberIds: [first.id, second.id],
            },
          ],
        },
      },
    });

    expect(useBuilderStore.getState().moveMemberToPc(first.id)).toBe(true);
    expect(useBuilderStore.getState().run.roster.pcBoxIds).toContain(first.id);

    expect(useBuilderStore.getState().moveMemberToPc(second.id)).toBe(false);
  });

  it("creates and activates a new empty composition", () => {
    const compositionId = useBuilderStore.getState().createComposition("Speed Control");
    const roster = useBuilderStore.getState().run.roster;
    const created = roster.compositions.find((composition) => composition.id === compositionId);

    expect(created).toMatchObject({
      id: compositionId,
      name: "Speed Control",
      memberIds: [],
    });
    expect(roster.activeCompositionId).toBe(compositionId);
    expect(roster.activeMemberId).toBeNull();
    expect(roster.editorMemberId).toBeNull();
  });

  it("renames a composition and ignores blank names", () => {
    const compositionId = useBuilderStore.getState().run.roster.compositions[0]!.id;

    useBuilderStore.getState().renameComposition(compositionId, "Balance");
    expect(useBuilderStore.getState().run.roster.compositions[0]?.name).toBe("Balance");

    useBuilderStore.getState().renameComposition(compositionId, "   ");
    expect(useBuilderStore.getState().run.roster.compositions[0]?.name).toBe("Balance");
  });

  it("only changes the active composition when the target exists", () => {
    const newId = useBuilderStore.getState().createComposition("Pivots");

    useBuilderStore.getState().setActiveCompositionId(newId);
    expect(useBuilderStore.getState().run.roster.activeCompositionId).toBe(newId);

    useBuilderStore.getState().setActiveCompositionId("missing");
    expect(useBuilderStore.getState().run.roster.activeCompositionId).toBe(newId);
  });

  it("adds a library member to the active composition and removes it from pc", () => {
    const roster = useBuilderStore.getState().run.roster;
    const bench = createEditable("Zorua");
    useBuilderStore.setState({
      hydrated: true,
      run: {
        ...useBuilderStore.getState().run,
        roster: {
          ...roster,
          pokemonLibrary: [...roster.pokemonLibrary, bench],
          pcBoxIds: [bench.id],
        },
      },
    });

    const added = useBuilderStore.getState().addLibraryMemberToComposition(bench.id);
    const nextRoster = useBuilderStore.getState().run.roster;

    expect(added).toBe(true);
    expect(nextRoster.compositions[0]?.memberIds).toContain(bench.id);
    expect(nextRoster.pcBoxIds).not.toContain(bench.id);
    expect(nextRoster.activeMemberId).toBe(bench.id);
    expect(nextRoster.editorMemberId).toBe(bench.id);
  });

  it("rejects invalid or duplicate composition inserts", () => {
    const roster = useBuilderStore.getState().run.roster;
    const mainId = roster.compositions[0]!.id;
    const memberId = roster.currentTeam[0]!.id;

    expect(useBuilderStore.getState().addLibraryMemberToComposition("missing")).toBe(false);
    expect(useBuilderStore.getState().addLibraryMemberToComposition(memberId, "missing-team")).toBe(false);
    expect(useBuilderStore.getState().addLibraryMemberToComposition(memberId, mainId)).toBe(false);

    const extraMembers = Array.from({ length: 5 }, (_, index) => createEditable(`Bench${index + 1}`));
    useBuilderStore.setState({
      hydrated: true,
      run: {
        ...useBuilderStore.getState().run,
        roster: {
          ...roster,
          pokemonLibrary: [...roster.pokemonLibrary, ...extraMembers],
          currentTeam: [roster.currentTeam[0]!, ...extraMembers],
          compositions: [
            {
              ...roster.compositions[0]!,
              memberIds: [memberId, ...extraMembers.map((member) => member.id)],
            },
          ],
        },
      },
    });

    const overflowMember = createEditable("Overflow");
    useBuilderStore.setState({
      hydrated: true,
      run: {
        ...useBuilderStore.getState().run,
        roster: {
          ...useBuilderStore.getState().run.roster,
          pokemonLibrary: [...useBuilderStore.getState().run.roster.pokemonLibrary, overflowMember],
          pcBoxIds: [overflowMember.id],
        },
      },
    });

    expect(useBuilderStore.getState().addLibraryMemberToComposition(overflowMember.id)).toBe(false);
  });

  it("does not save the same member to pc twice", () => {
    const member = useBuilderStore.getState().run.roster.pokemonLibrary[0]!;

    expect(useBuilderStore.getState().saveMemberToPc(member)).toBe(false);
    expect(
      useBuilderStore.getState().run.roster.pokemonLibrary.filter((entry) => entry.id === member.id),
    ).toHaveLength(1);
  });

  it("saves a new normalized member to pc once", () => {
    const member = {
      ...createEditable("Metang"),
      locked: undefined as never,
      shiny: undefined as never,
      gender: "robot" as never,
    };

    expect(useBuilderStore.getState().saveMemberToPc(member)).toBe(true);
    expect(useBuilderStore.getState().run.roster.pcBoxIds).toContain(member.id);
    expect(useBuilderStore.getState().run.roster.pokemonLibrary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: member.id,
          gender: "unknown",
          locked: false,
          shiny: false,
        }),
      ]),
    );
  });

  it("toggles encounter completion and updates preferences", () => {
    const store = useBuilderStore.getState();

    store.toggleEncounterCompleted("enc-1");
    expect(useBuilderStore.getState().run.progress.completedEncounterIds).toContain("enc-1");

    store.toggleEncounterCompleted("enc-1");
    expect(useBuilderStore.getState().run.progress.completedEncounterIds).not.toContain("enc-1");

    store.setEvolutionConstraint("gender", false);
    expect(useBuilderStore.getState().run.preferences.evolutionConstraints.gender).toBe(false);

    store.setRecommendationFilter("excludeLegendaries", true);
    expect(useBuilderStore.getState().run.preferences.recommendationFilters.excludeLegendaries).toBe(true);

    store.setBattleWeather("rain");
    expect(useBuilderStore.getState().run.preferences.battleWeather).toBe("rain");
  });

  it("tracks and resets hack events, then resets the run", () => {
    const store = useBuilderStore.getState();

    store.setHackEvent("gift-claimed", true);
    expect(useBuilderStore.getState().run.progress.flags).toEqual({ "gift-claimed": true });

    store.resetHackEvents();
    expect(useBuilderStore.getState().run.progress.flags).toEqual({});

    store.resetRun();
    expect(useBuilderStore.getState().run.roster.currentTeam).toEqual([]);
    expect(useBuilderStore.getState().run.roster.pcBoxIds).toEqual([]);
  });

  it("updates simple top-level run state setters", () => {
    const store = useBuilderStore.getState();

    store.setHydrated(false);
    expect(useBuilderStore.getState().hydrated).toBe(false);

    store.setBuilderStarted(true);
    expect(useBuilderStore.getState().run.started).toBe(true);

    store.setStarter("tepig");
    expect(useBuilderStore.getState().run.starter).toBe("tepig");

    store.setMilestoneId("castelia");
    expect(useBuilderStore.getState().run.progress.milestoneId).toBe("castelia");

    const activeMemberId = useBuilderStore.getState().run.roster.currentTeam[0]!.id;
    store.setActiveMemberId(activeMemberId);
    store.setEditorMemberId(activeMemberId);
    expect(useBuilderStore.getState().run.roster.activeMemberId).toBe(activeMemberId);
    expect(useBuilderStore.getState().run.roster.editorMemberId).toBe(activeMemberId);
  });

  it("begins a run with a locked lead and trimmed nickname", () => {
    useBuilderStore.getState().beginRun("tepig", "Tepig", "  Bacon  ");

    const state = useBuilderStore.getState().run;
    const lead = state.roster.currentTeam[0];

    expect(state.started).toBe(true);
    expect(state.starter).toBe("tepig");
    expect(lead).toMatchObject({
      species: "Tepig",
      nickname: "Bacon",
      locked: true,
    });
    expect(state.roster.pokemonLibrary).toHaveLength(1);
    expect(state.roster.activeMemberId).toBe(lead?.id);
  });

  it("normalizes members when replacing the current team", () => {
    const first = createEditable("Riolu");
    const second = createEditable("Magnemite");

    useBuilderStore.getState().setCurrentTeam([
      {
        ...first,
        locked: undefined as never,
        shiny: undefined as never,
        gender: "robot" as never,
      },
      {
        ...second,
        nickname: "Mag",
        gender: "female",
      },
    ]);

    const roster = useBuilderStore.getState().run.roster;

    expect(roster.currentTeam).toEqual([
      expect.objectContaining({
        id: first.id,
        locked: false,
        shiny: false,
        gender: "unknown",
      }),
      expect.objectContaining({
        id: second.id,
        nickname: "Mag",
        gender: "female",
      }),
    ]);
    expect(roster.compositions[0]?.memberIds).toEqual([first.id, second.id]);
    expect(roster.pokemonLibrary.map((member) => member.id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );
  });

  it("migrates persisted run state and maps excludeUniqueEncounters into excludeUniquePokemon", () => {
    const migrate = (useBuilderStore.persist as any).getOptions().migrate as (state: unknown) => unknown;
    const member = {
      ...createEditable("Snivy"),
      gender: "???",
      locked: undefined as never,
      shiny: undefined as never,
    };

    const migrated = migrate({
      run: {
        ...createEmptyRunState(),
        roster: {
          pokemonLibrary: [member],
          compositions: [{ id: "", name: "   ", memberIds: [member.id] }],
          activeCompositionId: "missing",
          pcBoxIds: [member.id, member.id],
          currentTeam: [member],
          activeMemberId: "missing-member",
          editorMemberId: "missing-member",
        },
        progress: {
          ...createEmptyRunState().progress,
          flags: undefined,
          completedEncounterIds: undefined,
        },
        preferences: {
          ...createEmptyRunState().preferences,
          recommendationFilters: {
            excludeUniqueEncounters: true,
          } as any,
          battleWeather: undefined as any,
        },
      },
    }) as { hydrated: boolean; run: ReturnType<typeof createEmptyRunState> };

    expect(migrated.hydrated).toBeUndefined();
    expect(migrated.run.preferences.recommendationFilters.excludeUniquePokemon).toBe(true);
    expect(migrated.run.preferences.battleWeather).toBe(
      createEmptyRunState().preferences.battleWeather,
    );
    expect(migrated.run.progress.completedEncounterIds).toEqual([]);
    expect(migrated.run.progress.flags).toEqual({});
    expect(migrated.run.roster.compositions[0]?.name).toBe("Team 1");
    expect(migrated.run.roster.activeCompositionId).toBe(migrated.run.roster.compositions[0]?.id);
    expect(migrated.run.roster.currentTeam[0]).toMatchObject({
      id: member.id,
      gender: "unknown",
      locked: false,
      shiny: false,
    });
    expect(migrated.run.roster.activeMemberId).toBe(member.id);
    expect(migrated.run.roster.editorMemberId).toBeNull();
  });

  it("migrates the legacy flat state shape into a normalized run", () => {
    const migrate = (useBuilderStore.persist as any).getOptions().migrate as (state: unknown) => unknown;
    const member = {
      ...createEditable("Oshawott"),
      locked: undefined as never,
      shiny: undefined as never,
      gender: "weird" as never,
    };

    const migrated = migrate({
      builderStarted: true,
      starter: "oshawott",
      milestoneId: "virbank",
      currentTeam: [member],
      activeMemberId: member.id,
      editorMemberId: member.id,
      hackEvents: { lighthouse: true },
    }) as { hydrated: boolean; run: ReturnType<typeof createEmptyRunState> };

    expect(migrated.hydrated).toBe(false);
    expect(migrated.run.started).toBe(true);
    expect(migrated.run.starter).toBe("oshawott");
    expect(migrated.run.progress.milestoneId).toBe("virbank");
    expect(migrated.run.progress.flags).toEqual({ lighthouse: true });
    expect(migrated.run.roster.currentTeam[0]).toMatchObject({
      id: member.id,
      species: "Oshawott",
      gender: "unknown",
      locked: false,
      shiny: false,
    });
    expect(migrated.run.roster.compositions).toHaveLength(1);
    expect(migrated.run.roster.compositions[0]?.memberIds).toEqual([member.id]);
  });

  it("returns the default empty state when migrating an undefined snapshot", () => {
    const migrate = (useBuilderStore.persist as any).getOptions().migrate as (state: unknown) => unknown;

    const migrated = migrate(undefined) as { hydrated: boolean; run: ReturnType<typeof createEmptyRunState> };

    expect(migrated.hydrated).toBe(false);
    expect(migrated.run.started).toBe(false);
    expect(migrated.run.starter).toBe("snivy");
    expect(migrated.run.roster.currentTeam).toEqual([]);
    expect(migrated.run.roster.pcBoxIds).toEqual([]);
    expect(migrated.run.roster.compositions).toHaveLength(1);
    expect(migrated.run.roster.compositions[0]).toMatchObject({
      name: "Main Team",
      memberIds: [],
    });
    expect(migrated.run.roster.activeCompositionId).toBe(migrated.run.roster.compositions[0]?.id);
  });

  it("creates a fallback composition from the current team when persisted compositions are missing", () => {
    const migrate = (useBuilderStore.persist as any).getOptions().migrate as (state: unknown) => unknown;
    const member = {
      ...createEditable("Servine"),
      locked: undefined as never,
      shiny: undefined as never,
      gender: "mystery" as never,
    };

    const migrated = migrate({
      run: {
        ...createEmptyRunState(),
        roster: {
          pokemonLibrary: [member],
          currentTeam: [member],
          compositions: undefined,
          activeCompositionId: null,
          pcBoxIds: [],
          activeMemberId: null,
          editorMemberId: member.id,
        },
      },
    }) as { run: ReturnType<typeof createEmptyRunState> };

    expect(migrated.run.roster.compositions).toHaveLength(1);
    expect(migrated.run.roster.compositions[0]).toMatchObject({
      name: "Main Team",
      memberIds: [member.id],
    });
    expect(migrated.run.roster.activeCompositionId).toBe(migrated.run.roster.compositions[0]?.id);
    expect(migrated.run.roster.currentTeam[0]).toMatchObject({
      id: member.id,
      gender: "unknown",
      locked: false,
      shiny: false,
    });
    expect(migrated.run.roster.editorMemberId).toBe(member.id);
  });

  it("rejects invalid pc restore and move operations", () => {
    const roster = useBuilderStore.getState().run.roster;
    const mainMemberId = roster.currentTeam[0]!.id;
    const bench = createEditable("Purrloin");

    useBuilderStore.setState({
      hydrated: true,
      run: {
        ...useBuilderStore.getState().run,
        roster: {
          ...roster,
          pokemonLibrary: [...roster.pokemonLibrary, bench],
          pcBoxIds: [bench.id],
        },
      },
    });

    expect(useBuilderStore.getState().restoreMemberFromPc("missing-id")).toBe(false);
    expect(useBuilderStore.getState().restoreMemberFromPc(bench.id, "missing-team")).toBe(false);
    expect(useBuilderStore.getState().moveMemberToPc("missing-id")).toBe(false);

    useBuilderStore.setState({
      hydrated: true,
      run: {
        ...useBuilderStore.getState().run,
        roster: {
          ...useBuilderStore.getState().run.roster,
          compositions: [
            {
              ...useBuilderStore.getState().run.roster.compositions[0]!,
              memberIds: [mainMemberId, bench.id],
            },
          ],
        },
      },
    });

    expect(useBuilderStore.getState().restoreMemberFromPc(bench.id)).toBe(false);
  });
});
