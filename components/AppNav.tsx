"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GeistPixelCircle } from "geist/font/pixel";
import clsx from "clsx";
import { BookOpenText, Settings2, ShieldCheck, Wrench } from "lucide-react";

const appNavHeaderClassName =
  "fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),0px)] z-40 border-t border-line-soft bg-(--dock-surface-bg) px-3 pb-[max(env(safe-area-inset-bottom),0px)] backdrop-blur-lg lg:sticky lg:top-0 lg:bottom-auto lg:border-t-0 lg:border-b lg:border-line-soft lg:bg-(--dock-surface-bg) lg:px-0 lg:pb-0";

const appNavInnerClassName =
  "mx-auto flex max-w-7xl items-center justify-center bg-transparent px-0 py-2 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:px-10 lg:py-3";

const appNavHomeButtonClassName =
  "nav-action group hidden items-center justify-center border border-line-strong bg-(--panel-tint-soft) text-accent shadow-[var(--glass-shadow),0_12px_30px_rgba(0,0,0,0.18)] transition-[background,border-color,transform] duration-200 hover:border-accent-line hover:bg-surface-3/80 lg:inline-flex";

const appNavMobileHomeClassName =
  "app-dock-button nav-action inline-flex items-center justify-center border-transparent text-accent hover:border-line hover:bg-surface-3/80 lg:hidden";

const appNavDockClassName =
  "app-dock-shell grid w-full max-w-2xl grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-1 rounded-[1.15rem] p-1 lg:w-auto lg:max-w-none lg:grid-cols-[auto_auto_auto_auto] lg:rounded-2xl lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0";

const appNavPrimaryItemBaseClassName =
  "app-dock-button inline-flex h-11 min-w-0 items-center justify-center gap-2 px-3 text-sm";

const appNavPrimaryItemDesktopClassName =
  "lg:h-10 lg:rounded-[0.8rem] lg:justify-start lg:px-3.5";

const appNavPrimaryItemSharedClassName =
  "nav-action min-w-0 gap-2 px-3 text-sm lg:justify-start lg:px-3.5";

const appNavSettingsBaseClassName =
  "app-dock-button nav-action inline-flex items-center justify-center border lg:w-10";

const appNavLabelClassName = "hidden truncate text-[0.72rem] uppercase tracking-[0.12em] lg:inline";
const appNavTeamLabelClassName = "hidden text-[0.72rem] uppercase tracking-[0.12em] lg:inline";

const appNavTeamActiveClassName =
  "border border-primary-line-strong bg-[linear-gradient(180deg,rgba(190,255,120,0.16),rgba(190,255,120,0.06))] text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(190,255,120,0.08)]";

const appNavToolsActiveClassName =
  "border border-accent-line-strong bg-[linear-gradient(180deg,rgba(81,255,204,0.16),rgba(81,255,204,0.05))] text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(81,255,204,0.08)]";

const appNavDexActiveClassName =
  "border border-warning-line bg-[linear-gradient(180deg,rgba(255,199,107,0.18),rgba(255,199,107,0.06))] text-[hsl(39_100%_82%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,199,107,0.08)]";

const appNavSettingsActiveClassName =
  "border border-info-line bg-[linear-gradient(180deg,rgba(112,199,255,0.18),rgba(112,199,255,0.06))] text-[hsl(203_100%_87%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(112,199,255,0.08)]";

const appNavIdleClassName =
  "border border-transparent text-muted hover:border-line hover:bg-surface-3 hover:text-text";

export function AppNav() {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/team/pokemon/");
  const settingsActive = pathname === "/team/settings";
  const toolsActive = pathname === "/team/tools";
  const dexActive = pathname === "/team/dex" || pathname.startsWith("/team/dex/");
  const teamActive =
    pathname === "/team" ||
    pathname.startsWith("/team/pokemon/");

  if (hideNav) {
    return null;
  }

  return (
    <header className={appNavHeaderClassName}>
      <div className={appNavInnerClassName}>
        <Link
          href="/"
          aria-label="Home"
          className={appNavHomeButtonClassName}
        >
          <Image
            src="/brand/snivy.png"
            alt="Snivy"
            width={32}
            height={32}
            loading="eager"
            className="h-8 w-8 object-contain pixelated transition duration-200 group-hover:scale-[1.06]"
            unoptimized={false}
          />
        </Link>
        <nav className={appNavDockClassName}>
          <Link
            href="/"
            aria-label="Home"
            className={appNavMobileHomeClassName}
          >
            <Image
              src="/brand/snivy.png"
              alt="Snivy"
              width={28}
              height={28}
              loading="eager"
              className="h-7 w-7 object-contain pixelated"
              unoptimized={false}
            />
          </Link>
          <Link
            href="/team"
            aria-label="Team"
            className={clsx(
              appNavPrimaryItemBaseClassName,
              appNavPrimaryItemDesktopClassName,
              appNavPrimaryItemSharedClassName,
              teamActive ? appNavTeamActiveClassName : appNavIdleClassName,
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span className={clsx(GeistPixelCircle.className, appNavTeamLabelClassName)}>
              Team
            </span>
          </Link>
          <Link
            href="/team/tools?tool=compare"
            aria-label="Tools"
            className={clsx(
              appNavPrimaryItemBaseClassName,
              appNavPrimaryItemDesktopClassName,
              appNavPrimaryItemSharedClassName,
              toolsActive ? appNavToolsActiveClassName : appNavIdleClassName,
            )}
          >
            <Wrench className="h-4 w-4" />
            <span
              className={clsx(
                GeistPixelCircle.className,
                appNavLabelClassName,
              )}
            >
              Tools
            </span>
          </Link>
          <Link
            href="/team/dex"
            aria-label="Dex"
            className={clsx(
              appNavPrimaryItemBaseClassName,
              appNavPrimaryItemDesktopClassName,
              appNavPrimaryItemSharedClassName,
              dexActive ? appNavDexActiveClassName : appNavIdleClassName,
            )}
          >
            <BookOpenText className="h-4 w-4" />
            <span className={clsx(GeistPixelCircle.className, appNavLabelClassName)}>
              Dex
            </span>
          </Link>
          <Link
            href="/team/settings"
            aria-label="Settings"
            className={clsx(
              appNavSettingsBaseClassName,
              settingsActive ? appNavSettingsActiveClassName : appNavIdleClassName,
            )}
          >
            <Settings2 className="h-4.5 w-4.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
