"use client";

import { useMemo, useState } from "react";

import { SpeciesCombobox, FilterCombobox } from "@/components/BuilderShared";
import { SpreadInput } from "@/components/team/UI";
import { natureOptions, statKeys } from "@/lib/builderForm";
import { getRepresentativeIv, inferIvForObservedStat } from "@/lib/domain/ivCalculator";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import type { RemotePokemon } from "@/lib/teamAnalysis";
import { createEditable, type EditableMember } from "@/lib/builderStore";
import { normalizeMoveLookupName } from "@/lib/domain/moves";
import { calculateEffectiveStats } from "@/lib/domain/battle";
import { ObservedStatsPanel } from "@/components/team/tools/iv-calculator/ObservedStatsPanel";
import { SelectedPokemonPanel } from "@/components/team/tools/iv-calculator/SelectedPokemonPanel";
import {
  createEmptyObservedState,
  EMPTY_OBSERVED,
  type AddFeedback,
  type IvInferenceByStat,
  type IvObservedState,
  ZERO_SPREAD,
} from "@/components/team/tools/iv-calculator/types";

const ivSectionFieldLabelClassName = "display-face micro-copy text-muted";

type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

export function IvCalculatorSection({
  speciesCatalog,
  pokemonIndex,
  prefillSpecies = "",
  onAddPreparedMember,
}: {
  speciesCatalog: SpeciesCatalogEntry[];
  pokemonIndex: Record<string, RemotePokemon>;
  prefillSpecies?: string;
  onAddPreparedMember: (
    member: EditableMember,
  ) =>
    | { ok: true; reason: null | "pc" }
    | { ok: false; reason: "full" | "duplicate" };
}) {
  const [species, setSpecies] = useState(prefillSpecies);
  const [level, setLevel] = useState("5");
  const [nature, setNature] = useState("Serious");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<EditableMember["gender"]>("unknown");
  const [shiny, setShiny] = useState(false);
  const [observedOverrides, setObservedOverrides] = useState<IvObservedState>(EMPTY_OBSERVED);
  const [addFeedback, setAddFeedback] = useState<AddFeedback>(null);

  const resolvedPokemon = species ? pokemonIndex[normalizeName(species)] : undefined;
  const speciesMeta = speciesCatalog.find((entry) => normalizeName(entry.name) === normalizeName(species));
  const numericLevel = Math.max(1, Math.min(100, Number(level || 1)));
  const spriteUrl = resolvedPokemon && speciesMeta
    ? buildSpriteUrls(resolvedPokemon.name, speciesMeta.dex, { shiny }).spriteUrl
    : undefined;

  const zeroIvStats = useMemo(() => {
    if (!resolvedPokemon?.stats) {
      return null;
    }

    return calculateEffectiveStats(
      resolvedPokemon.stats,
      numericLevel,
      nature,
      ZERO_SPREAD,
      ZERO_SPREAD,
    );
  }, [nature, numericLevel, resolvedPokemon?.stats]);
  const observedStats = useMemo<IvObservedState>(() => {
    if (!zeroIvStats) {
      return EMPTY_OBSERVED;
    }

    return {
      hp: observedOverrides.hp.trim() ? observedOverrides.hp : String(zeroIvStats.hp),
      atk: observedOverrides.atk.trim() ? observedOverrides.atk : String(zeroIvStats.atk),
      def: observedOverrides.def.trim() ? observedOverrides.def : String(zeroIvStats.def),
      spa: observedOverrides.spa.trim() ? observedOverrides.spa : String(zeroIvStats.spa),
      spd: observedOverrides.spd.trim() ? observedOverrides.spd : String(zeroIvStats.spd),
      spe: observedOverrides.spe.trim() ? observedOverrides.spe : String(zeroIvStats.spe),
    };
  }, [observedOverrides, zeroIvStats]);

  const inferences = useMemo(() => {
    if (!resolvedPokemon?.stats) {
      return [];
    }

    return statKeys
      .map((stat) => {
        const rawObserved = observedStats[stat].trim();
        if (!rawObserved) {
          return null;
        }
        const observed = Number(rawObserved);
        if (!Number.isFinite(observed) || observed <= 0) {
          return null;
        }
        return inferIvForObservedStat({
          baseStats: resolvedPokemon.stats,
          level: numericLevel,
          nature,
          stat,
          observed,
        });
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [nature, numericLevel, observedStats, resolvedPokemon?.stats]);

  const inferenceByStat = useMemo(
    () =>
      Object.fromEntries(
        inferences.map((entry) => [entry.stat, entry]),
      ) as IvInferenceByStat,
    [inferences],
  );

  const estimatedIvs = useMemo(() => {
    const next = {
      hp: 0,
      atk: 0,
      def: 0,
      spa: 0,
      spd: 0,
      spe: 0,
    };

    for (const stat of statKeys) {
      const inference = inferenceByStat[stat];
      if (inference) {
        next[stat] = getRepresentativeIv(inference);
      }
    }

    return next;
  }, [inferenceByStat]);

  const suggestedMoves = useMemo(() => {
    if (!resolvedPokemon?.learnsets?.levelUp?.length) {
      return [];
    }

    const seen = new Set<string>();
    return [...resolvedPokemon.learnsets.levelUp]
      .filter((entry) => (entry.level ?? 1) <= numericLevel)
      .sort((left, right) => (left.level ?? 1) - (right.level ?? 1))
      .map((entry) => entry.move)
      .filter((move) => {
        const normalized = normalizeMoveLookupName(move);
        if (seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      })
      .slice(-4);
  }, [numericLevel, resolvedPokemon?.learnsets?.levelUp]);

  const canAddToTeam = Boolean(speciesMeta && resolvedPokemon);

  function clearFeedbackOnInputChange() {
    if (addFeedback) {
      setAddFeedback(null);
    }
  }

  function handleAddToTeam() {
    if (!resolvedPokemon) {
      return;
    }

    const created = createEditable(resolvedPokemon.name);
    created.nickname = nickname.trim() || resolvedPokemon.name;
    created.gender = gender;
    created.shiny = shiny;
    created.nature = nature;
    created.level = numericLevel;
    created.ivs = estimatedIvs;
    created.moves = suggestedMoves;
    const result = onAddPreparedMember(created);

    if (!result.ok) {
      setAddFeedback({
        tone: "danger",
        message:
          result.reason === "full"
            ? "El roster ya tiene 6 Pokemon."
            : `${resolvedPokemon.name} ya esta en el roster.`,
      });
      return;
    }

    setAddFeedback({
      tone: "success",
      message:
        result.reason === "pc"
          ? `${created.nickname || resolvedPokemon.name} se guardo en la Caja / PC.`
          : `${created.nickname || resolvedPokemon.name} se agrego al roster.`,
    });
    setSpecies("");
    setLevel("5");
    setNature("Serious");
    setNickname("");
    setGender("unknown");
    setShiny(false);
    setObservedOverrides(createEmptyObservedState());
  }

  return (
    <section className="space-y-3">
      <div className="px-1 py-1">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_12rem]">
              <div>
                <p className={ivSectionFieldLabelClassName}>Species</p>
                <div className="mt-1.5">
                  <SpeciesCombobox
                    value={species}
                    speciesCatalog={speciesCatalog}
                    onChange={(next) => {
                      clearFeedbackOnInputChange();
                      setSpecies(next);
                    }}
                  />
                </div>
              </div>
              <div>
                <SpreadInput
                  label="LEVEL"
                  value={numericLevel}
                  max={100}
                  onChange={(next) => {
                    clearFeedbackOnInputChange();
                    setLevel(String(Math.max(1, next)));
                  }}
                />
              </div>
              <div>
                <p className={ivSectionFieldLabelClassName}>Nature</p>
                <div className="mt-1.5">
                  <FilterCombobox
                    value={nature}
                    options={natureOptions}
                    placeholder="Nature"
                    searchable={false}
                    onChange={(next) => {
                      clearFeedbackOnInputChange();
                      setNature(next);
                    }}
                  />
                </div>
              </div>
            </div>

            <ObservedStatsPanel
              observedStats={observedStats}
              inferenceByStat={inferenceByStat}
              onChangeStat={(stat, next) => {
                clearFeedbackOnInputChange();
                setObservedOverrides((current) => ({
                  ...current,
                  [stat]: next > 0 ? String(next) : "",
                }));
              }}
            />
          </div>

          <div className="px-1 py-1">
            <SelectedPokemonPanel
              resolvedPokemon={resolvedPokemon}
              speciesMeta={speciesMeta}
              numericLevel={numericLevel}
              nature={nature}
              spriteUrl={spriteUrl}
              nickname={nickname}
              setNickname={(next) => {
                clearFeedbackOnInputChange();
                setNickname(next);
              }}
              gender={gender}
              setGender={(next) => {
                clearFeedbackOnInputChange();
                setGender(next);
              }}
              shiny={shiny}
              setShiny={(next) => {
                clearFeedbackOnInputChange();
                setShiny(next);
              }}
              suggestedMoves={suggestedMoves}
              canAddToTeam={canAddToTeam}
              onAddToTeam={handleAddToTeam}
              addFeedback={addFeedback}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
