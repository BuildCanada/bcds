import { $ } from "bun";
import { mkdir } from "node:fs/promises";
import cds from "../../maps/canada_shp_2025/census-divisions.json";
import { join } from "node:path";
import { cwd } from "node:process";

const SOURCE_FOLDER = join(cwd(), "src/maps/canada_shp_2025");
const SOURCE_FILE = join(SOURCE_FOLDER, "lcsd000a25a_e.json");
const OUT_DIR = join(cwd(), "src/maps/canada_shp_2025/regions");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const cd of cds) {
    const OUT_FILE = join(OUT_DIR, `${cd.id}.json`);
    await $`bunx mapshaper ${SOURCE_FILE} \
        -filter 'CDUID == "${cd.id}"' \
        -o format=topojson ${OUT_FILE}`;
  }
}

main();
