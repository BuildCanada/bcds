/**
 * Axis tick generation and axis scene nodes (spec 03 §3).
 *
 * Tick generation is ported from owid-grapher axis/Axis.ts:
 * - linear: d3 ticks with nice-domain extension (scales.ts niceLinearDomain),
 *   value-0 ticks marked solid;
 * - log: the priority-1/2/3 heuristic over d3 log ticks, converting
 *   "in-between" values to unlabelled faint gridlines (log-paper look) or
 *   dropping low priorities when the axis would be overwhelmed;
 * - collision filtering: tick labels are measured and overlapping labels are
 *   hidden by priority (labels thin, never rotate);
 * - first/last labels are clip-protected by re-anchoring at the range edges.
 */

import { scaleLog } from "d3-scale"

import type { Rect, SceneNode } from "../scene/nodes.ts"
import type { FontSpec, TextMeasurer, TextMetrics } from "../text/measurer.ts"
import type { Theme } from "../theme/types.ts"
import { formatTime } from "../format/timeLabels.ts"
import { formatValue, type FormatMeta } from "../format/number.ts"
import type { AxisConfig, Diagnostic, Locale, ScaleType, TimeGrain, TimeOrdinal } from "../types.ts"
import {
    computeValueDomain,
    createValueScale,
    niceLinearDomain,
    targetTickCount,
    type MarkType,
    type ValueScale,
} from "./scales.ts"

export const TICK_PADDING = 8
export const PLOT_TOP_PAD = 6

export interface Tickmark {
    value: number
    priority: number
    gridLineOnly?: boolean
    faint?: boolean
    solid?: boolean
}

// ---------------------------------------------------------------------------
// Tick generation
// ---------------------------------------------------------------------------

export function linearTicks(domain: [number, number], targetCount: number): { domain: [number, number]; ticks: Tickmark[] } {
    const { domain: nice, ticks } = niceLinearDomain(domain[0], domain[1], targetCount)
    return {
        domain: nice,
        ticks: ticks.map((value) => ({ value, priority: 2, ...(value === 0 ? { solid: true } : {}) })),
    }
}

export function logTicks(domain: [number, number], targetCount: number): Tickmark[] {
    const maxLabelledTicks = Math.round(targetCount * 1.25)
    const maxTicks = Math.round(targetCount * 3)
    if (domain[0] === domain[1]) return [{ value: domain[0], priority: 1 }]

    const scale = scaleLog().domain(domain).range([0, 1])
    const candidates = scale.ticks(maxLabelledTicks)
    let ticks: Tickmark[] = candidates.map((value) => {
        if (Math.fround(Math.log10(value)) % 1 === 0) return { value, priority: 1 }
        if (Math.fround(Math.log10(value * 2)) % 1 === 0) return { value, priority: 2 }
        if (Math.fround(Math.log10(value / 2)) % 1 === 0) return { value, priority: 2 }
        return { value, priority: 3 }
    })

    if (ticks.length > maxLabelledTicks) {
        if (ticks.length <= maxTicks) {
            const labelled = ticks.filter((t) => t.priority < 3)
            if (labelled.length >= 2) {
                ticks = ticks.map((t) => (t.priority === 3 ? { ...t, faint: true, gridLineOnly: true } : t))
            }
        } else {
            for (let priority = 3; priority > 1; priority--) {
                if (ticks.length > maxLabelledTicks) ticks = ticks.filter((t) => t.priority < priority)
            }
        }
    }
    return ticks
}

// ---------------------------------------------------------------------------
// Prepared value axis: domain + formatted/measured ticks
// ---------------------------------------------------------------------------

export interface PreparedTick extends Tickmark {
    label: string
    metrics: TextMetrics
}

export interface ValueAxisSpec {
    domain: [number, number]
    ticks: PreparedTick[]
    maxLabelWidth: number
    /** Pixel height consumed by one row of tick labels. */
    labelHeight: number
    excludedCount: number
    diagnostics: Diagnostic[]
}

export interface PrepareValueAxisInput {
    values: readonly number[]
    markType: MarkType
    scaleType: ScaleType
    config?: AxisConfig
    /** Estimated pixel length of the axis (drives the target tick count). */
    pixelLength: number
    font: FontSpec
    meta: FormatMeta
    locale: Locale
    measurer: TextMeasurer
    showSign?: boolean
    /** Pin the domain max (relative stacked mode pins 100). */
    pinnedMax?: number
}

