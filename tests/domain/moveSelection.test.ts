import { test, assert } from "vitest";

import { applyMoveSelection } from "../../lib/domain/moveSelection";

test("adds a move to a member with free slots", () => {
  assert.deepEqual(
    applyMoveSelection(["Tackle"], "Vine Whip", null),
    {
      didApply: true,
      nextMoves: ["Tackle", "Vine Whip"],
      mode: "add",
    },
  );
});

test("prevents adding a duplicate move", () => {
  assert.deepEqual(
    applyMoveSelection(["Tackle"], "Tackle", null),
    {
      didApply: false,
      nextMoves: ["Tackle"],
      reason: "duplicate",
    },
  );
});

test("prevents adding a move when the moveset is already full", () => {
  assert.deepEqual(
    applyMoveSelection(["A", "B", "C", "D"], "E", null),
    {
      didApply: false,
      nextMoves: ["A", "B", "C", "D"],
      reason: "full",
    },
  );
});

test("replaces the selected move slot with a new move", () => {
  assert.deepEqual(
    applyMoveSelection(["Tackle", "Growl"], "Vine Whip", 1),
    {
      didApply: true,
      nextMoves: ["Tackle", "Vine Whip"],
      mode: "replace",
    },
  );
});

test("prevents replacing a move with one that already exists in another slot", () => {
  assert.deepEqual(
    applyMoveSelection(["Tackle", "Growl"], "Tackle", 1),
    {
      didApply: false,
      nextMoves: ["Tackle", "Growl"],
      reason: "duplicate",
    },
  );
});

test("rejects replacing a slot with the same move already in that slot", () => {
  assert.deepEqual(
    applyMoveSelection(["Tackle", "Growl"], "Growl", 1),
    {
      didApply: false,
      nextMoves: ["Tackle", "Growl"],
      reason: "same-move",
    },
  );
});
