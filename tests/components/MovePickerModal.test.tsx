import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MovePickerModal } from "../../components/team/MovePickerModal";

describe("MovePickerModal", () => {
  it("calls onPickMove when selecting an available move for an empty slot", async () => {
    const user = userEvent.setup();
    const onPickMove = vi.fn();

    render(
      <MovePickerModal
        member={
          {
            item: "",
            ability: "",
            itemDetails: null,
            abilityDetails: null,
            resolvedTypes: ["Grass"],
            learnsets: {
              levelUp: [
                {
                  level: 7,
                  move: "Vine Whip",
                  details: {
                    name: "Vine Whip",
                    type: "Grass",
                    damageClass: "physical",
                    power: 45,
                    accuracy: 100,
                    pp: 25,
                    description: "A basic Grass attack.",
                  },
                },
              ],
              machines: [],
            },
          } as never
        }
        currentMoves={["Tackle"]}
        slotIndex={null}
        tab="levelUp"
        weather="clear"
        onTabChange={() => {}}
        onClose={() => {}}
        onPickMove={onPickMove}
        getMoveSurfaceStyle={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: /vine whip/i }));

    expect(onPickMove).toHaveBeenCalledWith("Vine Whip");
  });

  it("disables adding a move that already exists in another slot while replacing", () => {
    render(
      <MovePickerModal
        member={
          {
            item: "",
            ability: "",
            itemDetails: null,
            abilityDetails: null,
            resolvedTypes: ["Grass"],
            learnsets: {
              levelUp: [
                {
                  level: 1,
                  move: "Tackle",
                  details: {
                    name: "Tackle",
                    type: "Normal",
                    damageClass: "physical",
                    power: 40,
                    accuracy: 100,
                    pp: 35,
                    description: "A tackle.",
                  },
                },
              ],
              machines: [],
            },
          } as never
        }
        currentMoves={["Tackle", "Growl"]}
        slotIndex={1}
        tab="levelUp"
        weather="clear"
        onTabChange={() => {}}
        onClose={() => {}}
        onPickMove={() => {}}
        getMoveSurfaceStyle={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /tackle/i }).hasAttribute("disabled")).toBe(true);
  });

  it("allows selecting the current move again while replacing and switches tabs", async () => {
    const user = userEvent.setup();
    const onPickMove = vi.fn();
    const onTabChange = vi.fn();

    render(
      <MovePickerModal
        member={
          {
            item: "",
            ability: "",
            itemDetails: null,
            abilityDetails: null,
            resolvedTypes: ["Grass"],
            learnsets: {
              levelUp: [
                {
                  level: 1,
                  move: "Growl",
                  details: {
                    name: "Growl",
                    type: "Normal",
                    damageClass: "status",
                    power: null,
                    accuracy: 100,
                    pp: 40,
                    description: "Lowers Attack.",
                  },
                },
              ],
              machines: [
                {
                  source: "TM21",
                  move: "Frustration",
                  details: {
                    name: "Frustration",
                    type: "Normal",
                    damageClass: "physical",
                    power: 1,
                    accuracy: 100,
                    pp: 20,
                    description: "Depends on friendship.",
                  },
                },
              ],
            },
          } as never
        }
        currentMoves={["Tackle", "Growl"]}
        slotIndex={1}
        tab="levelUp"
        weather="clear"
        onTabChange={onTabChange}
        onClose={() => {}}
        onPickMove={onPickMove}
        getMoveSurfaceStyle={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: /growl/i }));
    expect(onPickMove).toHaveBeenCalledWith("Growl");

    await user.click(screen.getByRole("button", { name: /tm 1/i }));
    expect(onTabChange).toHaveBeenCalledWith("machines");
  });

  it("calls onClose and shows empty state when a tab has no moves", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MovePickerModal
        member={
          {
            item: "",
            ability: "",
            itemDetails: null,
            abilityDetails: null,
            resolvedTypes: ["Grass"],
            learnsets: {
              levelUp: [],
              machines: [],
            },
          } as never
        }
        currentMoves={[]}
        slotIndex={null}
        tab="machines"
        weather="clear"
        onTabChange={() => {}}
        onClose={onClose}
        onPickMove={() => {}}
        getMoveSurfaceStyle={() => undefined}
      />,
    );

    expect(screen.getByText(/no hay movimientos en esta pestaña/i)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /close move picker/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
