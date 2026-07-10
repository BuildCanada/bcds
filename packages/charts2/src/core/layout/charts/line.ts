/**
 * Line chart layout (spec 11).
 *
 * - Gap-broken polylines: a line node's segments array encodes data gaps
 *   (no implicit interpolation).
 * - Projection runs render dashed/lighter, sharing the transition point with
 *   the solid run (transition marked with a point).
 * - Markers appear when sparse and always for isolated/single points.
 * - Series labels at line ends, decluttered; legend fallback when they
 *   cannot fit or when hideSeriesLabels is set.
 * - Hover: one target per time with a multi-series tooltip sorted by value
 *   descending, plus a vertical time guide.
 */

import { formatTime } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, SeriesPoint, TooltipRow, Vec2 } from "../../scene/nodes.ts"
import { truncateWithEllipsis } from "../../text/truncate.ts"
import type { TimeOrdinal } from "../../types.ts"
import { layoutVerticalAxes, timeAxisNodes } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { declutterLabels, type LabelCandidate } from "../declutter.ts"
import { createValueScale } from "../scales.ts"
import { buildSeriesModels, toRelativeLineSeries } from "../series.ts"
import { comparisonLineNodes } from "./comparisonLines.ts"
import {
    buildFooters,
    centeredBaseline,
    collectFooterFlags,
    emptyLayer,
    legendItemsFor,
    metricSubtitle,
    missingRow,
    noteFooterFlags,
    noticeFor,
    pointByTime,
    seriesLabelFont,
    textNode,
    tickFont,
    tooltipValueText,
    metaFor,
    RELATIVE_META,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

const LABEL_GAP = 4
const MARKER_SPACING_THRESHOLD = 30

interface Run {
    projected: boolean
    points: SeriesPoint[]
}

/** Split a series into gap-free runs, then by the projected flag (the
 * transition point is shared between the solid and projected run). */
function buildRuns(series: SeriesModel, times: readonly TimeOrdinal[], logScale: boolean): Run[] {
    const byTime = pointByTime(series)
    const gapRuns: SeriesPoint[][] = []
    let current: SeriesPoint[] = []
    for (const time of times) {
        const point = byTime.get(time)
        if (point !== undefined && (!logScale || point.value > 0)) {
            current.push(point)
        } else if (current.length > 0) {
            gapRuns.push(current)
            current = []
        }
    }
    if (current.length > 0) gapRuns.push(current)

    const runs: Run[] = []
    for (const run of gapRuns) {
        let cur: Run = { projected: run[0].projected === true, points: [run[0]] }
        for (let i = 1; i < run.length; i++) {
            const projected = run[i].projected === true
            if (projected === cur.projected) {
                cur.points.push(run[i])
            } else {
                runs.push(cur)
                cur = { projected, points: [run[i - 1], run[i]] }
            }
        }
        runs.push(cur)
    }
    return runs
}

export function layoutLineChart(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale
    const relative = ctx.stackMode === "relative"

    const builtResult = buildSeriesModels(ctx, "line")
    const diagnostics = [...builtResult.diagnostics]
    let series = builtResult.series
    if (relative) {
        const transformed = toRelativeLineSeries(series)
        series = transformed.series
        diagnostics.push(...transformed.diagnostics)
    }
    series = series.filter((s) => s.points.length > 0)
    if (series.length === 0 || ctx.times.length === 0) return emptyLayer(area, diagnostics)

    const logScale = ctx.scaleType === "log" && !relative

    // --- Right margin for end-of-line labels --------------------------------
    const labelFont = seriesLabelFont(scale)
    const showLabels = !ctx.definition.hideSeriesLabels && !opts.legendReserved
    const labelMaxWidth = Math.max(30, area.width * 0.25)
    let rightReserve = 0
    const labelTexts = new Map<string, string>()
    if (showLabels) {
        for (const s of series) {
            const text = truncateWithEllipsis(s.label, labelFont, labelMaxWidth, measurer)
            labelTexts.set(s.key, text)
            rightReserve = Math.max(rightReserve, measurer.measure(text, labelFont).width)
        }
        rightReserve += LABEL_GAP + 4
    }

    // --- Axes ----------------------------------------------------------------
    const slug = ctx.definition.y[0]
    const values = series.flatMap((s) => s.points.map((p) => p.value))
    const axes = layoutVerticalAxes({
        area,
        values,
        markType: "line",
        scaleType: logScale ? "log" : "linear",
        config: ctx.definition.yAxis,
        meta: relative ? RELATIVE_META : metaFor(ctx, slug),
        locale,
        theme,
        measurer,
        font: tickFont(scale),
        rightReserve,
        showSign: relative,
    })
    diagnostics.push(...axes.diagnostics)
    const { plotArea, yScale } = axes

    const window = ctx.window ?? { start: ctx.times[0], end: ctx.times[ctx.times.length - 1] }
    const xScale = createValueScale("linear", [window.start, window.end], [plotArea.x, plotArea.x + plotArea.width])

    const nodes: SceneNode[] = [...axes.nodes]
    nodes.push(
        ...timeAxisNodes({
            times: ctx.times,
            place: (t) => xScale.place(t),
            plotArea,
            clampBounds: area,
            grain,
            locale,
            theme,
            measurer,
            font: tickFont(scale),
        }),
    )

    // --- Marks ----------------------------------------------------------------
    const singleSeries = series.length === 1
    const strokeWidth = singleSeries ? 2.5 : 2
    const spacing = plotArea.width / Math.max(1, ctx.times.length - 1)
    const sparse = spacing > MARKER_SPACING_THRESHOLD

    for (const s of series) {
        const runs = buildRuns(s, ctx.times, logScale)
        const toVec = (p: SeriesPoint): Vec2 => ({ x: xScale.place(p.time ?? window.start), y: yScale.place(p.value) })

        const solidSegments = runs.filter((r) => !r.projected && r.points.length > 1).map((r) => r.points.map(toVec))
        const projectedSegments = runs.filter((r) => r.projected && r.points.length > 1).map((r) => r.points.map(toVec))

        if (solidSegments.length > 0) {
            nodes.push({
                key: `series/${s.key}/line`,
                seriesKey: s.key,
                role: "mark",
                kind: "line",
                segments: solidSegments,
                style: { stroke: s.colour, strokeWidth, lineCap: "round" },
            })
        }
        if (projectedSegments.length > 0) {
            nodes.push({
                key: `series/${s.key}/line/projected`,
                seriesKey: s.key,
                role: "mark",
                kind: "line",
                segments: projectedSegments,
                style: { stroke: s.colour, strokeWidth: Math.max(1, strokeWidth - 0.75), dash: [5, 3], opacity: 0.9, lineCap: "round" },
            })
            // Mark the projection transition point.
            for (let i = 1; i < runs.length; i++) {
                if (runs[i].projected && !runs[i - 1].projected) {
                    const boundary = runs[i].points[0]
                    nodes.push({
                        key: `series/${s.key}/projection-start/${boundary.time}`,
                        seriesKey: s.key,
                        role: "mark",
                        kind: "point",
                        center: toVec(boundary),
                        radius: strokeWidth + 0.5,
                        style: { fill: s.colour },
                    })
                }
            }
        }

        // Markers: sparse charts, single-point series, and isolated run points.
        const drawable = runs.flatMap((r) => r.points)
        const showAll = sparse || drawable.length === 1
        for (const run of runs) {
            const isolated = run.points.length === 1
            if (!showAll && !isolated) continue
            for (const point of run.points) {
                nodes.push({
                    key: `series/${s.key}/marker/${point.time}`,
                    seriesKey: s.key,
                    role: "mark",
                    kind: "point",
                    center: toVec(point),
                    radius: singleSeries ? 3.5 : 2.5,
                    style: { fill: s.colour },
                })
            }
        }
    }

    // --- End-of-line labels ----------------------------------------------------
    // Each end label is also a series hover/focus hit target (spec 07 §3):
    // pointing at a line's right-side label emphasizes it and dims the rest.
    const subtitle = builtResult.strategy === "entity" ? metricSubtitle(ctx, slug) : undefined
    const labelTargets: HitTarget[] = []
    let needsLegendFallback = false
    if (showLabels) {
        const candidates: LabelCandidate[] = []
        for (const s of series) {
            const drawable = s.points.filter((p) => !logScale || p.value > 0)
            if (drawable.length === 0) continue
            const last = drawable[drawable.length - 1]
            const text = labelTexts.get(s.key) ?? s.label
            const metrics = measurer.measure(text, labelFont)
            candidates.push({
                seriesKey: s.key,
                text,
                targetY: yScale.place(last.value),
                priority: last.value,
                width: metrics.width,
                height: metrics.ascent + metrics.descent,
            })
        }
        const { placed, dropped } = declutterLabels(candidates, plotArea.y, plotArea.y + plotArea.height)
        for (const label of placed) {
            const metrics = measurer.measure(label.text, labelFont)
            const s = series.find((entry) => entry.key === label.seriesKey)
            const colour = s?.colour ?? theme.chrome.tickLabel
            const labelX = plotArea.x + plotArea.width + LABEL_GAP
            nodes.push(
                textNode({
                    key: `label/${label.seriesKey}`,
                    role: "label",
                    text: label.text,
                    font: labelFont,
                    anchor: "start",
                    x: labelX,
                    baselineY: label.y + metrics.ascent,
                    colour,
                    measurer,
                    seriesKey: label.seriesKey,
                }),
            )
            if (s !== undefined) {
                const drawable = s.points.filter((p) => !logScale || p.value > 0)
                const last = drawable[drawable.length - 1]
                if (last !== undefined) {
                    labelTargets.push({
                        kind: "series",
                        seriesKey: s.key,
                        shape: {
                            x: labelX,
                            y: label.y,
                            width: metrics.width,
                            height: metrics.ascent + metrics.descent,
                        },
                        tooltip: {
                            title: s.label,
                            ...(subtitle !== undefined ? { subtitle } : {}),
                            rows: [
                                {
                                    seriesKey: s.key,
                                    label: s.label,
                                    swatch: s.colour,
                                    valueText: tooltipValueText(ctx, s.column ?? slug, last.value, relative),
                                    emphasized: true,
                                },
                            ],
                            footers: [],
                        },
                    })
                }
            }
        }
        if (dropped.length > 0) needsLegendFallback = true
    } else if (ctx.definition.hideSeriesLabels && !opts.legendReserved) {
        needsLegendFallback = true
    }

    // --- Comparison (reference) lines ------------------------------------------
    if (ctx.definition.comparisonLines !== undefined && ctx.definition.comparisonLines.length > 0) {
        nodes.push(
            ...comparisonLineNodes({
                lines: ctx.definition.comparisonLines,
                plotArea,
                yScale,
                xScale,
                theme,
                measurer,
                fontScale: scale,
            }),
        )
    }

    // --- Hover -------------------------------------------------------------------
    const targets: HitTarget[] = []
    for (const time of ctx.times) {
        const flags = collectFooterFlags()
        const present: { row: TooltipRow; value: number }[] = []
        const missing: TooltipRow[] = []
        for (const s of series) {
            const point = pointByTime(s).get(time)
            if (point === undefined || (logScale && point.value <= 0)) {
                missing.push(missingRow(s.key, s.label, s.colour, locale))
                continue
            }
            noteFooterFlags(flags, point, time)
            present.push({
                value: point.value,
                row: {
                    seriesKey: s.key,
                    label: s.label,
                    swatch: s.colour,
                    valueText: relative
                        ? tooltipValueText(ctx, s.column ?? slug, point.value, true)
                        : tooltipValueText(ctx, s.column ?? slug, point.value, false),
                    emphasized: false,
                    ...(noticeFor(point, time) !== undefined ? { notice: noticeFor(point, time) } : {}),
                },
            })
        }
        present.sort((a, b) => b.value - a.value)
        targets.push({
            kind: "time",
            time,
            x: xScale.place(time),
            tooltip: {
                title: formatTime(time, grain, locale),
                ...(subtitle !== undefined ? { subtitle } : {}),
                rows: [...present.map((p) => p.row), ...missing],
                footers: buildFooters(flags, grain, locale),
            },
        })
    }

    // Series (label) targets after the time strips; SceneSVG renders series
    // shapes over the time strips, and they sit in the right-reserve margin.
    targets.push(...labelTargets)

    return {
        plotArea,
        nodes,
        series,
        hover: { targets, timeGuide: { y0: plotArea.y, y1: plotArea.y + plotArea.height } },
        legendItems: legendItemsFor(series),
        greyedLegendKeys: [],
        needsLegendFallback,
        empty: false,
        valueDomain: axes.spec.domain,
        diagnostics,
    }
}
