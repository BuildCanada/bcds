import { describe, expect, it } from "vitest"

import { resolveWithTolerance } from "./tolerance.ts"

describe("resolveWithTolerance", () => {
    const times = [2018, 2019, 2021, 2022]
    const values = [10, null, 30, 40]

    it("returns the exact value when present", () => {
        expect(resolveWithTolerance(times, values, 2018, 0, "both")).toEqual({ value: 10, sourceTime: 2018 })
    })

    it("returns null when the target is missing and tolerance is 0", () => {
        expect(resolveWithTolerance(times, values, 2019, 0, "both")).toBeNull()
        expect(resolveWithTolerance(times, values, 2020, 0, "both")).toBeNull()
    })

    it("borrows the nearest non-null value within tolerance", () => {
        // 2019 is null; 2018 (distance 1) beats 2021 (distance 2)
        expect(resolveWithTolerance(times, values, 2019, 2, "both")).toEqual({ value: 10, sourceTime: 2018 })
    })

    it("skips null cells even when they are nearest", () => {
        // target 2020: 2019 and 2021 both distance 1, but 2019 is null
        expect(resolveWithTolerance(times, values, 2020, 1, "both")).toEqual({ value: 30, sourceTime: 2021 })
    })

    it("resolves equidistant ties to the earlier time", () => {
        expect(resolveWithTolerance([2019, 2021], [10, 20], 2020, 1, "both")).toEqual({
            value: 10,
            sourceTime: 2019,
        })
    })

    it("respects direction: backwards borrows only from earlier times", () => {
        expect(resolveWithTolerance([2019, 2021], [10, 20], 2020, 1, "backwards")).toEqual({
            value: 10,
            sourceTime: 2019,
        })
        // nothing earlier in range → null even though 2021 is within tolerance
        expect(resolveWithTolerance([2021], [20], 2020, 1, "backwards")).toBeNull()
    })

    it("respects direction: forwards borrows only from later times", () => {
        expect(resolveWithTolerance([2019, 2021], [10, 20], 2020, 1, "forwards")).toEqual({
            value: 20,
            sourceTime: 2021,
        })
        expect(resolveWithTolerance([2019], [10], 2020, 1, "forwards")).toBeNull()
    })

    it("direction includes the target time itself", () => {
        expect(resolveWithTolerance([2020], [15], 2020, 1, "backwards")).toEqual({ value: 15, sourceTime: 2020 })
        expect(resolveWithTolerance([2020], [15], 2020, 1, "forwards")).toEqual({ value: 15, sourceTime: 2020 })
    })

    it("borrows at the data extents but never beyond tolerance", () => {
        // target past the last time: borrowing existing values is allowed…
        expect(resolveWithTolerance(times, values, 2024, 2, "both")).toEqual({ value: 40, sourceTime: 2022 })
        // …but never further than the tolerance allows (no extrapolation)
        expect(resolveWithTolerance(times, values, 2025, 2, "both")).toBeNull()
    })

    it("runs a (gap pattern × tolerance × direction) table", () => {
        const t = [1, 2, 3, 4, 5]
        const v = [100, null, null, null, 500]
        const cases: Array<[number, number, "both" | "backwards" | "forwards", unknown]> = [
            [3, 0, "both", null],
            [3, 1, "both", null],
            [3, 2, "both", { value: 100, sourceTime: 1 }], // tie 1 vs 5 → earlier
            [3, 2, "forwards", { value: 500, sourceTime: 5 }],
            [3, 2, "backwards", { value: 100, sourceTime: 1 }],
            [2, 1, "both", { value: 100, sourceTime: 1 }],
            [4, 1, "both", { value: 500, sourceTime: 5 }],
            [4, 1, "backwards", null],
        ]
        for (const [target, tolerance, direction, expected] of cases) {
            expect(resolveWithTolerance(t, v, target, tolerance, direction), `target ${target} ±${tolerance} ${direction}`).toEqual(expected)
        }
    })

    it("borrows categorical (string) values too", () => {
        expect(resolveWithTolerance([2019], ["Health"], 2020, 1, "both")).toEqual({
            value: "Health",
            sourceTime: 2019,
        })
    })

    it("returns null for an empty series", () => {
        expect(resolveWithTolerance([], [], 2020, 5, "both")).toBeNull()
    })
})
