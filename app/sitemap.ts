import type { MetadataRoute } from "next";

import { getLocalSpeciesList } from "@/lib/localDex";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const speciesEntries = getLocalSpeciesList().map((species) => ({
    url: absoluteUrl(`/team/dex/pokemon/${species.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/team/dex"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/team"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...speciesEntries,
  ];
}
