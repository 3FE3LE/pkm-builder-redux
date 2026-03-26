import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/team/EditorSections", () => ({
  EditorHeader: () => <div>editor-header</div>,
  EditorProfileSection: ({ updateEditorMember }: { updateEditorMember: (updater: (current: any) => any) => void }) => (
    <button
      type="button"
      onClick={() =>
        updateEditorMember((current) => ({
          ...current,
          species: "Lucario",
          nickname: "Lucario",
        }))
      }
    >
      update-profile
    </button>
  ),
  EditorStatsSection: () => <div>stats-section</div>,
  EditorMovesSection: () => <div>moves-section</div>,
  EditorDefenseSection: () => <div>typing-section</div>,
}));

vi.mock("@/components/team/MovePickerModal", () => ({
  MovePickerModal: () => <div>move-picker-modal</div>,
}));

vi.mock("@/components/ui/Sheet", () => ({
  Sheet: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

import { PokemonEditorSheet } from "@/components/team/EditorSheet";

function createMember() {
  return {
    id: "1",
    species: "Riolu",
    nickname: "Riolu",
    locked: false,
    shiny: false,
    level: 10,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: ["Quick Attack"],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  };
}

describe("PokemonEditorSheet", () => {
  it("renders nothing interactive when there is no member", () => {
    render(
      <PokemonEditorSheet
        open
        weather="clear"
        speciesCatalog={[]}
        abilityCatalog={[]}
        itemCatalog={[]}
        onOpenChange={vi.fn()}
        onChange={vi.fn()}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
        onRequestEvolution={vi.fn()}
        editorEvolutionEligibility={[]}
        selectedMoveIndex={null}
        onSelectMoveIndex={vi.fn()}
        movePickerMemberId={null}
        movePickerSlotIndex={null}
        movePickerTab="levelUp"
        currentMoves={[]}
        onMovePickerTabChange={vi.fn()}
        onCloseMovePicker={vi.fn()}
        onPickMove={vi.fn()}
        getMoveSurfaceStyle={vi.fn()}
      />,
    );

    expect(screen.queryByText("editor-header")).toBeNull();
  });

  it("switches tabs, wires updates, and renders the picker only for the active member", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <PokemonEditorSheet
        member={createMember() as never}
        open
        resolved={{ species: "Riolu" } as never}
        weather="clear"
        speciesCatalog={[]}
        abilityCatalog={[]}
        itemCatalog={[]}
        onOpenChange={vi.fn()}
        onChange={onChange}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
        onRequestEvolution={vi.fn()}
        editorEvolutionEligibility={[{ eligible: true, reasons: [] } as never]}
        selectedMoveIndex={null}
        onSelectMoveIndex={vi.fn()}
        movePickerMemberId="1"
        movePickerSlotIndex={null}
        movePickerTab="levelUp"
        movePickerActiveMember={{ moves: [] } as never}
        currentMoves={["Quick Attack"]}
        onMovePickerTabChange={vi.fn()}
        onCloseMovePicker={vi.fn()}
        onPickMove={vi.fn()}
        getMoveSurfaceStyle={vi.fn()}
      />,
    );

    expect(screen.getByText("stats-section")).toBeTruthy();
    expect(screen.getByText("move-picker-modal")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: /moves/i }));
    expect(screen.getByText("moves-section")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: /typing/i }));
    expect(screen.getByText("typing-section")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /update-profile/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ species: "Lucario" }));
  });
});
