import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  isOver: false,
  setNodeRef: vi.fn(),
  createEditable: vi.fn((species: string) => ({
    id: `default-${species.toLowerCase()}`,
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
    ivs: { hp: 1, atk: 2, def: 3, spa: 4, spd: 5, spe: 6 },
    evs: { hp: 11, atk: 12, def: 13, spa: 14, spd: 15, spe: 16 },
  })),
  buildCompareState: vi.fn((member: { species?: string }, _resolved: unknown, _abilities: unknown, heldItems: { name: string }[], weather: string) => ({
    species: member.species ?? "",
    heldItems: heldItems.map((item) => item.name),
    weather,
  })),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      animate: _animate,
      transition: _transition,
      initial: _initial,
      ...props
    }: {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/team/workspace/AnalysisPanels", () => ({
  TeamAverageStatsPanel: ({ averageStats }: { averageStats: unknown }) => <div>{`avg-${averageStats ? "yes" : "no"}`}</div>,
  TeamRosterReadingPanel: ({ checkpointRisk }: { checkpointRisk: { summary?: string } }) => <div>{`reading-${checkpointRisk.summary ?? "none"}`}</div>,
  CoveragePanel: ({ coveredCoverage, uncoveredCoverage }: { coveredCoverage: unknown[]; uncoveredCoverage: unknown[] }) => (
    <div>{`coverage-${coveredCoverage.length}-${uncoveredCoverage.length}`}</div>
  ),
  DefensiveThreatsPanel: ({ defensiveSections }: { defensiveSections: unknown[] }) => <div>{`defense-${defensiveSections.length}`}</div>,
}));

vi.mock("@/components/team/checkpoints", () => ({
  IntelligencePanel: ({ teamSize }: { teamSize: number }) => <div>{`intel-${teamSize}`}</div>,
  MapPanel: ({ activeMember }: { activeMember?: { species?: string } }) => <div>{`map-${activeMember?.species ?? "none"}`}</div>,
  RecommendationsPanel: (props: Record<string, any>) => (
    <div>
      <div>{`captures-${props.teamSize}-${String(props.showCaptures ?? true)}-${String(props.showSwaps ?? true)}`}</div>
      <button type="button" onClick={() => props.onSendToIvCalc?.("Mareep")}>
        send-ivcalc
      </button>
    </div>
  ),
  PathPanel: ({ variant, maxHeight }: { variant?: string; maxHeight?: number }) => (
    <div>{`runpath-${variant ?? "default"}-${maxHeight ?? "none"}`}</div>
  ),
}));

vi.mock("@/components/team/tools/compare/panels", () => ({
  buildState: (
    member: { species?: string },
    resolved: unknown,
    abilities: unknown,
    heldItems: { name: string }[],
    weather: string,
  ) => mocked.buildCompareState(member, resolved, abilities, heldItems, weather),
  MemberPanel: (props: Record<string, any>) => (
    <div>{`member-panel-${props.index}-${props.state.species || "empty"}-${props.heldItemCatalog.length}`}</div>
  ),
  Summary: ({ left, right }: { left: { species?: string }; right: { species?: string } }) => (
    <div>{`summary-${left.species || "empty"}-${right.species || "empty"}`}</div>
  ),
}));

vi.mock("@/components/team/shared/RoleAxes", () => ({
  RoleAxesCard: ({ role }: { role?: { primaryRole?: string } }) => <div>{`role-axes-${role?.primaryRole ?? "none"}`}</div>,
}));

