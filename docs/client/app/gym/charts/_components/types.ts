export type ColorIssues =
  | "protanopia"
  | "protanomaly"
  | "deuteranopia"
  | "deuteranomaly"
  | "tritanopia"
  | "tritanomaly"
  | "default";

export interface BaseChartProps {
  paletteIdx: number;
  simulationMode: ColorIssues;
  count?: number;
  width?: number;
  height?: number;
}
