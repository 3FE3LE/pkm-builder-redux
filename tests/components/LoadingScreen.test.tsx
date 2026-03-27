import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingScreen } from "@/components/team/LoadingScreen";

describe("LoadingScreen", () => {
  it("renders the loading copy for the team builder", () => {
    render(<LoadingScreen />);

    expect(screen.getByText("Cargando builder")).toBeTruthy();
    expect(
      screen.getByText("Rehidratando el estado persistido del equipo, checkpoint y flags del run."),
    ).toBeTruthy();
  });
});
