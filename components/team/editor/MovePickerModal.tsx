"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "usehooks-ts";

import {
  getMoveProfileFit,
  getMoveSurfaceStyle as getTypedMoveSurfaceStyle,
  getMoveStabStyle,
  getMoveSurfaceClass,
  MoveCueIcons,
  MovePowerBadge,
} from "@/components/team/UI";
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
  const isMobile = useMediaQuery("(max-width: 639px)", {
    defaultValue: false,
    initializeWithValue: false,
  });

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
  const content = (
    <section className="space-y-2">
      <div className={clsx("flex flex-wrap items-center justify-between gap-3", !isMobile && "border-t border-line-soft pt-3")}>
        <div className="min-w-0">
          <p className="micro-label text-accent">
            {isReplaceMode ? `replace ${replaceMoveName ?? "move"}` : "add move"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTabChange("levelUp")}
            className={clsx(
              "touch-manipulation radius-control-sm border px-2 py-0.5 caption-dense uppercase tracking-widest",
              tab === "levelUp"
                ? "accent-badge-soft"
                : "border-line text-muted",
            )}
          >
            Lv up {levelUpItems.length}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("machines")}
            className={clsx(
              "touch-manipulation radius-control-sm border px-2 py-0.5 caption-dense uppercase tracking-widest",
              tab === "machines"
                ? "accent-badge-soft"
                : "border-line text-muted",
            )}
          >
            TM {machineItems.length}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="app-icon-button inline-flex h-7 w-7 touch-manipulation items-center justify-center rounded-2xl text-muted"
            aria-label="Close move picker"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="scrollbar-thin grid max-h-72 gap-1 overflow-auto pr-1 sm:grid-cols-2">
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
            const isCurrentSlotMove = replaceMoveName === item.move;
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
              <button
                key={item.key}
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
                aria-pressed={isCurrentSlotMove}
                title={item.details?.description ?? item.move}
                className={clsx(
                  "flex w-full touch-manipulation items-center gap-2 radius-control-sm border px-2 py-1.5 text-left transition",
                  getMoveSurfaceClass(weatherAdjustedMove.type, hasStab),
                  hasStab && "move-stab-surface",
                  !canClickAction && "opacity-55",
                  canClickAction && "hover:brightness-110",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="display-face shrink-0 micro-text-8 text-current/80">
                      {item.label}
                    </span>
                    <span className="pixel-face min-w-0 truncate text-xs leading-none tracking-widest font-normal sm:text-xs md:text-sm lg:text-base">
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
                  <span className="display-face shrink-0 micro-text-8 uppercase tracking-widest text-primary-soft">
                    {isCurrentSlotMove ? "current" : "picked"}
                  </span>
                ) : null}
              </button>
            );
          })
        ) : (
          <p className="text-sm text-muted sm:col-span-2">No hay movimientos en esta pestaña.</p>
        )}
      </div>
    </section>
  );

  if (!isMobile) {
    return content;
  }

  return createPortal(
    <div className="fixed inset-0 z-1000">
      <button
        type="button"
        aria-label="Cerrar lista de movimientos"
        className="modal-backdrop absolute inset-0 supports-backdrop-filter:backdrop-blur-md"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
      />
      <div className="absolute inset-x-0 top-0 px-3 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="status-popover rounded-xl border border-line p-3 shadow-2xl backdrop-blur-md">
          {content}
        </div>
      </div>
    </div>,
    document.body,
  );
}
