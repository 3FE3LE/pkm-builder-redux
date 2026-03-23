"use client";

import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";

import { createEditable, type EditableMember } from "@/lib/builderStore";

import type { BuilderActionDeps } from "@/hooks/actionTypes";

export function useBuilderTeamActions({ store, ui }: BuilderActionDeps) {
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
    store.setActiveMemberId(memberId);
    store.setEditorMemberId(memberId);
    ui.setEditorMoveSelection(null);
  }

  function removeMember(memberId: string) {
    const nextItems = store.currentTeam.filter((item) => item.id !== memberId);
    if (nextItems.length === store.currentTeam.length || !nextItems.length) {
      return;
    }

    store.setCurrentTeam(nextItems);

    if (store.activeMemberId === memberId) {
      store.setActiveMemberId(nextItems[0]?.id ?? null);
    }

    if (store.editorMemberId === memberId) {
      store.setEditorMemberId(null);
      ui.setEditorMoveSelection(null);
    }
  }

  function addMember() {
    const pending = store.currentTeam.find((item) => !item.species.trim());
    if (pending) {
      store.setActiveMemberId(pending.id);
      store.setEditorMemberId(pending.id);
      ui.setEditorMoveSelection(null);
      return;
    }

    const created = createEditable();
    store.setCurrentTeam((items) => [...items, created]);
    store.setActiveMemberId(created.id);
    store.setEditorMemberId(created.id);
    ui.setEditorMoveSelection(null);
  }

  function addPreparedMember(member: EditableMember) {
    store.setCurrentTeam((items) => [...items, member]);
    store.setActiveMemberId(member.id);
    store.setEditorMemberId(member.id);
    ui.setEditorMoveSelection(null);
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
    store.setCurrentTeam((items) =>
      items.map((item) =>
        item.id === memberId
          ? { ...item, moves: item.moves.filter((move) => move !== moveName) }
          : item,
      ),
    );
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

    store.setCurrentTeam((items) =>
      items.map((item) => {
        if (item.id !== store.editorMemberId) {
          return item;
        }

        return {
          ...item,
          moves: item.moves.filter((_, moveIndex) => moveIndex !== index),
        };
      }),
    );
    if (ui.editorMoveSelection === index) {
      ui.setEditorMoveSelection(null);
    }
  }

  function reorderMovesForEditor(fromIndex: number, toIndex: number) {
    if (!store.editorMemberId || fromIndex === toIndex) {
      return;
    }

    store.setCurrentTeam((items) =>
      items.map((item) => {
        if (item.id !== store.editorMemberId) {
          return item;
        }

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
      }),
    );
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
    removeMember,
    addMember,
    addPreparedMember,
    closeEditor,
    removeMoveFromMember,
    removeMoveFromEditor,
    removeMoveFromEditorAt,
    reorderMovesForEditor,
    returnToOnboarding,
  };
}
