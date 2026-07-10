import { describe, expect, it } from "vitest"

import { compareTimes, formatTimeOrdinalRaw, parseTime, snapToAvailable } from "./time.ts"

describe("parseTime / formatTimeOrdinalRaw round-trips", () => {
    it("parses year grain from strings and numbers", () => {
        expect(parseTime("2024", "year")).toBe(2024)
        expect(parseTime(2024, "year")).toBe(2024)
        expect(parseTime("1867", "year")).toBe(1867)
        expect(formatTimeOrdinalRaw(2024, "year")).toBe("2024")
    })

    it("rejects non-integer year values", () => {
        expect(parseTime("2024.5", "year")).toBeNull()
        expect(parseTime(2024.5, "year")).toBeNull()
        expect(parseTime("twenty", "year")).toBeNull()
    })

    it("parses fiscal years to their start year", () => {
        expect(parseTime("2024-25", "fiscal-year")).toBe(2024)
        expect(parseTime("2019-20", "fiscal-year")).toBe(2019)
        expect(formatTimeOrdinalRaw(2024, "fiscal-year")).toBe("2024-25")
    })

    it("handles the century boundary in fiscal years", () => {
        expect(parseTime("1999-00", "fiscal-year")).toBe(1999)
        expect(formatTimeOrdinalRaw(1999, "fiscal-year")).toBe("1999-00")
        expect(parseTime("2099-00", "fiscal-year")).toBe(2099)
    })

    it("rejects fiscal years whose YY suffix is not start + 1", () => {
        expect(parseTime("2024-26", "fiscal-year")).toBeNull()
        expect(parseTime("2024-24", "fiscal-year")).toBeNull()
        expect(parseTime("2024-2025", "fiscal-year")).toBeNull()
    })

    it("encodes quarters as year*4 + (q-1)", () => {
        expect(parseTime("2024-Q3", "quarter")).toBe(2024 * 4 + 2)
        expect(parseTime("2024-Q1", "quarter")).toBe(2024 * 4)
        expect(formatTimeOrdinalRaw(2024 * 4 + 2, "quarter")).toBe("2024-Q3")
        expect(parseTime("2024-Q5", "quarter")).toBeNull()
    })

    it("encodes months as year*12 + (m-1)", () => {
        expect(parseTime("2024-07", "month")).toBe(2024 * 12 + 6)
        expect(parseTime("2024-01", "month")).toBe(2024 * 12)
        expect(parseTime("2024-12", "month")).toBe(2024 * 12 + 11)
        expect(formatTimeOrdinalRaw(2024 * 12 + 6, "month")).toBe("2024-07")
        expect(parseTime("2024-13", "month")).toBeNull()
        expect(parseTime("2024-00", "month")).toBeNull()
    })

    it("encodes dates as days since 1970-01-01 UTC", () => {
        expect(parseTime("1970-01-01", "date")).toBe(0)
        expect(parseTime("1970-01-02", "date")).toBe(1)
        expect(parseTime("1969-12-31", "date")).toBe(-1)
        expect(parseTime("2024-07-01", "date")).toBe(19905)
        expect(formatTimeOrdinalRaw(19905, "date")).toBe("2024-07-01")
        expect(formatTimeOrdinalRaw(0, "date")).toBe("1970-01-01")
    })

    it("rejects calendar-invalid dates instead of letting Date overflow them", () => {
        expect(parseTime("2024-02-30", "date")).toBeNull()
        expect(parseTime("2023-02-29", "date")).toBeNull()
        expect(parseTime("2024-02-29", "date")).toBe(parseTime("2024-02-28", "date")! + 1)
    })

    it("round-trips every grain through format → parse", () => {
        const cases: Array<["year" | "fiscal-year" | "quarter" | "month" | "date", number]> = [
            ["year", 2024],
            ["fiscal-year", 2019],
            ["quarter", 2024 * 4 + 3],
            ["month", 2024 * 12],
            ["date", 19905],
        ]
        for (const [grain, ordinal] of cases) {
            expect(parseTime(formatTimeOrdinalRaw(ordinal, grain), grain)).toBe(ordinal)
        }
    })

    it("never parses times under the none grain", () => {
        expect(parseTime("2024", "none")).toBeNull()
        expect(parseTime(2024, "none")).toBeNull()
        expect(formatTimeOrdinalRaw(2024, "none")).toBe("")
    })

    it("returns null for null/undefined raw values", () => {
        expect(parseTime(null, "year")).toBeNull()
        expect(parseTime(undefined, "year")).toBeNull()
    })
})

describe("snapToAvailable", () => {
    const times = [2019, 2021, 2024]

    it("returns exact matches unchanged", () => {
        expect(snapToAvailable(2021, times)).toBe(2021)
    })

    it("snaps to the nearest available time", () => {
        expect(snapToAvailable(2018, times)).toBe(2019)
        expect(snapToAvailable(2023, times)).toBe(2024)
        expect(snapToAvailable(2025, times)).toBe(2024)
    })

    it("clamps to the extremes", () => {
        expect(snapToAvailable(1900, times)).toBe(2019)
        expect(snapToAvailable(3000, times)).toBe(2024)
    })

    it("resolves equidistant ties to the earlier time", () => {
        expect(snapToAvailable(2020, times)).toBe(2019)
        expect(snapToAvailable(2020, [2018, 2022])).toBe(2018)
    })

    it("returns null when no times are available", () => {
        expect(snapToAvailable(2020, [])).toBeNull()
    })
})

describe("compareTimes", () => {
    it("orders ordinals ascending", () => {
        expect([2024, 2019, 2021].sort(compareTimes)).toEqual([2019, 2021, 2024])
        expect(compareTimes(5, 5)).toBe(0)
    })
})
