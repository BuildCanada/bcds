/**
 * Stacking math — port of owid-grapher stackedCharts/StackedUtils.ts
 * (stackSeries, stackSeriesInBothDirections, withMissingValuesAsZeroes,
 * withUniformSpacing), de-MobX'd and made immutable: every function returns
 * fresh series/point objects and never mutates its input.
 *
 * Contract highlights (spec 15/16):
 * - stackSeries: simple cumulative offsets, first series at the bottom.
 * - stackSeriesInBothDirections: positives stack upward, negatives stack
 *   downward independently — a negative segment with no negative below it
 *   has valueOffset 0 (negatives never offset positives).
 */

import type { SeriesKey, TimeOrdinal } from "../types.ts"

export interface StackedPoint {
    /** X position: time ordinal, or row index for discrete charts. */
    position: number
    time: TimeOrdinal
    value: number
    valueOffset: number
    /** True when this point was zero-filled for a missing value. */
    missing?: boolean
    interpolated?: boolean
}

export interface StackedSeries {
    seriesKey: SeriesKey
    points: StackedPoint[]
}

function cloneSeries(series: StackedSeries): StackedSeries {
    return { ...series, points: series.points.map((point) => ({ ...point })) }
}

/** Shift each series' offsets up by the series below it (positive stacks). */
export function stackSeries(seriesArr: readonly StackedSeries[]): StackedSeries[] {
    const out = seriesArr.map(cloneSeries)
    out.forEach((series, seriesIndex) => {
        if (seriesIndex === 0) return
        series.points.forEach((point, pointIndex) => {
            const below = out[seriesIndex - 1].points[pointIndex]
            point.valueOffset = below.value + below.valueOffset
        })
    })
    return out
}

/** Positives stack upward, negatives stack downward independently. */
export function stackSeriesInBothDirections(seriesArr: readonly StackedSeries[]): StackedSeries[] {
    const out = seriesArr.map(cloneSeries)
    out.forEach((series, seriesIndex) => {
        if (seriesIndex === 0) return
        series.points.forEach((point, pointIndex) => {
            const pointsBelow = out.slice(0, seriesIndex).map((s) => s.points[pointIndex])
            const below =
                point.value < 0
                    ? pointsBelow.findLast((p) => p.value < 0)
                    : pointsBelow.findLast((p) => p.value >= 0)
            point.valueOffset = below !== undefined ? below.value + below.valueOffset : 0
        })
    })
    return out
}

function gcdTwo(a: number, b: number): number {
    while (b !== 0) {
        const t = b
        b = a % b
        a = t
    }
    return a
}

/** Fill integer-spaced gaps so values become evenly spaced. */
export function withUniformSpacing(values: number[]): number[] {
    if (values.length < 2) return values
    const deltas = values.slice(1).map((v, i) => v - values[i])
    if (!deltas.every((d) => Number.isInteger(d) && d > 0)) return values
    const gcd = deltas.reduce((acc, d) => gcdTwo(acc, d))
    if (gcd <= 0) return values
    const out: number[] = []
    for (let v = values[0]; v <= values[values.length - 1]; v += gcd) out.push(v)
    return out
}

/**
 * Align every series onto the union of x positions, inserting value-0
 * points flagged `missing: true` where a series has no value. Missing is
 * still missing — the flag is what keeps tooltips honest about it.
 */
export function withMissingValuesAsZeroes(
    seriesArr: readonly StackedSeries[],
    { enforceUniformSpacing = false }: { enforceUniformSpacing?: boolean } = {},
): StackedSeries[] {
    let positions = [...new Set(seriesArr.flatMap((series) => series.points.map((point) => point.position)))].sort(
        (a, b) => a - b,
    )
    if (enforceUniformSpacing) positions = withUniformSpacing(positions)

    return seriesArr.map((series) => {
        const byPosition = new Map(series.points.map((point) => [point.position, point]))
        return {
            ...series,
            points: positions.map((position) => {
                const point = byPosition.get(position)
                return {
                    position,
                    time: point?.time ?? 0,
                    value: point?.value ?? 0,
                    valueOffset: 0,
                    missing: point === undefined,
                    ...(point?.interpolated !== undefined ? { interpolated: point.interpolated } : {}),
                }
            }),
        }
    })
}
