"use client";

import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="mt-8 border-t border-line bg-transparent">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 text-sm text-muted sm:px-6 lg:px-10">
        <span>Redux Team Builder</span>
        <Link
          href="https://github.com/3FE3LE/pkm-builder-redux"
          target="_blank"
          rel="noreferrer"
          className="text-accent transition hover:text-text"
        >
          GitHub Repository
        </Link>
      </div>
    </footer>
  );
}
