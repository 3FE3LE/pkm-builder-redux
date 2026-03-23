"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useMemo } from "react";

import { buildSpriteUrls, normalizeName } from "@/lib/domain/names";
import type { StarterKey } from "@/lib/builder";
import type { RunEncounterBoss, RunEncounterDefinition } from "@/lib/runEncounters";

export function RunPathPanel({
  encounters,
  completedEncounterIds,
  speciesCatalog,
  starterKey,
  onToggleEncounter,
}: {
  encounters: RunEncounterDefinition[];
  completedEncounterIds: string[];
  speciesCatalog: { name: string; dex: number }[];
  starterKey: StarterKey;
  onToggleEncounter: (id: string) => void;
}) {
  const safeCompletedEncounterIds = completedEncounterIds ?? [];
  const safeSpeciesCatalog = speciesCatalog ?? [];
  const dexByName = useMemo(
    () =>
      Object.fromEntries(
        safeSpeciesCatalog.map((entry) => [normalizeName(entry.name), entry.dex]),
      ) as Record<string, number>,
    [safeSpeciesCatalog],
  );

  return (
    <div className="rounded-[1rem] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-face text-sm text-accent">Run path</p>
          <p className="mt-2 text-sm text-muted">
            Ruta principal en Challenge Mode. Puedes marcar encounters ya resueltos para que el progreso de la run quede persistido.
          </p>
        </div>
        <div className="panel-tint-strong glass-shadow rounded-[0.7rem_0.45rem_0.7rem_0.45rem] border border-line px-3 py-1.5 text-xs text-muted">
          {safeCompletedEncounterIds.length}/{encounters.length}
        </div>
      </div>
      <div className="scrollbar-thin mt-5 max-h-[32rem] space-y-2 overflow-auto pr-1">
        {encounters.map((encounter) => {
          const isCompleted = safeCompletedEncounterIds.includes(encounter.id);
          const visibleBosses = getVisibleEncounterBosses(encounter, starterKey);

          return (
            <button
              key={encounter.id}
              type="button"
              onClick={() => onToggleEncounter(encounter.id)}
              className={clsx(
                "flex w-full items-start justify-between gap-3 rounded-[0.8rem] border px-4 py-3 text-left transition",
                isCompleted
                  ? "border-primary-line-emphasis primary-complete-tint"
                  : "border-line bg-surface-1 hover:bg-surface-3",
              )}
            >
              <div className="flex items-start gap-3">
                <TrainerAvatar
                  label={encounter.label}
                  trainerSpriteUrl={encounter.trainerSpriteUrl}
                  completed={isCompleted}
                />
              </div>
              <div className="min-w-0 flex-1">
                <EncounterHeader encounter={encounter} />
                <p className="mt-2 text-sm text-muted">Lv cap {encounter.levelCap}</p>
                {visibleBosses.length ? (
                  <div className="mt-3 space-y-3">
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
                  <div className="mt-3 flex flex-wrap items-center gap-2">
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
                  <p className="mt-3 text-xs text-muted">team sprites pending</p>
                )}
              </div>
              <span
                className={clsx(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[0.45rem] border transition",
                  isCompleted
                    ? "border-primary-line-emphasis bg-primary-fill-hover text-primary-soft"
                    : "border-line bg-surface-3 text-transparent",
                )}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EncounterHeader({ encounter }: { encounter: RunEncounterDefinition }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="display-face text-sm">{encounter.label}</span>
      <span className="rounded-[0.6rem_0.4rem_0.6rem_0.4rem] border border-line bg-surface-4 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
        {encounter.category}
      </span>
      <span
        className={clsx(
          "rounded-[0.6rem_0.4rem_0.6rem_0.4rem] border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
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
        <span className="rounded-[0.6rem_0.4rem_0.6rem_0.4rem] border border-info-line bg-info-fill px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-info-soft">
          optional
        </span>
      ) : null}
      {encounter.documentation === "partial" ? (
        <span className="rounded-[0.6rem_0.4rem_0.6rem_0.4rem] border border-warning-line-faint bg-warning-fill px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-warning-strong">
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
    <div className="rounded-[0.75rem] border border-surface-5 bg-surface-3 px-3 py-2">
      <div className="mb-2 flex items-center gap-2">
        <TrainerAvatar label={boss.label} trainerSpriteUrl={boss.trainerSpriteUrl} completed={false} />
        <span className="display-face text-xs text-accent">{boss.label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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

function TrainerAvatar({
  label,
  trainerSpriteUrl,
  completed,
}: {
  label: string;
  trainerSpriteUrl?: string | null;
  completed: boolean;
}) {
  const initials = label
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");

  if (trainerSpriteUrl) {
    return (
      <img
        src={trainerSpriteUrl}
        alt={label}
        className={clsx(
          "h-12 w-12 shrink-0 rounded-[0.8rem_0.45rem_0.8rem_0.45rem] border border-line object-cover",
          completed && "primary-complete-shadow",
        )}
      />
    );
  }

  return (
    <span
      className={clsx(
        "display-face panel-tint-strong glass-shadow inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.8rem_0.45rem_0.8rem_0.45rem] border border-line text-sm text-accent",
        completed && "border-primary-line-strong",
      )}
    >
      {initials || "TR"}
    </span>
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
    <span className="soft-inset-shadow inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[0.65rem_0.4rem_0.65rem_0.4rem] border border-line bg-surface-4">
      {spriteUrl ? (
        <img src={spriteUrl} alt={species} className="h-9 w-9 object-contain pixelated" />
      ) : (
        <span className="text-[9px] text-muted">{species.slice(0, 3)}</span>
      )}
    </span>
  );
}

function resolveEncounterDex(species: string, dexByName: Record<string, number>) {
  const normalized = normalizeName(species);
  const exactDex = dexByName[normalized];
  if (exactDex) {
    return exactDex;
  }
  if (normalized.startsWith("rotom-")) {
    return dexByName.rotom;
  }
  const baseSpecies = normalized.split("-")[0];
  return dexByName[baseSpecies];
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
