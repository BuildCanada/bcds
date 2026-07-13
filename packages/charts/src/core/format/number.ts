/**
 * THE number-formatting service (spec 03 §4).
 *
 * A single entry point used by every surface — axis ticks, tooltips, data
 * labels, tables, CSV headers — so a value never formats differently between
 * surfaces. No Intl (spec 28 §2 rule 3): everything routes through the static
 * d3-format locales in ./locales.ts.
 */

import type { ColumnMeta, Locale } from "../types.ts"
import type { ScaleExponent } from "./locales.ts"
import { MINUS_SIGN, NBSP, localeFormatter, longScaleWord, shortScaleSuffixes } from "./locales.ts"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * How much room the surface has:
 * - "tick"  — axis ticks: short abbreviation ("$24B", fr "24 G$")
 * - "label" — data labels: same short abbreviation as ticks
 * - "long"  — tooltips/tables: spelled out ("$24.1 billion", fr "24,1 milliards $")
 */
export type Verbosity = "tick" | "label" | "long"

/** The display-relevant slice of ColumnMeta that formatting consumes. */
export type FormatMeta = Pick<
    ColumnMeta,
    | "type"
    | "unit"
    | "shortUnit"
    | "prefix"
    | "suffix"
    | "currency"
    | "decimals"
    | "denominator"
    | "derivedUnit"
    | "derivedShortUnit"
>

export interface FormatValueOptions {
    locale: Locale
    verbosity: Verbosity
    /** Force an explicit "+" on positive values (relative-change displays). */
    showSign?: boolean
}

export interface FormatChangeOptions {
    locale: Locale
    /** Defaults to "label". */
    verbosity?: Verbosity
}

