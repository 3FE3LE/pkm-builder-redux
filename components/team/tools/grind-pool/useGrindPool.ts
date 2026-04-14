import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { getNatureEffect } from "@/lib/domain/battle";
import {
  applyMinimumObservedStats,
  getDistance,
  getEstimatedIvs,
  getExactMatches,
  getMinimumObservedStats,
  getObservedStatIssues,
  getPercent,
  getPriorityScore,
} from "@/lib/domain/grindPoolScoring";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";

import {
  createCandidateDraft,
  createPerfectSpecimen,
  normalizeCandidate,
  normalizeDraft,
  normalizePerfectSpecimen,
} from "./factories";
import {
  grindCandidateDraftSchema,
  perfectSpecimenSchema,
  statOrder,
} from "./types";

import type { RemotePokemon } from "@/lib/teamAnalysis";
import type {
  Candidate,
  NatureStatKey,
  PerfectSpecimen,
  SpeciesCatalogEntry,
  StatKey,
  StatSpread,
} from "./types";

export function useGrindPool({
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

  function handleChangeSpecies(next: string) {
    setSpecies(next);
    setCandidates([]);
    draftForm.reset(createCandidateDraft());
    perfectSpecimenForm.reset(createPerfectSpecimen());
  }

  return {
    species,
    speciesMeta,
    resolvedPokemon,
    spriteUrl,
    abilityOptions,

    perfectSpecimenForm,
    safePerfectSpecimen,
    perfectSpecimenValidation,

    draftForm,
    safeDraft,
    draftValidation,
    draftStatIssues,
    hasDraftStatIssues,

    candidates,
    rankedCandidates,
    expandedCandidateIds,

    isAddCandidateOpen,
    setIsAddCandidateOpen,

    handleChangeSpecies,
    handleChangeDraftStat,
    handleAddCandidate,
    toggleCandidateDetails,
    resetPool,
  };
}

export type RankedCandidate = ReturnType<
  typeof useGrindPool
>["rankedCandidates"][number];
