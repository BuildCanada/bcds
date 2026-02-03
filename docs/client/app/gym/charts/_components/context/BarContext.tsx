"use client";
import { createContext, useContext, useState } from "react";
import { type ColorIssues } from "../types";
import { colorIssues } from "../utils";
import { type State } from "./types";
import { getData, getSimulatedPalette } from "../utils";

type Palette = string[];

export interface BarValues {
  palette: State<Palette> | null;
  count: State<number> | null;
  tools: {
    palette: {
      next: () => void;
      prev: () => void;
    };
    count: {
      inc: () => void;
      dec: () => void;
    };
  };
}

export const BarContext = createContext<BarValues>({
  palette: null,
  count: null,
  tools: {
    palette: {
      next: () => {},
      prev: () => {},
    },
    count: {
      inc: () => {},
      dec: () => {},
    },
  },
});

export const useBarContext = () => {
  const context = useContext(BarContext);
  if (!context) {
    throw new Error("useBarContext must be used within a BarContext Provider");
  }
};

export function BarProvider(args: { children: React.ReactNode }) {
  const [currentPalette, set_currentPalette] = useState<Palette>();
  const [currentSimMode, set_currentSimMode] = useState<ColorIssues>("default");

  const state = {
    chart: {
      get: currentBar,
      set: set_currentBar,
    },
    simMode: {
      get: currentSimMode,
      set: set_currentSimMode,
    },
    simModes: colorIssues,
  };

  return (
    <BarContext.Provider value={state}>{args.children}</BarContext.Provider>
  );
}
