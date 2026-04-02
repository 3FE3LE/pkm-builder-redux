"use client";

import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

import { createEditable, type EditableMember } from "@/lib/builderStore";
import { normalizeName } from "@/lib/domain/names";

import type { BuilderActionDeps } from "@/hooks/actionTypes";

const MAX_ROSTER_SIZE = 6;

export function useBuilderTeamActions({ store, ui }: BuilderActionDeps) {
  function getFilledRosterCount(items = store.currentTeam) {
    return items.filter((item) => item.species.trim()).length;
  }

  function hasDuplicateSpecies(species: string, items = store.currentTeam) {
    const normalizedSpecies = normalizeName(species);
    if (!normalizedSpecies) {
      return false;
    }

    return items.some((item) => normalizeName(item.species) === normalizedSpecies);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    store.setCurrentTeam((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  function selectMember(memberId: string) {
    store.setActiveMemberId(store.activeMemberId === memberId ? null : memberId);
  }

  function clearSelection() {
    store.setActiveMemberId(null);
  }

  function editMember(memberId: string) {
    store.setActiveMemberId(memberId);
    store.setEditorMemberId(memberId);
    ui.setEditorMoveSelection(null);
  }

  function removeMember(memberId: string) {
    const moved = store.moveMemberToPc(memberId);
    if (!moved) {
      return false;
    }

    if (store.activeMemberId === memberId) {
      store.setActiveMemberId(null);
    }

    if (store.editorMemberId === memberId) {
      store.setEditorMemberId(null);
      ui.setEditorMoveSelection(null);
    }

    return true;
  }

  function releaseMember(memberId: string) {
    const released = store.releaseMember(memberId);
    if (!released) {
      return false;
    }

    if (store.activeMemberId === memberId) {
      store.setActiveMemberId(null);
    }

    if (store.editorMemberId === memberId) {
      store.setEditorMemberId(null);
      ui.setEditorMoveSelection(null);
    }

    return true;
  }

  function addMember() {
    const pending = store.currentTeam.find((item) => !item.species.trim());
    if (pending) {
      store.setActiveMemberId(pending.id);
      store.setEditorMemberId(pending.id);
      ui.setEditorMoveSelection(null);
      return pending.id;
    }

    if (getFilledRosterCount() >= MAX_ROSTER_SIZE) {
      return null;
    }

    const created = createEditable();
    store.setCurrentTeam((items) => [...items, created]);
    store.setActiveMemberId(created.id);
    store.setEditorMemberId(created.id);
    ui.setEditorMoveSelection(null);
    return created.id;
  }

  function addPreparedMember(member: EditableMember) {
    if (getFilledRosterCount() >= MAX_ROSTER_SIZE) {
      const savedToPc = store.saveMemberToPc(member);
      return savedToPc
        ? { ok: true as const, reason: "pc" as const }
        : { ok: false as const, reason: "full" as const };
    }

    if (hasDuplicateSpecies(member.species)) {
      return { ok: false as const, reason: "duplicate" as const };
    }

    store.setCurrentTeam((items) => [...items, member]);
    store.setActiveMemberId(member.id);
    store.setEditorMemberId(member.id);
    ui.setEditorMoveSelection(null);
    return { ok: true as const, reason: null };
  }

  function closeEditor() {
    const editingMember = store.editorMemberId
      ? store.currentTeam.find((item) => item.id === store.editorMemberId)
      : null;

    if (editingMember && !editingMember.species.trim()) {
      const nextItems = store.currentTeam.filter((item) => item.id !== editingMember.id);
      store.setCurrentTeam(nextItems);

      if (store.activeMemberId === editingMember.id) {
        store.setActiveMemberId(nextItems[0]?.id ?? null);
      }
    }

    store.setEditorMemberId(null);
    ui.setEditorMoveSelection(null);
  }

  function removeMoveFromMember(memberId: string, moveName: string) {
    store.updateMember(memberId, (item) => ({
      ...item,
      moves: item.moves.filter((move) => move !== moveName),
    }));
  }

  function removeMoveFromEditor(moveName: string) {
    if (!store.editorMemberId) {
      return;
    }
    removeMoveFromMember(store.editorMemberId, moveName);
  }

  function removeMoveFromEditorAt(index: number) {
    if (!store.editorMemberId) {
      return;
    }
    removeMoveAtForMember(store.editorMemberId, index);
  }

  function removeMoveAtForMember(memberId: string, index: number) {
    if (index < 0) {
      return;
    }

    store.updateMember(memberId, (item) => ({
      ...item,
      moves: item.moves.filter((_, moveIndex) => moveIndex !== index),
    }));
    if (ui.editorMoveSelection === index) {
      ui.setEditorMoveSelection(null);
    }
  }

  function reorderMovesForEditor(fromIndex: number, toIndex: number) {
    if (!store.editorMemberId || fromIndex === toIndex) {
      return;
    }
    reorderMovesForMember(store.editorMemberId, fromIndex, toIndex);
  }

  function reorderMovesForMember(memberId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) {
      return;
    }

    store.updateMember(memberId, (item) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= item.moves.length ||
        toIndex >= item.moves.length
      ) {
        return item;
      }

      return {
        ...item,
        moves: arrayMove(item.moves, fromIndex, toIndex),
      };
    });
    if (ui.editorMoveSelection === fromIndex) {
      ui.setEditorMoveSelection(toIndex);
    }
  }

  function returnToOnboarding() {
    store.setBuilderStarted(false);
  }

  return {
    handleDragEnd,
    selectMember,
    clearSelection,
    editMember,
    removeMember,
    releaseMember,
    addMember,
    addPreparedMember,
    closeEditor,
    removeMoveFromMember,
    removeMoveFromEditor,
    removeMoveFromEditorAt,
    removeMoveAtForMember,
    reorderMovesForEditor,
    reorderMovesForMember,
    returnToOnboarding,
  };
}
