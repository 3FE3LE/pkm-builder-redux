import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBuilderTeamActions } from "@/hooks/useBuilderTeamActions";
import type { EditableMember } from "@/lib/builderStore";

function createMember(id: string, species: string, moves: string[] = []): EditableMember {
  return {
    id,
    species,
    nickname: species,
    locked: false,
    shiny: false,
    level: 5,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves,
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  };
}

function createDeps() {
  const setCurrentTeam = vi.fn();
  const setActiveMemberId = vi.fn();
  const setEditorMemberId = vi.fn();
  const moveMemberToPc = vi.fn(() => true);
  const saveMemberToPc = vi.fn(() => true);
  const updateMember = vi.fn();
  const setBuilderStarted = vi.fn();
  const setEditorMoveSelection = vi.fn();

  const deps: {
    store: {
      currentTeam: EditableMember[];
      activeMemberId: string | null;
      editorMemberId: string | null;
      setCurrentTeam: typeof setCurrentTeam;
      setActiveMemberId: typeof setActiveMemberId;
      setEditorMemberId: typeof setEditorMemberId;
      moveMemberToPc: typeof moveMemberToPc;
      saveMemberToPc: typeof saveMemberToPc;
      updateMember: typeof updateMember;
      setBuilderStarted: typeof setBuilderStarted;
    };
    ui: {
      editorMoveSelection: number | null;
      setEditorMoveSelection: typeof setEditorMoveSelection;
    };
  } = {
    store: {
      currentTeam: [createMember("1", "Snivy"), createMember("2", "Riolu", ["Quick Attack", "Counter"])],
      activeMemberId: "1",
      editorMemberId: "2",
      setCurrentTeam,
      setActiveMemberId,
      setEditorMemberId,
      moveMemberToPc,
      saveMemberToPc,
      updateMember,
      setBuilderStarted,
    },
    ui: {
      editorMoveSelection: 1,
      setEditorMoveSelection,
    },
  };

  return {
    deps,
    spies: {
      setCurrentTeam,
      setActiveMemberId,
      setEditorMemberId,
      moveMemberToPc,
      saveMemberToPc,
      updateMember,
      setBuilderStarted,
      setEditorMoveSelection,
    },
  };
}

