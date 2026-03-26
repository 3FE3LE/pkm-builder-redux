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

  const deps = {
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

  it("rejects adding a duplicate prepared species to the current team", () => {
    const { deps, spies } = createDeps();

    const actions = useBuilderTeamActions(deps as never);
    const result = actions.addPreparedMember(createMember("3", "snivy"));

    expect(result).toEqual({ ok: false, reason: "duplicate" });
    expect(spies.setCurrentTeam).not.toHaveBeenCalled();
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

  it("clears selection and editor when removing a member succeeds", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    const removed = actions.removeMember("1");

    expect(removed).toBe(true);
    expect(spies.moveMemberToPc).toHaveBeenCalledWith("1");
    expect(spies.setActiveMemberId).toHaveBeenCalledWith(null);
  });

  it("returns to onboarding by clearing the started flag", () => {
    const { deps, spies } = createDeps();
    const actions = useBuilderTeamActions(deps as never);

    actions.returnToOnboarding();

    expect(spies.setBuilderStarted).toHaveBeenCalledWith(false);
  });
});
