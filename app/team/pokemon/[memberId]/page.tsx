import type { Metadata } from "next";
import { Suspense } from "react";

import { EditorPageRoute } from "@/components/team/editor/PageRoute";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Edit Team Member",
  description: "Editor de Pokemon dentro del team builder.",
  alternates: {
    canonical: absoluteUrl("/team"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TeamPokemonPage({
  params: _params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <EditorPageRoute />
    </Suspense>
  );
}
