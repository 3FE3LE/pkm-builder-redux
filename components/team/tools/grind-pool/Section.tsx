"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Star, Trophy, X } from "lucide-react";

import { FilterCombobox, PokemonSprite, SpeciesCombobox, TypeBadge } from "@/components/BuilderShared";
import { SpreadInput } from "@/components/team/UI";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { genderOptions, natureOptions } from "@/lib/builderForm";
import type { PokemonGender } from "@/lib/builder";
import { getNatureEffect } from "@/lib/domain/battle";
import { getRepresentativeIv, inferIvForObservedStat } from "@/lib/domain/ivCalculator";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
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

const modalSurfaceClassName =
  "panel-strong panel-frame relative w-full max-w-6xl overflow-hidden p-4 sm:p-5";

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

function normalizePerfectSpecimen(specimen: Partial<PerfectSpecimen> | undefined): PerfectSpecimen {
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

function normalizeDraft(draft: Partial<ReturnType<typeof createCandidateDraft>> | undefined) {
  const fallback = createCandidateDraft();
  const rawLevel = Number(draft?.level ?? fallback.level);
  const level = Number.isFinite(rawLevel) ? Math.max(1, Math.min(100, Math.round(rawLevel))) : fallback.level;

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

function normalizeCandidate(candidate: Partial<Candidate> | undefined): Candidate {
  const fallback = createCandidateDraft();
  const rawLevel = Number(candidate?.level ?? fallback.level);
  const level = Number.isFinite(rawLevel) ? Math.max(1, Math.min(100, Math.round(rawLevel))) : fallback.level;

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
  return statOrder.reduce((total, stat) => total + Math.abs(current[stat.key] - target[stat.key]), 0);
}

function getExactMatches(current: StatSpread, target: StatSpread) {
  return statOrder.reduce((total, stat) => total + (current[stat.key] === target[stat.key] ? 1 : 0), 0);
}

function getPercent(current: StatSpread, target: StatSpread) {
  const baseline = Math.max(1, statOrder.reduce((total, stat) => total + Math.max(target[stat.key], 1), 0));
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

function getEstimatedIvs(candidate: Candidate, baseStats: RemotePokemon["stats"] | undefined): StatSpread {
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

    next[stat.key] = inference.candidates.length > 0 ? getRepresentativeIv(inference) : 0;
  }

  return next;
}

function StatInputs({
  values,
  onChange,
}: {
  values: StatSpread;
  onChange: (key: StatKey, value: number) => void;
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
          onChange={(next) => onChange(stat.key, next)}
        />
      ))}
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
  const [open, setOpen] = useState(false);
  const [species, setSpecies] = useState("");
  const [perfectSpecimen, setPerfectSpecimen] = useState<PerfectSpecimen>(createPerfectSpecimen());
  const [draft, setDraft] = useState(createCandidateDraft());
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const safePerfectSpecimen = normalizePerfectSpecimen(perfectSpecimen);
  const safeDraft = normalizeDraft(draft);

  const speciesMeta = speciesCatalog.find((entry) => normalizeName(entry.name) === normalizeName(species));
  const resolvedPokemon = species ? pokemonIndex[normalizeName(species)] : undefined;
  const spriteUrl =
    resolvedPokemon && speciesMeta
      ? buildSpriteUrls(resolvedPokemon.name, speciesMeta.dex).spriteUrl
      : undefined;
  const abilityOptions = resolvedPokemon?.abilities ?? [];

  const rankedCandidates = useMemo(
    () =>
      [...candidates]
        .map((entry) => {
          const candidate = normalizeCandidate(entry);
          const estimatedIvs = getEstimatedIvs(candidate, resolvedPokemon?.stats);
          const candidateWithEstimatedIvs = { ...candidate, stats: estimatedIvs };
          const candidateNatureEffect = getNatureEffect(candidate.nature);

          return {
            ...candidate,
            estimatedIvs,
            candidateNatureEffect,
            priorityScore: getPriorityScore(candidateWithEstimatedIvs, safePerfectSpecimen),
            statDistance: getDistance(estimatedIvs, safePerfectSpecimen.stats),
            exactMatches: getExactMatches(estimatedIvs, safePerfectSpecimen.stats),
            percent: getPercent(estimatedIvs, safePerfectSpecimen.stats),
            inferenceIssues: statOrder.filter((stat) => estimatedIvs[stat.key] === 0 && candidate.stats[stat.key] > 0),
            favoredStatMatch:
              !!candidateNatureEffect.up &&
              safePerfectSpecimen.preferredNatureStats.includes(candidateNatureEffect.up as NatureStatKey),
            abilityMatch: !safePerfectSpecimen.ability || candidate.ability === safePerfectSpecimen.ability,
            genderMatch: safePerfectSpecimen.gender === "unknown" || candidate.gender === safePerfectSpecimen.gender,
            totalScore:
              getDistance(estimatedIvs, safePerfectSpecimen.stats) -
              getPriorityScore(candidateWithEstimatedIvs, safePerfectSpecimen),
          };
        })
        .sort((left, right) => {
          if (left.priorityScore !== right.priorityScore) return right.priorityScore - left.priorityScore;
          if (left.totalScore !== right.totalScore) return left.totalScore - right.totalScore;
          if (left.exactMatches !== right.exactMatches) return right.exactMatches - left.exactMatches;
          return left.createdAt - right.createdAt;
        }),
    [candidates, resolvedPokemon?.stats, safePerfectSpecimen],
  );

  function resetPool() {
    setPerfectSpecimen(createPerfectSpecimen());
    setDraft(createCandidateDraft());
    setCandidates([]);
  }

  function handleChangeDraftStat(key: StatKey, value: number) {
    setDraft((current) => ({
      ...normalizeDraft(current),
      stats: {
        ...normalizeDraft(current).stats,
        [key]: value,
      },
    }));
  }

  function handleAddCandidate() {
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
    setDraft(createCandidateDraft());
  }

  return (
    <>
      <section className="panel panel-frame px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="display-face text-lg text-text">Grind Pool</p>
            <p className="mt-1 text-sm text-muted">
              Junta varios ejemplares del mismo Pokémon y compáralos en frío contra un benchmark perfecto.
            </p>
          </div>
          <Button type="button" size="lg" onClick={() => setOpen(true)}>
            Abrir pool
          </Button>
        </div>
      </section>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="modal-scrim z-120 px-3 py-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={modalSurfaceClassName}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="display-face text-sm text-accent">Grind Pool</p>
                  <p className="mt-2 text-sm text-muted">
                    Mismo Pokémon, múltiples capturas, un ejemplar perfecto como benchmark y ranking por cercanía.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
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
                          setDraft(createCandidateDraft());
                          setPerfectSpecimen(createPerfectSpecimen());
                        }}
                      />
                    </div>

                    {resolvedPokemon && speciesMeta ? (
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="display-face text-lg text-text">{resolvedPokemon.name}</p>
                          <p className="mt-1 text-sm text-muted">Dex #{speciesMeta.dex}</p>
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
                        Elige una especie para fijar el pool. Todo lo que agregues se rankea dentro de esa misma especie.
                      </p>
                    )}
                  </div>

                  <div className="surface-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="display-face micro-copy text-accent">Perfect specimen</p>
                        <p className="mt-1 text-sm text-muted">
                          Este benchmark es el ideal contra el que se medirán todas las capturas.
                        </p>
                      </div>
                      <Star className="h-4 w-4 text-accent" />
                    </div>
                    <div className="mt-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="display-face micro-copy text-muted">Stats clave para naturaleza</p>
                          <div className="mt-1.5">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <FilterCombobox
                                value={safePerfectSpecimen.preferredNatureStats[0]}
                                options={natureStatOptions}
                                placeholder="Stat 1"
                                searchable={false}
                                onChange={(next) =>
                                  setPerfectSpecimen((current) => ({
                                    ...current,
                                    preferredNatureStats: [
                                      next as NatureStatKey,
                                      normalizePerfectSpecimen(current).preferredNatureStats[1],
                                    ],
                                  }))
                                }
                              />
                              <FilterCombobox
                                value={safePerfectSpecimen.preferredNatureStats[1]}
                                options={natureStatOptions}
                                placeholder="Stat 2"
                                searchable={false}
                                onChange={(next) =>
                                  setPerfectSpecimen((current) => ({
                                    ...current,
                                    preferredNatureStats: [
                                      normalizePerfectSpecimen(current).preferredNatureStats[0],
                                      next as NatureStatKey,
                                    ],
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-text-faint">
                            Acepta naturalezas que suban {safePerfectSpecimen.preferredNatureStats[0].toUpperCase()} o{" "}
                            {safePerfectSpecimen.preferredNatureStats[1].toUpperCase()}
                          </p>
                        </div>
                        <div className="grid gap-3">
                          <div>
                            <p className="display-face micro-copy text-muted">Género preferido</p>
                            <div className="mt-1.5">
                              <FilterCombobox
                                value={safePerfectSpecimen.gender}
                                options={genderOptions}
                                placeholder="Gender"
                                searchable={false}
                                onChange={(next) =>
                                  setPerfectSpecimen((current) => ({
                                    ...normalizePerfectSpecimen(current),
                                    gender: next as PokemonGender,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <p className="display-face micro-copy text-muted">Habilidad ideal</p>
                            <div className="mt-1.5">
                              <FilterCombobox
                                value={safePerfectSpecimen.ability}
                                options={abilityOptions}
                                placeholder="Ability"
                                searchable={false}
                                onChange={(next) =>
                                  setPerfectSpecimen((current) => ({
                                    ...normalizePerfectSpecimen(current),
                                    ability: next,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg border border-line-soft bg-surface-3 px-3 py-3">
                        <div className="display-face micro-copy text-muted">IVs perfectos fijos</div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                          {statOrder.map((stat) => (
                            <div
                              key={`perfect-fixed-${stat.key}`}
                              className="rounded-lg border border-line-soft bg-surface-2 px-2 py-2 text-center"
                            >
                              <div className="display-face micro-copy text-muted">{stat.label}</div>
                              <div className="mt-1 text-sm text-text">31</div>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-text-faint">
                          El benchmark siempre asume IV perfecto. Aquí solo decides género y habilidad ideales, más
                          los dos stats que quieres ver favorecidos por naturaleza.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="surface-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="display-face micro-copy text-accent">Agregar ejemplar</p>
                        <p className="mt-1 text-sm text-muted">
                          Mete uno nuevo, guarda la captura y sigue el grindeo sin ir y venir entre hierba y PC.
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-accent" />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="display-face micro-copy text-muted">Nivel</p>
                          <div className="mt-1.5">
                            <SpreadInput
                              label="LVL"
                              value={safeDraft.level}
                              max={100}
                              orientation="horizontal"
                              onChange={(next) =>
                                setDraft((current) => ({
                                  ...normalizeDraft(current),
                                  level: Math.max(1, Math.min(100, next)),
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <p className="display-face micro-copy text-muted">Género</p>
                          <div className="mt-1.5">
                            <FilterCombobox
                              value={safeDraft.gender}
                              options={genderOptions}
                              placeholder="Gender"
                              searchable={false}
                              onChange={(next) =>
                                setDraft((current) => ({
                                  ...normalizeDraft(current),
                                  gender: next as PokemonGender,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <p className="display-face micro-copy text-muted">Naturaleza</p>
                          <div className="mt-1.5">
                            <FilterCombobox
                              value={safeDraft.nature}
                              options={natureOptions}
                              placeholder="Nature"
                              searchable={false}
                              onChange={(next) =>
                                setDraft((current) => ({
                                  ...normalizeDraft(current),
                                  nature: next,
                                }))
                              }
                            />
                          </div>
                          <p className="mt-1 text-xs text-text-faint">
                            Favorece: {getNatureEffect(safeDraft.nature).up?.toUpperCase() ?? "ninguno"}
                          </p>
                        </div>
                        <div>
                          <p className="display-face micro-copy text-muted">Habilidad</p>
                          <div className="mt-1.5">
                            <FilterCombobox
                              value={safeDraft.ability}
                              options={abilityOptions}
                              placeholder="Ability"
                              searchable={false}
                              onChange={(next) =>
                                setDraft((current) => ({
                                  ...normalizeDraft(current),
                                  ability: next,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <label className="mt-3 block">
                      <span className="display-face micro-copy text-muted">Notas</span>
                      <Input
                        className="mt-1.5 h-10"
                        placeholder="Ruta, encuentro, observaciones, etc."
                        value={safeDraft.notes}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...normalizeDraft(current),
                            notes: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="mt-4">
                      <p className="display-face micro-copy text-muted">Stats observados</p>
                      <p className="mt-1 text-xs text-text-faint">
                        Se convierten a IV estimado usando nivel, naturaleza y la especie elegida.
                      </p>
                    </div>

                    <div className="mt-3">
                      <StatInputs values={safeDraft.stats} onChange={handleChangeDraftStat} />
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setDraft(createCandidateDraft())}>
                        Limpiar draft
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddCandidate}
                        disabled={!speciesMeta || !safeDraft.ability}
                      >
                        Agregar al pool
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="surface-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="display-face micro-copy text-accent">Ranking</p>
                        <p className="mt-1 text-sm text-muted">
                          Menor distancia IV total = ejemplar más cercano al benchmark perfecto.
                        </p>
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
                            className="surface-card-muted border border-line-soft p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="display-face micro-copy text-muted">
                                  #{index + 1} {index === 0 ? "mejor ahora" : "candidato"}
                                </div>
                                <p className="mt-1 display-face text-base text-text">Ejemplar {index + 1}</p>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                                  <span className="chip-surface px-3 py-1">Lvl {candidate.level}</span>
                                  <span className="chip-surface px-3 py-1">Género: {candidate.gender}</span>
                                  <span className="chip-surface px-3 py-1">
                                    Nature: {candidate.nature || "Sin definir"}
                                  </span>
                                  <span className="chip-surface px-3 py-1">
                                    Favorece: {candidate.candidateNatureEffect.up?.toUpperCase() ?? "ninguno"}
                                  </span>
                                  <span className="chip-surface px-3 py-1">
                                    Ability: {candidate.ability || "Sin definir"}
                                  </span>
                                </div>
                                {candidate.notes ? (
                                  <p className="mt-1 text-sm text-muted">{candidate.notes}</p>
                                ) : null}
                              </div>
                              {index === 0 ? <Trophy className="h-4 w-4 text-warning-strong" /> : null}
                            </div>

                            <div className="mt-3">
                              <p className="display-face micro-copy text-muted">IV estimado</p>
                              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                                {statOrder.map((stat) => {
                                  const current = candidate.estimatedIvs[stat.key];
                                  const target = safePerfectSpecimen.stats[stat.key];
                                  const delta = current - target;

                                  return (
                                    <div
                                      key={`${candidate.id}-estimated-${stat.key}`}
                                      className="rounded-lg border border-line-soft bg-surface-3 px-2 py-2 text-center"
                                    >
                                      <div className="display-face micro-copy text-muted">{stat.label}</div>
                                      <div className="mt-1 text-sm text-text">{current}</div>
                                      <div className="mt-1 text-xs text-text-faint">
                                        {delta === 0 ? "perfecto" : delta > 0 ? `+${delta}` : delta}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="mt-3">
                              <p className="display-face micro-copy text-muted">Stats observados</p>
                              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                                {statOrder.map((stat) => (
                                  <div
                                    key={`${candidate.id}-observed-${stat.key}`}
                                    className="rounded-lg border border-line-soft bg-surface-3 px-2 py-2 text-center"
                                  >
                                    <div className="display-face micro-copy text-muted">{stat.label}</div>
                                    <div className="mt-1 text-sm text-text">{candidate.stats[stat.key]}</div>
                                    <div className="mt-1 text-xs text-text-faint">observed</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                              <span className="chip-surface px-3 py-1">Priority score: {candidate.priorityScore}</span>
                              <span className="chip-surface px-3 py-1">Score total: {candidate.totalScore}</span>
                              <span className="chip-surface px-3 py-1">Distancia IV: {candidate.statDistance}</span>
                              <span className="chip-surface px-3 py-1">
                                Matches exactos: {candidate.exactMatches}/6
                              </span>
                              <span className="chip-surface px-3 py-1">Cercanía: {candidate.percent}%</span>
                              <span className="chip-surface px-3 py-1">
                                Stat clave: {candidate.favoredStatMatch ? "match" : "fuera"}
                              </span>
                              <span className="chip-surface px-3 py-1">
                                Habilidad: {candidate.abilityMatch ? "match" : "fuera"}
                              </span>
                              <span className="chip-surface px-3 py-1">
                                Género: {candidate.genderMatch ? "match" : "fuera"}
                              </span>
                              {candidate.inferenceIssues.length > 0 ? (
                                <span className="chip-surface px-3 py-1">
                                  IV incierto: {candidate.inferenceIssues.map((stat) => stat.label).join(", ")}
                                </span>
                              ) : null}
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
