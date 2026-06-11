/**
 * Bless the golden SVG corpus: render every corpus case and write
 * __golden__/<name>.svg, removing any stale goldens for deleted cases.
 *
 *   bun src/corpus/bless.ts        (or: bun run corpus:bless)
 *
 * Re-bless ONLY for intentional rendering changes, and review the diffs in
 * the same PR (spec 26 §1.3).
 */

import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { corpusCases, renderCorpusCase } from "./corpus.ts"

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), "__golden__")
mkdirSync(goldenDir, { recursive: true })

const expected = new Set(corpusCases.map((corpusCase) => `${corpusCase.name}.svg`))

let removed = 0
for (const file of readdirSync(goldenDir)) {
    if (file.endsWith(".svg") && !expected.has(file)) {
        unlinkSync(join(goldenDir, file))
        removed += 1
    }
}

for (const corpusCase of corpusCases) {
    const svg = renderCorpusCase(corpusCase)
    writeFileSync(join(goldenDir, `${corpusCase.name}.svg`), `${svg}\n`)
}

process.stdout.write(
    `blessed ${corpusCases.length} golden(s) in ${goldenDir}${removed > 0 ? `, removed ${removed} stale` : ""}\n`,
)
