/**
 * Table-backed TextMeasurer implementation (frozen contract in measurer.ts).
 *
 * width = (Σ advances + Σ kerning pair adjustments) × sizePx / unitsPerEm
 *         + letterSpacing × (codepoints − 1)
 *
 * Text is iterated by CODEPOINTS (for...of), never UTF-16 code units, so
 * accented characters and astral-plane glyphs are each one measurement unit.
 * Unknown codepoints fall back to the table's defaultAdvance — measurement
 * never throws.
 *
 * Weight: the committed tables are single-weight (Söhne Kräftig is already
 * the brand weight). FontSpec.weight currently applies a factor of 1.0 —
 * bold/regular variants need their own metrics tables before weight can
 * affect measurement. Do NOT fake-scale widths by weight.
 */

import type { CreateMeasurer, FontMetricsTable, FontSpec, TextMetrics } from "./measurer.ts"
import { tables } from "./metricsTables.ts"

/** Bounded memoization: cache only affects speed, never output. */
const CACHE_LIMIT = 10_000

function measureUncached(text: string, font: FontSpec, table: FontMetricsTable): TextMetrics {
    const scale = font.sizePx / table.unitsPerEm
    let units = 0
    let count = 0
    let prev: number | null = null
    for (const ch of text) {
        const cp = ch.codePointAt(0)!
        units += table.advances[String(cp)] ?? table.defaultAdvance
        if (prev !== null) units += table.kerning[`${prev},${cp}`] ?? 0
        prev = cp
        count += 1
    }
    const letterSpacing = font.letterSpacing ?? 0
    const width = units * scale + (count > 1 ? letterSpacing * (count - 1) : 0)
    return {
        width,
        ascent: table.ascent * scale,
        // Tables store descent as a (negative) font-unit offset; TextMetrics
        // reports it as a positive distance below the baseline.
        descent: Math.abs(table.descent) * scale,
    }
}

export const createMeasurer: CreateMeasurer = (roleTables) => {
    const cache = new Map<string, TextMetrics>()
    return {
        measure(text: string, font: FontSpec): TextMetrics {
            const key = `${font.family}|${font.sizePx}|${font.weight}|${font.letterSpacing ?? 0}|${text}`
            const hit = cache.get(key)
            if (hit !== undefined) return hit
            const metrics = measureUncached(text, font, roleTables[font.family])
            if (cache.size >= CACHE_LIMIT) cache.clear()
            cache.set(key, metrics)
            return metrics
        },
    }
}

/** Default measurer over the committed brand tables. */
export const defaultMeasurer = createMeasurer(tables)
