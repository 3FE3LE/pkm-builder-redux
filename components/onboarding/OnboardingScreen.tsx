"use client";

import clsx from "clsx";
import { motion } from "motion/react";

import {
  OnboardingConfirmModal,
} from "@/components/team/Modals";
import { PokemonSprite, TypeBadge } from "@/components/BuilderShared";
import { useTeamCatalogs, useTeamOnboarding } from "@/components/BuilderProvider";
import { buildSpriteUrls } from "@/lib/domain/names";
import { resolvePokemonProfile } from "@/lib/teamAnalysis";
import { starters, type StarterKey } from "@/lib/builder";

const STARTER_DEX: Record<StarterKey, number> = {
  snivy: 495,
  tepig: 498,
  oshawott: 501,
};

const STARTER_BASE_TYPES: Record<StarterKey, string[]> = {
  snivy: ["Grass"],
  tepig: ["Fire"],
  oshawott: ["Water"],
};

function OnboardingStarterCard({ starterKey }: { starterKey: StarterKey }) {
  const { docs } = useTeamCatalogs();
  const onboarding = useTeamOnboarding();
  const starterData = starters[starterKey];
  const starterSprites = buildSpriteUrls(
    starterData.species,
    STARTER_DEX[starterKey],
  );
  const isSelecting = onboarding.selection === starterKey;
  const isDimmed =
    (onboarding.selection !== null && onboarding.selection !== starterKey) ||
    (onboarding.modalStarter !== null && onboarding.modalStarter !== starterKey);
  const glowClass =
    starterKey === "snivy"
      ? "starter-glow-snivy"
      : starterKey === "tepig"
        ? "starter-glow-tepig"
        : "starter-glow-oshawott";
  const resolvedCurrentTypes =
    resolvePokemonProfile(docs, starterData.species)?.resolvedTypes ?? [];
  const currentTypes =
    resolvedCurrentTypes.length > 0
      ? resolvedCurrentTypes
      : STARTER_BASE_TYPES[starterKey];
  return (
    <motion.button
      type="button"
      onClick={() => onboarding.actions.openStarterConfirm(starterKey)}
      disabled={onboarding.selection !== null}
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: isDimmed ? 0.46 : 1,
        y: 0,
        scale: isSelecting ? 1.03 : 1,
      }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={clsx(
        "group panel relative overflow-hidden rounded-[0.9rem] border border-line p-3 text-left transition duration-200 hover:border-primary-line-emphasis hover:bg-primary-fill sm:p-4 lg:p-5",
        isSelecting &&
          "primary-selection border-primary-line-active",
      )}
    >
      <div
        className={clsx(
          "absolute inset-x-0 top-0 h-28 opacity-70 transition group-hover:opacity-100",
          glowClass,
        )}
      />
      <motion.div
        className={clsx(
          "pointer-events-none absolute inset-[12%] rounded-[0.75rem] border border-white/0",
          isSelecting && "border-white/35",
        )}
        animate={
          isSelecting
            ? { opacity: [0.15, 0.65, 0], scale: [0.92, 1.02, 1.08] }
            : undefined
        }
        transition={isSelecting ? { duration: 0.45, times: [0, 0.45, 1] } : undefined}
      />
      <div className="relative">
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:text-left">
          <motion.div
            animate={
              isSelecting
                ? {
                    scale: [1, 1.12, 0.98, 1.08],
                    filter: [
                      "brightness(1)",
                      "brightness(1.7)",
                      "brightness(0.95)",
                      "brightness(1.2)",
                    ],
                  }
                : undefined
            }
            transition={isSelecting ? { duration: 0.45, times: [0, 0.34, 0.7, 1] } : undefined}
          >
            <PokemonSprite
              species={starterData.species}
              spriteUrl={starterSprites.spriteUrl}
              animatedSpriteUrl={starterSprites.animatedSpriteUrl}
              isEvolving={isSelecting}
              size="default"
              chrome="plain"
            />
          </motion.div>
          <div className="w-full sm:min-w-0 sm:w-auto">
            <div className="sm:hidden">
              <p className="starter-name-face">{starterData.species}</p>
            </div>
            <div className="hidden sm:block">
              <p className="starter-name-face sm:mt-2">{starterData.species}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-col items-center gap-1 sm:mt-3 sm:flex-row sm:flex-wrap sm:justify-start sm:gap-2">
          {currentTypes.map((type) => (
            <TypeBadge key={`${starterKey}-${type}`} type={type} />
          ))}
        </div>
        <p className="mt-2 hidden text-sm text-muted sm:block">{starterData.headline}</p>
        <div className="mt-4 hidden items-center justify-between gap-3 sm:flex">
          <span className="text-sm text-muted">
            {starterData.rolePlan.slice(0, 2).join(" · ")}
          </span>
          <span className="display-face text-sm text-accent">choose</span>
        </div>
      </div>
    </motion.button>
  );
}

export function OnboardingScreen() {
  const { docs } = useTeamCatalogs();
  const onboarding = useTeamOnboarding();

  return (
    <main className="relative overflow-hidden px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <div>
          <h1 className="pixel-face mt-3 max-w-4xl text-4xl leading-none sm:text-6xl">
            Elige tu inicial y arranca el run.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted sm:text-lg">
            La elección define el primer slot del equipo y el enfoque de sugerencias del checkpoint. Después entras directo al builder para completar el resto del roster.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-4">
            {(Object.keys(starters) as StarterKey[]).map((starterKey) => (
              <OnboardingStarterCard key={starterKey} starterKey={starterKey} />
            ))}
          </div>

        </div>

        {onboarding.modalStarter ? (
          <OnboardingConfirmModal
            starterKey={onboarding.modalStarter}
            species={starters[onboarding.modalStarter].species}
            spriteUrl={
              buildSpriteUrls(
                starters[onboarding.modalStarter].species,
                STARTER_DEX[onboarding.modalStarter],
              ).spriteUrl
            }
            animatedSpriteUrl={
              buildSpriteUrls(
                starters[onboarding.modalStarter].species,
                STARTER_DEX[onboarding.modalStarter],
              ).animatedSpriteUrl
            }
            currentTypes={
              resolvePokemonProfile(docs, starters[onboarding.modalStarter].species)
                ?.resolvedTypes ?? []
            }
            finalTypes={(() => {
              const finalSpecies = starters[onboarding.modalStarter].stageSpecies.at(-1);
              const finalTypes = finalSpecies
                ? (resolvePokemonProfile(docs, finalSpecies)?.resolvedTypes ?? [])
                : [];
              const currentTypes =
                resolvePokemonProfile(docs, starters[onboarding.modalStarter].species)
                  ?.resolvedTypes ?? [];
              return finalTypes.join("|") === currentTypes.join("|") ? [] : finalTypes;
            })()}
            nickname={onboarding.nickname}
            onNicknameChange={onboarding.actions.setNickname}
            onCancel={onboarding.actions.cancelStarterConfirm}
            onConfirm={onboarding.actions.confirmStarterSelection}
          />
        ) : null}
      </motion.section>
    </main>
  );
}
