const FALLBACK_SITE_URL = "https://pkmbuilder-redux.17suit.com";

function normalizeSiteUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

function resolveSiteUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.SITE_URL) ??
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteUrl(process.env.VERCEL_URL) ??
    FALLBACK_SITE_URL
  );
}

export const siteConfig = {
  name: "Pokemon Blaze Black 2 / Volt White 2 Redux Team Builder",
  shortName: "Redux Team Builder",
  description:
    "Team builder, route planner y run guide para Pokemon Blaze Black 2 Redux y Volt White 2 Redux, con roster planner, coverage, matchups y checkpoints.",
  siteUrl: resolveSiteUrl(),
  keywords: [
    "pokemon blaze black 2 redux",
    "pokemon volt white 2 redux",
    "blaze black 2 redux team builder",
    "volt white 2 redux team builder",
    "pokemon black blaze",
    "pokemon bolwhite 2 redux",
    "pokemon blaze black 2 guide",
    "pokemon volt white 2 guide",
    "pokemon blaze black 2 docs",
    "volt white 2 redux docs",
    "pokemon redux team planner",
    "pokemon challenge mode planner",
    "pokemon unova redux builder",
  ],
} as const;

export function absoluteUrl(path = "/") {
  return `${siteConfig.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
