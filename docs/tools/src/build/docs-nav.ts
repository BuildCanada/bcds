import { cwd } from "node:process";
import { join, dirname } from "node:path";
import { readdir, stat } from "node:fs/promises";
import z from "zod";

const extractRoute = (path: string) => {
  const parts = path.split("/");
  const appIndex = parts.findIndex((part) => part === "app");
  if (appIndex == -1) throw new Error("wtf");
  return parts.slice(appIndex + 1).join("/");
};

export async function walkDirectory(target: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const entryStat = await stat(fullPath);

      if (entryStat.isDirectory()) {
        await traverse(fullPath);
      } else {
        if (fullPath.endsWith("page.mdx")) {
          files.push(extractRoute(dirname(fullPath)));
        }
      }
    }
  }

  await traverse(target);
  return files;
}

const GUIDE_FOLDER = join(cwd(), "../", "client", "app", "guides");
const GUIDE_OUT = join(cwd(), "../", "client/data/all_guides.ts");

async function processGuides() {
  const files = await walkDirectory(GUIDE_FOLDER);
  console.log({ files });
  let payload = `export const all_guides = [\n`;
  files.forEach((file) => {
    payload += `\t"${file}",\n`;
  });
  payload += "];";
  await Bun.write(GUIDE_OUT, payload);
}

const COMPONENT_FOLDER = join(cwd(), "../", "client", "app", "components");
const COMPONENT_OUT = join(cwd(), "../", "client/data/all_components.ts");

function createLayer(items: string[], depth: number) {
  const layer = new Map<string, string[]>();
  for (const item of items) {
    const parts = item.split("/");
    const currentDepth = layer.get(parts[depth]!);
    const parentRoute = parts[depth]!;
    const partSet = new Set<string>();
    if (!currentDepth) {
      partSet.add(parts[depth + 1]!);
      layer.set(parentRoute!, [parts[depth + 1]!]);
    } else {
      for (const previous of currentDepth) {
        partSet.add(previous);
      }
      partSet.add(parts[depth + 1]!);
      layer.set(parentRoute!, [...Array.from(partSet)]);
    }
  }
  return layer;
}

function max(a: number, b: number): number {
  if (a > b) return a;
  return b;
}

function createLayers(items: string[]) {
  let maxLength = 0;
  for (const item of items) {
    const parts = item.split("/");
    maxLength = max(maxLength, parts.length);
  }
  let layers = new Map<number, Map<string, string[]>>();
  Array.from({ length: maxLength - 1 }).forEach((_, idx) => {
    const layer = createLayer(items, idx);
    layers.set(idx, layer);
  });
  return Array.from(layers);
}

function organizeFiles(items: string[]) {
  const layers = createLayers(items);

  for (const layer of layers) {
    const value = layer[1];
    const keys = Object.fromEntries(value);
    console.log({ keys });
  }

  return layers;
}

async function processComponents() {
  const files = await walkDirectory(COMPONENT_FOLDER);
  console.log({ files });
  const layers = organizeFiles(files);
  let payload = `export const all_components = [\n`;
  files.forEach((file) => {
    payload += `\t"${file}",\n`;
  });
  payload += "];";
  await Bun.write(COMPONENT_OUT, payload);
}

async function main() {
  await processGuides();
  await processComponents();
}

main();
