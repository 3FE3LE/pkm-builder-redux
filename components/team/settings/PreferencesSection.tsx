"use client";

import clsx from "clsx";
import { CloudRain, CloudSun, Shield, Snowflake, Sun, Sword, Wind } from "lucide-react";

import { Switch } from "@/components/ui/Switch";
import type { BattleWeather } from "@/lib/domain/battle";
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
  return (
    <section className="space-y-2">
      <div className="px-1 py-1">
        <p className="display-face text-sm text-accent">Preferences</p>
      </div>
      <div className="space-y-5 px-1 py-1">
        <div>
          <p className="display-face text-sm text-accent">Tema de la interfaz</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = theme === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSetTheme(option.key)}
                  className={clsx(
                    "flex items-center gap-3 rounded-[0.8rem] border px-3 py-3 text-left transition",
                    active
                      ? "border-primary-line bg-primary-fill text-text"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong hover:bg-surface-4 hover:text-text",
                  )}
                >
                  <span className="icon-tile-md border border-line-soft bg-surface-4">
                    <Icon className={clsx("h-5 w-5", active ? "text-primary-soft" : "text-accent")} />
                  </span>
                  <span className="min-w-0">
                    <span className="display-face block text-xs text-inherit">{option.label}</span>
                    <span className="mt-1 block text-xs text-muted">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="display-face text-sm text-accent">Clima de combate</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {BATTLE_WEATHER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = battleWeather === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSetBattleWeather(option.key)}
                  className={clsx(
                    "flex items-center gap-3 rounded-[0.8rem] px-3 py-3 text-left transition",
                    active
                      ? "bg-primary-fill text-text"
                      : "text-muted hover:bg-surface-3",
                  )}
                >
                  <span className="icon-tile-md bg-surface-4">
                    <Icon className={clsx("h-5 w-5", active ? "text-primary-soft" : "text-accent")} />
                  </span>
                  <span className="min-w-0">
                    <span className="display-face block text-xs text-inherit">{option.label}</span>
                    <span className="mt-1 block text-xs text-muted">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
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
  description: string;
  icon: typeof Shield;
}[] = [
  {
    key: "dark",
    label: "Dark",
    description: "La cabina actual, con contraste alto y glow contenido.",
    icon: Shield,
  },
  {
    key: "light",
    label: "Light",
    description: "Una mesa clara con tinta profunda y acentos tacticos.",
    icon: Sword,
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
