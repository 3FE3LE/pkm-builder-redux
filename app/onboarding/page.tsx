import { BuilderOnboarding } from "@/components/onboarding/OnboardingApp";
import { getBuilderPageData } from "@/lib/builderPageData";

export default function OnboardingPage() {
  const data = getBuilderPageData();

  return <BuilderOnboarding {...data} />;
}
