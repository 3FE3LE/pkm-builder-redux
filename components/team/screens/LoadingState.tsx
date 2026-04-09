"use client";

import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  label?: string;
  detail?: string;
  variant?: "panel" | "workspace" | "editor";
};

export function LoadingState({
  label = "Cargando builder",
  detail = "Rehidratando el estado persistido del equipo, checkpoint y flags del run.",
  variant = "panel",
}: LoadingStateProps) {
  if (variant === "workspace") {
    return <WorkspaceLoadingState />;
  }

  if (variant === "editor") {
    return <EditorLoadingState />;
  }

  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="panel panel-frame overflow-hidden px-5 py-5 sm:px-6">
          <div className="space-y-3">
            <p className="display-face text-sm text-[hsl(39_100%_78%)]">{label}</p>
            <p className="max-w-2xl text-sm text-muted">{detail}</p>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-[1.25rem]" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function WorkspaceLoadingState() {
  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <div className="panel panel-frame px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-full max-w-3xl" />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="panel panel-frame space-y-4 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-11 w-11 rounded-full" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`workspace-skeleton-card-${index}`}
                  className="rounded-[1.25rem] border border-line-soft bg-surface-3/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Skeleton className="h-9 w-full rounded-xl" />
                    <Skeleton className="h-9 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="panel panel-frame px-4 py-4 sm:px-5">
              <div className="mb-4 flex gap-2">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-28 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>

            <div className="panel panel-frame px-4 py-4 sm:px-5">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function EditorLoadingState() {
  return (
    <main className="relative overflow-visible px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="hidden h-10 w-36 rounded-full md:block" />
        <section className="panel panel-frame overflow-hidden">
          <div className="border-b border-line-soft px-4 py-5 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Skeleton className="h-28 w-28 rounded-3xl" />
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full max-w-md rounded-2xl" />
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 pb-8 pt-4 sm:space-y-5 sm:px-5 sm:pb-10">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Skeleton className="h-36 w-full rounded-[1.25rem]" />
              <Skeleton className="h-36 w-full rounded-[1.25rem]" />
            </div>

            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-72 w-full rounded-[1.25rem]" />
              <Skeleton className="h-72 w-full rounded-[1.25rem]" />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
