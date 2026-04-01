import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  pathname: "/team",
  editorSegment: null as string | null,
  searchParams: new URLSearchParams("foo=bar"),
  workspaceTab: "builder",
  setWorkspaceTab: vi.fn((value: string) => {
    mocked.workspaceTab = value;
  }),
  routerPush: vi.fn(),
  handleDragEnd: vi.fn(),
  selectMember: vi.fn(),
  editMember: vi.fn(),
  updateMember: vi.fn(),
  removeMember: vi.fn(),
  addPreparedMember: vi.fn(),
  addLibraryMemberToComposition: vi.fn(),
  clearSelection: vi.fn(),
  closeEditor: vi.fn(),
  toggleEncounterCompleted: vi.fn(),
  compareUpdateMember: vi.fn(),
  evolutionSelect: vi.fn(),
  evolutionClose: vi.fn(),
  evolutionConfirm: vi.fn(),
  createEditable: vi.fn((species: string) => ({
    id: `created-${species.toLowerCase()}`,
    species,
    nickname: species,
    locked: false,
    shiny: false,
    level: 5,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocked.routerPush,
  }),
  usePathname: () => mocked.pathname,
  useSearchParams: () => mocked.searchParams,
  useSelectedLayoutSegment: () => mocked.editorSegment,
}));

vi.mock("nuqs", () => ({
  parseAsStringEnum: () => ({
    withDefault: () => "builder",
  }),
  useQueryState: () => [mocked.workspaceTab, mocked.setWorkspaceTab],
}));

