import type { Metadata } from "next";

import { SettingsScreen } from "@/components/team/screens/SettingsScreen";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Builder Settings",
  description:
    "Configura preferencias del team builder para Blaze Black 2 Redux y Volt White 2 Redux, incluyendo restricciones y contexto de analisis.",
  keywords: [
    ...siteConfig.keywords,
    "pokemon builder settings",
    "blaze black 2 redux settings",
    "volt white 2 redux team preferences",
  ],
  alternates: {
    canonical: absoluteUrl("/team/settings"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TeamSettingsPage() {
  return <SettingsScreen />;
}
