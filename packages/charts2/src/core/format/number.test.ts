import { describe, expect, it } from "vitest"
import type { FormatMeta, FormatValueOptions, Verbosity } from "./number.ts"
import type { Locale } from "../types.ts"
import { formatChange, formatValue } from "./number.ts"

const numeric: FormatMeta = { type: "numeric" }
const integer: FormatMeta = { type: "integer" }
const percentage: FormatMeta = { type: "percentage" }
const cad: FormatMeta = { type: "currency", currency: "CAD" }
const debtToGdp: FormatMeta = {
    type: "currency",
    currency: "CAD",
    denominator: "gdp",
    derivedUnit: "% of GDP",
    derivedShortUnit: "%",
}

interface Case {
    description: string
    value: number
    meta: FormatMeta
    locale: Locale
    verbosity: Verbosity
    showSign?: boolean
    expected: string
}

function run(cases: Case[]): void {
    for (const c of cases) {
        it(c.description, () => {
            const opts: FormatValueOptions = { locale: c.locale, verbosity: c.verbosity, showSign: c.showSign }
            expect(formatValue(c.value, c.meta, opts)).toBe(c.expected)
        })
    }
}

describe("formatValue: abbreviation thresholds (en ticks)", () => {
    run([
        { description: "999 stays unabbreviated below the 1e3 threshold", value: 999, meta: numeric, locale: "en", verbosity: "tick", expected: "999" },
        { description: "exactly 1e3 abbreviates to 1k", value: 1_000, meta: numeric, locale: "en", verbosity: "tick", expected: "1k" },
        { description: "1,200 abbreviates to 1.2k", value: 1_200, meta: numeric, locale: "en", verbosity: "tick", expected: "1.2k" },
        { description: "999,999 rounds up across the tier boundary to 1M, never 1,000k", value: 999_999, meta: numeric, locale: "en", verbosity: "tick", expected: "1M" },
        { description: "exactly 1e6 abbreviates to 1M", value: 1_000_000, meta: numeric, locale: "en", verbosity: "tick", expected: "1M" },
        { description: "1.2 million abbreviates to 1.2M", value: 1_200_000, meta: numeric, locale: "en", verbosity: "tick", expected: "1.2M" },
        { description: "exactly 1e9 abbreviates to 1B", value: 1e9, meta: numeric, locale: "en", verbosity: "tick", expected: "1B" },
        { description: "exactly 1e12 abbreviates to 1T", value: 1e12, meta: numeric, locale: "en", verbosity: "tick", expected: "1T" },
        { description: "2.4 quadrillion stays in the trillion tier with grouping", value: 2.4e15, meta: numeric, locale: "en", verbosity: "tick", expected: "2,400T" },
        { description: "mantissas keep three significant figures (12.84M not 13M)", value: 12_837_000, meta: numeric, locale: "en", verbosity: "tick", expected: "12.8M" },
    ])
})

describe("formatValue: long verbosity spells out scale words", () => {
    run([
        { description: "24.1 billion spells out in English tooltips", value: 24.13e9, meta: numeric, locale: "en", verbosity: "long", expected: "24.1 billion" },
        { description: "long form does not abbreviate below one million", value: 999_999, meta: numeric, locale: "en", verbosity: "long", expected: "999,999" },
        { description: "1.2 million spells out", value: 1_200_000, meta: numeric, locale: "en", verbosity: "long", expected: "1.2 million" },
        { description: "1.5 trillion spells out", value: 1.5e12, meta: numeric, locale: "en", verbosity: "long", expected: "1.5 trillion" },
        { description: "fr: 1,2 milliard stays singular below two (NBSP joins the word)", value: 1.2e9, meta: numeric, locale: "fr", verbosity: "long", expected: "1,2\u00a0milliard" },
        { description: "fr: 24,1 milliards pluralizes at two and above", value: 24.1e9, meta: numeric, locale: "fr", verbosity: "long", expected: "24,1\u00a0milliards" },
        { description: "fr: 3 billions is the French long-scale word for 1e12", value: 3e12, meta: numeric, locale: "fr", verbosity: "long", expected: "3\u00a0billions" },
        { description: "fr: unabbreviated values group thousands with narrow NBSP", value: 10_000, meta: numeric, locale: "fr", verbosity: "long", expected: "10\u202f000" },
    ])
})

