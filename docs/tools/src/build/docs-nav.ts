import { cwd } from "node:process";
import { join, dirname } from "node:path";
import { readdir, stat } from "node:fs/promises";

const IN_FOLDER = join(cwd(), "../", "client", "app", "guides");

const OUT_FILE = join(cwd(), "../", "client/data/all_docs.ts");

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

async function main() {
  const files = await walkDirectory(IN_FOLDER);
  let payload = `export const all_docs = [\n`;
  files.forEach((file) => {
    payload += `\t"${file}",\n`;
  });
  payload += "];";
  await Bun.write(OUT_FILE, payload);
}

main();