export function prepareValueAxis(input: PrepareValueAxisInput): ValueAxisSpec {
    const { values, markType, scaleType, config, pixelLength, font, meta, locale, measurer, showSign = false } = input
    const domainResult = computeValueDomain({ values, markType, scaleType, config })
    let domain: [number, number] = [domainResult.min, domainResult.max]
    if (input.pinnedMax !== undefined) domain = [Math.min(domain[0], 0), input.pinnedMax]

    const target = targetTickCount(pixelLength, font.sizePx)
    let ticks: Tickmark[]
    if (scaleType === "log") {
        if (domain[0] <= 0) domain = [Math.max(domain[0], 1e-9), Math.max(domain[1], 1)]
        ticks = logTicks(domain, target)
    } else {
        const result = linearTicks(domain, target)
        domain = result.domain
        ticks = result.ticks
    }

    const prepared: PreparedTick[] = ticks.map((tick) => {
        const label = tick.gridLineOnly ? "" : formatValue(tick.value, meta, { locale, verbosity: "tick", showSign })
        return { ...tick, label, metrics: measurer.measure(label, font) }
    })

    return {
        domain,
        ticks: prepared,
        maxLabelWidth: Math.max(0, ...prepared.filter((t) => !t.gridLineOnly).map((t) => t.metrics.width)),
        labelHeight: font.sizePx * 1.2,
        excludedCount: domainResult.excludedCount,
        diagnostics: domainResult.diagnostics,
    }
}

// ---------------------------------------------------------------------------
// Node builders
// ---------------------------------------------------------------------------

interface AxisNodeStyleArgs {
    theme: Theme
    font: FontSpec
    hideGridlines?: boolean
    hideTickLabels?: boolean
}

function gridStrokeFor(theme: Theme, tick: Tickmark): { stroke: string; opacity: number } {
    if (tick.solid) return { stroke: theme.chrome.axisLine, opacity: 1 }
    if (tick.faint) return { stroke: theme.chrome.gridline, opacity: 0.45 }
    return { stroke: theme.chrome.gridline, opacity: 1 }
}

function yGridStyle(theme: Theme, tick: Tickmark) {
    const { stroke, opacity } = gridStrokeFor(theme, tick)
    return {
        stroke,
        strokeWidth: 1,
        opacity,
        ...(tick.solid === true ? {} : { dash: [4, 4] }),
    }
}

function xGridStyle(theme: Theme, tick: Tickmark) {
    const { stroke, opacity } = gridStrokeFor(theme, tick)
    return {
        stroke,
        strokeWidth: 1,
        opacity,
        ...(tick.solid === true ? {} : { dash: [4, 4] }),
    }
}

/**
 * Left value axis: horizontal gridlines across the plot, right-anchored tick
 * labels in the margin. Labels are clamped so the topmost never clips above
 * `clampTop`.
 */
export function verticalValueAxisNodes(
    spec: ValueAxisSpec,
    scale: ValueScale,
    plotArea: Rect,
    clampTop: number,
    style: AxisNodeStyleArgs,
): SceneNode[] {
    const nodes: SceneNode[] = []
    const { theme, font } = style
    for (const tick of spec.ticks) {
        const y = scale.place(tick.value)
        if (!Number.isFinite(y)) continue
        if (style.hideGridlines !== true || tick.solid === true) {
            nodes.push({
                key: `axis/y/grid/${tick.value}`,
                role: "grid",
                kind: "rule",
                from: { x: plotArea.x, y },
                to: { x: plotArea.x + plotArea.width, y },
                style: yGridStyle(theme, tick),
            })
        }
        if (tick.gridLineOnly === true || style.hideTickLabels === true || tick.label === "") continue
        const metrics = tick.metrics
        let baseline = y + (metrics.ascent - metrics.descent) / 2
        baseline = Math.max(baseline, clampTop + metrics.ascent)
        nodes.push({
            key: `axis/y/tick/${tick.value}`,
            role: "axis",
            kind: "text",
            position: { x: plotArea.x - TICK_PADDING, y: baseline },
            text: tick.label,
            font,
            anchor: "end",
            colour: theme.chrome.tickLabel,
            measured: metrics,
        })
    }
    return nodes
}

/**
 * Bottom value axis (horizontal-bar charts): vertical gridlines, centred tick
 * labels below the plot, end labels re-anchored to avoid clipping outside
 * `clampBounds`.
 */
