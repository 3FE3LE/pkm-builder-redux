import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  values: {
    tab: "pokemon",
    q: "",
    dexMode: "national",
    typeChanges: "0",
    statChanges: "0",
    abilityChanges: "0",
    addsNewTeamType: "0",
    allTypesNewToTeam: "0",
    type1: "",
    type2: "",
  } as Record<string, string>,
  setValue: vi.fn((key: string, value: string) => {
    mocked.values[key] = value;
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
              sources: {
                locations: [{ area: "Castelia City", detail: "Reemplaza Repel" }],
                shops: [],
              },
            },
            {
              name: "Pretty Wing",
              category: "Loot",
              effect: "Se vende por poco dinero.",
              sprite: "/pretty-wing.png",
              sources: {
                locations: [{ area: "Marvelous Bridge", detail: "Flying Pokémon's shadow" }],
                shops: [],
              },
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
    const [value, setValue] = React.useState(mocked.values[key] ?? "");

    const wrappedSetter = (next: string) => {
      mocked.setValue(key, next);
      setValue(next);
    };

    return [value, wrappedSetter];
  },
}));

vi.mock("@/components/ui/tabs", () => ({
  segmentedControlListClassName: "segmented-list",
  segmentedControlItemClassName: "segmented-item",
  segmentedControlItemInactiveClassName: "segmented-item-inactive",
  segmentedControlItemActiveClassName: "segmented-item-active",
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => {
    mocked.values.tab = value;

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
  }) => (mocked.values.tab === value ? <section>{children}</section> : null),
}));

import {
  DexScreen,
  matchesTypeSlotFilters,
} from "@/components/team/screens/DexScreen";

const dexListData = {
  speciesCatalog: [
    { name: "Mareep", slug: "mareep", dex: 179, types: ["Electric"] },
    { name: "Charizard", slug: "charizard", dex: 6, types: ["Fire", "Flying"] },
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
    {
      name: "Charizard",
      slug: "charizard",
      dex: 6,
      types: ["Fire", "Flying"],
      abilities: ["Blaze"],
      hasTypeChanges: false,
      hasStatChanges: true,
      hasAbilityChanges: false,
    },
    {
      name: "Uxie",
      slug: "uxie",
      dex: 480,
      types: ["Psychic", "Fairy"],
      abilities: ["Levitate"],
      hasTypeChanges: true,
      hasStatChanges: false,
      hasAbilityChanges: false,
      isLegendaryOrUnique: true,
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
    mocked.values = {
      tab: "pokemon",
      q: "",
      dexMode: "national",
      typeChanges: "0",
      statChanges: "0",
      abilityChanges: "0",
      addsNewTeamType: "0",
      allTypesNewToTeam: "0",
      type1: "",
      type2: "",
    };
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
    expect(screen.getAllByText("Charizard").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ver")).toBeNull();

    await user.type(screen.getByRole("textbox"), "fire");
    expect(screen.queryAllByText("Mareep")).toHaveLength(0);
    expect(screen.getAllByText("Charizard").length).toBeGreaterThan(0);
  });

  it("places the search input above the tabs and clears it with the clear button", async () => {
    const user = userEvent.setup();

    render(<DexScreen data={dexListData} />);

    const searchInput = screen.getByRole("textbox");
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
    expect(screen.getByText("Pretty Wing")).toBeTruthy();
    expect(screen.getByText("Castelia City")).toBeTruthy();
    expect(screen.getByText("Reemplaza Repel")).toBeTruthy();
  });

  it("renders pokemon detail links with transition types", () => {
    render(<DexScreen data={dexListData} />);

    const detailLink = screen.getByRole("link", { name: /mareep/i });
    expect(detailLink.getAttribute("href")).toBe("/team/dex/pokemon/mareep");
  });

  it("applies pokemon filters to the rendered list", async () => {
    const user = userEvent.setup();

    render(<DexScreen data={dexListData} />);

    expect(screen.getAllByText("Mareep").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charizard").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Stats" }));

    expect(screen.queryByText("Mareep")).toBeNull();
    expect(screen.getAllByText("Charizard").length).toBeGreaterThan(0);
    expect(screen.queryByText("Uxie")).toBeNull();
    expect(screen.getByText(/1 filtro activo/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /Limpiar filtros/i }));

    expect(screen.getAllByText("Mareep").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Charizard").length).toBeGreaterThan(0);
  });

  it("keeps the current pokemon query applied when toggling redux change filters", async () => {
    const user = userEvent.setup();

    render(<DexScreen data={dexListData} />);

    await user.type(screen.getByRole("textbox"), "mareep");
    expect(screen.getAllByText("Mareep").length).toBeGreaterThan(0);
    expect(screen.queryByText("Charizard")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Stats" }));

    expect(screen.queryByText("Mareep")).toBeNull();
    expect(screen.queryByText("Charizard")).toBeNull();
  });

  it("excludes legendary or unique pokemon from redux and synergy filters", async () => {
    const user = userEvent.setup();

    render(<DexScreen data={dexListData} />);

    expect(screen.getAllByText("Uxie").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Tipos" }));

    expect(screen.queryByText("Uxie")).toBeNull();
  });

  it("matches a single type filter against any type slot", () => {
    expect(matchesTypeSlotFilters(["Bug", "Water"], "water", "")).toBe(true);
    expect(matchesTypeSlotFilters(["Bug", "Water"], "", "bug")).toBe(true);
    expect(matchesTypeSlotFilters(["Bug", "Water"], "fire", "")).toBe(false);
  });

  it("keeps slot-specific behavior when both type filters are set", () => {
    expect(matchesTypeSlotFilters(["Bug", "Water"], "bug", "water")).toBe(true);
    expect(matchesTypeSlotFilters(["Bug", "Water"], "water", "bug")).toBe(false);
  });
});