vi.mock("@/components/BuilderShared", () => ({
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

vi.mock("@/components/team/workspace/roster/SortableMemberCard", () => ({
  SortableMemberCard: ({
    member,
    onSelect,
    isSelected,
  }: {
    member: { nickname?: string; species?: string };
    onSelect: () => void;
    isSelected?: boolean;
  }) => (
    <button type="button" onClick={onSelect}>
      {`sortable-${member.nickname || member.species}-${isSelected ? "selected" : "idle"}`}
    </button>
  ),
}));

vi.mock("@/components/ui/Switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
    "aria-label": ariaLabel,
  }: {
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
    "aria-label"?: string;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={() => onCheckedChange?.(!checked)}>
      {`${ariaLabel}-${checked ? "on" : "off"}`}
    </button>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/lib/builderStore", () => ({
  createEditable: (species: string) => mocked.createEditable(species),
}));

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({
    isOver: mocked.isOver,
    setNodeRef: mocked.setNodeRef,
  }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  rectSortingStrategy: "rect",
}));

import { BuilderHeader } from "@/components/team/workspace/BuilderHeader";
import { CopilotSection } from "@/components/team/checkpoints/CopilotSection";
import { WorkspaceSection } from "@/components/team/tools/compare/Section";
import { PreferencesSection } from "@/components/team/settings/PreferencesSection";
import { AnalysisSection } from "@/components/team/workspace/AnalysisSection";
import { RosterSection } from "@/components/team/workspace/RosterSection";

