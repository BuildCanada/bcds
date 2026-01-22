import { cwd } from "node:process";
import { join, dirname, sep } from "node:path";
import { readdir, stat } from "node:fs/promises";

const extractRoute = (path: string) => {
  const normalized = path.split(sep).join("/");
  const parts = normalized.split("/");
  const appIndex = parts.findIndex((part) => part === "app");
  if (appIndex == -1) throw new Error("Could not find 'app' in path");
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

function buildTree(paths: string[]) {
  const root: Record<string, any> = {};

  for (const path of paths) {
    const parts = path.split("/");
    let current = root;

    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    current.__link = path;
  }

  return root;
}

const COMPONENT_FOLDER = join(cwd(), "../", "client", "app", "components");
const COMPONENT_OUT = join(cwd(), "../", "client/data/all_components.ts");

async function processComponents() {
  console.log("Walking components...");
  const files = await walkDirectory(COMPONENT_FOLDER);

  const tree = buildTree(files);

  const payload = `export const all_components = ${JSON.stringify(tree, null, 2)};`;

  await Bun.write(COMPONENT_OUT, payload);
  console.log(`Wrote to ${COMPONENT_OUT}`);
}

const GUIDE_FOLDER = join(cwd(), "../", "client", "app", "guides");
const GUIDE_OUT = join(cwd(), "../", "client/data/all_guides.ts");

async function processGuides() {
  console.log("Walking guides...");
  const files = await walkDirectory(GUIDE_FOLDER);

  const tree = buildTree(files);

  const payload = `export const all_guides = ${JSON.stringify(tree, null, 2)};`;
  await Bun.write(GUIDE_OUT, payload);
  console.log(`Wrote to ${GUIDE_OUT}`);
}

async function main() {
  await processGuides();
  await processComponents();
}

main();
