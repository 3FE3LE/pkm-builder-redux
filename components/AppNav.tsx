"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/team", label: "Team" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[rgba(4,10,13,0.88)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 text-accent">
          <Image
            src="/brand/snivy.png"
            alt="Snivy"
            width={32}
            height={32}
            className="h-8 w-8 object-contain pixelated"
            unoptimized={false}
          />
          <span className="display-face text-sm">BB2 Redux Builder</span>
        </Link>
        <nav className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-[0.75rem] border px-3 py-2 text-sm transition",
                  active
                    ? "border-primary-line-active bg-primary-fill text-text"
                    : "border-line bg-surface-3 text-muted hover:bg-surface-6",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
