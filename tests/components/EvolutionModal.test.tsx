import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  PokemonSprite: ({
    species,
    spriteUrl,
    size,
    isEvolving,
  }: {
    species: string;
    spriteUrl?: string;
    size?: string;
    isEvolving?: boolean;
  }) => <div>{`sprite-${species}-${spriteUrl ?? "none"}-${size ?? "default"}-${isEvolving ? "evo" : "idle"}`}</div>,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    title,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  ),
}));

import { EvolutionModal } from "@/components/team/EvolutionModal";

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    open: true,
    currentSpecies: "Pignite",
    currentSpriteUrl: "/pignite.png",
    currentAnimatedSpriteUrl: "/pignite.gif",
    nextOptions: [
      {
        species: "Emboar",
        spriteUrl: "/emboar.png",
        animatedSpriteUrl: "/emboar.gif",
        eligible: true,
      },
      {
        species: "Tepig",
        spriteUrl: "/tepig.png",
        animatedSpriteUrl: "/tepig.gif",
        eligible: false,
        reasons: ["Trade locked", "Friendship missing"],
      },
    ],
    selectedNext: "Emboar",
    onSelectNext: vi.fn(),
    onClose: vi.fn(),
    onComplete: vi.fn(),
    ...overrides,
  };
}

describe("EvolutionModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("returns null when closed", () => {
    const { container } = render(<EvolutionModal {...buildProps({ open: false })} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders the confirm state, selection buttons, preview cards, and close action", async () => {
    const props = buildProps();

    render(<EvolutionModal {...props} />);

    expect(screen.getByText("Confirmar evolución")).toBeTruthy();
    expect(
      screen.getByText("Confirma la siguiente forma y arranca la secuencia cuando quieras."),
    ).toBeTruthy();
    expect(screen.getByText("Forma actual")).toBeTruthy();
    expect(screen.getByText("Siguiente forma")).toBeTruthy();
    expect(screen.getByText("sprite-Pignite-/pignite.png-large-idle")).toBeTruthy();
    expect(screen.getByText("sprite-Emboar-/emboar.png-large-idle")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Emboar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tepig" }).getAttribute("title")).toBe(
      "Trade locked · Friendship missing",
    );
    expect(screen.getByRole("button", { name: "Tepig" }).getAttribute("disabled")).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Emboar" }));
    expect(props.onSelectNext).toHaveBeenCalledWith("Emboar");

    fireEvent.click(screen.getByRole("button", { name: "" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("shows the empty next form state and disables evolution when nothing is selectable", () => {
    render(
      <EvolutionModal
        {...buildProps({
          nextOptions: [],
          selectedNext: null,
        })}
      />,
    );

    expect(screen.getByText("No hay evolución disponible.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Iniciar evolución" }).getAttribute("disabled")).toBe(
      "",
    );
  });

  it("plays the animation stages and completes the selected evolution", async () => {
    const props = buildProps();

    render(<EvolutionModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar evolución" }));

    expect(screen.getByText("Evolucionando...")).toBeTruthy();
    expect(
      screen.getByText("La secuencia se puede saltar, pero está pensada para sentirse más ceremonial."),
    ).toBeTruthy();
    expect(screen.getAllByText("...").length).toBe(2);
    expect(screen.getByText("Skip")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByText("Pignite?")).toBeTruthy();
    expect(screen.getByText("?")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getAllByText(/What\?/).length).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Pignite evolved into Emboar!")).toBeTruthy();
    expect(screen.getByText("Congratulations!")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(props.onComplete).toHaveBeenCalledWith("Emboar");
  });

  it("skips the animation and completes immediately", async () => {
    const props = buildProps();

    render(<EvolutionModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar evolución" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(props.onComplete).toHaveBeenCalledWith("Emboar");
  });
});
