/**
 * Dumbbell chart layout (spec 17).
 *
 * One row per entity: dots at a start and an end value joined by a connector
 * (an arrow pointing at the end value by default, or a plain line). Two modes:
 *
 * - Two-metric mode (y.length ≥ 2): start = y[0], end = y[1], both at a single
 *   target time (window.end, or null for grain "none").
 * - Time-range mode (y.length === 1): start = the metric at window.start,
 *   end = the metric at window.end.
 *
 * Entities missing either endpoint are excluded and listed as warnings. The
 * value axis is shared across every endpoint and only includes zero when the
 * data spans it. Rows sort by end value (default), start value, change, name,
 * or custom.
 *
 * Trend colouring (spec 17's default) needs a themed semantic palette for
 * rising/falling/flat marks; the current Theme contract exposes no such
 * palette, so marks fall back to the entity identity colour. The logic is kept
 * so a future theme field lights it up without touching this file.
 */

import { resolveValue } from "../../data/derived.ts"
import { formatChange } from "../../format/number.ts"
import { formatTime, formatTimeRange } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, SeriesPoint, TooltipRow } from "../../scene/nodes.ts"
import { truncateWithEllipsis } from "../../text/truncate.ts"
import type { AxisConfig, HexColour, SortConfig, TimeOrdinal } from "../../types.ts"
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
    metaFor,
    noteFooterFlags,
    noticeFor,
    pointByTime,
    seriesLabelFont,
    textNode,
    tickFont,
    tooltipValueText,
    valueLabelFont,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

/** Default sort: largest end value first (spec 17). */
export const DEFAULT_DUMBBELL_SORT: SortConfig = { by: "total", order: "desc" }

const LABEL_GAP = 6
const START_RADIUS = 4
const END_RADIUS = 5.5
const CONNECTOR_WIDTH = 2
const ARROW_LENGTH = 5
const ARROW_SPREAD = 3.5

type Trend = "increase" | "decrease" | "flat"

interface Row {
    key: string
    label: string
    entity: string
    startColumn: string
    endColumn: string
    startTime: TimeOrdinal | null
    endTime: TimeOrdinal | null
    start: SeriesPoint
    end: SeriesPoint
    colour: HexColour
    trend: Trend
    /** Value-label text on the left dot side (empty when none). */
    leftText: string
    /** Value-label text on the right dot side (empty when none). */
    rightText: string
    /** Which endpoint the left/right label belongs to, for stable node keys. */
    startSide: "left" | "right" | "hidden"
    endSide: "left" | "right"
}

function trendOf(startValue: number, endValue: number): Trend {
    if (endValue > startValue) return "increase"
    if (endValue < startValue) return "decrease"
    return "flat"
}

function trendArrow(trend: Trend): string {
    return trend === "increase" ? "↑" : trend === "decrease" ? "↓" : "→"
}

/** Precomputed value-point lookup per (entity, column). */
interface Slot {
    series: SeriesModel
    points: Map<TimeOrdinal | null, SeriesPoint>
}

function sortRows(ctx: LayoutContext, rows: Row[]): Row[] {
    const sort = ctx.definition.sort ?? DEFAULT_DUMBBELL_SORT
    const direction = sort.order === "asc" ? 1 : -1
    const sorted = [...rows]
    switch (sort.by) {
        case "name":
            sorted.sort((a, b) => direction * compareStrings(a.label, b.label))
            break
        case "change":
            sorted.sort((a, b) => direction * (a.end.value - a.start.value - (b.end.value - b.start.value)))
            break
        case "column": {
            const slug = sort.column ?? ctx.definition.y[0]
            const keyOf = (row: Row): number => {
                const resolved = resolveValue(ctx.dataset, slug, row.entity, row.endTime, ctx.definition.bindings?.[slug])
                return resolved.status === "value" ? resolved.value : Number.NEGATIVE_INFINITY
            }
            sorted.sort((a, b) => direction * (keyOf(a) - keyOf(b)))
            break
        }
        case "custom":
            break
        case "total":
        default:
            sorted.sort((a, b) => direction * (a.end.value - b.end.value))
            break
    }
    return sorted
}

