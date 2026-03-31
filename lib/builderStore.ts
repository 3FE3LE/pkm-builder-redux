"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { StatSpread } from "@/lib/teamAnalysis";
import type { PokemonGender, StarterKey, SuggestionInput } from "@/lib/builder";
import type { BattleWeather } from "@/lib/domain/battle";
import {
  createEmptyRunState,
  type BuilderTheme,
  createStartedRunState,
  type EvolutionConstraintKey,
  type RecommendationFilterKey,
  type RunFlagState,
  type RunCompositionState,
  type RunState,
} from "@/lib/runState";

export type EditableMember = SuggestionInput & {
  id: string;
  nickname: string;
  locked: boolean;
  ivs: StatSpread;
  evs: StatSpread;
};

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

type BuilderStore = {
  hydrated: boolean;
  run: RunState;
  setHydrated: (hydrated: boolean) => void;
  setBuilderStarted: (builderStarted: boolean) => void;
  setStarter: (starter: StarterKey) => void;
  beginRun: (starter: StarterKey, species: string, nickname?: string) => void;
  setMilestoneId: (milestoneId: string) => void;
  setCurrentTeam: (updater: EditableMember[] | ((items: EditableMember[]) => EditableMember[])) => void;
  updateMember: (id: string, updater: EditableMember | ((member: EditableMember) => EditableMember)) => void;
  createComposition: (name?: string) => string;
  renameComposition: (compositionId: string, name: string) => void;
  setActiveCompositionId: (compositionId: string) => void;
  addLibraryMemberToComposition: (memberId: string, compositionId?: string) => boolean;
  saveMemberToPc: (member: EditableMember) => boolean;
  moveMemberToPc: (memberId: string, compositionId?: string) => boolean;
  restoreMemberFromPc: (memberId: string, compositionId?: string) => boolean;
  setActiveMemberId: (activeMemberId: string | null) => void;
  setEditorMemberId: (editorMemberId: string | null) => void;
  setEvolutionConstraint: (key: EvolutionConstraintKey, value: boolean) => void;
  setRecommendationFilter: (key: RecommendationFilterKey, value: boolean) => void;
  setBattleWeather: (weather: BattleWeather) => void;
  setTheme: (theme: BuilderTheme) => void;
  toggleEncounterCompleted: (encounterId: string) => void;
  setHackEvent: (key: string, value: boolean) => void;
  resetHackEvents: () => void;
  resetRun: () => void;
};

function normalizeEditableMember(member: EditableMember): EditableMember {
  return {
    ...member,
    locked: member.locked ?? false,
    shiny: member.shiny ?? false,
    gender: normalizeGender(member.gender),
  };
}

function createFallbackComposition(memberIds: string[] = []): RunCompositionState {
  return {
    id: crypto.randomUUID(),
    name: "Main Team",
    memberIds,
  };
}

function upsertLibraryMembers(
  library: EditableMember[],
  members: EditableMember[],
): EditableMember[] {
  const nextLibrary = [...library];

  for (const member of members) {
    const normalizedMember = normalizeEditableMember(member);
    const existingIndex = nextLibrary.findIndex((entry) => entry.id === normalizedMember.id);

    if (existingIndex === -1) {
      nextLibrary.push(normalizedMember);
      continue;
    }

    nextLibrary[existingIndex] = normalizedMember;
  }

  return nextLibrary;
}

function ensureRosterState(run: RunState): RunState {
  const defaultRoster = createEmptyRunState().roster;
  const normalizedTeam = (run.roster.currentTeam ?? []).map(normalizeEditableMember);
  const normalizedLibrary = (run.roster.pokemonLibrary ?? []).map(normalizeEditableMember);
  const librarySeed = upsertLibraryMembers(normalizedLibrary, normalizedTeam);
  const safeMemberIds = new Set(librarySeed.map((member) => member.id));
  const normalizedCompositions =
    run.roster.compositions
      ?.map((composition, index) => ({
        id: composition.id || crypto.randomUUID(),
        name: composition.name?.trim() || `Team ${index + 1}`,
        memberIds: (composition.memberIds ?? []).filter((memberId) => safeMemberIds.has(memberId)),
      })) ?? [];
  const fallbackComposition =
    normalizedCompositions[0] ??
    createFallbackComposition(normalizedTeam.map((member) => member.id));
  const activeCompositionId = normalizedCompositions.some(
    (composition) => composition.id === run.roster.activeCompositionId,
  )
    ? run.roster.activeCompositionId
    : fallbackComposition.id;
  const compositions =
    normalizedCompositions.length > 0 ? normalizedCompositions : [fallbackComposition];
  const activeComposition =
    compositions.find((composition) => composition.id === activeCompositionId) ?? compositions[0];
  const activeTeam = activeComposition.memberIds
    .map((memberId) => librarySeed.find((member) => member.id === memberId))
    .filter((member): member is EditableMember => Boolean(member));
  const pcBoxIds = Array.from(
    new Set((run.roster.pcBoxIds ?? []).filter((memberId) => safeMemberIds.has(memberId))),
  );

  return {
    ...run,
    roster: {
      ...defaultRoster,
      ...run.roster,
      pokemonLibrary: librarySeed,
      compositions,
      activeCompositionId,
      pcBoxIds,
      currentTeam: activeTeam,
      activeMemberId:
        activeTeam.some((member) => member.id === run.roster.activeMemberId)
          ? run.roster.activeMemberId
          : activeTeam[0]?.id ?? null,
      editorMemberId:
        activeTeam.some((member) => member.id === run.roster.editorMemberId)
          ? run.roster.editorMemberId
          : null,
    },
  };
}

