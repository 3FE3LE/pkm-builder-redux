"use client";

import { ViewTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ExternalLink, Mars, Plus, Sparkles, Venus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { StatBar } from "@/components/team/UI";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getDexTransitionName } from "@/components/team/screens/dex/utils";
import type { EditableMember } from "@/lib/builderStore";
import { calculateEffectiveStats, getNatureEffect } from "@/lib/domain/battle";
import { markNavigationStart } from "@/lib/perf";
import type { RemotePokemon } from "@/lib/teamAnalysis";
import { startViewTransition } from "@/lib/viewTransitions";
import { ZERO_SPREAD } from "@/components/team/tools/iv-calculator/types";

import type { AddFeedback } from "@/components/team/tools/iv-calculator/types";

const ivPanelEyebrowClassName = "display-face micro-label text-muted";
const ivPanelActionButtonClassName = "h-11 rounded-lg";
const ivPanelFeedbackClassName = "surface-card flex items-center gap-2 px-3 py-2 text-sm";
const ivPanelSuggestedMoveChipClassName = "token-card px-2.5 py-1 text-xs text-text";

type SpeciesCatalogEntry = {
  name: string;
  slug: string;
  dex: number;
  types: string[];
};

export function SelectedPokemonPanel({
  resolvedPokemon,
  speciesMeta,
  numericLevel,
  nature,
  spriteUrl,
  nickname,
  setNickname,
  gender,
  setGender,
  shiny,
  setShiny,
  suggestedMoves,
  canAddToTeam,
  onAddToTeam,
  addFeedback,
}: {
  resolvedPokemon?: RemotePokemon;
  speciesMeta?: SpeciesCatalogEntry;
  numericLevel: number;
  nature: string;
  spriteUrl?: string;
  nickname: string;
  setNickname: (next: string) => void;
  gender: EditableMember["gender"];
  setGender: Dispatch<SetStateAction<EditableMember["gender"]>>;
  shiny: boolean;
  setShiny: Dispatch<SetStateAction<boolean>>;
  suggestedMoves: string[];
  canAddToTeam: boolean;
  onAddToTeam: () => void;
  addFeedback: AddFeedback;
}) {
  const router = useRouter();

  if (!resolvedPokemon || !speciesMeta) {
    return (
      <p className="text-sm text-muted">
        Elige una especie válida para empezar el cálculo.
      </p>
    );
  }

  const dexHref = `/team/dex/pokemon/${speciesMeta.slug}`;
  const neutralStats = calculateEffectiveStats(
    resolvedPokemon.stats,
    numericLevel,
    "Serious",
    ZERO_SPREAD,
    ZERO_SPREAD,
  );
  const previewStats = calculateEffectiveStats(
    resolvedPokemon.stats,
    numericLevel,
    nature,
    ZERO_SPREAD,
    ZERO_SPREAD,
  );
  const natureEffect = getNatureEffect(nature);
  const statRows = [
    { key: "hp", label: "HP", value: previewStats.hp, baseline: neutralStats.hp },
    { key: "atk", label: "Atk", value: previewStats.atk, baseline: neutralStats.atk },
    { key: "def", label: "Def", value: previewStats.def, baseline: neutralStats.def },
    { key: "spa", label: "SpA", value: previewStats.spa, baseline: neutralStats.spa },
    { key: "spd", label: "SpD", value: previewStats.spd, baseline: neutralStats.spd },
    { key: "spe", label: "Spe", value: previewStats.spe, baseline: neutralStats.spe },
  ] as const;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <ViewTransition name={getDexTransitionName("title", speciesMeta.slug)}>
            <p className="display-face truncate text-lg">{resolvedPokemon.name}</p>
          </ViewTransition>
          <p className="mt-1 text-sm text-muted">Dex #{speciesMeta.dex} · Lv {numericLevel} · {nature}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {speciesMeta.types.map((type) => (
              <TypeBadge key={`iv-type-${type}`} type={type} />
            ))}
          </div>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-2 text-xs text-accent transition hover:text-accent-soft"
            onPointerDown={() => {
              router.prefetch(dexHref);
              markNavigationStart("ivcalc-to-dex-detail", dexHref);
            }}
            onClick={() => {
              markNavigationStart("ivcalc-to-dex-detail", dexHref);
              startViewTransition(() => {
                router.push(dexHref);
              });
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir en Dex
          </button>
        </div>
        <ViewTransition name={getDexTransitionName("sprite", speciesMeta.slug)} share="dex-sprite-share">
          <PokemonSprite
            species={resolvedPokemon.name}
            spriteUrl={spriteUrl}
            size="default"
            chrome="plain"
          />
        </ViewTransition>
      </div>
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={ivPanelEyebrowClassName}>Stats preview</p>
          <p className="text-xs text-muted">
            {natureEffect.up || natureEffect.down
              ? `${nature} ajusta ${natureEffect.up?.toUpperCase() ?? "-"} / ${natureEffect.down?.toUpperCase() ?? "-"}`
              : `${nature} no cambia stats`}
          </p>
        </div>
        <div className="mt-3 grid gap-2">
          {statRows.map((stat) => (
            <StatBar
              key={`preview-stat-${stat.key}`}
              label={stat.label}
              value={stat.value}
              max={160}
              baselineValue={stat.baseline}
            />
          ))}
        </div>
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
              <span className={ivPanelEyebrowClassName}>Nickname optional</span>
              <Input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder={resolvedPokemon.name}
                className="mt-1.5 h-10"
              />
            </label>
            <div>
              <p className={ivPanelEyebrowClassName}>Gender optional</p>
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
                      className={`action-tile icon-tile-md ${
                        active
                          ? "border-primary-line-active bg-primary-fill"
                          : "text-text"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${option.className}`} />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShiny(!shiny)}
                  className={`action-tile inline-flex h-10 items-center gap-2 px-3 ${
                    shiny
                      ? "warning-badge-soft"
                      : "text-muted"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs">Shiny</span>
                </button>
              </div>
            </div>
            <div className="px-1 py-1">
              <p className={ivPanelEyebrowClassName}>Moves learned by level</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedMoves.length ? suggestedMoves.map((move) => (
                  <span key={`capture-move-${move}`} className={ivPanelSuggestedMoveChipClassName}>
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
              onClick={onAddToTeam}
              className={ivPanelActionButtonClassName}
            >
              <Plus className="h-4 w-4" />
              Add Capture To Team
            </Button>
            <AnimatePresence initial={false}>
              {addFeedback ? (
                <motion.div
                  key={`${addFeedback.tone}-${addFeedback.message}`}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`${ivPanelFeedbackClassName} ${
                    addFeedback.tone === "success"
                      ? "border-primary-line-active bg-primary-fill text-primary-soft"
                      : "border-danger-line bg-danger-fill text-danger-soft"
                  }`}
                >
                  {addFeedback.tone === "success" ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 shrink-0" />
                  )}
                  <span>{addFeedback.message}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
