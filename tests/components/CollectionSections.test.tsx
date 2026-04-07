import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      layout: _layout,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  SpeciesCombobox: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <button type="button" aria-label="species-combobox" onClick={() => onChange(value || "Zorua")}>
      {value || "Species"}
    </button>
  ),
  FilterCombobox: ({
    value,
    placeholder,
    onChange,
  }: {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  PokemonSprite: ({ species }: { species: string }) => <div>{`${species}-sprite`}</div>,
  TypeBadge: ({ type }: { type: string }) => <div>{type}</div>,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock("@/lib/domain/names", () => ({
  buildSpriteUrls: (species: string, dex?: number, options?: { shiny?: boolean }) => ({
    spriteUrl: `${species}-${dex ?? "na"}-${options?.shiny ? "shiny" : "normal"}.png`,
    animatedSpriteUrl: `${species}-${dex ?? "na"}-${options?.shiny ? "shiny" : "normal"}.gif`,
  }),
}));

import {
  AddMemberSheet,
  CompositionsSection,
  PcBoxSection,
} from "@/components/team/collection";

function createMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    species: "Riolu",
    nickname: "Rio",
    locked: false,
    shiny: false,
    level: 10,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ...overrides,
  };
}

describe("CollectionSections", () => {
  it("creates, selects, renames, and cancels composition edits", async () => {
    const user = userEvent.setup();
    const onCreateComposition = vi.fn();
    const onSelectComposition = vi.fn();
    const onRenameComposition = vi.fn();

    render(
      <CompositionsSection
        compositions={[
          { id: "a", name: "Alpha", memberIds: ["1"] },
          { id: "b", name: "", memberIds: [] },
        ]}
        activeCompositionId="a"
        onCreateComposition={onCreateComposition}
        onSelectComposition={onSelectComposition}
        onRenameComposition={onRenameComposition}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add team/i }));
    expect(onCreateComposition).toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole("button", { name: /team 2/i }), { key: "Enter" });
    expect(onSelectComposition).toHaveBeenCalledWith("b");

    await user.click(screen.getAllByRole("button", { name: /editar nombre del equipo/i })[0]!);
    let input = screen.getByDisplayValue("Alpha");
    await user.clear(input);
    await user.type(input, "Frontline{enter}");
    expect(onRenameComposition).toHaveBeenCalledWith("a", "Frontline");

    await user.click(screen.getAllByRole("button", { name: /editar nombre del equipo/i })[0]!);
    input = screen.getByDisplayValue("Alpha");
    await user.type(input, "{escape}");
    expect(screen.queryByDisplayValue("Alpha")).toBeNull();
  });

  it("shows pc box fallback and supports selecting, assigning, viewing, and closing a stored member", async () => {
    const user = userEvent.setup();
    const onOpenEditor = vi.fn();
    const onAssignToComposition = vi.fn();

    const { rerender } = render(
      <PcBoxSection
        members={[]}
        compositions={[]}
        activeCompositionId={null}
        speciesCatalog={[]}
        onOpenEditor={onOpenEditor}
        onAssignToComposition={onAssignToComposition}
        onImportToPc={vi.fn()}
      />,
    );

    expect(screen.getByText(/aun no tienes pokemon mandados a la caja/i)).toBeTruthy();

    rerender(
      <PcBoxSection
        members={[
          createMember(),
          createMember({ id: "2", species: "Lucario", nickname: "", shiny: true, item: "Metal Coat", level: 22 }),
        ] as never}
        compositions={[
          { id: "comp-a", name: "Alpha", memberIds: [] },
          { id: "comp-b", name: "Beta", memberIds: [] },
        ]}
        activeCompositionId="comp-b"
        speciesCatalog={[
          { name: "Riolu", dex: 447 },
          { name: "Lucario", dex: 448 },
        ]}
        pulseMemberId="2"
        onOpenEditor={onOpenEditor}
        onAssignToComposition={onAssignToComposition}
        onImportToPc={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /abrir acciones para rio/i }));
    expect(screen.getByText("Rio")).toBeTruthy();
    expect(screen.getByDisplayValue("Beta")).toBeTruthy();

    await user.clear(screen.getByLabelText("Equipo destino"));
    await user.type(screen.getByLabelText("Equipo destino"), "Alpha");
    await user.click(screen.getByRole("button", { name: /^agregar$/i }));
    expect(onAssignToComposition).toHaveBeenCalledWith("1", "comp-a");

    await user.click(screen.getByRole("button", { name: /abrir acciones para rio/i }));
    await user.click(screen.getByRole("button", { name: /ver datos/i }));
    expect(onOpenEditor).toHaveBeenCalledWith("1");

    await user.click(screen.getByRole("button", { name: /abrir acciones para lucario/i }));
    expect(screen.getByText(/lucario · lv\. 22 · metal coat/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /cerrar menu de caja/i }));
    expect(screen.queryByRole("button", { name: /cerrar menu de caja/i })).toBeNull();
  });

  it("filters add-member options, ignores active team ids, and resets the search when closing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onPickLibraryMember = vi.fn();
    const onCreateFromDex = vi.fn();

    const { rerender } = render(
      <AddMemberSheet
        open
        libraryMembers={[
          createMember(),
          createMember({ id: "2", species: "Lucario", nickname: "Aura", level: 20 }),
        ] as never}
        activeTeamIds={["2"]}
        speciesCatalog={[
          { name: "Riolu", slug: "riolu", dex: 447, types: ["Fighting"] },
          { name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] },
          { name: "Zorua", slug: "zorua", dex: 570, types: ["Dark"] },
        ]}
        onClose={onClose}
        onPickLibraryMember={onPickLibraryMember}
        onCreateFromDex={onCreateFromDex}
      />,
    );

    expect(screen.getByText("1 disponibles")).toBeTruthy();
    expect(screen.getByText("Rio")).toBeTruthy();
    expect(screen.queryByText("Aura")).toBeNull();

    const search = screen.getByPlaceholderText(/busca por nickname, especie o numero dex/i);
    await user.type(search, "rio");
    expect(screen.getByText("Rio")).toBeTruthy();
    expect(screen.queryByText("Aura")).toBeNull();

    await user.click(screen.getByText("Rio").closest("button")!);
    expect(onPickLibraryMember).toHaveBeenCalledWith("1");

    await user.click(screen.getByRole("button", { name: "species-combobox" }));
    expect(onCreateFromDex).toHaveBeenCalledWith("Zorua");

    await user.clear(search);
    await user.type(search, "missing");
    expect(screen.getByText(/no hay coincidencias en tu libreria/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();

    rerender(
      <AddMemberSheet
        open={false}
        libraryMembers={[
          createMember(),
        ] as never}
        activeTeamIds={[]}
        speciesCatalog={[
          { name: "Riolu", slug: "riolu", dex: 447, types: ["Fighting"] },
        ]}
        onClose={onClose}
        onPickLibraryMember={onPickLibraryMember}
        onCreateFromDex={onCreateFromDex}
      />,
    );
    expect(screen.queryByPlaceholderText(/busca por nickname/i)).toBeNull();

    rerender(
      <AddMemberSheet
        open
        libraryMembers={[
          createMember(),
        ] as never}
        activeTeamIds={[]}
        speciesCatalog={[
          { name: "Riolu", slug: "riolu", dex: 447, types: ["Fighting"] },
        ]}
        onClose={onClose}
        onPickLibraryMember={onPickLibraryMember}
        onCreateFromDex={onCreateFromDex}
      />,
    );
    expect(
      (screen.getByPlaceholderText(/busca por nickname/i) as HTMLInputElement).value,
    ).toBe("");
  });
});
