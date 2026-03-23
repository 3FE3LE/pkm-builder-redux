"use client";

import Link from "next/link";

export function RouteHintScreen({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-4xl">
        <div className="panel-strong rounded-[1rem] p-8">
          <p className="display-face text-sm text-accent">Ruta protegida</p>
          <h1 className="display-face mt-3 text-3xl">{title}</h1>
          <p className="mt-3 text-sm text-muted">{description}</p>
          <div className="mt-6">
            <Link
              href={ctaHref}
              className="inline-flex rounded-[6px] border border-line px-4 py-2 text-sm text-muted"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
