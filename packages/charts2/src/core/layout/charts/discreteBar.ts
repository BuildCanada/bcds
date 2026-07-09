/**
 * Discrete bar chart layout (spec 13).
 *
 * Horizontal bars from a zero baseline at a single target time. Default sort
 * is value descending; toleranced values append "in ‹time›" to the value
 * label; negative bars extend left with mirrored labels; bar height
 * compresses to a floor when rows are many.
 */

import { resolveValue } from "../../data/derived.ts"
import { formatTime } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, SeriesPoint } from "../../scene/nodes.ts"
import { truncateWithEllipsis } from "../../text/truncate.ts"
import type { SortConfig } from "../../types.ts"
import { horizontalValueAxisNodes, prepareValueAxis, PLOT_TOP_PAD } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { bandPositions, createValueScale } from "../scales.ts"
import { buildSeriesModels } from "../series.ts"
import {
    buildFooters,
    centeredBaseline,
    collectFooterFlags,
    compareStrings,
    emptyLayer,
    labelValueText,
    legendItemsFor,
    metricSubtitle,
    noteFooterFlags,
    noticeFor,
    pointByTime,
    seriesLabelFont,
    strings,
    textNode,
    tickFont,
    tooltipValueText,
    valueLabelFont,
    metaFor,
    RELATIVE_META,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

export const DEFAULT_BAR_SORT: SortConfig = { by: "total", order: "desc" }

const BAR_HEIGHT_FLOOR = 3
const BAR_HEIGHT_MAX = 36

interface Bar {
    series: SeriesModel
    point: SeriesPoint
    value: number
    labelText: string
    valueText: string
}

function changeOver(ctx: LayoutContext, slug: string, entity: string): number {
    if (ctx.window === null) return 0
    const overrides = ctx.definition.bindings?.[slug]
    const start = resolveValue(ctx.dataset, slug, entity, ctx.window.start, overrides)
    const end = resolveValue(ctx.dataset, slug, entity, ctx.window.end, overrides)
    if (start.status !== "value" || end.status !== "value") return 0
    return end.value - start.value
}

function sortBars(ctx: LayoutContext, bars: Bar[]): Bar[] {
    const sort = ctx.definition.sort ?? DEFAULT_BAR_SORT
    const direction = sort.order === "asc" ? 1 : -1
    const sorted = [...bars]
    switch (sort.by) {
        case "name":
            sorted.sort((a, b) => direction * compareStrings(a.series.label, b.series.label))
            break
        case "column": {
            const slug = sort.column ?? ctx.definition.y[0]
            const target = ctx.window?.end ?? null
            const keyOf = (bar: Bar): number => {
                const entity = bar.series.entity
                if (entity === undefined) return bar.value
                const resolved = resolveValue(ctx.dataset, slug, entity, target, ctx.definition.bindings?.[slug])
                return resolved.status === "value" ? resolved.value : Number.NEGATIVE_INFINITY
            }
            sorted.sort((a, b) => direction * (keyOf(a) - keyOf(b)))
            break
        }
        case "change":
            sorted.sort((a, b) => {
                const ca = a.series.entity !== undefined ? changeOver(ctx, a.series.column ?? ctx.definition.y[0], a.series.entity) : 0
                const cb = b.series.entity !== undefined ? changeOver(ctx, b.series.column ?? ctx.definition.y[0], b.series.entity) : 0
                return direction * (ca - cb)
            })
            break
        case "custom":
            break
        case "total":
        default:
            sorted.sort((a, b) => direction * (a.value - b.value))
            break
    }
    return sorted
}

export function layoutDiscreteBar(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale
    const relative = ctx.stackMode === "relative"
    const target = ctx.window?.end ?? null

    const builtResult = buildSeriesModels(ctx, "discrete-bar")
    const diagnostics = [...builtResult.diagnostics]

    // One bar per series, from its point at the target time (resolveValue
    // already applied tolerance when building the series).
    const labelFont = seriesLabelFont(scale)
    const valueFont = valueLabelFont(scale)
    let bars: Bar[] = []
    for (const series of builtResult.series) {
        const point = pointByTime(series).get(target)
        if (point === undefined) continue
        bars.push({ series, point, value: point.value, labelText: series.label, valueText: "" })
    }
    if (bars.length === 0) return emptyLayer(area, diagnostics)

    // Relative mode: share of the visible total (absolute weights).
    if (relative) {
        const total = bars.reduce((sum, bar) => sum + Math.abs(bar.value), 0)
        for (const bar of bars) bar.value = total > 0 ? (bar.value / total) * 100 : 0
    }

    bars = sortBars(ctx, bars)

    // Value label text, with the tolerance suffix when borrowed (spec 13).
    const t = strings(locale)
    for (const bar of bars) {
        const slug = bar.series.column ?? ctx.definition.y[0]
        let text = labelValueText(ctx, slug, bar.value, relative)
        if (target !== null && bar.point.sourceTime !== undefined && bar.point.sourceTime !== target) {
            text += t.inTime(formatTime(bar.point.sourceTime, grain, locale))
        }
        bar.valueText = text
    }

    // --- Geometry --------------------------------------------------------------
    const labelMaxWidth = Math.min(
        Math.max(...bars.map((bar) => measurer.measure(bar.labelText, labelFont).width)),
        area.width * 0.3,
    )
    const labelColWidth = labelMaxWidth + 6
    let posReserve = 0
    let negReserve = 0
    for (const bar of bars) {
        const width = measurer.measure(bar.valueText, valueFont).width + 6
        if (bar.value < 0) negReserve = Math.max(negReserve, width)
        else posReserve = Math.max(posReserve, width)
    }

    const axisFont = tickFont(scale)
    const sample = measurer.measure("0", axisFont)
    const axisHeight = sample.ascent + sample.descent + PLOT_TOP_PAD + 2

    const plotArea: Rect = {
        x: area.x + labelColWidth + negReserve,
        y: area.y + 4,
        width: Math.max(10, area.width - labelColWidth - negReserve - posReserve),
        height: Math.max(10, area.height - 4 - axisHeight),
    }

    const spec = prepareValueAxis({
        values: [0, ...bars.map((bar) => bar.value)],
        markType: "bar",
        scaleType: "linear",
        config: ctx.definition.xAxis,
        pixelLength: plotArea.width,
        font: axisFont,
        meta: relative ? RELATIVE_META : metaFor(ctx, ctx.definition.y[0]),
        locale,
        measurer,
        showSign: relative,
    })
    diagnostics.push(...spec.diagnostics)
    const xScale = createValueScale("linear", spec.domain, [plotArea.x, plotArea.x + plotArea.width])

    const nodes: SceneNode[] = horizontalValueAxisNodes(spec, xScale, plotArea, area, {
        theme,
        font: axisFont,
        hideGridlines: ctx.definition.xAxis?.hideGridlines,
        hideTickLabels: ctx.definition.xAxis?.hideTickLabels,
    })

    // --- Bars, labels, hover -----------------------------------------------------
    const rows = bandPositions(bars.length, [plotArea.y, plotArea.y + plotArea.height], 1)
    const rowHeight = rows.length > 0 ? rows[0].width : plotArea.height
    const barHeight = Math.min(Math.max(rowHeight * 0.7, BAR_HEIGHT_FLOOR), BAR_HEIGHT_MAX)
    const zeroX = xScale.place(0)
    const subtitle = metricSubtitle(ctx, ctx.definition.y[0])
    const targets: HitTarget[] = []
    const outSeries: SeriesModel[] = []

    bars.forEach((bar, index) => {
        const row = rows[index]
        const barTop = row.center - barHeight / 2
        const endX = xScale.place(bar.value)
        const rect: Rect = {
            x: Math.min(zeroX, endX),
            y: barTop,
            width: Math.abs(endX - zeroX),
            height: barHeight,
        }
        nodes.push({
            key: `series/${bar.series.key}/bar`,
            seriesKey: bar.series.key,
            role: "mark",
            kind: "rect",
            rect,
            style: {
                fill: bar.series.colour,
                ...(bar.point.projected === true ? { patternId: "projection", opacity: 0.85 } : {}),
            },
        })

        // Row label (left of the bar area).
        const rowLabel = truncateWithEllipsis(bar.labelText, labelFont, Math.max(10, labelMaxWidth), measurer)
        const rowLabelMetrics = measurer.measure(rowLabel, labelFont)
        nodes.push(
            textNode({
                key: `label/${bar.series.key}`,
                role: "label",
                text: rowLabel,
                font: labelFont,
                anchor: "end",
                x: area.x + labelColWidth - 6,
                baselineY: centeredBaseline(row.center, rowLabelMetrics),
                colour: theme.chrome.tickLabel,
                measurer,
                seriesKey: bar.series.key,
            }),
        )

        // Value label at the bar end, mirrored for negatives.
        const valueMetrics = measurer.measure(bar.valueText, valueFont)
        const negative = bar.value < 0
        nodes.push(
            textNode({
                key: `value/${bar.series.key}`,
                role: "label",
                text: bar.valueText,
                font: valueFont,
                anchor: negative ? "end" : "start",
                x: negative ? endX - 4 : endX + 4,
                baselineY: centeredBaseline(row.center, valueMetrics),
                colour: theme.chrome.tickLabel,
                measurer,
                seriesKey: bar.series.key,
            }),
        )

        // Hover: the whole row is the hit area.
        const flags = collectFooterFlags()
        noteFooterFlags(flags, bar.point, target)
        const slug = bar.series.column ?? ctx.definition.y[0]
        const notice = noticeFor(bar.point, target)
        targets.push({
            kind: "series",
            seriesKey: bar.series.key,
            shape: { x: plotArea.x, y: row.start, width: plotArea.width, height: row.width },
            tooltip: {
                title: bar.series.label,
                ...(target !== null ? { titleAnnotation: formatTime(target, grain, locale) } : {}),
                ...(subtitle !== undefined ? { subtitle } : {}),
                rows: [
                    {
                        seriesKey: bar.series.key,
                        label: bar.series.label,
                        swatch: bar.series.colour,
                        valueText: tooltipValueText(ctx, slug, bar.value, relative),
                        emphasized: true,
                        ...(notice !== undefined ? { notice } : {}),
                    },
                ],
                footers: buildFooters(flags, grain, locale),
            },
        })

        outSeries.push({ ...bar.series, points: [{ ...bar.point, value: bar.value }] })
    })

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
