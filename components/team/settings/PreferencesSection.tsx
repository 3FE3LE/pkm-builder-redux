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
import type { TypeName } from "@/lib/domain/effects/types";
import type { RoleKey } from "@/lib/domain/profiles/types";
import { ROLE_LABELS } from "@/lib/domain/roleLabels";
import { TYPE_ORDER } from "@/lib/domain/typeChart";
import { resolveAppliedTheme } from "@/lib/theme/applyTheme";
import type {
  BuilderTheme,
  EvolutionConstraintKey,
  EvolutionConstraintState,
  RecommendationFilterKey,
  RecommendationFilterState,
  RecommendationPlaystyle,
  RecommendationUserPreferences,
} from "@/lib/runState";

const preferenceManualChipClassName =
  "rounded-full border px-2.5 py-1 display-face micro-copy transition";
const preferenceWeatherButtonClassName =
  "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition";
const preferenceWeatherLabelClassName = "display-face micro-copy text-inherit";
const preferenceSectionClassName = "panel panel-frame px-4 py-4 sm:px-5";
const preferenceSectionTitleClassName = "display-face text-sm text-accent";
const preferenceSectionDescriptionClassName = "mt-2 text-sm text-muted";
const preferenceSwitchRowClassName = "app-soft-panel flex items-start justify-between gap-4 rounded-xl px-3 py-3";
const preferenceSwitchLabelClassName = "display-face micro-copy text-text";
const preferenceChipClassName = "rounded-full border px-3 py-1.5 text-xs transition";
const preferenceCheckboxGridClassName = "mt-3 grid gap-2 sm:grid-cols-2";
const preferenceCheckboxRowClassName =
  "app-soft-panel flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text transition hover:border-line";
const preferenceCheckboxInputClassName =
  "h-4 w-4 rounded border-line bg-surface-2 accent-[var(--accent)]";

