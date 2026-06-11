/**
 * Stacked area chart layout (spec 14).
 *
 * - Negative values are a validation error: an error Diagnostic is emitted
 *   and nothing renders for that configuration (authors are directed to
 *   stacked bar or line).
 * - Interior gaps are linearly interpolated (flagged + tooltipped);
 *   leading/trailing missing times contribute nothing (the band starts at
 *   its first time, the stack below stays continuous).
 * - Series that are zero throughout the window are dropped from the stack
 *   but kept in the legend, greyed.
 * - Stack order is definition order, bottom-up; relative mode pins 0–100%.
 */

import { formatValue } from "../../format/number.ts"
import { formatTime } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, SeriesPoint, TooltipRow, Vec2 } from "../../scene/nodes.ts"
import { truncateWithEllipsis } from "../../text/truncate.ts"
import type { SeriesKey, TimeOrdinal } from "../../types.ts"
import { layoutVerticalAxes, timeAxisNodes } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { declutterLabels, type LabelCandidate } from "../declutter.ts"
import { createValueScale } from "../scales.ts"
import { buildSeriesModels, toShareOfTotalSeries } from "../series.ts"
import { stackSeries, withMissingValuesAsZeroes, type StackedSeries } from "../stacking.ts"
import {
    buildFooters,
    collectFooterFlags,
    emptyLayer,
    legendItemsFor,
    missingRow,
    noteFooterFlags,
    pointByTime,
    seriesLabelFont,
    strings,
    textNode,
    tickFont,
    tooltipValueText,
    metaFor,
    RELATIVE_META,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

const LABEL_GAP = 4
export const BAND_OPACITY = 0.75

/** Linearly interpolate interior gaps; leading/trailing gaps stay missing. */
function interpolateInteriorGaps(series: SeriesModel, times: readonly TimeOrdinal[]): SeriesModel {
    const byTime = pointByTime(series)
    const presentTimes = times.filter((t) => byTime.has(t))
    if (presentTimes.length < 2) return series
    const first = presentTimes[0]
    const last = presentTimes[presentTimes.length - 1]

    const points: SeriesPoint[] = []
    let prevIndex = -1
    for (let i = 0; i < times.length; i++) {
        const time = times[i]
        if (time < first || time > last) continue
        const point = byTime.get(time)
        if (point !== undefined) {
            points.push(point)
            prevIndex = i
            continue
        }
        // Interior gap: find neighbours and interpolate on the ordinal axis.
        const prevTime = times[prevIndex]
        const prevPoint = byTime.get(prevTime)
        let nextTime: TimeOrdinal | undefined
        for (let j = i + 1; j < times.length; j++) {
            if (byTime.has(times[j])) {
                nextTime = times[j]
                break
            }
        }
        const nextPoint = nextTime !== undefined ? byTime.get(nextTime) : undefined
        if (prevPoint === undefined || nextPoint === undefined || nextTime === undefined) continue
        const ratio = (time - prevTime) / (nextTime - prevTime)
        points.push({
            time,
            value: prevPoint.value + (nextPoint.value - prevPoint.value) * ratio,
            sourceTime: time,
            interpolated: true,
        })
    }
    return { ...series, points }
}

export function layoutStackedArea(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale
    const relative = ctx.stackMode === "relative"

    const builtResult = buildSeriesModels(ctx, "stacked-area")
    const diagnostics = [...builtResult.diagnostics]
    if (builtResult.series.length === 0 || ctx.times.length === 0) return emptyLayer(area, diagnostics)

    // Spec 14: negative values are a validation error — render nothing.
    const negatives = builtResult.series.flatMap((s) => s.points.filter((p) => p.value < 0))
    if (negatives.length > 0) {
        diagnostics.push({
            severity: "error",
            code: "negative-values-in-stacked-area",
            message:
                "Stacked area charts require non-negative values; use a stacked bar chart (which supports negatives) or a line chart",
            context: { count: negatives.length },
        })
        return emptyLayer(area, diagnostics)
    }

    // Interpolate interior gaps, keep absolute values for tooltips.
    const interpolated = builtResult.series.map((s) => interpolateInteriorGaps(s, ctx.times))

    // Zero-throughout series leave the stack but stay in the legend, greyed.
    const greyedLegendKeys: SeriesKey[] = []
    const active: SeriesModel[] = []
    for (const series of interpolated) {
        if (series.points.every((p) => p.value === 0)) {
            greyedLegendKeys.push(series.key)
        } else {
            active.push(series)
        }
    }
    if (active.length === 0) return emptyLayer(area, diagnostics)

    const absoluteByKey = new Map(active.map((s) => [s.key, pointByTime(s)]))
    const display = relative ? toShareOfTotalSeries(active) : active

    // Stack in definition order, bottom-up.
    const stackedInput: StackedSeries[] = display.map((series) => ({
        seriesKey: series.key,
        points: series.points
            .filter((p) => p.time !== null)
            .map((p) => ({
                position: p.time as number,
                time: p.time as number,
                value: p.value,
                valueOffset: 0,
                ...(p.interpolated === true ? { interpolated: true } : {}),
            })),
    }))
    const stacked = stackSeries(withMissingValuesAsZeroes(stackedInput))

    // --- Axes -------------------------------------------------------------------
    const labelFont = seriesLabelFont(scale)
    const showLabels = !ctx.definition.hideSeriesLabels && !opts.legendReserved
    const labelMaxWidth = Math.max(30, area.width * 0.25)
    let rightReserve = 0
    const labelTexts = new Map<SeriesKey, string>()
    if (showLabels) {
        for (const series of display) {
            const text = truncateWithEllipsis(series.label, labelFont, labelMaxWidth, measurer)
            labelTexts.set(series.key, text)
            rightReserve = Math.max(rightReserve, measurer.measure(text, labelFont).width)
        }
        rightReserve += LABEL_GAP + 4
    }

    const slug = ctx.definition.y[0]
    const stackTops = stacked.flatMap((s) => s.points.map((p) => p.value + p.valueOffset))
    const axes = layoutVerticalAxes({
        area,
        values: [0, ...stackTops],
        markType: "bar",
        scaleType: "linear",
        config: ctx.definition.yAxis,
        meta: relative ? RELATIVE_META : metaFor(ctx, slug),
        locale,
        theme,
        measurer,
        font: tickFont(scale),
        rightReserve,
        ...(relative ? { pinnedMax: 100 } : {}),
    })
    diagnostics.push(...axes.diagnostics)
    const { plotArea, yScale } = axes

    const window = ctx.window ?? { start: ctx.times[0], end: ctx.times[ctx.times.length - 1] }
    const xScale = createValueScale("linear", [window.start, window.end], [plotArea.x, plotArea.x + plotArea.width])
    const placeX = (position: number): number => xScale.place(position)

    const nodes: SceneNode[] = [...axes.nodes]
    nodes.push(
        ...timeAxisNodes({
            times: ctx.times,
            place: placeX,
            plotArea,
            clampBounds: area,
            grain,
            locale,
            theme,
            measurer,
            font: tickFont(scale),
        }),
    )

    // --- Bands -------------------------------------------------------------------
    const baselineY = yScale.place(0)
    const singleTime = stacked.length > 0 && stacked[0].points.length === 1
    const upperOf = (series: StackedSeries): Vec2[] => {
        if (singleTime) {
            const point = series.points[0]
            const y = yScale.place(point.value + point.valueOffset)
            return [
                { x: plotArea.x, y },
                { x: plotArea.x + plotArea.width, y },
            ]
        }
        return series.points.map((p) => ({ x: placeX(p.position), y: yScale.place(p.value + p.valueOffset) }))
    }

    const colourByKey = new Map(display.map((s) => [s.key, s.colour]))
    let prevUpper: Vec2[] | null = null
    for (const series of stacked) {
        const upper = upperOf(series)
        const lower = prevUpper ?? upper.map((p) => ({ x: p.x, y: baselineY }))
        const colour = colourByKey.get(series.seriesKey) ?? theme.palette.noData
        nodes.push({
            key: `series/${series.seriesKey}/band`,
            seriesKey: series.seriesKey,
            role: "mark",
            kind: "area",
            upper,
            lower,
            style: { fill: colour, opacity: BAND_OPACITY },
        })
        nodes.push({
            key: `series/${series.seriesKey}/edge`,
            seriesKey: series.seriesKey,
            role: "mark",
            kind: "line",
            segments: [upper],
            style: { stroke: colour, strokeWidth: 1 },
        })
        prevUpper = upper
    }

    // --- Band labels at right midpoints --------------------------------------------
    let needsLegendFallback = greyedLegendKeys.length > 0 && !opts.legendReserved && !ctx.definition.hideLegend
    if (showLabels) {
        const candidates: LabelCandidate[] = []
        for (const series of stacked) {
            const last = series.points[series.points.length - 1]
            if (last === undefined || last.value === 0) continue
            const top = yScale.place(last.value + last.valueOffset)
            const bottom = yScale.place(last.valueOffset)
            const text = labelTexts.get(series.seriesKey) ?? series.seriesKey
            const metrics = measurer.measure(text, labelFont)
            candidates.push({
                seriesKey: series.seriesKey,
                text,
                targetY: (top + bottom) / 2,
                priority: last.value,
                width: metrics.width,
                height: metrics.ascent + metrics.descent,
            })
        }
        const { placed, dropped } = declutterLabels(candidates, plotArea.y, plotArea.y + plotArea.height)
        for (const label of placed) {
            const metrics = measurer.measure(label.text, labelFont)
            nodes.push(
                textNode({
                    key: `label/${label.seriesKey}`,
                    role: "label",
                    text: label.text,
                    font: labelFont,
                    anchor: "start",
                    x: plotArea.x + plotArea.width + LABEL_GAP,
                    baselineY: label.y + metrics.ascent,
                    colour: colourByKey.get(label.seriesKey) ?? theme.chrome.tickLabel,
                    measurer,
                    seriesKey: label.seriesKey,
                }),
            )
        }
        if (dropped.length > 0) needsLegendFallback = true
    } else if (ctx.definition.hideSeriesLabels && !opts.legendReserved) {
        needsLegendFallback = true
    }

    // --- Hover ---------------------------------------------------------------------
    const targets: HitTarget[] = []
    const t = strings(locale)
    const displayByKey = new Map(display.map((s) => [s.key, s]))
    for (const time of ctx.times) {
        const flags = collectFooterFlags()
        const rows: TooltipRow[] = []
        let total = 0
        let presentCount = 0
        for (const series of stacked) {
            const stackPoint = series.points.find((p) => p.position === time)
            const model = displayByKey.get(series.seriesKey)
            const absPoint = absoluteByKey.get(series.seriesKey)?.get(time)
            if (stackPoint === undefined || stackPoint.missing === true || model === undefined || absPoint === undefined) {
                rows.push(missingRow(series.seriesKey, model?.label ?? series.seriesKey, colourByKey.get(series.seriesKey) ?? theme.palette.noData, locale))
                continue
            }
            noteFooterFlags(flags, absPoint, time)
            if (stackPoint.interpolated === true) flags.interpolated = true
            total += absPoint.value
            presentCount += 1
            const absText = tooltipValueText(ctx, model.column ?? slug, absPoint.value, false)
            const valueText = relative
                ? `${formatValue(stackPoint.value, RELATIVE_META, { locale, verbosity: "long" })} (${absText})`
                : absText
            rows.push({
                seriesKey: series.seriesKey,
                label: model.label,
                swatch: model.colour,
                valueText,
                emphasized: false,
            })
        }
        targets.push({
            kind: "time",
            time,
            x: placeX(time),
            tooltip: {
                title: formatTime(time, grain, locale),
                rows,
                ...(presentCount >= 2 && !relative
                    ? {
                          totalRow: {
                              seriesKey: "total",
                              label: t.total,
                              swatch: theme.chrome.axisLine,
                              valueText: tooltipValueText(ctx, slug, total, false),
                              emphasized: true,
                          },
                      }
                    : {}),
                footers: buildFooters(flags, grain, locale),
            },
        })
    }

    // SeriesModel output carries the stacked offsets (layer-2 contract).
    const offsetByKey = new Map(stacked.map((s) => [s.seriesKey, new Map(s.points.map((p) => [p.position, p.valueOffset]))]))
    const outSeries = display.map((series) => ({
        ...series,
        points: series.points.map((p) => ({
            ...p,
            valueOffset: p.time !== null ? (offsetByKey.get(series.key)?.get(p.time) ?? 0) : 0,
        })),
    }))

    const greyedItems = interpolated
        .filter((s) => greyedLegendKeys.includes(s.key))
        .map((s) => ({ seriesKey: s.key, label: s.label, swatch: theme.palette.noData }))

    return {
        plotArea,
        nodes,
        series: outSeries,
        hover: { targets, timeGuide: { y0: plotArea.y, y1: plotArea.y + plotArea.height } },
        legendItems: [...legendItemsFor(display), ...greyedItems],
        greyedLegendKeys,
        needsLegendFallback,
        empty: false,
        diagnostics,
    }
}