export function layoutDumbbell(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale

    const twoMetric = ctx.definition.y.length >= 2
    const startColumn = ctx.definition.y[0]
    const endColumn = twoMetric ? ctx.definition.y[1] : ctx.definition.y[0]

    // Endpoint times. Two-metric: one target time for both endpoints. Time-range:
    // the two window handles.
    const target = ctx.window?.end ?? null
    const startTime = twoMetric ? target : (ctx.window?.start ?? null)
    const endTime = target

    const built = buildSeriesModels(ctx, "dumbbell")
    const diagnostics = [...built.diagnostics]

    // Time-range mode needs a real window; without one there is nothing to span.
    if (!twoMetric && ctx.window === null) return emptyLayer(area, diagnostics)

    // Index built points by (entity, column) so both modes read endpoints the
    // same way. Colour identity comes from the series model.
    const slots = new Map<string, Map<string, Slot>>()
    for (const series of built.series) {
        if (series.entity === undefined || series.column === undefined) continue
        const byColumn = slots.get(series.entity) ?? new Map<string, Slot>()
        byColumn.set(series.column, { series, points: pointByTime(series) })
        slots.set(series.entity, byColumn)
    }

    const pointFor = (entity: string, column: string, time: TimeOrdinal | null): SeriesPoint | undefined =>
        slots.get(entity)?.get(column)?.points.get(time)
    const colourFor = (entity: string, column: string): HexColour | undefined => slots.get(entity)?.get(column)?.series.colour

    // Trend colouring (spec 17 default) requires a themed semantic palette; the
    // Theme contract has none, so this is always undefined and marks fall back
    // to the entity identity colour below.
    const semantic: Record<Trend, HexColour> | undefined = undefined
    const wantTrend = ctx.definition.trendColouring !== false

    const valueFont = valueLabelFont(scale)
    const rows: Row[] = []
    for (const entity of ctx.entities) {
        const start = pointFor(entity, startColumn, startTime)
        const end = pointFor(entity, endColumn, endTime)
        if (start === undefined || end === undefined) {
            diagnostics.push({
                severity: "warning",
                code: "dumbbell-incomplete-endpoints",
                message: `"${entity}" is missing a start or end value and is not shown`,
                context: { entity },
            })
            continue
        }

        const trend = trendOf(start.value, end.value)
        const identity = colourFor(entity, endColumn) ?? colourFor(entity, startColumn) ?? theme.palette.categorical[0]
        const colour = wantTrend && semantic !== undefined ? semantic[trend] : identity

        // Value-label text per mode. Absolute puts each endpoint's value on the
        // outside of its dot; change/percentChange put one figure past the end.
        let leftText = ""
        let rightText = ""
        let startSide: Row["startSide"] = "hidden"
        let endSide: Row["endSide"] = "right"
        const mode = ctx.definition.valueLabelMode ?? "absolute"
        if (mode === "absolute") {
            const startText = tooltipLabelValue(ctx, startColumn, start.value)
            const endText = tooltipLabelValue(ctx, endColumn, end.value)
            if (start.value === end.value) {
                // No change: a single dot with its value to the right.
                rightText = endText
                endSide = "right"
                startSide = "hidden"
            } else if (start.value < end.value) {
                leftText = startText
                rightText = endText
                startSide = "left"
                endSide = "right"
            } else {
                leftText = endText
                rightText = startText
                startSide = "right"
                endSide = "left"
            }
        } else if (mode === "change" || mode === "percentChange") {
            const change = formatChange(start.value, end.value, metaFor(ctx, endColumn), { locale })
            rightText = mode === "change" ? change.absolute : (change.relative ?? "—")
        }

        rows.push({
            key: entity,
            label: entity,
            entity,
            startColumn,
            endColumn,
            startTime,
            endTime,
            start,
            end,
            colour,
            trend,
            leftText,
            rightText,
            startSide,
            endSide,
        })
    }

    if (rows.length === 0) return emptyLayer(area, diagnostics)

    const ordered = sortRows(ctx, rows)

    // --- Geometry --------------------------------------------------------------
    const labelFont = seriesLabelFont(scale)
    const labelMaxWidth = Math.min(
        Math.max(0, ...ordered.map((row) => measurer.measure(row.label, labelFont).width)),
        area.width * 0.3,
    )
    const labelColWidth = labelMaxWidth + 6

    let leftReserve = 0
    let rightReserve = 0
    for (const row of ordered) {
        if (row.leftText !== "") leftReserve = Math.max(leftReserve, measurer.measure(row.leftText, valueFont).width + LABEL_GAP)
        if (row.rightText !== "") rightReserve = Math.max(rightReserve, measurer.measure(row.rightText, valueFont).width + LABEL_GAP)
    }
    // Room for the end dot on either flank even without value labels.
    leftReserve = Math.max(leftReserve, END_RADIUS + 1)
    rightReserve = Math.max(rightReserve, END_RADIUS + 1)

    const axisFont = tickFont(scale)
    const sample = measurer.measure("0", axisFont)
    const axisHeight = sample.ascent + sample.descent + PLOT_TOP_PAD + 2

    const plotArea: Rect = {
        x: area.x + labelColWidth + leftReserve,
        y: area.y + 4,
        width: Math.max(10, area.width - labelColWidth - leftReserve - rightReserve),
        height: Math.max(10, area.height - 4 - axisHeight),
    }

    // Value axis: zero only when the data spans it (release the bar-style zero
    // floor with min "auto", honouring an explicit author override).
    const axisConfig: AxisConfig = { ...ctx.definition.xAxis, min: ctx.definition.xAxis?.min ?? "auto" }
    const spec = prepareValueAxis({
        values: ordered.flatMap((row) => [row.start.value, row.end.value]),
        markType: "line",
        scaleType: "linear",
        config: axisConfig,
        pixelLength: plotArea.width,
        font: axisFont,
        meta: metaFor(ctx, endColumn),
        locale,
        measurer,
    })
    diagnostics.push(...spec.diagnostics)
    const xScale = createValueScale("linear", spec.domain, [plotArea.x, plotArea.x + plotArea.width])

    const nodes: SceneNode[] = horizontalValueAxisNodes(spec, xScale, plotArea, area, {
        theme,
        font: axisFont,
        hideGridlines: ctx.definition.xAxis?.hideGridlines,
        hideTickLabels: ctx.definition.xAxis?.hideTickLabels,
    })

    // --- Rows: dots, connectors, labels, hover ---------------------------------
    const bands = bandPositions(ordered.length, [plotArea.y, plotArea.y + plotArea.height], 1)
    const connector = ctx.definition.connector ?? "arrow"
    const targets: HitTarget[] = []
    const outSeries: SeriesModel[] = []

    ordered.forEach((row, index) => {
        const band = bands[index]
        const cy = band.center
        const startX = xScale.place(row.start.value)
        const endX = xScale.place(row.end.value)
        const noChange = row.start.value === row.end.value

        if (!noChange) {
            // Connector between the two dots.
            const connectorStyle = { stroke: row.colour, strokeWidth: CONNECTOR_WIDTH, lineCap: "round" as const }
            if (connector === "line") {
                nodes.push({
                    key: `series/${row.key}/connector`,
                    seriesKey: row.key,
                    role: "mark",
                    kind: "line",
                    segments: [
                        [
                            { x: startX, y: cy },
                            { x: endX, y: cy },
                        ],
                    ],
                    style: connectorStyle,
                })
            } else {
                nodes.push({
                    key: `series/${row.key}/connector`,
                    seriesKey: row.key,
                    role: "mark",
                    kind: "rule",
                    from: { x: startX, y: cy },
                    to: { x: endX, y: cy },
                    style: connectorStyle,
                })
            }

            if (connector === "arrow") {
                // Two short strokes forming a "V" that points at the end value.
                const dir = endX >= startX ? 1 : -1
                const tipX = endX - dir * END_RADIUS
                const arrow = (suffix: string, dy: number): SceneNode => ({
                    key: `series/${row.key}/arrow/${suffix}`,
                    seriesKey: row.key,
                    role: "mark",
                    kind: "rule",
                    from: { x: tipX - dir * ARROW_LENGTH, y: cy + dy },
                    to: { x: tipX, y: cy },
                    style: { stroke: row.colour, strokeWidth: CONNECTOR_WIDTH, lineCap: "round" },
                })
                nodes.push(arrow("1", -ARROW_SPREAD), arrow("2", ARROW_SPREAD))
            }

            // Start dot (smaller); the end dot is emphasised below.
            nodes.push({
                key: `series/${row.key}/start`,
                seriesKey: row.key,
                role: "mark",
                kind: "point",
                center: { x: startX, y: cy },
                radius: START_RADIUS * scale,
                style: {
                    fill: row.colour,
                    ...(row.start.projected === true ? { patternId: "projection", opacity: 0.85 } : {}),
                },
            })
        }

        // End dot (emphasised). For a no-change row this is the only dot.
        nodes.push({
            key: `series/${row.key}/end`,
            seriesKey: row.key,
            role: "mark",
            kind: "point",
            center: { x: endX, y: cy },
            radius: END_RADIUS * scale,
            style: {
                fill: row.colour,
                ...(row.end.projected === true ? { patternId: "projection", opacity: 0.85 } : {}),
            },
        })

        // Row label (left column, right-anchored against the plot).
        const rowLabel = truncateWithEllipsis(row.label, labelFont, Math.max(10, labelMaxWidth), measurer)
        const rowLabelMetrics = measurer.measure(rowLabel, labelFont)
        nodes.push(
            textNode({
                key: `label/${row.key}`,
                role: "label",
                text: rowLabel,
                font: labelFont,
                anchor: "end",
                x: area.x + labelColWidth - 6,
                baselineY: centeredBaseline(cy, rowLabelMetrics),
                colour: theme.chrome.tickLabel,
                measurer,
                seriesKey: row.key,
            }),
        )

        // Value labels.
        const placeValue = (key: string, text: string, atX: number, side: "left" | "right"): void => {
            if (text === "") return
            const metrics = measurer.measure(text, valueFont)
            nodes.push(
                textNode({
                    key,
                    role: "label",
                    text,
                    font: valueFont,
                    anchor: side === "left" ? "end" : "start",
                    x: side === "left" ? atX - LABEL_GAP : atX + LABEL_GAP,
                    baselineY: centeredBaseline(cy, metrics),
                    colour: theme.chrome.tickLabel,
                    measurer,
                    seriesKey: row.key,
                }),
            )
        }
        const mode = ctx.definition.valueLabelMode ?? "absolute"
        if (mode === "absolute") {
            if (row.startSide !== "hidden") {
                const startText = tooltipLabelValue(ctx, row.startColumn, row.start.value)
                placeValue(`value/${row.key}/start`, startText, startX, row.startSide)
            }
            const endText = tooltipLabelValue(ctx, row.endColumn, row.end.value)
            placeValue(`value/${row.key}/end`, endText, endX, row.endSide)
        } else if (mode === "change" || mode === "percentChange") {
            placeValue(`value/${row.key}/change`, row.rightText, Math.max(startX, endX), "right")
        }

        // Hover (OWID format): title = entity, a single "start → end" row with a
        // trend arrow. Time-range mode subtitles the year range; two-metric mode
        // subtitles the two metric names and annotates the target time.
        const flags = collectFooterFlags()
        noteFooterFlags(flags, row.start, row.startTime)
        noteFooterFlags(flags, row.end, row.endTime)
        const startNotice = noticeFor(row.start, row.startTime)
        const endNotice = noticeFor(row.end, row.endTime)
        const notice =
            startNotice === "projected" || endNotice === "projected" ? "projected" : (startNotice ?? endNotice)

        const startText = tooltipValueText(ctx, row.startColumn, row.start.value, false)
        const endText = tooltipValueText(ctx, row.endColumn, row.end.value, false)
        const rangeText = `${startText} ${trendArrow(row.trend)} ${endText}`

        let subtitle: string | undefined
        let tooltipRowLabel: string
        let titleAnnotation: string | undefined
        if (twoMetric) {
            const startName = ctx.columns[row.startColumn]?.name ?? row.startColumn
            const endName = ctx.columns[row.endColumn]?.name ?? row.endColumn
            subtitle = `${startName} → ${endName}`
            tooltipRowLabel = ""
            titleAnnotation = target !== null ? formatTime(target, grain, locale) : undefined
        } else {
            subtitle =
                row.startTime !== null && row.endTime !== null
                    ? formatTimeRange(row.startTime, row.endTime, grain, locale)
                    : undefined
            tooltipRowLabel = ctx.columns[row.startColumn]?.name ?? ""
            titleAnnotation = undefined
        }

        const tooltipRows: TooltipRow[] = [
            {
                seriesKey: row.key,
                label: tooltipRowLabel,
                swatch: row.colour,
                valueText: rangeText,
                emphasized: true,
                ...(notice !== undefined ? { notice } : {}),
            },
        ]
        targets.push({
            kind: "series",
            seriesKey: row.key,
            shape: { x: plotArea.x, y: band.start, width: plotArea.width, height: band.width },
            tooltip: {
                title: row.label,
                ...(titleAnnotation !== undefined ? { titleAnnotation } : {}),
                ...(subtitle !== undefined ? { subtitle } : {}),
                rows: tooltipRows,
                footers: buildFooters(flags, grain, locale),
            },
        })

        outSeries.push({
            key: row.key,
            label: row.label,
            colour: row.colour,
            entity: row.entity,
            column: row.startColumn,
            points: [row.start, row.end],
        })
    })

    return {
        plotArea,
        nodes,
        series: outSeries,
        hover: { targets },
        legendItems: [],
        greyedLegendKeys: [],
        needsLegendFallback: false,
        empty: false,
        valueDomain: spec.domain,
        diagnostics,
    }
}

/** Endpoint data label ("$24.1B"): the shared label-verbosity formatter. */
function tooltipLabelValue(ctx: LayoutContext, column: string, value: number): string {
    return labelValueText(ctx, column, value, false)
}
