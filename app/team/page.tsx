import { BuilderApp } from "@/components/team/TeamApp";
import { getBuilderPageData } from "@/lib/builderPageData";

export default function TeamPage() {
  const data = getBuilderPageData();

  return <BuilderApp {...data} />;
}
