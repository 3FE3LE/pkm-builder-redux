import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  FilterCombobox: ({
    value,
    options,
    onChange,
  }: {
    value: string;
    options: string[];
    onChange: (next: string) => void;
  }) => (
    <select
      aria-label="Equipo destino"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Seleccione</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  ),
  PokemonSprite: ({ species }: { species: string }) => <div>{species}</div>,
  TypeBadge: ({ type }: { type: string }) => <div>{type}</div>,
}));

vi.mock("@/lib/domain/names", () => ({
  buildSpriteUrls: vi.fn(() => ({
    spriteUrl: "/sprite.png",
    animatedSpriteUrl: "/sprite-animated.png",
  })),
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
      <div>{`transfer-member-${member?.id ?? "none"}`}</div>
      <button type="button" onClick={() => onImportToPc({ species: "Imported Mon" } as never)}>
        import-to-pc
      </button>
    </div>
  ),
}));

import { PcBoxSection } from "@/components/team/CollectionSections";

function createMember(id: string, species: string) {
  return {
    id,
    species,
    nickname: species,
    locked: false,
    shiny: false,
    level: 12,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  };
}

describe("PcBoxSection", () => {
  it("shows the empty state when there are no stored members", () => {
    render(
      <PcBoxSection
        members={[]}
        compositions={[]}
        activeCompositionId={null}
        speciesCatalog={[]}
        onOpenEditor={vi.fn()}
        onAssignToComposition={vi.fn()}
        onImportToPc={vi.fn()}
      />,
    );

    expect(screen.getByText(/aun no tienes pokemon mandados a la caja/i)).toBeTruthy();
    expect(screen.getByText("transfer-member-none")).toBeTruthy();
  });

  it("assigns a selected pc member to the active composition", async () => {
    const user = userEvent.setup();
    const onAssignToComposition = vi.fn();

    render(
      <PcBoxSection
        members={[createMember("1", "Riolu"), createMember("2", "Snivy")] as never}
        compositions={[
          { id: "c1", name: "Alpha", memberIds: [] },
          { id: "c2", name: "Beta", memberIds: [] },
        ]}
        activeCompositionId="c2"
        speciesCatalog={[
          { name: "Riolu", dex: 447 },
          { name: "Snivy", dex: 495 },
        ]}
        onOpenEditor={vi.fn()}
        onAssignToComposition={onAssignToComposition}
        onImportToPc={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /abrir acciones para riolu/i }));
    expect(
      (screen.getByRole("combobox", { name: /equipo destino/i }) as HTMLSelectElement).value,
    ).toBe("Beta");

    await user.click(screen.getByRole("button", { name: /agregar/i }));
    expect(onAssignToComposition).toHaveBeenCalledWith("1", "c2");
  });

  it("opens the editor for the selected pc member", async () => {
    const user = userEvent.setup();
    const onOpenEditor = vi.fn();

    render(
      <PcBoxSection
        members={[createMember("1", "Riolu")] as never}
        compositions={[{ id: "c1", name: "Alpha", memberIds: [] }]}
        activeCompositionId="c1"
        speciesCatalog={[{ name: "Riolu", dex: 447 }]}
        onOpenEditor={onOpenEditor}
        onAssignToComposition={vi.fn()}
        onImportToPc={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /abrir acciones para riolu/i }));
    await user.click(screen.getByRole("button", { name: /ver datos/i }));

    expect(onOpenEditor).toHaveBeenCalledWith("1");
    expect(screen.getByText("transfer-member-1")).toBeTruthy();
  });

  it("forwards import requests to the pc handler", async () => {
    const user = userEvent.setup();
    const onImportToPc = vi.fn(() => true);

    render(
      <PcBoxSection
        members={[createMember("1", "Riolu")] as never}
        compositions={[{ id: "c1", name: "Alpha", memberIds: [] }]}
        activeCompositionId="c1"
        speciesCatalog={[{ name: "Riolu", dex: 447 }]}
        onOpenEditor={vi.fn()}
        onAssignToComposition={vi.fn()}
        onImportToPc={onImportToPc}
      />,
    );

    await user.click(screen.getByRole("button", { name: /import-to-pc/i }));
    expect(onImportToPc).toHaveBeenCalledWith(expect.objectContaining({ species: "Imported Mon" }));
  });
});