describe("useBuilderTeamActions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses the pending empty slot instead of creating a new member", () => {
    const { deps, spies } = createDeps();
    deps.store.currentTeam = [createMember("pending", ""), createMember("2", "Riolu")];

    const actions = useBuilderTeamActions(deps as never);
    const memberId = actions.addMember();

    expect(memberId).toBe("pending");
    expect(spies.setCurrentTeam).not.toHaveBeenCalled();
    expect(spies.setActiveMemberId).toHaveBeenCalledWith("pending");
    expect(spies.setEditorMemberId).toHaveBeenCalledWith("pending");
  });

  it("creates a new empty member when there is room and no pending slot", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    const memberId = actions.addMember();

    expect(typeof memberId).toBe("string");
    expect(spies.setCurrentTeam).toHaveBeenCalledWith(expect.any(Function));
    const updater = spies.setCurrentTeam.mock.calls[0]?.[0];
    const nextTeam = updater(deps.store.currentTeam);
    expect(nextTeam).toHaveLength(3);
    expect(nextTeam[2]).toEqual(
      expect.objectContaining({
        id: memberId,
        species: "",
        nickname: "",
      }),
    );
    expect(spies.setActiveMemberId).toHaveBeenCalledWith(memberId);
    expect(spies.setEditorMemberId).toHaveBeenCalledWith(memberId);
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(null);
  });

  it("does not create a member when the roster is already full", () => {
    const { deps, spies } = createDeps();
    deps.store.currentTeam = [
      createMember("1", "A"),
      createMember("2", "B"),
      createMember("3", "C"),
      createMember("4", "D"),
      createMember("5", "E"),
      createMember("6", "F"),
    ];

    const actions = useBuilderTeamActions(deps as never);

    expect(actions.addMember()).toBeNull();
    expect(spies.setCurrentTeam).not.toHaveBeenCalled();
  });

  it("adds a prepared member to pc when the active team is full", () => {
    const { deps, spies } = createDeps();
    deps.store.currentTeam = [
      createMember("1", "A"),
      createMember("2", "B"),
      createMember("3", "C"),
      createMember("4", "D"),
      createMember("5", "E"),
      createMember("6", "F"),
    ];

    const actions = useBuilderTeamActions(deps as never);
    const result = actions.addPreparedMember(createMember("7", "G"));

    expect(result).toEqual({ ok: true, reason: "pc" });
    expect(spies.saveMemberToPc).toHaveBeenCalled();
    expect(spies.setCurrentTeam).not.toHaveBeenCalled();
  });

  it("returns full when the roster is full and the member could not be saved to pc", () => {
    const { deps, spies } = createDeps();
    deps.store.currentTeam = [
      createMember("1", "A"),
      createMember("2", "B"),
      createMember("3", "C"),
      createMember("4", "D"),
      createMember("5", "E"),
      createMember("6", "F"),
    ];
    spies.saveMemberToPc.mockReturnValue(false);

    const actions = useBuilderTeamActions(deps as never);
    const result = actions.addPreparedMember(createMember("7", "G"));

    expect(result).toEqual({ ok: false, reason: "full" });
  });

  it("rejects adding a duplicate prepared species to the current team", () => {
    const { deps, spies } = createDeps();

    const actions = useBuilderTeamActions(deps as never);
    const result = actions.addPreparedMember(createMember("3", "snivy"));

    expect(result).toEqual({ ok: false, reason: "duplicate" });
    expect(spies.setCurrentTeam).not.toHaveBeenCalled();
  });

  it("adds a prepared member directly to the team when there is room and no duplicate", () => {
    const { deps, spies } = createDeps();
    const member = createMember("3", "Magnemite");

    const actions = useBuilderTeamActions(deps as never);
    const result = actions.addPreparedMember(member);

    expect(result).toEqual({ ok: true, reason: null });
    expect(spies.setCurrentTeam).toHaveBeenCalledWith(expect.any(Function));
    const updater = spies.setCurrentTeam.mock.calls[0]?.[0];
    expect(updater(deps.store.currentTeam)).toEqual([...deps.store.currentTeam, member]);
    expect(spies.setActiveMemberId).toHaveBeenCalledWith(member.id);
    expect(spies.setEditorMemberId).toHaveBeenCalledWith(member.id);
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(null);
  });

  it("handles drag end reorder and ignores invalid drag endings", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.handleDragEnd({
      active: { id: "1" },
      over: null,
    } as never);
    actions.handleDragEnd({
      active: { id: "1" },
      over: { id: "1" },
    } as never);

    expect(spies.setCurrentTeam).not.toHaveBeenCalled();

    actions.handleDragEnd({
      active: { id: "1" },
      over: { id: "2" },
    } as never);

    expect(spies.setCurrentTeam).toHaveBeenCalledWith(expect.any(Function));
    const updater = spies.setCurrentTeam.mock.calls[0]?.[0];
    expect(updater(deps.store.currentTeam).map((member: EditableMember) => member.id)).toEqual(["2", "1"]);
  });

  it("toggles member selection and supports clearing it explicitly", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.selectMember("1");
    actions.selectMember("2");
    actions.clearSelection();

    expect(spies.setActiveMemberId).toHaveBeenNthCalledWith(1, null);
    expect(spies.setActiveMemberId).toHaveBeenNthCalledWith(2, "2");
    expect(spies.setActiveMemberId).toHaveBeenNthCalledWith(3, null);
  });

  it("opens the editor for a specific member", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.editMember("2");

    expect(spies.setActiveMemberId).toHaveBeenCalledWith("2");
    expect(spies.setEditorMemberId).toHaveBeenCalledWith("2");
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(null);
  });

  it("removes the selected move slot and clears the editor selection when needed", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.removeMoveAtForMember("2", 1);

    expect(spies.updateMember).toHaveBeenCalledWith("2", expect.any(Function));
    const updater = spies.updateMember.mock.calls[0]?.[1];
    expect(updater(createMember("2", "Riolu", ["Quick Attack", "Counter"])).moves).toEqual(["Quick Attack"]);
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(null);
  });

  it("removes moves by name from a member and from the current editor", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.removeMoveFromMember("2", "Counter");
    actions.removeMoveFromEditor("Counter");

    expect(spies.updateMember).toHaveBeenCalledTimes(2);
    const firstUpdater = spies.updateMember.mock.calls[0]?.[1];
    const secondCall = spies.updateMember.mock.calls[1];
    expect(firstUpdater(createMember("2", "Riolu", ["Quick Attack", "Counter"])).moves).toEqual([
      "Quick Attack",
    ]);
    expect(secondCall?.[0]).toBe("2");
  });

  it("ignores editor move removals when there is no editor member or the index is invalid", () => {
    const { deps, spies } = createDeps();
    deps.store.editorMemberId = null;
    const actions = useBuilderTeamActions(deps as never);

    actions.removeMoveFromEditor("Counter");
    actions.removeMoveFromEditorAt(0);
    actions.removeMoveAtForMember("2", -1);

    expect(spies.updateMember).not.toHaveBeenCalled();
  });

  it("reorders editor moves and updates the selected move index", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.reorderMovesForEditor(1, 0);

    expect(spies.updateMember).toHaveBeenCalledWith("2", expect.any(Function));
    const updater = spies.updateMember.mock.calls[0]?.[1];
    expect(updater(createMember("2", "Riolu", ["Quick Attack", "Counter"])).moves).toEqual([
      "Counter",
      "Quick Attack",
    ]);
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(0);
  });

  it("ignores no-op or invalid move reorders", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.reorderMovesForEditor(1, 1);
    expect(spies.updateMember).not.toHaveBeenCalled();

    actions.reorderMovesForMember("2", 0, 0);
    expect(spies.updateMember).not.toHaveBeenCalled();

    actions.reorderMovesForMember("2", -1, 0);
    expect(spies.updateMember).toHaveBeenCalledWith("2", expect.any(Function));
    const updater = spies.updateMember.mock.calls[0]?.[1];
    expect(updater(createMember("2", "Riolu", ["Quick Attack", "Counter"]))).toEqual(
      createMember("2", "Riolu", ["Quick Attack", "Counter"]),
    );
  });

  it("removes a move by editor index when an editor member exists", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.removeMoveFromEditorAt(0);

    expect(spies.updateMember).toHaveBeenCalledWith("2", expect.any(Function));
    const updater = spies.updateMember.mock.calls[0]?.[1];
    expect(updater(createMember("2", "Riolu", ["Quick Attack", "Counter"])).moves).toEqual(["Counter"]);
  });

  it("clears selection and editor when removing a member succeeds", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    const removed = actions.removeMember("1");

    expect(removed).toBe(true);
    expect(spies.moveMemberToPc).toHaveBeenCalledWith("1");
    expect(spies.setActiveMemberId).toHaveBeenCalledWith(null);
  });

  it("clears the editor state too when removing the editing member", () => {
    const { deps, spies } = createDeps();
    deps.store.activeMemberId = "2";
    deps.store.editorMemberId = "2";

    const actions = useBuilderTeamActions(deps as never);

    expect(actions.removeMember("2")).toBe(true);
    expect(spies.setActiveMemberId).toHaveBeenCalledWith(null);
    expect(spies.setEditorMemberId).toHaveBeenCalledWith(null);
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(null);
  });

  it("returns false when removing a member fails", () => {
    const { deps, spies } = createDeps();
    spies.moveMemberToPc.mockReturnValue(false);

    const actions = useBuilderTeamActions(deps as never);

    expect(actions.removeMember("1")).toBe(false);
    expect(spies.setActiveMemberId).not.toHaveBeenCalled();
  });

  it("closes the editor and prunes empty draft members", () => {
    const { deps, spies } = createDeps();
    deps.store.currentTeam = [createMember("1", "Snivy"), createMember("draft", "")];
    deps.store.activeMemberId = "draft";
    deps.store.editorMemberId = "draft";

    const actions = useBuilderTeamActions(deps as never);
    actions.closeEditor();

    expect(spies.setCurrentTeam).toHaveBeenCalledWith([deps.store.currentTeam[0]]);
    expect(spies.setActiveMemberId).toHaveBeenCalledWith("1");
    expect(spies.setEditorMemberId).toHaveBeenCalledWith(null);
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(null);
  });

  it("closes the editor without pruning when the current editor member is valid or missing", () => {
    const { deps, spies } = createDeps();
    deps.store.editorMemberId = null;

    const actions = useBuilderTeamActions(deps as never);
    actions.closeEditor();

    expect(spies.setCurrentTeam).not.toHaveBeenCalled();
    expect(spies.setEditorMemberId).toHaveBeenCalledWith(null);
    expect(spies.setEditorMoveSelection).toHaveBeenCalledWith(null);
  });

  it("returns to onboarding by clearing the started flag", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.returnToOnboarding();

    expect(spies.setBuilderStarted).toHaveBeenCalledWith(false);
  });
});
