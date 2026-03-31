"use client";

import Link from "next/link";
import { GeistPixelCircle } from "geist/font/pixel";
import type { ComponentType, ReactNode } from "react";
import clsx from "clsx";
import {
  ArrowRight,
  BookOpenText,
  Flag,
  MapPinned,
  Route,
  ShieldCheck,
  Swords,
  WandSparkles,
} from "lucide-react";

const highlights = [
  {
    title: "Builder centrado en la run",
    body: "Roster editable, spreads, naturalezas, movesets y lectura inmediata de cobertura y presión defensiva.",
    icon: ShieldCheck,
  },
  {
    title: "Path por encounters",
    body: "Ruta principal de Challenge Mode con líderes, Team Plasma, League, rematches y equipos visibles por checkpoint.",
    icon: Route,
  },
  {
    title: "Intel de matchup",
    body: "Recomendaciones de capturas, huecos de coverage, amenazas defensivas y sugerencias de moves útiles para el tramo actual.",
    icon: Swords,
  },
] as const;

const documentationSources = [
  "Pokemon Changes",
  "Move Changes",
  "Trainer Changes",
  "Wild Area Changes",
  "Gift Pokemon",
  "Trade Changes",
  "Credits / FAQ / General Information",
] as const;

export function HomeLanding() {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="spotlight-primary absolute left-[8%] top-16 h-56 w-56 rounded-full blur-2xl" />
        <div className="spotlight-accent absolute right-[10%] top-28 h-72 w-72 rounded-full blur-3xl" />
        <div className="spotlight-info absolute bottom-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
          <article className="relative overflow-hidden rounded-[1.4rem] px-5 py-6 sm:px-7 sm:py-8">
            <div className="top-accent-rule absolute inset-x-0 top-0 h-px" />
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent">
              <span className="primary-badge pill-round px-3 py-1">
                Redux v1.4.1
              </span>
              <span className="pill-round border border-line px-3 py-1 text-muted">
                Blaze Black 2 / Volt White 2
              </span>
              <span className="pill-round border border-line px-3 py-1 text-muted">
                Guide de run
              </span>
            </div>

            <div className="mt-7 max-w-4xl">
              <p className={clsx(GeistPixelCircle.className, "text-sm uppercase tracking-[0.12em] text-accent")}>
                Team builder + run guide
              </p>
              <h1
                className={clsx(
                  GeistPixelCircle.className,
                  "mt-3 max-w-4xl text-[clamp(2.8rem,7vw,6.2rem)] leading-[0.9] tracking-[-0.04em] text-text",
                )}
              >
                arma tu equipo
                <span
                  className={clsx(
                    GeistPixelCircle.className,
                    "ml-3 inline-block text-[clamp(1.1rem,2vw,1.65rem)] align-top tracking-[0.24em] text-primary",
                  )}
                >
                  y decide el siguiente fight
                </span>
                <br />
                con el builder
                <br />
                de Blaze Black 2 Redux
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-text-soft sm:text-lg">
                Elige tu starter, arma el roster, revisa coverage, compara stats y sigue los checkpoints clave de
                Pokemon Blaze Black 2 Redux y Volt White 2 Redux
                <span className="display-face mx-2 text-accent">v1.4.1</span>
                desde una sola app. Esta pagina no es solo documentacion: es una herramienta para planear la run.
              </p>
            </div>

            <div className="mt-6 grid gap-2.5 sm:max-w-3xl sm:grid-cols-3">
              <HeroSignal
                icon={WandSparkles}
                title="Arma el roster"
                body="Starter, naturaleza, moves, IVs, EVs y evoluciones."
              />
              <HeroSignal
                icon={ShieldCheck}
                title="Lee el matchup"
                body="Coverage, roles, amenazas y huecos del equipo actual."
              />
              <HeroSignal
                icon={MapPinned}
                title="Planea la ruta"
                body="Checkpoints, encounters y siguiente combate importante."
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ActionLink href="/onboarding" tone="primary">
                Empezar a planear la run
                <ArrowRight className="h-4 w-4" />
              </ActionLink>
              <ActionLink href="/team" tone="secondary">
                Abrir team builder
              </ActionLink>
            </div>

            <p className="mt-3 text-sm text-muted">
              Si ya habías entrado antes, abre el builder y continúa donde lo dejaste.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="px-1 py-1"
                  >
                    <div className="icon-tile-md border border-primary-line-soft bg-primary-fill text-primary-soft">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="display-face mt-4 text-sm text-text">{item.title}</p>
                    <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="rounded-[1.2rem] px-5 py-5 sm:px-6">
            <section>
              <div className="flex items-center gap-3">
                  <span className="icon-tile-md border border-accent-line-soft bg-accent-fill-soft text-accent-soft">
                    <Flag className="h-4 w-4" />
                  </span>
                <div>
                  <p className="display-face text-sm text-accent">Creditos</p>
                  <p className="text-xs text-muted">Hack original y documentación</p>
                </div>
              </div>
              <div className="mt-5 space-y-4 text-sm leading-6 text-muted">
                <p>
                  Redux fue desarrollado principalmente por
                  <span className="display-face mx-2 text-text">AphexCubed</span>
                  en colaboracion con
                  <span className="display-face mx-2 text-text">Drayano</span>.
                </p>
                <p>
                  Esta app reorganiza la documentacion incluida con el proyecto para que puedas consultarla de forma
                  mas clara mientras avanzas en la run.
                </p>
              </div>
            </section>

            <section className="mt-5 pt-5">
              <div className="flex items-center gap-3">
                  <span className="icon-tile-md border border-info-line-soft bg-info-fill-soft text-info-soft">
                    <BookOpenText className="h-4 w-4" />
                  </span>
                <div>
                  <p className="display-face text-sm text-accent">Fuentes usadas</p>
                  <p className="text-xs text-muted">Documentación integrada en la app</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {documentationSources.map((entry) => (
                  <span
                    key={entry}
                    className="chip-surface px-3 py-1.5 text-xs text-muted"
                  >
                    {entry}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-4 rounded-[1.2rem] px-5 py-5 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
            <article>
              <p className="display-face text-sm text-accent">Que encontraras aqui</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-muted sm:text-base">
                <p>
                  Aquí puedes revisar tipos, stats efectivos, IV y EV, cobertura, equipos enemigos y checkpoints clave
                  sin tener que saltar entre documentos.
                </p>
                <p>
                  Todo esta pensado para acompanarte desde la eleccion del inicial hasta la planificación del siguiente combate.
                </p>
              </div>
            </article>

            <article className="lg:pl-6">
              <p className="display-face text-sm text-accent">Siguiente paso</p>
              <h2
                className={clsx(
                  GeistPixelCircle.className,
                  "mt-3 text-3xl leading-none tracking-[-0.03em] text-text",
                )}
              >
                elige tu inicial
                <br />
                y arranca la aventura
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
                Empieza eligiendo tu inicial. Si ya lo hiciste antes, puedes volver directamente al equipo y continuar desde donde lo dejaste.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ActionLink href="/onboarding" tone="primary">
                  Ir a onboarding
                  <ArrowRight className="h-4 w-4" />
                </ActionLink>
                <ActionLink href="/team" tone="ghost">
                  Continuar al team
                </ActionLink>
              </div>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroSignal({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="panel-frame border border-line bg-surface-3/80 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] border border-line bg-surface-5 text-accent">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="display-face text-sm text-text">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{body}</p>
        </div>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  children,
  tone,
}: {
  href: string;
  children: ReactNode;
  tone: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "cta-surface",
        tone === "primary" &&
          "border-primary-line-strong bg-primary-fill-strong text-primary-soft hover:bg-primary-fill-hover",
        tone === "secondary" &&
          "border-accent-line bg-accent-fill text-accent-soft hover:bg-accent-fill-hover",
        tone === "ghost" &&
          "border-line bg-surface-3 text-text hover:bg-surface-6",
      )}
    >
      {children}
    </Link>
  );
}
