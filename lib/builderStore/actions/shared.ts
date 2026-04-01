import type { BuilderStore } from "@/lib/builderStore/types";

export type BuilderSet = (
  updater:
    | Partial<BuilderStore>
    | ((state: BuilderStore) => Partial<BuilderStore>),
) => void;
