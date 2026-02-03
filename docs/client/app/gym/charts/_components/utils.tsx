import * as cb from "@cantoo/color-blindness";
// @ts-expect-error No types from Color Blind
import * as blinder from "color-blind";
import { type ColorIssues } from "./types";

export const colorIssues: ColorIssues[] = [
  "protanopia",
  "protanomaly",
  "deuteranopia",
  "deuteranomaly",
  "tritanopia",
  "tritanomaly",
  "default",
];

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

// --- HELPERS ---
export const randomAmount = () =>
  Math.min(95, Math.max(5, Math.floor(Math.random() * 100)));

/**
 * Generates dynamic dummy data for N categories (A, B, C...)
 */
export const getData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    category: String.fromCharCode(65 + i), // Generates "A", "B", "C"...
    value: randomAmount(),
  }));
};

/**
 * Generic palette retriever that handles both Sequential and Diverging sources
 */
export const getSimulatedPalette = (
  source: Record<string, Record<string, string[]>>,
  chartIdx: number,
  stepCount: number,
  mode: ColorIssues,
) => {
  const allPalettes = Object.values(source);
  // Default to the specific step count, or fallback to a known key if strict match fails
  const basePalette = allPalettes[chartIdx]?.[stepCount];

  if (!basePalette) return [];
  if (mode === "default") return basePalette;

  return basePalette.map(simulatorMap[mode]);
};
