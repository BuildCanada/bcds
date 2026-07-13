/**
 * Extract deterministic font metrics from the brand WOFF2s into committed
 * JSON tables (src/fonts/metrics/*.json). Run with:
 *
 *   bun run scripts/extract-font-metrics.ts
 *
 * The WOFF2 binaries themselves are NEVER copied into this package or its
 * published artifact (Klim font license) — only these numeric tables ship.
 *
 * Kerning comes from GPOS via fontkit's layout() per glyph pair (these fonts
 * have no legacy `kern` table). Ligatures are irrelevant to the table because
 * SVG text renders with liga disabled (see core/text and SceneSVG).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
// eslint-disable-next-line import-x/no-extraneous-dependencies -- devDependencies; build-time only
import * as fontkit from "fontkit"
// @ts-expect-error wawoff2 ships no types
import { decompress } from "wawoff2"

const FONTS_DIR = resolve(import.meta.dir, "../../components/src/assets/fonts")
const OUT_DIR = resolve(import.meta.dir, "../src/fonts/metrics")
/**
 * Decompressed TTFs for rasterization (resvg's fontdb cannot read WOFF2).
 * Gitignored and regenerable — licensed font binaries are never committed
 * here nor published.
 */
const TTF_CACHE_DIR = resolve(import.meta.dir, "../.fonts-cache")

/** role/metricsId → source woff2 */
const FONTS: Record<string, string> = {
    "soehne-kraftig": join(FONTS_DIR, "soehne-kraftig.woff2"),
    "financier-text-regular": join(FONTS_DIR, "financier-text-regular.woff2"),
    "founders-grotesk-mono-regular": join(FONTS_DIR, "founders-grotesk-mono-regular.woff2"),
}

// Fixed charset: printable ASCII, Latin-1 letters incl. French accents,
// typographic punctuation, NBSP + narrow NBSP, minus, dashes, currency.
const buildCharset = (): string[] => {
    const chars: string[] = []
    for (let cp = 0x20; cp <= 0x7e; cp++) chars.push(String.fromCodePoint(cp))
    for (let cp = 0xa0; cp <= 0xff; cp++) chars.push(String.fromCodePoint(cp))
    chars.push(
        "–", // en dash
        "—", // em dash
        "‘", "’", "“", "”", // smart quotes
        "…", // ellipsis
        "−", // true minus
        " ", // narrow NBSP (fr number groups)
        "€", // euro
        "‰", // per mille
    )
    return [...new Set(chars)]
}

interface FontMetricsTableJson {
    familyName: string
    unitsPerEm: number
    ascent: number
    descent: number
    capHeight: number
    advances: Record<string, number>
    kerning: Record<string, number>
    defaultAdvance: number
}

const extract = (path: string): FontMetricsTableJson => {
    const font = fontkit.openSync(path) as fontkit.Font
    const charset = buildCharset()

    const advances: Record<string, number> = {}
    for (const ch of charset) {
        if (!font.hasGlyphForCodePoint(ch.codePointAt(0)!)) continue
        // layout() applies GSUB/GPOS; single chars give the shaped advance.
        const run = font.layout(ch, { liga: false, calt: false })
        const width = run.positions.reduce((sum, p) => sum + p.xAdvance, 0)
        advances[String(ch.codePointAt(0))] = width
    }

    // Pair kerning: layout the pair and subtract the bare advances.
    const kerning: Record<string, number> = {}
    for (const a of charset) {
        const aCp = a.codePointAt(0)!
        const aAdv = advances[String(aCp)]
        if (aAdv === undefined) continue
        for (const b of charset) {
            const bCp = b.codePointAt(0)!
            const bAdv = advances[String(bCp)]
            if (bAdv === undefined) continue
            const run = font.layout(a + b, { liga: false, calt: false })
            if (run.positions.length !== 2) continue // shaped to ligature/other — skip pair
            const pairWidth = run.positions[0].xAdvance + run.positions[1].xAdvance
            const adjustment = pairWidth - (aAdv + bAdv)
            if (adjustment !== 0) kerning[`${aCp},${bCp}`] = adjustment
        }
    }

    // Fallback advance for unknown glyphs: width of "0" (tabular-ish), else average.
    const zeroAdv = advances[String("0".codePointAt(0))]
    const all = Object.values(advances)
    const defaultAdvance = zeroAdv ?? Math.round(all.reduce((s, w) => s + w, 0) / all.length)

    return {
        familyName: font.familyName,
        unitsPerEm: font.unitsPerEm,
        ascent: font.ascent,
        descent: font.descent,
        capHeight: font.capHeight,
        advances,
        kerning,
        defaultAdvance,
    }
}

const main = async () => {
    await mkdir(OUT_DIR, { recursive: true })
    await mkdir(TTF_CACHE_DIR, { recursive: true })
    for (const [id, path] of Object.entries(FONTS)) {
        const table = extract(path)
        const out = join(OUT_DIR, `${id}.json`)
        // Stable key order for clean diffs.
        await writeFile(out, JSON.stringify(table, null, 2) + "\n")

        const ttf = await decompress(await readFile(path))
        const ttfPath = join(TTF_CACHE_DIR, `${id}.ttf`)
        await writeFile(ttfPath, Buffer.from(ttf))

        console.log(
            `${id}: ${Object.keys(table.advances).length} glyphs, ` +
                `${Object.keys(table.kerning).length} kern pairs → ${out}; ttf → ${ttfPath}`,
        )
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
