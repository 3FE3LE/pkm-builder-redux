"use client";

import clsx from "clsx";
import {
  CloudRain,
  CloudSun,
  LaptopMinimal,
  Moon,
  Snowflake,
  Sun,
  Wind,
} from "lucide-react";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/Switch";
import type { BattleWeather } from "@/lib/domain/battle";
import { resolveAppliedTheme } from "@/lib/theme/applyTheme";
import type {
  BuilderTheme,
  EvolutionConstraintKey,
  EvolutionConstraintState,
  RecommendationFilterKey,
  RecommendationFilterState,
} from "@/lib/runState";

export function PreferencesSection({
  evolutionConstraints,
  recommendationFilters,
  battleWeather,
  theme,
  onToggleEvolutionConstraint,
  onToggleRecommendationFilter,
  onSetBattleWeather,
  onSetTheme,
  onResetRun,
}: {
  evolutionConstraints: EvolutionConstraintState;
  recommendationFilters: RecommendationFilterState;
  battleWeather: BattleWeather;
  theme: BuilderTheme;
  onToggleEvolutionConstraint: (key: EvolutionConstraintKey, value: boolean) => void;
  onToggleRecommendationFilter: (key: RecommendationFilterKey, value: boolean) => void;
  onSetBattleWeather: (weather: BattleWeather) => void;
  onSetTheme: (theme: BuilderTheme) => void;
  onResetRun: () => void;
}) {
  const autoThemeActive = theme === "auto";
  const currentAppliedTheme = resolveAppliedTheme(theme);

  return (
    <section className="space-y-2">
      <div className="px-1 py-1">
        <p className="display-face text-sm text-accent">Preferences</p>
      </div>
      <div className="space-y-5 px-1 py-1">
        <div>
          <p className="display-face text-sm text-accent">Tema de la interfaz</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SegmentedControl className="w-fit">
              {THEME_OPTIONS.map((option) => {
                const active = theme === option.key;

                return (
                  <SegmentedControlItem
                    key={option.key}
                    active={active}
                    onClick={() => onSetTheme(option.key)}
                    aria-label={option.label}
                    title={option.label}
                    className={clsx(
                      "min-w-0 px-2.5",
                      autoThemeActive && option.key !== "auto" && "opacity-55",
                    )}
                  >
                    <option.icon className="h-4 w-4" />
                  </SegmentedControlItem>
                );
              })}
            </SegmentedControl>

            <span
              className={clsx(
                "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] transition",
                autoThemeActive
                  ? "border-primary-line bg-primary-fill text-primary-soft"
                  : "border-line-soft bg-surface-3 text-text-faint",
              )}
            >
              {autoThemeActive
                ? `Ahora ${currentAppliedTheme === "light" ? "claro" : "oscuro"}`
                : "Manual"}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {autoThemeActive
              ? "Autodetect usa la hora local del navegador para alternar entre claro y oscuro."
              : "Elige un tema fijo o deja que la app siga la hora local."}
          </p>
        </div>

        <div>
          <p className="display-face text-sm text-accent">Clima de combate</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {BATTLE_WEATHER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = battleWeather === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-label={option.label}
                  title={`${option.label}: ${option.description}`}
                  onClick={() => onSetBattleWeather(option.key)}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-[0.75rem] border px-2.5 py-2 text-left transition",
                    active
                      ? "border-primary-line bg-primary-fill text-text"
                      : "border-line-soft bg-surface-2 text-muted hover:border-line hover:bg-surface-3 hover:text-text",
                  )}
                >
                  <Icon className={clsx("h-4 w-4", active ? "text-primary-soft" : "text-accent")} />
                  <span className="display-face text-[11px] text-inherit">{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-muted">
            Ajusta el contexto de clima para recomendaciones y comparativas.
          </p>
        </div>

        <div>
          <p className="display-face text-sm text-accent">Filtros de recomendaciones</p>
          <div className="mt-3 space-y-2">
            {RECOMMENDATION_FILTER_OPTIONS.map((option) => (
              <PreferenceSwitchRow
                key={option.key}
                label={option.label}
                description={option.description}
                checked={recommendationFilters[option.key]}
                onCheckedChange={(checked) => onToggleRecommendationFilter(option.key, checked)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="display-face text-sm text-accent">Reglas de evolucion</p>
          <div className="mt-3 space-y-2">
            {EVOLUTION_CONSTRAINT_OPTIONS.map((option) => (
              <PreferenceSwitchRow
                key={option.key}
                label={option.label}
                description={option.description}
                checked={evolutionConstraints[option.key]}
                onCheckedChange={(checked) => onToggleEvolutionConstraint(option.key, checked)}
              />
            ))}
          </div>
        </div>

        <div className="pt-1">
          <p className="display-face text-sm text-accent">Datos persistidos</p>
          <button
            type="button"
            onClick={onResetRun}
            className="danger-outline mt-3 rounded-[0.75rem] border px-4 py-2 text-sm text-danger"
          >
            Limpiar datos persistidos
          </button>
        </div>
      </div>
    </section>
  );
}

const THEME_OPTIONS: {
  key: BuilderTheme;
  label: string;
  icon: typeof Sun;
}[] = [
  {
    key: "dark",
    label: "Oscuro",
    icon: Moon,
  },
  {
    key: "light",
    label: "Claro",
    icon: Sun,
  },
  {
    key: "auto",
    label: "Auto",
    icon: LaptopMinimal,
  },
];

const EVOLUTION_CONSTRAINT_OPTIONS: {
  key: EvolutionConstraintKey;
  label: string;
  description: string;
}[] = [
  { key: "level", label: "Nivel", description: "Bloquea evoluciones que todavia no alcanzan el nivel requerido." },
  { key: "gender", label: "Sexo", description: "Respeta evoluciones macho/hembra cuando aplique." },
  { key: "timeOfDay", label: "Hora del dia", description: "Usa la hora local del navegador para day y night." },
];

const RECOMMENDATION_FILTER_OPTIONS: {
  key: RecommendationFilterKey;
  label: string;
  description: string;
}[] = [
  {
    key: "excludeLegendaries",
    label: "Excluir legendarios",
    description: "Oculta especies legendarias, miticas y afines de recomendaciones y referencias.",
  },
  {
    key: "excludePseudoLegendaries",
    label: "Excluir pseudo legendarios",
    description: "Quita lineas como Beldum, Larvitar, Gible o Deino del copilot.",
  },
  {
    key: "excludeUniquePokemon",
    label: "Excluir unicos",
    description: "Oculta especies excepcionales como Celebi, Meloetta o Keldeo aunque no sean pseudo.",
  },
  {
    key: "excludeOtherStarters",
    label: "Excluir otros starters",
    description: "No recomienda starters fuera de la familia que elegiste al inicio.",
  },
  {
    key: "excludeExactTypeDuplicates",
    label: "Excluir typing exacto duplicado",
    description: "Evita recomendar Pokemon con exactamente la misma combinacion de tipos que otro miembro del equipo.",
  },
];

const BATTLE_WEATHER_OPTIONS: {
  key: BattleWeather;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  { key: "clear", label: "Neutral", description: "Sin clima activo.", icon: Sun },
  { key: "sun", label: "Sun", description: "Drought, Chlorophyll, Solar Power.", icon: CloudSun },
  { key: "rain", label: "Rain", description: "Drizzle, Swift Swim y lluvia manual.", icon: CloudRain },
  { key: "sand", label: "Sand", description: "Sand Rush y boost SpD para Rock.", icon: Wind },
  { key: "hail", label: "Hail", description: "Clima helado persistente.", icon: Snowflake },
];

function PreferenceSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[0.8rem] px-1 py-2">
      <div className="min-w-0">
        <p className="display-face text-xs tracking-[0.14em] text-text">{label}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}
