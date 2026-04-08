import {
  ensureRosterState,
  normalizeEditableMember,
  updateRoster,
  upsertLibraryMembers,
} from "@/lib/builderStore/roster";
import type { BuilderStore } from "@/lib/builderStore/types";

import type { BuilderSet } from "@/lib/builderStore/actions/shared";
import { createId } from "@/lib/createId";

type RosterActions = Pick<
  BuilderStore,
  | "setCurrentTeam"
  | "updateMember"
  | "createComposition"
  | "renameComposition"
  | "setActiveCompositionId"
  | "addLibraryMemberToComposition"
  | "saveMemberToPc"
  | "moveMemberToPc"
  | "releaseMember"
  | "restoreMemberFromPc"
  | "setActiveMemberId"
  | "setEditorMemberId"
>;

export function createRosterActions(set: BuilderSet): RosterActions {
  return {
    setCurrentTeam: (updater) =>
      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          const currentTeam = normalizedRoster.currentTeam;
          const nextTeam =
            typeof updater === "function" ? updater(currentTeam) : updater;
          const normalizedTeam = nextTeam.map(normalizeEditableMember);
          const compositions = normalizedRoster.compositions.map((composition) =>
            composition.id === normalizedRoster.activeCompositionId
              ? {
                  ...composition,
                  memberIds: normalizedTeam.map((member) => member.id),
                }
              : composition,
          );

          return {
            ...normalizedRoster,
            pokemonLibrary: upsertLibraryMembers(
              normalizedRoster.pokemonLibrary,
              normalizedTeam,
            ),
            compositions,
            currentTeam: normalizedTeam,
          };
        }),
      })),
    updateMember: (id, updater) =>
      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          const currentMember =
            normalizedRoster.pokemonLibrary.find((member) => member.id === id) ??
            normalizedRoster.currentTeam.find((member) => member.id === id);
          if (!currentMember) {
            return normalizedRoster;
          }

          const updatedMember = normalizeEditableMember(
            typeof updater === "function" ? updater(currentMember) : updater,
          );
          const nextLibrary = normalizedRoster.pokemonLibrary.map((member) =>
            member.id === id ? updatedMember : member,
          );
          const nextCurrentTeam = normalizedRoster.currentTeam.map((member) =>
            member.id === id ? updatedMember : member,
          );

          return {
            ...normalizedRoster,
            pokemonLibrary: nextLibrary,
            currentTeam: nextCurrentTeam,
          };
        }),
      })),
    createComposition: (name = "") => {
      const compositionId = createId();

      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;

          return {
            ...normalizedRoster,
            compositions: [
              ...normalizedRoster.compositions,
              {
                id: compositionId,
                name: name.trim() || `Team ${normalizedRoster.compositions.length + 1}`,
                memberIds: [],
              },
            ],
            activeCompositionId: compositionId,
            activeMemberId: null,
            editorMemberId: null,
          };
        }),
      }));

      return compositionId;
    },
    renameComposition: (compositionId, name) =>
      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;

          return {
            ...normalizedRoster,
            compositions: normalizedRoster.compositions.map((composition) =>
              composition.id === compositionId
                ? {
                    ...composition,
                    name: name.trim() || composition.name,
                  }
                : composition,
            ),
          };
        }),
      })),
    setActiveCompositionId: (compositionId) =>
      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          if (!normalizedRoster.compositions.some((composition) => composition.id === compositionId)) {
            return normalizedRoster;
          }

          return {
            ...normalizedRoster,
            activeCompositionId: compositionId,
          };
        }),
      })),
    addLibraryMemberToComposition: (memberId, compositionId) => {
      let added = false;

      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          const targetCompositionId = compositionId ?? normalizedRoster.activeCompositionId;
          const targetMember = normalizedRoster.pokemonLibrary.find((member) => member.id === memberId);
          const targetComposition = normalizedRoster.compositions.find(
            (composition) => composition.id === targetCompositionId,
          );

          if (!targetMember || !targetComposition) {
            return normalizedRoster;
          }

          if (
            targetComposition.memberIds.includes(memberId) ||
            targetComposition.memberIds.length >= 6
          ) {
            return normalizedRoster;
          }

          added = true;

          return {
            ...normalizedRoster,
            compositions: normalizedRoster.compositions.map((composition) =>
              composition.id === targetCompositionId
                ? { ...composition, memberIds: [...composition.memberIds, memberId] }
                : composition,
            ),
            pcBoxIds: normalizedRoster.pcBoxIds.filter((id) => id !== memberId),
            activeCompositionId: targetCompositionId,
            activeMemberId: memberId,
            editorMemberId: memberId,
          };
        }),
      }));

      return added;
    },
    saveMemberToPc: (member) => {
      let saved = false;

      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          const normalizedMember = normalizeEditableMember(member);
          if (normalizedRoster.pokemonLibrary.some((entry) => entry.id === normalizedMember.id)) {
            return normalizedRoster;
          }

          saved = true;

          return {
            ...normalizedRoster,
            pokemonLibrary: [...normalizedRoster.pokemonLibrary, normalizedMember],
            pcBoxIds: normalizedRoster.pcBoxIds.includes(normalizedMember.id)
              ? normalizedRoster.pcBoxIds
              : [...normalizedRoster.pcBoxIds, normalizedMember.id],
          };
        }),
      }));

      return saved;
    },
    moveMemberToPc: (memberId, compositionId) => {
      let moved = false;

      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          const targetCompositionId = compositionId ?? normalizedRoster.activeCompositionId;
          const targetComposition = normalizedRoster.compositions.find(
            (composition) => composition.id === targetCompositionId,
          );

          if (!targetComposition || !targetComposition.memberIds.includes(memberId)) {
            return normalizedRoster;
          }

          if (targetComposition.memberIds.length <= 1) {
            return normalizedRoster;
          }

          moved = true;

          return {
            ...normalizedRoster,
            compositions: normalizedRoster.compositions.map((composition) =>
              composition.id === targetCompositionId
                ? {
                    ...composition,
                    memberIds: composition.memberIds.filter((id) => id !== memberId),
                  }
                : composition,
            ),
            pcBoxIds: normalizedRoster.pcBoxIds.includes(memberId)
              ? normalizedRoster.pcBoxIds
              : [...normalizedRoster.pcBoxIds, memberId],
            activeMemberId:
              normalizedRoster.activeMemberId === memberId
                ? null
                : normalizedRoster.activeMemberId,
            editorMemberId:
              normalizedRoster.editorMemberId === memberId
                ? null
                : normalizedRoster.editorMemberId,
          };
        }),
      }));

      return moved;
    },
    releaseMember: (memberId) => {
      let released = false;

      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          if (!normalizedRoster.pokemonLibrary.some((member) => member.id === memberId)) {
            return normalizedRoster;
          }

          released = true;

          return {
            ...normalizedRoster,
            pokemonLibrary: normalizedRoster.pokemonLibrary.filter((member) => member.id !== memberId),
            currentTeam: normalizedRoster.currentTeam.filter((member) => member.id !== memberId),
            compositions: normalizedRoster.compositions.map((composition) => ({
              ...composition,
              memberIds: composition.memberIds.filter((id) => id !== memberId),
            })),
            pcBoxIds: normalizedRoster.pcBoxIds.filter((id) => id !== memberId),
            activeMemberId:
              normalizedRoster.activeMemberId === memberId ? null : normalizedRoster.activeMemberId,
            editorMemberId:
              normalizedRoster.editorMemberId === memberId ? null : normalizedRoster.editorMemberId,
          };
        }),
      }));

      return released;
    },
    restoreMemberFromPc: (memberId, compositionId) => {
      let restored = false;

      set((state) => ({
        run: updateRoster(state.run, () => {
          const normalizedRoster = ensureRosterState(state.run).roster;
          if (!normalizedRoster.pcBoxIds.includes(memberId)) {
            return normalizedRoster;
          }

          const targetCompositionId = compositionId ?? normalizedRoster.activeCompositionId;
          const targetComposition = normalizedRoster.compositions.find(
            (composition) => composition.id === targetCompositionId,
          );

          if (
            !targetComposition ||
            targetComposition.memberIds.includes(memberId) ||
            targetComposition.memberIds.length >= 6
          ) {
            return normalizedRoster;
          }

          restored = true;

          return {
            ...normalizedRoster,
            compositions: normalizedRoster.compositions.map((composition) =>
              composition.id === targetCompositionId
                ? { ...composition, memberIds: [...composition.memberIds, memberId] }
                : composition,
            ),
            pcBoxIds: normalizedRoster.pcBoxIds.filter((id) => id !== memberId),
            activeCompositionId: targetCompositionId,
            activeMemberId: memberId,
            editorMemberId: memberId,
          };
        }),
      }));

      return restored;
    },
    setActiveMemberId: (activeMemberId) =>
      set((state) => ({
        run: {
          ...state.run,
          roster: {
            ...state.run.roster,
            activeMemberId,
          },
        },
      })),
    setEditorMemberId: (editorMemberId) =>
      set((state) => ({
        run: {
          ...state.run,
          roster: {
            ...state.run.roster,
            editorMemberId,
          },
        },
      })),
  };
}
