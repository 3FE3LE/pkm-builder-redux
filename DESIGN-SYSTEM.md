# Design System

Guia de implementacion para estilos en `pkm-builder-redux`.

La meta no es eliminar todos los `className` largos. La meta es que el styling tenga una fuente de verdad clara, que lo repetido no viva como copy-paste y que el componente siga siendo legible.

## Objetivo

El sistema visual del repo debe vivir en 4 capas, siempre en este orden:

1. Tokens globales en CSS.
2. Primitivas compartidas en CSS.
3. Composicion y variantes en TypeScript con `cn()` o `clsx()`.
4. Constantes locales de clases en TypeScript cuando solo mejoran legibilidad de una feature.

Si un cambio no encaja claramente en una de esas capas, probablemente esta mal ubicado.

## Fuente de verdad

No hay una sola fuente de verdad para todo el styling. Hay una fuente de verdad por nivel:

- Tokens: [app/globals.css](/home/fl/pkm-builder-redux/app/globals.css)
- Primitivas compartidas: [app/globals.css](/home/fl/pkm-builder-redux/app/globals.css)
- Variantes y estados: el componente TSX que las usa
- Agrupaciones locales de clases: el mismo archivo TSX o el modulo visual del feature

## Las 4 capas

### 1. Tokens globales en CSS

Aqui viven las decisiones visuales base del sistema:

- colores
- sombras
- blur
- gradientes semanticos
- superficies
- radios base si se vuelven parte del lenguaje visual

Ejemplos actuales:

- `--surface-3`
- `--line-soft`
- `--warning-fill`
- `--glass-shadow`
- `--sheet-surface-bg`
- `--dock-surface-bg`
- `--panel-tint-soft`

Regla:

- si expresa identidad visual del producto, va aqui.
- si se repite como `rgba(...)`, `hsl(...)` o `linear-gradient(...)` en varios lugares, probablemente falta un token.

### 2. Primitivas compartidas en CSS

Aqui viven patrones visuales recurrentes del sistema.

No son componentes. Son superficies, shells y piezas base.

Ejemplos actuales en [app/globals.css](/home/fl/pkm-builder-redux/app/globals.css):

- `.panel`
- `.panel-card`
- `.panel-frame`
- `.token-card`
- `.action-tile`
- `.nav-action`
- `.sheet-surface`
- `.modal-backdrop`
- `.tooltip-card`
- `.control-surface`
- `.control-surface-hover`
- `.micro-label`
- `.micro-label-wide`

Regla:

- si una combinacion visual aparece en 3 o mas lugares con la misma intencion, debe ser candidata a primitive CSS.
- si cambia como parte del sistema entero, debe ser primitive, no string inline repetido.

### 3. Composicion y variantes en TS

Aqui se usan `cn()` o `clsx()` para combinar:

- primitive base
- tamaño
- responsive
- estado activo/inactivo
- variantes de tono
- condiciones de negocio

Ejemplo bueno:

```tsx
className={cn(
  "panel-card",
  active ? "border-warning-line bg-warning-fill" : "border-line bg-surface-3",
  compact ? "p-2" : "p-4",
)}
```

Regla:

- el componente decide estados y variantes.
- el componente no deberia redefinir desde cero una primitive compartida si ya existe.

### 4. Constantes locales de clases en TS

Estas constantes existen solo para legibilidad y mantenimiento local.

No son design tokens ni primitives globales.

Ejemplos correctos:

- `sheetPopupBaseClassName`
- `sheetPopupBottomClassName`
- `appNavPrimaryItemBaseClassName`
- `dexPanelCardClassName`
- `dexStatChipClassName`

Regla:

- usalas cuando un string largo se repite dentro del mismo archivo o subdominio.
- mantenlas cerca del componente.
- si la constante ya se comparte entre varias pantallas del mismo dominio visual, puedes exportarla desde un archivo del feature.
- si la constante empieza a sentirse “global”, probablemente deberia subir a primitive CSS.

## Matriz de decision

Antes de agregar estilos nuevos, usa esta tabla:

- ¿Es una decision visual base del producto?
  Entonces: token CSS.

