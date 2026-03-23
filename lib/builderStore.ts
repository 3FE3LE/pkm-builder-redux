"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { StatSpread } from "@/lib/teamAnalysis";
import type { PokemonGender, StarterKey, SuggestionInput } from "@/lib/builder";
import type { BattleWeather } from "@/lib/domain/battle";
import {
  createEmptyRunState,
  createStartedRunState,
  type EvolutionConstraintKey,
  type RecommendationFilterKey,
  type RunFlagState,
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
  setActiveMemberId: (activeMemberId: string | null) => void;
  setEditorMemberId: (editorMemberId: string | null) => void;
  setEvolutionConstraint: (key: EvolutionConstraintKey, value: boolean) => void;
  setRecommendationFilter: (key: RecommendationFilterKey, value: boolean) => void;
  setBattleWeather: (weather: BattleWeather) => void;
  toggleEncounterCompleted: (encounterId: string) => void;
  setHackEvent: (key: string, value: boolean) => void;
  resetHackEvents: () => void;
  resetRun: () => void;
};

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
          run: {
            ...state.run,
            roster: {
              ...state.run.roster,
              currentTeam:
                typeof updater === "function"
                  ? updater(state.run.roster.currentTeam as EditableMember[])
                  : updater,
            },
          },
        })),
      updateMember: (id, updater) =>
        set((state) => ({
          run: {
            ...state.run,
            roster: {
              ...state.run.roster,
              currentTeam: state.run.roster.currentTeam.map((member) => {
                if (member.id !== id) {
                  return member;
                }
                return typeof updater === "function" ? updater(member as EditableMember) : updater;
              }),
            },
          },
        })),
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
      version: 5,
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
          const normalizedCurrentTeam = (legacyState.run.roster.currentTeam ?? []).map((member) => ({
            ...member,
            locked: member.locked ?? false,
            gender: normalizeGender(member.gender),
          }));

          return {
            ...legacyState,
            run: {
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
              },
              roster: {
                ...createEmptyRunState().roster,
                ...legacyState.run.roster,
                currentTeam: normalizedCurrentTeam,
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
            },
          };
        }

        const normalizedCurrentTeam = (legacyState.currentTeam ?? []).map((member) => ({
          ...member,
          locked: member.locked ?? false,
          gender: normalizeGender(member.gender),
        }));

        return {
          hydrated: false,
          run: {
            started: legacyState.builderStarted ?? false,
            starter: legacyState.starter ?? "snivy",
            preferences: createEmptyRunState().preferences,
            roster: {
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
          },
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
