/**
 * Static d3-format locale definitions (spec 28 §2 rule 3).
 *
 * NO Intl anywhere in core: number formatting routes through these frozen
 * d3-format locale objects so output is byte-identical across runtimes.
 * ICU version drift is a determinism bug.
 */

import { formatLocale } from "d3-format"
import type { FormatLocaleObject } from "d3-format"
import type { Locale } from "../types.ts"

// Typographic characters used throughout formatting. Exported so tests and
// callers can reference them by name rather than invisible literals.

/** No-break space (U+00A0): binds units to numbers in French ("24 $", "42 %"). */
export const NBSP = "\u00a0"
/** Narrow no-break space (U+202F): French thousands grouping ("10 000"). */
export const NARROW_NBSP = "\u202f"
/** True minus sign (U+2212), never a hyphen. */
export const MINUS_SIGN = "\u2212"

export const enCA: FormatLocaleObject = formatLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
})

export const frCA: FormatLocaleObject = formatLocale({
    decimal: ",",
    thousands: NARROW_NBSP,
    grouping: [3],
    currency: ["", `${NBSP}$`],
})

export function localeFormatter(locale: Locale): FormatLocaleObject {
    return locale === "fr" ? frCA : enCA
}

// ---------------------------------------------------------------------------
// Abbreviation word forms
// ---------------------------------------------------------------------------

/** Power-of-ten exponent of an abbreviation tier. */
export type ScaleExponent = 3 | 6 | 9 | 12

type ScaleTable = Record<ScaleExponent, string>

/** Long (spelled-out) scale words, singular form. French long scale: 1e12 = "billion". */
export const longScaleWords: Record<Locale, ScaleTable> = {
    en: { 3: "thousand", 6: "million", 9: "billion", 12: "trillion" },
    fr: { 3: "millier", 6: "million", 9: "milliard", 12: "billion" },
}

/** Short tick suffixes. French uses SI-style letters (G for milliard). */
export const shortScaleSuffixes: Record<Locale, ScaleTable> = {
    en: { 3: "k", 6: "M", 9: "B", 12: "T" },
    fr: { 3: "k", 6: "M", 9: "G", 12: "T" },
}

/**
 * Pluralized long-scale word for a formatted mantissa.
 *
 * French nouns pluralize from 2 upward ("1,9 million" but "2 millions");
 * English is invariant after a numeral ("24 billion", never "24 billions").
 */
export function longScaleWord(exponent: ScaleExponent, locale: Locale, mantissa: number): string {
    const word = longScaleWords[locale][exponent]
    if (locale === "fr" && Math.abs(mantissa) >= 2) {
        return `${word}s`
    }
    return word
}