- ¿Es un patron visual repetido con la misma intencion?
  Entonces: primitive CSS.

- ¿Es una combinacion de estado, tono o responsive de una primitive?
  Entonces: `cn()` o `clsx()` en TS.

- ¿Es una agrupacion local para que el archivo se lea mejor?
  Entonces: constante local de clases.

## Regla de promocion

Sube una pieza de un nivel al siguiente cuando pase esto:

- inline -> constante local:
  cuando el `className` ya no se lee bien o se repite dentro del mismo archivo.

- constante local -> util compartida del feature:
  cuando se repite en varios archivos del mismo dominio visual, por ejemplo `dex/*`.

- util compartida del feature -> primitive CSS:
  cuando ya representa un patron del producto, no solo de una pantalla.

- hardcoded color/gradient -> token:
  cuando la misma decision visual aparece en mas de un sitio.

## Reglas practicas

### Evita valores arbitrarios por defecto

Los valores arbitrarios no estan prohibidos, pero son la ultima opcion.

Regla:

- primero intenta usar una utilidad estandar de Tailwind
- si el valor expresa una decision visual repetible, conviertelo en token o primitive
- solo deja un valor arbitrario inline cuando sea realmente especifico, local y no sistemico

Buenas candidatas para promocion:

- radios repetidos
- sombras repetidas
- gradientes repetidos
- offsets de overlays
- anchos maximos o minimos que aparecen en varias pantallas
- colores `rgba(...)` o `hsl(...)` que ya se usan mas de una vez

Casos donde un valor arbitrario puede quedarse:

- motion puntual
- posicionamiento fino de sprite u overlay
- `calc()` o combinaciones con safe area muy locales
- un layout editorial unico

### Reutiliza antes de inventar

Antes de crear una clase nueva o constante nueva:

1. revisa [app/globals.css](/home/fl/pkm-builder-redux/app/globals.css)
2. revisa el modulo del feature, por ejemplo [DexShared.tsx](/home/fl/pkm-builder-redux/components/team/screens/dex/DexShared.tsx)
3. busca si ya existe una primitive o util equivalente

### No extraigas layout unico

No vale la pena convertir en primitive:

- posiciones `absolute` muy especificas
- overlays de sprite
- clamps tipograficos editoriales
- animaciones unicas
- valores de motion
- una combinacion que solo existe en una pantalla

### Nombra por intencion, no por accidente visual

Buenos nombres:

- `dexPanelCardClassName`
- `sheetPopupRightClassName`
- `profileLockButtonClassName`
- `recommendationTokenPillClassName`

Malos nombres:

- `greenBoxClassName`
- `roundedCard2`
- `styleA`
- `weirdPanel`

### Evita mezclar niveles

Mal patron:

- colores semanticos hardcodeados inline
- primitives medio definidas en CSS y medio recreadas en TS
- constantes globales TS que compiten con classes CSS del sistema

Buen patron:

- token en CSS
- primitive en CSS
- `cn()` para variante
- constante local solo para agrupar lectura

### Si un valor se repite, deja de ser inline

En este repo, un valor repetible no deberia vivir como bracket copiado varias veces.

Escalera correcta:

- una vez y muy local: inline
- empieza a repetirse en un archivo: constante local
- se repite en varios archivos del mismo dominio: util compartida del feature
- se vuelve patron visual del producto: token o primitive global

### No se crean variantes por diferencias imperceptibles

Un token, primitive o constante no se justifica si solo cambia:

- 1 a 3 px de radio, spacing o tamaño sin impacto visual real
- un cambio de color apenas perceptible respecto a otra variante existente
- un `tracking` o `font-size` tan cercano que no cambia la jerarquia visual

Regla:

- si la diferencia no cambia claramente la jerarquia, el tono o la affordance, se fusiona con la variante existente
- antes de crear una variante nueva, compara contra el set actual y elige la mas cercana
- si dos variantes se distinguen solo por un ajuste fino, gana la ya establecida como pilar del sistema

Aplicacion practica:

