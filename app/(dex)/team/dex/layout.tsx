import { Suspense } from "react";

import { BuilderProvider } from "@/components/BuilderProvider";
import { getDexPageData } from "@/lib/builderPageData";

export default function TeamDexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = getDexPageData();

  return (
    <Suspense fallback={null}>
      <BuilderProvider {...data}>{children}</BuilderProvider>
    </Suspense>
  );
}
