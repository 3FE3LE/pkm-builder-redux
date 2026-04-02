import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  tab: "moves",
  setTab: vi.fn((value: string) => {
    mocked.tab = value;
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    unoptimized: _unoptimized,
    ...props
  }: {
    alt: string;
    src: string;
    [key: string]: unknown;
  }) => <img alt={alt} src={src} {...props} />,
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamCatalogs: () => ({
    moveIndex: {
      tackle: {
        name: "Tackle",
        type: "Normal",
        damageClass: "physical",
        power: 40,
        accuracy: 100,
        description: "Golpea sin efecto adicional.",
      },
    },
    abilityCatalog: [{ name: "Static", effect: "Puede paralizar al hacer contacto." }],
    itemCatalog: [
      {
        name: "Leftovers",
        category: "Held Items",
        effect: "Restaura PS al final del turno.",
        sprite: "/leftovers.png",
      },
    ],
    pokemonIndex: {
      mareep: {
        name: "Mareep",
        abilities: ["Static"],
        learnsets: {
          levelUp: [{ level: 1, move: "Tackle" }],
          machines: [],
        },
      },
    },
    docs: {
      itemLocations: [{ area: "Castelia City", items: ["Repel -> Leftovers"] }],
    },
  }),
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
  }) => {
    mocked.tab = value;

    return (
      <div data-value={value}>
        <button type="button" onClick={() => onValueChange("abilities")}>
          switch-abilities
        </button>
        <button type="button" onClick={() => onValueChange("items")}>
          switch-items
        </button>
        {children}
      </div>
    );
  },
  TabsList: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
  TabsContent: ({
    children,
    value,
  }: {
    children: ReactNode;
    value: string;
  }) => (mocked.tab === value ? <section>{children}</section> : null),
}));

import { DexScreen } from "@/components/team/screens/DexScreen";

describe("DexScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.tab = "moves";
  });

  it("renders move data and filters it by query", async () => {
    const user = userEvent.setup();

    render(<DexScreen />);

    expect(screen.getByText("Movimientos, habilidades y objetos")).toBeTruthy();
    expect(screen.getByText("Tackle")).toBeTruthy();
    expect(screen.getByText("Golpea sin efecto adicional.")).toBeTruthy();
    expect(screen.getByText("Mareep")).toBeTruthy();

    await user.type(screen.getByPlaceholderText("Buscar movimiento o efecto"), "static");
    expect(screen.queryByText("Tackle")).toBeNull();
  });

  it("switches to abilities and items with their linked data", async () => {
    const user = userEvent.setup();

    render(<DexScreen />);

    await user.click(screen.getByRole("button", { name: "switch-abilities" }));
    expect(screen.getByText("Static")).toBeTruthy();
    expect(screen.getByText("Puede paralizar al hacer contacto.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "switch-items" }));
    expect(screen.getByText("Leftovers")).toBeTruthy();
    expect(screen.getByText("Castelia City")).toBeTruthy();
    expect(screen.getByText("Repel -> Leftovers")).toBeTruthy();
  });
});