describe("formatValue: French ticks use SI-style suffixes", () => {
    run([
        { description: "fr tick: 1,2 M with NBSP before the suffix", value: 1_200_000, meta: numeric, locale: "fr", verbosity: "tick", expected: "1,2\u00a0M" },
        { description: "fr tick: G for milliard", value: 24e9, meta: numeric, locale: "fr", verbosity: "tick", expected: "24\u00a0G" },
        { description: "fr tick: T for the French billion (1e12)", value: 2e12, meta: numeric, locale: "fr", verbosity: "tick", expected: "2\u00a0T" },
        { description: "fr tick: decimal comma in the mantissa", value: 1_250, meta: numeric, locale: "fr", verbosity: "tick", expected: "1,25\u00a0k" },
    ])
})

describe("formatValue: signs", () => {
    run([
        { description: "negative values carry the true minus sign, never a hyphen", value: -1_200_000, meta: numeric, locale: "en", verbosity: "tick", expected: "\u22121.2M" },
        { description: "negative currency keeps the minus outside the symbol", value: -24e9, meta: cad, locale: "en", verbosity: "tick", expected: "\u2212$24B" },
        { description: "fr negative uses the true minus sign too", value: -1.2e9, meta: numeric, locale: "fr", verbosity: "long", expected: "\u22121,2\u00a0milliard" },
        { description: "showSign forces an explicit plus on percentages", value: 3.2, meta: percentage, locale: "en", verbosity: "label", showSign: true, expected: "+3.2%" },
        { description: "showSign leaves zero unsigned", value: 0, meta: numeric, locale: "en", verbosity: "tick", showSign: true, expected: "0" },
        { description: "a negative that rounds to zero drops the minus sign", value: -0.4, meta: { type: "numeric", decimals: 0 }, locale: "en", verbosity: "tick", expected: "0" },
        { description: "zero formats as a bare 0", value: 0, meta: numeric, locale: "en", verbosity: "long", expected: "0" },
    ])
})

describe("formatValue: currency", () => {
    run([
        { description: "en tick: symbol leads and B abbreviates", value: 24e9, meta: cad, locale: "en", verbosity: "tick", expected: "$24B" },
        { description: "en tick: $24.1B keeps mantissa significance", value: 24.13e9, meta: cad, locale: "en", verbosity: "tick", expected: "$24.1B" },
        { description: "en long: $24.1 billion spells out behind the symbol", value: 24.13e9, meta: cad, locale: "en", verbosity: "long", expected: "$24.1 billion" },
        { description: "en unabbreviated currency keeps grouping", value: 950, meta: cad, locale: "en", verbosity: "tick", expected: "$950" },
        { description: "missing currency code defaults to the CAD dollar sign", value: 5_000, meta: { type: "currency" }, locale: "en", verbosity: "tick", expected: "$5k" },
        { description: "USD renders the disambiguated US$ symbol", value: 5_000, meta: { type: "currency", currency: "USD" }, locale: "en", verbosity: "tick", expected: "US$5k" },
        { description: "fr tick: 24 G$ puts the symbol after the SI suffix", value: 24e9, meta: cad, locale: "fr", verbosity: "tick", expected: "24\u00a0G$" },
        { description: "fr unabbreviated: symbol trails behind an NBSP", value: 950, meta: cad, locale: "fr", verbosity: "tick", expected: "950\u00a0$" },
        { description: "fr long: 24,1 milliards $ trails the symbol", value: 24.13e9, meta: cad, locale: "fr", verbosity: "long", expected: "24,1\u00a0milliards\u00a0$" },
    ])
})

describe("formatValue: percentages", () => {
    run([
        { description: "percentage appends % with no space in English", value: 42, meta: percentage, locale: "en", verbosity: "tick", expected: "42%" },
        { description: "fr percentage binds % with an NBSP", value: 42, meta: percentage, locale: "fr", verbosity: "tick", expected: "42\u00a0%" },
        { description: "percentages never abbreviate, even past 1e3", value: 1_500, meta: percentage, locale: "en", verbosity: "tick", expected: "1,500%" },
        { description: "negative percentage takes the true minus", value: -3.2, meta: percentage, locale: "en", verbosity: "label", expected: "\u22123.2%" },
        { description: "fr percentage uses the decimal comma", value: 3.2, meta: percentage, locale: "fr", verbosity: "label", showSign: true, expected: "+3,2\u00a0%" },
    ])
})