export function PreferencesSection({
  evolutionConstraints,
  recommendationFilters,
  userPreferences,
  battleWeather,
  theme,
  onToggleEvolutionConstraint,
  onToggleRecommendationFilter,
  onSetRecommendationPlaystyle,
  onToggleFavoriteType,
  onToggleAvoidedType,
  onTogglePreferredRole,
  onSetBattleWeather,
  onSetTheme,
  onResetRun,
}: {
  evolutionConstraints: EvolutionConstraintState;
  recommendationFilters: RecommendationFilterState;
  userPreferences: RecommendationUserPreferences;
  battleWeather: BattleWeather;
  theme: BuilderTheme;
  onToggleEvolutionConstraint: (key: EvolutionConstraintKey, value: boolean) => void;
  onToggleRecommendationFilter: (key: RecommendationFilterKey, value: boolean) => void;
  onSetRecommendationPlaystyle: (playstyle: RecommendationPlaystyle) => void;
  onToggleFavoriteType: (type: TypeName) => void;
  onToggleAvoidedType: (type: TypeName) => void;
  onTogglePreferredRole: (role: RoleKey) => void;
  onSetBattleWeather: (weather: BattleWeather) => void;
  onSetTheme: (theme: BuilderTheme) => void;
  onResetRun: () => void;
}) {
  const autoThemeActive = theme === "auto";
  const currentAppliedTheme = resolveAppliedTheme(theme);

  return (
    <section className="space-y-4">
      <div className={preferenceSectionClassName}>
        <div>
          <p className={preferenceSectionTitleClassName}>Tema de la interfaz</p>
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
                preferenceManualChipClassName,
                autoThemeActive
                  ? "primary-badge"
                  : "border-line-soft bg-surface-3 text-text-faint",
              )}
            >
              {autoThemeActive
                ? `Ahora ${currentAppliedTheme === "light" ? "claro" : "oscuro"}`
                : "Manual"}
            </span>
          </div>
          <p className={preferenceSectionDescriptionClassName}>
            {autoThemeActive
              ? "Autodetect usa la hora local del navegador para alternar entre claro y oscuro."
              : "Elige un tema fijo o deja que la app siga la hora local."}
          </p>
        </div>
      </div>

      <div className={preferenceSectionClassName}>
        <div>
          <p className={preferenceSectionTitleClassName}>Perfil de recomendaciones</p>
          <p className={preferenceSectionDescriptionClassName}>
            Define estilo de juego, tipos y roles para mover el scoring hacia tus preferencias.
          </p>

          <div className="mt-3">
            <SegmentedControl className="w-full flex-wrap">
              {PLAYSTYLE_OPTIONS.map((option) => (
                <SegmentedControlItem
                  key={option.key}
                  active={userPreferences.playstyle === option.key}
                  onClick={() => onSetRecommendationPlaystyle(option.key)}
                  className="px-3"
                >
                  {option.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>

          <PreferenceCheckboxGroup
            title="Tipos favoritos"
            description="Suben afinidad y prioridad."
            options={TYPE_ORDER}
            selected={userPreferences.favoriteTypes}
            onToggle={(value) => onToggleFavoriteType(value as TypeName)}
          />

          <PreferenceCheckboxGroup
            title="Tipos evitados"
            description="Aplican castigo al score si aparecen."
            options={TYPE_ORDER}
            selected={userPreferences.avoidedTypes}
            onToggle={(value) => onToggleAvoidedType(value as TypeName)}
          />

          <PreferenceChipGroup
            title="Roles preferidos"
            description="Favorecen perfiles alineados con tu plan."
            options={ROLE_OPTIONS}
            selected={userPreferences.preferredRoles}
            onToggle={(value) => onTogglePreferredRole(value as RoleKey)}
            tone="role"
            getLabel={(value) => ROLE_LABELS[value as RoleKey]}
          />
        </div>
      </div>

      <div className={preferenceSectionClassName}>
        <div>
          <p className={preferenceSectionTitleClassName}>Clima de combate</p>
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
                    preferenceWeatherButtonClassName,
                    active
                      ? "primary-badge text-text"
                      : "border-line-soft bg-surface-2 text-muted hover:border-line hover:bg-surface-3 hover:text-text",
                  )}
                >
                  <Icon className={clsx("h-4 w-4", active ? "text-primary-soft" : "text-accent")} />
                  <span className={preferenceWeatherLabelClassName}>{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className={preferenceSectionDescriptionClassName}>
            Ajusta el contexto de clima para recomendaciones y comparativas.
          </p>
        </div>
      </div>

      <div className={preferenceSectionClassName}>
        <div>
          <p className={preferenceSectionTitleClassName}>Filtros de recomendaciones</p>
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
      </div>

      <div className={preferenceSectionClassName}>
        <div>
          <p className={preferenceSectionTitleClassName}>Reglas de evolucion</p>
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
      </div>

      <div className={preferenceSectionClassName}>
        <div>
          <p className={preferenceSectionTitleClassName}>Datos persistidos</p>
          <button
            type="button"
            onClick={onResetRun}
            className="danger-outline mt-3 rounded-xl border px-4 py-2 text-sm text-danger"
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

const PLAYSTYLE_OPTIONS: {
  key: RecommendationPlaystyle;
  label: string;
}[] = [
  { key: "balanced", label: "Balance" },
  { key: "aggressive", label: "Ofensivo" },
  { key: "defensive", label: "Defensivo" },
  { key: "technical", label: "Técnico" },
];

const ROLE_OPTIONS = Object.keys(ROLE_LABELS) as RoleKey[];

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
  {
    key: "preferReduxUpgrades",
    label: "Priorizar upgrades Redux",
    description: "Empuja un poco arriba a especies con cambios de tipo, habilidades o stats propios del hack.",
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
    <div className={preferenceSwitchRowClassName}>
      <div className="min-w-0">
        <p className={preferenceSwitchLabelClassName}>{label}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function PreferenceChipGroup({
  title,
  description,
  options,
  selected,
  onToggle,
  tone,
  getLabel,
}: {
  title: string;
  description: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
  tone: "favorite" | "avoided" | "role";
  getLabel?: (value: string) => string;
}) {
  return (
    <div className="mt-4">
      <p className={preferenceSectionTitleClassName}>{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((value) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={clsx(
                preferenceChipClassName,
                active
                  ? tone === "favorite"
                    ? "border-primary-line-emphasis bg-primary-fill text-text"
                    : tone === "avoided"
                      ? "border-danger/50 bg-danger/12 text-danger"
                      : "border-accent/40 bg-accent/12 text-accent-soft"
                  : "border-line-soft bg-surface-2 text-muted hover:border-line hover:text-text",
              )}
            >
              {getLabel?.(value) ?? value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceCheckboxGroup({
  title,
  description,
  options,
  selected,
  onToggle,
}: {
  title: string;
  description: string;
  options: readonly string[];
  selected: readonly string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className={preferenceSectionTitleClassName}>{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
      <div className={preferenceCheckboxGridClassName}>
        {options.map((value) => {
          const checked = selected.includes(value);
          return (
            <label key={value} className={preferenceCheckboxRowClassName}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(value)}
                className={preferenceCheckboxInputClassName}
                aria-label={value}
              />
              <span className="display-face micro-copy text-text">{value}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
