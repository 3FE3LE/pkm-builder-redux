import { afterEach, describe, expect, it, vi } from "vitest";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

async function loadSiteModule() {
  vi.resetModules();
  return import("../lib/site");
}

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
  vi.resetModules();
});

describe("site", () => {
  it("uses NEXT_PUBLIC_SITE_URL after trimming trailing slashes", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com///";

    const { absoluteUrl, siteConfig } = await loadSiteModule();

    expect(siteConfig.siteUrl).toBe("https://example.com");
    expect(absoluteUrl()).toBe("https://example.com/");
    expect(absoluteUrl("team")).toBe("https://example.com/team");
    expect(absoluteUrl("/team/tools")).toBe("https://example.com/team/tools");
  });

  it("falls back to the production site url when env is missing", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const { absoluteUrl, siteConfig } = await loadSiteModule();

    expect(siteConfig.siteUrl).toBe("https://pkmbuilder-redux.17suit.com");
    expect(siteConfig.shortName).toBe("Redux Team Builder");
    expect(siteConfig.keywords).toContain("pokemon blaze black 2 redux");
    expect(absoluteUrl("robots.txt")).toBe(
      "https://pkmbuilder-redux.17suit.com/robots.txt",
    );
  });
});
