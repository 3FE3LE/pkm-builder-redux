import type { Metadata } from "next";

import { HomeLanding } from "@/components/home/HomeLanding";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blaze Black 2 Redux / Volt White 2 Redux Guide",
  description:
    "Guia y team builder para Pokemon Blaze Black 2 Redux y Volt White 2 Redux: starters, team planning, route checkpoints, matchups y coverage.",
  keywords: [
    ...siteConfig.keywords,
    "pokemon blaze black 2 redux guide",
    "pokemon volt white 2 redux guide",
    "pokemon blaze black 2 redux team builder",
    "volt white 2 redux walkthrough",
  ],
  alternates: {
    canonical: absoluteUrl("/home"),
  },
};

export default function HomePage() {
  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: absoluteUrl("/home"),
    inLanguage: "es",
    description: siteConfig.description,
    keywords: siteConfig.keywords.join(", "),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pokemon Blaze Black 2 Redux / Volt White 2 Redux Guide",
    url: absoluteUrl("/home"),
    description:
      "Guia y team builder para Pokemon Blaze Black 2 Redux y Volt White 2 Redux con planning de equipo, matchups y checkpoints.",
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: absoluteUrl("/home"),
    },
    about: [
      "Pokemon Blaze Black 2 Redux",
      "Pokemon Volt White 2 Redux",
      "Team Builder",
      "Run Guide",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <HomeLanding />
    </>
  );
}
