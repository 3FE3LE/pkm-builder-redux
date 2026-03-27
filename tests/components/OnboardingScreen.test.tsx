import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  selection: null as "snivy" | "tepig" | "oshawott" | null,
  modalStarter: null as "snivy" | "tepig" | "oshawott" | null,
  nickname: "Blaze",
  openStarterConfirm: vi.fn(),
  setNickname: vi.fn(),
  cancelStarterConfirm: vi.fn(),
  confirmStarterSelection: vi.fn(),
}));

vi.mock("motion/react", () => ({
  motion: {
    section: ({ children, ...props }: { children?: ReactNode }) => <section {...props}>{children}</section>,
    button: ({ children, ...props }: { children?: ReactNode }) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: { children?: ReactNode }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  PokemonSprite: ({
    species,
    spriteUrl,
    isEvolving,
  }: {
    species: string;
    spriteUrl?: string;
    isEvolving?: boolean;
  }) => <div>{`sprite-${species}-${spriteUrl ?? "none"}-${isEvolving ? "evo" : "idle"}`}</div>,
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

vi.mock("@/components/team/Modals", () => ({
  OnboardingConfirmModal: (props: Record<string, any>) => (
    <div>
      <div>{`modal-${props.starterKey}`}</div>
      <div>{`modal-species-${props.species}`}</div>
      <div>{`modal-nickname-${props.nickname}`}</div>
      <div>{`modal-current-${props.currentTypes.join("|")}`}</div>
      <div>{`modal-final-${props.finalTypes.join("|") || "none"}`}</div>
      <button type="button" onClick={() => props.onNicknameChange("Shell")}>
        modal-nickname-change
      </button>
      <button type="button" onClick={() => props.onCancel()}>
        modal-cancel
      </button>
      <button type="button" onClick={() => props.onConfirm()}>
        modal-confirm
      </button>
    </div>
  ),
}));

vi.mock("@/components/BuilderProvider", () => ({
  useTeamCatalogs: () => ({
    docs: { slug: "docs" },
  }),
  useTeamOnboarding: () => ({
    selection: mocked.selection,
    modalStarter: mocked.modalStarter,
    nickname: mocked.nickname,
    actions: {
      openStarterConfirm: mocked.openStarterConfirm,
      setNickname: mocked.setNickname,
      cancelStarterConfirm: mocked.cancelStarterConfirm,
      confirmStarterSelection: mocked.confirmStarterSelection,
    },
  }),
}));

vi.mock("@/lib/domain/names", () => ({
  buildSpriteUrls: (species: string, dex: number) => ({
    spriteUrl: `/${species.toLowerCase()}-${dex}.png`,
    animatedSpriteUrl: `/${species.toLowerCase()}-${dex}.gif`,
  }),
}));

vi.mock("@/lib/teamAnalysis", () => ({
  resolvePokemonProfile: (_docs: unknown, species: string) => {
    const profiles: Record<string, { resolvedTypes: string[] }> = {
      Snivy: { resolvedTypes: ["Grass"] },
      Servine: { resolvedTypes: ["Grass"] },
      Serperior: { resolvedTypes: ["Grass", "Dragon"] },
      Tepig: { resolvedTypes: ["Fire"] },
      Pignite: { resolvedTypes: ["Fire", "Fighting"] },
      Emboar: { resolvedTypes: ["Fire", "Fighting"] },
      Oshawott: { resolvedTypes: ["Water"] },
      Dewott: { resolvedTypes: ["Water"] },
      Samurott: { resolvedTypes: ["Water", "Dark"] },
    };

    return profiles[species] ?? null;
  },
}));

import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";

describe("OnboardingScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.selection = null;
    mocked.modalStarter = null;
    mocked.nickname = "Blaze";
  });

  it("renders the three starter cards with current typing and role snippets", () => {
    render(<OnboardingScreen />);

    expect(screen.getByText("Elige tu inicial y arranca el run.")).toBeTruthy();
    expect(screen.getAllByText("Snivy").length).toBe(2);
    expect(screen.getAllByText("Tepig").length).toBe(2);
    expect(screen.getAllByText("Oshawott").length).toBe(2);
    expect(screen.getAllByText("Grass").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Fire").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Water").length).toBeGreaterThan(0);
    expect(screen.getAllByText("choose").length).toBe(3);
    expect(screen.getByText(/sprite-Snivy/)).toBeTruthy();
    expect(screen.getByText(/sprite-Tepig/)).toBeTruthy();
    expect(screen.getByText(/sprite-Oshawott/)).toBeTruthy();
  });

  it("opens starter confirmation from cards and disables non-selected starters while choosing", async () => {
    const user = userEvent.setup();
    mocked.selection = "tepig";

    render(<OnboardingScreen />);

    const snivyButton = screen.getByRole("button", { name: /Snivy/i });
    const tepigButton = screen.getByRole("button", { name: /Tepig/i });

    expect(snivyButton.getAttribute("disabled")).toBe("");
    expect(tepigButton.getAttribute("disabled")).toBe("");

    await user.click(tepigButton);
    expect(mocked.openStarterConfirm).not.toHaveBeenCalled();
  });

  it("renders the confirmation modal with current and final typing and wires modal actions", async () => {
    const user = userEvent.setup();
    mocked.modalStarter = "oshawott";
    mocked.nickname = "Shell";

    render(<OnboardingScreen />);

    expect(screen.getByText("modal-oshawott")).toBeTruthy();
    expect(screen.getByText("modal-species-Oshawott")).toBeTruthy();
    expect(screen.getByText("modal-nickname-Shell")).toBeTruthy();
    expect(screen.getByText("modal-current-Water")).toBeTruthy();
    expect(screen.getByText("modal-final-Water|Dark")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "modal-nickname-change" }));
    expect(mocked.setNickname).toHaveBeenCalledWith("Shell");

    await user.click(screen.getByRole("button", { name: "modal-cancel" }));
    expect(mocked.cancelStarterConfirm).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "modal-confirm" }));
    expect(mocked.confirmStarterSelection).toHaveBeenCalled();
  });

  it("passes distinct final types when the final typing changes", () => {
    mocked.modalStarter = "tepig";

    render(<OnboardingScreen />);

    expect(screen.getByText("modal-final-Fire|Fighting")).toBeTruthy();
  });
});