export interface ChangeStrings {
    /** Signed absolute change; "pp" units when the column is a percentage. */
    absolute: string
    /** Signed relative change as a percentage; null when start is 0 (undefined ratio). */
    relative: string | null
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Symbol for an ISO currency code. Default and "CAD" render the bare "$". */
function currencySymbol(code: string | undefined): string {
    switch (code) {
        case undefined:
        case "CAD":
            return "$"
        case "USD":
            return "US$"
        case "EUR":
            return "€"
        case "GBP":
            return "£"
        default:
            return code
    }
}

/** Abbreviation tier for a magnitude, given the verbosity's entry threshold. */
function tierExponent(abs: number, threshold: number): ScaleExponent | 0 {
    if (abs < threshold) return 0
    if (abs >= 1e12) return 12
    if (abs >= 1e9) return 9
    if (abs >= 1e6) return 6
    if (abs >= 1e3) return 3
    return 0
}

/**
 * d3-format specifier for the digits.
 *
 * Explicit `meta.decimals` are honoured exactly (fixed, untrimmed) so a
 * column formats consistently everywhere. Smart defaults otherwise:
 * - abbreviated mantissas: 3 significant figures, trimmed ("24.1", "1.2")
 * - |v| ≥ 1: up to 2 decimals, trimmed ("1,234.5")
 * - 0 < |v| < 1: 2 significant figures, trimmed — small values keep their
 *   significance ("0.0004"), never collapse to "0"
 */
function digitsSpecifier(abs: number, abbreviated: boolean, meta: FormatMeta, verbosity: Verbosity): string {
    // Axis ticks trim trailing zeros ("$50.0B" → "$50B") but still respect the
    // column's decimal cap, so integer (decimals: 0) columns stay whole; every
    // other surface keeps the fixed, untrimmed decimals.
    if (meta.decimals !== undefined) {
        return verbosity === "tick" ? `,.${meta.decimals}~f` : `,.${meta.decimals}f`
    }
    if (abbreviated) return ",.3~r"
    if (meta.type === "integer") return ",.0f"
    if (abs > 0 && abs < 1) return ".2~r"
    return ",.2~f"
}

/** True when the formatted digits are all zeros (guards against "−0"). */
function isZeroString(digits: string): boolean {
    return !/[1-9]/.test(digits)
}

interface FormattedNumber {
    /** "" | "+" | true minus. */
    sign: string
    /** Locale-grouped digits of the (abbreviated) magnitude. */
    digits: string
    /** Short suffix or long word, with its joining space; "" when unabbreviated. */
    scale: string
}

function formatNumberParts(value: number, meta: FormatMeta, opts: FormatValueOptions, abbreviate: boolean): FormattedNumber {
    const { locale, verbosity, showSign = false } = opts
    const format = localeFormatter(locale)
    const abs = Math.abs(value)

    const threshold = verbosity === "long" ? 1e6 : 1e3
    let exponent = abbreviate ? tierExponent(abs, threshold) : 0

    // Rounding can push a mantissa past 1000 ("999,950" → "1,000k"): bump tiers.
    if (exponent > 0 && exponent < 12 && abs / 10 ** exponent >= 999.5) {
        exponent += 3
    }

    const mantissa = abs / 10 ** exponent
    const digits = format.format(digitsSpecifier(abs, exponent > 0, meta, verbosity))(mantissa)

    const sign = isZeroString(digits) ? "" : value < 0 ? MINUS_SIGN : showSign && value > 0 ? "+" : ""

    let scale = ""
    if (exponent > 0) {
        scale =
            verbosity === "long"
                ? (locale === "fr" ? NBSP : " ") + longScaleWord(exponent as ScaleExponent, locale, mantissa)
                : locale === "fr"
                  ? NBSP + shortScaleSuffixes.fr[exponent as ScaleExponent]
                  : shortScaleSuffixes.en[exponent as ScaleExponent]
    }

    return { sign, digits, scale }
}

// ---------------------------------------------------------------------------
// formatValue
// ---------------------------------------------------------------------------

/**
 * Format a display value for a column (spec 03 §4).
 *
 * - tick/label verbosity abbreviates from 1e3 with short suffixes
 *   (en "k/M/B/T", fr SI-style "k/M/G/T"); long verbosity spells out scale
 *   words from 1e6 ("24.1 billion", fr "24,1 milliards").
 * - percentage columns never abbreviate and append "%" (fr: NBSP + "%").
 * - currency uses the column's currency symbol, placed per locale
 *   (en "$24B", fr "24 G$").
 * - denominator-derived columns use derivedUnit/derivedShortUnit and drop
 *   the underlying type's symbol ("42.5% of GDP").
 * - negatives carry the true minus sign (U+2212); showSign forces "+".
 */
export function formatValue(value: number, meta: FormatMeta, opts: FormatValueOptions): string {
    if (!Number.isFinite(value)) return ""

    const { locale, verbosity } = opts
    const isDerived = Boolean(meta.denominator && (meta.derivedUnit || meta.derivedShortUnit))
    const isPercent = !isDerived && meta.type === "percentage"
    const isCurrency = !isDerived && meta.type === "currency"

    // The explicit suffix binds to the magnitude (after any auto scale letter),
    // so pre-scaled data reads "$192.9B"; the prefix wraps the whole token.
    const prefix = meta.prefix ?? ""
    const suffix = meta.suffix ?? ""

    // A suffix means the value is already pre-scaled to that unit (e.g. billions
    // with "B"), so auto-abbreviation is suppressed — otherwise 2400 → "2.4kB".
    const { sign, digits, scale } = formatNumberParts(value, meta, opts, !isPercent && suffix === "")

    // A zero value carries no scale suffix — "$0", never "$0B".
    const mag = digits + scale + (isZeroString(digits) ? "" : suffix)
    const wrap = (body: string): string => prefix + body

    if (isCurrency) {
        const symbol = currencySymbol(meta.currency)
        if (locale === "fr") {
            // Symbol trails in French: "1 234 $", "24 G$", "24,1 milliards $".
            const joiner = verbosity !== "long" && scale !== "" ? "" : NBSP
            return wrap(sign + mag + joiner + symbol)
        }
        return wrap(sign + symbol + mag)
    }

    let unit: string | undefined
    if (isDerived) {
        unit = verbosity === "long" ? (meta.derivedUnit ?? meta.derivedShortUnit) : (meta.derivedShortUnit ?? meta.derivedUnit)
    } else if (isPercent) {
        unit = "%"
    } else {
        unit = verbosity === "long" ? (meta.unit ?? meta.shortUnit) : meta.shortUnit
    }

    if (unit) {
        if (locale === "fr") return wrap(sign + mag + NBSP + unit)
        // Percent-style units bind directly to the number in English ("42%", "42.5% of GDP").
        const joiner = unit.startsWith("%") ? "" : " "
        return wrap(sign + mag + joiner + unit)
    }

    return wrap(sign + mag)
}

// ---------------------------------------------------------------------------
// formatChange
// ---------------------------------------------------------------------------

/**
 * Format the change between two display values as signed strings.
 *
 * - `absolute` is end − start in the column's own unit; for percentage
 *   columns the change is in percentage points and labelled "pp".
 * - `relative` is (end − start) / |start| as a signed percentage, or null
 *   when start is 0 (the ratio is undefined; never rendered as 0).
 */
export function formatChange(start: number, end: number, meta: FormatMeta, opts: FormatChangeOptions): ChangeStrings {
    const valueOpts: FormatValueOptions = {
        locale: opts.locale,
        verbosity: opts.verbosity ?? "label",
        showSign: true,
    }
    const diff = end - start

    const absolute =
        meta.type === "percentage"
            ? formatValue(diff, { type: "numeric", unit: "pp", shortUnit: "pp", decimals: meta.decimals }, valueOpts)
            : formatValue(diff, meta, valueOpts)

    const relative =
        start === 0 || !Number.isFinite(start) || !Number.isFinite(end)
            ? null
            : formatValue((diff / Math.abs(start)) * 100, { type: "percentage" }, valueOpts)

    return { absolute, relative }
}
