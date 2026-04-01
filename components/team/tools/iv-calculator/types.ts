import { statKeys } from "@/lib/builderForm";
import type { IvInferenceResult } from "@/lib/domain/ivCalculator";

export type IvObservedState = Record<(typeof statKeys)[number], string>;

export type IvInferenceByStat = Partial<
  Record<(typeof statKeys)[number], IvInferenceResult>
>;

export const EMPTY_OBSERVED: IvObservedState = {
  hp: "",
  atk: "",
  def: "",
  spa: "",
  spd: "",
  spe: "",
};

export const ZERO_SPREAD = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
} as const;

export function createEmptyObservedState(): IvObservedState {
  return {
    hp: "",
    atk: "",
    def: "",
    spa: "",
    spd: "",
    spe: "",
  };
}

export type AddFeedback =
  | {
      tone: "success" | "danger";
      message: string;
    }
  | null;
