/**
 * Slope chart layout (spec 12).
 *
 * Compares each series' change between exactly two times (the window's two
 * handles). Follows the OWID slope layout: the value axis is hidden (no
 * gutter, no gridlines); two full-height column lines frame the start/end
 * positions with the year labels below them; each series is a straight line
 * from its start to end value with a dot at each endpoint, drawn on a
 * background-coloured halo so crossing slopes stay separable. Endpoint labels
 * show the value on the left and the series name (+ value) on the right, in
 * wide outer margins, collision-resolved by a greedy vertical spread. The
 * slope area is sized tall-and-narrow by aspect ratio rather than filling the
 * width. Only series present at BOTH endpoints render; incomplete series raise
 * a warning. A dashed zero line is drawn when the value domain spans zero.
 */

import { formatTime, formatTimeRange } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, SeriesPoint, Vec2 } from "../../scene/nodes.ts"
import { truncateWithEllipsis } from "../../text/truncate.ts"
import type { AxisConfig } from "../../types.ts"
import { prepareValueAxis, PLOT_TOP_PAD } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { createValueScale } from "../scales.ts"
import { buildSeriesModels } from "../series.ts"
import {
    buildFooters,
    collectFooterFlags,
    emptyLayer,
    labelValueText,
    legendItemsFor,
    metaFor,
    noteFooterFlags,
    noticeFor,
    pointByTime,
    seriesLabelFont,
    textNode,
    tickFont,
    tooltipValueText,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

const LABEL_GAP = 4
const LABEL_MIN_GAP = 2
/** Trend arrows for the tooltip range (OWID calculateTrendDirection). */
const TREND_ARROW = { up: "↑", down: "↓", flat: "→" } as const
/** OWID frames the slopes tall-and-narrow: the column span is capped to this
 *  fraction of the plot height, then centred, so the years sit in wide margins. */
const IDEAL_ASPECT = 0.9
/** Below this width, skip aspect capping and use the full available span. */
const NARROW_WIDTH = 320
/** Gap below the plot reserved for the two column (year) labels. */
const TIME_LABEL_PAD = 8

interface SlopeRow {
    series: SeriesModel
    startPoint: SeriesPoint
    endPoint: SeriesPoint
    slug: string
    startValue: number
    endValue: number
    leftText: string
    rightText: string
}

/**
 * Greedy vertical spread: place non-overlapping label boxes as close to their
 * target tops as possible, pushing later boxes down, then shift the whole set
 * up if it overruns the bottom. Ordering is preserved (each label stays
 * adjacent to its line). Returns tops aligned to the input order.
 */
function spreadTops(targetTops: readonly number[], heights: readonly number[], bottom: number): number[] {
    const n = targetTops.length
    const order = [...Array(n).keys()].sort((a, b) => targetTops[a] - targetTops[b])
    const tops = new Array<number>(n)
    let cursor = Number.NEGATIVE_INFINITY
    for (const idx of order) {
        const y = Math.max(targetTops[idx], cursor)
        tops[idx] = y
        cursor = y + heights[idx] + LABEL_MIN_GAP
    }
    const lastBottom = cursor - LABEL_MIN_GAP
    if (lastBottom > bottom) {
        const shift = lastBottom - bottom
        for (let i = 0; i < n; i++) tops[i] -= shift
    }
    return tops
}

export function layoutSlope(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale

    const builtResult = buildSeriesModels(ctx, "slope")
    const diagnostics = [...builtResult.diagnostics]

    if (ctx.window === null) return emptyLayer(area, diagnostics)
    const startTime = ctx.window.start
    const endTime = ctx.window.end
    const slug = ctx.definition.y[0]

    // --- Endpoint filtering: keep only series with values at BOTH ends -------
    const labelFont = seriesLabelFont(scale)
    const maxNameWidth = Math.max(30, area.width * 0.25)
    const rows: SlopeRow[] = []
    for (const series of builtResult.series) {
        const byTime = pointByTime(series)
        const startPoint = byTime.get(startTime)
        const endPoint = byTime.get(endTime)
        if (startPoint === undefined || endPoint === undefined) {
            diagnostics.push({
                severity: "warning",
                code: "slope-incomplete-endpoints",
                message: `Series "${series.label}" is missing a value at one of the endpoints and is not shown`,
                context: { series: series.key },
            })
            continue
        }
        const slugR = series.column ?? slug
        const startValueText = labelValueText(ctx, slugR, startPoint.value, false)
        const endValueText = labelValueText(ctx, slugR, endPoint.value, false)
        const name = truncateWithEllipsis(series.label, labelFont, maxNameWidth, measurer)
        rows.push({
            series,
            startPoint,
            endPoint,
            slug: slugR,
            startValue: startPoint.value,
            endValue: endPoint.value,
            // OWID convention: value only on the left, series name (+ value) on
            // the right where the series is identified.
            leftText: startValueText,
            rightText: `${name} ${endValueText}`,
        })
    }

    if (rows.length < 1) return emptyLayer(area, diagnostics)

    if (ctx.definition.trendColouring === true) {
        // The theme exposes no semantic direction colours (positive/negative);
        // fall back to each series' identity colour and record the gap.
        diagnostics.push({
            severity: "warning",
            code: "slope-trend-colouring-unavailable",
            message: "trendColouring requested but the theme provides no semantic direction colours; using series colours",
        })
    }

    const logScale = ctx.scaleType === "log"

    // --- Vertical framing: PLOT_TOP_PAD for dots that overflow the top, and a
    //     bottom strip for the two column (year) labels (OWID puts years below).
    const timeFont = tickFont(scale)
    const startTimeText = formatTime(startTime, grain, locale)
    const endTimeText = formatTime(endTime, grain, locale)
    const timeMetrics = measurer.measure(startTimeText, timeFont)
    const bottomStrip = timeMetrics.ascent + timeMetrics.descent + TIME_LABEL_PAD
    const plotTop = area.y + PLOT_TOP_PAD
    const plotHeight = Math.max(10, area.height - PLOT_TOP_PAD - bottomStrip)

    // --- Shared value axis over all endpoint values --------------------------
    const axisFont = tickFont(scale)
    // Release the forced-zero baseline (slope uses the data extent); a manual
    // yAxis.min still wins.
    const axisConfig: AxisConfig = { ...ctx.definition.yAxis, min: ctx.definition.yAxis?.min ?? "auto" }
    const spec = prepareValueAxis({
        values: rows.flatMap((r) => [r.startValue, r.endValue]),
        markType: "line",
        scaleType: logScale ? "log" : "linear",
        config: axisConfig,
        pixelLength: plotHeight,
        font: axisFont,
        meta: metaFor(ctx, slug),
        locale,
        measurer,
    })
    diagnostics.push(...spec.diagnostics)

    // OWID hides the value axis: no gutter, no horizontal gridlines. The plot
    // spans the full width and the endpoint value labels stand in for ticks.
    const plotArea: Rect = { x: area.x, y: plotTop, width: area.width, height: plotHeight }
    const yScale = createValueScale(logScale ? "log" : "linear", spec.domain, [
        plotArea.y + plotArea.height,
        plotArea.y,
    ])
    const plotBottom = plotArea.y + plotArea.height

    // --- Horizontal reserve for the endpoint labels --------------------------
    const dotRadius = rows.length === 1 ? 4 : 3.5
    const rawLeft = Math.max(0, ...rows.map((r) => measurer.measure(r.leftText, labelFont).width))
    const rawRight = Math.max(0, ...rows.map((r) => measurer.measure(r.rightText, labelFont).width))
    const leftReserve = Math.min(rawLeft + LABEL_GAP + dotRadius, plotArea.width * 0.3)
    const rightReserve = Math.min(rawRight + LABEL_GAP + dotRadius, plotArea.width * 0.3)
    const innerWidth = Math.max(10, plotArea.width - leftReserve - rightReserve)
    // Cap the column span to IDEAL_ASPECT × height and centre it, so the slopes
    // stay tall and narrow with the years/labels framed in wide outer margins.
    const span = plotArea.width < NARROW_WIDTH ? innerWidth : Math.min(innerWidth, IDEAL_ASPECT * plotHeight)
    const leftX = plotArea.x + leftReserve + (innerWidth - span) / 2
    const rightX = leftX + span

    // --- Column lines: a full-height vertical frames each column --------------
    const nodes: SceneNode[] = []
    for (const [side, x] of [["start", leftX] as const, ["end", rightX] as const]) {
        nodes.push({
            key: `slope/column/${side}`,
            role: "axis",
            kind: "rule",
            from: { x, y: plotArea.y },
            to: { x, y: plotBottom },
            style: { stroke: theme.chrome.axisLine, strokeWidth: 1, opacity: 1 },
        })
    }

    // Zero line (dashed, light) when the domain spans zero (spec 12).
    if (spec.domain[0] < 0 && spec.domain[1] > 0) {
        const zeroY = yScale.place(0)
        nodes.push({
            key: "slope/zero-line",
            role: "grid",
            kind: "rule",
            from: { x: leftX, y: zeroY },
            to: { x: rightX, y: zeroY },
            style: { stroke: theme.chrome.axisLine, strokeWidth: 1, dash: [3, 2], opacity: 0.6 },
        })
    }

    // --- Column (year) labels below the plot ---------------------------------
    const timeBaseline = plotBottom + TIME_LABEL_PAD + timeMetrics.ascent
    nodes.push(
        textNode({
            key: "annotation/time/start",
            role: "annotation",
            text: startTimeText,
            font: timeFont,
            anchor: "middle",
            x: leftX,
            baselineY: timeBaseline,
            colour: theme.chrome.tickLabel,
            measurer,
        }),
        textNode({
            key: "annotation/time/end",
            role: "annotation",
            text: endTimeText,
            font: timeFont,
            anchor: "middle",
            x: rightX,
            baselineY: timeBaseline,
            colour: theme.chrome.tickLabel,
            measurer,
        }),
    )

    // --- Slopes + endpoint dots, each on a background-coloured halo ------------
    // Interleaved in series order: a later slope's halo masks earlier slopes at
    // crossings, keeping them visually separable (OWID's foreground outline).
    const strokeWidth = rows.length === 1 ? 2 : 1.5
    const haloWidth = strokeWidth + 2
    const halo = theme.chrome.background
    for (const row of rows) {
        const left: Vec2 = { x: leftX, y: yScale.place(row.startValue) }
        const right: Vec2 = { x: rightX, y: yScale.place(row.endValue) }
        nodes.push(
            {
                key: `series/${row.series.key}/slope-halo`,
                seriesKey: row.series.key,
                role: "mark",
                kind: "line",
                segments: [[left, right]],
                style: { stroke: halo, strokeWidth: haloWidth, lineCap: "round" },
            },
            {
                key: `point/${row.series.key}/start-halo`,
                seriesKey: row.series.key,
                role: "mark",
                kind: "point",
                center: left,
                radius: dotRadius + 1,
                style: { fill: halo },
            },
            {
                key: `point/${row.series.key}/end-halo`,
                seriesKey: row.series.key,
                role: "mark",
                kind: "point",
                center: right,
                radius: dotRadius + 1,
                style: { fill: halo },
            },
            {
                key: `series/${row.series.key}/slope`,
                seriesKey: row.series.key,
                role: "mark",
                kind: "line",
                segments: [[left, right]],
                style: { stroke: row.series.colour, strokeWidth, lineCap: "round" },
            },
            {
                key: `point/${row.series.key}/start`,
                seriesKey: row.series.key,
                role: "mark",
                kind: "point",
                center: left,
                radius: dotRadius,
                style: { fill: row.series.colour },
            },
            {
                key: `point/${row.series.key}/end`,
                seriesKey: row.series.key,
                role: "mark",
                kind: "point",
                center: right,
                radius: dotRadius,
                style: { fill: row.series.colour },
            },
        )
    }

    // --- Endpoint labels, collision-resolved per side ------------------------
    const leftMetrics = rows.map((r) => measurer.measure(r.leftText, labelFont))
    const rightMetrics = rows.map((r) => measurer.measure(r.rightText, labelFont))
    const leftHeights = leftMetrics.map((m) => m.ascent + m.descent)
    const rightHeights = rightMetrics.map((m) => m.ascent + m.descent)
    const leftTargets = rows.map((r, i) => yScale.place(r.startValue) - leftHeights[i] / 2)
    const rightTargets = rows.map((r, i) => yScale.place(r.endValue) - rightHeights[i] / 2)
    const leftTops = spreadTops(leftTargets, leftHeights, plotBottom)
    const rightTops = spreadTops(rightTargets, rightHeights, plotBottom)

    rows.forEach((row, i) => {
        nodes.push(
            textNode({
                key: `label/${row.series.key}/start`,
                role: "label",
                text: row.leftText,
                font: labelFont,
                anchor: "end",
                x: leftX - LABEL_GAP - dotRadius,
                baselineY: leftTops[i] + leftMetrics[i].ascent,
                colour: row.series.colour,
                measurer,
                seriesKey: row.series.key,
            }),
            textNode({
                key: `label/${row.series.key}/end`,
                role: "label",
                text: row.rightText,
                font: labelFont,
                anchor: "start",
                x: rightX + LABEL_GAP + dotRadius,
                baselineY: rightTops[i] + rightMetrics[i].ascent,
                colour: row.series.colour,
                measurer,
                seriesKey: row.series.key,
            }),
        )
    })

    // --- Hover: OWID slope format — title = series, subtitle = the time range,
    //     a single "start → end" row with an up/down/flat trend arrow. ---------
    const metricLabel = builtResult.strategy === "entity" ? (ctx.columns[slug]?.name ?? "") : ""
    const timeRangeText = formatTimeRange(startTime, endTime, grain, locale)
    const targets: HitTarget[] = []
    const outSeries: SeriesModel[] = []
    for (const row of rows) {
        const yStart = yScale.place(row.startValue)
        const yEnd = yScale.place(row.endValue)
        const pad = dotRadius + 2
        const top = Math.min(yStart, yEnd) - pad
        const height = Math.abs(yEnd - yStart) + pad * 2

        const flags = collectFooterFlags()
        noteFooterFlags(flags, row.startPoint, startTime)
        noteFooterFlags(flags, row.endPoint, endTime)

        const trend = row.endValue > row.startValue ? "up" : row.endValue < row.startValue ? "down" : "flat"
        const startText = tooltipValueText(ctx, row.slug, row.startValue, false)
        const endText = tooltipValueText(ctx, row.slug, row.endValue, false)
        const rangeText = `${startText} ${TREND_ARROW[trend]} ${endText}`
        // The single row carries the stronger endpoint notice; footers detail it.
        const startNotice = noticeFor(row.startPoint, startTime)
        const endNotice = noticeFor(row.endPoint, endTime)
        const notice =
            startNotice === "projected" || endNotice === "projected" ? "projected" : (startNotice ?? endNotice)

        targets.push({
            kind: "series",
            seriesKey: row.series.key,
            shape: { x: leftX, y: top, width: Math.max(1, rightX - leftX), height: Math.max(8, height) },
            tooltip: {
                title: row.series.label,
                subtitle: timeRangeText,
                rows: [
                    {
                        seriesKey: row.series.key,
                        label: metricLabel,
                        swatch: row.series.colour,
                        valueText: rangeText,
                        emphasized: true,
                        ...(notice !== undefined ? { notice } : {}),
                    },
                ],
                footers: buildFooters(flags, grain, locale),
            },
        })

        outSeries.push({
            ...row.series,
            points: [
                { ...row.startPoint, time: startTime },
                { ...row.endPoint, time: endTime },
            ],
        })
    }

    return {
        plotArea,
        nodes,
        series: outSeries,
        hover: { targets },
        legendItems: legendItemsFor(outSeries),
        greyedLegendKeys: [],
        needsLegendFallback: false,
        empty: false,
        valueDomain: spec.domain,
        diagnostics,
    }
}
