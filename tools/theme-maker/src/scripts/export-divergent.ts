import { readdir } from "node:fs/promises";
import { cwd } from "node:process";
import { join } from "node:path";
import { FileBuilder } from "../charts/lib/file-builder";

const toUpper = (value: string) => {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
};

const removeExtension = (value: string) => {
  const parts = value.split(".");
  return parts[0];
};

const cleanName = (value: string) => {
  const a = removeExtension(value)!;
  const parts = a.split("-")!;
  const uppers = parts.map((item) => toUpper(item));
  return uppers.join("");
};

async function main() {
  const files = await readdir(join(cwd(), "src/out/charts/diverging"));
  console.log({ files });
  const fb = new FileBuilder();
  const results = files.map((file) => {
    const result = cleanName(file);
    const importStatement = removeExtension(file);
    fb.addLine(
      `import { charts as Chart${result} } from "./${importStatement}";`,
    );
    return result;
  });
  fb.addLine(`export const diverging = {`);
  results.forEach((item) => {
    fb.addLine(`Chart${item},`, 1);
  });
  fb.addLine(`};`);
  const out = fb.build();
  await Bun.write(join(cwd(), "src/out/charts/diverging/index.ts"), out);
}

main();
