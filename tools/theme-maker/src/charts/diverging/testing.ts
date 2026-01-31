import chroma, { type Color } from "chroma-js";
import { createPalettes } from "../lib/testing";

const paletteAudit = (colors: string[]) => {
  const conflicts = [];
  const THRESHOLD = 6;
  const thirdOfList = Math.floor(colors.length / 3);
  for (let i = 0; i < thirdOfList; i++) {
    for (let j = colors.length - 1; j >= colors.length - thirdOfList; j--) {
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

export const divergingAudit = (palette: string[]) => {
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
