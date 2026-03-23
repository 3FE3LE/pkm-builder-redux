"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mars, Plus, Venus } from "lucide-react";

import { PokemonSprite, SpeciesCombobox, TypeBadge, FilterCombobox } from "@/components/BuilderShared";
import { SpreadInput, StatCard } from "@/components/team/UI";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { natureOptions, statKeys } from "@/lib/builderForm";
import { getRepresentativeIv, inferIvForObservedStat } from "@/lib/domain/ivCalculator";
import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import type { RemotePokemon } from "@/lib/teamAnalysis";
import { createEditable, type EditableMember } from "@/lib/builderStore";
import { normalizeMoveLookupName } from "@/lib/domain/moves";

type IvObservedState = Record<(typeof statKeys)[number], string>;

const EMPTY_OBSERVED: IvObservedState = {
  hp: "",
  atk: "",
  def: "",
  spa: "",
  spd: "",
  spe: "",
};

export function IvCalculatorSection({
  speciesCatalog,
  pokemonIndex,
  onAddPreparedMember,
}: {
  speciesCatalog: { name: string; slug: string; dex: number; types: string[] }[];
  pokemonIndex: Record<string, RemotePokemon>;
  onAddPreparedMember: (member: EditableMember) => void;
}) {
  const [species, setSpecies] = useState("");
  const [level, setLevel] = useState("5");
  const [nature, setNature] = useState("Serious");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<EditableMember["gender"]>("unknown");
  const [observedStats, setObservedStats] = useState<IvObservedState>(EMPTY_OBSERVED);

  const resolvedPokemon = species ? pokemonIndex[normalizeName(species)] : undefined;
  const speciesMeta = speciesCatalog.find((entry) => normalizeName(entry.name) === normalizeName(species));
  const numericLevel = Math.max(1, Math.min(100, Number(level || 1)));
  const spriteUrl = resolvedPokemon && speciesMeta
    ? buildSpriteUrls(resolvedPokemon.name, speciesMeta.dex).spriteUrl
    : undefined;

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
      ) as Partial<Record<(typeof statKeys)[number], NonNullable<(typeof inferences)[number]>>>,
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

  const canAddToTeam = Boolean(speciesMeta && resolvedPokemon && Object.values(observedStats).some((value) => value.trim()));

  function handleAddToTeam() {
    if (!resolvedPokemon) {
      return;
    }

    const created = createEditable(resolvedPokemon.name);
    created.nickname = nickname.trim() || resolvedPokemon.name;
    created.gender = gender;
    created.nature = nature;
    created.level = numericLevel;
    created.ivs = estimatedIvs;
    created.moves = suggestedMoves;
    onAddPreparedMember(created);
  }

  return (
    <section className="space-y-3">
      <div className="px-1 py-1">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)] xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_10rem_12rem]">
              <div>
                <p className="display-face text-[11px] text-muted">Species</p>
                <div className="mt-1.5">
                  <SpeciesCombobox
                    value={species}
                    speciesCatalog={speciesCatalog}
                    onChange={setSpecies}
                  />
                </div>
              </div>
              <div>
                <SpreadInput
                  label="LEVEL"
                  value={numericLevel}
                  max={100}
                  onChange={(next) => setLevel(String(Math.max(1, next)))}
                />
              </div>
              <div>
                <p className="display-face text-[11px] text-muted">Nature</p>
                <div className="mt-1.5">
                  <FilterCombobox
                    value={nature}
                    options={natureOptions}
                    placeholder="Nature"
                    searchable={false}
                    onChange={setNature}
                  />
                </div>
              </div>
            </div>

            <div className="px-1 py-1">
              <p className="display-face text-xs text-accent">Observed stats</p>
              <div className="mt-3 flex flex-nowrap items-start justify-between gap-1 lg:flex-col lg:gap-2">
                {statKeys.map((stat) => (
                  <motion.div
                    key={`iv-calc-${stat}`}
                    layout
                    className="min-w-0"
                  >
                    <SpreadInput
                      label={stat.toUpperCase()}
                      value={Number(observedStats[stat] || 0)}
                      max={999}
                      orientation="responsive"
                      onChange={(next) =>
                        setObservedStats((current) => ({
                          ...current,
                          [stat]: next > 0 ? String(next) : "",
                        }))
                      }
                    />
                    <AnimatePresence mode="popLayout">
                      {observedStats[stat].trim() ? (
                        <motion.div
                          key={`${stat}-${observedStats[stat]}`}
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="mt-2 rounded-[0.6rem] bg-surface-2/60 px-2.5 py-2"
                        >
                          {!inferenceByStat[stat] || !inferenceByStat[stat]?.candidates.length ? (
                            <p className="text-[11px] text-danger">No cuadra con EV 0</p>
                          ) : (
                            <>
                              <p className="display-face text-[9px] tracking-[0.12em] text-muted">EST. IV</p>
                              <p className="pixel-face mt-1 text-sm text-accent">
                                {inferenceByStat[stat]?.exactIv !== null
                                  ? String(inferenceByStat[stat]?.exactIv)
                                  : `${inferenceByStat[stat]?.minIv}-${inferenceByStat[stat]?.maxIv}`}
                              </p>
                              <p className="mt-1 text-[10px] text-muted">
                                {`seed ${inferenceByStat[stat]?.iv0Value} -> 31 ${inferenceByStat[stat]?.iv31Value}`}
                              </p>
                            </>
                          )}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-1 py-1">
            {resolvedPokemon && speciesMeta ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="display-face truncate text-lg">{resolvedPokemon.name}</p>
                    <p className="mt-1 text-sm text-muted">Dex #{speciesMeta.dex} · Lv {numericLevel} · {nature}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {speciesMeta.types.map((type) => (
                        <TypeBadge key={`iv-type-${type}`} type={type} />
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
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatCard label="BST" value={String(resolvedPokemon.stats.bst)} />
                  <StatCard label="Inputs" value={String(inferences.length)} />
                </div>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="mt-4 px-1 py-1"
                  >
                    <p className="display-face text-xs text-accent">Add to team</p>
                    <div className="mt-3 grid gap-3">
                      <label className="block">
                        <span className="display-face text-[10px] text-muted">Nickname optional</span>
                        <Input
                          value={nickname}
                          onChange={(event) => setNickname(event.target.value)}
                          placeholder={resolvedPokemon.name}
                          className="mt-1.5 h-10"
                        />
                      </label>
                      <div>
                        <p className="display-face text-[10px] text-muted">Gender optional</p>
                        <div className="mt-1.5 flex gap-2">
                          {[
                            { key: "male" as const, icon: Mars, className: "text-info-soft" },
                            { key: "female" as const, icon: Venus, className: "text-danger-soft" },
                          ].map((option) => {
                            const Icon = option.icon;
                            const active = gender === option.key;
                            return (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => setGender((current) => current === option.key ? "unknown" : option.key)}
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-[0.7rem] border transition ${
                                  active
                                    ? "border-primary-line-active bg-primary-fill"
                                    : "border-line bg-surface-3 hover:bg-surface-5"
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${option.className}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="px-1 py-1">
                        <p className="display-face text-[10px] text-muted">Moves learned by level</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestedMoves.length ? suggestedMoves.map((move) => (
                            <span key={`capture-move-${move}`} className="rounded-[6px] bg-surface-3 px-2.5 py-1 text-xs text-text">
                              {move}
                            </span>
                          )) : (
                            <span className="text-xs text-muted">No learned moves found.</span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        disabled={!canAddToTeam}
                        onClick={handleAddToTeam}
                        className="h-11 rounded-[0.8rem]"
                      >
                        <Plus className="h-4 w-4" />
                        Add Capture To Team
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              <p className="text-sm text-muted">
                Elige una especie válida para empezar el cálculo.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
