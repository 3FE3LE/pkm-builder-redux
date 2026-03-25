import { Suspense } from "react";

import { BuilderOnboarding } from "@/components/onboarding/OnboardingApp";
import { getBuilderPageData } from "@/lib/builderPageData";

export default function OnboardingPage() {
  const data = getBuilderPageData();

  return (
    <Suspense fallback={null}>
      <BuilderOnboarding {...data} />
    </Suspense>
  );
}
