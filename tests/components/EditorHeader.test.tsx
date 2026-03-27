import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/BuilderShared", () => ({
  PokemonSprite: ({ species }: { species: string }) => <div>{species}-sprite</div>,
  TypeBadge: ({ type }: { type: string }) => <div>{type}</div>,
}));

vi.mock("@/components/team/UI", () => ({
  MiniPill: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SpreadInput: ({
    label,
    onChange,
    error,
  }: {
    label: string;
    onChange: (value: number) => void;
    error?: string;
  }) => (
    <div>
      <button type="button" aria-label={label} onClick={() => onChange(150)}>
        {label}
      </button>
      {error ? <span>{error}</span> : null}
    </div>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/Input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

import { EditorHeader } from "@/components/team/EditorHeader";

function createMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    species: "Riolu",
    nickname: "Rio",
    locked: false,
    shiny: false,
    level: 20,
    gender: "unknown",
    nature: "Serious",
    ability: "",
    item: "",
    moves: [],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ...overrides,
  };
}

describe("EditorHeader", () => {
  it("renders resolved profile info, supports nickname editing, and updates shiny, gender, and level", async () => {
    const user = userEvent.setup();
    const updateEditorMember = vi.fn();
    const onRequestEvolution = vi.fn();

    render(
      <EditorHeader
        member={createMember() as never}
        resolved={
          {
            species: "Lucario",
            spriteUrl: "/lucario.png",
            animatedSpriteUrl: "/lucario.gif",
            resolvedTypes: ["Fighting", "Steel"],
            supportsGender: true,
            evolutionHints: [
              { target: "Lucario", method: "Friendship", summary: "Friendship at day" },
              { target: "Mega Lucario", method: "Mega Stone", summary: "Battle only" },
              { target: "Ignored", method: "Other", summary: "Should not render" },
            ],
          } as never
        }
        currentSpecies="Riolu"
        currentLevel={20}
        currentGender="unknown"
        currentShiny={false}
        getIssue={(field) => (field === "level" ? "Level issue" : undefined)}
        hasEvolution
        updateEditorMember={updateEditorMember}
        onRequestEvolution={onRequestEvolution}
      />,
    );

    expect(screen.getByText("Lucario-sprite")).toBeTruthy();
    expect(screen.getByText("Lucario")).toBeTruthy();
    expect(screen.getByText("Fighting")).toBeTruthy();
    expect(screen.getByText("Steel")).toBeTruthy();
    expect(screen.getByText("Next: Lucario · Friendship")).toBeTruthy();
    expect(screen.getByText("Next: Mega Lucario · Mega Stone")).toBeTruthy();
    expect(screen.queryByText(/Ignored/)).toBeNull();
    expect(screen.getAllByText("Level issue").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /toggle shiny/i }));
    let updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ shiny: true });

    await user.click(screen.getByRole("button", { name: /set male/i }));
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ gender: "male" });

    await user.click(screen.getByRole("button", { name: /set female/i }));
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ gender: "female" });

    await user.click(screen.getByRole("button", { name: /editar nickname/i }));
    const nicknameInput = screen.getByDisplayValue("Rio");
    expect(nicknameInput.getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("button", { name: /bloquear nickname/i })).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: "LV" })[0]!);
    updater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(updater(createMember())).toMatchObject({ level: 100 });

    await user.click(screen.getAllByRole("button", { name: /abrir evolución/i })[0]!);
    expect(onRequestEvolution).toHaveBeenCalled();
  });

  it("falls back to pending placeholders, hides gender controls, and shows blocked evolution reason", async () => {
    const user = userEvent.setup();
    const updateEditorMember = vi.fn();
    const onRequestEvolution = vi.fn();

    render(
      <EditorHeader
        member={createMember({ nickname: "" }) as never}
        currentSpecies=""
        currentLevel={12}
        currentGender="unknown"
        currentShiny
        getIssue={() => undefined}
        hasEvolution={false}
        evolutionBlockReason="Necesita item especial"
        updateEditorMember={updateEditorMember}
        onRequestEvolution={onRequestEvolution}
      />,
    );

    expect(screen.getByText("-sprite")).toBeTruthy();
    expect(screen.getAllByText("Pokemon pendiente").length).toBeGreaterThan(0);
    expect(screen.getByText("tipo pendiente")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /set male/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /set female/i })).toBeNull();
    expect(screen.getAllByText("Necesita item especial").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /necesita item especial/i })[0]?.getAttribute("disabled")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: /toggle shiny/i }));
    const shinyUpdater = updateEditorMember.mock.calls.at(-1)?.[0];
    expect(shinyUpdater(createMember({ shiny: true }))).toMatchObject({ shiny: false });
    expect(onRequestEvolution).not.toHaveBeenCalled();
  });

  it("updates nickname text and renders hint fallbacks and active gender states", async () => {
    const user = userEvent.setup();
    const updateEditorMember = vi.fn();

    const { rerender } = render(
      <EditorHeader
        member={createMember({ nickname: "Riolu" }) as never}
        resolved={
          {
            species: "Lucario",
            resolvedTypes: ["Fighting"],
            supportsGender: true,
            evolutionHints: [{ target: "Lucario", summary: "Friendship only" }],
          } as never
        }
        currentSpecies={"Riolu" as never}
        currentLevel={20}
        currentGender="male"
        currentShiny={false}
        getIssue={() => undefined}
        hasEvolution
        updateEditorMember={updateEditorMember}
        onRequestEvolution={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /editar nickname/i }));
    const nicknameInput = screen.getByDisplayValue("Riolu");
    fireEvent.change(nicknameInput, { target: { value: "Aura" } });

    expect(updateEditorMember).toHaveBeenCalled();
    expect(screen.getByText("Next: Lucario")).toBeTruthy();

    expect(screen.getByRole("button", { name: /set male/i }).className).toContain("border-info-line");

    rerender(
      <EditorHeader
        member={createMember({ nickname: "" }) as never}
        resolved={
          {
            species: undefined,
            resolvedTypes: [],
            supportsGender: true,
            evolutionHints: [],
          } as never
        }
        currentSpecies={undefined as never}
        currentLevel={12}
        currentGender="female"
        currentShiny={false}
        getIssue={() => undefined}
        hasEvolution={false}
        updateEditorMember={updateEditorMember}
        onRequestEvolution={vi.fn()}
      />,
    );

    expect(screen.getByText("Pokemon-sprite")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /sin evolución disponible/i })[0]).toBeTruthy();
    expect(screen.getByRole("button", { name: /set female/i }).className).toContain("border-danger-line");
  });
});
