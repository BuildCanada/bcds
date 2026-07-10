import { describe, expect, it } from "vitest"
import type { Locale, TimeGrain, TimeOrdinal } from "../types.ts"
import { formatTime, formatTimeRange } from "./timeLabels.ts"

// Ordinal encodings under test (types.ts):
//   quarter → year * 4 + (q - 1)      Q3 2024 = 8098
//   month   → year * 12 + (m - 1)     July 2024 = 24294
//   date    → days since 1970-01-01   2024-07-01 = 19905

interface TimeCase {
    description: string
    ordinal: TimeOrdinal
    grain: TimeGrain
    locale: Locale
    expected: string
}

function run(cases: TimeCase[]): void {
    for (const c of cases) {
        it(c.description, () => {
            expect(formatTime(c.ordinal, c.grain, c.locale)).toBe(c.expected)
        })
    }
}

describe("formatTime: year", () => {
    run([
        { description: "years render bare", ordinal: 2024, grain: "year", locale: "en", expected: "2024" },
        { description: "years are locale-invariant", ordinal: 2024, grain: "year", locale: "fr", expected: "2024" },
    ])
})

describe("formatTime: fiscal year", () => {
    run([
        { description: "fiscal years join start and end with an en dash", ordinal: 2024, grain: "fiscal-year", locale: "en", expected: "2024\u201325" },
        { description: "fiscal years are locale-invariant", ordinal: 2024, grain: "fiscal-year", locale: "fr", expected: "2024\u201325" },
        { description: "the century boundary wraps to a zero-padded 00", ordinal: 2099, grain: "fiscal-year", locale: "en", expected: "2099\u201300" },
        { description: "single-digit end years are zero-padded", ordinal: 2008, grain: "fiscal-year", locale: "en", expected: "2008\u201309" },
    ])
})

describe("formatTime: quarter", () => {
    run([
        { description: "quarters render Q-number then year in English", ordinal: 2024 * 4 + 2, grain: "quarter", locale: "en", expected: "Q3 2024" },
        { description: "French quarters use the T prefix (trimestre)", ordinal: 2024 * 4 + 2, grain: "quarter", locale: "fr", expected: "T3 2024" },
        { description: "the first quarter of a year round-trips", ordinal: 2020 * 4, grain: "quarter", locale: "en", expected: "Q1 2020" },
        { description: "the fourth quarter of a year round-trips", ordinal: 1999 * 4 + 3, grain: "quarter", locale: "en", expected: "Q4 1999" },
    ])
})

describe("formatTime: month", () => {
    run([
        { description: "months spell the English month name before the year", ordinal: 2024 * 12 + 6, grain: "month", locale: "en", expected: "July 2024" },
        { description: "French month names are lowercase", ordinal: 2024 * 12 + 6, grain: "month", locale: "fr", expected: "juillet 2024" },
        { description: "January round-trips", ordinal: 2020 * 12, grain: "month", locale: "en", expected: "January 2020" },
        { description: "December round-trips", ordinal: 2020 * 12 + 11, grain: "month", locale: "fr", expected: "décembre 2020" },
        { description: "accented French month names come from the static table", ordinal: 2024 * 12 + 1, grain: "month", locale: "fr", expected: "février 2024" },
    ])
})

describe("formatTime: date", () => {
    run([
        { description: "English dates render month day, year", ordinal: 19905, grain: "date", locale: "en", expected: "July 1, 2024" },
        { description: "French dates render day month year", ordinal: 19905, grain: "date", locale: "fr", expected: "1 juillet 2024" },
        { description: "the epoch itself is January 1, 1970", ordinal: 0, grain: "date", locale: "en", expected: "January 1, 1970" },
        { description: "negative ordinals reach back before the epoch", ordinal: -1, grain: "date", locale: "en", expected: "December 31, 1969" },
        { description: "leap day resolves correctly", ordinal: 19782, grain: "date", locale: "en", expected: "February 29, 2024" },
    ])
})

describe("formatTime: none", () => {
    run([{ description: "grain none has no time labels", ordinal: 0, grain: "none", locale: "en", expected: "" }])
})

describe("formatTimeRange", () => {
    it("joins calendar years with an en dash", () => {
        expect(formatTimeRange(2010, 2024, "year", "en")).toBe("2010\u20132024")
    })

    it("year ranges are locale-invariant", () => {
        expect(formatTimeRange(2010, 2024, "year", "fr")).toBe("2010\u20132024")
    })

    it("spells the connective between fiscal years in English", () => {
        expect(formatTimeRange(2014, 2024, "fiscal-year", "en")).toBe("2014\u201315 to 2024\u201325")
    })

    it("wraps French fiscal ranges in de … à", () => {
        expect(formatTimeRange(2014, 2024, "fiscal-year", "fr")).toBe("de 2014\u201315 à 2024\u201325")
    })

    it("spells the connective between quarters", () => {
        expect(formatTimeRange(2020 * 4, 2024 * 4 + 2, "quarter", "en")).toBe("Q1 2020 to Q3 2024")
    })

    it("wraps French quarter ranges in de … à", () => {
        expect(formatTimeRange(2020 * 4, 2024 * 4 + 2, "quarter", "fr")).toBe("de T1 2020 à T3 2024")
    })

    it("spells the connective between months", () => {
        expect(formatTimeRange(2020 * 12, 2024 * 12 + 6, "month", "en")).toBe("January 2020 to July 2024")
    })

    it("wraps French date ranges in de … à", () => {
        expect(formatTimeRange(0, 19905, "date", "fr")).toBe("de 1 janvier 1970 à 1 juillet 2024")
    })

    it("collapses equal endpoints to a single label", () => {
        expect(formatTimeRange(2024, 2024, "fiscal-year", "en")).toBe("2024\u201325")
    })
})
