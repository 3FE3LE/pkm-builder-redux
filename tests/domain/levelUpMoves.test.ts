import { describe, expect, it } from "vitest";

import { getLevelUpMovesBetweenLevels, mergeLevelUpMoveQueues } from "@/lib/domain/levelUpMoves";

describe("levelUpMoves", () => {
  it("returns only newly unlocked unique moves in the requested level range", () => {
    expect(
      getLevelUpMovesBetweenLevels({
        learnset: [
          { level: 1, move: "Tackle" },
          { level: 5, move: "Growl" },
          { level: 9, move: "Thunder Wave" },
          { level: 9, move: "Thunder Wave" },
          { level: 13, move: "Thunder Shock" },
        ],
        currentMoves: ["Tackle"],
        fromLevel: 5,
        toLevel: 13,
      }).map((entry) => entry.move),
    ).toEqual(["Thunder Wave", "Thunder Shock"]);
  });

  it("ignores ranges that do not increase the level", () => {
    expect(
      getLevelUpMovesBetweenLevels({
        learnset: [{ level: 7, move: "Vine Whip" }],
        currentMoves: [],
        fromLevel: 10,
        toLevel: 10,
      }),
    ).toEqual([]);
  });

  it("merges queued moves without duplicating names already pending", () => {
    expect(
      mergeLevelUpMoveQueues(
        [{ level: 7, move: "Vine Whip" }],
        [
          { level: 9, move: "Leech Seed" },
          { level: 13, move: "Vine Whip" },
        ],
      ).map((entry) => entry.move),
    ).toEqual(["Vine Whip", "Leech Seed"]);
  });
});
