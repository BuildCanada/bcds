import chroma, { type Color } from "chroma-js";
import {
  protanopia,
  protanomaly,
  deuteranopia,
  deuteranomaly,
  tritanopia,
  tritanomaly,
} from "@cantoo/color-blindness";

const BREWER_KEYS = [
  "OrRd",
  "PuBu",
  "BuPu",
  "Oranges",
  "BuGn",
  "YlOrBr",
  "YlGn",
  "Reds",
  "RdPu",
  "Greens",
  "YlGnBu",
  "Purples",
  "GnBu",
  "Greys",
  "YlOrRd",
  "PuRd",
  "Blues",
  "PuBuGn",
  "Viridis",
  "Spectral",
  "RdYlGn",
  "RdBu",
  "PiYG",
  "PRGn",
  "RdYlBu",
  "BrBG",
  "RdGy",
  "PuOr",
  "Set2",
  "Accent",
  "Set1",
  "Set3",
  "Dark2",
  "Paired",
  "Pastel2",
  "Pastel1",
] as chroma.BrewerPaletteName[];

const createPalettes = (palette: string[]) => {
  const protanopiaPalette: string[] = [];
  const protanomalyPalette: string[] = [];
  const deuteranopiaPalette: string[] = [];
  const deuteranomalyPalette: string[] = [];
  const tritanopiaPalette: string[] = [];
  const tritanomalyPalette: string[] = [];
  palette.forEach((color) => {
    protanopiaPalette.push(protanopia(color));
    protanomalyPalette.push(protanomaly(color));
    deuteranopiaPalette.push(deuteranopia(color));
    deuteranomalyPalette.push(deuteranomaly(color));
    tritanopiaPalette.push(tritanopia(color));
    tritanomalyPalette.push(tritanomaly(color));
  });
  return {
    protanopia: protanopiaPalette,
    protanomaly: protanomalyPalette,
    deuteranopia: deuteranopiaPalette,
    deuteranomaly: deuteranomalyPalette,
    tritanopia: tritanopiaPalette,
    tritanomaly: tritanomalyPalette,
  };
};

const sequentialPaletteAudit = (colors: string[]) => {
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

const divergingPaletteAudit = (colors: string[]) => {
  const conflicts = [];
  const THRESHOLD = 7;
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

const categoricalPaletteAudit = (colors: string[]) => {
  const conflicts = [];
  const THRESHOLD = 10; // Standard JND (Just Noticeable Difference) for accessibility is ~15-20
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

async function main() {
  const testPalette = chroma.brewer.Blues;
  const simulatedPalettes = createPalettes(testPalette);

  const results = Object.entries(simulatedPalettes).map(([type, palette]) => {
    return {
      visionType: type,
      conflicts: {
        sequential: sequentialPaletteAudit(palette),
        diverging: divergingPaletteAudit(palette),
        categorical: categoricalPaletteAudit(palette),
      },
    };
  });
  results.push({
    visionType: "trichromacy",
    conflicts: {
      sequential: sequentialPaletteAudit(testPalette),
      diverging: divergingPaletteAudit(testPalette),
      categorical: categoricalPaletteAudit(testPalette),
    },
  });
  console.dir({ results }, { depth: null });
}

main();
