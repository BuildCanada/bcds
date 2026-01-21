import { cwd } from "node:process";
import { join, dirname } from "node:path";
import { readdir, stat } from "node:fs/promises";

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
    console.log({ entries });
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
  let payload = `export const all_guides = [\n`;
  files.forEach((file) => {
    payload += `\t"${file}",\n`;
  });
  payload += "];";
  await Bun.write(GUIDE_OUT, payload);
}

const COMPONENT_FOLDER = join(cwd(), "../", "client", "app", "components");
const COMPONENT_OUT = join(cwd(), "../", "client/data/all_components.ts");

async function processComponents() {
  const files = await walkDirectory(COMPONENT_FOLDER);
  console.log({ files });
  let payload = `export const all_components = [\n`;
  files.forEach((file) => {
    payload += `\t"${file}",\n`;
  });
  payload += "];";
  console.log({ payload });
  console.log({ COMPONENT_OUT });
  await Bun.write(COMPONENT_OUT, payload);
}

async function main() {
  await processGuides();
  await processComponents();
}

main();
