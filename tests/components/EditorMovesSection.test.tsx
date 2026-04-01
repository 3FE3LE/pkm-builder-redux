import { fireEvent, render, screen } from "@testing-library/react";
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

function createDataTransfer(): DataTransfer {
  return { effectAllowed: "" } as unknown as DataTransfer;
}

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

  it("reorders moves through drag and drop and can select a different slot", () => {
    const onReorderMove = vi.fn();
    const onSelectMoveIndex = vi.fn();

    render(
      <EditorMovesSection
        currentMoves={["Quick Attack", "Counter"]}
        resolved={createResolved() as never}
        selectedMoveIndex={1}
        onSelectMoveIndex={onSelectMoveIndex}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={onReorderMove}
      />,
    );

    const quickAttackSlot = screen.getAllByText("Quick Attack")[0]!.closest("[draggable='true']");
    const counterSlot = screen.getAllByText("Counter")[0]!.closest("[draggable='true']");
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(quickAttackSlot!, { dataTransfer });
    fireEvent.dragOver(counterSlot!);
    fireEvent.drop(counterSlot!);
    expect(onReorderMove).toHaveBeenCalledWith(0, 1);

    fireEvent.click(quickAttackSlot!);
    expect(onSelectMoveIndex).toHaveBeenCalledWith(0);
  });

  it("deletes a dragged selected move from the trash target", () => {
    const onRemoveMoveAt = vi.fn();
    const onSelectMoveIndex = vi.fn();

    render(
      <EditorMovesSection
        currentMoves={["Quick Attack", "Counter"]}
        resolved={createResolved() as never}
        selectedMoveIndex={0}
        onSelectMoveIndex={onSelectMoveIndex}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={onRemoveMoveAt}
        onReorderMove={vi.fn()}
      />,
    );

    const quickAttackSlot = screen.getAllByText("Quick Attack")[0]!.closest("[draggable='true']");
    const trashTarget = screen.getByText(/drop to delete/i).closest("div");
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(quickAttackSlot!, { dataTransfer });
    fireEvent.dragOver(trashTarget!);
    fireEvent.drop(trashTarget!);

    expect(onRemoveMoveAt).toHaveBeenCalledWith(0);
    expect(onSelectMoveIndex).toHaveBeenCalledWith(null);
  });

  it("keeps four visible empty slots and ignores trash drag events when nothing is being dragged", () => {
    render(
      <EditorMovesSection
        currentMoves={[]}
        resolved={{ moves: [] } as never}
        selectedMoveIndex={null}
        onSelectMoveIndex={vi.fn()}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: /empty move slot/i })).toHaveLength(4);

    const trashTarget = screen.getByText(/drop to delete/i).closest("div");
    fireEvent.dragOver(trashTarget!);
  });

  it("resets drop state on drag leave and hides optional move metadata when absent", () => {
    render(
      <EditorMovesSection
        currentMoves={["Mystery Move", "Counter", "Tail Whip", "Growl"]}
        resolved={
          {
            moves: [
              {
                name: "Mystery Move",
                damageClass: "status",
                power: null,
                adjustedPower: null,
                hasStab: false,
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
          } as never
        }
        selectedMoveIndex={0}
        onSelectMoveIndex={vi.fn()}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
      />,
    );

    expect(screen.queryByText("Acc 100%")).toBeNull();
    expect(screen.queryByText(/^PP /)).toBeNull();
    expect(screen.queryByText(/stab/i)).toBeNull();
    expect(screen.queryByText(/fast strike/i)).toBeNull();
    expect(screen.queryByText("Normal")).toBeNull();

    const mysterySlot = screen.getAllByText("Mystery Move")[0]!.closest("[draggable='true']");
    const counterSlot = screen.getAllByText("Counter")[0]!.closest("[draggable='true']");

    fireEvent.dragStart(mysterySlot!, { dataTransfer: createDataTransfer() });
    fireEvent.dragOver(counterSlot!);
    fireEvent.dragLeave(counterSlot!);
    fireEvent.dragEnd(mysterySlot!);
  });

  it("renders no details when the selected move index has no resolved move", () => {
    render(
      <EditorMovesSection
        currentMoves={["Quick Attack"]}
        resolved={{ moves: [] } as never}
        selectedMoveIndex={0}
        onSelectMoveIndex={vi.fn()}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /replace/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^delete$/i })).toBeNull();
  });
});
