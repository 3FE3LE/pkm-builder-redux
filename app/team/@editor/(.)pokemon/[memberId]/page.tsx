import type { Metadata } from "next";
import { Suspense } from "react";

import { TeamEditorRoute } from "@/components/team/TeamEditorRoute";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TeamEditorModalPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;

  return (
    <Suspense fallback={null}>
      <TeamEditorRoute key={`team-editor-modal-${memberId}`} memberId={memberId} closeMode="back" />
    </Suspense>
  );
}
