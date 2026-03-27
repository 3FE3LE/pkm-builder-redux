"use client";

import type { ParsedDocs } from "@/lib/docsSchema";
import type { RemoteMove, RemotePokemon } from "@/lib/teamAnalysis";
import type { EditableMember } from "@/lib/builderStore";

export type BuilderDataProps = {
  docs: ParsedDocs;
  speciesOptions: string[];
  speciesCatalog: {
    name: string;
    slug: string;
    dex: number;
    types: string[];
  }[];
  moveIndex: Record<string, RemoteMove>;
  pokemonIndex: Record<string, RemotePokemon>;
  abilityCatalog: { name: string; effect?: string }[];
  itemCatalog: {
    name: string;
    category?: string;
    effect?: string;
    sprite?: string | null;
  }[];
};

export type MoveModalTab = "levelUp" | "machines";

export type MovePickerState = {
  memberId: string;
  slotIndex: number | null;
};

export type EvolutionOption = {
  species: string;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  eligible?: boolean;
  reasons?: string[];
};

export type EvolutionState = {
  memberId: string;
  currentSpecies: string;
  currentSpriteUrl?: string;
  currentAnimatedSpriteUrl?: string;
  nextOptions: EvolutionOption[];
  selectedNext: string | null;
};

export type CompareMembers = [EditableMember, EditableMember];
