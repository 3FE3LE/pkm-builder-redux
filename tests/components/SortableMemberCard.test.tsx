import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  reducedMotion: false,
  sortable: {
    attributes: { "data-sortable": "true" },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: "transform 200ms ease",
    isDragging: false,
  },
}));

vi.mock("motion/react", () => ({
  useReducedMotion: () => mocked.reducedMotion,
  motion: {
    div: ({
      children,
      animate: _animate,
      transition: _transition,
      ...props
    }: {
      children?: ReactNode;
      animate?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => mocked.sortable,
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: (transform: unknown) =>
        transform && typeof transform === "object"
          ? "translate3d(10px, 12px, 0)"
          : undefined,
    },
  },
}));

vi.mock("@/components/BuilderShared", () => ({
  ItemSprite: ({
    name,
    sprite,
  }: {
    name: string;
    sprite?: string | null;
  }) => <span>{`item-${name}-${sprite ?? "none"}`}</span>,
  PokemonSprite: ({
    species,
    spriteUrl,
    isEvolving,
    size,
  }: {
    species: string;
    spriteUrl?: string;
    isEvolving?: boolean;
    size?: string;
  }) => <span>{`sprite-${species}-${spriteUrl ?? "none"}-${size ?? "default"}-${isEvolving ? "evo" : "idle"}`}</span>,
  TypeBadge: ({ type }: { type: string }) => <span>{type}</span>,
}));

vi.mock("@/components/team/UI", () => ({
  MiniPill: ({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) => <span className={className}>{children}</span>,
}));

import { SortableMemberCard } from "@/components/team/workspace/roster/SortableMemberCard";

beforeEach(() => {
  mocked.reducedMotion = false;
  mocked.sortable = {
    attributes: { "data-sortable": "true" },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: "transform 200ms ease",
    isDragging: false,
  };
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("pointer: coarse") ? false : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as never;
});

function createMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "member-1",
    species: "Lucario",
    nickname: "Aura",
    locked: false,
    shiny: false,
    level: 42,
    gender: "male",
    nature: "Jolly",
    ability: "Inner Focus",
    item: "Leftovers",
    moves: ["Aura Sphere"],
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ...overrides,
  } as never;
}

function createResolved(overrides: Record<string, unknown> = {}) {
  return {
    species: "Lucario",
    spriteUrl: "/lucario.png",
    animatedSpriteUrl: "/lucario.gif",
    supportsGender: true,
    resolvedTypes: ["Fighting", "Steel"],
    natureEffect: { up: "spe", down: "spa" },
    abilityDetails: { effect: "No flinch." },
    itemDetails: { effect: "Recovers HP", sprite: "/leftovers.png" },
    resolvedStats: { bst: 525 },
    summaryStats: { bst: 525 },
    effectiveStats: { bst: 600 },
    ...overrides,
  } as never;
}

describe("SortableMemberCard", () => {
  it("renders desktop and mobile card content, custom nickname and metadata", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <SortableMemberCard
        member={createMember()}
        index={0}
        resolved={createResolved()}
        weather="clear"
        isEvolving={false}
        isSelected
        hasActiveSelection
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Aura")).toBeTruthy();
    expect(screen.getAllByText("Fighting").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Steel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("item-Leftovers-/leftovers.png").length).toBe(1);
    expect(screen.getByText("sprite-Lucario-/lucario.png-default-idle")).toBeTruthy();

    await user.click(screen.getByText("Aura").closest("article") as HTMLElement);
    expect(onSelect).toHaveBeenCalled();
  });

  it("renders pending state, dragging state, and reduced-motion weather overlay", () => {
    mocked.reducedMotion = true;
    mocked.sortable = {
      ...mocked.sortable,
      transform: { x: 10, y: 12, scaleX: 1, scaleY: 1 } as never,
      isDragging: true,
    };

    const { container } = render(
      <SortableMemberCard
        member={createMember({
          species: "",
          nickname: "",
          gender: "unknown",
          nature: "",
          ability: "",
          item: "",
        })}
        index={1}
        resolved={createResolved({
          species: "",
          supportsGender: false,
          resolvedTypes: [],
          natureEffect: undefined,
          abilityDetails: null,
          itemDetails: null,
          resolvedStats: undefined,
          summaryStats: undefined,
          effectiveStats: undefined,
        })}
        weather="rain"
        isEvolving
        isSelected={false}
        hasActiveSelection
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Pokemon pendiente")).toBeTruthy();
    expect(screen.getAllByText("tipo pendiente").length).toBe(1);
    expect(screen.getByText("sprite--/lucario.png-default-evo")).toBeTruthy();
    expect(container.querySelector(".drag-surface")).toBeTruthy();
    expect((container.querySelector("article") as HTMLElement).style.transform).toContain("translate3d");
    expect(container.querySelector('.pointer-events-none.absolute.inset-0')).toBeTruthy();
  });

  it("falls back to neutral nature text and female gender rendering", () => {
    render(
      <SortableMemberCard
        member={createMember({
          nickname: "Mareep",
          species: "Mareep",
          gender: "female",
          nature: "Serious",
          ability: "Static",
          item: "",
        })}
        index={2}
        resolved={createResolved({
          species: "Mareep",
          supportsGender: true,
          resolvedTypes: ["Electric"],
          natureEffect: {},
          abilityDetails: { effect: "May paralyze." },
          itemDetails: null,
          resolvedStats: { bst: 365 },
          summaryStats: { bst: 365 },
          effectiveStats: { bst: 400 },
        })}
        weather="sun"
        isEvolving={false}
        isSelected={false}
        hasActiveSelection={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Mareep")).toBeTruthy();
    expect(screen.queryByText("Lucario")).toBeNull();
    expect(screen.getAllByText("Electric").length).toBe(1);
  });

  it("falls back to slot labels and handles nullish member fields without resolved data", () => {
    render(
      <SortableMemberCard
        member={createMember({
          species: undefined,
          nickname: "",
          gender: "unknown",
          nature: undefined,
          ability: undefined,
          item: undefined,
        })}
        index={3}
        resolved={undefined}
        weather="clear"
        isEvolving={false}
        isSelected={false}
        hasActiveSelection={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Pokemon pendiente")).toBeTruthy();
    expect(screen.getByText("sprite-Slot 4-none-default-idle")).toBeTruthy();
    expect(screen.getAllByText("tipo pendiente").length).toBe(1);
  });

  it("renders animated weather layers for sun, sand and hail when motion is enabled", () => {
    const { container, rerender } = render(
      <SortableMemberCard
        member={createMember()}
        index={0}
        resolved={createResolved()}
        weather="sun"
        isEvolving={false}
        isSelected={false}
        hasActiveSelection={false}
        onSelect={vi.fn()}
      />,
    );

    expect(container.querySelectorAll(".pointer-events-none.absolute.inset-0 div").length).toBeGreaterThan(2);

    rerender(
      <SortableMemberCard
        member={createMember()}
        index={0}
        resolved={createResolved()}
        weather="sand"
        isEvolving={false}
        isSelected={false}
        hasActiveSelection={false}
        onSelect={vi.fn()}
      />,
    );

    expect(container.querySelectorAll(".pointer-events-none.absolute.inset-0 div").length).toBeGreaterThan(1);

    rerender(
      <SortableMemberCard
        member={createMember()}
        index={0}
        resolved={createResolved()}
        weather="hail"
        isEvolving={false}
        isSelected={false}
        hasActiveSelection={false}
        onSelect={vi.fn()}
      />,
    );

    expect(container.querySelectorAll(".pointer-events-none.absolute.inset-0 div").length).toBeGreaterThan(2);
  });
});
