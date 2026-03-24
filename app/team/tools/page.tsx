import { Suspense } from "react";

import { TeamToolsScreen } from "@/components/team/TeamToolsScreen";

export default function TeamToolsPage() {
  return (
    <Suspense fallback={null}>
      <TeamToolsScreen />
    </Suspense>
  );
}
