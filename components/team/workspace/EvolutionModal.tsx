"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

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
  const [animationStage, setAnimationStage] = useState<"charge" | "flare" | "morph" | "reveal">("charge");
  const [isSkipping, setIsSkipping] = useState(false);
  const completionTimerRef = useRef<number | null>(null);
  const stageTimerRefs = useRef<number[]>([]);

  function clearCompletionTimer() {
    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }

  function clearStageTimers() {
    stageTimerRefs.current.forEach((timerId) => window.clearTimeout(timerId));
    stageTimerRefs.current = [];
  }

  function resetAnimation() {
    clearCompletionTimer();
    clearStageTimers();
    setPhase("confirm");
    setAnimationStage("charge");
    setIsSkipping(false);
  }

  function handleClose() {
    resetAnimation();
    onClose();
  }

  function handleComplete(nextSpecies: string) {
    resetAnimation();
    onComplete(nextSpecies);
  }

  function handleStartEvolution() {
    if (!selectedNext) {
      return;
    }
    clearCompletionTimer();
    clearStageTimers();
    setPhase("animating");
    setAnimationStage("charge");
    stageTimerRefs.current = [
      window.setTimeout(() => setAnimationStage("flare"), 1400),
      window.setTimeout(() => setAnimationStage("morph"), 3000),
      window.setTimeout(() => setAnimationStage("reveal"), 5000),
    ];
    completionTimerRef.current = window.setTimeout(() => {
      handleComplete(selectedNext);
    }, 6800);
  }

  useEffect(() => {
    if (!open) {
      resetAnimation();
      return;
    }

    return () => resetAnimation();
  }, [open]);

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
      className="modal-backdrop-strong fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="panel-strong relative w-full max-w-3xl overflow-hidden rounded-[1rem] p-6"
      >
        <div className="sheet-highlight absolute inset-x-0 top-0 h-28" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="display-face text-sm text-accent">Evolution</p>
            <h2 className="pixel-face mt-2 text-2xl">
              {phase === "confirm" ? "Confirmar evolución" : "Evolucionando..."}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {phase === "confirm"
                ? "Confirma la siguiente forma y arranca la secuencia cuando quieras."
                : "La secuencia se puede saltar, pero está pensada para sentirse más ceremonial."}
            </p>
          </div>
          <div className="flex gap-2">
            {phase === "animating" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!selectedNext) {
                    return;
                  }
                  setIsSkipping(true);
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
        </div>

        {phase === "confirm" ? (
          <div className="relative mt-6 space-y-5">
            {nextOptions.length > 1 ? (
              <div className="flex flex-wrap gap-2">
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

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
              <EvolutionPreviewCard
                title="Forma actual"
                species={currentSpecies}
                spriteUrl={currentSpriteUrl}
                animatedSpriteUrl={currentAnimatedSpriteUrl}
              />
              <div className="flex justify-center">
                <div className="primary-badge rounded-full p-3 text-accent">
                  <span className="block text-3xl leading-none">→</span>
                </div>
              </div>
              {nextSelection ? (
                <EvolutionPreviewCard
                  title="Siguiente forma"
                  species={nextSelection.species}
                  spriteUrl={nextSelection.spriteUrl}
                  animatedSpriteUrl={nextSelection.animatedSpriteUrl}
                  highlight
                />
              ) : (
                <div className="space-y-3">
                  <p className="display-face text-xs uppercase tracking-[0.18em] text-muted">
                    Siguiente forma
                  </p>
                  <div className="rounded-[0.9rem] border border-line px-4 py-6 text-center text-sm text-muted">
                    No hay evolución disponible.
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
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
          <div className="relative mt-8">
            <EvolutionSequenceStage
              currentSpecies={currentSpecies}
              currentSpriteUrl={currentSpriteUrl}
              currentAnimatedSpriteUrl={currentAnimatedSpriteUrl}
              nextSpecies={nextSelection?.species ?? "Evolution"}
              nextSpriteUrl={nextSelection?.spriteUrl}
              nextAnimatedSpriteUrl={nextSelection?.animatedSpriteUrl}
              stage={animationStage}
              isSkipping={isSkipping}
            />
            <p className="mt-6 text-center text-sm text-muted">
              {isSkipping
                ? "Saltando animación..."
                : animationStage === "charge"
                  ? "..."
                  : animationStage === "flare"
                    ? `${currentSpecies}?`
                    : animationStage === "morph"
                      ? "What? "
                      : `${currentSpecies} evolved into ${nextSelection?.species ?? "its next form"}!`}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EvolutionPreviewCard({
  title,
  species,
  spriteUrl,
  animatedSpriteUrl,
  highlight = false,
}: {
  title: string;
  species: string;
  spriteUrl?: string;
  animatedSpriteUrl?: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="display-face text-xs uppercase tracking-[0.18em] text-muted">{title}</p>
      <div
        className={clsx(
          "flex flex-col items-center rounded-[0.9rem] border p-5 text-center",
          highlight
            ? "evolution-preview-highlight border-primary-line-soft"
            : "border-line bg-surface-2",
        )}
      >
        <PokemonSprite
          species={species}
          spriteUrl={spriteUrl}
          animatedSpriteUrl={animatedSpriteUrl}
          size="large"
        />
        <p className="pixel-face mt-4 text-xl">{species}</p>
      </div>
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
  isSkipping,
}: {
  currentSpecies: string;
  currentSpriteUrl?: string;
  currentAnimatedSpriteUrl?: string;
  nextSpecies: string;
  nextSpriteUrl?: string;
  nextAnimatedSpriteUrl?: string;
  stage: "charge" | "flare" | "morph" | "reveal";
  isSkipping: boolean;
}) {
  return (
    <div className="relative mx-auto flex min-h-[22rem] w-full max-w-[24rem] flex-col items-center justify-center overflow-hidden rounded-[1.2rem] border border-primary-line-emphasis bg-surface-2 px-4 py-6">
      <div className={clsx("evo-stage-backdrop absolute inset-0", stage === "charge" && "evo-stage-backdrop-charge", stage === "flare" && "evo-stage-backdrop-flare", stage === "morph" && "evo-stage-backdrop-morph", stage === "reveal" && "evo-stage-backdrop-reveal")} />
      <div className={clsx("evo-energy-ring evo-energy-ring-1", stage !== "reveal" && "opacity-100")} />
      <div className={clsx("evo-energy-ring evo-energy-ring-2", stage !== "reveal" && "opacity-100")} />
      <div className={clsx("evo-energy-ring evo-energy-ring-3", stage === "flare" || stage === "morph" ? "opacity-100" : "opacity-0")} />
      <div className={clsx("evo-flash absolute inset-[16%] rounded-full", stage === "flare" && "evo-flash-active", stage === "morph" && "evo-flash-morph", stage === "reveal" && "evo-flash-reveal")} />
      <div className="relative h-44 w-44">
        <div
          className={clsx(
            "absolute inset-0 transition-all duration-500",
            stage === "charge" && "opacity-100 scale-100",
            stage === "flare" && "evo-sprite-charge",
            stage === "morph" && "evo-sprite-fade evo-pixel-morph-out",
            stage === "reveal" && "opacity-0 scale-125",
          )}
        >
          <PokemonSprite
            species={currentSpecies}
            spriteUrl={currentSpriteUrl}
            animatedSpriteUrl={currentAnimatedSpriteUrl}
            size="large"
            isEvolving={!isSkipping}
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
        >
          <PokemonSprite
            species={nextSpecies}
            spriteUrl={nextSpriteUrl}
            animatedSpriteUrl={nextAnimatedSpriteUrl}
            size="large"
            isEvolving={!isSkipping && stage !== "reveal"}
            chrome="plain"
          />
        </div>
      </div>
      <div className="relative mt-3 flex flex-col items-center gap-2 text-accent">
        <div className="evolution-divider h-px w-24" />
        <div className="display-face text-sm text-primary-soft">
          {stage === "charge" ? "..." : stage === "flare" ? "?" : stage === "morph" ? "What?" : "Congratulations!"}
        </div>
        <div className="evolution-divider h-px w-24" />
      </div>
    </div>
  );
}
