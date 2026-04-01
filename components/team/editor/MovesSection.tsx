"use client";

import clsx from "clsx";
import { RefreshCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  getMoveProfileFit,
  MoveCueIcons,
  MovePowerBadge,
  MoveSlotSurface,
} from "@/components/team/UI";
import { TypeBadge } from "@/components/BuilderShared";
import type { ResolvedTeamMember } from "@/lib/teamAnalysis";

export function EditorMovesSection({
  currentMoves,
  resolved,
  selectedMoveIndex,
  onSelectMoveIndex,
  onOpenMoveModal,
  onRemoveMoveAt,
  onReorderMove,
}: {
  currentMoves: string[];
  resolved?: ResolvedTeamMember;
  selectedMoveIndex: number | null;
  onSelectMoveIndex: (index: number | null) => void;
  onOpenMoveModal: (slotIndex: number | null) => void;
  onRemoveMoveAt: (index: number) => void;
  onReorderMove: (fromIndex: number, toIndex: number) => void;
}) {
  const visibleSlots = currentMoves.length >= 4 ? currentMoves.length : 4;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isTrashOver, setIsTrashOver] = useState(false);
  const selectedMove =
    selectedMoveIndex !== null ? (resolved?.moves[selectedMoveIndex] ?? null) : null;
  const selectedMoveFit = useMemo(
    () => (selectedMove && resolved ? getMoveProfileFit(resolved, selectedMove) : null),
    [resolved, selectedMove],
  );

  function resetDragState() {
    setDragIndex(null);
    setDropIndex(null);
    setIsTrashOver(false);
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="display-face text-sm text-accent">Moveset</p>
        <div
          onDragOver={(event) => {
            if (dragIndex === null) {
              return;
            }
            event.preventDefault();
            setIsTrashOver(true);
          }}
          onDragLeave={() => setIsTrashOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndex !== null) {
              onRemoveMoveAt(dragIndex);
              if (selectedMoveIndex === dragIndex) {
                onSelectMoveIndex(null);
              }
            }
            resetDragState();
          }}
          className={clsx(
            "inline-flex items-center gap-2 rounded-[999px] border px-3 py-1.5 text-xs transition",
            isTrashOver
              ? "border-danger-line-strong bg-danger-fill-hover text-danger"
              : "border-danger-line-faint bg-danger-fill text-danger",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          drop to delete
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: visibleSlots }, (_, index) => resolved?.moves[index] ?? null).map(
          (move, index) =>
            move ? (
              <div
                key={`sheet-move-${move.name}-${index}`}
                draggable
                onDragStart={(event) => {
                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={resetDragState}
                onDragOver={(event) => {
                  if (dragIndex === null || dragIndex === index) {
                    return;
                  }
                  event.preventDefault();
                  setDropIndex(index);
                  setIsTrashOver(false);
                }}
                onDragLeave={() => {
                  if (dropIndex === index) {
                    setDropIndex(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    onReorderMove(dragIndex, index);
                  }
                  resetDragState();
                }}
                onClick={() =>
                  onSelectMoveIndex(selectedMoveIndex === index ? null : index)
                }
                className="cursor-pointer"
              >
                <MoveSlotSurface
                  move={move}
                  member={resolved}
                  className={clsx(
                    "flex w-full",
                    selectedMoveIndex === index &&
                      "border-primary-line-emphasis primary-outline-shadow",
                    dragIndex === index && "opacity-45",
                    dropIndex === index &&
                      "border-primary-line-emphasis primary-outline-shadow",
                  )}
                />
              </div>
            ) : (
              <button
                key={`sheet-empty-move-${index}`}
                type="button"
                onClick={() => {
                  onSelectMoveIndex(null);
                  onOpenMoveModal(null);
                }}
                className="flex touch-manipulation items-center rounded-[0.625rem] border border-dashed border-line-soft bg-surface-1 px-3 py-3 text-sm text-muted transition hover:border-primary-line-emphasis hover:bg-primary-fill"
              >
                empty move slot
              </button>
            ),
        )}
      </div>

      {selectedMove && selectedMoveIndex !== null ? (
        <div className="mt-3 rounded-[0.75rem] border border-surface-5 bg-surface-3 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="pixel-face min-w-0 text-[12px] leading-none tracking-[0.12em] font-normal sm:text-[13px] md:text-[14px] lg:text-[16px]">
                  {selectedMove.name}
                </p>
                {selectedMove.type ? <TypeBadge type={selectedMove.type} /> : null}
                <MovePowerBadge
                  damageClass={selectedMove.damageClass}
                  power={selectedMove.power}
                  adjustedPower={selectedMove.adjustedPower}
                />
                <MoveCueIcons
                  hasStab={selectedMove.hasStab}
                  fit={selectedMoveFit}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                {selectedMove.accuracy ? (
                  <span className="rounded-[0.45rem] border border-line px-2 py-1">
                    Acc {selectedMove.accuracy}%
                  </span>
                ) : null}
                {selectedMove.pp ? (
                  <span className="rounded-[0.45rem] border border-line px-2 py-1">
                    PP {selectedMove.pp}
                  </span>
                ) : null}
                {selectedMove.hasStab ? (
                  <span className="rounded-[0.45rem] border border-warning-line px-2 py-1 text-warning-strong">
                    STAB
                  </span>
                ) : null}
              </div>
              {selectedMove.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {selectedMove.description}
                </p>
              ) : null}
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-none">
              <button
                type="button"
                onClick={() => onOpenMoveModal(selectedMoveIndex)}
                className="inline-flex touch-manipulation items-center justify-center gap-2 rounded-[0.55rem] border border-primary-line bg-primary-fill px-3 py-2 text-xs text-primary-soft transition hover:bg-primary-fill-hover"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                replace
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveMoveAt(selectedMoveIndex);
                  onSelectMoveIndex(null);
                }}
                className="inline-flex touch-manipulation items-center justify-center gap-2 rounded-[0.55rem] border border-danger-line-soft bg-danger-fill px-3 py-2 text-xs text-danger transition hover:bg-danger-fill-hover"
              >
                <Trash2 className="h-3.5 w-3.5" />
                delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
