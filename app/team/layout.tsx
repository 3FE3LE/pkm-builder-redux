import { BuilderProvider } from "@/components/BuilderProvider";
import { getBuilderPageData } from "@/lib/builderPageData";

export default function TeamLayout({
  children,
  editor,
}: {
  children: React.ReactNode;
  editor: React.ReactNode;
}) {
  const data = getBuilderPageData();

  return (
    <BuilderProvider {...data}>
      {children}
      {editor}
    </BuilderProvider>
  );
}
