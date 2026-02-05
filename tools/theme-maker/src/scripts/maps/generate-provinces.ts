import { $ } from "bun";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

// --- CONFIGURATION ---
// The source file from your screenshot (Census Subdivisions)
const SOURCE_FOLDER = join(cwd(), "src/maps/canada_shp_2025");
const SOURCE_FILE = join(SOURCE_FOLDER, "lcsd000a25a_e.json");
const OUT_DIR = join(cwd(), "src/maps/canada_shp_2025");
const PROVINCES_DIR = `${OUT_DIR}/provinces`;

// Official PRUID mapping for filenames
const PROVINCES: Record<string, string> = {
  "10": "nl", // Newfoundland and Labrador
  "11": "pe", // Prince Edward Island
  "12": "ns", // Nova Scotia
  "13": "nb", // New Brunswick
  "24": "qc", // Quebec
  "35": "on", // Ontario
  "46": "mb", // Manitoba
  "47": "sk", // Saskatchewan
  "48": "ab", // Alberta
  "59": "bc", // British Columbia
  "60": "yt", // Yukon
  "61": "nt", // Northwest Territories
  "62": "nu", // Nunavut
};

async function main() {
  // --- MAIN SCRIPT ---
  console.log("🗺️  Starting Map Generation...");

  // 1. Ensure directories exist
  await mkdir(PROVINCES_DIR, { recursive: true });

  // 2. Generate National Files (The "All" and "Provinces" views)
  console.log("🇨🇦 Generating National Maps...");

  await Promise.all([
    // View A: The Provinces Comparison Map (Dissolved by PRUID)
    $`bunx mapshaper ${SOURCE_FILE} \
    -dissolve PRUID copy-fields=PRNAME \
    -o format=topojson ${OUT_DIR}/canada-provinces.json`,
  ]);

  // 3. Generate Drill-Down Files (The "Province" view)
  console.log("📍 Generating Provincial Drill-downs...");

  // We map over the keys and spawn a process for each province
  // This runs in parallel, utilizing Bun's threading capabilities
  for (const [pruid, slug] of Object.entries(PROVINCES)) {
    const filename = `${PROVINCES_DIR}/${slug}.json`;
    // Logic:
    // 1. Filter ONLY this province (PRUID == key)
    // 2. Dissolve the tiny CSDs into Census Divisions (CDUID) for a cleaner regional map
    // 3. Keep CDNAME for tooltips
    await $`bunx mapshaper ${SOURCE_FILE} \
    -filter 'PRUID == "${pruid}"' \
    -dissolve CDUID copy-fields=CDNAME,PRNAME \
    -o format=topojson ${filename}`;

    console.log(`   ✓ Generated ${slug.toUpperCase()} (${filename})`);
  }

  console.log("✅ Map Generation Complete!");
}

main();
