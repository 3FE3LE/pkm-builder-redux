import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  routerBack: vi.fn(),
  routerReplace: vi.fn(),
  closeMovePicker: vi.fn(),
  removeMember: vi.fn(),
  closeEditor: vi.fn(),
  updateMember: vi.fn(),
  openMovePicker: vi.fn(),
  removeMoveAtForMember: vi.fn(),
  reorderMovesForMember: vi.fn(),
  requestEvolutionForMember: vi.fn(),
  setEditorMoveSelection: vi.fn(),
  setMovePickerTab: vi.fn(),
  pickMove: vi.fn(),
  saveMemberToPc: vi.fn(),
}));

const providerState = vi.hoisted(() => ({
  session: {
    battleWeather: "clear",
    evolutionConstraints: { trade: false },
  },
  catalogs: {
    speciesCatalog: [{ name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] }],
    abilityCatalog: [{ name: "Inner Focus" }],
    itemCatalog: [{ name: "Leftovers" }],
  },
  team: {
    currentTeam: [
      {
        id: "member-1",
        species: "Lucario",
        nickname: "Lucario",
        locked: false,
        shiny: false,
        level: 42,
        gender: "unknown",
        nature: "Serious",
        ability: "Inner Focus",
        item: "Leftovers",
        moves: ["Aura Sphere"],
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      },
    ],
    pokemonLibrary: [],
    resolvedTeam: [{ key: "member-1", species: "Lucario" }],
    editorMemberId: "member-1",
    editorResolved: { species: "Lucario" },
    localTime: "night",
    editorMoveSelection: 1,
    actions: {
      removeMember: mocked.removeMember,
      closeEditor: mocked.closeEditor,
      updateMember: mocked.updateMember,
      removeMoveAtForMember: mocked.removeMoveAtForMember,
      reorderMovesForMember: mocked.reorderMovesForMember,
      requestEvolutionForMember: mocked.requestEvolutionForMember,
      setEditorMoveSelection: mocked.setEditorMoveSelection,
      saveMemberToPc: mocked.saveMemberToPc,
    },
  },
  analysis: {
    checkpointRisk: {
      roleSnapshot: {
        members: [{ key: "member-1", primaryRole: "wallbreaker" }],
      },
    },
  },
  movePicker: {
    memberId: "member-1",
    slotIndex: 2,
    tab: "machines",
    activeMember: { moves: ["Aura Sphere"] },
    getSurfaceStyle: vi.fn(),
    actions: {
      close: mocked.closeMovePicker,
      open: mocked.openMovePicker,
      setTab: mocked.setMovePickerTab,
      pickMove: mocked.pickMove,
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mocked.routerBack,
    replace: mocked.routerReplace,
  }),
  useSearchParams: () => new URLSearchParams("editorNonce=77&tab=team"),
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamSession: () => providerState.session,
  useTeamCatalogs: () => providerState.catalogs,
  useTeamRoster: () => providerState.team,
  useTeamAnalysis: () => providerState.analysis,
  useTeamMovePicker: () => providerState.movePicker,
}));

vi.mock("@/lib/domain/evolutionEligibility", () => ({
  buildEvolutionEligibility: vi.fn(() => [{ eligible: true, reasons: [] }]),
}));

vi.mock("@/components/team/EditorSheet", () => ({
  PokemonEditorSheet: (props: Record<string, any>) => (
    <div>
      <div>{`open-${String(props.open)}`}</div>
      <div>{`weather-${props.weather}`}</div>
      <div>{`member-${props.member?.id ?? "none"}`}</div>
      <div>{`resolved-${props.resolved?.species ?? "none"}`}</div>
      <div>{`picker-${props.movePickerMemberId ?? "none"}-${String(props.movePickerSlotIndex)}`}</div>
      <div>{`eligibility-${props.editorEvolutionEligibility.length}`}</div>
      <button type="button" onClick={() => props.onOpenChange(false)}>
        close-sheet
      </button>
      <button type="button" onClick={() => props.onOpenChangeComplete(false)}>
        complete-close
      </button>
      <button
        type="button"
        onClick={() => props.onChange({ ...props.member, level: 50 })}
      >
        change-member
      </button>
      <button type="button" onClick={() => props.onImportToPc({ species: "Imported Mon" })}>
        import-to-pc
      </button>
      <button type="button" onClick={() => props.onOpenMoveModal(3)}>
        open-move-modal
      </button>
      <button type="button" onClick={() => props.onRemoveMoveAt(1)}>
        remove-move
      </button>
      <button type="button" onClick={() => props.onReorderMove(0, 2)}>
        reorder-move
      </button>
      <button type="button" onClick={() => props.onRequestEvolution()}>
        request-evolution
      </button>
      <button type="button" onClick={() => props.onSelectMoveIndex(4)}>
        select-move
      </button>
      <button type="button" onClick={() => props.onMovePickerTabChange("levelUp")}>
        set-picker-tab
      </button>
      <button type="button" onClick={() => props.onCloseMovePicker()}>
        close-picker
      </button>
      <button type="button" onClick={() => props.onPickMove("Flash Cannon")}>
        pick-move
      </button>
    </div>
  ),
}));

