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
} from "../styles/colours";
import { divergingAudit } from "../charts/diverging/testing";

const MAX_TO_GENERATE = 9;
const MIN_TO_GENERATE = 3;

type BCDSPalette = typeof auburn;

async function twoColor(
  a: BCDSPalette,
  aName: string,
  b: BCDSPalette,
  bName: string,
) {
  const scale = chroma.scale([
    a["700"],
    chroma.mix(a["100"], b["100"]),
    b["700"],
  ]);
  const testPalette = scale.colors(MAX_TO_GENERATE);
  const results = divergingAudit(testPalette);
  let issueCount = 0;
  for (const result of results) {
    issueCount += result.conflicts.length;
  }
  if (issueCount > 3) {
    console.dir({ results }, { depth: null });
    return;
  }
  const fb = new FileBuilder();
  fb.addLine("export const charts = {");
  for (let i = MIN_TO_GENERATE; i <= MAX_TO_GENERATE; i++) {
    const pal = scale.colors(i);
    fb.addLine(`"${i}": ${JSON.stringify(pal)},`, 1);
  }
  fb.addLine("};");
  const out = fb.build();
  console.log({ out });
  await Bun.write(
    join(cwd(), `src/out/charts/diverging/${aName}-${bName}.ts`),
    out,
  );
}

async function threeColor(
  a: BCDSPalette,
  aName: string,
  b: BCDSPalette,
  bName: string,
  c: BCDSPalette,
  cName: string,
) {
  const scale = chroma.scale([a["700"], b["50"], c["700"]]);
  const testPalette = scale.colors(MAX_TO_GENERATE);
  const results = divergingAudit(testPalette);
  let issueCount = 0;
  for (const result of results) {
    issueCount += result.conflicts.length;
  }
  if (issueCount > 3) {
    console.dir({ results }, { depth: null });
    return;
  }
  const fb = new FileBuilder();
  fb.addLine("export const charts = {");
  for (let i = MIN_TO_GENERATE; i <= MAX_TO_GENERATE; i++) {
    const pal = scale.colors(i);
    fb.addLine(`"${i}": ${JSON.stringify(pal)},`, 1);
  }
  fb.addLine("};");
  const out = fb.build();
  console.log({ out });
  await Bun.write(
    join(cwd(), `src/out/charts/diverging/${aName}-${bName}-${cName}.ts`),
    out,
  );
}

async function main() {
  await twoColor(linen, "linen", auburn, "auburn");
  await twoColor(linen, "linen", pine, "pine");
  await twoColor(linen, "linen", lake, "lake");
  await twoColor(linen, "linen", aurora, "aurora");
  await twoColor(linen, "linen", copper, "copper");
  await twoColor(linen, "linen", nickel, "nickel");
  await twoColor(linen, "linen", steel, "steel");
  await twoColor(copper, "copper", auburn, "auburn");
  await twoColor(copper, "copper", linen, "linen");
  await twoColor(copper, "copper", pine, "pine");
  await twoColor(copper, "copper", lake, "lake");
  await twoColor(copper, "copper", aurora, "aurora");
  await twoColor(copper, "copper", nickel, "nickel");
  await twoColor(copper, "copper", steel, "steel");
  await twoColor(nickel, "nickel", auburn, "auburn");
  await twoColor(nickel, "nickel", linen, "linen");
  await twoColor(nickel, "nickel", pine, "pine");
  await twoColor(nickel, "nickel", lake, "lake");
  await twoColor(nickel, "nickel", aurora, "aurora");
  await twoColor(nickel, "nickel", copper, "copper");
  await twoColor(nickel, "nickel", steel, "steel");
  await twoColor(steel, "steel", auburn, "auburn");
  await twoColor(steel, "steel", linen, "linen");
  await twoColor(steel, "steel", pine, "pine");
  await twoColor(steel, "steel", lake, "lake");
  await twoColor(steel, "steel", aurora, "aurora");
  await twoColor(steel, "steel", copper, "copper");
  await twoColor(steel, "steel", nickel, "nickel");
  await threeColor(lake, "lake", linen, "linen", auburn, "auburn");
  await threeColor(lake, "lake", linen, "linen", pine, "pine");
  await threeColor(lake, "lake", linen, "linen", aurora, "aurora");
  await threeColor(lake, "lake", linen, "linen", copper, "copper");
  await threeColor(lake, "lake", linen, "linen", nickel, "nickel");
  await threeColor(lake, "lake", linen, "linen", steel, "steel");
  await threeColor(lake, "lake", copper, "copper", auburn, "auburn");
  await threeColor(lake, "lake", copper, "copper", pine, "pine");
  await threeColor(lake, "lake", copper, "copper", aurora, "aurora");
  await threeColor(lake, "lake", copper, "copper", linen, "linen");
  await threeColor(lake, "lake", copper, "copper", nickel, "nickel");
  await threeColor(lake, "lake", copper, "copper", steel, "steel");
}

main();
