import { createEmptyRunState } from "@/lib/runState";
import type { BuilderStore } from "@/lib/builderStore/types";
import { applyTheme } from "@/lib/theme/applyTheme";
import type { TypeName } from "@/lib/domain/effects/types";
import type { RoleKey } from "@/lib/domain/profiles/types";

import type { BuilderSet } from "@/lib/builderStore/actions/shared";

type PreferencesActions = Pick<
  BuilderStore,
  | "setEvolutionConstraint"
  | "setRecommendationFilter"
  | "setRecommendationPlaystyle"
  | "toggleFavoriteType"
  | "toggleAvoidedType"
  | "togglePreferredRole"
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
    setRecommendationPlaystyle: (playstyle) =>
      set((state) => ({
        run: {
          ...state.run,
          preferences: {
            ...createEmptyRunState().preferences,
            ...state.run.preferences,
            userPreferences: {
              ...createEmptyRunState().preferences.userPreferences,
              ...state.run.preferences?.userPreferences,
              playstyle,
            },
          },
        },
      })),
    toggleFavoriteType: (type) =>
      set((state) => ({
        run: {
          ...state.run,
          preferences: {
            ...createEmptyRunState().preferences,
            ...state.run.preferences,
            userPreferences: buildNextUserPreferences(
              state.run.preferences?.userPreferences,
              { favoriteType: type },
            ),
          },
        },
      })),
    toggleAvoidedType: (type) =>
      set((state) => ({
        run: {
          ...state.run,
          preferences: {
            ...createEmptyRunState().preferences,
            ...state.run.preferences,
            userPreferences: buildNextUserPreferences(
              state.run.preferences?.userPreferences,
              { avoidedType: type },
            ),
          },
        },
      })),
    togglePreferredRole: (role) =>
      set((state) => ({
        run: {
          ...state.run,
          preferences: {
            ...createEmptyRunState().preferences,
            ...state.run.preferences,
            userPreferences: buildNextUserPreferences(
              state.run.preferences?.userPreferences,
              { preferredRole: role },
            ),
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

function buildNextUserPreferences(
  current: BuilderStore["run"]["preferences"]["userPreferences"] | undefined,
  update: {
    favoriteType?: TypeName;
    avoidedType?: TypeName;
    preferredRole?: RoleKey;
  },
) {
  const defaults = createEmptyRunState().preferences.userPreferences;
  const next = {
    ...defaults,
    ...current,
    favoriteTypes: [...(current?.favoriteTypes ?? defaults.favoriteTypes)],
    avoidedTypes: [...(current?.avoidedTypes ?? defaults.avoidedTypes)],
    preferredRoles: [...(current?.preferredRoles ?? defaults.preferredRoles)],
  };

  if (update.favoriteType) {
    next.favoriteTypes = toggleValue(next.favoriteTypes, update.favoriteType);
    next.avoidedTypes = next.avoidedTypes.filter((type) => type !== update.favoriteType);
  }

  if (update.avoidedType) {
    next.avoidedTypes = toggleValue(next.avoidedTypes, update.avoidedType);
    next.favoriteTypes = next.favoriteTypes.filter((type) => type !== update.avoidedType);
  }

  if (update.preferredRole) {
    next.preferredRoles = toggleValue(next.preferredRoles, update.preferredRole);
  }

  return next;
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}
