"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { MoveSlotSurface } from "@/components/team/UI";
import { dexStatChipClassName } from "@/components/team/screens/dex/DexShared";
import { Button } from "@/components/ui/Button";
import { applyMovePowerModifiers, getMovePowerModifiers, getWeatherAdjustedMove } from "@/lib/domain/moves";
import type { BattleWeather } from "@/lib/domain/battle";
import type { LevelUpMoveEntry } from "@/lib/domain/levelUpMoves";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

const levelUpMovePriorityPillClassName =
  "rounded-2xl border border-warning-line px-2 py-1 text-warning-strong";

export function LevelUpMoveModal({
  open,
  member,
  currentMoves,
  weather,
  queuedMoves,
  onClose,
  onLearn,
  onSkip,
  onReplace,
}: {
  open: boolean;
  member?: ResolvedTeamMember;
  currentMoves: string[];
  weather: BattleWeather;
  queuedMoves: LevelUpMoveEntry[];
  onClose: () => void;
  onLearn: () => void;
  onSkip: () => void;
  onReplace: (slotIndex: number) => void;
}) {
  const [replacementStageMove, setReplacementStageMove] = useState<string | null>(null);
  const activeMove = queuedMoves[0] ?? null;
  const replacementStage = Boolean(activeMove?.move) && replacementStageMove === activeMove.move;

  const movePreview = useMemo(() => {
    if (!activeMove) {
      return null;
    }

    const baseMove = {
      name: activeMove.move,
      type: activeMove.details?.type,
      damageClass: activeMove.details?.damageClass,
      power: activeMove.details?.power,
      accuracy: activeMove.details?.accuracy,
      pp: activeMove.details?.pp,
      description: activeMove.details?.description,
    };
    const weatherAdjustedMove = getWeatherAdjustedMove(baseMove, weather);
    const powerModifiers = getMovePowerModifiers({
      move: weatherAdjustedMove,
      itemName: member?.item,
      itemEffect: member?.itemDetails?.effect,
      abilityName: member?.ability,
      abilityEffect: member?.abilityDetails?.effect,
      weather,
    });

    return {
      ...weatherAdjustedMove,
      pp: activeMove.details?.pp ?? null,
      adjustedPower: applyMovePowerModifiers(weatherAdjustedMove.power, powerModifiers),
      hasStab: Boolean(
        weatherAdjustedMove.type &&
          member?.resolvedTypes.some((type) => type === weatherAdjustedMove.type),
      ),
    };
  }, [activeMove, member?.ability, member?.abilityDetails?.effect, member?.item, member?.itemDetails?.effect, member?.resolvedTypes, weather]);

  if (!open || !activeMove) {
    return null;
  }

  const moveIndex = queuedMoves.findIndex((entry) => entry.move === activeMove.move);
  const alreadyKnown = currentMoves.includes(activeMove.move);
  const canAddDirectly = !alreadyKnown && currentMoves.length < 4;
  const priority = activeMove.details?.priority ?? 0;

  return (
    <div className="modal-backdrop-strong fixed inset-0 z-170 flex items-center justify-center px-4 py-6 backdrop-blur-md">
      <div className="panel-strong relative w-full max-w-2xl overflow-hidden rounded-2xl p-6">
        <div className="sheet-highlight absolute inset-x-0 top-0 h-24" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="display-face text-sm text-accent">Level up</p>
            <h2 className="pixel-face mt-2 text-2xl">
              {replacementStage ? "Elige qué movimiento olvidar" : "Aprender nuevo movimiento"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {member?.species ?? "Este Pokemon"} llegó a nivel {activeMove.level}.
              {queuedMoves.length > 1 ? ` Movimiento ${moveIndex + 1} de ${queuedMoves.length}.` : null}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!replacementStage ? (
          <div className="relative mt-6 space-y-5">
            <div className="radius-control-lg border border-line bg-surface-2 p-4">
              <p className="display-face text-xs uppercase tracking-display-strong text-muted">
                Quiere aprender
              </p>
              <div className="mt-3 flex items-center gap-3">
                {movePreview ? (
                  <div className="min-w-0 flex-1">
                    <MoveSlotSurface
                      move={{
                        name: activeMove.move,
                        type: movePreview.type ?? undefined,
                        hasStab: movePreview.hasStab,
                        damageClass: movePreview.damageClass ?? undefined,
                        power: movePreview.power,
                        adjustedPower: movePreview.adjustedPower,
                      }}
                      member={member}
                      className="flex w-full rounded-xl px-3 py-2.5"
                    />
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                      {movePreview.accuracy ? (
                        <span className={dexStatChipClassName}>
                          Acc {movePreview.accuracy}%
                        </span>
                      ) : null}
                      {movePreview.pp ? (
                        <span className={dexStatChipClassName}>
                          PP {movePreview.pp}
                        </span>
                      ) : null}
                      {priority !== 0 ? (
                        <span className={levelUpMovePriorityPillClassName}>
                          Pri {priority > 0 ? `+${priority}` : priority}
                        </span>
                      ) : null}
                    </div>
                    {movePreview.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-muted">
                        {movePreview.description}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="pixel-face text-lg">{activeMove.move}</p>
                )}
              </div>
            </div>

            {alreadyKnown ? (
              <p className="rounded-xl border border-warning-line bg-warning-fill px-3 py-2 text-sm text-warning-strong">
                Ya conoce este movimiento.
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onSkip}>
                Omitir
              </Button>
              {alreadyKnown ? (
                <Button type="button" variant="outline" onClick={onSkip}>
                  Continuar
                </Button>
              ) : canAddDirectly ? (
                <Button type="button" variant="outline" onClick={onLearn}>
                  Aprender
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplacementStageMove(activeMove.move)}
                >
                  Reemplazar movimiento
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative mt-6 space-y-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {currentMoves.map((moveName, index) => {
                const currentMove = member?.moves[index];
                return (
                  <button
                    key={`forget-move-${index}-${moveName}`}
                    type="button"
                    onClick={() => onReplace(index)}
                    className="text-left"
                  >
                    {currentMove ? (
                      <MoveSlotSurface
                        move={currentMove}
                        member={member}
                        className="flex w-full rounded-xl hover:border-primary-line-emphasis hover:brightness-110"
                        title={`Olvidar ${moveName}`}
                      />
                    ) : (
                      <span className="flex h-10.5 items-center radius-control-md border border-line bg-surface-2 px-3 text-sm text-text">
                        {moveName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setReplacementStageMove(null)}>
                Volver
              </Button>
              <Button type="button" variant="ghost" onClick={onSkip}>
                No aprender
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
