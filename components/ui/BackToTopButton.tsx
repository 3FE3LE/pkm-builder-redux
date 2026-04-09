"use client";

import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { useBuilderStore } from "@/lib/builderStore";

const BACK_TO_TOP_SCROLL_THRESHOLD = 640;

export function BackToTopButton() {
  const pathname = usePathname() ?? "";
  const editorMemberId = useBuilderStore((state) => state.run.roster.editorMemberId);
  const showBackToTop = useScrollThreshold(BACK_TO_TOP_SCROLL_THRESHOLD);
  const hideOnEditorRoute = pathname.startsWith("/team/pokemon/");
  const hideWhileEditorOpen = Boolean(editorMemberId);

  if (!showBackToTop || hideOnEditorRoute || hideWhileEditorOpen) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window === "undefined") {
          return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="fixed bottom-20 right-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-soft bg-surface-2/95 text-text shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-primary-line-emphasis hover:text-accent sm:bottom-6 sm:right-6"
      aria-label="Volver arriba"
      title="Volver arriba"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}

function useScrollThreshold(threshold: number) {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const notify = () => onStoreChange();
      window.addEventListener("scroll", notify, { passive: true });
      window.addEventListener("resize", notify);

      return () => {
        window.removeEventListener("scroll", notify);
        window.removeEventListener("resize", notify);
      };
    },
    () =>
      typeof window !== "undefined" ? window.scrollY > threshold : false,
    () => false,
  );
}
