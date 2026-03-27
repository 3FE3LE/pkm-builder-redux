import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FilterCombobox,
  InfoHint,
  ItemSprite,
  PokemonSprite,
  SpeciesCombobox,
  TypeBadge,
} from "@/components/BuilderShared";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    onError,
    unoptimized: _unoptimized,
    ...props
  }: {
    alt: string;
    src: string;
    onError?: () => void;
    [key: string]: unknown;
  }) => <img alt={alt} src={src} onError={onError} {...props} />,
}));

describe("BuilderShared", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders badges, item sprites and info hints", () => {
    const { rerender } = render(
      <>
        <TypeBadge type="Fire" trailing="stab" emphasis="positive" className="extra-badge" />
        <ItemSprite name="Leftovers" />
        <InfoHint text="Restaura PS cada turno" />
      </>,
    );

    expect(screen.getByText("Fire")).toBeTruthy();
    expect(screen.getByText("stab")).toBeTruthy();
    expect(screen.getByText("item")).toBeTruthy();
    expect(screen.getByText("Restaura PS cada turno")).toBeTruthy();

    rerender(<ItemSprite name="Leftovers" sprite="/leftovers.png" chrome="plain" />);
    expect(screen.getByAltText("Leftovers").getAttribute("src")).toBe("/leftovers.png");
  });

  it("does not render an info hint without text", () => {
    const { container } = render(<InfoHint text={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("filters, coordinates and closes the generic combobox", async () => {
    const user = userEvent.setup();
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();

    render(
      <>
        <FilterCombobox
          value=""
          options={["Inner Focus", "Intimidate", "Static"]}
          placeholder="Ability"
          coordinationGroup="abilities"
          onChange={onChangeA}
        />
        <FilterCombobox
          value="Static"
          options={["Inner Focus", "Intimidate", "Static"]}
          placeholder="Ability"
          searchable={false}
          coordinationGroup="abilities"
          renderOption={(option, selected) => <span>{selected ? `picked-${option}` : option}</span>}
          onChange={onChangeB}
        />
      </>,
    );

    const triggers = screen.getAllByRole("button", { name: /Ability|Static/ });
    await user.click(triggers[0]);
    const searchInput = screen.getByPlaceholderText("Ability");
    await user.type(searchInput, "inti");
    await user.click(screen.getByRole("button", { name: "Intimidate" }));
    expect(onChangeA).toHaveBeenCalledWith("Intimidate");

    await user.click(triggers[1]);
    expect(screen.queryByPlaceholderText("Ability")).toBeNull();
    expect(screen.getByText("picked-Static")).toBeTruthy();

    await user.click(triggers[0]);
    expect(screen.queryByText("picked-Static")).toBeNull();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Ability")).toBeNull();
  });

  it("works without a coordination group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <FilterCombobox
        value=""
        options={["Blaze", "Overgrow", "Torrent"]}
        placeholder="Ability"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ability" }));
    await user.click(screen.getByRole("button", { name: "Torrent" }));

    expect(onChange).toHaveBeenCalledWith("Torrent");
    expect(screen.queryByPlaceholderText("Ability")).toBeNull();
  });

  it("supports filtering and selecting species in both inline and portal modes", async () => {
    const user = userEvent.setup();
    const onChangeInline = vi.fn();
    const onChangePortal = vi.fn();
    const speciesCatalog = [
      { name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] },
      { name: "Mareep", slug: "mareep", dex: 179, types: ["Electric"] },
      { name: "Riolu", slug: "riolu", dex: 447, types: ["Fighting"] },
    ];

    render(
      <>
        <SpeciesCombobox value="" speciesCatalog={speciesCatalog} onChange={onChangeInline} />
        <SpeciesCombobox value="Mareep" speciesCatalog={speciesCatalog} portal onChange={onChangePortal} />
      </>,
    );

    const triggers = screen.getAllByRole("button", { name: /Pokemon|Mareep/ });
    await user.click(triggers[0]);
    const searchInput = screen.getByPlaceholderText("Buscar por nombre o dex");
    await user.type(searchInput, "448");
    expect(screen.getByText("#448 Lucario")).toBeTruthy();
    expect(screen.queryByText("#179 Mareep")).toBeNull();

    await user.click(screen.getAllByRole("button", { name: /Any|Fire|Water|Grass|Electric|Fighting|Steel|Normal/ })[0]);
    await user.click(screen.getByRole("button", { name: "Fighting" }));
    await user.clear(searchInput);
    expect(screen.getByText("#448 Lucario")).toBeTruthy();
    expect(screen.getByText("#447 Riolu")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /#448 Lucario/ }));
    expect(onChangeInline).toHaveBeenCalledWith("Lucario");

    await user.click(triggers[1]);
    const portalSearch = screen.getByPlaceholderText("Buscar por nombre o dex");
    await user.clear(portalSearch);
    await user.type(portalSearch, "zzz");
    expect(screen.getByText("No hay resultados para ese filtro.")).toBeTruthy();

    await user.click(document.body);
    expect(screen.queryByText("No hay resultados para ese filtro.")).toBeNull();
  });

  it("coordinates species comboboxes and lets type filters reset to Any", async () => {
    const user = userEvent.setup();
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    const speciesCatalog = [
      { name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] },
      { name: "Mareep", slug: "mareep", dex: 179, types: ["Electric"] },
      { name: "Riolu", slug: "riolu", dex: 447, types: ["Fighting"] },
    ];

    render(
      <>
        <SpeciesCombobox
          value=""
          speciesCatalog={speciesCatalog}
          coordinationGroup="species"
          autoFocus
          panelClassName="panel-a"
          panelStyle={{ maxWidth: 320 }}
          onChange={onChangeA}
        />
        <SpeciesCombobox
          value="Riolu"
          speciesCatalog={speciesCatalog}
          coordinationGroup="species"
          portal
          panelClassName="panel-b"
          onChange={onChangeB}
        />
      </>,
    );

    const triggers = screen.getAllByRole("button", { name: /Pokemon|Riolu/ });

    await user.click(triggers[0]);
    const inlinePanel = document.querySelector(".panel-a");
    expect(inlinePanel?.getAttribute("style") ?? "").toContain("max-width: 320px");

    const allAnyButtons = screen.getAllByRole("button", { name: "Any" });
    await user.click(allAnyButtons[1]);
    await user.click(screen.getByRole("button", { name: "Electric" }));
    expect(screen.getByText("#179 Mareep")).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: /Electric/ })[0]);
    const anyButtonsAfterOpen = screen.getAllByRole("button", { name: "Any" });
    await user.click(anyButtonsAfterOpen[anyButtonsAfterOpen.length - 1]);
    expect(screen.getByText((content, node) => node?.textContent === "#447 Riolu")).toBeTruthy();

    await user.click(triggers[1]);
    expect(document.querySelector(".panel-a")).toBeNull();
  });

  it("closes the species combobox with Escape and tracks scroll position", async () => {
    const user = userEvent.setup();
    const speciesCatalog = Array.from({ length: 10 }, (_, index) => ({
      name: `Species ${index + 1}`,
      slug: `species-${index + 1}`,
      dex: index + 1,
      types: [index % 2 === 0 ? "Normal" : "Electric"],
    }));

    render(<SpeciesCombobox value="" speciesCatalog={speciesCatalog} onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Pokemon" }));
    const list = screen.getByPlaceholderText("Buscar por nombre o dex").closest("div")?.parentElement?.querySelector(".mt-2.max-h-72.overflow-auto");
    expect(list).toBeTruthy();

    fireEvent.scroll(list as Element, { target: { scrollTop: 132 }, currentTarget: { scrollTop: 132 } });
    expect(screen.getByText("#003 Species 3")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Buscar por nombre o dex")).toBeNull();
  });

  it("renders pokemon sprites with animated fallback and species fallback text", () => {
    const { rerender } = render(
      <PokemonSprite
        species="Lucario"
        spriteUrl="/lucario.png"
        animatedSpriteUrl="/lucario.gif"
        isEvolving
        size="large"
        chrome="framed"
      />,
    );

    const animatedImage = screen.getByAltText("Lucario");
    expect(animatedImage.getAttribute("src")).toBe("/lucario.gif");
    fireEvent.error(animatedImage);
    expect(screen.getByAltText("Lucario").getAttribute("src")).toBe("/lucario.png");

    rerender(<PokemonSprite species="Mareep" chrome="plain" size="small" />);
    expect(screen.getByText("Mareep")).toBeTruthy();
  });
});
