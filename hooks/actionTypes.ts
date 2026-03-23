"use client";

import type { BuilderDataProps } from "@/hooks/types";
import type { useBuilderDerivedData } from "@/hooks/useBuilderDerivedData";
import type { useBuilderStoreState } from "@/hooks/useBuilderStoreState";
import type { useBuilderUiState } from "@/hooks/useBuilderUiState";

export type BuilderStoreState = ReturnType<typeof useBuilderStoreState>;
export type BuilderUiState = ReturnType<typeof useBuilderUiState>;
export type BuilderDerivedData = ReturnType<typeof useBuilderDerivedData>;

export type BuilderActionDeps = {
  data: BuilderDataProps;
  store: BuilderStoreState;
  ui: BuilderUiState;
  derived: BuilderDerivedData;
};
