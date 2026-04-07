import type { Metadata } from "next";
import { Suspense } from "react";

import { BuilderOnboarding } from "@/components/onboarding/OnboardingApp";
import { getBuilderPageData } from "@/lib/builderPageData";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Start Run",
  description: "Flujo inicial para crear una run en el team builder.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
  const data = getBuilderPageData();

  return (
    <Suspense fallback={null}>
      <BuilderOnboarding {...data} />
    </Suspense>
  );
}