- para labels auxiliares y eyebrow text, usa primitives compartidas como `micro-label`, `micro-label-wide` o `micro-copy`
- para cards, chips y controles, evita radios casi iguales; usa el radio del patron mas cercano ya existente
- para superficies del mismo tono semantico, no abras una variante nueva solo por una diferencia de opacidad apenas visible

Excepcion:

- un ajuste fino puede quedarse local solo si responde a una necesidad funcional clara, por ejemplo legibilidad en un SVG, alineacion de sprite o una animacion puntual

## Estado actual del repo

La primera pasada ya normalizo parte del sistema en estos archivos:

- [app/globals.css](/home/fl/pkm-builder-redux/app/globals.css)
- [components/ui/Sheet.tsx](/home/fl/pkm-builder-redux/components/ui/Sheet.tsx)
- [components/AppNav.tsx](/home/fl/pkm-builder-redux/components/AppNav.tsx)
- [components/team/screens/dex/DexShared.tsx](/home/fl/pkm-builder-redux/components/team/screens/dex/DexShared.tsx)
- [components/team/screens/dex/DexInfoBlocks.tsx](/home/fl/pkm-builder-redux/components/team/screens/dex/DexInfoBlocks.tsx)
- [components/team/screens/dex/DexPanels.tsx](/home/fl/pkm-builder-redux/components/team/screens/dex/DexPanels.tsx)
- [components/team/editor/MovesSection.tsx](/home/fl/pkm-builder-redux/components/team/editor/MovesSection.tsx)
- [components/team/editor/LevelUpMoveModal.tsx](/home/fl/pkm-builder-redux/components/team/editor/LevelUpMoveModal.tsx)

La direccion correcta ahora es seguir por dominios:

1. `dex/*`
2. `editor/*`
3. `checkpoints/*`
4. `workspace/*`

## Ejemplos

### Ejemplo 1: patron del sistema

Si ves esto repetido varias veces:

```tsx
<article className="panel-strong panel-frame rounded-2xl p-4" />
```

No lo copies otra vez. Usa una util del dominio o promuevelo a primitive segun el alcance.

Ejemplo actual:

```tsx
<article className={dexPanelCardClassName} />
```

### Ejemplo 2: pill repetido

Si el mismo pill de stats aparece en varias tarjetas del dex y editor:

```tsx
<span className={dexStatChipClassName}>PP 16</span>
```

No repitas:

```tsx
<span className="rounded-full border border-line-soft bg-surface-3 px-2.5 py-1 text-xs text-text-faint">
```

### Ejemplo 3: popup con variantes por lado

No metas una sola cadena inmanejable:

```tsx
className="sheet-surface ... data-[side=bottom]:... data-[side=left]:... data-[side=right]:..."
```

Prefiere capas:

```tsx
className={cn(
  sheetPopupBaseClassName,
  sheetPopupBottomClassName,
  sheetPopupLeftClassName,
  sheetPopupRightClassName,
  className,
)}
```

## Que evitar

- convertir cada `className` largo en una constante por reflejo
- mover demasiado pronto cosas a global CSS
- crear utilidades compartidas entre features sin un patron real
- esconder toda la UI detras de nombres opacos
- mantener duplicadas una primitive CSS y una version TS con la misma funcion
- dejar valores arbitrarios repetidos cuando ya deberian haberse promovido

## Checklist para estilos nuevos

Antes de cerrar un cambio de UI, confirma:

1. ¿Estoy reutilizando un token existente?
2. ¿Estoy reutilizando una primitive existente?
3. ¿Estoy evitando un valor arbitrario que ya tiene equivalente estandar?
4. ¿Si el valor arbitrario se repite, ya lo promovi a constante, token o primitive?
5. ¿Este `className` largo merece una constante local?
6. ¿Esto deberia quedarse local o promocionarse?
7. ¿El nombre describe la intencion visual?
8. ¿El componente sigue siendo legible leyendo solo el TSX?

## Resumen

La regla del repo es:

- tokens en CSS
- primitives en CSS
- variantes en `cn()` o `clsx()`
- agrupaciones locales en constantes TS

La meta no es “cero clases inline”.

La meta es que lo repetido y sistemico tenga un hogar estable, y que lo local siga siendo facil de leer.