export function horizontalValueAxisNodes(
    spec: ValueAxisSpec,
    scale: ValueScale,
    plotArea: Rect,
    clampBounds: Rect,
    style: AxisNodeStyleArgs,
): SceneNode[] {
    const nodes: SceneNode[] = []
    const { theme, font } = style
    const placements: { x: number; anchor: "start" | "middle" | "end"; tick: PreparedTick; hasGridline: boolean }[] = []

    for (const tick of spec.ticks) {
        const x = scale.place(tick.value)
        if (!Number.isFinite(x)) continue
        const hasGridline = style.hideGridlines !== true || tick.solid === true
        if (hasGridline) {
            nodes.push({
                key: `axis/x/grid/${tick.value}`,
                role: "grid",
                kind: "rule",
                from: { x, y: plotArea.y },
                to: { x, y: plotArea.y + plotArea.height },
                style: xGridStyle(theme, tick),
            })
        }
        if (tick.gridLineOnly === true || style.hideTickLabels === true || tick.label === "") continue
        let anchor: "start" | "middle" | "end" = "middle"
        let labelX = x
        const half = tick.metrics.width / 2
        if (x - half < clampBounds.x) {
            anchor = "start"
            labelX = Math.max(x - half, clampBounds.x)
        } else if (x + half > clampBounds.x + clampBounds.width) {
            anchor = "end"
            labelX = Math.min(x + half, clampBounds.x + clampBounds.width)
        }
        placements.push({ x: labelX, anchor, tick, hasGridline })
    }

    // Collision filter: hide overlapping labels (priority order, ties left-first).
    const visible = filterOverlappingX(placements.map((p) => ({ ...p, width: p.tick.metrics.width, priority: p.tick.priority })))
    const ascent = visible.length > 0 ? visible[0].tick.metrics.ascent : 0
    const baseline = plotArea.y + plotArea.height + PLOT_TOP_PAD + ascent
    for (const p of visible) {
        if (!p.hasGridline) {
            nodes.push({
                key: `axis/x/tick-mark/${p.tick.value}`,
                role: "axis",
                kind: "rule",
                from: { x: p.x, y: plotArea.y + plotArea.height },
                to: { x: p.x, y: baseline - p.tick.metrics.ascent - 2 },
                style: { stroke: theme.chrome.axisLine, strokeWidth: 1 },
            })
        }
        nodes.push({
            key: `axis/x/tick/${p.tick.value}`,
            role: "axis",
            kind: "text",
            position: { x: p.x, y: baseline },
            text: p.tick.label,
            font,
            anchor: p.anchor,
            colour: theme.chrome.tickLabel,
            measured: p.tick.metrics,
        })
    }
    return nodes
}

interface XPlacement {
    x: number
    width: number
    anchor: "start" | "middle" | "end"
    priority: number
}

function extentOf(p: XPlacement): [number, number] {
    if (p.anchor === "start") return [p.x, p.x + p.width]
    if (p.anchor === "end") return [p.x - p.width, p.x]
    return [p.x - p.width / 2, p.x + p.width / 2]
}

/** Hide overlapping horizontal labels by priority, with 3px breathing room. */
function filterOverlappingX<T extends XPlacement>(placements: T[]): T[] {
    const byPriority = [...placements].sort((a, b) => a.priority - b.priority || extentOf(a)[0] - extentOf(b)[0])
    const kept: T[] = []
    for (const candidate of byPriority) {
        const [left, right] = extentOf(candidate)
        const collides = kept.some((other) => {
            const [oLeft, oRight] = extentOf(other)
            return left - 3 < oRight && right + 3 > oLeft
        })
        if (!collides) kept.push(candidate)
    }
    return kept.sort((a, b) => extentOf(a)[0] - extentOf(b)[0])
}

// ---------------------------------------------------------------------------
// Time axis (spec 03 §3): ticks on natural boundaries, thinned not rotated
// ---------------------------------------------------------------------------

export interface TimeAxisInput {
    times: readonly TimeOrdinal[]
    place: (time: TimeOrdinal) => number
    plotArea: Rect
    clampBounds: Rect
    grain: TimeGrain
    locale: Locale
    theme: Theme
    measurer: TextMeasurer
    font: FontSpec
}

