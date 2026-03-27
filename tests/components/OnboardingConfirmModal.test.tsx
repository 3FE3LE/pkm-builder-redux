import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
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
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children?: ReactNode;
    onClick?: () => void;
  }) => <button type="button" onClick={onClick}>{children}</button>,
}));

vi.mock("@/components/ui/Input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

import { OnboardingConfirmModal } from "@/components/onboarding/OnboardingConfirmModal";

describe("OnboardingConfirmModal", () => {
  it("renders starter confirmation details and wires actions", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const onNicknameChange = vi.fn();

    render(
      <OnboardingConfirmModal
        starterKey="tepig"
        species="Pignite"
        spriteUrl="/pignite.png"
        animatedSpriteUrl="/pignite.gif"
        currentTypes={["Fire", "Fighting"]}
        finalTypes={["Fire", "Fighting"]}
        nickname="Blaze"
        onNicknameChange={onNicknameChange}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Confirmar inicial")).toBeTruthy();
    expect(screen.getByText("Pignite")).toBeTruthy();
    expect(screen.getAllByText("Fire").length).toBe(2);
    expect(screen.getAllByText("Fighting").length).toBe(2);
    expect(screen.getByText("Tipo final")).toBeTruthy();
    expect(screen.getByText("sprite-Pignite-/pignite.png")).toBeTruthy();

    await user.type(screen.getByPlaceholderText("Ej: Pignite"), " X");
    expect(onNicknameChange).toHaveBeenLastCalledWith("BlazeX");

    await user.click(screen.getByRole("button", { name: "Confirmar y empezar" }));
    expect(onConfirm).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("omits final type section when there is no final typing", () => {
    render(
      <OnboardingConfirmModal
        starterKey="snivy"
        species="Snivy"
        currentTypes={["Grass"]}
        finalTypes={[]}
        nickname=""
        onNicknameChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByText("Tipo final")).toBeNull();
  });
});