function updateRoster(
  run: RunState,
  updater: (roster: RunState["roster"]) => RunState["roster"],
): RunState {
  return ensureRosterState({
    ...run,
    roster: updater(run.roster),
  });
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
      migrate: (persistedState) => {
        const legacyState = persistedState as
          | {
              run?: RunState;
              builderStarted?: boolean;
              starter?: StarterKey;
              milestoneId?: string;
              currentTeam?: EditableMember[];
              activeMemberId?: string | null;
              editorMemberId?: string | null;
              hackEvents?: RunFlagState;
            }
          | undefined;

        if (!legacyState) {
          return { hydrated: false, run: createEmptyRunState() };
        }

        if (legacyState.run) {
          return {
            ...legacyState,
            run: ensureRosterState({
              ...createEmptyRunState(),
              ...legacyState.run,
              preferences: {
                ...createEmptyRunState().preferences,
                ...legacyState.run.preferences,
                evolutionConstraints: {
                  ...createEmptyRunState().preferences.evolutionConstraints,
                  ...legacyState.run.preferences?.evolutionConstraints,
                },
                recommendationFilters: {
                  ...createEmptyRunState().preferences.recommendationFilters,
                  ...legacyState.run.preferences?.recommendationFilters,
                  excludeUniquePokemon:
                    legacyState.run.preferences?.recommendationFilters?.excludeUniquePokemon ??
                    (legacyState.run.preferences?.recommendationFilters as Record<string, boolean> | undefined)
                      ?.excludeUniqueEncounters ??
                    createEmptyRunState().preferences.recommendationFilters.excludeUniquePokemon,
                },
                battleWeather:
                  legacyState.run.preferences?.battleWeather ??
                  createEmptyRunState().preferences.battleWeather,
                theme:
                  legacyState.run.preferences?.theme ??
                  createEmptyRunState().preferences.theme,
              },
              progress: {
                ...createEmptyRunState().progress,
                ...legacyState.run.progress,
                claimedSources: {
                  ...createEmptyRunState().progress.claimedSources,
                  ...legacyState.run.progress.claimedSources,
                },
                completedEncounterIds:
                  legacyState.run.progress.completedEncounterIds ?? [],
                flags: legacyState.run.progress.flags ?? {},
              },
            }),
          };
        }

        const normalizedCurrentTeam = (legacyState.currentTeam ?? []).map(normalizeEditableMember);
        const defaultComposition = createFallbackComposition(
          normalizedCurrentTeam.map((member) => member.id),
        );

        return {
          hydrated: false,
          run: ensureRosterState({
            started: legacyState.builderStarted ?? false,
            starter: legacyState.starter ?? "snivy",
            preferences: createEmptyRunState().preferences,
            roster: {
              pokemonLibrary: normalizedCurrentTeam,
              compositions: [defaultComposition],
              activeCompositionId: defaultComposition.id,
              pcBoxIds: [],
              currentTeam: normalizedCurrentTeam,
              activeMemberId: legacyState.activeMemberId ?? null,
              editorMemberId: legacyState.editorMemberId ?? null,
            },
            progress: {
              mode: "challenge",
              milestoneId: legacyState.milestoneId ?? createEmptyRunState().progress.milestoneId,
              completedEncounterIds: [],
              completedMilestoneIds: [],
              claimedSources: {
                encounters: [],
                gifts: [],
                trades: [],
                items: [],
              },
              achievements: [],
              flags: legacyState.hackEvents ?? {},
            },
          }),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

function normalizeGender(value: unknown): PokemonGender {
  return value === "male" || value === "female" ? value : "unknown";
}
