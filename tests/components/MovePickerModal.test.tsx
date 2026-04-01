import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MovePickerModal } from "../../components/team/editor/MovePickerModal";

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

  it("disables adding a new move when the set is already full and marks already picked moves", async () => {
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
                {
                  level: 5,
                  move: "Leaf Tornado",
                  details: {
                    name: "Leaf Tornado",
                    type: "Grass",
                    damageClass: "special",
                    power: 65,
                    accuracy: 90,
                    pp: 10,
                    description: "A twisting leaf storm.",
                  },
                },
              ],
              machines: [],
            },
          } as never
        }
        currentMoves={["Tackle", "Growl", "Vine Whip", "Wrap"]}
        slotIndex={null}
        tab="levelUp"
        weather="clear"
        onTabChange={() => {}}
        onClose={() => {}}
        onPickMove={onPickMove}
        getMoveSurfaceStyle={() => undefined}
      />,
    );

    expect(screen.getByText("picked")).toBeTruthy();
    expect(screen.getByRole("button", { name: /leaf tornado/i }).hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: /leaf tornado/i }));
    expect(onPickMove).not.toHaveBeenCalled();
  });

  it("shows weather-adjusted power and current label for the replaced move", () => {
    render(
      <MovePickerModal
        member={
          {
            item: "Charcoal",
            ability: "Blaze",
            itemDetails: { effect: "Boosts the power of Fire-type moves by 20%." },
            abilityDetails: { effect: "Powers up Fire-type moves when in trouble." },
            resolvedTypes: ["Fire"],
            learnsets: {
              levelUp: [
                {
                  level: 1,
                  move: "Weather Ball",
                  details: {
                    name: "Weather Ball",
                    type: "Normal",
                    damageClass: "special",
                    power: 50,
                    accuracy: 100,
                    pp: 10,
                    description: "Changes with the weather.",
                  },
                },
              ],
              machines: [],
            },
          } as never
        }
        currentMoves={["Weather Ball", "Smokescreen"]}
        slotIndex={0}
        tab="levelUp"
        weather="sun"
        onTabChange={() => {}}
        onClose={() => {}}
        onPickMove={() => {}}
        getMoveSurfaceStyle={() => undefined}
      />,
    );

    expect(screen.getByText("current")).toBeTruthy();
    expect(screen.getByText("100→180")).toBeTruthy();
    expect(screen.getByRole("button", { name: /weather ball/i }).getAttribute("aria-pressed")).toBe("true");
  });
});
