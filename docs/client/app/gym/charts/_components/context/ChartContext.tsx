"use client";
import { createContext, useContext, useState } from "react";
import { type ColorIssues } from "../types";
import { colorIssues } from "../utils";
import { type State } from "./types";

type ValidCharts = "bar" | "heatmap" | "likert";

export interface ChartValues {
  chart: State<ValidCharts> | null;
  simMode: State<ColorIssues> | null;
  simModes: ColorIssues[];
}

export const ChartContext = createContext<ChartValues>({
  chart: null,
  simMode: null,
  simModes: colorIssues,
});

export const useChartContext = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error(
      "useChartContext must be used within a ChartContext Provider",
    );
  }
};

export function ChartProvider(args: { children: React.ReactNode }) {
  const [currentChart, set_currentChart] = useState<ValidCharts>("bar");
  const [currentSimMode, set_currentSimMode] = useState<ColorIssues>("default");

  const state = {
    chart: {
      get: currentChart,
      set: set_currentChart,
    },
    simMode: {
      get: currentSimMode,
      set: set_currentSimMode,
    },
    simModes: colorIssues,
  };

  return (
    <ChartContext.Provider value={state}>{args.children}</ChartContext.Provider>
  );
}
