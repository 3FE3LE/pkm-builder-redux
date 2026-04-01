import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
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

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      layout: _layout,
      ...props
    }: {
      children?: ReactNode;
      layout?: boolean;
    }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  PokemonSprite: ({
    species,
    spriteUrl,
  }: {
    species: string;
    spriteUrl?: string;
  }) => <div>{`sprite-${species}-${spriteUrl ?? "none"}`}</div>,
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
  SpeciesCombobox: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div>
      <div>{`species-value-${value || "none"}`}</div>
      <button type="button" onClick={() => onChange("Mareep")}>
        pick-mareep
      </button>
      <button type="button" onClick={() => onChange("Unknownmon")}>
        pick-unknown
      </button>
    </div>
  ),
  FilterCombobox: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div>
      <div>{`nature-value-${value}`}</div>
      <button type="button" onClick={() => onChange("Jolly")}>
        pick-jolly
      </button>
    </div>
  ),
}));

vi.mock("@/components/team/UI", () => ({
  SpreadInput: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div>
      <div>{`${label}-${value}`}</div>
      <button
        type="button"
        onClick={() => {
          if (label === "LEVEL") onChange(12);
          if (label === "HP") onChange(999);
          if (label === "ATK") onChange(40);
          if (label === "DEF") onChange(0);
        }}
      >
        {`set-${label}`}
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/Input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => <button type="button" onClick={onClick} disabled={disabled}>{children}</button>,
}));

vi.mock("@/lib/builderStore", () => ({
  createEditable: (species: string) => mocked.createEditable(species),
}));

import { IvCalculatorSection } from "@/components/team/tools/IvCalculatorSection";

const speciesCatalog = [
  { name: "Mareep", slug: "mareep", dex: 179, types: ["Electric"] },
];

const pokemonIndex = {
  mareep: {
    name: "Mareep",
    stats: { hp: 55, atk: 40, def: 40, spa: 65, spd: 45, spe: 35 },
    learnsets: {
      levelUp: [
        { level: 1, move: "Tackle" },
        { level: 5, move: "Growl" },
        { level: 9, move: "Thunder Wave" },
        { level: 9, move: "Thunder Wave" },
        { level: 13, move: "Thunder Shock" },
      ],
    },
  },
} as any;

describe("IvCalculatorSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the empty state when there is no valid species selected", () => {
    render(
      <IvCalculatorSection
        speciesCatalog={speciesCatalog}
        pokemonIndex={pokemonIndex}
        onAddPreparedMember={vi.fn()}
      />,
    );

    expect(screen.getByText("Elige una especie válida para empezar el cálculo.")).toBeTruthy();
  });

  it("prefills species, renders stats and moves, and adds a prepared member with success feedback", async () => {
    const user = userEvent.setup();
    const onAddPreparedMember = vi.fn(() => ({ ok: true as const, reason: "pc" as const }));

    render(
      <IvCalculatorSection
        speciesCatalog={speciesCatalog}
        pokemonIndex={pokemonIndex}
        prefillSpecies="Mareep"
        onAddPreparedMember={onAddPreparedMember}
      />,
    );

    expect(screen.getByText("Mareep")).toBeTruthy();
    expect(screen.getByText("Dex #179 · Lv 5 · Serious")).toBeTruthy();
    expect(screen.getAllByText("Electric").length).toBeGreaterThan(0);
    expect(screen.getByText(/sprite-Mareep/)).toBeTruthy();
    expect(screen.getByText("Base stats")).toBeTruthy();
    expect(screen.getByText("HP")).toBeTruthy();
    expect(screen.getAllByText("40").length).toBeGreaterThan(0);
    expect(screen.getByText("65")).toBeTruthy();
    expect(screen.getByText("Tackle")).toBeTruthy();
    expect(screen.getByText("Growl")).toBeTruthy();
    expect(screen.queryByText("Thunder Wave")).toBeNull();

    await user.click(screen.getByRole("button", { name: "pick-jolly" }));
    await user.click(screen.getByRole("button", { name: "set-LEVEL" }));
    expect(screen.getByText("Dex #179 · Lv 12 · Jolly")).toBeTruthy();
    expect(screen.getByText("Thunder Wave")).toBeTruthy();
    expect(screen.queryByText("Thunder Shock")).toBeNull();

    await user.click(screen.getByRole("button", { name: "set-HP" }));
    expect(screen.getByText("No cuadra con EV 0")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "set-ATK" }));
    expect(screen.getAllByText("EST. IV").length).toBeGreaterThan(0);

    await user.type(screen.getByPlaceholderText("Mareep"), "Sparky");
    await user.click(screen.getAllByRole("button").find((button) => button.textContent === "") as HTMLElement);
    await user.click(screen.getByRole("button", { name: /Shiny/i }));
    await user.click(screen.getByRole("button", { name: "Add Capture To Team" }));

    expect(mocked.createEditable).toHaveBeenCalledWith("Mareep");
    expect(onAddPreparedMember).toHaveBeenCalledWith(
      expect.objectContaining({
        species: "Mareep",
        nickname: "Sparky",
        gender: "male",
        shiny: true,
        nature: "Jolly",
        level: 12,
        moves: ["Tackle", "Growl", "Thunder Wave"],
      }),
    );
    expect(screen.getByText("species-value-none")).toBeTruthy();
  });

  it("shows duplicate/full feedback and clears it after form changes", async () => {
    const user = userEvent.setup();
    const onAddPreparedMember = vi
      .fn()
      .mockReturnValueOnce({ ok: false, reason: "duplicate" as const })
      .mockReturnValueOnce({ ok: false, reason: "full" as const });

    render(
      <IvCalculatorSection
        speciesCatalog={speciesCatalog}
        pokemonIndex={pokemonIndex}
        onAddPreparedMember={onAddPreparedMember}
      />,
    );

    await user.click(screen.getByRole("button", { name: "pick-mareep" }));
    await user.click(screen.getByRole("button", { name: "Add Capture To Team" }));
    expect(screen.getByText("Mareep ya esta en el roster.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "set-ATK" }));
    expect(screen.queryByText("Mareep ya esta en el roster.")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Add Capture To Team" }));
    expect(screen.getByText("El roster ya tiene 6 Pokemon.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "pick-unknown" }));
    expect(screen.queryByText("El roster ya tiene 6 Pokemon.")).toBeNull();
    expect(screen.getByText("Elige una especie válida para empezar el cálculo.")).toBeTruthy();
  });
});
