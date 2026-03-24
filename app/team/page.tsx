import { Suspense } from "react";

import { TeamWorkspace } from "@/components/team/TeamApp";

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamWorkspace />
    </Suspense>
  );
}
