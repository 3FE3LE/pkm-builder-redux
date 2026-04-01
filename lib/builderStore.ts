"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createBuilderActions } from "@/lib/builderStore/actions";
import { migrateBuilderState } from "@/lib/builderStore/migrate";
import { createEmptyRunState } from "@/lib/runState";
import type { BuilderStore, EditableMember } from "@/lib/builderStore/types";

export type { BuilderStore, EditableMember } from "@/lib/builderStore/types";
export { createEditable } from "@/lib/builderStore/factory";

export const useBuilderStore = create<BuilderStore>()(
  persist(
    (set) => ({
      hydrated: false,
      run: createEmptyRunState(),
      ...createBuilderActions(set),
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
    },
  ),
);
