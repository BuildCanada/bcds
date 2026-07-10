/**
 * Frozen text-measurement contract.
 *
 * All text measurement flows through TextMeasurer — never canvas, never DOM.
 * Implementations are backed by FontMetricsTable JSON committed under
 * src/fonts/metrics/, generated at build time from the brand WOFF2s by
 * scripts/extract-font-metrics.ts. This is what makes layout deterministic
 * across browser, CLI, and CI (specs 24 §3, 28).
 */

/** Logical font roles; themes map roles to families (spec 04 §4). */
export type FontRole = "heading" | "body" | "mono"

export interface FontSpec {
    family: FontRole
    sizePx: number
    weight: 400 | 500 | 700
    /** Additional per-gap spacing in px. */
    letterSpacing?: number
}

export interface TextMetrics {
    width: number
    ascent: number
    descent: number
}

export interface TextMeasurer {
    measure(text: string, font: FontSpec): TextMetrics
}

/**
 * Committed metrics format (one JSON file per font role).
 * Generated for a fixed charset: printable Latin-1, French accents,
 * digits, and the typographic set %$+−–—  (incl. NBSP and narrow NBSP).
 */
export interface FontMetricsTable {
    /** Font family name, for SVG font-family attributes. */
    familyName: string
    unitsPerEm: number
    ascent: number
    descent: number
    capHeight: number
    /** codepoint (decimal string) → advance width in font units. */
    advances: Record<string, number>
    /** "cp1,cp2" (decimal) → kerning adjustment in font units (GPOS pairs). */
    kerning: Record<string, number>
    /** Fallback advance (font units) for glyphs outside the charset. */
    defaultAdvance: number
}

/**
 * Create a measurer from per-role metrics tables.
 * Width = Σ advances + Σ kerning + letterSpacing × (chars − 1), scaled by
 * sizePx / unitsPerEm. Unknown glyphs use defaultAdvance (callers may surface
 * a diagnostic; measurement itself never throws).
 *
 * Implemented in M4 (core/text). Declared here so layout (M6) can depend on
 * the signature before the implementation lands.
 */
export type CreateMeasurer = (tables: Record<FontRole, FontMetricsTable>) => TextMeasurer
