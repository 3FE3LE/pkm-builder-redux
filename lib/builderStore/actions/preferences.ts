import { createEmptyRunState } from "@/lib/runState";
import type { BuilderStore } from "@/lib/builderStore/types";
import { applyTheme } from "@/lib/theme/applyTheme";

import type { BuilderSet } from "@/lib/builderStore/actions/shared";

type PreferencesActions = Pick<
  BuilderStore,
  | "setEvolutionConstraint"
  | "setRecommendationFilter"
  | "setBattleWeather"
  | "setTheme"
  | "toggleEncounterCompleted"
  | "setHackEvent"
  | "resetHackEvents"
>;

export function createPreferencesActions(set: BuilderSet): PreferencesActions {
  return {
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
    setTheme: (theme) => {
      applyTheme(theme);
      set((state) => ({
        run: {
          ...state.run,
          preferences: {
            ...createEmptyRunState().preferences,
            ...state.run.preferences,
            theme,
          },
        },
      }));
    },
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
  };
}
