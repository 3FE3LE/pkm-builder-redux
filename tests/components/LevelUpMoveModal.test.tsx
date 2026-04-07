import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LevelUpMoveModal } from "@/components/team/editor/LevelUpMoveModal";

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

describe("LevelUpMoveModal", () => {
  it("learns directly when there is a free move slot", async () => {
    const user = userEvent.setup();
    const onLearn = vi.fn();

    render(
      <LevelUpMoveModal
        open
        member={
          {
            species: "Snivy",
            item: "",
            ability: "",
            itemDetails: null,
            abilityDetails: null,
            resolvedTypes: ["Grass"],
            moves: [],
          } as never
        }
        currentMoves={["Tackle"]}
        weather="clear"
        queuedMoves={[
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
        ]}
        onClose={() => {}}
        onLearn={onLearn}
        onSkip={() => {}}
        onReplace={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /aprender/i }));

    expect(onLearn).toHaveBeenCalled();
  });

  it("switches to replacement mode when the moveset is full", async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();

    render(
      <LevelUpMoveModal
        open
        member={
          {
            species: "Snivy",
            item: "",
            ability: "",
            itemDetails: null,
            abilityDetails: null,
            resolvedTypes: ["Grass"],
            moves: [
              { name: "Tackle", type: "Normal", damageClass: "physical", power: 40 },
              { name: "Growl", type: "Normal", damageClass: "status" },
              { name: "Wrap", type: "Normal", damageClass: "physical", power: 15 },
              { name: "Leaf Tornado", type: "Grass", damageClass: "special", power: 65, hasStab: true },
            ],
          } as never
        }
        currentMoves={["Tackle", "Growl", "Wrap", "Leaf Tornado"]}
        weather="clear"
        queuedMoves={[
          {
            level: 13,
            move: "Slam",
            details: {
              name: "Slam",
              type: "Normal",
              damageClass: "physical",
              power: 80,
              accuracy: 75,
              pp: 20,
              description: "A heavy body slam.",
            },
          },
        ]}
        onClose={() => {}}
        onLearn={() => {}}
        onSkip={() => {}}
        onReplace={onReplace}
      />,
    );

    await user.click(screen.getByRole("button", { name: /reemplazar movimiento/i }));
    await user.click(screen.getByRole("button", { name: /tackle/i }));

    expect(onReplace).toHaveBeenCalledWith(0);
  });

  it("allows skipping the queued move", async () => {
    const user = userEvent.setup();
    const onSkip = vi.fn();

    render(
      <LevelUpMoveModal
        open
        member={
          {
            species: "Snivy",
            item: "",
            ability: "",
            itemDetails: null,
            abilityDetails: null,
            resolvedTypes: ["Grass"],
            moves: [],
          } as never
        }
        currentMoves={["Tackle"]}
        weather="clear"
        queuedMoves={[{ level: 7, move: "Vine Whip" }]}
        onClose={() => {}}
        onLearn={() => {}}
        onSkip={onSkip}
        onReplace={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /omitir/i }));

    expect(onSkip).toHaveBeenCalled();
  });
});
