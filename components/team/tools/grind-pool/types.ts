import { z } from "zod";

import { natureOptions } from "@/lib/builderForm";

import type { PokemonGender } from "@/lib/builder";

export type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type NatureStatKey = Exclude<StatKey, "hp">;

export type StatSpread = Record<StatKey, number>;

export type Candidate = {
  id: string;
  level: number;
  gender: PokemonGender;
  nature: string;
  ability: string;
  stats: StatSpread;
  notes: string;
  createdAt: number;
};

export type PerfectSpecimen = {
  gender: PokemonGender;
  ability: string;
  preferredNatureStats: [NatureStatKey, NatureStatKey];
  stats: StatSpread;
};

export const statOrder: Array<{ key: StatKey; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "SpA" },
  { key: "spd", label: "SpD" },
  { key: "spe", label: "Spe" },
];

export const natureStatOptions: NatureStatKey[] = [
  "atk",
  "def",
  "spa",
  "spd",
  "spe",
];

export const pokemonGenderOptions = ["unknown", "male", "female"] as const;

export const observedStatSchema = z.object({
  hp: z.number().int().min(0).max(999),
  atk: z.number().int().min(0).max(999),
  def: z.number().int().min(0).max(999),
  spa: z.number().int().min(0).max(999),
  spd: z.number().int().min(0).max(999),
  spe: z.number().int().min(0).max(999),
});

export const perfectSpecimenSchema = z.object({
  gender: z.enum(pokemonGenderOptions),
  ability: z.string().trim(),
  preferredNatureStats: z.tuple([
    z.enum(natureStatOptions),
    z.enum(natureStatOptions),
  ]),
  stats: observedStatSchema,
});

export const grindCandidateDraftSchema = z.object({
  level: z.number().int().min(1).max(100),
  gender: z.enum(pokemonGenderOptions),
  nature: z
    .string()
    .refine((value) =>
      natureOptions.includes(value as (typeof natureOptions)[number]),
    ),
  ability: z.string().trim().min(1),
  notes: z.string().max(240),
  stats: observedStatSchema,
});

export type CandidateDraft = ReturnType<typeof grindCandidateDraftSchema.parse>;
