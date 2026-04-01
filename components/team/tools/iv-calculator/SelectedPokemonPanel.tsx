"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Mars, Plus, Sparkles, Venus, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { EditableMember } from "@/lib/builderStore";
import type { RemotePokemon } from "@/lib/teamAnalysis";

import type { AddFeedback } from "@/components/team/tools/iv-calculator/types";

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
  if (!resolvedPokemon || !speciesMeta) {
    return (
      <p className="text-sm text-muted">
        Elige una especie válida para empezar el cálculo.
      </p>
    );
  }

  return (
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
      <div className="mt-4">
        <p className="display-face text-[10px] text-muted">Base stats</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            ["HP", resolvedPokemon.stats.hp],
            ["ATK", resolvedPokemon.stats.atk],
            ["DEF", resolvedPokemon.stats.def],
            ["SpA", resolvedPokemon.stats.spa],
            ["SpD", resolvedPokemon.stats.spd],
            ["SPE", resolvedPokemon.stats.spe],
          ].map(([label, value]) => (
            <div
              key={`base-stat-${label}`}
              className="token-card px-2 py-2 text-center"
            >
              <p className="display-face text-[9px] text-muted">{label}</p>
              <p className="mono-face mt-1 text-sm text-text">{value}</p>
            </div>
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
                      ? "border-warning-line bg-[rgba(255,215,102,0.14)] text-warning-strong"
                      : "text-muted"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs">Shiny</span>
                </button>
              </div>
            </div>
            <div className="px-1 py-1">
              <p className="display-face text-[10px] text-muted">Moves learned by level</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedMoves.length ? suggestedMoves.map((move) => (
                  <span key={`capture-move-${move}`} className="token-card px-2.5 py-1 text-xs text-text">
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
              className="h-11 rounded-[0.8rem]"
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
                  className={`flex items-center gap-2 rounded-[0.8rem] border px-3 py-2 text-sm ${
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
