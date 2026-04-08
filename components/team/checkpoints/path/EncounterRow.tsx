"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import {
  getPendingMandatoryBeforeEncounter,
  RunEncounterBoss,
  RunEncounterDefinition,
} from "@/lib/runEncounters";

import type { StarterKey } from "@/lib/builder";

export function EncounterRow({
  encounter,
  index,
  visibleEncounters,
  encounters,
  completedEncounterIds,
  dexByName,
  starterKey,
  immediateBlockedEncounterId,
  nextAvailableEncounterId,
  onToggleEncounter,
}: {
  encounter: RunEncounterDefinition;
  index: number;
  visibleEncounters: RunEncounterDefinition[];
  encounters: RunEncounterDefinition[];
  completedEncounterIds: string[];
  dexByName: Record<string, number>;
  starterKey: StarterKey;
  immediateBlockedEncounterId: string | null;
  nextAvailableEncounterId: string | null;
  onToggleEncounter: (id: string) => void;
}) {
  const isCompleted = completedEncounterIds.includes(encounter.id);
  const visibleBosses = getVisibleEncounterBosses(encounter, starterKey);
  const blockingEncounter = isCompleted
    ? null
    : getPendingMandatoryBeforeEncounter(encounters, completedEncounterIds, encounter.id);
  const isLocked = Boolean(blockingEncounter);
  const showBlockingHint = isLocked && encounter.id === immediateBlockedEncounterId;
  const isNext = !isCompleted && !isLocked && encounter.id === nextAvailableEncounterId;
  const hasPrevious = index > 0;
  const hasNext = index < visibleEncounters.length - 1;
  const topSegmentCompleted = hasPrevious
    ? completedEncounterIds.includes(visibleEncounters[index - 1]?.id)
    : false;
  const bottomSegmentCompleted = isCompleted;

  return (
    <div className="relative pl-8">
      <div className="pointer-events-none absolute left-0 top-0 flex h-full w-6 flex-col items-center">
        <span
          className={clsx(
            "w-px flex-1",
            !hasPrevious && "bg-transparent",
            hasPrevious &&
              (topSegmentCompleted
                ? "bg-primary-line-emphasis"
                : "bg-line"),
          )}
        />
        <span
          className={clsx(
            "relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 transition",
            isCompleted
              ? "border-primary-line-emphasis bg-primary-fill text-primary-soft"
              : isNext
                ? "border-accent bg-primary-fill/40 text-accent"
                : isLocked
                  ? "border-line bg-surface-3 text-transparent"
                  : "border-line-emphasis bg-surface-5 text-transparent",
          )}
        >
          <Check
            className={clsx(
              "h-3.5 w-3.5",
              !isCompleted && "opacity-0",
            )}
          />
          {isNext ? (
            <span className="absolute inset-[-4px] rounded-full border border-primary-line-emphasis/70" />
          ) : null}
        </span>
        <span
          className={clsx(
            "w-px flex-1",
            !hasNext && "bg-transparent",
            hasNext &&
              (bottomSegmentCompleted
                ? "bg-primary-line-emphasis"
                : isNext
                  ? "bg-primary-line-emphasis/50"
                  : "bg-line"),
          )}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          if (isLocked) {
            return;
          }
          onToggleEncounter(encounter.id);
        }}
        disabled={isLocked}
        title={
          blockingEncounter
            ? `Primero debes marcar ${blockingEncounter.label}.`
            : undefined
        }
        className={clsx(
          "w-full rounded-[0.8rem] border px-3 py-2.5 text-left transition",
          isLocked && "cursor-not-allowed opacity-60 grayscale",
          isNext &&
            !isCompleted &&
            !isLocked &&
            "border-primary-line-emphasis bg-primary-fill/50",
          isCompleted
            ? "border-primary-line-emphasis primary-complete-tint"
            : "border-line bg-surface-1 hover:bg-surface-3",
        )}
        style={isLocked ? { cursor: "not-allowed" } : undefined}
      >
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <EncounterHeader encounter={encounter} />
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted">
                    Lv cap {encounter.levelCap}
                  </span>
                  <span
                    className={clsx(
                      "inline-flex h-6 w-6 items-center justify-center rounded-2xl border transition",
                      isCompleted
                        ? "border-primary-line-emphasis bg-primary-fill-hover text-primary-soft"
                        : "border-line bg-surface-3 text-transparent",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          {showBlockingHint && blockingEncounter ? (
            <p className="mt-2 text-xs text-warning-soft">
              Primero marca {blockingEncounter.label}.
            </p>
          ) : null}
          {visibleBosses.length ? (
            <div
              className={clsx(
                "space-y-2",
                showBlockingHint ? "mt-2.5" : "mt-3",
              )}
            >
              {visibleBosses.map((boss) => (
                <EncounterBossRow
                  key={`${encounter.id}-${boss.label}`}
                  boss={boss}
                  encounterId={encounter.id}
                  dexByName={dexByName}
                />
              ))}
            </div>
          ) : encounter.team?.length ? (
            <div
              className={clsx(
                "flex w-full flex-nowrap items-center justify-between gap-1.5 overflow-hidden",
                showBlockingHint ? "mt-2.5" : "mt-3",
              )}
            >
              {encounter.team.map((species) => {
                const dex = resolveEncounterDex(species, dexByName);
                const sprites = buildSpriteUrls(species, dex);
                return (
                  <MiniEncounterPokemon
                    key={`${encounter.id}-${species}`}
                    species={species}
                    spriteUrl={sprites.spriteUrl}
                  />
                );
              })}
            </div>
          ) : (
            <p
              className={clsx(
                "text-xs text-muted",
                showBlockingHint ? "mt-2.5" : "mt-3",
              )}
            >
              team sprites pending
            </p>
          )}
          <EncounterMetaTags encounter={encounter} isNext={isNext} />
        </div>
      </button>
    </div>
  );
}

