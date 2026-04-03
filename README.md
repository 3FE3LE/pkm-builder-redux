# Redux Team Builder

Team builder, route planner y run guide para `Pokemon Blaze Black 2 Redux` y `Volt White 2 Redux`.

La app combina planificación de equipo, checkpoints, editor de Pokémon, herramientas de comparación y una `Redux Dex` con datos adaptados al hack. Está pensada para runs reales: no solo listar data, sino ayudar a decidir qué capturar, qué mover al PC, qué cambiar antes del siguiente combate importante y cómo optimizar el roster durante toda la partida.

## Qué incluye

- `Onboarding` para iniciar una run y elegir starter.
- `Team Workspace` con roster activo, caja/PC, análisis y flujo de edición.
- `Editor` por ruta real con `View Transitions`, no modal.
- `Redux Dex` de Pokémon, movimientos, habilidades e items.
- `Checkpoints` y recomendaciones contextuales según progreso de la run.
- `Tools` para compare, tiers por tipo e IV calculator.
- Importación de Pokémon compartidos vía URL.

## Stack

- `Next.js 16.2.2`
- `React 19 canary`
- `TypeScript`
- `Tailwind CSS v4`
- `motion`
- `zustand`
- `nuqs`
- `Vitest` + Testing Library

## Primer arranque

```bash
pnpm install
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

## Scripts útiles

```bash
pnpm dev
pnpm build
pnpm start

pnpm typecheck
pnpm test
pnpm verify
```

## Pipeline de data

Este repo no vive solo de UI. Buena parte del valor está en cómo transforma data canónica de Gen 5 y documentación del hack en un catálogo usable dentro del builder.

Scripts principales:

```bash
pnpm fetch:gen5
pnpm fetch:learnsets
pnpm fetch:moves

pnpm extract:redux
pnpm extract:world
pnpm extract:item-overrides

pnpm build:local-dex
pnpm build:effect-lists
pnpm fetch:effects
```

Qué hacen, a alto nivel:

- `fetch:*` trae o rehace data base canónica.
- `extract:*` transforma documentación y cambios del hack a estructuras consumibles por la app.
- `build:local-dex` fusiona todo en la dex local usada por el builder.

## Estructura

```text
app/                       App Router, rutas y metadata
components/
  home/                    Landing y home
  onboarding/              Flujo inicial de creación de run
  team/
    screens/               Pantallas principales
    workspace/             Roster, dock, modales y paneles
    editor/                Editor por página del Pokémon
    checkpoints/           Recomendaciones, mapa, fuentes y pathing
    tools/                 Compare, IV calc, type tiers
    shared/                Widgets compartidos del dominio team
  builder-shared/          Sprites, badges y piezas reutilizables
  ui/                      Primitives de UI
lib/                       Dominio, parsing, catálogos y utilidades
data/
  reference/               Data canónica y overrides extraídos
  local-dex/               Índices ya construidos para la app
scripts/                   Fetchers y extractores
tests/                     Tests unitarios y de componentes
```

## Superficies principales

### Team

`/team`

Centro de trabajo de la run. Desde aquí se gestionan:

- roster activo
- caja/PC
- checkpoints
- análisis del equipo
- acceso al editor de cada miembro

### Editor

`/team/pokemon/[memberId]`

Editor completo del Pokémon seleccionado. Está montado como página real y usa `View Transitions` para navegar desde el roster y volver sin romper contexto visual.

### Redux Dex

`/team/dex`

Incluye:

- listado incremental de Pokémon, moves, abilities e items
- ficha dedicada por Pokémon
- filtros por cambios respecto a Gen 5 canónica
- modo nacional y modo `BW2 Gen 5`
- links entre habilidades, movimientos, línea evolutiva y ficha

### Tools

`/team/tools`

Herramientas más técnicas para afinar decisiones:

- compare
- type tiers
- IV calculator

## Convenciones del proyecto

- Prioriza datos reales del hack sobre placeholders visuales.
- Evita `useEffect` si el problema puede resolverse con estado derivado, routing o eventos explícitos.
- Cuando una navegación cambia de contexto visual fuerte, usa `View Transitions`.
- Si regeneras data, intenta dejar también los tests alineados al nuevo baseline.

## Calidad

Checks habituales:

```bash
pnpm typecheck
pnpm vitest run
```

Antes de commitear, el repo ejecuta hooks con validaciones automáticas.

## Deploy

La app usa `NEXT_PUBLIC_SITE_URL` cuando está disponible. Si no existe, cae al fallback configurado en [`lib/site.ts`](./lib/site.ts).

## Nota

Este proyecto mezcla frontend, tooling y transformación de data. Si algo “se ve raro” en la UI, muchas veces el problema real no está en el componente, sino en el pipeline que generó el catálogo.
