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

function OnboardingFeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[0.75rem] border border-line p-4">
      <p className="display-face text-sm">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </article>
  );
}

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
  const currentTypes =
    resolvePokemonProfile(docs, starterData.species)?.resolvedTypes ?? [];
  const finalSpecies = starterData.stageSpecies.at(-1);
  const finalTypes = finalSpecies
    ? (resolvePokemonProfile(docs, finalSpecies)?.resolvedTypes ?? [])
    : [];
  const finalDistinct = finalTypes.join("|") !== currentTypes.join("|");

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
        "group panel relative overflow-hidden rounded-[0.9rem] border border-line p-5 text-left transition duration-200 hover:border-primary-line-emphasis hover:bg-primary-fill",
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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="display-face mt-2 text-3xl">{starterData.species}</p>
          </div>
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
              size="large"
              chrome="plain"
            />
          </motion.div>
        </div>
        <p className="mt-3 text-sm text-muted">{starterData.headline}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {currentTypes.map((type) => (
            <TypeBadge key={`${starterKey}-${type}`} type={type} />
          ))}
        </div>
        {finalDistinct && finalTypes.length ? (
          <div className="mt-3">
            <p className="display-face text-xs text-muted">Tipo final</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {finalTypes.map((type) => (
                <TypeBadge key={`${starterKey}-final-${type}`} type={type} />
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex items-center justify-between gap-3">
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
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <div className="panel-strong relative overflow-hidden rounded-[1rem] p-6 sm:p-8">
          <div className="spotlight-primary-soft absolute -right-16 top-[-3rem] h-48 w-48 rounded-full blur-3xl" />
          <div className="spotlight-accent-soft absolute left-[-3rem] top-24 h-32 w-32 rounded-full blur-3xl" />
          <p className="display-face text-sm text-accent">Onboarding</p>
          <h1 className="display-face mt-3 max-w-4xl text-4xl leading-none sm:text-6xl">
            Elige tu inicial y arranca el run.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted sm:text-lg">
            La elección define el primer slot del equipo y el enfoque de sugerencias del checkpoint. Después entras directo al builder para completar el resto del roster.
          </p>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {(Object.keys(starters) as StarterKey[]).map((starterKey) => (
              <OnboardingStarterCard key={starterKey} starterKey={starterKey} />
            ))}
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            <OnboardingFeatureCard
              title="Roster superior"
              description="Sprites, tipos, moves y lectura rápida del equipo como bloque principal."
            />
            <OnboardingFeatureCard
              title="Stats promedio"
              description="HP, Atk, Def, SpA, SpD, Spe y BST promedio visibles al principio del builder."
            />
            <OnboardingFeatureCard
              title="Cobertura y amenazas"
              description="Multiplicadores exactos `x4`, `x2`, `x1`, `x0.5`, `x0.25` y `x0`."
            />
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
