"use client";

import clsx from 'clsx';
import { Mars, Star, Trophy, Venus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  FilterCombobox,
  PokemonSprite,
  SpeciesCombobox,
  TypeBadge,
} from '@/components/BuilderShared';
import { SpreadInput } from '@/components/team/UI';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { natureOptions } from '@/lib/builderForm';
import { calculateEffectiveStats, getNatureEffect } from '@/lib/domain/battle';
import {
  getRepresentativeIv,
  inferIvForObservedStat,
} from '@/lib/domain/ivCalculator';
import { buildSpriteUrls, normalizeName } from '@/lib/domain/names';
import { cn } from '@/lib/utils';

import type { PokemonGender } from "@/lib/builder";
import type { RemotePokemon } from "@/lib/teamAnalysis";
type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
type NatureStatKey = Exclude<StatKey, "hp">;

type StatSpread = Record<StatKey, number>;

type Candidate = {
  id: string;
  level: number;
  gender: PokemonGender;
  nature: string;
  ability: string;
  stats: StatSpread;
  notes: string;
  createdAt: number;
};

type PerfectSpecimen = {
  gender: PokemonGender;
  ability: string;
  preferredNatureStats: [NatureStatKey, NatureStatKey];
  stats: StatSpread;
};

const statOrder: Array<{ key: StatKey; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "SpA" },
  { key: "spd", label: "SpD" },
  { key: "spe", label: "Spe" },
];
const natureStatOptions: NatureStatKey[] = ["atk", "def", "spa", "spd", "spe"];
const grindPoolFieldStackClassName = "space-y-1.5";
const grindPoolCompactFieldGridClassName =
  "grid grid-cols-2 gap-3 lg:grid-cols-4";
const grindPoolSectionIntroClassName = "mt-1 text-sm text-muted";
const pokemonGenderOptions = ["unknown", "male", "female"] as const;

const observedStatSchema = z.object({
  hp: z.number().int().min(0).max(999),
  atk: z.number().int().min(0).max(999),
  def: z.number().int().min(0).max(999),
  spa: z.number().int().min(0).max(999),
  spd: z.number().int().min(0).max(999),
  spe: z.number().int().min(0).max(999),
});

const perfectSpecimenSchema = z.object({
  gender: z.enum(pokemonGenderOptions),
  ability: z.string().trim(),
  preferredNatureStats: z.tuple([
    z.enum(natureStatOptions),
    z.enum(natureStatOptions),
  ]),
  stats: observedStatSchema,
});

