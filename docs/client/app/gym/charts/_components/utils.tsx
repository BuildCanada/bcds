import * as cb from "@cantoo/color-blindness";
// @ts-expect-error No types from Color Blind
import * as blinder from "color-blind";

export const colorIssues: ColorIssues[] = [
  "protanopia",
  "protanomaly",
  "deuteranopia",
  "deuteranomaly",
  "tritanopia",
  "tritanomaly",
  "default",
];

export type ColorIssues =
  | "protanopia"
  | "protanomaly"
  | "deuteranopia"
  | "deuteranomaly"
  | "tritanopia"
  | "tritanomaly"
  | "default";

export const simulatorMap: Record<
  Exclude<ColorIssues, "default">,
  (color: string) => string
> = {
  protanopia: (color: string) => blinder.protanopia(color, false),
  protanomaly: (color: string) => blinder.protanomaly(color, false),
  deuteranopia: (color: string) => blinder.deuteranopia(color, false),
  deuteranomaly: (color: string) => blinder.deuteranomaly(color, false),
  tritanopia: (color: string) => blinder.tritanopia(color, false),
  tritanomaly: (color: string) => blinder.tritanomaly(color, false),
};

export const min = (a: number, b: number): number => {
  if (a > b) return b;
  return a;
};
export const max = (a: number, b: number): number => {
  if (a < b) return b;
  return a;
};