import { TeamEditorRoute } from "@/components/team/TeamEditorRoute";

describe("TeamEditorRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerState.team.pokemonLibrary = [];
    providerState.team.editorMemberId = "member-1";
    providerState.movePicker.memberId = "member-1";
  });

  it("returns null when the requested member does not exist", () => {
    const { container } = render(<TeamEditorRoute memberId="missing" closeMode="replace" />);

    expect(container.firstChild).toBeNull();
  });

  it("wires editor actions and replaces the route on close for replace mode", async () => {
    const user = userEvent.setup();

    render(<TeamEditorRoute memberId="member-1" closeMode="replace" />);

    expect(screen.getByText("open-true")).toBeTruthy();
    expect(screen.getByText("weather-clear")).toBeTruthy();
    expect(screen.getByText("resolved-Lucario")).toBeTruthy();
    expect(screen.getByText("picker-member-1-2")).toBeTruthy();
    expect(screen.getByText("eligibility-1")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "change-member" }));
    expect(mocked.updateMember).toHaveBeenCalledWith("member-1", expect.objectContaining({ level: 50 }));

    await user.click(screen.getByRole("button", { name: "import-to-pc" }));
    expect(mocked.saveMemberToPc).toHaveBeenCalledWith(expect.objectContaining({ species: "Imported Mon" }));

    await user.click(screen.getByRole("button", { name: "open-move-modal" }));
    expect(mocked.openMovePicker).toHaveBeenCalledWith("member-1", 3);

    await user.click(screen.getByRole("button", { name: "remove-move" }));
    expect(mocked.removeMoveAtForMember).toHaveBeenCalledWith("member-1", 1);

    await user.click(screen.getByRole("button", { name: "reorder-move" }));
    expect(mocked.reorderMovesForMember).toHaveBeenCalledWith("member-1", 0, 2);

    await user.click(screen.getByRole("button", { name: "request-evolution" }));
    expect(mocked.requestEvolutionForMember).toHaveBeenCalledWith("member-1");

    await user.click(screen.getByRole("button", { name: "select-move" }));
    expect(mocked.setEditorMoveSelection).toHaveBeenCalledWith(4);

    await user.click(screen.getByRole("button", { name: "set-picker-tab" }));
    expect(mocked.setMovePickerTab).toHaveBeenCalledWith("levelUp");

    await user.click(screen.getByRole("button", { name: "close-picker" }));
    expect(mocked.closeMovePicker).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "pick-move" }));
    expect(mocked.pickMove).toHaveBeenCalledWith("Flash Cannon");

    await user.click(screen.getByRole("button", { name: "close-sheet" }));
    expect(mocked.closeEditor).toHaveBeenCalled();
    expect(mocked.removeMember).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "complete-close" }));
    expect(mocked.closeMovePicker).toHaveBeenCalled();
    expect(mocked.routerReplace).toHaveBeenCalledWith("/team?tab=team");
  });

  it("uses back navigation and removes empty placeholder members on close", async () => {
    const user = userEvent.setup();

    providerState.team.pokemonLibrary = [
      {
        ...providerState.team.currentTeam[0],
        id: "library-1",
        species: "   ",
        nickname: "",
      },
    ];
    providerState.movePicker.memberId = "other-member";

    render(<TeamEditorRoute memberId="library-1" closeMode="back" />);

    expect(screen.getByText("open-false")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "close-sheet" }));
    expect(mocked.removeMember).toHaveBeenCalledWith("library-1");
    expect(mocked.closeEditor).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "complete-close" }));
    expect(mocked.routerBack).toHaveBeenCalled();
  });
});
