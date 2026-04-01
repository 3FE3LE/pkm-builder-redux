import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteGuardScreen } from "@/components/team/screens/RouteGuardScreen";

describe("RouteGuardScreen", () => {
  it("renders the protected route hint and CTA", () => {
    render(
      <RouteGuardScreen
        title="No hay run activo"
        description="Elige un inicial para crear el equipo."
        ctaHref="/onboarding"
        ctaLabel="Ir a onboarding"
      />,
    );

    expect(screen.getByText("Ruta protegida")).toBeTruthy();
    expect(screen.getByText("No hay run activo")).toBeTruthy();
    expect(screen.getByText("Elige un inicial para crear el equipo.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir a onboarding" }).getAttribute("href")).toBe(
      "/onboarding",
    );
  });
});