const grindCandidateDraftSchema = z.object({
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

function createEmptySpread(value = 0): StatSpread {
  return {
    hp: value,
    atk: value,
    def: value,
    spa: value,
    spd: value,
    spe: value,
  };
}

function createCandidateDraft() {
  return {
    level: 1,
    gender: "unknown" as PokemonGender,
    nature: "Serious",
    ability: "",
    notes: "",
    stats: createEmptySpread(),
  };
}

function createPerfectSpecimen(): PerfectSpecimen {
  return {
    gender: "unknown",
    ability: "",
    preferredNatureStats: ["spa", "spe"],
    stats: createEmptySpread(31),
  };
}

function normalizePerfectSpecimen(
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

function normalizeDraft(
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

function normalizeCandidate(
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

function getDistance(current: StatSpread, target: StatSpread) {
  return statOrder.reduce(
    (total, stat) => total + Math.abs(current[stat.key] - target[stat.key]),
    0,
  );
}

function getExactMatches(current: StatSpread, target: StatSpread) {
  return statOrder.reduce(
    (total, stat) => total + (current[stat.key] === target[stat.key] ? 1 : 0),
    0,
  );
}

function getPercent(current: StatSpread, target: StatSpread) {
  const baseline = Math.max(
    1,
    statOrder.reduce((total, stat) => total + Math.max(target[stat.key], 1), 0),
  );
  const distance = getDistance(current, target);
  return Math.max(0, Math.round(100 - (distance / baseline) * 100));
}

function getPriorityScore(candidate: Candidate, target: PerfectSpecimen) {
  const natureEffect = getNatureEffect(candidate.nature);
  let score = 0;

  for (const preferredStat of target.preferredNatureStats) {
    const value = candidate.stats[preferredStat];

    if (value >= 31) {
      score += 120;
    } else if (value >= 30) {
      score += 96;
    } else if (value >= 28) {
      score += 72;
    } else if (value >= 25) {
      score += 44;
    }

    if (natureEffect.up === preferredStat) {
      score += 110;
    }

    if (natureEffect.down === preferredStat) {
      score -= 140;
    }

    if (value >= 31 && natureEffect.up === preferredStat) {
      score += 90;
    }
  }

  for (const stat of statOrder) {
    if (candidate.stats[stat.key] >= 31) {
      score += 14;
    }
  }

  if (target.ability && candidate.ability === target.ability) {
    score += 120;
  } else if (target.ability) {
    score -= 120;
  }

  if (target.gender !== "unknown" && candidate.gender === target.gender) {
    score += 90;
  } else if (target.gender !== "unknown") {
    score -= 90;
  }

  return score;
}

function getEstimatedIvs(
  candidate: Candidate,
  baseStats: RemotePokemon["stats"] | undefined,
): StatSpread {
  if (!baseStats) {
    return createEmptySpread();
  }

  const next = createEmptySpread();

  for (const stat of statOrder) {
    const inference = inferIvForObservedStat({
      baseStats,
      level: candidate.level,
      nature: candidate.nature,
      stat: stat.key,
      observed: candidate.stats[stat.key],
    });

    next[stat.key] =
      inference.candidates.length > 0 ? getRepresentativeIv(inference) : 0;
  }

  return next;
}

function getMinimumObservedStats(
  baseStats: RemotePokemon["stats"] | undefined,
  level: number,
  nature: string,
): StatSpread | null {
  if (!baseStats) {
    return null;
  }

  const minimum = calculateEffectiveStats(
    baseStats,
    level,
    nature,
    createEmptySpread(0),
    createEmptySpread(0),
  );

  return {
    hp: minimum.hp,
    atk: minimum.atk,
    def: minimum.def,
    spa: minimum.spa,
    spd: minimum.spd,
    spe: minimum.spe,
  };
}

function applyMinimumObservedStats(
  draft: ReturnType<typeof createCandidateDraft>,
  minimumObservedStats: StatSpread | null,
) {
  if (!minimumObservedStats) {
    return draft;
  }

  return {
    ...draft,
    stats: {
      hp: Math.max(draft.stats.hp, minimumObservedStats.hp),
      atk: Math.max(draft.stats.atk, minimumObservedStats.atk),
      def: Math.max(draft.stats.def, minimumObservedStats.def),
      spa: Math.max(draft.stats.spa, minimumObservedStats.spa),
      spd: Math.max(draft.stats.spd, minimumObservedStats.spd),
      spe: Math.max(draft.stats.spe, minimumObservedStats.spe),
    },
  };
}

function getObservedStatIssues(
  draft: ReturnType<typeof createCandidateDraft>,
  baseStats: RemotePokemon["stats"] | undefined,
) {
  const issues: Partial<Record<StatKey, string>> = {};

  if (!baseStats) {
    return issues;
  }

  for (const stat of statOrder) {
    const observed = draft.stats[stat.key];
    if (observed <= 0) {
      continue;
    }

    const inference = inferIvForObservedStat({
      baseStats,
      level: draft.level,
      nature: draft.nature,
      stat: stat.key,
      observed,
    });

    if (inference.issue === "evs") {
      issues[stat.key] =
        "No cuadra: sugiere EVs o valor fuera del rango natural.";
      continue;
    }

    if (inference.issue === "range" || inference.candidates.length === 0) {
      issues[stat.key] = "No cuadra con nivel, naturaleza e IV posible.";
    }
  }

  return issues;
}

function StatInputs({
  values,
  onChange,
  errors,
}: {
  values: StatSpread;
  onChange: (key: StatKey, value: number) => void;
  errors?: Partial<Record<StatKey, string>>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {statOrder.map((stat) => (
        <SpreadInput
          key={stat.key}
          label={stat.label.toUpperCase()}
          value={values[stat.key]}
          max={999}
          orientation="horizontal"
          error={errors?.[stat.key]}
          onChange={(next) => onChange(stat.key, next)}
        />
      ))}
    </div>
  );
}

function GenderIconPicker({
  value,
  onChange,
}: {
  value: PokemonGender;
  onChange: (next: PokemonGender) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(value === "male" ? "unknown" : "male")}
        aria-label="Set male"
        title="Male"
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
          value === "male"
            ? "border-info-line bg-info-fill text-info-soft"
            : "border-line bg-surface-4 text-muted hover:bg-surface-6",
        )}
      >
        <Mars className="h-4.5 w-4.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "female" ? "unknown" : "female")}
        aria-label="Set female"
        title="Female"
        className={clsx(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition",
          value === "female"
            ? "border-danger-line bg-danger-fill text-danger-soft"
            : "border-line bg-surface-4 text-muted hover:bg-surface-6",
        )}
      >
        <Venus className="h-4.5 w-4.5" />
      </button>
      <span className="text-xs text-text-faint">
        {value === "unknown" ? "cualquiera" : value}
      </span>
    </div>
  );
}

export function GrindPoolSection({
  speciesCatalog,
  pokemonIndex,
}: {
  speciesCatalog: SpeciesCatalogEntry[];
  pokemonIndex: Record<string, RemotePokemon>;
}) {
  const [species, setSpecies] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedCandidateIds, setExpandedCandidateIds] = useState<string[]>(
    [],
  );
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const perfectSpecimenForm = useForm<PerfectSpecimen>({
    defaultValues: createPerfectSpecimen(),
  });
  const draftForm = useForm<ReturnType<typeof createCandidateDraft>>({
    defaultValues: createCandidateDraft(),
  });
  const safePerfectSpecimen = normalizePerfectSpecimen(
    perfectSpecimenForm.watch(),
  );
  const safeDraft = normalizeDraft(draftForm.watch());
  const previousMinimumObservedStatsRef = useRef<StatSpread | null>(null);

  const speciesMeta = speciesCatalog.find(
    (entry) => normalizeName(entry.name) === normalizeName(species),
  );
  const resolvedPokemon = species
    ? pokemonIndex[normalizeName(species)]
    : undefined;
  const spriteUrl =
    resolvedPokemon && speciesMeta
      ? buildSpriteUrls(resolvedPokemon.name, speciesMeta.dex).spriteUrl
      : undefined;
  const abilityOptions = resolvedPokemon?.abilities ?? [];
  const minimumObservedStats = useMemo(
    () =>
      getMinimumObservedStats(
        resolvedPokemon?.stats,
        safeDraft.level,
        safeDraft.nature,
      ),
    [resolvedPokemon?.stats, safeDraft.level, safeDraft.nature],
  );
  const effectiveDraftForValidation = useMemo(
    () => applyMinimumObservedStats(safeDraft, minimumObservedStats),
    [minimumObservedStats, safeDraft],
  );
  const perfectSpecimenValidation =
    perfectSpecimenSchema.safeParse(safePerfectSpecimen);
  const draftValidation = grindCandidateDraftSchema.safeParse(
    effectiveDraftForValidation,
  );
  const draftStatIssues = useMemo(
    () =>
      getObservedStatIssues(
        effectiveDraftForValidation,
        resolvedPokemon?.stats,
      ),
    [effectiveDraftForValidation, resolvedPokemon?.stats],
  );
  const hasDraftStatIssues = Object.keys(draftStatIssues).length > 0;

  useEffect(() => {
    if (!minimumObservedStats) {
      previousMinimumObservedStatsRef.current = null;
      return;
    }

    const previousBaseline = previousMinimumObservedStatsRef.current;
    const currentStats = draftForm.getValues("stats");
    const nextStats = { ...currentStats };
    let hasChanges = false;

    for (const stat of statOrder) {
      const current = currentStats[stat.key];
      const nextMinimum = minimumObservedStats[stat.key];
      const previousMinimum = previousBaseline?.[stat.key] ?? 0;

      if (current <= previousMinimum || current < nextMinimum) {
        nextStats[stat.key] = nextMinimum;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      draftForm.setValue("stats", nextStats, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    previousMinimumObservedStatsRef.current = minimumObservedStats;
  }, [draftForm, minimumObservedStats]);

  useEffect(() => {
    if (!isAddCandidateOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAddCandidateOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddCandidateOpen]);

  const rankedCandidates = useMemo(
    () =>
      [...candidates]
        .map((entry) => {
          const candidate = normalizeCandidate(entry);
          const estimatedIvs = getEstimatedIvs(
            candidate,
            resolvedPokemon?.stats,
          );
          const candidateWithEstimatedIvs = {
            ...candidate,
            stats: estimatedIvs,
          };
          const candidateNatureEffect = getNatureEffect(candidate.nature);

          return {
            ...candidate,
            estimatedIvs,
            candidateNatureEffect,
            priorityScore: getPriorityScore(
              candidateWithEstimatedIvs,
              safePerfectSpecimen,
            ),
            statDistance: getDistance(estimatedIvs, safePerfectSpecimen.stats),
            exactMatches: getExactMatches(
              estimatedIvs,
              safePerfectSpecimen.stats,
            ),
            percent: getPercent(estimatedIvs, safePerfectSpecimen.stats),
            inferenceIssues: statOrder.filter(
              (stat) =>
                estimatedIvs[stat.key] === 0 && candidate.stats[stat.key] > 0,
            ),
            favoredStatMatch:
              !!candidateNatureEffect.up &&
              safePerfectSpecimen.preferredNatureStats.includes(
                candidateNatureEffect.up as NatureStatKey,
              ),
            abilityMatch:
              !safePerfectSpecimen.ability ||
              candidate.ability === safePerfectSpecimen.ability,
            genderMatch:
              safePerfectSpecimen.gender === "unknown" ||
              candidate.gender === safePerfectSpecimen.gender,
            totalScore:
              getDistance(estimatedIvs, safePerfectSpecimen.stats) -
              getPriorityScore(candidateWithEstimatedIvs, safePerfectSpecimen),
          };
        })
        .sort((left, right) => {
          if (left.priorityScore !== right.priorityScore)
            return right.priorityScore - left.priorityScore;
          if (left.totalScore !== right.totalScore)
            return left.totalScore - right.totalScore;
          if (left.exactMatches !== right.exactMatches)
            return right.exactMatches - left.exactMatches;
          return left.createdAt - right.createdAt;
        }),
    [candidates, resolvedPokemon?.stats, safePerfectSpecimen],
  );

  function resetPool() {
    perfectSpecimenForm.reset(createPerfectSpecimen());
    draftForm.reset(createCandidateDraft());
    setCandidates([]);
    setExpandedCandidateIds([]);
  }

  function handleChangeDraftStat(key: StatKey, value: number) {
    draftForm.setValue(`stats.${key}`, value, { shouldDirty: true });
  }

  function handleAddCandidate() {
    if (!draftValidation.success || hasDraftStatIssues) {
      return;
    }

    const nextCandidate: Candidate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level: safeDraft.level,
      gender: safeDraft.gender,
      nature: safeDraft.nature,
      ability: safeDraft.ability,
      notes: safeDraft.notes.trim(),
      stats: safeDraft.stats,
      createdAt: Date.now(),
    };

    setCandidates((current) => [...current, nextCandidate]);
    draftForm.reset(createCandidateDraft());
    setIsAddCandidateOpen(false);
  }

  function toggleCandidateDetails(candidateId: string) {
    setExpandedCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="display-face text-sm text-accent">Grind Pool</p>
        <p className={grindPoolSectionIntroClassName}>
          Mismo Pokémon, múltiples capturas, un ejemplar perfecto como benchmark
          y ranking por cercanía.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
        <div className="space-y-4">
          <div className="surface-card p-4">
            <p className="display-face micro-copy text-muted">Species</p>
            <div className="mt-2">
              <SpeciesCombobox
                value={species}
                speciesCatalog={speciesCatalog}
                onChange={(next) => {
                  setSpecies(next);
                  setCandidates([]);
                  draftForm.reset(createCandidateDraft());
                  perfectSpecimenForm.reset(createPerfectSpecimen());
                }}
              />
            </div>

            {resolvedPokemon && speciesMeta ? (
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="display-face text-lg text-text">
                    {resolvedPokemon.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Dex #{speciesMeta.dex}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {speciesMeta.types.map((type) => (
                      <TypeBadge key={`grind-pool-type-${type}`} type={type} />
                    ))}
                  </div>
                </div>
                <PokemonSprite
                  species={resolvedPokemon.name}
                  spriteUrl={spriteUrl}
                  size="default"
                  chrome="plain"
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Elige una especie para fijar el pool. Todo lo que agregues se
                rankea dentro de esa misma especie.
              </p>
            )}
          </div>

          <div className="surface-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="display-face micro-copy text-accent">
                  Perfect specimen
                </p>
                <p className={grindPoolSectionIntroClassName}>
                  Este benchmark es el ideal contra el que se medirán todas las
                  capturas.
                </p>
              </div>
              <Star className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className={grindPoolFieldStackClassName}>
                  <p className="display-face micro-copy text-muted">
                    Stats clave para naturaleza
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <FilterCombobox
                      value={safePerfectSpecimen.preferredNatureStats[0]}
                      options={natureStatOptions}
                      placeholder="Stat 1"
                      searchable={false}
                      onChange={(next) =>
                        perfectSpecimenForm.setValue(
                          "preferredNatureStats",
                          [
                            next as NatureStatKey,
                            safePerfectSpecimen.preferredNatureStats[1],
                          ],
                          { shouldDirty: true },
                        )
                      }
                    />
                    <FilterCombobox
                      value={safePerfectSpecimen.preferredNatureStats[1]}
                      options={natureStatOptions}
                      placeholder="Stat 2"
                      searchable={false}
                      onChange={(next) =>
                        perfectSpecimenForm.setValue(
                          "preferredNatureStats",
                          [
                            safePerfectSpecimen.preferredNatureStats[0],
                            next as NatureStatKey,
                          ],
                          { shouldDirty: true },
                        )
                      }
                    />
                  </div>
                  <p className="mt-1 text-xs text-text-faint">
                    Acepta naturalezas que suban{" "}
                    {safePerfectSpecimen.preferredNatureStats[0].toUpperCase()}{" "}
                    o{" "}
                    {safePerfectSpecimen.preferredNatureStats[1].toUpperCase()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={grindPoolFieldStackClassName}>
                    <p className="display-face micro-copy text-muted">
                      Género preferido
                    </p>
                    <GenderIconPicker
                      value={safePerfectSpecimen.gender}
                      onChange={(next) =>
                        perfectSpecimenForm.setValue("gender", next, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                  <div className={grindPoolFieldStackClassName}>
                    <p className="display-face micro-copy text-muted">
                      Habilidad ideal
                    </p>
                    <FilterCombobox
                      value={safePerfectSpecimen.ability}
                      options={abilityOptions}
                      placeholder="Ability"
                      searchable={false}
                      onChange={(next) =>
                        perfectSpecimenForm.setValue("ability", next, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-text-faint">
                <span className="chip-surface px-2.5 py-1">
                  IV perfectos fijos
                </span>
                <span>Se asume `31` en todos los stats del benchmark.</span>
              </div>
              {!perfectSpecimenValidation.success ? (
                <p className="mt-2 text-xs text-danger">
                  Benchmark incompleto o inválido.
                </p>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full max-w-md"
            onClick={() => setIsAddCandidateOpen(true)}
            disabled={!speciesMeta}
          >
            Agregar ejemplar
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="display-face micro-copy text-accent">Ranking</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={resetPool}
              disabled={candidates.length === 0}
            >
              Reset pool
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {rankedCandidates.length === 0 ? (
              <div className="soft-card-dashed border border-line-soft px-4 py-8 text-center text-sm text-text-faint">
                Agrega capturas para empezar a rankear.
              </div>
            ) : (
              rankedCandidates.map((candidate, index) => (
                <article
                  key={candidate.id}
                  className="surface-card-muted border border-line-soft"
                >
                  <button
                    type="button"
                    onClick={() => toggleCandidateDetails(candidate.id)}
                    className="flex flex-col w-full items-start justify-between gap-3 p-3 text-left"
                  >
                    <div className="min-w-0 w-full flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="display-face micro-copy text-muted">
                          #{index + 1}{" "}
                          {index === 0 ? "mejor ahora" : "candidato"}
                        </div>
                        <p className="mt-1 display-face text-base text-text">
                          Ejemplar {index + 1}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <Trophy className="h-4 w-4 text-warning-strong" />
                        ) : null}
                        <span className="text-xs text-text-faint">
                          {expandedCandidateIds.includes(candidate.id)
                            ? "Ocultar detalle"
                            : "Ver detalle"}
                        </span>
                      </div>
                    </div>
                    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted">
                      <span className="chip-surface px-3 py-1">
                        {candidate.percent}% cercanía
                      </span>
                      <span className="chip-surface px-3 py-1">
                        {candidate.exactMatches}/6 exactos
                      </span>
                      <span className="chip-surface px-3 py-1">
                        Stat clave:{" "}
                        {candidate.favoredStatMatch ? "match" : "fuera"}
                      </span>
                      <span className="chip-surface px-3 py-1">
                        Habilidad: {candidate.abilityMatch ? "match" : "fuera"}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedCandidateIds.includes(candidate.id) ? (
                      <motion.div
                        key={`${candidate.id}-details`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-line-soft px-3 pb-3 pt-3 text-center">
                          <div className="flex gap-3">
                            <div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted">
                                <span className="chip-surface px-3 py-1">
                                  Lvl {candidate.level}
                                </span>
                                <span className="chip-surface px-3 py-1">
                                  Género: {candidate.gender}
                                </span>
                                <span className="chip-surface px-3 py-1">
                                  Nature: {candidate.nature || "Sin definir"}
                                </span>
                                <span className="chip-surface px-3 py-1">
                                  Favorece:{" "}
                                  {candidate.candidateNatureEffect.up?.toUpperCase() ??
                                    "ninguno"}
                                </span>
                                <span className="chip-surface px-3 py-1">
                                  Ability: {candidate.ability || "Sin definir"}
                                </span>
                              </div>
                              {candidate.notes ? (
                                <p className="mt-2 text-sm text-muted">
                                  {candidate.notes}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap w-full justify-center">
                            <div className="mt-3 max-w-md w-full">
                              <p className="display-face micro-copy text-muted">
                                IV estimado
                              </p>
                              <div className="mt-2 overflow-x-auto">
                                <div className="grid grid-cols-6 gap-2">
                                  {statOrder.map((stat) => {
                                    const current =
                                      candidate.estimatedIvs[stat.key];
                                    const target =
                                      safePerfectSpecimen.stats[stat.key];
                                    const delta = current - target;

                                    return (
                                      <div
                                        key={`${candidate.id}-estimated-${stat.key}`}
                                        className=" bg-surface-3 text-center"
                                      >
                                        <div className="display-face micro-copy text-muted">
                                          {stat.label}
                                        </div>
                                        <div className="mt-1 text-sm text-text">
                                          {current}
                                        </div>
                                        <div className="mt-1 text-xs text-text-faint">
                                          {delta === 0
                                            ? "perfecto"
                                            : delta > 0
                                              ? `+${delta}`
                                              : delta}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 w-full max-w-md">
                              <p className="display-face micro-copy text-muted">
                                Stats observados
                              </p>
                              <div className="mt-2 overflow-x-auto">
                                <div className="grid grid-cols-6 gap-2">
                                  {statOrder.map((stat) => (
                                    <div
                                      key={`${candidate.id}-observed-${stat.key}`}
                                      className=" bg-surface-3 px-2 py-2 text-center"
                                    >
                                      <div className="display-face micro-copy text-muted">
                                        {stat.label}
                                      </div>
                                      <div className="mt-1 text-sm text-text">
                                        {candidate.stats[stat.key]}
                                      </div>
                                      <div className="mt-1 text-xs text-text-faint">
                                        &nbsp;
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                            <span className="chip-surface px-3 py-1">
                              Priority score: {candidate.priorityScore}
                            </span>
                            <span className="chip-surface px-3 py-1">
                              Score total: {candidate.totalScore}
                            </span>
                            <span className="chip-surface px-3 py-1">
                              Distancia IV: {candidate.statDistance}
                            </span>
                            <span className="chip-surface px-3 py-1">
                              Género:{" "}
                              {candidate.genderMatch ? "match" : "fuera"}
                            </span>
                            {candidate.inferenceIssues.length > 0 ? (
                              <span className="chip-surface px-3 py-1">
                                IV incierto:{" "}
                                {candidate.inferenceIssues
                                  .map((stat) => stat.label)
                                  .join(", ")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddCandidateOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-scrim z-120"
            onClick={() => setIsAddCandidateOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="dialog-surface max-w-3xl p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="display-face micro-copy text-accent">
                    Agregar ejemplar
                  </p>
                  <p className={grindPoolSectionIntroClassName}>
                    Captura uno nuevo, guárdalo en el pool y vuelve al ranking
                    sin perder contexto.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddCandidateOpen(false)}
                >
                  Cerrar
                </Button>
              </div>

              <div className={cn("mt-4", grindPoolCompactFieldGridClassName)}>
                <div className={grindPoolFieldStackClassName}>
                  <SpreadInput
                    label="LVL"
                    value={safeDraft.level}
                    max={100}
                    orientation="horizontal"
                    onChange={(next) =>
                      draftForm.setValue(
                        "level",
                        Math.max(1, Math.min(100, next)),
                        { shouldDirty: true },
                      )
                    }
                  />
                </div>
                <div className={grindPoolFieldStackClassName}>
                  <p className="display-face micro-copy text-muted">Género</p>
                  <GenderIconPicker
                    value={safeDraft.gender}
                    onChange={(next) =>
                      draftForm.setValue("gender", next, { shouldDirty: true })
                    }
                  />
                </div>
                <div className={grindPoolFieldStackClassName}>
                  <p className="display-face micro-copy text-muted">
                    Naturaleza
                  </p>
                  <FilterCombobox
                    value={safeDraft.nature}
                    options={natureOptions}
                    placeholder="Nature"
                    searchable={false}
                    onChange={(next) =>
                      draftForm.setValue("nature", next, { shouldDirty: true })
                    }
                  />
                  <p className="mt-1 text-xs text-text-faint">
                    Favorece:{" "}
                    {getNatureEffect(safeDraft.nature).up?.toUpperCase() ??
                      "ninguno"}
                  </p>
                </div>
                <div className={grindPoolFieldStackClassName}>
                  <p className="display-face micro-copy text-muted">
                    Habilidad
                  </p>
                  <FilterCombobox
                    value={safeDraft.ability}
                    options={abilityOptions}
                    placeholder="Ability"
                    searchable={false}
                    onChange={(next) =>
                      draftForm.setValue("ability", next, { shouldDirty: true })
                    }
                  />
                </div>
              </div>

              <label className="mt-3 block">
                <span className="display-face micro-copy text-muted">
                  Notas
                </span>
                <Input
                  className="mt-1.5 h-10"
                  placeholder="Ruta, encuentro, observaciones, etc."
                  value={safeDraft.notes}
                  onChange={(event) =>
                    draftForm.setValue("notes", event.target.value, {
                      shouldDirty: true,
                    })
                  }
                />
              </label>

              <div className="mt-4">
                <p className="display-face micro-copy text-muted">
                  Stats observados
                </p>
                <p className="mt-1 text-xs text-text-faint">
                  Se convierten a IV estimado usando nivel, naturaleza y la
                  especie elegida.
                </p>
              </div>

              <div className="mt-3">
                <StatInputs
                  values={safeDraft.stats}
                  onChange={handleChangeDraftStat}
                  errors={draftStatIssues}
                />
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => draftForm.reset(createCandidateDraft())}
                >
                  Limpiar draft
                </Button>
                <Button
                  type="button"
                  onClick={handleAddCandidate}
                  disabled={
                    !speciesMeta ||
                    !draftValidation.success ||
                    hasDraftStatIssues
                  }
                >
                  Agregar al pool
                </Button>
              </div>
              {!draftValidation.success ? (
                <p className="mt-2 text-xs text-danger">
                  Completa nivel, naturaleza, habilidad y stats válidos.
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
