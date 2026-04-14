"use client";

import { Star } from 'lucide-react';

import {
  FilterCombobox,
  PokemonSprite,
  SpeciesCombobox,
  TypeBadge,
} from '@/components/BuilderShared';
import { Button } from '@/components/ui/Button';

import { AddCandidateModal } from './AddCandidateModal';
import { CandidateCard } from './CandidateCard';
import { GenderIconPicker } from './GenderIconPicker';
import { natureStatOptions } from './types';
import { useGrindPool } from './useGrindPool';

import type { RemotePokemon } from "@/lib/teamAnalysis";
import type { NatureStatKey, SpeciesCatalogEntry } from "./types";

const grindPoolFieldStackClassName = "space-y-1.5";
const grindPoolSectionIntroClassName = "mt-1 text-sm text-muted";

export function GrindPoolSection({
  speciesCatalog,
  pokemonIndex,
}: {
  speciesCatalog: SpeciesCatalogEntry[];
  pokemonIndex: Record<string, RemotePokemon>;
}) {
  const {
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
  } = useGrindPool({ speciesCatalog, pokemonIndex });

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
          {/* Species picker card */}
          <div className="surface-card p-4">
            <p className="display-face micro-copy text-muted">Species</p>
            <div className="mt-2">
              <SpeciesCombobox
                value={species}
                speciesCatalog={speciesCatalog}
                onChange={handleChangeSpecies}
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

          {/* Perfect specimen card */}
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

        {/* Ranking panel */}
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
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  rank={index}
                  isExpanded={expandedCandidateIds.includes(candidate.id)}
                  safePerfectSpecimen={safePerfectSpecimen}
                  onToggleDetails={() => toggleCandidateDetails(candidate.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        draftForm={draftForm}
        safeDraft={safeDraft}
        draftValidation={draftValidation}
        draftStatIssues={draftStatIssues}
        hasDraftStatIssues={hasDraftStatIssues}
        abilityOptions={abilityOptions}
        speciesMeta={speciesMeta}
        onChangeStat={handleChangeDraftStat}
        onSubmit={handleAddCandidate}
      />
    </section>
  );
}
