"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import type { CSSProperties } from "react";

import {
  getMoveProfileFit,
  getMoveSurfaceStyle as getTypedMoveSurfaceStyle,
  getMoveStabStyle,
  getMoveSurfaceClass,
  MoveCueIcons,
  MovePowerBadge,
} from "@/components/team/UI";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import {
  applyMovePowerModifiers,
  getMovePowerModifiers,
  getWeatherAdjustedMove,
} from "@/lib/domain/moves";
import type { BattleWeather } from "@/lib/domain/battle";
import { normalizeName } from "@/lib/domain/names";
import type { RemoteMove, ResolvedTeamMember } from "@/lib/teamAnalysis";

type MovePickerItem = {
  key: string;
  label: string;
  move: string;
  details?: RemoteMove | null;
};

export function MovePickerModal({
  member,
  currentMoves,
  slotIndex,
  tab,
  weather,
  onTabChange,
  onClose,
  onPickMove,
  getMoveSurfaceStyle,
}: {
  member: ResolvedTeamMember;
  currentMoves: string[];
  slotIndex: number | null;
  tab: "levelUp" | "machines";
  weather: BattleWeather;
  onTabChange: (tab: "levelUp" | "machines") => void;
  onClose: () => void;
  onPickMove: (moveName: string) => void;
  getMoveSurfaceStyle: (type?: string | null) => CSSProperties | undefined;
}) {
  const levelUpItems = (member.learnsets?.levelUp ?? []).map((entry) => ({
    key: `level-${entry.level}-${entry.move}`,
    label: `Lv ${entry.level}`,
    move: entry.move,
    details: entry.details,
  }));
  const machineItems = (member.learnsets?.machines ?? []).map((entry) => ({
    key: `machine-${entry.source}-${entry.move}`,
    label: entry.source,
    move: entry.move,
    details: entry.details,
  }));
  const items = tab === "levelUp" ? levelUpItems : machineItems;
  const isReplaceMode = slotIndex !== null;
  const replaceMoveName = slotIndex !== null ? currentMoves[slotIndex] ?? null : null;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.08)] pt-3">
        <div className="min-w-0">
          <p className="display-face text-[11px] text-accent">
            {isReplaceMode ? `replace ${replaceMoveName ?? "move"}` : "add move"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTabChange("levelUp")}
            className={clsx(
              "rounded-[0.5rem] border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
              tab === "levelUp"
                ? "border-[rgba(94,240,203,0.5)] bg-[rgba(94,240,203,0.12)] text-accent"
                : "border-line text-muted",
            )}
          >
            Lv up {levelUpItems.length}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("machines")}
            className={clsx(
              "rounded-[0.5rem] border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
              tab === "machines"
                ? "border-[rgba(94,240,203,0.5)] bg-[rgba(94,240,203,0.12)] text-accent"
                : "border-line text-muted",
            )}
          >
            TM {machineItems.length}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[0.45rem] border border-line text-muted transition hover:bg-surface-4"
            aria-label="Close move picker"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <TooltipProvider>
        <div className="scrollbar-thin grid max-h-[18rem] gap-1 overflow-auto pr-1 sm:grid-cols-2">
          {items.length ? (
            items.map((item) => {
            const previewMove = {
              name: item.move,
              type: item.details?.type,
              damageClass: item.details?.damageClass,
              power: item.details?.power,
              accuracy: item.details?.accuracy,
              pp: item.details?.pp,
              description: item.details?.description,
            };
            const weatherAdjustedMove = getWeatherAdjustedMove(previewMove, weather);
            const powerModifiers = getMovePowerModifiers({
              move: weatherAdjustedMove,
              itemName: member.item,
              itemEffect: member.itemDetails?.effect,
              abilityName: member.ability,
              abilityEffect: member.abilityDetails?.effect,
              weather,
            });
            const adjustedPower = applyMovePowerModifiers(weatherAdjustedMove.power, powerModifiers);
            const isCurrentMove = currentMoves.includes(item.move);
            const existsElsewhere =
              slotIndex !== null &&
              currentMoves.some(
                (currentMove, currentIndex) =>
                  currentMove === item.move && currentIndex !== slotIndex,
              );
            const canApply = slotIndex !== null
              ? !existsElsewhere
              : !isCurrentMove && currentMoves.length < 4;
            const canClickAction = canApply || (isReplaceMode && replaceMoveName === item.move);
            const hasStab = Boolean(
              item.details?.type &&
                member.resolvedTypes.some(
                  (type) => normalizeName(type) === normalizeName(weatherAdjustedMove.type ?? ""),
                ),
            );

            return (
              <Tooltip key={item.key}>
                <TooltipTrigger
                  type="button"
                  onClick={() => {
                    if (canClickAction) {
                      onPickMove(item.move);
                    }
                  }}
                  disabled={!canClickAction}
                  style={{
                    ...getTypedMoveSurfaceStyle(weatherAdjustedMove.type),
                    ...(hasStab ? getMoveStabStyle(weatherAdjustedMove.type) : undefined),
                  }}
                  className={clsx(
                    "flex w-full items-center gap-2 rounded-[0.5rem] border px-2 py-1.5 text-left transition",
                    getMoveSurfaceClass(weatherAdjustedMove.type, hasStab),
                    hasStab && "move-stab-surface",
                    !canClickAction && "opacity-55",
                    canClickAction && "hover:brightness-110",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="display-face shrink-0 text-[9px] text-current/80">
                        {item.label}
                      </span>
                      <span className="pixel-face min-w-0 truncate text-[11px] leading-none tracking-[0.1em] font-normal">
                        {item.move}
                      </span>
                      <MoveCueIcons
                        hasStab={hasStab}
                        fit={getMoveProfileFit(member, previewMove)}
                      />
                    </span>
                  </span>
                  <MovePowerBadge
                    damageClass={item.details?.damageClass}
                    power={weatherAdjustedMove.power}
                    adjustedPower={adjustedPower}
                  />
                  {isCurrentMove ? (
                    <span className="display-face shrink-0 text-[9px] uppercase tracking-[0.1em] text-primary-soft">
                      picked
                    </span>
                  ) : null}
                </TooltipTrigger>
                <TooltipContent>
                  {item.details?.description ?? item.move}
                </TooltipContent>
              </Tooltip>
            );
          })
        ) : (
          <p className="text-sm text-muted sm:col-span-2">No hay movimientos en esta pestaña.</p>
        )}
      </div>
    </TooltipProvider>
    </section>
  );
}
