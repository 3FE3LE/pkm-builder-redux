"use client";

import { useMemo } from "react";

import { EncounterRow } from "@/components/team/checkpoints/path/EncounterRow";
import { normalizeName } from "@/lib/domain/names";
import {
  getPendingMandatoryBeforeEncounter,
  RunEncounterDefinition,
} from "@/lib/runEncounters";

import type { StarterKey } from "@/lib/builder";
export function PathPanel({
  encounters,
  completedEncounterIds,
  speciesCatalog,
  starterKey,
  onToggleEncounter,
  maxHeight,
  variant = "full",
}: {
  encounters: RunEncounterDefinition[];
  completedEncounterIds: string[];
  speciesCatalog: { name: string; dex: number }[];
  starterKey: StarterKey;
  onToggleEncounter: (id: string) => void;
  maxHeight?: number;
  variant?: "full" | "mobile-summary";
}) {
  const safeCompletedEncounterIds = completedEncounterIds ?? [];
  const safeSpeciesCatalog = speciesCatalog ?? [];
  const dexByName = useMemo(
    () =>
      Object.fromEntries(
        safeSpeciesCatalog.map((entry) => [
          normalizeName(entry.name),
          entry.dex,
        ]),
      ) as Record<string, number>,
    [safeSpeciesCatalog],
  );
  const immediateBlockedEncounterId = useMemo(
    () =>
      encounters.find((encounter) => {
        if (safeCompletedEncounterIds.includes(encounter.id)) {
          return false;
        }
        return Boolean(
          getPendingMandatoryBeforeEncounter(
            encounters,
            safeCompletedEncounterIds,
            encounter.id,
          ),
        );
      })?.id ?? null,
    [encounters, safeCompletedEncounterIds],
  );
  const nextAvailableEncounterId = useMemo(
    () =>
      encounters.find((encounter) => {
        if (safeCompletedEncounterIds.includes(encounter.id)) {
          return false;
        }
        return !getPendingMandatoryBeforeEncounter(
          encounters,
          safeCompletedEncounterIds,
          encounter.id,
        );
      })?.id ?? null,
    [encounters, safeCompletedEncounterIds],
  );
  const visibleEncounters = useMemo(() => {
    if (variant !== "mobile-summary") {
      return encounters;
    }

    const lastCompletedIndex = encounters.reduce((lastIndex, encounter, index) => {
      return safeCompletedEncounterIds.includes(encounter.id) ? index : lastIndex;
    }, -1);
    const startIndex = Math.max(0, lastCompletedIndex);
    const nextMandatoryIndex = encounters.findIndex(
      (encounter, index) => index > startIndex && encounter.mandatory,
    );
    const endIndex =
      nextMandatoryIndex >= 0
        ? nextMandatoryIndex
        : Math.min(encounters.length - 1, startIndex + 3);

    return encounters.slice(startIndex, endIndex + 1);
  }, [encounters, safeCompletedEncounterIds, variant]);

  return (
    <div
      className="flex min-w-0 h-full flex-col overflow-hidden px-1 py-1"
      style={
        maxHeight
          ? { height: Math.round(maxHeight), maxHeight: Math.round(maxHeight) }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="display-face text-sm text-accent">Ruta</p>
        </div>
        <div className="rounded-[0.7rem_0.45rem_0.7rem_0.45rem] bg-surface-3 px-3 py-1.5 text-xs text-muted">
          {safeCompletedEncounterIds.length}/{encounters.length}
        </div>
      </div>
      <div className="mt-4 min-h-0 flex-1">
        <div className="scrollbar-thin h-full space-y-2 overflow-y-auto overflow-x-hidden pr-1">
          {visibleEncounters.map((encounter, index) => {
            return (
              <EncounterRow
                key={encounter.id}
                encounter={encounter}
                index={index}
                visibleEncounters={visibleEncounters}
                encounters={encounters}
                completedEncounterIds={safeCompletedEncounterIds}
                dexByName={dexByName}
                starterKey={starterKey}
                immediateBlockedEncounterId={immediateBlockedEncounterId}
                nextAvailableEncounterId={nextAvailableEncounterId}
                onToggleEncounter={onToggleEncounter}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
