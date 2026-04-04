import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  tab: "pokemon",
  setTab: vi.fn((value: string) => {
    mocked.tab = value;
  }),
  query: "",
  setQuery: vi.fn((value: string) => {
    mocked.query = value;
  }),
  parseAsStringEnum: {
    withDefault: (_defaultValue: string) => "pokemon",
  },
  parseAsString: {
    withDefault: (_defaultValue: string) => "",
  },
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
    speciesCatalog: [
      { name: "Mareep", slug: "mareep", dex: 179, types: ["Electric"] },
    ],
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
    canonicalPokemonIndex: {
      mareep: {
        name: "Mareep",
        stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35, bst: 280 },
        abilities: ["Static"],
        types: ["Electric"],
      },
    },
    pokemonIndex: {
      mareep: {
        name: "Mareep",
        stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35, bst: 280 },
        abilities: ["Static"],
        nextEvolutions: ["Flaaffy"],
        evolutionDetails: [{ target: "Flaaffy", minLevel: 15, trigger: "level-up" }],
        learnsets: {
          levelUp: [{ level: 1, move: "Tackle" }],
          machines: [{ source: "TM73", move: "Thunder Wave" }],
        },
      },
    },
    docs: {
      gifts: [{ name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] }],
      trades: [{ requested: "Basculin", received: "Mareep", location: "Nimbasa City", traits: [] }],
      wildAreas: [{ area: "Route 1", methods: [{ method: "Grass", encounters: [{ species: "Mareep", level: "4" }] }] }],
      itemLocations: [{ area: "Castelia City", items: ["Repel -> Leftovers"] }],
    },
  }),
}));

vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (key === "/api/dex?movesList=1") {
      return {
        data: {
          entries: [
            {
              name: "Tackle",
              type: "Normal",
              damageClass: "physical",
              power: 40,
              accuracy: 100,
              description: "Golpea sin efecto adicional.",
            },
          ],
          ownersByMove: {
            tackle: {
              levelUp: ["Mareep"],
              machines: [],
            },
          },
        },
      };
    }

    if (key === "/api/dex?abilitiesList=1") {
      return {
        data: {
          entries: [{ name: "Static", effect: "Puede paralizar al hacer contacto." }],
          ownersByAbility: {
            static: {
              regular: ["Mareep"],
              hidden: [],
            },
          },
        },
      };
    }

    if (key === "/api/dex?itemsList=1") {
      return {
        data: {
          entries: [
            {
              name: "Leftovers",
              category: "Held Items",
              effect: "Restaura PS al final del turno.",
              sprite: "/leftovers.png",
            },
          ],
        },
      };
    }

    return { data: undefined };
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
}));

vi.mock("nuqs", () => ({
  parseAsStringEnum: () => mocked.parseAsStringEnum,
  parseAsString: mocked.parseAsString,
  useQueryState: (key: string) => {
    const React = require("react") as typeof import("react");
    const [value, setValue] = React.useState(
      key === "tab" ? mocked.tab : mocked.query,
    );

    const wrappedSetter = (next: string) => {
      if (key === "tab") {
        mocked.tab = next;
        mocked.setTab(next);
      } else {
        mocked.query = next;
        mocked.setQuery(next);
      }
      setValue(next);
    };

    return [value, wrappedSetter];
  },
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
        <button type="button" onClick={() => onValueChange("pokemon")}>
          switch-pokemon
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

const dexListData = {
  speciesCatalog: [
    { name: "Mareep", slug: "mareep", dex: 179, types: ["Electric"] },
  ],
  pokemonList: [
    {
      name: "Mareep",
      slug: "mareep",
      dex: 179,
      types: ["Electric"],
      abilities: ["Static"],
      hasTypeChanges: false,
      hasStatChanges: false,
      hasAbilityChanges: false,
    },
  ],
  docs: {
    gifts: [{ name: "Mareep", location: "Floccesy Ranch", level: "10", notes: [] }],
    trades: [{ requested: "Basculin", received: "Mareep", location: "Nimbasa City", traits: [] }],
    wildAreas: [{ area: "Route 1", methods: [{ method: "Grass", encounters: [{ species: "Mareep", level: "4" }] }] }],
    itemLocations: [{ area: "Castelia City", items: ["Repel -> Leftovers"] }],
    moveReplacements: [],
    moveTypeChanges: [],
    moveTypeOverrides: [],
    moveDetails: [],
    typeChanges: [],
    itemHighlights: [],
    pokemonProfiles: [],
    evolutionChanges: [],
  },
} as const;

describe("DexScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.tab = "pokemon";
    mocked.query = "";
    Object.defineProperty(globalThis, "CSS", {
      writable: true,
      configurable: true,
      value: {
        escape: (value: string) => value,
      },
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders pokemon data and filters it by query", async () => {
    const user = userEvent.setup();

    render(<DexScreen data={dexListData} />);

    expect(screen.getByText("Redux Dex")).toBeTruthy();
    expect(screen.getAllByText("Mareep").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Electric").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ver")).toBeNull();

    await user.type(screen.getByPlaceholderText("Buscar Pokemon, tipo, habilidad o area"), "fire");
    expect(screen.queryAllByText("Mareep")).toHaveLength(0);
  });

  it("places the search input above the tabs and clears it with the clear button", async () => {
    const user = userEvent.setup();

    render(<DexScreen data={dexListData} />);

    const searchInput = screen.getByPlaceholderText("Buscar Pokemon, tipo, habilidad o area");
    const pokemonTab = screen.getByRole("button", { name: "Pokemon" });

    expect(
      searchInput.compareDocumentPosition(pokemonTab) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.type(searchInput, "mareep");
    expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect((searchInput as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("switches to abilities and items with their linked data", async () => {
    const user = userEvent.setup();

    render(<DexScreen data={dexListData} />);

    await user.click(screen.getByRole("button", { name: "switch-pokemon" }));
    expect(screen.queryByText("Ver")).toBeNull();
    expect(screen.queryByText("TM73 · Thunder Wave")).toBeNull();

    await user.click(screen.getByRole("button", { name: "switch-abilities" }));
    expect(screen.getByText("Static")).toBeTruthy();
    expect(screen.getByText("Puede paralizar al hacer contacto.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "switch-items" }));
    expect(screen.getByText("Leftovers")).toBeTruthy();
    expect(screen.getByText("Castelia City")).toBeTruthy();
    expect(screen.getByText("Reemplaza Repel")).toBeTruthy();
  });

  it("renders pokemon detail links with transition types", () => {
    render(<DexScreen data={dexListData} />);

    const detailLink = screen.getByRole("link", { name: /mareep/i });
    expect(detailLink.getAttribute("href")).toBe("/team/dex/pokemon/mareep");
  });
});
