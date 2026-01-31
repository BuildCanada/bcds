import chroma, { type Color } from "chroma-js";
import {
  protanopia,
  protanomaly,
  deuteranopia,
  deuteranomaly,
  tritanopia,
  tritanomaly,
} from "@cantoo/color-blindness";

export const createPalettes = (palette: string[]) => {
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
