import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/team/UI", () => ({
  getMoveProfileFit: vi.fn(() => "fit"),
  MoveCueIcons: () => <div>move-cues</div>,
  MovePowerBadge: () => <div>power-badge</div>,
  MoveSlotSurface: ({ move }: { move: { name: string } }) => <div>{move.name}</div>,
}));

vi.mock("@/components/BuilderShared", () => ({
  TypeBadge: ({ type }: { type: string }) => <div>{type}</div>,
}));

import { EditorMovesSection } from "@/components/team/EditorMovesSection";

function createResolved() {
  return {
    moves: [
      {
        name: "Quick Attack",
        type: "Normal",
        damageClass: "physical",
        power: 40,
        adjustedPower: 40,
        accuracy: 100,
        pp: 30,
        hasStab: false,
        description: "Fast strike.",
      },
      {
        name: "Counter",
        type: "Fighting",
        damageClass: "physical",
        power: null,
        adjustedPower: null,
        accuracy: 100,
        pp: 20,
        hasStab: true,
        description: "Returns damage.",
      },
    ],
  };
}

describe("EditorMovesSection", () => {
  it("opens the picker from an empty move slot", async () => {
    const user = userEvent.setup();
    const onSelectMoveIndex = vi.fn();
    const onOpenMoveModal = vi.fn();

    render(
      <EditorMovesSection
        currentMoves={["Quick Attack"]}
        resolved={createResolved() as never}
        selectedMoveIndex={null}
        onSelectMoveIndex={onSelectMoveIndex}
        onOpenMoveModal={onOpenMoveModal}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /empty move slot/i })[0]!);

    expect(onSelectMoveIndex).toHaveBeenCalledWith(null);
    expect(onOpenMoveModal).toHaveBeenCalledWith(null);
  });

  it("shows move details and allows replace/delete for the selected move", async () => {
    const user = userEvent.setup();
    const onSelectMoveIndex = vi.fn();
    const onOpenMoveModal = vi.fn();
    const onRemoveMoveAt = vi.fn();

    render(
      <EditorMovesSection
        currentMoves={["Quick Attack", "Counter"]}
        resolved={createResolved() as never}
        selectedMoveIndex={1}
        onSelectMoveIndex={onSelectMoveIndex}
        onOpenMoveModal={onOpenMoveModal}
        onRemoveMoveAt={onRemoveMoveAt}
        onReorderMove={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Counter")).toHaveLength(2);
    expect(screen.getByText(/returns damage/i)).toBeTruthy();
    expect(screen.getByText(/stab/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /replace/i }));
    expect(onOpenMoveModal).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onRemoveMoveAt).toHaveBeenCalledWith(1);
    expect(onSelectMoveIndex).toHaveBeenCalledWith(null);
  });

  it("toggles selected move details when clicking a move slot", async () => {
    const user = userEvent.setup();
    const onSelectMoveIndex = vi.fn();

    render(
      <EditorMovesSection
        currentMoves={["Quick Attack", "Counter"]}
        resolved={createResolved() as never}
        selectedMoveIndex={1}
        onSelectMoveIndex={onSelectMoveIndex}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
      />,
    );

    await user.click(screen.getAllByText("Counter")[0]!);
    expect(onSelectMoveIndex).toHaveBeenCalledWith(null);
  });
});