describe("formatValue: decimals and smart defaults", () => {
    run([
        { description: "explicit decimals are honoured exactly, untrimmed", value: 24, meta: { type: "numeric", decimals: 1 }, locale: "en", verbosity: "label", expected: "24.0" },
        { description: "explicit decimals: 0 rounds to whole numbers", value: 3.7, meta: { type: "numeric", decimals: 0 }, locale: "en", verbosity: "label", expected: "4" },
        { description: "axis ticks trim trailing zeros from abbreviated mantissas", value: 24e9, meta: { type: "currency", currency: "CAD", decimals: 1 }, locale: "en", verbosity: "tick", expected: "$24B" },
        { description: "smart default trims to at most two decimals at unit scale", value: 3.14159, meta: numeric, locale: "en", verbosity: "label", expected: "3.14" },
        { description: "smart default keeps grouping below the long-form threshold", value: 1_234.5, meta: numeric, locale: "en", verbosity: "long", expected: "1,234.5" },
        { description: "very small values keep their significance", value: 0.0004, meta: numeric, locale: "en", verbosity: "label", expected: "0.0004" },
        { description: "very small values round to two significant figures", value: 0.000456, meta: numeric, locale: "en", verbosity: "label", expected: "0.00046" },
        { description: "integer columns never show decimals", value: 1_234.6, meta: integer, locale: "en", verbosity: "long", expected: "1,235" },
        { description: "integer columns still abbreviate on ticks", value: 1_200_000, meta: integer, locale: "en", verbosity: "tick", expected: "1.2M" },
    ])
})

describe("formatValue: units", () => {
    run([
        { description: "short unit attaches to ticks with a space", value: 1_200_000, meta: { type: "numeric", shortUnit: "t" }, locale: "en", verbosity: "tick", expected: "1.2M t" },
        { description: "long unit appears at long verbosity", value: 24.1e9, meta: { type: "numeric", unit: "tonnes", shortUnit: "t" }, locale: "en", verbosity: "long", expected: "24.1 billion tonnes" },
        { description: "ticks fall back to nothing when no short unit exists", value: 12, meta: { type: "numeric", unit: "tonnes" }, locale: "en", verbosity: "tick", expected: "12" },
        { description: "long verbosity falls back to the short unit", value: 12, meta: { type: "numeric", shortUnit: "t" }, locale: "en", verbosity: "long", expected: "12 t" },
        { description: "fr units bind with an NBSP", value: 1_200_000, meta: { type: "numeric", shortUnit: "t" }, locale: "fr", verbosity: "tick", expected: "1,2\u00a0M\u00a0t" },
    ])
})

describe("formatValue: derived columns (denominator)", () => {
    run([
        { description: "derived short unit replaces the currency symbol on ticks", value: 42.5, meta: debtToGdp, locale: "en", verbosity: "tick", expected: "42.5%" },
        { description: "derived long unit spells the ratio out", value: 42.5, meta: debtToGdp, locale: "en", verbosity: "long", expected: "42.5% of GDP" },
        { description: "fr derived unit binds with an NBSP", value: 42.5, meta: { ...debtToGdp, derivedUnit: "% du PIB" }, locale: "fr", verbosity: "long", expected: "42,5\u00a0% du PIB" },
        { description: "a denominator without derived units leaves base behavior intact", value: 42.5, meta: { type: "currency", currency: "CAD", denominator: "population" }, locale: "en", verbosity: "tick", expected: "$42.5" },
    ])
})

