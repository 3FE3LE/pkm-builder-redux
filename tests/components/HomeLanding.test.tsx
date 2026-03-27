import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeLanding } from "@/components/home/HomeLanding";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("geist/font/pixel", () => ({
  GeistPixelCircle: { className: "geist-pixel-circle" },
}));

describe("HomeLanding", () => {
  it("renders hero content, highlights, documentation sources and primary actions", () => {
    render(<HomeLanding />);

    expect(screen.getByText("Redux v1.4.1")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /arma tu equipo/i })).toBeTruthy();
    expect(screen.getByText("Builder centrado en la run")).toBeTruthy();
    expect(screen.getByText("Path por encounters")).toBeTruthy();
    expect(screen.getByText("Intel de matchup")).toBeTruthy();
    expect(screen.getByText("Pokemon Changes")).toBeTruthy();
    expect(screen.getByText("Trade Changes")).toBeTruthy();
    expect(screen.getByText("Creditos")).toBeTruthy();
    expect(screen.getByText("Fuentes usadas")).toBeTruthy();

    const onboardingLinks = screen.getAllByRole("link", { name: /onboarding|empezar a planear la run/i });
    expect(onboardingLinks.some((link) => link.getAttribute("href") === "/onboarding")).toBe(true);
    expect(screen.getAllByRole("link", { name: /team/i }).some((link) => link.getAttribute("href") === "/team")).toBe(true);
  });
});
