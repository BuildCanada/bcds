/**
 * Scales and domains (spec 03 §1–2).
 *
 * Domain rules: bar-like marks always include zero; line marks include zero
 * unless released with min: "auto"; manual min/max override; nice extension
 * never exceeds ~25% of a tick step beyond the data (ported from
 * owid-grapher axis/Axis.ts makeScaleNice). Log scales exclude non-positive
 * values and report how many were excluded.
 */

import { scaleLinear, scaleLog } from "d3-scale"

import type { AxisConfig, Diagnostic, ScaleType } from "../types.ts"

export type MarkType = "bar" | "line"

/** Spec 03 §3: target tick count adapts to pixel length, roughly 6 at default size. */
export function targetTickCount(pixelLength: number, fontSizePx: number): number {
    const raw = Math.round(pixelLength / (fontSizePx * 1.8))
    return Math.min(6, Math.max(2, raw))
}

// ---------------------------------------------------------------------------
// Nice domains (port of AbstractAxis.makeScaleNice)
// ---------------------------------------------------------------------------

export interface NiceDomainResult {
    domain: [number, number]
    ticks: number[]
}

/**
 * Extend a linear domain to round tick values. The extension never exceeds
 * 25% of one tick step beyond the data (otherwise the data edge is kept and
 * the outermost tick sits inside the domain).
 */
export function niceLinearDomain(min: number, max: number, targetTicks: number): NiceDomainResult {
    if (min === max) return { domain: [min, max], ticks: [min] }

    const scale = scaleLinear().domain([min, max])
    let ticks = scale.ticks(targetTicks)

    if (ticks.length < 2) {
        const nice = scale.nice(targetTicks)
        const domain = nice.domain() as [number, number]
        return { domain, ticks: nice.ticks(targetTicks) }
    }

    const step = ticks[1] - ticks[0]
    const first = ticks[0]
    const last = ticks[ticks.length - 1]

    let lo = min
    let hi = max
    if (max > last + 0.25 * step) {
        hi = last + step
        ticks = [...ticks, hi]
    }
    if (min < first - 0.25 * step) {
        lo = first - step
        ticks = [lo, ...ticks]
    }
    return { domain: [lo, hi], ticks }
}

// ---------------------------------------------------------------------------
// Value domains (spec 03 §2)
// ---------------------------------------------------------------------------

export interface DomainInput {
    values: readonly number[]
    markType: MarkType
    scaleType: ScaleType
    config?: AxisConfig
}

export interface DomainResult {
    min: number
    max: number
    /** Count of values excluded by a log scale (0 on linear). */
    excludedCount: number
    diagnostics: Diagnostic[]
}

export function computeValueDomain({ values, markType, scaleType, config }: DomainInput): DomainResult {
    const diagnostics: Diagnostic[] = []
    let usable = values.filter((v) => Number.isFinite(v))
    let excludedCount = 0

    if (scaleType === "log") {
        const positive = usable.filter((v) => v > 0)
        excludedCount = usable.length - positive.length
        if (excludedCount > 0) {
            diagnostics.push({
                severity: "warning",
                code: "log-excluded-values",
                message: `${excludedCount} non-positive value${excludedCount === 1 ? "" : "s"} excluded from the log scale`,
                context: { count: excludedCount },
            })
        }
        usable = positive
    }

    let min = usable.length > 0 ? Math.min(...usable) : scaleType === "log" ? 1 : 0
    let max = usable.length > 0 ? Math.max(...usable) : scaleType === "log" ? 10 : 1

    if (scaleType !== "log") {
        const releaseZero = markType === "line" && config?.min === "auto"
        if (!releaseZero) {
            min = Math.min(min, 0)
            max = Math.max(max, 0)
        }
    }

    if (typeof config?.min === "number") min = config.min
    if (typeof config?.max === "number") max = config.max
    if (min > max) {
        const swap = min
        min = max
        max = swap
    }

    return { min, max, excludedCount, diagnostics }
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

/** Single-value domain alignment (spec 03 §2): no degenerate axes. */
export type SingleValueAlign = "start" | "middle" | "end"

export interface ValueScale {
    type: ScaleType
    domain: [number, number]
    range: [number, number]
    place: (value: number) => number
}

export function createValueScale(
    type: ScaleType,
    domain: [number, number],
    range: [number, number],
    align: SingleValueAlign = "middle",
): ValueScale {
    if (domain[0] === domain[1]) {
        const position = align === "start" ? range[0] : align === "end" ? range[1] : (range[0] + range[1]) / 2
        return { type, domain, range, place: () => position }
    }
    const scale = (type === "log" ? scaleLog() : scaleLinear()).domain(domain).range(range)
    return { type, domain, range, place: (v: number) => scale(v) }
}

// ---------------------------------------------------------------------------
// Band positions for categorical rows/columns
// ---------------------------------------------------------------------------

export interface Band {
    start: number
    center: number
    width: number
}

/** Equal-width slots across a range; bands occupy innerRatio of each slot. */
export function bandPositions(count: number, range: [number, number], innerRatio = 0.7): Band[] {
    if (count <= 0) return []
    const span = range[1] - range[0]
    const slot = span / count
    const width = Math.abs(slot) * innerRatio
    const bands: Band[] = []
    for (let i = 0; i < count; i++) {
        const center = range[0] + (i + 0.5) * slot
        bands.push({ start: center - width / 2, center, width })
    }
    return bands
}
