import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  toolTab: "compare",
  hydrated: true,
  setToolTab: vi.fn(),
  updateCompareMember: vi.fn(),
  addPreparedMember: vi.fn(),
  createComposition: vi.fn(),
  setActiveCompositionId: vi.fn(),
  renameComposition: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mocked.searchParams,
}));

vi.mock("nuqs", () => ({
  parseAsStringEnum: () => ({
    withDefault: () => "compare",
  }),
  useQueryState: () => [mocked.toolTab, mocked.setToolTab],
}));

vi.mock("@/components/team/tools/compare/WorkspaceSection", () => ({
  WorkspaceSection: (props: Record<string, any>) => (
    <div>
      <div>compare-workspace</div>
      <button type="button" onClick={() => props.onClearMember(1)}>
        clear-compare
      </button>
      <button
        type="button"
        onClick={() =>
          props.onChangeMember(0, {
            id: "compare-0",
            species: "Lucario",
          })
        }
      >
        change-compare
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/IvCalculatorSection", () => ({
  IvCalculatorSection: (props: Record<string, any>) => (
    <div>
      <div>{`ivcalc-${props.prefillSpecies || "none"}`}</div>
      <button
        type="button"
        onClick={() => props.onAddPreparedMember({ id: "prepared-1", species: "Snivy" })}
      >
        add-prepared
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/TypeTierListSection", () => ({
  TypeTierListSection: ({ resolvedTeam }: { resolvedTeam: Array<{ species: string }> }) => (
    <div>{`types-${resolvedTeam.length}`}</div>
  ),
}));

vi.mock("@/components/team/collection/CompositionsSection", () => ({
  CompositionsSection: (props: Record<string, any>) => (
    <div>
      <div>{`compositions-${props.activeCompositionId ?? "none"}`}</div>
      <button type="button" onClick={() => props.onCreateComposition()}>
        create-composition
      </button>
      <button type="button" onClick={() => props.onSelectComposition("comp-2")}>
        select-composition
      </button>
      <button type="button" onClick={() => props.onRenameComposition("comp-2", "Rain Team")}>
        rename-composition
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/LoadingScreen", () => ({
  LoadingScreen: () => <div>loading-screen</div>,
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamSession: () => ({
    hydrated: mocked.hydrated,
    battleWeather: "rain",
  }),
  useTeamCatalogs: () => ({
    speciesCatalog: [{ name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] }],
    abilityCatalog: [{ name: "Inner Focus" }],
    itemCatalog: [{ name: "Leftovers" }],
    pokemonIndex: { lucario: { name: "Lucario" } },
  }),
  useTeamRoster: () => ({
    compositions: [{ id: "comp-1", name: "Default" }],
    activeCompositionId: "comp-1",
    resolvedTeam: [{ key: "member-1", species: "Lucario", resolvedTypes: ["Fighting", "Steel"] }],
    actions: {
      addPreparedMember: mocked.addPreparedMember,
      createComposition: mocked.createComposition,
      setActiveCompositionId: mocked.setActiveCompositionId,
      renameComposition: mocked.renameComposition,
    },
  }),
  useTeamCompare: () => ({
    members: [{ id: "compare-0" }, { id: "compare-1" }],
    resolvedMembers: [{ key: "compare-0" }, { key: "compare-1" }],
    actions: {
      updateMember: mocked.updateCompareMember,
    },
  }),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <div data-value={value} data-onchange={String(Boolean(onValueChange))}>
      <button type="button" onClick={() => onValueChange("compositions")}>
        tabs-onchange
      </button>
      {children}
    </div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({
    children,
    value,
    className,
  }: {
    children: React.ReactNode;
    value: string;
    className?: string;
  }) => (
    <button type="button" className={className} onClick={() => mocked.setToolTab(value)}>
      {children}
    </button>
  ),
  TabsContent: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <section data-tab={value}>{children}</section>,
}));

vi.mock("@/lib/builderStore", () => ({
  createEditable: vi.fn(() => ({ id: "empty-member", species: "" })),
}));

import { ToolsScreen } from "@/components/team/screens/ToolsScreen";

describe("ToolsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.searchParams = new URLSearchParams();
    mocked.toolTab = "compare";
    mocked.hydrated = true;
  });

  it("shows loading while the session is not hydrated", () => {
    mocked.hydrated = false;

    render(<ToolsScreen />);

    expect(screen.getByText("loading-screen")).toBeTruthy();
  });

  it("renders compare mode and wires the compare actions", async () => {
    const user = userEvent.setup();

    render(<ToolsScreen />);

    expect(screen.getByText("Compare, IV Calc y Type Tiers")).toBeTruthy();
    expect(screen.getByText("compare-workspace")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "clear-compare" }));
    expect(mocked.updateCompareMember).toHaveBeenCalledWith(1, { id: "empty-member", species: "" });

    await user.click(screen.getByRole("button", { name: "change-compare" }));
    expect(mocked.updateCompareMember).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ species: "Lucario" }),
    );

    await user.click(screen.getByRole("button", { name: "IV Calc" }));
    expect(mocked.setToolTab).toHaveBeenCalledWith("ivcalc");
  });

  it("renders iv calc, type tiers and compositions tabs with their actions", async () => {
    const user = userEvent.setup();
    mocked.toolTab = "ivcalc";
    mocked.searchParams = new URLSearchParams("species=Zorua");

    const { rerender } = render(<ToolsScreen />);

    expect(screen.getByText("ivcalc-Zorua")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "add-prepared" }));
    expect(mocked.addPreparedMember).toHaveBeenCalledWith(
      expect.objectContaining({ species: "Snivy" }),
    );

    mocked.toolTab = "types";
    rerender(<ToolsScreen />);

    expect(screen.getByText("types-1")).toBeTruthy();

    mocked.toolTab = "compositions";
    rerender(<ToolsScreen />);

    expect(screen.getByText("compositions-comp-1")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "create-composition" }));
    expect(mocked.createComposition).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "select-composition" }));
    expect(mocked.setActiveCompositionId).toHaveBeenCalledWith("comp-2");

    await user.click(screen.getByRole("button", { name: "rename-composition" }));
    expect(mocked.renameComposition).toHaveBeenCalledWith("comp-2", "Rain Team");
  });

  it("forwards tab changes through the Tabs onValueChange handler", async () => {
    const user = userEvent.setup();

    render(<ToolsScreen />);

    await user.click(screen.getByRole("button", { name: "tabs-onchange" }));
    expect(mocked.setToolTab).toHaveBeenCalledWith("compositions");
  });
});
