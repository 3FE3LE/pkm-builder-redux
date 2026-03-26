export type MoveSelectionResult =
  | { didApply: true; nextMoves: string[]; mode: "add" | "replace" }
  | {
      didApply: false;
      nextMoves: string[];
      reason: "duplicate" | "full" | "missing-slot" | "same-move";
    };

export function applyMoveSelection(
  currentMoves: string[],
  moveName: string,
  slotIndex: number | null,
): MoveSelectionResult {
  if (slotIndex === null) {
    if (currentMoves.includes(moveName)) {
      return { didApply: false, nextMoves: currentMoves, reason: "duplicate" };
    }

    if (currentMoves.length >= 4) {
      return { didApply: false, nextMoves: currentMoves, reason: "full" };
    }

    return {
      didApply: true,
      nextMoves: [...currentMoves, moveName],
      mode: "add",
    };
  }

  const currentMove = currentMoves[slotIndex];
  if (!currentMove) {
    return { didApply: false, nextMoves: currentMoves, reason: "missing-slot" };
  }

  if (currentMove === moveName) {
    return { didApply: false, nextMoves: currentMoves, reason: "same-move" };
  }

  const existsElsewhere = currentMoves.some(
    (existingMove, index) => existingMove === moveName && index !== slotIndex,
  );
  if (existsElsewhere) {
    return { didApply: false, nextMoves: currentMoves, reason: "duplicate" };
  }

  const nextMoves = [...currentMoves];
  nextMoves[slotIndex] = moveName;

  return {
    didApply: true,
    nextMoves,
    mode: "replace",
  };
}