vi.mock("@dnd-kit/core", () => ({
  closestCenter: "closest-center",
  DndContext: ({
    children,
    onDragStart,
    onDragCancel,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragStart: (event: any) => void;
    onDragCancel: (event: any) => void;
    onDragEnd: (event: any) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onDragStart({ active: { id: "member-1" } })}>
        dnd-start
      </button>
      <button type="button" onClick={() => onDragCancel({ active: { id: "member-1" } })}>
        dnd-cancel
      </button>
      <button
        type="button"
        onClick={() => onDragEnd({ active: { id: "member-1" }, over: { id: "compare-slot-1" } })}
      >
        dnd-over-compare
      </button>
      <button
        type="button"
        onClick={() => onDragEnd({ active: { id: "member-1" }, over: { id: "team-slot-2" } })}
      >
        dnd-over-team
      </button>
      {children}
    </div>
  ),
  DragOverlay: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    section: ({ children, ...props }: { children?: ReactNode }) => <section {...props}>{children}</section>,
    div: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  PokemonSprite: ({
    species,
    spriteUrl,
  }: {
    species: string;
    spriteUrl?: string | null;
  }) => <div>{`sprite-${species}-${spriteUrl ?? "none"}`}</div>,
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

vi.mock("@/components/team/collection/AddMemberSheet", () => ({
  AddMemberSheet: (props: Record<string, any>) => (
    <div>
      <div>{`add-member-open-${String(props.open)}`}</div>
      <button type="button" onClick={() => props.onClose()}>
        close-add-member
      </button>
      <button type="button" onClick={() => props.onCreateFromDex("Snivy")}>
        create-from-dex
      </button>
      <button type="button" onClick={() => props.onPickLibraryMember("pc-1")}>
        pick-library-member
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/collection/PcBoxSection", () => ({
  PcBoxSection: (props: Record<string, any>) => (
    <div>
      <div>{`pc-members-${props.members.length}`}</div>
      <div>{`pc-pulse-${props.pulseMemberId ?? "none"}`}</div>
      <button type="button" onClick={() => props.onOpenEditor("pc-1")}>
        open-pc-editor
      </button>
      <button type="button" onClick={() => props.onAssignToComposition("pc-1", "comp-2")}>
        assign-pc-composition
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/workspace/BuilderHeader", () => ({
  BuilderHeader: (props: Record<string, any>) => <div>{`builder-header-${props.milestoneId}-${props.localTime}`}</div>,
}));

vi.mock("@/components/team/workspace/RosterSection", () => ({
  RosterSection: (props: Record<string, any>) => (
    <div>
      <div>{`roster-${props.compositionName}-${props.currentTeam.length}`}</div>
      <div>{`editor-open-${String(props.editorOpen)}`}</div>
      <div>{`active-role-${props.activeRoleRecommendation?.primaryRole ?? "none"}`}</div>
      <button type="button" onClick={() => props.onSelectMember("member-1")}>
        roster-select
      </button>
      <button type="button" onClick={() => props.onEditMember("member-1")}>
        roster-edit
      </button>
      <button type="button" onClick={() => props.onToggleMemberLock("member-1")}>
        roster-toggle-lock
      </button>
      <button type="button" onClick={() => props.onRemoveMember("member-1")}>
        roster-remove
      </button>
      <button type="button" onClick={() => props.onAddMember()}>
        roster-add
      </button>
      <button type="button" onClick={() => props.onResetMember("member-1", { level: 50 })}>
        roster-reset
      </button>
      <button type="button" onClick={() => props.onAssignToCompare("member-1")}>
        roster-assign-compare
      </button>
      <button type="button" onClick={() => props.onClearSelection()}>
        roster-clear
      </button>
      <button type="button" onClick={() => props.onCloseEditor()}>
        roster-close-editor
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/workspace/AnalysisSection", () => ({
  AnalysisSection: (props: Record<string, any>) => (
    <div>
      <div>{`analysis-team-size-${props.teamSize}`}</div>
      <button type="button" onClick={() => props.onSendCaptureToIvCalc("Zorua")}>
        analysis-send-ivcalc
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/checkpoints/CopilotSection", () => ({
  CopilotSection: (props: Record<string, any>) => (
    <div>
      <div>{`copilot-team-size-${props.teamSize}`}</div>
      <button type="button" onClick={() => props.onToggleEncounter("route-1")}>
        copilot-toggle-encounter
      </button>
      <button type="button" onClick={() => props.onSendCaptureToIvCalc("Mareep")}>
        copilot-send-ivcalc
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/Modals", () => ({
  EvolutionModal: (props: Record<string, any>) => (
    <div>
      <div>{`evolution-open-${String(props.open)}`}</div>
      <div>{`evolution-current-${props.currentSpecies}`}</div>
      <button type="button" onClick={() => props.onSelectNext("lucario")}>
        evolution-select
      </button>
      <button type="button" onClick={() => props.onClose()}>
        evolution-close
      </button>
      <button type="button" onClick={() => props.onComplete()}>
        evolution-complete
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <div data-value={value} data-onchange={String(Boolean(onValueChange))}>
      <button type="button" onClick={() => onValueChange("copilot")}>
        tabs-onchange
      </button>
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({
    children,
    value,
    className,
  }: {
    children: ReactNode;
    value: string;
    className?: string;
  }) => (
    <button type="button" className={className} onClick={() => mocked.setWorkspaceTab(value)}>
      {children}
    </button>
  ),
  TabsContent: ({
    children,
    value,
  }: {
    children: ReactNode;
    value: string;
  }) => <section data-tab={value}>{children}</section>,
}));

const providerState = vi.hoisted(() => ({
  session: {
    starter: "tepig",
    battleWeather: "rain",
    completedEncounterIds: ["route-1"],
    actions: {
      toggleEncounterCompleted: mocked.toggleEncounterCompleted,
    },
  },
  catalogs: {
    speciesCatalog: [{ name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] }],
    itemCatalog: [{ name: "Leftovers" }],
    encounterCatalog: [{ id: "route-1", label: "Route 1" }],
  },
  team: {
    sensors: [],
    localTime: "night",
    currentTeam: [
      {
        id: "member-1",
        species: "Lucario",
        nickname: "Aura",
        locked: false,
        shiny: false,
        level: 42,
        gender: "male",
        nature: "Jolly",
        ability: "Inner Focus",
        item: "Leftovers",
        moves: ["Aura Sphere"],
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      },
      {
        id: "member-2",
        species: "",
        nickname: "",
        locked: false,
        shiny: false,
        level: 5,
        gender: "unknown",
        nature: "Serious",
        ability: "",
        item: "",
        moves: [],
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      },
    ],
    resolvedTeam: [
      {
        key: "member-1",
        species: "Pignite",
        resolvedTypes: ["Fighting", "Fire"],
        spriteUrl: "/pignite.png",
        animatedSpriteUrl: "/pignite.gif",
      },
    ],
    activeMember: { key: "member-1" },
    evolvingIds: ["member-1"],
    pokemonLibrary: [
      { id: "pc-1", species: "Mareep" },
      { id: "pc-2", species: "Zorua" },
    ],
    pcBoxIds: ["pc-1"],
    compositions: [
      { id: "comp-1", name: "Main" },
      { id: "comp-2", name: "Rain" },
    ],
    activeCompositionId: "comp-1",
    actions: {
      handleDragEnd: mocked.handleDragEnd,
      selectMember: mocked.selectMember,
      editMember: mocked.editMember,
      updateMember: mocked.updateMember,
      removeMember: mocked.removeMember,
      addPreparedMember: mocked.addPreparedMember,
      addLibraryMemberToComposition: mocked.addLibraryMemberToComposition,
      clearSelection: mocked.clearSelection,
      closeEditor: mocked.closeEditor,
    },
  },
  analysis: {
    contextualMilestoneId: "castelia",
    averageStats: { atk: 100 },
    coveredCoverage: [],
    uncoveredCoverage: [],
    defensiveSections: [],
    checkpointRisk: {
      roleSnapshot: {
        members: [{ key: "member-1", primaryRole: "wallbreaker" }],
      },
    },
    captureRecommendations: [],
    nextEncounter: { id: "route-1" },
    moveRecommendations: [],
    supportsContextualSwaps: true,
    swapOpportunities: [],
    sourceCards: [],
  },
  compare: {
    members: [
      { id: "compare-0", species: "" },
      { id: "compare-1", species: "" },
    ],
    actions: {
      updateMember: mocked.compareUpdateMember,
    },
  },
  evolution: {
    state: {
      currentSpecies: "Pignite",
      currentSpriteUrl: "/pignite.png",
      currentAnimatedSpriteUrl: "/pignite.gif",
      nextOptions: [{ species: "Emboar" }],
      selectedNext: "Emboar",
    } as any,
    actions: {
      select: mocked.evolutionSelect,
      close: mocked.evolutionClose,
      confirm: mocked.evolutionConfirm,
    },
  },
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamSession: () => providerState.session,
  useTeamCatalogs: () => providerState.catalogs,
  useTeamRoster: () => providerState.team,
  useTeamAnalysis: () => providerState.analysis,
  useTeamCompare: () => providerState.compare,
  useTeamEvolution: () => providerState.evolution,
}));

vi.mock("@/lib/builder", () => ({
  milestones: [{ id: "castelia", label: "Castelia" }],
  starters: {
    tepig: { stageSpecies: ["Tepig", "Pignite", "Emboar"] },
  },
}));

vi.mock("@/lib/builderStore", () => ({
  createEditable: (species: string) => mocked.createEditable(species),
}));

import { TeamWorkspaceScreen } from "@/components/team/screens/TeamWorkspaceScreen";

describe("TeamWorkspaceScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    mocked.pathname = "/team";
    mocked.editorSegment = null;
    mocked.searchParams = new URLSearchParams("foo=bar");
    mocked.workspaceTab = "builder";
    providerState.team.pcBoxIds = ["pc-1"];
    providerState.team.pokemonLibrary = [
      { id: "pc-1", species: "Mareep" },
      { id: "pc-2", species: "Zorua" },
    ];
    providerState.team.currentTeam = [
      {
        id: "member-1",
        species: "Lucario",
        nickname: "Aura",
        locked: false,
        shiny: false,
        level: 42,
        gender: "male",
        nature: "Jolly",
        ability: "Inner Focus",
        item: "Leftovers",
        moves: ["Aura Sphere"],
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      },
      {
        id: "member-2",
        species: "",
        nickname: "",
        locked: false,
        shiny: false,
        level: 5,
        gender: "unknown",
        nature: "Serious",
        ability: "",
        item: "",
        moves: [],
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      },
    ];
    providerState.team.actions.addPreparedMember = mocked.addPreparedMember;
    providerState.team.actions.removeMember = mocked.removeMember;
    providerState.compare.members = [
      { id: "compare-0", species: "" },
      { id: "compare-1", species: "" },
    ];
    providerState.evolution.state = {
      currentSpecies: "Pignite",
      currentSpriteUrl: "/pignite.png",
      currentAnimatedSpriteUrl: "/pignite.gif",
      nextOptions: [{ species: "Emboar" }],
      selectedNext: "Emboar",
    } as any;
    mocked.addPreparedMember.mockReturnValue({ ok: true, reason: null });
    mocked.removeMember.mockReturnValue(true);
    mocked.addLibraryMemberToComposition.mockReturnValue(true);
  });

  it("renders builder workspace and wires roster, add-member, drag, pc, and evolution actions", async () => {
    const user = userEvent.setup();

    render(<TeamWorkspaceScreen />);

    expect(screen.getByText("builder-header-castelia-night")).toBeTruthy();
    expect(screen.getByText("roster-Main-2")).toBeTruthy();
    expect(screen.getByText("editor-open-false")).toBeTruthy();
    expect(screen.getByText("active-role-wallbreaker")).toBeTruthy();
    expect(screen.getByText("analysis-team-size-1")).toBeTruthy();
    expect(screen.getByText("pc-members-1")).toBeTruthy();
    expect(screen.getByText("pc-pulse-pc-1")).toBeTruthy();
    expect(screen.getByText("evolution-open-true")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "roster-select" }));
    expect(mocked.selectMember).toHaveBeenCalledWith("member-1");

    await user.click(screen.getByRole("button", { name: "roster-edit" }));
    expect(mocked.editMember).toHaveBeenCalledWith("member-1");
    expect(mocked.routerPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/team\/pokemon\/member-1\?foo=bar&editorNonce=\d+$/),
    );

    await user.click(screen.getByRole("button", { name: "roster-toggle-lock" }));
    expect(mocked.updateMember).toHaveBeenCalledWith(
      "member-1",
      expect.any(Function),
    );
    const toggleUpdater = mocked.updateMember.mock.calls.at(-1)?.[1] as (member: any) => any;
    expect(toggleUpdater({ locked: false })).toMatchObject({ locked: true });
    expect(mocked.clearSelection).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "roster-remove" }));
    expect(mocked.removeMember).toHaveBeenCalledWith("member-1");

    await user.click(screen.getByRole("button", { name: "roster-add" }));
    expect(screen.getByText("add-member-open-true")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "create-from-dex" }));
    expect(mocked.createEditable).toHaveBeenCalledWith("Snivy");
    expect(mocked.addPreparedMember).toHaveBeenCalledWith(
      expect.objectContaining({ species: "Snivy" }),
    );
    expect(mocked.routerPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/team\/pokemon\/created-snivy\?foo=bar&editorNonce=\d+$/),
    );

    await user.click(screen.getByRole("button", { name: "pick-library-member" }));
    expect(mocked.addLibraryMemberToComposition).toHaveBeenCalledWith("pc-1");

    await user.click(screen.getByRole("button", { name: "close-add-member" }));
    expect(screen.getByText("add-member-open-false")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "roster-reset" }));
    expect(mocked.updateMember).toHaveBeenCalledWith("member-1", { level: 50 });

    await user.click(screen.getByRole("button", { name: "roster-assign-compare" }));
    expect(mocked.compareUpdateMember).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ species: "Lucario" }),
    );
    expect(mocked.routerPush).toHaveBeenCalledWith("/team/tools?tool=compare");

    await user.click(screen.getByRole("button", { name: "roster-close-editor" }));
    expect(mocked.closeEditor).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "analysis-send-ivcalc" }));
    expect(mocked.routerPush).toHaveBeenCalledWith("/team/tools?tool=ivcalc&species=Zorua");

    await user.click(screen.getByRole("button", { name: "dnd-start" }));
    expect(screen.getByText("Aura")).toBeTruthy();
    expect(screen.getByText("Pignite · Lv 42")).toBeTruthy();
    expect(screen.getByText("sprite-Pignite-/pignite.png")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "dnd-cancel" }));
    expect(screen.queryByText("Pignite · Lv 42")).toBeNull();

    await user.click(screen.getByRole("button", { name: "dnd-over-compare" }));
    expect(mocked.compareUpdateMember).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ species: "Lucario" }),
    );

    await user.click(screen.getByRole("button", { name: "dnd-over-team" }));
    expect(mocked.handleDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({ over: { id: "team-slot-2" } }),
    );

    await user.click(screen.getByRole("button", { name: "open-pc-editor" }));
    expect(mocked.editMember).toHaveBeenCalledWith("pc-1");

    await user.click(screen.getByRole("button", { name: "assign-pc-composition" }));
    expect(mocked.addLibraryMemberToComposition).toHaveBeenCalledWith("pc-1", "comp-2");

    await user.click(screen.getByRole("button", { name: "evolution-select" }));
    expect(mocked.evolutionSelect).toHaveBeenCalledWith("lucario");

    await user.click(screen.getByRole("button", { name: "evolution-close" }));
    expect(mocked.evolutionClose).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "evolution-complete" }));
    expect(mocked.evolutionConfirm).toHaveBeenCalled();
  });

  it("renders copilot workspace and editor-open state from the route", async () => {
    const user = userEvent.setup();
    mocked.workspaceTab = "copilot";
    mocked.pathname = "/team/pokemon/member-1";
    mocked.editorSegment = "member-1";

    render(<TeamWorkspaceScreen />);

    expect(screen.getByText("editor-open-true")).toBeTruthy();
    expect(screen.getByText("copilot-team-size-1")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "copilot-toggle-encounter" }));
    expect(mocked.toggleEncounterCompleted).toHaveBeenCalledWith("route-1");

    await user.click(screen.getByRole("button", { name: "copilot-send-ivcalc" }));
    expect(mocked.routerPush).toHaveBeenCalledWith("/team/tools?tool=ivcalc&species=Mareep");
  });

  it("changes tabs and short-circuits failed add/remove/library actions", async () => {
    const user = userEvent.setup();
    mocked.addPreparedMember.mockReturnValue({ ok: false, reason: "full" });
    mocked.removeMember.mockReturnValue(false);
    mocked.addLibraryMemberToComposition.mockReturnValue(false);

    render(<TeamWorkspaceScreen />);

    await user.click(screen.getByRole("button", { name: "Checkpoint" }));
    expect(mocked.setWorkspaceTab).toHaveBeenCalledWith("copilot");

    await user.click(screen.getByRole("button", { name: "roster-add" }));
    await user.click(screen.getByRole("button", { name: "create-from-dex" }));
    expect(mocked.routerPush).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/team\/pokemon\/created-snivy\?/),
    );

    await user.click(screen.getByRole("button", { name: "pick-library-member" }));
    expect(screen.getByText("add-member-open-true")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "roster-remove" }));
    expect(mocked.removeMember).toHaveBeenCalledWith("member-1");
  });

  it("ignores compare assignment when the dragged roster member does not exist and forwards tab changes", async () => {
    const user = userEvent.setup();
    providerState.team.currentTeam = providerState.team.currentTeam.filter((member) => member.id !== "member-1");

    render(<TeamWorkspaceScreen />);

    await user.click(screen.getByRole("button", { name: "dnd-over-compare" }));
    expect(mocked.compareUpdateMember).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "tabs-onchange" }));
    expect(mocked.setWorkspaceTab).toHaveBeenCalledWith("copilot");
  });

  it("uses fallback composition naming, filters missing pc members, and renders no evolution modal when closed", async () => {
    providerState.team.activeCompositionId = "missing-comp";
    providerState.team.pcBoxIds = ["ghost-pc"];
    providerState.evolution.state = null as any;
    providerState.analysis.checkpointRisk = {
      roleSnapshot: {
        members: [],
      },
    } as any;

    render(<TeamWorkspaceScreen />);

    expect(screen.getByText("roster-Roster del equipo-2")).toBeTruthy();
    expect(screen.getByText("pc-members-0")).toBeTruthy();
    expect(screen.getByText("pc-pulse-ghost-pc")).toBeTruthy();
    expect(screen.queryByText(/evolution-open-/)).toBeNull();
    expect(screen.getByText("active-role-none")).toBeTruthy();
  });

  it("renders drag overlay fallbacks when the dragged member has no nickname or resolved profile", async () => {
    const user = userEvent.setup();
    providerState.team.currentTeam = [
      {
        id: "member-1",
        species: "",
        nickname: "",
        locked: false,
        shiny: false,
        level: 5,
        gender: "unknown",
        nature: "Serious",
        ability: "",
        item: "",
        moves: [],
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      },
    ];
    providerState.team.resolvedTeam = [];

    render(<TeamWorkspaceScreen />);

    await user.click(screen.getByRole("button", { name: "dnd-start" }));

    expect(screen.getByText("Pokemon")).toBeTruthy();
    expect(screen.getByText("slot pendiente · Lv 5")).toBeTruthy();
    expect(screen.getByText("sprite--none")).toBeTruthy();
  });
});
