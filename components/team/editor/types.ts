"use client";

import type { EditableMember } from "@/lib/builderStore";

export type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

export type AbilityCatalogEntry = {
  name: string;
  effect?: string;
};

export type ItemCatalogEntry = {
  name: string;
  category?: string;
  effect?: string;
  sprite?: string | null;
};

export type Update = (updater: (current: EditableMember) => EditableMember) => void;
export type IssueGetter = (path: string) => string | undefined;
