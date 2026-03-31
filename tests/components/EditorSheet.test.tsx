import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/team/EditorSections", () => ({
  EditorHeader: ({
    hasEvolution,
    evolutionBlockReason,
  }: {
    hasEvolution: boolean;
    evolutionBlockReason?: string;
  }) => <div>{`editor-header-${hasEvolution ? "evo" : evolutionBlockReason ?? "none"}`}</div>,
  EditorProfileSection: ({ updateEditorMember }: { updateEditorMember: (updater: (current: any) => any) => void }) => (
    <>
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
      <button
        type="button"
        onClick={() =>
          updateEditorMember((current) => ({
            ...current,
            level: 999,
          }))
        }
      >
        update-invalid
      </button>
    </>
  ),
  EditorStatsSection: ({ hasEvolution }: { hasEvolution: boolean }) => (
    <div>{`stats-section-${hasEvolution ? "evo" : "no-evo"}`}</div>
  ),
  EditorMovesSection: () => <div>moves-section</div>,
  EditorDefenseSection: () => <div>typing-section</div>,
}));

vi.mock("@/components/team/MovePickerModal", () => ({
  MovePickerModal: () => <div>move-picker-modal</div>,
}));

vi.mock("@/components/team/PokemonTransferPanel", () => ({
  PokemonTransferPanel: ({
    member,
    onImportToPc,
  }: {
    member?: { id: string };
    onImportToPc: (member: { species: string }) => boolean;
  }) => (
    <div>
      <div>{`transfer-panel-${member?.id ?? "none"}`}</div>
      <button type="button" onClick={() => onImportToPc({ species: "Imported Mon" } as never)}>
        import-editor-pc
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/Sheet", () => ({
  Sheet: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  SheetContent: ({
    children,
    onRequestClose,
  }: {
    children?: ReactNode;
    onRequestClose?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onRequestClose}>
        request-close
      </button>
      {children}
    </div>
  ),
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
        onImportToPc={vi.fn()}
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
    const onOpenChange = vi.fn();
    const onImportToPc = vi.fn(() => true);

    render(
      <PokemonEditorSheet
        member={createMember() as never}
        open
        resolved={{ species: "Riolu", nextEvolutions: ["Lucario"] } as never}
        weather="clear"
        speciesCatalog={[]}
        abilityCatalog={[]}
        itemCatalog={[]}
        onOpenChange={onOpenChange}
        onChange={onChange}
        onImportToPc={onImportToPc}
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

    expect(screen.getByText("editor-header-evo")).toBeTruthy();
    expect(screen.getByText("stats-section-evo")).toBeTruthy();
    expect(screen.getByText("move-picker-modal")).toBeTruthy();
    expect(screen.getByText("Riolu")).toBeTruthy();
    expect(screen.getByText("transfer-panel-1")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: /moves/i }));
    expect(screen.getByText("moves-section")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: /typing/i }));
    expect(screen.getByText("typing-section")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /update-profile/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ species: "Lucario" }));

    await user.click(screen.getByRole("button", { name: /update-invalid/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ level: 999 }));

    await user.click(screen.getByRole("button", { name: /import-editor-pc/i }));
    expect(onImportToPc).toHaveBeenCalledWith(expect.objectContaining({ species: "Imported Mon" }));

    await user.click(screen.getByRole("button", { name: /request-close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("exposes a blocked evolution reason and falls back the title when nickname/species are missing", () => {
    render(
      <PokemonEditorSheet
        member={{
          ...createMember(),
          species: "",
          nickname: "   ",
        } as never}
        open
        weather="clear"
        speciesCatalog={[]}
        abilityCatalog={[]}
        itemCatalog={[]}
        onOpenChange={vi.fn()}
        onChange={vi.fn()}
        onImportToPc={vi.fn()}
        onOpenMoveModal={vi.fn()}
        onRemoveMoveAt={vi.fn()}
        onReorderMove={vi.fn()}
        onRequestEvolution={vi.fn()}
        editorEvolutionEligibility={[
          { eligible: false, reasons: ["Need stone", "Night only", "Ignored extra"] } as never,
        ]}
        selectedMoveIndex={null}
        onSelectMoveIndex={vi.fn()}
        movePickerMemberId="other-member"
        movePickerSlotIndex={null}
        movePickerTab="levelUp"
        movePickerActiveMember={{ moves: [] } as never}
        currentMoves={[]}
        onMovePickerTabChange={vi.fn()}
        onCloseMovePicker={vi.fn()}
        onPickMove={vi.fn()}
        getMoveSurfaceStyle={vi.fn()}
      />,
    );

    expect(screen.getByText("editor-header-Need stone · Night only")).toBeTruthy();
    expect(screen.getByText("stats-section-no-evo")).toBeTruthy();
    expect(screen.getByText("Pokemon pendiente")).toBeTruthy();
    expect(screen.queryByText("move-picker-modal")).toBeNull();
  });
});
