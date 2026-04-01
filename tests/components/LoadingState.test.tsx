import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingState } from "@/components/team/screens/LoadingState";

describe("LoadingState", () => {
  it("renders the loading copy for the team builder", () => {
    render(<LoadingState />);

    expect(screen.getByText("Cargando builder")).toBeTruthy();
    expect(
      screen.getByText("Rehidratando el estado persistido del equipo, checkpoint y flags del run."),
    ).toBeTruthy();
  });
});
