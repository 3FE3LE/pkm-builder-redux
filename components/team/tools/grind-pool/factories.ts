import type { PokemonGender } from "@/lib/builder";

import type { Candidate, PerfectSpecimen, StatSpread } from "./types";

export function createEmptySpread(value = 0): StatSpread {
  return {
    hp: value,
    atk: value,
    def: value,
    spa: value,
    spd: value,
    spe: value,
  };
}

export function createCandidateDraft() {
  return {
    level: 1,
    gender: "unknown" as PokemonGender,
    nature: "Serious",
    ability: "",
    notes: "",
    stats: createEmptySpread(),
  };
}

export function createPerfectSpecimen(): PerfectSpecimen {
  return {
    gender: "unknown",
    ability: "",
    preferredNatureStats: ["spa", "spe"],
    stats: createEmptySpread(31),
  };
}

export function normalizePerfectSpecimen(
  specimen: Partial<PerfectSpecimen> | undefined,
): PerfectSpecimen {
  const fallback = createPerfectSpecimen();

  return {
    gender: specimen?.gender ?? fallback.gender,
    ability: specimen?.ability ?? fallback.ability,
    preferredNatureStats: [
      specimen?.preferredNatureStats?.[0] ?? fallback.preferredNatureStats[0],
      specimen?.preferredNatureStats?.[1] ?? fallback.preferredNatureStats[1],
    ],
    stats: {
      hp: specimen?.stats?.hp ?? fallback.stats.hp,
      atk: specimen?.stats?.atk ?? fallback.stats.atk,
      def: specimen?.stats?.def ?? fallback.stats.def,
      spa: specimen?.stats?.spa ?? fallback.stats.spa,
      spd: specimen?.stats?.spd ?? fallback.stats.spd,
      spe: specimen?.stats?.spe ?? fallback.stats.spe,
    },
  };
}

export function normalizeDraft(
  draft: Partial<ReturnType<typeof createCandidateDraft>> | undefined,
) {
  const fallback = createCandidateDraft();
  const rawLevel = Number(draft?.level ?? fallback.level);
  const level = Number.isFinite(rawLevel)
    ? Math.max(1, Math.min(100, Math.round(rawLevel)))
    : fallback.level;

  return {
    level,
    gender: draft?.gender ?? fallback.gender,
    nature: draft?.nature ?? fallback.nature,
    ability: draft?.ability ?? fallback.ability,
    notes: draft?.notes ?? fallback.notes,
    stats: {
      hp: draft?.stats?.hp ?? fallback.stats.hp,
      atk: draft?.stats?.atk ?? fallback.stats.atk,
      def: draft?.stats?.def ?? fallback.stats.def,
      spa: draft?.stats?.spa ?? fallback.stats.spa,
      spd: draft?.stats?.spd ?? fallback.stats.spd,
      spe: draft?.stats?.spe ?? fallback.stats.spe,
    },
  };
}

export function normalizeCandidate(
  candidate: Partial<Candidate> | undefined,
): Candidate {
  const fallback = createCandidateDraft();
  const rawLevel = Number(candidate?.level ?? fallback.level);
  const level = Number.isFinite(rawLevel)
    ? Math.max(1, Math.min(100, Math.round(rawLevel)))
    : fallback.level;

  return {
    id: candidate?.id ?? "",
    level,
    gender: candidate?.gender ?? fallback.gender,
    nature: candidate?.nature ?? fallback.nature,
    ability: candidate?.ability ?? fallback.ability,
    notes: candidate?.notes ?? fallback.notes,
    createdAt: candidate?.createdAt ?? 0,
    stats: {
      hp: candidate?.stats?.hp ?? fallback.stats.hp,
      atk: candidate?.stats?.atk ?? fallback.stats.atk,
      def: candidate?.stats?.def ?? fallback.stats.def,
      spa: candidate?.stats?.spa ?? fallback.stats.spa,
      spd: candidate?.stats?.spd ?? fallback.stats.spd,
      spe: candidate?.stats?.spe ?? fallback.stats.spe,
    },
  };
}
