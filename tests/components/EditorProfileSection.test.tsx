import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/BuilderShared", () => ({
  SpeciesCombobox: ({
    speciesCatalog,
    onChange,
  }: {
    speciesCatalog: Array<{ name: string }>;
    onChange: (value: string) => void;
  }) => (
    <button type="button" aria-label="pokemon" onClick={() => onChange(speciesCatalog[0]?.name ?? "")}>
      pokemon
    </button>
  ),
  FilterCombobox: ({
    placeholder,
    options,
    renderOption,
    onChange,
    value,
  }: {
    placeholder: string;
    options: string[];
    renderOption: (option: string, selected: boolean) => React.ReactNode;
    onChange: (value: string) => void;
    value: string;
  }) => (
    <div>
      <button
        type="button"
        aria-label={placeholder}
        onClick={() => {
          if (placeholder === "Naturaleza") {
            onChange("Adamant");
            return;
          }
          onChange(options.at(-1) ?? "");
        }}
      >
        {placeholder}
      </button>
      <div>{options.slice(0, 2).map((option) => <div key={`${placeholder}-${option}`}>{renderOption(option, option === value)}</div>)}</div>
    </div>
  ),
  InfoHint: ({ text }: { text?: string }) => <span>{text ?? "no-hint"}</span>,
  ItemSprite: ({ name }: { name: string }) => <span>{name}-sprite</span>,
}));

vi.mock("@/components/team/PokemonTransferPanel", () => ({
  PokemonTransferActions: ({ member }: { member?: { species?: string } }) => (
    <div>{`transfer-actions-${member?.species ?? "none"}`}</div>
  ),
}));

import { EditorProfileSection } from "@/components/team/EditorProfileSection";

function createMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    species: "Riolu",
    nickname: "Riolu",
    locked: false,
    shiny: false,
    level: 10,
    gender: "unknown",
    nature: "Serious",
    ability: "Prankster",
    item: "",
    moves: [],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ...overrides,
  };
}

describe("EditorProfileSection", () => {
  it("resets the ability to a valid one when the resolved species abilities change", async () => {
    const updateEditorMember = vi.fn();

    render(
      <EditorProfileSection
        member={createMember({ species: "Lucario", nickname: "Lucario", level: 30 }) as never}
        resolved={{ abilities: ["Steadfast", "Inner Focus"] } as never}
        speciesCatalog={[]}
        abilityCatalog={[]}
        itemCatalog={[]}
        nicknameValue="Lucario"
        currentSpecies="Lucario"
        currentNature="Serious"
        currentAbility="Prankster"
        currentItem=""
        updateEditorMember={updateEditorMember}
        getIssue={() => undefined}
        onImportToPc={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(updateEditorMember).toHaveBeenCalled();
    });

    const updater = updateEditorMember.mock.calls[0]?.[0];
    expect(updater(createMember({ species: "Lucario", nickname: "Lucario", level: 30 }))).toMatchObject({
      ability: "Steadfast",
    });
  });

  it("changes species, syncs nickname only when nicknameValue still matches, and clears the ability", async () => {
    const user = userEvent.setup();
    const updateEditorMember = vi.fn();

    render(
      <EditorProfileSection
        member={createMember() as never}
        resolved={{ abilities: ["Prankster", "Steadfast"] } as never}
        speciesCatalog={[
          { name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] },
        ]}
        abilityCatalog={[]}
        itemCatalog={[]}
        nicknameValue="Riolu"
        currentSpecies="Riolu"
        currentNature="Serious"
        currentAbility="Prankster"
        currentItem=""
        updateEditorMember={updateEditorMember}
        getIssue={() => undefined}
        onImportToPc={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /pokemon/i }));

    const updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({
      species: "Lucario",
      nickname: "Lucario",
      ability: "",
    });

    const updateCustomNickname = vi.fn();

    render(
      <EditorProfileSection
        member={createMember({ nickname: "Aura" }) as never}
        resolved={{ abilities: ["Prankster", "Steadfast"] } as never}
        speciesCatalog={[
          { name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] },
        ]}
        abilityCatalog={[]}
        itemCatalog={[]}
        nicknameValue="Aura"
        currentSpecies="Riolu"
        currentNature="Serious"
        currentAbility="Prankster"
        currentItem=""
        updateEditorMember={updateCustomNickname}
        getIssue={() => undefined}
        onImportToPc={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /pokemon/i })[1]!);

    const customUpdater = updateCustomNickname.mock.calls.at(-1)?.[0];
    expect(
      customUpdater(
        createMember({
          nickname: "Aura",
        }),
      ),
    ).toMatchObject({
      species: "Lucario",
      nickname: "Aura",
      ability: "",
    });
  });

  it("shows issues and lets the user toggle lock plus update nature, ability, and held item", async () => {
    const user = userEvent.setup();
    const updateEditorMember = vi.fn();

    render(
      <EditorProfileSection
        member={createMember({ item: "Oran Berry" }) as never}
        resolved={
          {
            abilities: ["Prankster", "Steadfast"],
            abilityDetails: { name: "Prankster", effect: "Fallback ability effect" },
            itemDetails: { name: "Oran Berry", effect: "Fallback item effect" },
          } as never
        }
        speciesCatalog={[
          { name: "Lucario", slug: "lucario", dex: 448, types: ["Fighting", "Steel"] },
        ]}
        abilityCatalog={[
          { name: "Prankster", effect: "Acts first on status moves." },
          { name: "Steadfast", effect: "Raises speed after flinching." },
        ]}
        itemCatalog={[
          { name: "Potion", category: "Medicine", effect: "Restores HP." },
          { name: "Oran Berry", category: "Held Item", effect: "Restores 10 HP." },
          { name: "Leftovers", category: "Held Item", effect: "Recovers HP every turn." },
        ]}
        nicknameValue="Riolu"
        currentSpecies="Riolu"
        currentNature="Serious"
        currentAbility="Prankster"
        currentItem="Oran Berry"
        updateEditorMember={updateEditorMember}
        getIssue={(field) => (field === "species" ? "Choose a species" : undefined)}
        onImportToPc={vi.fn()}
      />,
    );

    expect(screen.getByText("Choose a species")).toBeTruthy();
    expect(screen.getAllByText("Acts first on status moves.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Restores 10 HP.").length).toBeGreaterThan(0);
    expect(screen.getByText("neutral")).toBeTruthy();
    expect(screen.queryByText("Potion")).toBeNull();
    expect(screen.getByText("Leftovers")).toBeTruthy();
    expect(screen.getByText("Oran Berry-sprite")).toBeTruthy();
    expect(screen.getByText("transfer-actions-Riolu")).toBeTruthy();

    await user.click(screen.getAllByRole("button")[0]!);
    let updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ locked: true });

    await user.click(screen.getByRole("button", { name: "Naturaleza" }));
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ nature: "Adamant" });

    await user.click(screen.getByRole("button", { name: "Ability" }));
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ ability: "Steadfast" });

    await user.click(screen.getByRole("button", { name: "Held item" }));
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ item: "Leftovers" });
  });
});
