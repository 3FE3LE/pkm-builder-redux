import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditorProfileSection } from "../../components/team/EditorProfileSection";

describe("EditorProfileSection", () => {
  it("resets the ability to a valid one when the resolved species abilities change", async () => {
    const updateEditorMember = vi.fn();

    render(
      <EditorProfileSection
        member={
          {
            id: "1",
            species: "Lucario",
            nickname: "Lucario",
            locked: false,
            shiny: false,
            level: 30,
            gender: "unknown",
            nature: "Serious",
            ability: "Prankster",
            item: "",
            moves: [],
            ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
            evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
          } as never
        }
        resolved={
          {
            abilities: ["Steadfast", "Inner Focus"],
          } as never
        }
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
      />,
    );

    await waitFor(() => {
      expect(updateEditorMember).toHaveBeenCalled();
    });

    const updater = updateEditorMember.mock.calls[0]?.[0];
    expect(
      updater({
        id: "1",
        species: "Lucario",
        nickname: "Lucario",
        locked: false,
        shiny: false,
        level: 30,
        gender: "unknown",
        nature: "Serious",
        ability: "Prankster",
        item: "",
        moves: [],
        ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      }),
    ).toMatchObject({
      ability: "Steadfast",
    });
  });

  it("clears the current ability when changing to another species", async () => {
    const user = userEvent.setup();
    const updateEditorMember = vi.fn();

    render(
      <EditorProfileSection
        member={
          {
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
          } as never
        }
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
      />,
    );

    await user.click(screen.getByRole("button", { name: /pokemon/i }));
    await user.clear(screen.getByRole("textbox"));
    await user.click(screen.getAllByRole("button", { name: /lucario/i }).at(-1)!);

    expect(updateEditorMember).toHaveBeenCalled();
    const updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(
      updater({
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
      }),
    ).toMatchObject({
      species: "Lucario",
      ability: "",
    });
  });
});
