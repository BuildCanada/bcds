import chroma from "chroma-js";
import { join } from "node:path";
import { cwd } from "node:process";
import { FileBuilder } from "../charts/lib/file-builder";
import {
  auburn,
  linen,
  pine,
  lake,
  aurora,
  copper,
  nickel,
  steel,
  charcoal,
  maritime,
  aurora_alpha,
} from "../styles/colours";

export type SimpleBar = {
  background: string;
  foreground: string;
  fill: string;
};

const baseColors = [
  { name: "auburn", colors: auburn },
  { name: "copper", colors: copper },
  { name: "pine", colors: pine },
  { name: "lake", colors: lake },
  { name: "maritime", colors: maritime },
  { name: "aurora", colors: aurora },
];

const addSimpleBar = (
  fb: FileBuilder,
  color: { name: string; colors: typeof aurora },
  stage: 400 | 500 | 600,
) => {
  fb.addLine(`export const ${color.name}${stage} = {`);
  fb.addLine(`foreground: "${charcoal[900]}",`, 1);
  fb.addLine(`background: "${linen[50]}",`, 1);
  fb.addLine(`fill: "${color.colors[stage]}",`, 1);
  fb.addLine(`};`);
  fb.addEmptyLine();
};

async function main() {
  const fb = new FileBuilder();

  for (const color of baseColors) {
    addSimpleBar(fb, color, 400);
    addSimpleBar(fb, color, 500);
    addSimpleBar(fb, color, 600);
  }

  const out = fb.build();
  await Bun.write(join(cwd(), "out/charts/simple/simple.ts"), out);
}

main();

export type Fill = {
  options: string[];
  default: string;
};

export type QualitativeBar = {
  background: string;
  foreground: string;
  fill: {
    "2": Fill;
    "3": Fill;
    "4": Fill;
    "5": Fill;
  };
};
