import type { Metadata } from "next";
import { Suspense } from "react";

import { EditorRoute } from "@/components/team/editor/Route";

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
      <EditorRoute key={`team-editor-modal-${memberId}`} memberId={memberId} closeMode="back" />
    </Suspense>
  );
}
