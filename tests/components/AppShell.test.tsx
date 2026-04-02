import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppFooter } from "@/components/AppFooter";
import { AppNav } from "@/components/AppNav";

const mockedUsePathname = vi.fn();

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    unoptimized: _unoptimized,
    ...props
  }: {
    alt: string;
    src: string;
    [key: string]: unknown;
  }) => <img alt={alt} src={src} {...props} />,
}));

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

vi.mock("next/navigation", () => ({
  usePathname: () => mockedUsePathname(),
}));

vi.mock("geist/font/pixel", () => ({
  GeistPixelCircle: { className: "geist-pixel-circle" },
}));

describe("App shell", () => {
  beforeEach(() => {
    mockedUsePathname.mockReset();
  });

  it("renders the footer with repository link", () => {
    render(<AppFooter />);

    expect(screen.getByText("Redux Team Builder")).toBeTruthy();
    const repoLink = screen.getByRole("link", { name: "GitHub Repository" });
    expect(repoLink.getAttribute("href")).toBe("https://github.com/3FE3LE/pkm-builder-redux");
  });

  it("marks the active nav destination for team routes", () => {
    mockedUsePathname.mockReturnValue("/team/pokemon/lucario");

    render(<AppNav />);

    expect(screen.getAllByRole("link", { name: "Home" }).length).toBe(2);
    expect(screen.getByRole("link", { name: /Team/ }).className).toContain("border-primary-line-strong");
    expect(screen.getByRole("link", { name: /Tools/ }).className).not.toContain("border-accent-line-strong");
    expect(screen.getByRole("link", { name: /Dex/ }).className).not.toContain("border-warning-line");
    expect(screen.getByRole("link", { name: "Settings" }).className).not.toContain("border-info-line");
    expect(screen.getAllByAltText("Snivy").length).toBe(2);
  });

  it("marks tools and settings routes independently", () => {
    mockedUsePathname.mockReturnValue("/team/tools");
    const { rerender } = render(<AppNav />);
    expect(screen.getByRole("link", { name: /Tools/ }).className).toContain("border-accent-line-strong");

    mockedUsePathname.mockReturnValue("/team/settings");
    rerender(<AppNav />);
    expect(screen.getByRole("link", { name: "Settings" }).className).toContain("border-info-line");

    mockedUsePathname.mockReturnValue("/team/dex");
    rerender(<AppNav />);
    expect(screen.getByRole("link", { name: /Dex/ }).className).toContain("border-warning-line");
  });
});
