import chroma from "chroma-js";
import { createPalettes } from "../lib/testing";

const paletteAudit = (colors: string[]) => {
  const conflicts = [];
  const THRESHOLD = 5;
  // Standard JND (Just Noticeable Difference) for accessibility is ~15-20,
  // but... sequential palettes can be much closer together. "At a glance" differences can be 2-10.
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const distance = chroma.deltaE(colors[i]!, colors[j]!);
      if (distance < THRESHOLD) {
        conflicts.push({
          pair: [colors[i], colors[j]],
          indices: [i, j],
          distance: distance,
        });
        continue;
      }
    }
  }
  return conflicts;
};

export const sequentialAudit = (palette: string[]) => {
  const simulatedPalettes = createPalettes(palette);

  const results = Object.entries(simulatedPalettes).map(
    ([type, simPalette]) => {
      return {
        visionType: type,
        conflicts: paletteAudit(simPalette),
      };
    },
  );

  results.push({
    visionType: "trichromacy",
    conflicts: paletteAudit(palette),
  });

  return results;
};
