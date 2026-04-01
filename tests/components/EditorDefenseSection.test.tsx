import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/team/UI", () => ({
  CoverageBadge: ({
    label,
    bucket,
  }: {
    label: string;
    bucket: string;
  }) => <div>{`${label}-${bucket}`}</div>,
}));

import { EditorDefenseSection } from "@/components/team/editor/DefenseSection";

describe("EditorDefenseSection", () => {
  it("shows a fallback when there is no valid species selected", () => {
    render(<EditorDefenseSection />);

    expect(
      screen.getByText(/selecciona una especie válida para revisar debilidades/i),
    ).toBeTruthy();
  });

  it("renders weaknesses, resistances, and stab coverage buckets for resolved types", () => {
    render(
      <EditorDefenseSection
        resolved={
          {
            resolvedTypes: ["Water", "Flying"],
          } as never
        }
      />,
    );

    expect(screen.getByText("Electric-x4")).toBeTruthy();
    expect(screen.getByText("Ground-x0")).toBeTruthy();
    expect(screen.getByText("Fire-x2")).toBeTruthy();
    expect(screen.getAllByText("Water-x0.5").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rock-x2").length).toBeGreaterThan(0);
    expect(screen.getByText("Dragon-x0.5")).toBeTruthy();
  });
});