/** Bottom time axis labels. No vertical gridlines (spec 03 §3). */
export function timeAxisNodes(input: TimeAxisInput): SceneNode[] {
    const { times, place, plotArea, clampBounds, grain, locale, theme, measurer, font } = input
    if (times.length === 0) return []

    const labels = times.map((time) => {
        const text = formatTime(time, grain, locale)
        return { time, text, metrics: measurer.measure(text, font) }
    })

    // Thinning: keep first and last (clip-protected), thin the middle so the
    // widest label plus breathing room fits between picks.
    const maxWidth = Math.max(...labels.map((l) => l.metrics.width))
    const capacity = Math.max(2, Math.floor(plotArea.width / (maxWidth + 16)))
    const step = Math.max(1, Math.ceil(times.length / capacity))
    const pickedIndices: number[] = []
    for (let i = 0; i < times.length; i += step) pickedIndices.push(i)
    const lastIndex = times.length - 1
    if (pickedIndices[pickedIndices.length - 1] !== lastIndex) {
        if (lastIndex - pickedIndices[pickedIndices.length - 1] < step / 2 && pickedIndices.length > 1) {
            pickedIndices[pickedIndices.length - 1] = lastIndex
        } else {
            pickedIndices.push(lastIndex)
        }
    }

    const placements: (XPlacement & { label: (typeof labels)[number] })[] = pickedIndices.map((index, order) => {
        const label = labels[index]
        const x = place(label.time)
        const half = label.metrics.width / 2
        let anchor: "start" | "middle" | "end" = "middle"
        let labelX = x
        if (x - half < clampBounds.x) {
            anchor = "start"
            labelX = Math.max(x - half, clampBounds.x)
        } else if (x + half > clampBounds.x + clampBounds.width) {
            anchor = "end"
            labelX = Math.min(x + half, clampBounds.x + clampBounds.width)
        }
        // First/last get top priority so middle labels thin out first.
        const priority = order === 0 || index === lastIndex ? 1 : 2
        return { x: labelX, width: label.metrics.width, anchor, priority, label }
    })

    const visible = filterOverlappingX(placements)
    const ascent = visible.length > 0 ? visible[0].label.metrics.ascent : 0
    const baseline = plotArea.y + plotArea.height + PLOT_TOP_PAD + ascent
    return visible.flatMap((p) => [
        {
            key: `axis/x/tick-mark/${p.label.time}`,
            role: "axis" as const,
            kind: "rule" as const,
            from: { x: p.x, y: plotArea.y + plotArea.height },
            to: { x: p.x, y: baseline - p.label.metrics.ascent - 2 },
            style: { stroke: theme.chrome.axisLine, strokeWidth: 1 },
        },
        {
            key: `axis/x/tick/${p.label.time}`,
            role: "axis" as const,
            kind: "text" as const,
            position: { x: p.x, y: baseline },
            text: p.label.text,
            font,
            anchor: p.anchor,
            colour: theme.chrome.tickLabel,
            measured: p.label.metrics,
        },
    ])
}

// ---------------------------------------------------------------------------
// Composite: vertical value axis + plot area solver
// ---------------------------------------------------------------------------

export interface VerticalAxesInput {
    area: Rect
    values: readonly number[]
    markType: MarkType
    scaleType: ScaleType
    config?: AxisConfig
    meta: FormatMeta
    locale: Locale
    theme: Theme
    measurer: TextMeasurer
    font: FontSpec
    /** Width reserved at the right edge (series end labels). */
    rightReserve: number
    showSign?: boolean
    pinnedMax?: number
}

export interface VerticalAxesResult {
    plotArea: Rect
    yScale: ValueScale
    spec: ValueAxisSpec
    nodes: SceneNode[]
    /** Height of the bottom strip reserved for the time axis labels. */
    xAxisHeight: number
    diagnostics: Diagnostic[]
}

/**
 * Solve the y-axis ↔ plot-area dependency for charts with a left value axis
 * and a bottom time axis: ticks are generated once from a provisional pixel
 * length, the axis margin is sized from those measured labels, and the same
 * ticks are then placed with the final scale (deterministic single pass).
 */
export function layoutVerticalAxes(input: VerticalAxesInput): VerticalAxesResult {
    const { area, font, theme } = input
    const sample = input.measurer.measure("0", font)
    const xAxisHeight = sample.ascent + sample.descent + PLOT_TOP_PAD + 2
    const provisionalLength = Math.max(10, area.height - xAxisHeight - PLOT_TOP_PAD)

    const spec = prepareValueAxis({
        values: input.values,
        markType: input.markType,
        scaleType: input.scaleType,
        config: input.config,
        pixelLength: provisionalLength,
        font,
        meta: input.meta,
        locale: input.locale,
        measurer: input.measurer,
        showSign: input.showSign,
        pinnedMax: input.pinnedMax,
    })

    const hideTickLabels = input.config?.hideTickLabels === true
    const yAxisWidth = hideTickLabels ? 0 : spec.maxLabelWidth + TICK_PADDING
    const plotArea: Rect = {
        x: area.x + yAxisWidth,
        y: area.y + PLOT_TOP_PAD,
        width: Math.max(10, area.width - yAxisWidth - input.rightReserve),
        height: Math.max(10, area.height - PLOT_TOP_PAD - xAxisHeight),
    }

    const yScale = createValueScale(input.scaleType, spec.domain, [plotArea.y + plotArea.height, plotArea.y])
    const nodes = verticalValueAxisNodes(spec, yScale, plotArea, Math.max(0, area.y - PLOT_TOP_PAD), {
        theme,
        font,
        hideGridlines: input.config?.hideGridlines,
        hideTickLabels,
    })

    return { plotArea, yScale, spec, nodes, xAxisHeight, diagnostics: spec.diagnostics }
}
