"use client";

import type { BuilderDataProps } from "@/hooks/types";
import type { BuilderDerivedData, BuilderStoreState, BuilderUiState } from "@/hooks/actionTypes";
import { useBuilderModalActions } from "@/hooks/useBuilderModalActions";
import { useBuilderOnboardingActions } from "@/hooks/useBuilderOnboardingActions";
import { useBuilderTeamActions } from "@/hooks/useBuilderTeamActions";

export function useBuilderActions(
  data: BuilderDataProps,
  store: BuilderStoreState,
  ui: BuilderUiState,
  derived: BuilderDerivedData,
) {
  const deps = { data, store, ui, derived };
  const teamActions = useBuilderTeamActions(deps);
  const modalActions = useBuilderModalActions(deps);
  const onboardingActions = useBuilderOnboardingActions(deps);

  return {
    ...teamActions,
    ...modalActions,
    ...onboardingActions,
  };
}
