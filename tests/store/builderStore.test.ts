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

  it("does not save the same member to pc twice", () => {
    const member = useBuilderStore.getState().run.roster.pokemonLibrary[0]!;

    expect(useBuilderStore.getState().saveMemberToPc(member)).toBe(false);
    expect(
      useBuilderStore.getState().run.roster.pokemonLibrary.filter((entry) => entry.id === member.id),
    ).toHaveLength(1);
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
});
