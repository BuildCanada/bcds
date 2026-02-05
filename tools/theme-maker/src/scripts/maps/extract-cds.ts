import { file, write } from "bun";
import { join } from "node:path";
import { cwd } from "node:process";

// --- CONFIGURATION ---
// The source file from your screenshot (Census Subdivisions)
const SOURCE_FOLDER = join(cwd(), "src/maps/canada_shp_2025");
const SOURCE_FILE = join(SOURCE_FOLDER, "lcsd000a25a_e.json");
const OUT_DIR = join(cwd(), "src/maps/canada_shp_2025/");

async function main() {
  console.log("🔍 Reading TopoJSON...");
  const raw = await file(SOURCE_FILE).text();
  const topo = JSON.parse(raw);

  // 1. Get the geometries
  // We grab the first key in 'objects' dynamically so we don't care about the filename
  const objectKey = Object.keys(topo.objects)[0];
  const geometries = topo.objects[objectKey!].geometries;

  console.log(`Processing ${geometries.length} subdivisions...`);

  // 2. Extract and Deduplicate CDs
  // We use a Map to ensure each CDUID is stored only once
  const cdRegistry = new Map<
    string,
    { id: string; name: string; provinceId: string }
  >();

  geometries.forEach((geo: any) => {
    const p = geo.properties;
    // Only add if we haven't seen this CDUID yet
    if (p.CDUID && !cdRegistry.has(p.CDUID)) {
      cdRegistry.set(p.CDUID, {
        id: p.CDUID,
        name: p.CDNAME,
        provinceId: p.PRUID, // Useful to know which province this belongs to
      });
    }
  });

  // 3. Convert to Array and Sort
  const sortedCDs = Array.from(cdRegistry.values()).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const OUT_PATH = join(OUT_DIR, "census-divisons.json");
  await write(OUT_PATH, JSON.stringify(sortedCDs, null, 2));

  console.log(
    `✅ Extracted ${sortedCDs.length} unique Census Divisions to ${OUT_PATH}`,
  );
}

main();
