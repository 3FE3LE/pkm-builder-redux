"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Settings2, Wrench } from "lucide-react";

export function AppNav() {
  const pathname = usePathname();
  const settingsActive = pathname === "/team/settings";
  const toolsActive = pathname === "/team/tools";
  const teamActive =
    pathname === "/team" ||
    pathname.startsWith("/team/pokemon/");

  return (
    <header className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),0px)] z-40 px-3 pb-[max(env(safe-area-inset-bottom),0px)] lg:sticky lg:top-0 lg:bottom-auto lg:px-0 lg:pb-0">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-0 py-2 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:border-b lg:border-line lg:bg-[rgba(4,10,13,0.88)] lg:px-10 lg:py-3 lg:backdrop-blur-md">
        <Link
          href="/"
          className="group hidden min-w-0 items-center gap-2.5 rounded-[1rem] px-1.5 py-1 text-accent transition hover:bg-surface-3/70 lg:flex"
        >
          <Image
            src="/brand/snivy.png"
            alt="Snivy"
            width={32}
            height={32}
            className="h-8 w-8 object-contain pixelated transition duration-200 group-hover:scale-[1.04]"
            unoptimized={false}
          />
          <span className="min-w-0">
            <span className="display-face hidden text-sm tracking-[0.08em] text-accent sm:inline">
              BB2 Redux Builder
            </span>
            <span className="display-face inline text-sm tracking-[0.08em] text-accent sm:hidden">
              Redux Builder
            </span>
          </span>
        </Link>
        <nav className="grid w-full max-w-md grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1 rounded-[1.15rem] border border-line-strong bg-[linear-gradient(180deg,hsl(196_57%_9%_/_0.84),hsl(196_57%_7%_/_0.78))] p-1 shadow-[0_18px_42px_hsl(0_0%_0%_/_0.24),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[18px] lg:w-auto lg:max-w-none lg:grid-cols-[auto_auto_auto] lg:rounded-[1rem] lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0">
          <Link
            href="/team"
            className={clsx(
              "inline-flex h-11 min-w-0 items-center justify-center rounded-[0.95rem] px-3 text-sm transition-[background,border-color,color,box-shadow,transform] duration-200 lg:h-10 lg:rounded-[0.8rem] lg:justify-start lg:px-3.5",
              teamActive
                ? "border border-primary-line-strong bg-[linear-gradient(180deg,rgba(190,255,120,0.16),rgba(190,255,120,0.06))] text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(190,255,120,0.08)]"
                : "border border-transparent text-muted hover:border-line hover:bg-surface-3 hover:text-text",
            )}
          >
            <span className="display-face text-[0.72rem] uppercase tracking-[0.12em]">Team</span>
          </Link>
          <Link
            href="/team/tools?tool=compare"
            className={clsx(
              "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[0.95rem] px-3 text-sm transition-[background,border-color,color,box-shadow,transform] duration-200 lg:h-10 lg:rounded-[0.8rem] lg:justify-start lg:px-3.5",
              toolsActive
                ? "border border-accent-line-strong bg-[linear-gradient(180deg,rgba(81,255,204,0.16),rgba(81,255,204,0.05))] text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(81,255,204,0.08)]"
                : "border border-transparent text-muted hover:border-line hover:bg-surface-3 hover:text-text",
            )}
          >
            <Wrench className="h-4 w-4" />
            <span className="display-face truncate text-[0.72rem] uppercase tracking-[0.12em]">Tools</span>
          </Link>
          <Link
            href="/team/settings"
            aria-label="Settings"
            className={clsx(
              "inline-flex h-11 w-11 items-center justify-center rounded-[0.95rem] border transition-[background,border-color,color,box-shadow,transform] duration-200 lg:h-10 lg:w-10 lg:rounded-[0.8rem]",
              settingsActive
                ? "border border-info-line bg-[linear-gradient(180deg,rgba(112,199,255,0.18),rgba(112,199,255,0.06))] text-[hsl(203_100%_87%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(112,199,255,0.08)]"
                : "border border-transparent text-muted hover:border-line hover:bg-surface-3 hover:text-text",
            )}
          >
            <Settings2 className="h-4.5 w-4.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