function EncounterHeader({ encounter }: { encounter: RunEncounterDefinition }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      <span className="display-face text-[10px] text-muted">
        #{encounter.order}
      </span>
      <span className="display-face truncate text-sm">{encounter.label}</span>
    </div>
  );
}

function EncounterMetaTags({
  encounter,
  isNext,
}: {
  encounter: RunEncounterDefinition;
  isNext: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {isNext ? (
        <span className="tag-xs bg-primary-fill text-primary-soft">
          next
        </span>
      ) : null}
      <span className="tag-xs border border-line bg-surface-4 text-muted">
        {encounter.category}
      </span>
      <span
        className={clsx(
          "tag-xs border",
          encounter.affiliation === "team-plasma"
            ? "border-danger-line-faint bg-danger-fill-strong text-danger-soft"
            : encounter.affiliation === "hoenn-leaders"
              ? "border-info-line bg-info-fill text-info-soft"
              : encounter.affiliation === "unova-league"
                ? "border-primary-line-soft bg-primary-fill-strong text-primary-soft"
                : encounter.affiliation === "rival"
                  ? "border-warning-line-faint bg-warning-fill text-warning-strong"
                  : "border-line bg-surface-4 text-muted",
        )}
      >
        {encounter.affiliation.replaceAll("-", " ")}
      </span>
      {!encounter.mandatory ? (
        <span className="tag-xs border border-info-line bg-info-fill text-info-soft">
          optional
        </span>
      ) : null}
      {encounter.documentation === "partial" ? (
        <span className="tag-xs border border-warning-line-faint bg-warning-fill text-warning-strong">
          partial
        </span>
      ) : null}
    </div>
  );
}

function EncounterBossRow({
  boss,
  encounterId,
  dexByName,
}: {
  boss: RunEncounterBoss;
  encounterId: string;
  dexByName: Record<string, number>;
}) {
  return (
    <div className="px-1 py-1">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="display-face text-xs text-accent">{boss.label}</span>
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        {boss.team.map((species) => {
          const dex = resolveEncounterDex(species, dexByName);
          const sprites = buildSpriteUrls(species, dex);
          return (
            <MiniEncounterPokemon
              key={`${encounterId}-${boss.label}-${species}`}
              species={species}
              spriteUrl={sprites.spriteUrl}
            />
          );
        })}
      </div>
    </div>
  );
}

function MiniEncounterPokemon({
  species,
  spriteUrl,
}: {
  species: string;
  spriteUrl?: string;
}) {
  return (
    <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden">
      {spriteUrl ? (
        <img
          src={spriteUrl}
          alt={species}
          className="h-full w-full scale-110 object-contain pixelated"
        />
      ) : (
        <span className="text-[9px] text-muted">{species.slice(0, 3)}</span>
      )}
    </span>
  );
}

function resolveEncounterDex(
  species: string,
  dexByName: Record<string, number | undefined>,
): number | undefined {
  const normalized = normalizeName(species);
  const exactDex = dexByName[normalized];
  if (exactDex !== undefined) {
    return exactDex;
  }
  if (normalized.startsWith("rotom-")) {
    const rotomDex = dexByName.rotom;
    if (rotomDex !== undefined) {
      return rotomDex;
    }
  }
  const baseSpecies = normalized.split("-")[0];
  return dexByName[baseSpecies] ?? undefined;
}

function getVisibleEncounterBosses(
  encounter: RunEncounterDefinition,
  starterKey: StarterKey,
) {
  const bosses = encounter.bosses ?? [];

  return bosses.filter((boss) => {
    const normalizedLabel = normalizeName(boss.label);
    if (!normalizedLabel.startsWith("if-you-picked-")) {
      return true;
    }
    return normalizedLabel === `if-you-picked-${starterKey}`;
  });
}
