import { describe, expect, it } from "vitest"

import {
    stackSeries,
    stackSeriesInBothDirections,
    withMissingValuesAsZeroes,
    withUniformSpacing,
    type StackedSeries,
} from "./stacking.ts"

// Fixtures ported from owid-grapher StackedUtils.test.ts.
const seriesArr = (): StackedSeries[] => [
    {
        seriesKey: "Canada",
        points: [
            { position: 2000, time: 2000, value: 10, valueOffset: 0 },
            { position: 2002, time: 2002, value: 12, valueOffset: 0 },
        ],
    },
    {
        seriesKey: "USA",
        points: [{ position: 2000, time: 2000, value: 2, valueOffset: 0 }],
    },
    {
        seriesKey: "France",
        points: [
            { position: 2000, time: 2000, value: 6, valueOffset: 0 },
            { position: 2003, time: 2003, value: 4, valueOffset: 0 },
        ],
    },
]

const seriesArrWithNegativeValues = (): StackedSeries[] => [
    {
        seriesKey: "Canada",
        points: [
            { position: 2000, time: 2000, value: -10, valueOffset: 0 },
            { position: 2002, time: 2002, value: 12, valueOffset: 0 },
        ],
    },
    {
        seriesKey: "USA",
        points: [{ position: 2000, time: 2000, value: 2, valueOffset: 0 }],
    },
    {
        seriesKey: "France",
        points: [
            { position: 2000, time: 2000, value: -6, valueOffset: 0 },
            { position: 2002, time: 2002, value: -4, valueOffset: 0 },
        ],
    },
]

describe("withUniformSpacing", () => {
    it("can add values to make an array evenly spaced", () => {
        expect(withUniformSpacing([])).toEqual([])
        expect(withUniformSpacing([5])).toEqual([5])
        expect(withUniformSpacing([5, 10])).toEqual([5, 10])
        expect(withUniformSpacing([5, 10, 15])).toEqual([5, 10, 15])
        expect(withUniformSpacing([2, 4, 8])).toEqual([2, 4, 6, 8])
        expect(withUniformSpacing([1, 2, 4, 8])).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
        expect(withUniformSpacing([7, 12, 17])).toEqual([7, 12, 17])
    })
})

describe("withMissingValuesAsZeroes", () => {
    it("can add fake points flagged as missing", () => {
        const input = seriesArr()
        expect(input[1].points[1]).toEqual(undefined)
        const series = withMissingValuesAsZeroes(input)
        expect(series[1].points[1].position).toEqual(2002)
        expect(series[1].points[1].value).toEqual(0)
        expect(series[1].points[1].missing).toBe(true)
        expect(series[0].points[0].missing).toBe(false)
    })

    it("can enforce uniform spacing on the x-axis", () => {
        const series = withMissingValuesAsZeroes(seriesArr(), { enforceUniformSpacing: true })
        expect(series[1].points[1].position).toEqual(2001)
        expect(series[1].points[2].position).toEqual(2002)
        expect(series[1].points[3].position).toEqual(2003)
    })

    it("never mutates its input", () => {
        const input = seriesArr()
        withMissingValuesAsZeroes(input)
        expect(input[1].points.length).toBe(1)
    })
})

describe("stackSeries", () => {
    it("can stack series", () => {
        const input = withMissingValuesAsZeroes(seriesArr())
        expect(input[1].points[0].valueOffset).toEqual(0)
        const series = stackSeries(input)
        expect(series[1].points[0].valueOffset).toEqual(10)
        expect(series[2].points[0].valueOffset).toEqual(12)
        // Input untouched.
        expect(input[1].points[0].valueOffset).toEqual(0)
    })
})

describe("stackSeriesInBothDirections", () => {
    it("can stack positive values", () => {
        const series = stackSeriesInBothDirections(withMissingValuesAsZeroes(seriesArr()))
        expect(series[1].points[0].valueOffset).toEqual(10) // USA 2000
        expect(series[2].points[0].valueOffset).toEqual(12) // France 2000
    })

    it("stacks negatives downward independently of positives", () => {
        const series = stackSeriesInBothDirections(withMissingValuesAsZeroes(seriesArrWithNegativeValues()))
        expect(series[1].points[0].valueOffset).toEqual(0) // USA 2000: first positive
        expect(series[2].points[0].valueOffset).toEqual(-10) // France 2000: below Canada's −10
        expect(series[2].points[1].valueOffset).toEqual(0) // France 2002: first negative
    })
})
