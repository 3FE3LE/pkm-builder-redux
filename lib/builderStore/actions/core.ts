import { createEmptyRunState, createStartedRunState } from "@/lib/runState";
import { createEditable } from "@/lib/builderStore/factory";
import type { BuilderStore } from "@/lib/builderStore/types";

import type { BuilderSet } from "@/lib/builderStore/actions/shared";

type CoreActions = Pick<
  BuilderStore,
  | "setHydrated"
  | "setBuilderStarted"
  | "setStarter"
  | "beginRun"
  | "setMilestoneId"
  | "resetRun"
>;

export function createCoreActions(set: BuilderSet): CoreActions {
  return {
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
    resetRun: () =>
      set({
        run: createEmptyRunState(),
      }),
  };
}
