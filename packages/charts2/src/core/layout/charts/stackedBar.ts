/**
 * Stacked bar chart layout (spec 15).
 *
 * Vertical columns at discrete time positions; positives stack upward and
 * negatives stack downward independently (stackSeriesInBothDirections — a
 * negative segment never offsets a positive one). NO interpolation: a
 * missing value contributes nothing to its column and the tooltip reports a
 * "No data" row. Relative mode is the share of each column's absolute total.
 */

import { formatValue } from "../../format/number.ts"
import { formatTime } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, TooltipRow } from "../../scene/nodes.ts"
import type { TimeOrdinal } from "../../types.ts"
import { layoutVerticalAxes, timeAxisNodes } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { bandPositions, createValueScale } from "../scales.ts"
import { buildSeriesModels, toShareOfTotalSeries } from "../series.ts"
import { stackSeriesInBothDirections, type StackedSeries } from "../stacking.ts"
import {
    buildFooters,
    collectFooterFlags,
    emptyLayer,
    legendItemsFor,
    missingRow,
    noteFooterFlags,
    pointByTime,
    strings,
    tickFont,
    tooltipValueText,
    metaFor,
    RELATIVE_META,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

export function layoutStackedBar(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale
    const relative = ctx.stackMode === "relative"

    const builtResult = buildSeriesModels(ctx, "stacked-bar")
    const diagnostics = [...builtResult.diagnostics]
    if (builtResult.series.length === 0 || ctx.times.length === 0) return emptyLayer(area, diagnostics)

    const absoluteByKey = new Map(builtResult.series.map((s) => [s.key, pointByTime(s)]))
    const display = relative ? toShareOfTotalSeries(builtResult.series) : builtResult.series

    // Every column position is seeded for every series; missing values are
    // zero-filled with a missing flag (no interpolation, spec 15).
    const stackedInput: StackedSeries[] = display.map((series) => {
        const byTime = pointByTime(series)
        return {
            seriesKey: series.key,
            points: ctx.times.map((time) => {
                const point = byTime.get(time)
                return {
                    position: time,
                    time,
                    value: point?.value ?? 0,
                    valueOffset: 0,
                    missing: point === undefined,
                }
            }),
        }
    })
    const stacked = stackSeriesInBothDirections(stackedInput)

    // --- Axes ----------------------------------------------------------------
    const slug = ctx.definition.y[0]
    const extents = stacked.flatMap((s) => s.points.map((p) => p.value + p.valueOffset))
    const axes = layoutVerticalAxes({
        area,
        values: [0, ...extents],
        markType: "bar",
        scaleType: "linear",
        config: ctx.definition.yAxis,
        meta: relative ? RELATIVE_META : metaFor(ctx, slug),
        locale,
        theme,
        measurer,
        font: tickFont(scale),
        rightReserve: 0,
        showSign: relative,
    })
    diagnostics.push(...axes.diagnostics)
    const { plotArea, yScale } = axes

    const bands = bandPositions(ctx.times.length, [plotArea.x, plotArea.x + plotArea.width], 0.7)
    const bandByTime = new Map<TimeOrdinal, (typeof bands)[number]>()
    ctx.times.forEach((time, index) => bandByTime.set(time, bands[index]))
    const placeX = (time: TimeOrdinal): number => bandByTime.get(time)?.center ?? plotArea.x

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

    // --- Column segments ---------------------------------------------------------
    const colourByKey = new Map(display.map((s) => [s.key, s.colour]))
    for (const series of stacked) {
        const colour = colourByKey.get(series.seriesKey) ?? theme.palette.noData
        for (const point of series.points) {
            if (point.missing === true || point.value === 0) continue
            const band = bandByTime.get(point.position as TimeOrdinal)
            if (band === undefined) continue
            const y1 = yScale.place(point.valueOffset)
            const y2 = yScale.place(point.value + point.valueOffset)
            nodes.push({
                key: `series/${series.seriesKey}/bar/${point.position}`,
                seriesKey: series.seriesKey,
                role: "mark",
                kind: "rect",
                rect: {
                    x: band.start,
                    y: Math.min(y1, y2),
                    width: band.width,
                    height: Math.abs(y2 - y1),
                },
                style: { fill: colour },
            })
        }
    }

    // --- Hover ----------------------------------------------------------------------
    const t = strings(locale)
    const displayByKey = new Map(display.map((s) => [s.key, s]))
    const targets: HitTarget[] = []
    for (const time of ctx.times) {
        const flags = collectFooterFlags()
        const rows: TooltipRow[] = []
        let total = 0
        let presentCount = 0
        for (const series of stacked) {
            const model = displayByKey.get(series.seriesKey)
            if (model === undefined) continue
            const absPoint = absoluteByKey.get(series.seriesKey)?.get(time)
            const stackPoint = series.points.find((p) => p.position === time)
            if (absPoint === undefined || stackPoint === undefined || stackPoint.missing === true) {
                rows.push(missingRow(series.seriesKey, model.label, model.colour, locale))
                continue
            }
            noteFooterFlags(flags, absPoint, time)
            total += absPoint.value
            presentCount += 1
            const absText = tooltipValueText(ctx, model.column ?? slug, absPoint.value, false)
            rows.push({
                seriesKey: series.seriesKey,
                label: model.label,
                swatch: model.colour,
                valueText: relative
                    ? `${formatValue(stackPoint.value, RELATIVE_META, { locale, verbosity: "long" })} (${absText})`
                    : absText,
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

    // SeriesModel output carries the stacked offsets for real points only.
    const offsetByKey = new Map(stacked.map((s) => [s.seriesKey, new Map(s.points.map((p) => [p.position, p.valueOffset]))]))
    const outSeries: SeriesModel[] = display.map((series) => ({
        ...series,
        points: series.points.map((p) => ({
            ...p,
            valueOffset: p.time !== null ? (offsetByKey.get(series.key)?.get(p.time) ?? 0) : 0,
        })),
    }))

    return {
        plotArea,
        nodes,
        series: outSeries,
        hover: { targets, timeGuide: { y0: plotArea.y, y1: plotArea.y + plotArea.height } },
        legendItems: legendItemsFor(display),
        greyedLegendKeys: [],
        needsLegendFallback: false,
        empty: false,
        valueDomain: axes.spec.domain,
        diagnostics,
    }
}
