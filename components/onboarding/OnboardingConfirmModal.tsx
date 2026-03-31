"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";

import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { StarterKey } from "@/lib/builder";

export function OnboardingConfirmModal({
  starterKey,
  species,
  spriteUrl,
  animatedSpriteUrl,
  currentTypes,
  finalTypes,
  nickname,
  onNicknameChange,
  onCancel,
  onConfirm,
}: {
  starterKey: StarterKey;
  species: string;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  currentTypes: string[];
  finalTypes: string[];
  nickname: string;
  onNicknameChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const accentClass =
    starterKey === "snivy"
      ? "starter-confirm-snivy"
      : starterKey === "tepig"
        ? "starter-confirm-tepig"
        : "starter-confirm-oshawott";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="panel-strong panel-frame relative w-full max-w-xl overflow-hidden p-6"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className={clsx(
              "absolute inset-x-0 top-0 h-32",
              accentClass,
            )}
          />
          <div className="relative flex items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="display-face text-sm text-accent">Confirmar inicial</p>
              <h2 className="pixel-face mt-2 text-4xl">{species}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {currentTypes.map((type) => (
                  <TypeBadge key={`confirm-current-${type}`} type={type} />
                ))}
              </div>
              {finalTypes.length ? (
                <div className="mt-4">
                  <p className="display-face text-xs text-muted">Tipo final</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {finalTypes.map((type) => (
                      <TypeBadge key={`confirm-final-${type}`} type={type} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <PokemonSprite
              species={species}
              spriteUrl={spriteUrl}
              animatedSpriteUrl={animatedSpriteUrl}
              size="large"
            />
          </div>

          <div className="relative mt-6 space-y-4">
            <p className="text-sm text-muted">
              Si quieres, define un mote ahora. Podrás cambiarlo después desde el editor del Pokémon.
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Mote</span>
              <Input
                value={nickname}
                onChange={(event) => onNicknameChange(event.target.value)}
                placeholder={`Ej: ${species}`}
                maxLength={24}
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="button" variant="outline" onClick={onConfirm}>
                Confirmar y empezar
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
