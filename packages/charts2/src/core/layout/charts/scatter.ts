/**
 * Scatter chart layout (spec 18).
 *
 * Snapshot mode (MVP): one point per entity at the target time, plotted on two
 * independent value axes (x from `definition.x`, y from `definition.y[0]`).
 * Optional point-size scaling (sqrt) from `sizeMetric` and categorical colour
 * binning from `colourMetric`. Entity labels are placed for a capped, priority
 * ordered subset with a simple bounding-box declutter. Trails (connected
 * scatter over a time range) are NOT implemented — a range selection renders as
 * a snapshot at the window end and emits a diagnostic.
 */

import { resolveValue } from "../../data/derived.ts"
import { formatTime } from "../../format/timeLabels.ts"
import { assignColours, createColourState } from "../../color/categoricalAssigner.ts"
import type { HitTarget, LegendItem, Rect, SceneNode, SeriesModel, SeriesPoint, TooltipRow } from "../../scene/nodes.ts"
import type { Diagnostic, HexColour, ResolvedValue, TimeOrdinal } from "../../types.ts"
import { horizontalValueAxisNodes, prepareValueAxis, verticalValueAxisNodes, PLOT_TOP_PAD, TICK_PADDING } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { createValueScale } from "../scales.ts"
import {
    buildFooters,
    centeredBaseline,
    collectFooterFlags,
    emptyLayer,
    metaFor,
    metricSubtitle,
    noteFooterFlags,
    noticeFor,
    seriesLabelFont,
    textNode,
    tickFont,
    tooltipValueText,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

const LABEL_GAP = 4
const LABEL_CAP = 20

interface ScatterPoint {
    entity: string
    xValue: number
    yValue: number
    x: ResolvedValue & { status: "value" }
    y: ResolvedValue & { status: "value" }
    sizeValue?: number
    colourValue?: number
}

function metricName(ctx: LayoutContext, slug: string): string {
    return ctx.columns[slug]?.name ?? slug
}

function toSeriesPoint(resolved: ResolvedValue & { status: "value" }, time: TimeOrdinal | null): SeriesPoint {
    return {
        time,
        value: resolved.value,
        ...(resolved.sourceTime !== undefined ? { sourceTime: resolved.sourceTime } : {}),
        ...(resolved.projected === true ? { projected: true } : {}),
        ...(resolved.interpolated === true ? { interpolated: true } : {}),
    }
}

function boxesOverlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export function layoutScatter(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale
    const diagnostics: Diagnostic[] = []

    // --- x metric is required ------------------------------------------------
    const xSlug = ctx.definition.x
    if (xSlug === undefined) {
        return emptyLayer(area, [
            { severity: "error", code: "scatter-missing-x", message: "Scatter charts require an x metric" },
        ])
    }
    const ySlug = ctx.definition.y[0]
    const sizeSlug = ctx.definition.sizeMetric
    const colourSlug = ctx.definition.colourMetric

    // Snapshot at the window end (null for grain "none"). Trails deferred.
    const target: TimeOrdinal | null = grain === "none" ? null : (ctx.window?.end ?? null)
    if (grain !== "none" && ctx.window !== null && ctx.window.start !== ctx.window.end) {
        diagnostics.push({
            severity: "warning",
            code: "scatter-range-snapshot",
            message: "Scatter renders the selected range as a snapshot at the window end (trails not implemented)",
        })
    }

    // --- Resolve one (x, y) pair per entity ----------------------------------
    const resolved: ScatterPoint[] = []
    for (const entity of ctx.entities) {
        const x = resolveValue(ctx.dataset, xSlug, entity, target, ctx.definition.bindings?.[xSlug])
        const y = resolveValue(ctx.dataset, ySlug, entity, target, ctx.definition.bindings?.[ySlug])
        if (x.status !== "value" || y.status !== "value") {
            diagnostics.push({
                severity: "warning",
                code: "scatter-missing-pair",
                message: `${entity} is missing an x or y value and was excluded`,
                context: { entity },
            })
            continue
        }
        const point: ScatterPoint = { entity, xValue: x.value, yValue: y.value, x, y }
        if (sizeSlug !== undefined) {
            const s = resolveValue(ctx.dataset, sizeSlug, entity, target, ctx.definition.bindings?.[sizeSlug])
            if (s.status === "value") point.sizeValue = s.value
        }
        if (colourSlug !== undefined) {
            const c = resolveValue(ctx.dataset, colourSlug, entity, target, ctx.definition.bindings?.[colourSlug])
            if (c.status === "value") point.colourValue = c.value
        }
        resolved.push(point)
    }

    // --- Log axes drop non-positive values on that axis (reported) -----------
    const xScaleType = ctx.definition.xAxis?.scale ?? "linear"
    const yScaleType = ctx.scaleType
    const renderable: ScatterPoint[] = []
    let xExcluded = 0
    let yExcluded = 0
    for (const point of resolved) {
        if (xScaleType === "log" && point.xValue <= 0) {
            xExcluded++
            continue
        }
        if (yScaleType === "log" && point.yValue <= 0) {
            yExcluded++
            continue
        }
        renderable.push(point)
    }
    if (xExcluded > 0) {
        diagnostics.push({
            severity: "warning",
            code: "scatter-log-excluded",
            message: `${xExcluded} non-positive x value${xExcluded === 1 ? "" : "s"} excluded from the log axis`,
            context: { axis: "x", count: xExcluded },
        })
    }
    if (yExcluded > 0) {
        diagnostics.push({
            severity: "warning",
            code: "scatter-log-excluded",
            message: `${yExcluded} non-positive y value${yExcluded === 1 ? "" : "s"} excluded from the log axis`,
            context: { axis: "y", count: yExcluded },
        })
    }

    if (renderable.length === 0) return emptyLayer(area, diagnostics)

    // --- Axes (both value axes) ----------------------------------------------
    const yFont = tickFont(scale)
    const xFont = tickFont(scale)
    const sample = measurer.measure("0", xFont)
    const xAxisHeight = sample.ascent + sample.descent + PLOT_TOP_PAD + 2
    const provHeight = Math.max(10, area.height - xAxisHeight - PLOT_TOP_PAD)

    const ySpec = prepareValueAxis({
        values: renderable.map((p) => p.yValue),
        markType: "line",
        scaleType: yScaleType,
        config: ctx.definition.yAxis,
        pixelLength: provHeight,
        font: yFont,
        meta: metaFor(ctx, ySlug),
        locale,
        measurer,
    })
    diagnostics.push(...ySpec.diagnostics)
    const yAxisWidth = ctx.definition.yAxis?.hideTickLabels === true ? 0 : ySpec.maxLabelWidth + TICK_PADDING

    const plotArea: Rect = {
        x: area.x + yAxisWidth,
        y: area.y + PLOT_TOP_PAD,
        width: Math.max(10, area.width - yAxisWidth),
        height: Math.max(10, area.height - PLOT_TOP_PAD - xAxisHeight),
    }

    const xSpec = prepareValueAxis({
        values: renderable.map((p) => p.xValue),
        markType: "line",
        scaleType: xScaleType,
        config: ctx.definition.xAxis,
        pixelLength: plotArea.width,
        font: xFont,
        meta: metaFor(ctx, xSlug),
        locale,
        measurer,
    })
    diagnostics.push(...xSpec.diagnostics)

    const yScale = createValueScale(yScaleType, ySpec.domain, [plotArea.y + plotArea.height, plotArea.y])
    const xScale = createValueScale(xScaleType, xSpec.domain, [plotArea.x, plotArea.x + plotArea.width])

    const nodes: SceneNode[] = [
        ...verticalValueAxisNodes(ySpec, yScale, plotArea, Math.max(0, area.y - PLOT_TOP_PAD), {
            theme,
            font: yFont,
            hideGridlines: ctx.definition.yAxis?.hideGridlines,
            hideTickLabels: ctx.definition.yAxis?.hideTickLabels,
        }),
        ...horizontalValueAxisNodes(xSpec, xScale, plotArea, area, {
            theme,
            font: xFont,
            hideGridlines: ctx.definition.xAxis?.hideGridlines,
            hideTickLabels: ctx.definition.xAxis?.hideTickLabels,
        }),
    ]

    // --- Colour: categorical bins, else theme primary ------------------------
    const primary: HexColour = theme.palette.categorical[0]
    const colourByEntity = new Map<string, HexColour>()
    const legendItems: LegendItem[] = []
    if (colourSlug !== undefined) {
        const colType = ctx.columns[colourSlug]?.type
        if (colType === "categorical" || colType === "ordinal") {
            const distinct = [...new Set(renderable.map((p) => p.colourValue).filter((v): v is number => v !== undefined))].sort(
                (a, b) => a - b,
            )
            const binKeys = distinct.map((v) => String(v))
            const state = createColourState(theme.palette.categorical)
            const assigned = assignColours(state, binKeys)
            const binColour = new Map<number, HexColour>()
            distinct.forEach((v, i) => {
                const colour = assigned.get(binKeys[i]) ?? primary
                binColour.set(v, colour)
                legendItems.push({
                    seriesKey: binKeys[i],
                    label: tooltipValueText(ctx, colourSlug, v, false),
                    swatch: colour,
                })
            })
            for (const point of renderable) {
                colourByEntity.set(point.entity, point.colourValue !== undefined ? (binColour.get(point.colourValue) ?? primary) : primary)
            }
        } else {
            diagnostics.push({
                severity: "warning",
                code: "scatter-numeric-colour-unsupported",
                message: "Numeric colour metric is rendered with the theme primary colour (continuous ramp not implemented)",
            })
        }
    }
    const colourOf = (entity: string): HexColour => colourByEntity.get(entity) ?? primary

    // --- Point radius: uniform, or sqrt scaling over the size domain ---------
    const uniformRadius = 5 * scale
    const minRadius = 3 * scale
    const maxRadius = 18 * scale
    let radiusOf = (_point: ScatterPoint): number => uniformRadius
    if (sizeSlug !== undefined) {
        const sizeValues = renderable.map((p) => p.sizeValue).filter((v): v is number => v !== undefined)
        if (sizeValues.length > 0) {
            const sMin = Math.min(...sizeValues)
            const sMax = Math.max(...sizeValues)
            radiusOf = (point: ScatterPoint): number => {
                if (point.sizeValue === undefined) return minRadius
                if (sMax === sMin) return uniformRadius
                const t = (point.sizeValue - sMin) / (sMax - sMin)
                // Area-proportional (sqrt) interpolation: t=0 → minRadius, t=1 → maxRadius.
                return Math.sqrt(minRadius * minRadius + t * (maxRadius * maxRadius - minRadius * minRadius))
            }
        }
    }

    // --- Marks, hover, series ------------------------------------------------
    const outSeries: SeriesModel[] = []
    const targets: HitTarget[] = []
    const xName = metricName(ctx, xSlug)
    const yName = metricName(ctx, ySlug)
    const subtitle = metricSubtitle(ctx, ySlug)

    for (const point of renderable) {
        const cx = xScale.place(point.xValue)
        const cy = yScale.place(point.yValue)
        const radius = radiusOf(point)
        const colour = colourOf(point.entity)
        const projected = point.x.projected === true || point.y.projected === true
        nodes.push({
            key: `point/${point.entity}`,
            seriesKey: point.entity,
            role: "mark",
            kind: "point",
            center: { x: cx, y: cy },
            radius,
            style: { fill: colour, ...(projected ? { opacity: 0.85 } : {}) },
        })

        // Hover: small box around the point.
        const flags = collectFooterFlags()
        noteFooterFlags(flags, toSeriesPoint(point.x, target), target)
        noteFooterFlags(flags, toSeriesPoint(point.y, target), target)
        const xNotice = noticeFor(point.x, target)
        const yNotice = noticeFor(point.y, target)
        const rows: TooltipRow[] = [
            {
                seriesKey: point.entity,
                label: xName,
                swatch: colour,
                valueText: tooltipValueText(ctx, xSlug, point.xValue, false),
                emphasized: true,
                ...(xNotice !== undefined ? { notice: xNotice } : {}),
            },
            {
                seriesKey: point.entity,
                label: yName,
                swatch: colour,
                valueText: tooltipValueText(ctx, ySlug, point.yValue, false),
                emphasized: true,
                ...(yNotice !== undefined ? { notice: yNotice } : {}),
            },
        ]
        if (sizeSlug !== undefined && point.sizeValue !== undefined) {
            rows.push({
                seriesKey: point.entity,
                label: metricName(ctx, sizeSlug),
                swatch: colour,
                valueText: tooltipValueText(ctx, sizeSlug, point.sizeValue, false),
                emphasized: false,
            })
        }
        if (colourSlug !== undefined && point.colourValue !== undefined) {
            rows.push({
                seriesKey: point.entity,
                label: metricName(ctx, colourSlug),
                swatch: colour,
                valueText: tooltipValueText(ctx, colourSlug, point.colourValue, false),
                emphasized: false,
            })
        }
        const hit = Math.max(radius, 6)
        targets.push({
            kind: "series",
            seriesKey: point.entity,
            shape: { x: cx - hit, y: cy - hit, width: hit * 2, height: hit * 2 },
            tooltip: {
                title: point.entity,
                ...(target !== null ? { titleAnnotation: formatTime(target, grain, locale) } : {}),
                ...(subtitle !== undefined ? { subtitle } : {}),
                rows,
                footers: buildFooters(flags, grain, locale),
            },
        })

        outSeries.push({
            key: point.entity,
            label: point.entity,
            colour,
            entity: point.entity,
            points: [toSeriesPoint(point.y, target)],
        })
    }

    // --- Entity labels: priority (focus > size), capped, decluttered ---------
    const labelFont = seriesLabelFont(scale)
    const focusSet = new Set(ctx.definition.focusedSeries ?? [])
    const ranked = [...renderable].sort((a, b) => {
        const fa = focusSet.has(a.entity) ? 1 : 0
        const fb = focusSet.has(b.entity) ? 1 : 0
        if (fa !== fb) return fb - fa
        const sa = a.sizeValue ?? a.yValue
        const sb = b.sizeValue ?? b.yValue
        return sb - sa
    })
    const placed: Rect[] = []
    for (const point of ranked) {
        if (placed.length >= LABEL_CAP) break
        const metrics = measurer.measure(point.entity, labelFont)
        const radius = radiusOf(point)
        const cx = xScale.place(point.xValue)
        const cy = yScale.place(point.yValue)
        const labelX = cx + radius + LABEL_GAP
        const height = metrics.ascent + metrics.descent
        const box: Rect = { x: labelX, y: cy - height / 2, width: metrics.width, height }
        if (placed.some((other) => boxesOverlap(other, box))) continue
        placed.push(box)
        nodes.push(
            textNode({
                key: `label/${point.entity}`,
                role: "label",
                text: point.entity,
                font: labelFont,
                anchor: "start",
                x: labelX,
                baselineY: centeredBaseline(cy, metrics),
                colour: theme.chrome.tickLabel,
                measurer,
                seriesKey: point.entity,
            }),
        )
    }

    return {
        plotArea,
        nodes,
        series: outSeries,
        hover: { targets },
        legendItems,
        greyedLegendKeys: [],
        needsLegendFallback: legendItems.length > 0 && !opts.legendReserved,
        empty: false,
        valueDomain: ySpec.domain,
        diagnostics,
    }
}
