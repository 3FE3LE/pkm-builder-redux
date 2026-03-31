# Design System

Guía corta para mantener consistencia visual en `pkm-builder-redux`.

## Objetivo

Evitar repetir clases arbitrarias para radios, scrims, tabs, chips, cards y controles cuando ya existe una primitiva compartida.

No busca eliminar todos los valores específicos del proyecto. Algunos siguen siendo válidos en:

- animaciones y motion
- composición editorial
- overlays de sprites
- layouts únicos
- Open Graph images

## Dónde vive

Las primitivas base están en [app/globals.css](/home/fl/pkm-builder-redux/app/globals.css).

## Primitivas actuales

### Tabs

- `.tab-strip`
  Uso: carril horizontal de tabs, especialmente en mobile con scroll.
- `.tab-trigger-soft`
  Uso: tab estándar del builder/editor/tools.
- `.tab-panel`
  Uso: panel asociado a tabs con radio superior izquierdo abierto.

### Overlays y diálogos

- `.modal-scrim`
  Uso: fondo de modal/sheet flotante.
- `.dialog-surface`
  Uso: contenedor flotante compacto encima del scrim.
- `.panel-frame`
  Uso: panel principal con radio estándar `1rem`.

### Chips, tags y micro superficies

- `.chip-surface`
  Uso: pill/chip decorativo con borde y glass tint.
- `.tag-xs`
  Uso: tags pequeños en mayúsculas tipo status/category.
- `.token-card`
  Uso: badges rectangulares pequeños con borde y fondo suave.

### Cards

- `.soft-card`
  Uso: card estándar con borde y fondo suave.
- `.soft-card-dashed`
  Uso: estado vacío, placeholders, drop targets suaves.
- `.panel-card`
  Uso: card destacada con borde más expresivo, común en recomendaciones.

### Controles y acciones

- `.control-surface`
  Uso: input-like buttons, selects, compact triggers.
- `.control-surface-hover`
  Uso: hover/transition estándar para esos controles.
- `.action-tile`
  Uso: pequeños botones de acción, toggles compactos, icon tiles secundarios.
- `.icon-tile-md`
  Uso: tile cuadrado mediano `40x40`.
- `.nav-action`
  Uso: acciones principales de navegación.
- `.cta-surface`
  Uso: CTA principal/secondary tipo link-button.

### Tooltips y tipografía pequeña

- `.tooltip-card`
  Uso: superficie estándar de tooltip/help popover.
- `.micro-label`
  Uso: labels pequeños de sistema, escalas `10px`.
- `.micro-label-wide`
  Uso: label pequeño con tracking más agresivo.
- `.micro-copy`
  Uso: texto compacto recurrente, escala intermedia entre `10px` y `12px`.

### Forma simple

- `.pill-round`
  Uso: pills totalmente redondas.

## Reglas de uso

### 1. Reutiliza antes de inventar

Si el componente necesita una superficie que ya existe en otra parte del builder:

- usa la primitiva existente
- añade clases puntuales encima solo si el caso realmente lo necesita

Ejemplo bueno:

```tsx
<div className="soft-card p-3" />
```

Ejemplo malo:

```tsx
<div className="rounded-[0.9rem] border border-line bg-surface-3 p-3" />
```

### 2. No extraigas layout único

No vale la pena convertir en primitiva:

- posiciones `absolute` muy específicas
- tamaños acoplados a sprites
- clamps tipográficos editoriales
- motion values

### 3. Prioriza tokens para lo repetido

Si ves el mismo bloque 3+ veces, probablemente ya debe vivir en `globals.css`.

Buenas candidatas:

- radios repetidos
- sombras repetidas
- scrims
- pills/tags
- tabs
- tiles de acción

### 4. Mantén compatibilidad con tema

Evita hardcodear fondos oscuros o claros si la pieza puede vivir en ambos temas.

Prefiere:

- `var(--sheet-surface-bg)`
- `var(--dock-surface-bg)`
- `var(--chrome-tint-bg)`
- `var(--surface-*)`
- `var(--line*)`

Antes de meter `rgba(...)` o `hsl(...)`, revisa si ya existe una variable semántica.

## Patrones recomendados

### Tabs estándar

```tsx
<Tabs className="gap-0">
  <TabsList className="tab-strip scrollbar-thin">
    <TabsTrigger className="tab-trigger-soft" value="a">A</TabsTrigger>
  </TabsList>
  <TabsContent className="tab-panel" value="a" />
</Tabs>
```

### Modal compacto

```tsx
<div className="modal-scrim z-[120]">
  <div className="dialog-surface max-w-md p-4" />
</div>
```

### Card suave

```tsx
<div className="soft-card p-3" />
```

### Chip pequeño

```tsx
<span className="chip-surface px-3 py-1 text-xs text-muted" />
```

### Tag de estado

```tsx
<span className="tag-xs border border-line bg-surface-4 text-muted" />
```

## Qué evitar

- repetir `rounded-[0.9rem] border border-line bg-surface-3`
- repetir `rounded-[6px] border border-line`
- repetir scrims con `bg-[rgba(...)]`
- repetir tabs con `data-active:*` completos en cada pantalla
- meter colores hardcodeados cuando hay variable semántica equivalente

## Si necesitas una nueva primitiva

Antes de crearla, confirma:

1. Aparece en al menos 3 usos reales o claramente va a convertirse en patrón.
2. No describe un caso de una sola pantalla.
3. Tiene un nombre semántico, no visual accidental.

Buenos nombres:

- `soft-card`
- `dialog-surface`
- `control-surface`

Malos nombres:

- `rounded-card-2`
- `green-box`
- `panel-v3`

## Estado actual

El repo ya está parcialmente normalizado. Lo que todavía queda con valores arbitrarios suele responder a:

- composición única
- animación
- layout fino
- visuales específicos del dominio Pokémon

La meta ya no es “cero brackets”, sino que lo repetido y sistémico no viva como copy-paste.