describe("formatValue: prefix and suffix", () => {
    run([
        // Suffix binds to the magnitude and suppresses auto-abbreviation, so
        // data pre-scaled to billions reads "$192.9B" rather than "$192.9".
        { description: "suffix on a pre-scaled currency column (en)", value: 192.9, meta: { type: "currency", currency: "CAD", suffix: "B", decimals: 1 }, locale: "en", verbosity: "tick", expected: "$192.9B" },
        { description: "suffix suppresses abbreviation past 1e3, no '2.4kB'", value: 2400, meta: { type: "currency", currency: "CAD", suffix: "B" }, locale: "en", verbosity: "tick", expected: "$2,400B" },
        { description: "a millions suffix reads $100M", value: 100, meta: { type: "currency", currency: "CAD", suffix: "M" }, locale: "en", verbosity: "tick", expected: "$100M" },
        { description: "negative currency keeps the true minus before the suffix", value: -5, meta: { type: "currency", currency: "CAD", suffix: "B", decimals: 0 }, locale: "en", verbosity: "tick", expected: "−$5B" },
        { description: "axis tick trims a suffixed column's trailing zeros ($50B not $50.0B)", value: 50, meta: { type: "currency", currency: "CAD", suffix: "B", decimals: 1 }, locale: "en", verbosity: "tick", expected: "$50B" },
        { description: "zero drops the scale suffix on the axis ($0 not $0B)", value: 0, meta: { type: "currency", currency: "CAD", suffix: "B", decimals: 1 }, locale: "en", verbosity: "tick", expected: "$0" },
        { description: "zero drops the suffix on non-tick surfaces too (keeps its decimals)", value: 0, meta: { type: "currency", currency: "CAD", suffix: "B", decimals: 1 }, locale: "en", verbosity: "label", expected: "$0.0" },
        { description: "the suffix carries through long verbosity too", value: 192.9, meta: { type: "currency", currency: "CAD", suffix: "B", decimals: 1 }, locale: "en", verbosity: "long", expected: "$192.9B" },
        { description: "prefix wraps the whole token (en)", value: 42, meta: { type: "numeric", prefix: "~" }, locale: "en", verbosity: "tick", expected: "~42" },
        { description: "prefix and suffix together (en)", value: 5, meta: { type: "numeric", prefix: "~", suffix: "x" }, locale: "en", verbosity: "label", expected: "~5x" },
        { description: "prefix wraps a percentage's % as well", value: 42, meta: { type: "percentage", prefix: "~" }, locale: "en", verbosity: "tick", expected: "~42%" },
        { description: "fr: suffix binds to the magnitude before the trailing symbol", value: 192.9, meta: { type: "currency", currency: "CAD", suffix: "B", decimals: 1 }, locale: "fr", verbosity: "tick", expected: "192,9B $" },
        { description: "fr: a plain numeric suffix attaches to the magnitude", value: 5, meta: { type: "numeric", suffix: "x" }, locale: "fr", verbosity: "label", expected: "5x" },
        { description: "regression: absent prefix/suffix leaves currency unchanged", value: 24e9, meta: { type: "currency", currency: "CAD" }, locale: "en", verbosity: "tick", expected: "$24B" },
    ])
})

describe("formatChange", () => {
    it("labels percentage-point changes with pp and the relative change with %", () => {
        const { absolute, relative } = formatChange(50, 53.2, percentage, { locale: "en" })
        expect(absolute).toBe("+3.2 pp")
        expect(relative).toBe("+6.4%")
    })

    it("formats a negative percentage-point change with the true minus", () => {
        const { absolute, relative } = formatChange(40, 30, percentage, { locale: "en" })
        expect(absolute).toBe("\u221210 pp")
        expect(relative).toBe("\u221225%")
    })

    it("fr: binds pp and % with NBSP and uses the decimal comma", () => {
        const { absolute, relative } = formatChange(50, 53.2, percentage, { locale: "fr" })
        expect(absolute).toBe("+3,2\u00a0pp")
        expect(relative).toBe("+6,4\u00a0%")
    })

    it("formats currency changes in the column's own unit", () => {
        const { absolute, relative } = formatChange(100, 80, cad, { locale: "en" })
        expect(absolute).toBe("\u2212$20")
        expect(relative).toBe("\u221220%")
    })

    it("abbreviates large absolute changes at the requested verbosity", () => {
        const { absolute } = formatChange(10e9, 34.1e9, cad, { locale: "en", verbosity: "tick" })
        expect(absolute).toBe("+$24.1B")
    })

    it("returns null relative change when the start value is zero", () => {
        const { absolute, relative } = formatChange(0, 5, numeric, { locale: "en" })
        expect(absolute).toBe("+5")
        expect(relative).toBeNull()
    })

    it("measures relative change against the magnitude of a negative start", () => {
        const { absolute, relative } = formatChange(-10, -5, numeric, { locale: "en" })
        expect(absolute).toBe("+5")
        expect(relative).toBe("+50%")
    })
})
