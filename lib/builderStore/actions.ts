import type { BuilderStore } from "@/lib/builderStore/types";
import { createCoreActions } from "@/lib/builderStore/actions/core";
import { createPreferencesActions } from "@/lib/builderStore/actions/preferences";
import { createRosterActions } from "@/lib/builderStore/actions/roster";
import type { BuilderSet } from "@/lib/builderStore/actions/shared";

export function createBuilderActions(
  set: BuilderSet,
): Omit<BuilderStore, "hydrated" | "run"> {
  return {
    ...createCoreActions(set),
    ...createRosterActions(set),
    ...createPreferencesActions(set),
  };
}
