"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { PokemonSprite } from "@/components/BuilderShared";
import { Button } from "@/components/ui/Button";

export function EvolutionModal({
  open,
  currentSpecies,
  currentSpriteUrl,
  currentAnimatedSpriteUrl,
  nextOptions,
  selectedNext,
  onSelectNext,
  onClose,
  onComplete,
}: {
  open: boolean;
  currentSpecies: string;
  currentSpriteUrl?: string;
  currentAnimatedSpriteUrl?: string;
  nextOptions: {
    species: string;
    spriteUrl?: string;
    animatedSpriteUrl?: string;
    eligible?: boolean;
    reasons?: string[];
  }[];
  selectedNext: string | null;
  onSelectNext: (species: string) => void;
  onClose: () => void;
  onComplete: (species: string) => void;
}) {
  const [phase, setPhase] = useState<"confirm" | "animating">("confirm");
  const [animationStage, setAnimationStage] = useState<
    "charge" | "flare" | "morph" | "reveal"
  >("charge");

  function resetSequence() {
    setPhase("confirm");
    setAnimationStage("charge");
  }

  function handleClose() {
    resetSequence();
    onClose();
  }

  function handleComplete(nextSpecies: string) {
    resetSequence();
    onComplete(nextSpecies);
  }

  function handleStartEvolution() {
    if (!selectedNext) {
      return;
    }
    setPhase("animating");
    setAnimationStage("charge");
  }

  if (!open) {
    return null;
  }

  const nextSelection =
    nextOptions.find((option) => option.species === selectedNext) ?? nextOptions[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop-strong fixed inset-0 z-160 flex items-start justify-center overflow-y-auto px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6 sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="panel-strong relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[1rem] p-4 sm:max-h-[calc(100dvh-3rem)] sm:p-5"
      >
        <div className="sheet-highlight absolute inset-x-0 top-0 h-28" />
        <div className="relative flex justify-end gap-1.5">
            {phase === "animating" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!selectedNext) {
                    return;
                  }
                  handleComplete(selectedNext);
                }}
                className="border-primary-line-strong bg-primary-fill-strong text-primary-soft hover:bg-primary-fill-hover"
              >
                Skip
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="icon-sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
        </div>

        {phase === "confirm" ? (
          <div className="relative space-y-4">
            {nextOptions.length > 1 ? (
              <div className="flex flex-wrap gap-1.5">
                {nextOptions.map((option) => (
                  <Button
                    key={`evolution-option-${option.species}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={option.eligible === false}
                    onClick={() => onSelectNext(option.species)}
                    title={option.eligible === false ? option.reasons?.join(" · ") : undefined}
                    className={clsx(
                      "border-line bg-surface-4",
                      option.eligible === false && "opacity-45",
                      selectedNext === option.species &&
                        "border-primary-line-strong bg-primary-fill-strong text-primary-soft",
                    )}
                  >
                    {option.species}
                  </Button>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
              <EvolutionPreviewCard
                species={currentSpecies}
                spriteUrl={currentSpriteUrl}
                animatedSpriteUrl={currentAnimatedSpriteUrl}
              />
              <div className="flex justify-center">
                <div className="primary-badge flex h-11 w-11 items-center justify-center rounded-full text-accent sm:h-12 sm:w-12">
                  <span className="block text-2xl leading-none sm:text-3xl">→</span>
                </div>
              </div>
              {nextSelection ? (
                <EvolutionPreviewCard
                  species={nextSelection.species}
                  spriteUrl={nextSelection.spriteUrl}
                  animatedSpriteUrl={nextSelection.animatedSpriteUrl}
                  highlight
                />
              ) : (
                <div className="flex min-h-36 items-center justify-center rounded-[0.9rem] border border-line px-4 py-5 text-center text-sm text-muted sm:min-h-44">
                    No hay evolución disponible.
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleStartEvolution}
                disabled={!selectedNext || nextOptions.find((option) => option.species === selectedNext)?.eligible === false}
              >
                Iniciar evolución
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative mt-5">
            <EvolutionSequenceStage
              currentSpecies={currentSpecies}
              currentSpriteUrl={currentSpriteUrl}
              currentAnimatedSpriteUrl={currentAnimatedSpriteUrl}
              nextSpecies={nextSelection?.species ?? "Evolution"}
              nextSpriteUrl={nextSelection?.spriteUrl}
              nextAnimatedSpriteUrl={nextSelection?.animatedSpriteUrl}
              stage={animationStage}
              onAdvanceStage={setAnimationStage}
              onComplete={() => {
                if (!selectedNext) {
                  return;
                }
                handleComplete(selectedNext);
              }}
            />
            <p className="mt-4 text-center text-sm text-muted">
              {animationStage === "charge"
                ? `What? ${currentSpecies} is evolving!`
                : animationStage === "flare"
                  ? `${currentSpecies} is glowing!`
                  : animationStage === "morph"
                    ? "..."
                    : `Congratulations! Your ${currentSpecies} evolved into ${nextSelection?.species ?? "its next form"}!`}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EvolutionPreviewCard({
  species,
  spriteUrl,
  animatedSpriteUrl,
  highlight = false,
}: {
  species: string;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center px-2 py-2 text-center sm:px-3 sm:py-3",
        highlight && "evolution-preview-highlight rounded-[0.9rem]",
      )}
    >
        <PokemonSprite
          species={species}
          spriteUrl={spriteUrl}
          animatedSpriteUrl={animatedSpriteUrl}
          size="large"
        />
        <p className="pixel-face mt-3 text-lg sm:text-xl">{species}</p>
    </div>
  );
}

function EvolutionSequenceStage({
  currentSpecies,
  currentSpriteUrl,
  currentAnimatedSpriteUrl,
  nextSpecies,
  nextSpriteUrl,
  nextAnimatedSpriteUrl,
  stage,
  onAdvanceStage,
  onComplete,
}: {
  currentSpecies: string;
  currentSpriteUrl?: string;
  currentAnimatedSpriteUrl?: string;
  nextSpecies: string;
  nextSpriteUrl?: string;
  nextAnimatedSpriteUrl?: string;
  stage: "charge" | "flare" | "morph" | "reveal";
  onAdvanceStage: (stage: "charge" | "flare" | "morph" | "reveal") => void;
  onComplete: () => void;
}) {
  return (
    <motion.div
      key={stage}
      initial={{ opacity: 0.86, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration:
          stage === "charge" ? 1.1 : stage === "flare" ? 0.95 : 0.35,
      }}
      onAnimationComplete={() => {
        if (stage === "charge") {
          onAdvanceStage("flare");
        } else if (stage === "flare") {
          onAdvanceStage("morph");
        }
      }}
      className="relative mx-auto flex min-h-[18rem] w-full max-w-[22rem] flex-col items-center justify-center overflow-hidden rounded-[1.2rem] border border-primary-line-emphasis bg-surface-2 px-4 py-5 sm:min-h-[20rem] sm:max-w-[24rem] sm:py-6"
    >
      <div
        className={clsx(
          "evo-stage-backdrop absolute inset-0",
          stage === "charge" && "evo-stage-backdrop-charge",
          stage === "flare" && "evo-stage-backdrop-flare",
          stage === "morph" && "evo-stage-backdrop-morph",
          stage === "reveal" && "evo-stage-backdrop-reveal",
        )}
      />
      <div
        className={clsx(
          "evo-energy-ring evo-energy-ring-1",
          stage !== "reveal" && "opacity-100",
        )}
      />
      <div
        className={clsx(
          "evo-energy-ring evo-energy-ring-2",
          stage !== "reveal" && "opacity-100",
        )}
      />
      <div
        className={clsx(
          "evo-energy-ring evo-energy-ring-3",
          (stage === "flare" || stage === "morph") && "opacity-100",
        )}
      />
      <div
        className={clsx(
          "evo-flash absolute inset-[16%] rounded-full",
          stage === "flare" && "evo-flash-active",
          stage === "morph" && "evo-flash-morph",
          stage === "reveal" && "evo-flash-reveal",
        )}
      />
      <div className="relative h-36 w-36 sm:h-44 sm:w-44">
        <div
          className={clsx(
            "absolute inset-0 transition-all duration-500",
            stage === "charge" && "opacity-100 scale-100 evo-sprite-charge",
            stage === "flare" && "evo-sprite-charge",
            stage === "morph" && "evo-sprite-fade evo-pixel-morph-out",
            stage === "reveal" && "opacity-0 scale-125",
          )}
          onAnimationEnd={() => {
            if (stage === "morph") {
              onAdvanceStage("reveal");
            }
          }}
        >
          <PokemonSprite
            species={currentSpecies}
            spriteUrl={currentSpriteUrl}
            animatedSpriteUrl={currentAnimatedSpriteUrl}
            size="large"
            isEvolving={stage !== "reveal"}
            chrome="plain"
          />
        </div>
        <div
          className={clsx(
            "absolute inset-0 transition-all duration-700",
            stage === "charge" && "opacity-0 scale-75",
            stage === "flare" && "opacity-0 scale-90",
            stage === "morph" && "evo-silhouette-rise evo-pixel-morph-in",
            stage === "reveal" && "evo-sprite-reveal",
          )}
          onAnimationEnd={() => {
            if (stage === "reveal") {
              onComplete();
            }
          }}
        >
          <PokemonSprite
            species={nextSpecies}
            spriteUrl={nextSpriteUrl}
            animatedSpriteUrl={nextAnimatedSpriteUrl}
            size="large"
            isEvolving={stage !== "reveal"}
            chrome="plain"
          />
        </div>
      </div>
      <div className="relative mt-2.5 flex flex-col items-center gap-1.5 text-accent">
        <div className="evolution-divider h-px w-24" />
        <div className="display-face text-sm text-primary-soft">
          {stage === "charge"
            ? "..."
            : stage === "flare"
              ? "?"
              : stage === "morph"
                ? "What?"
                : "Congratulations!"}
        </div>
        <div className="evolution-divider h-px w-24" />
      </div>
    </motion.div>
  );
}