describe("Team Sections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.isOver = false;
    (globalThis as any).ResizeObserver = class {
      private callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe() {
        this.callback(
          [{ contentRect: { height: 480 } } as ResizeObserverEntry],
          this as unknown as ResizeObserver,
        );
      }

      disconnect() {}
      unobserve() {}
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        category: "Aura Pokemon",
        height: 1.2,
        weight: 54.0,
        flavorText: "Detecta las auras de sus rivales.",
      }),
    }) as never;
  });

  it("renders the builder header for day and night phases", () => {
    const { rerender } = render(
      <BuilderHeader
        milestoneId="castelia"
        milestones={[]}
        localTime={{ phase: "day", period: "day", ready: true, label: "13:45" } as any}
      />,
    );

    expect(screen.getByText("Day Time")).toBeTruthy();
    expect(screen.getByText("13:45")).toBeTruthy();

    rerender(
      <BuilderHeader
        milestoneId="castelia"
        milestones={[]}
        localTime={{ phase: "night", period: "night", ready: false, label: "21:10" } as any}
      />,
    );

    expect(screen.getByText("Night Time")).toBeTruthy();
    expect(screen.getByText("SYNC...")).toBeTruthy();
  });

  it("composes the analysis section panels and forwards iv calc action", async () => {
    const user = userEvent.setup();
    const onSendCaptureToIvCalc = vi.fn();

    render(
      <AnalysisSection
        averageStats={{ atk: 100 } as any}
        coveredCoverage={[{ defenseType: "Grass", bucket: "x0.5" }]}
        uncoveredCoverage={[{ defenseType: "Steel", bucket: "x2" }]}
        defensiveSections={[{ title: "Weak" }] as any}
        checkpointRisk={{ summary: "stable" } as any}
        teamSize={4}
        captureRecommendations={[{ species: "Mareep" }] as any}
        nextEncounter={{ id: "route-1" } as any}
        speciesCatalog={[{ name: "Mareep", dex: 179 }]}
        onSendCaptureToIvCalc={onSendCaptureToIvCalc}
      />,
    );

    expect(screen.getByText("avg-yes")).toBeTruthy();
    expect(screen.getByText("reading-stable")).toBeTruthy();
    expect(screen.getByText("captures-4-true-false")).toBeTruthy();
    expect(screen.getByText("coverage-1-1")).toBeTruthy();
    expect(screen.getByText("defense-1")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "send-ivcalc" }));
    expect(onSendCaptureToIvCalc).toHaveBeenCalledWith("Mareep");
  });

  it("renders compare workspace with filtered held items and clear controls", async () => {
    const user = userEvent.setup();
    const onClearMember = vi.fn();

    render(
      <WorkspaceSection
        members={[
          { species: "Lucario" } as any,
          { species: "" } as any,
        ]}
        resolvedMembers={[{ species: "Lucario" } as any, undefined]}
        speciesCatalog={[]}
        abilityCatalog={[{ name: "Inner Focus" }]}
        itemCatalog={[
          { name: "Leftovers", category: "Held Item" },
          { name: "Potion", category: "Medicine" },
        ]}
        battleWeather="rain"
        dropPulse={{ slot: 1, token: 7 }}
        onChangeMember={vi.fn()}
        onClearMember={onClearMember}
      />,
    );

    expect(screen.getAllByText("member-panel-0-Lucario-1").length).toBe(2);
    expect(screen.getAllByText("member-panel-1-empty-1").length).toBe(2);
    expect(screen.getAllByText("summary-Lucario-empty").length).toBe(2);
    expect(mocked.buildCompareState).toHaveBeenCalledWith(
      expect.objectContaining({ species: "Lucario" }),
      expect.anything(),
      expect.anything(),
      [{ name: "Leftovers", category: "Held Item" }],
      "rain",
    );
    expect(screen.getAllByText("Arrastra un Pokemon del roster aqui").length).toBe(2);

    await user.click(screen.getAllByRole("button", { name: "x" })[0] as HTMLElement);
    expect(onClearMember).toHaveBeenCalledWith(0);
  });

  it("shows hot compare drop zones and desktop clear action labels", async () => {
    const user = userEvent.setup();
    const onClearMember = vi.fn();
    mocked.isOver = true;

    render(
      <WorkspaceSection
        members={[
          { species: "" } as any,
          { species: "Lucario" } as any,
        ]}
        resolvedMembers={[undefined, { species: "Lucario" } as any]}
        speciesCatalog={[]}
        abilityCatalog={[]}
        itemCatalog={[{ name: "Leftovers", category: "Held Item" }]}
        battleWeather="clear"
        dropPulse={{ slot: 0, token: 3 }}
        onChangeMember={vi.fn()}
        onClearMember={onClearMember}
      />,
    );

    expect(screen.getAllByText("Suelta para comparar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("limpiar").length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: "limpiar" })[0] as HTMLElement);
    expect(onClearMember).toHaveBeenCalledWith(1);
  });

  it("renders preferences, toggles switches, changes weather and resets persisted data", async () => {
    const user = userEvent.setup();
    const onToggleEvolutionConstraint = vi.fn();
    const onToggleRecommendationFilter = vi.fn();
    const onSetBattleWeather = vi.fn();
    const onResetRun = vi.fn();

    render(
      <PreferencesSection
        evolutionConstraints={{ level: true, gender: false, timeOfDay: true }}
        recommendationFilters={{
          excludeLegendaries: true,
          excludePseudoLegendaries: false,
          excludeUniquePokemon: true,
          excludeOtherStarters: false,
          excludeExactTypeDuplicates: true,
        }}
        battleWeather="sun"
        theme="dark"
        onToggleEvolutionConstraint={onToggleEvolutionConstraint}
        onToggleRecommendationFilter={onToggleRecommendationFilter}
        onSetBattleWeather={onSetBattleWeather}
        onSetTheme={vi.fn()}
        onResetRun={onResetRun}
      />,
    );

    expect(screen.getByText("Preferences")).toBeTruthy();
    expect(screen.getByText("Tema de la interfaz")).toBeTruthy();
    expect(screen.getByText("Clima de combate")).toBeTruthy();
    expect(screen.getByText("Filtros de recomendaciones")).toBeTruthy();
    expect(screen.getByText("Reglas de evolucion")).toBeTruthy();
    expect(screen.getByText("Datos persistidos")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Neutral/i }));
    expect(onSetBattleWeather).toHaveBeenCalledWith("clear");

    await user.click(screen.getByRole("button", { name: "Excluir legendarios" }));
    expect(onToggleRecommendationFilter).toHaveBeenCalledWith("excludeLegendaries", false);

    await user.click(screen.getByRole("button", { name: "Nivel" }));
    expect(onToggleEvolutionConstraint).toHaveBeenCalledWith("level", false);

    await user.click(screen.getByRole("button", { name: "Limpiar datos persistidos" }));
    expect(onResetRun).toHaveBeenCalled();
  });

  it("renders checkpoint copilot with mobile and desktop run path plus forwarded iv calc action", async () => {
    const user = userEvent.setup();
    const onToggleEncounter = vi.fn();
    const onSendCaptureToIvCalc = vi.fn();

    render(
      <CopilotSection
        activeMember={{ species: "Lucario" } as any}
        teamSize={4}
        milestoneId="castelia"
        checkpointRisk={{ summary: "stable" } as any}
        supportsContextualSwaps
        nextEncounter={{ id: "route-4" } as any}
        swapOpportunities={[{ species: "Mareep" }] as any}
        captureRecommendations={[{ species: "Sandile" }] as any}
        moveRecommendations={[] as any}
        sourceCards={[{ id: "route-4" }] as any}
        encounterCatalog={[{ id: "route-4" }] as any}
        completedEncounterIds={["route-1"]}
        speciesCatalog={[{ name: "Lucario", dex: 448 }]}
        itemCatalog={[{ name: "Leftovers", effect: "heal" }]}
        starterKey="snivy"
        onToggleEncounter={onToggleEncounter}
        onSendCaptureToIvCalc={onSendCaptureToIvCalc}
      />,
    );

    expect(screen.getByText("runpath-mobile-summary-none")).toBeTruthy();
    expect(screen.getByText("runpath-default-480")).toBeTruthy();
    expect(screen.getByText("intel-4")).toBeTruthy();
    expect(screen.getByText("map-Lucario")).toBeTruthy();
    expect(screen.getByText("captures-4-false-true")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "send-ivcalc" }));
    expect(onSendCaptureToIvCalc).toHaveBeenCalledWith("Mareep");
    expect(onToggleEncounter).not.toHaveBeenCalled();
  });

  it("renders the roster section, opens slot details, resets fields and sends a member to pc", async () => {
    const user = userEvent.setup();
    const onSelectMember = vi.fn();
    const onToggleMemberLock = vi.fn();
    const onRemoveMember = vi.fn();
    const onReleaseMember = vi.fn();
    const onAddMember = vi.fn();
    const onResetMember = vi.fn();
    const onAssignToCompare = vi.fn();
    const onClearSelection = vi.fn();
    const onCloseEditor = vi.fn();

    render(
      <RosterSection
        compositionName="Main"
        currentTeam={[
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
            moves: ["Aura Sphere", "Flash Cannon"],
            ivs: { hp: 10, atk: 11, def: 12, spa: 13, spd: 14, spe: 15 },
            evs: { hp: 20, atk: 21, def: 22, spa: 23, spd: 24, spe: 25 },
          },
          {
            id: "member-2",
            species: "Mareep",
            nickname: "Wool",
            locked: false,
            shiny: false,
            level: 18,
            gender: "female",
            nature: "Calm",
            ability: "Static",
            item: "",
            moves: ["Thunder Wave"],
            ivs: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
            evs: { hp: 2, atk: 2, def: 2, spa: 2, spd: 2, spe: 2 },
          },
        ] as any}
        resolvedTeam={[
          {
            key: "member-1",
            species: "Lucario",
            resolvedTypes: ["Fighting", "Steel"],
            moves: [
              { name: "Aura Sphere", type: "Fighting", damageClass: "special", adjustedPower: 80 },
              { name: "Flash Cannon", type: "Steel", damageClass: "special", adjustedPower: 80 },
            ],
          },
          {
            key: "member-2",
            species: "Mareep",
            resolvedTypes: ["Electric"],
            moves: [{ name: "Thunder Wave", type: "Electric", damageClass: "status", adjustedPower: 0 }],
          },
        ] as any}
        roleSnapshot={{
          members: [{ key: "member-1", primaryRole: "wallbreaker" }],
        } as any}
        battleWeather="rain"
        evolvingIds={{ "member-1": true }}
        activeMemberKey="member-1"
        activeRoleRecommendation={{ primaryRole: "wallbreaker" } as any}
        moveRecommendations={[
          { source: "TM", move: "Flash Cannon", type: "Steel", reasons: ["coverage", "stab"] },
          { source: "Tutor", move: "Vacuum Wave", type: "Fighting", reasons: [] },
        ] as any}
        starterSpeciesLine={["Riolu", "Lucario"]}
        editorOpen={false}
        onSelectMember={onSelectMember}
        onToggleMemberLock={onToggleMemberLock}
        onRemoveMember={onRemoveMember}
        onReleaseMember={onReleaseMember}
        onAddMember={onAddMember}
        onResetMember={onResetMember}
        onAssignToCompare={onAssignToCompare}
        onClearSelection={onClearSelection}
        onCloseEditor={onCloseEditor}
      />,
    );

    expect(screen.getByText("Main")).toBeTruthy();
    expect(screen.getAllByText("sortable-Aura-selected").length).toBe(1);
    expect(screen.getAllByText("sortable-Wool-idle").length).toBe(1);

    await user.click(screen.getAllByText("sortable-Wool-idle")[0]);
    expect(onSelectMember).toHaveBeenCalledWith("member-2");

    await user.click(screen.getAllByRole("button", { name: "Mostrar info del slot seleccionado" })[0] as HTMLElement);
    expect((await screen.findAllByText("Info del slot")).length).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/dex?pokemon=Lucario", expect.anything());
    await waitFor(() => {
      expect(screen.getAllByText("Dex Notes").length).toBe(1);
    });
    expect(screen.getAllByText("Aura Pokemon").length).toBe(1);
    expect(screen.getAllByText("1.2 m").length).toBe(1);
    expect(screen.getAllByText("54.0 kg").length).toBe(1);
    expect(screen.getAllByText("Starter Lens").length).toBe(1);
    expect(screen.getAllByText("Mejoras del slot").length).toBe(1);
    expect(screen.getAllByText("Flash Cannon").length).toBe(1);
    expect(screen.getAllByText("coverage · stab").length).toBe(1);
    expect(screen.getAllByText("role-axes-wallbreaker").length).toBe(1);

    await user.click(screen.getAllByRole("button", { name: "Cerrar info del slot" })[0] as HTMLElement);
    await waitFor(() => {
      expect(screen.queryByText("Info del slot")).toBeNull();
    });

    expect(
      screen.getAllByRole("link", { name: "Editar slot seleccionado" })[0]?.getAttribute("href"),
    ).toBe("/team/pokemon/member-1");

    await user.click(screen.getAllByRole("button", { name: "Bloquear slot seleccionado" })[0] as HTMLElement);
    expect(onToggleMemberLock).toHaveBeenCalledWith("member-1");

    await user.click(screen.getAllByRole("button", { name: "Comparar slot seleccionado" })[0] as HTMLElement);
    expect(onAssignToCompare).toHaveBeenCalledWith("member-1");

    await user.click(screen.getAllByRole("button", { name: "Resetear slot seleccionado" })[0] as HTMLElement);
    expect(screen.getByText("Reset del slot")).toBeTruthy();
    await user.click(screen.getByLabelText("Nickname"));
    await user.click(screen.getByRole("button", { name: "Aplicar reset" }));
    expect(mocked.createEditable).toHaveBeenCalledWith("Lucario");
    expect(onResetMember).toHaveBeenCalledWith(
      "member-1",
      expect.objectContaining({
        nickname: "Aura",
        level: 5,
        gender: "unknown",
        nature: "Serious",
        ability: "",
        item: "",
        moves: [],
        ivs: { hp: 1, atk: 2, def: 3, spa: 4, spd: 5, spe: 6 },
        evs: { hp: 11, atk: 12, def: 13, spa: 14, spd: 15, spe: 16 },
      }),
    );

    await user.click(screen.getAllByRole("button", { name: "Mandar Pokemon seleccionado a caja" })[0] as HTMLElement);
    expect(screen.getAllByText("Mandar a caja").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: "Liberar" })).toBeTruthy();
    const confirmRemoveButtons = screen.getAllByRole("button", { name: "Mandar a caja" });
    await user.click(confirmRemoveButtons[confirmRemoveButtons.length - 1] as HTMLElement);
    expect(onRemoveMember).toHaveBeenCalledWith("member-1");
    expect(onClearSelection).toHaveBeenCalled();

    await user.click(screen.getAllByRole("button").find((button) => button.textContent === "") as HTMLElement);
    expect(onAddMember).toHaveBeenCalled();
  });

  it("uses the close dock action on mobile when the editor is open", async () => {
    const user = userEvent.setup();
    const onCloseEditor = vi.fn();
    const onRemoveMember = vi.fn();

    render(
      <RosterSection
        compositionName="Main"
        currentTeam={[
          {
            id: "member-1",
            species: "Lucario",
            nickname: "Aura",
            locked: true,
            shiny: false,
            level: 42,
            gender: "male",
            nature: "Jolly",
            ability: "Inner Focus",
            item: "",
            moves: [],
            ivs: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
            evs: { hp: 2, atk: 2, def: 2, spa: 2, spd: 2, spe: 2 },
          },
        ] as any}
        resolvedTeam={[
          {
            key: "member-1",
            species: "Lucario",
            resolvedTypes: ["Fighting", "Steel"],
            moves: [],
          },
        ] as any}
        roleSnapshot={{ members: [] } as any}
        battleWeather="clear"
        evolvingIds={{}}
        activeMemberKey="member-1"
        activeRoleRecommendation={undefined}
        moveRecommendations={[] as any}
        starterSpeciesLine={[]}
        editorOpen
        onSelectMember={vi.fn()}
        onToggleMemberLock={vi.fn()}
        onRemoveMember={onRemoveMember}
        onReleaseMember={vi.fn()}
        onAddMember={vi.fn()}
        onResetMember={vi.fn()}
        onAssignToCompare={vi.fn()}
        onClearSelection={vi.fn()}
        onCloseEditor={onCloseEditor}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Volver al team" }));
    expect(onCloseEditor).toHaveBeenCalled();
    expect(onRemoveMember).not.toHaveBeenCalled();
  });

  it("falls back to default roster name and supports partial reset that preserves unchecked fields", async () => {
    const user = userEvent.setup();
    const onResetMember = vi.fn();

    render(
      <RosterSection
        compositionName="   "
        currentTeam={[
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
            ivs: { hp: 10, atk: 11, def: 12, spa: 13, spd: 14, spe: 15 },
            evs: { hp: 20, atk: 21, def: 22, spa: 23, spd: 24, spe: 25 },
          },
        ] as any}
        resolvedTeam={[
          {
            key: "member-1",
            species: "Lucario",
            resolvedTypes: ["Fighting", "Steel"],
            moves: [],
          },
        ] as any}
        roleSnapshot={{ members: [] } as any}
        battleWeather="clear"
        evolvingIds={{}}
        activeMemberKey="member-1"
        activeRoleRecommendation={undefined}
        moveRecommendations={[] as any}
        starterSpeciesLine={[]}
        editorOpen={false}
        onSelectMember={vi.fn()}
        onToggleMemberLock={vi.fn()}
        onRemoveMember={vi.fn()}
        onReleaseMember={vi.fn()}
        onAddMember={vi.fn()}
        onResetMember={onResetMember}
        onAssignToCompare={vi.fn()}
        onClearSelection={vi.fn()}
        onCloseEditor={vi.fn()}
      />,
    );

    expect(screen.getByText("Roster del equipo")).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: "Resetear slot seleccionado" })[0] as HTMLElement);
    await user.click(screen.getByLabelText("Nivel"));
    await user.click(screen.getByLabelText("Genero"));
    await user.click(screen.getByLabelText("Naturaleza"));
    await user.click(screen.getByLabelText("Habilidad"));
    await user.click(screen.getByLabelText("Objeto"));
    await user.click(screen.getByLabelText("Moveset"));
    await user.click(screen.getByLabelText("IVs"));
    await user.click(screen.getByLabelText("EVs"));
    await user.click(screen.getByRole("button", { name: "Aplicar reset" }));

    expect(onResetMember).toHaveBeenCalledWith(
      "member-1",
      expect.objectContaining({
        nickname: "Lucario",
        level: 42,
        gender: "male",
        nature: "Jolly",
        ability: "Inner Focus",
        item: "Leftovers",
        moves: ["Aura Sphere"],
        ivs: { hp: 10, atk: 11, def: 12, spa: 13, spd: 14, spe: 15 },
        evs: { hp: 20, atk: 21, def: 22, spa: 23, spd: 24, spe: 25 },
      }),
    );
  });

  it("allows canceling reset and send-to-pc modals without firing callbacks", async () => {
    const user = userEvent.setup();
    const onResetMember = vi.fn();
    const onRemoveMember = vi.fn();
    const onReleaseMember = vi.fn();
    const onClearSelection = vi.fn();

    render(
      <RosterSection
        compositionName="Cancel"
        currentTeam={[
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
            ivs: { hp: 10, atk: 11, def: 12, spa: 13, spd: 14, spe: 15 },
            evs: { hp: 20, atk: 21, def: 22, spa: 23, spd: 24, spe: 25 },
          },
        ] as any}
        resolvedTeam={[
          {
            key: "member-1",
            species: "Lucario",
            resolvedTypes: ["Fighting", "Steel"],
            moves: [],
          },
        ] as any}
        roleSnapshot={{ members: [] } as any}
        battleWeather="clear"
        evolvingIds={{}}
        activeMemberKey="member-1"
        activeRoleRecommendation={undefined}
        moveRecommendations={[] as any}
        starterSpeciesLine={[]}
        editorOpen={false}
        onSelectMember={vi.fn()}
        onToggleMemberLock={vi.fn()}
        onRemoveMember={onRemoveMember}
        onReleaseMember={onReleaseMember}
        onAddMember={vi.fn()}
        onResetMember={onResetMember}
        onAssignToCompare={vi.fn()}
        onClearSelection={onClearSelection}
        onCloseEditor={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Resetear slot seleccionado" })[0] as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => {
      expect(screen.queryByText("Reset del slot")).toBeNull();
    });
    expect(onResetMember).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole("button", { name: "Mandar Pokemon seleccionado a caja" })[0] as HTMLElement);
    const cancelButtons = screen.getAllByRole("button", { name: "Cancelar" });
    await user.click(cancelButtons[cancelButtons.length - 1] as HTMLElement);
    await waitFor(() => {
      expect(screen.queryByText("Mandar a caja")).toBeNull();
    });
    expect(onRemoveMember).not.toHaveBeenCalled();
    expect(onReleaseMember).not.toHaveBeenCalled();
    expect(onClearSelection).not.toHaveBeenCalled();
  });

  it("renders insight fallback states when dex details fail and there are no move or lens recommendations", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as never;

    render(
      <RosterSection
        compositionName="Fallbacks"
        currentTeam={[
          {
            id: "member-1",
            species: "Mareep",
            nickname: "",
            locked: false,
            shiny: false,
            level: 18,
            gender: "female",
            nature: "Calm",
            ability: "Static",
            item: "",
            moves: ["Thunder Wave"],
            ivs: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
            evs: { hp: 2, atk: 2, def: 2, spa: 2, spd: 2, spe: 2 },
          },
        ] as any}
        resolvedTeam={[
          {
            key: "member-1",
            species: "Mareep",
            resolvedTypes: ["Electric"],
            moves: [{ name: "Thunder Wave", damageClass: "status", adjustedPower: 0 }],
          },
        ] as any}
        roleSnapshot={{ members: [] } as any}
        battleWeather="clear"
        evolvingIds={{}}
        activeMemberKey="member-1"
        activeRoleRecommendation={undefined}
        moveRecommendations={[] as any}
        starterSpeciesLine={[]}
        editorOpen={false}
        onSelectMember={vi.fn()}
        onToggleMemberLock={vi.fn()}
        onRemoveMember={vi.fn()}
        onReleaseMember={vi.fn()}
        onAddMember={vi.fn()}
        onResetMember={vi.fn()}
        onAssignToCompare={vi.fn()}
        onClearSelection={vi.fn()}
        onCloseEditor={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Mostrar info del slot seleccionado" })[0] as HTMLElement);

    await waitFor(() => {
      expect(screen.getAllByText("Info del slot").length).toBe(1);
    });

    expect(screen.queryByText("Dex Notes")).toBeNull();
    expect(screen.queryByText("Starter Lens")).toBeNull();
    expect(screen.getAllByText("No hay una recomendación clara todavia para este slot.").length).toBeGreaterThan(0);
  });

  it("skips dex fetch for empty resolved species and handles rejected dex requests", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          category: "Aura Pokemon",
          height: 1.2,
          weight: 54.0,
          flavorText: "Detecta las auras de sus rivales.",
        }),
      });
    global.fetch = fetchMock as never;

    const { rerender } = render(
      <RosterSection
        compositionName="Fetch"
        currentTeam={[
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
            item: "",
            moves: [],
            ivs: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
            evs: { hp: 2, atk: 2, def: 2, spa: 2, spd: 2, spe: 2 },
          },
        ] as any}
        resolvedTeam={[
          {
            key: "member-1",
            species: "",
            resolvedTypes: ["Fighting", "Steel"],
            moves: [],
          },
        ] as any}
        roleSnapshot={{ members: [] } as any}
        battleWeather="clear"
        evolvingIds={{}}
        activeMemberKey="member-1"
        activeRoleRecommendation={undefined}
        moveRecommendations={[] as any}
        starterSpeciesLine={[]}
        editorOpen={false}
        onSelectMember={vi.fn()}
        onToggleMemberLock={vi.fn()}
        onRemoveMember={vi.fn()}
        onReleaseMember={vi.fn()}
        onAddMember={vi.fn()}
        onResetMember={vi.fn()}
        onAssignToCompare={vi.fn()}
        onClearSelection={vi.fn()}
        onCloseEditor={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Mostrar info del slot seleccionado" })[0] as HTMLElement);
    await waitFor(() => {
      expect(screen.getAllByText("Info del slot").length).toBe(1);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    rerender(
      <RosterSection
        compositionName="Fetch"
        currentTeam={[
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
            item: "",
            moves: [],
            ivs: { hp: 1, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
            evs: { hp: 2, atk: 2, def: 2, spa: 2, spd: 2, spe: 2 },
          },
        ] as any}
        resolvedTeam={[
          {
            key: "member-1",
            species: "Lucario",
            resolvedTypes: ["Fighting", "Steel"],
            moves: [],
          },
        ] as any}
        roleSnapshot={{ members: [] } as any}
        battleWeather="clear"
        evolvingIds={{}}
        activeMemberKey="member-1"
        activeRoleRecommendation={undefined}
        moveRecommendations={[] as any}
        starterSpeciesLine={[]}
        editorOpen={false}
        onSelectMember={vi.fn()}
        onToggleMemberLock={vi.fn()}
        onRemoveMember={vi.fn()}
        onReleaseMember={vi.fn()}
        onAddMember={vi.fn()}
        onResetMember={vi.fn()}
        onAssignToCompare={vi.fn()}
        onClearSelection={vi.fn()}
        onCloseEditor={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/dex?pokemon=Lucario", expect.anything());
    });
    await waitFor(() => {
      expect(screen.getAllByText("Dex Notes").length).toBe(1);
    });
  });
});
