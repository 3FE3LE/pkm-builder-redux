"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { StatSpread } from "@/lib/teamAnalysis";
import {
  createEmptyRunState,
  createStartedRunState,
} from "@/lib/runState";
import { migrateBuilderState } from "@/lib/builderStore/migrate";
import {
  ensureRosterState,
  normalizeEditableMember,
  updateRoster,
  upsertLibraryMembers,
} from "@/lib/builderStore/roster";
import type { BuilderStore, EditableMember } from "@/lib/builderStore/types";
export type { BuilderStore, EditableMember } from "@/lib/builderStore/types";

const DEFAULT_IVS: StatSpread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

const DEFAULT_EVS: StatSpread = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

export function createEditable(species = "", locked = false): EditableMember {
  return {
    id: crypto.randomUUID(),
    species,
    nickname: species,
    locked,
    shiny: false,
    level: 5,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { ...DEFAULT_IVS },
    evs: { ...DEFAULT_EVS },
  };
}

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set) => ({
      hydrated: false,
      run: createEmptyRunState(),
      setHydrated: (hydrated) => set({ hydrated }),
      setBuilderStarted: (builderStarted) =>
        set((state) => ({
          run: {
            ...state.run,
            started: builderStarted,
          },
        })),
      setStarter: (starter) =>
        set((state) => ({
          run: {
            ...state.run,
            starter,
          },
        })),
      beginRun: (starter, species, nickname = "") => {
        const lead = createEditable(species, true);
        lead.nickname = nickname.trim() || species;
        set({
          run: createStartedRunState(starter, lead),
        });
      },
      setMilestoneId: (milestoneId) =>
        set((state) => ({
          run: {
            ...state.run,
            progress: {
              ...state.run.progress,
              milestoneId,
            },
          },
        })),
      setCurrentTeam: (updater) =>
        set((state) => ({
          run: updateRoster(state.run, (roster) => {
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
          run: updateRoster(state.run, (roster) => {
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
        const compositionId = crypto.randomUUID();

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
      setEvolutionConstraint: (key, value) =>
        set((state) => ({
          run: {
            ...state.run,
            preferences: {
              ...createEmptyRunState().preferences,
              ...state.run.preferences,
              evolutionConstraints: {
                ...createEmptyRunState().preferences.evolutionConstraints,
                ...state.run.preferences?.evolutionConstraints,
                [key]: value,
              },
            },
          },
        })),
      setRecommendationFilter: (key, value) =>
        set((state) => ({
          run: {
            ...state.run,
            preferences: {
              ...createEmptyRunState().preferences,
              ...state.run.preferences,
              recommendationFilters: {
                ...createEmptyRunState().preferences.recommendationFilters,
                ...state.run.preferences?.recommendationFilters,
                [key]: value,
              },
            },
          },
        })),
      setBattleWeather: (weather) =>
        set((state) => ({
          run: {
            ...state.run,
            preferences: {
              ...createEmptyRunState().preferences,
              ...state.run.preferences,
              battleWeather: weather,
            },
          },
        })),
      setTheme: (theme) =>
        set((state) => ({
          run: {
            ...state.run,
            preferences: {
              ...createEmptyRunState().preferences,
              ...state.run.preferences,
              theme,
            },
          },
        })),
      toggleEncounterCompleted: (encounterId) =>
        set((state) => {
          const completed = state.run.progress.completedEncounterIds ?? [];
          const isCompleted = completed.includes(encounterId);

          return {
            run: {
              ...state.run,
              progress: {
                ...state.run.progress,
                completedEncounterIds: isCompleted
                  ? completed.filter((id) => id !== encounterId)
                  : [...completed, encounterId],
              },
            },
          };
        }),
      setHackEvent: (key, value) =>
        set((state) => ({
          run: {
            ...state.run,
            progress: {
              ...state.run.progress,
              flags: { ...state.run.progress.flags, [key]: value },
            },
          },
        })),
      resetHackEvents: () =>
        set((state) => ({
          run: {
            ...state.run,
            progress: {
              ...state.run.progress,
              flags: {},
            },
          },
        })),
      resetRun: () =>
        set({
          run: createEmptyRunState(),
        }),
    }),
    {
      name: "pkm-builder-redux-state",
      version: 7,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        run: state.run,
      }),
      migrate: migrateBuilderState,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
