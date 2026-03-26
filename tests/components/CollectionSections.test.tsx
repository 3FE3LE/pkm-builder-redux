import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompositionsSection } from "@/components/team/CollectionSections";

describe("CompositionsSection", () => {
  it("creates and selects compositions", async () => {
    const user = userEvent.setup();
    const onCreateComposition = vi.fn();
    const onSelectComposition = vi.fn();

    render(
      <CompositionsSection
        compositions={[
          { id: "a", name: "Alpha", memberIds: ["1"] },
          { id: "b", name: "Beta", memberIds: [] },
        ]}
        activeCompositionId="a"
        onCreateComposition={onCreateComposition}
        onSelectComposition={onSelectComposition}
        onRenameComposition={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add team/i }));
    expect(onCreateComposition).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /beta/i }));
    expect(onSelectComposition).toHaveBeenCalledWith("b");
  });

  it("renames a composition from the inline editor", async () => {
    const user = userEvent.setup();
    const onRenameComposition = vi.fn();

    render(
      <CompositionsSection
        compositions={[{ id: "a", name: "Alpha", memberIds: ["1", "2"] }]}
        activeCompositionId="a"
        onCreateComposition={vi.fn()}
        onSelectComposition={vi.fn()}
        onRenameComposition={onRenameComposition}
      />,
    );

    await user.click(screen.getByRole("button", { name: /editar nombre del equipo/i }));
    const input = screen.getByDisplayValue("Alpha");
    await user.clear(input);
    await user.type(input, "Frontline{enter}");

    expect(onRenameComposition).toHaveBeenCalledWith("a", "Frontline");
  });
});
