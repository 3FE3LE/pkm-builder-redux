import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CompareMemberPanel, buildCompareState } from "../../components/team/CompareModalSections";

describe("CompareMemberPanel", () => {
  it("reconciles an invalid ability to one valid for the resolved species", async () => {
    const onChangeMember = vi.fn();

    const member = {
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
    } as never;

    const state = buildCompareState(
      member,
      {
        abilities: ["Steadfast", "Inner Focus"],
        resolvedTypes: ["Fighting", "Steel"],
      } as never,
      [],
      [],
      "clear",
    );

    render(
      <CompareMemberPanel
        index={0}
        state={state}
        speciesCatalog={[]}
        heldItemCatalog={[]}
        onChangeMember={onChangeMember}
      />,
    );

    await waitFor(() => {
      expect(onChangeMember).toHaveBeenCalledWith(
        0,
        expect.objectContaining({ ability: "Steadfast" }),
      );
    });
  });
});
