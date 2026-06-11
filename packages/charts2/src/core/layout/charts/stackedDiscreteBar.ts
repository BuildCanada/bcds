/**
 * Stacked discrete bar chart layout (spec 16).
 *
 * One horizontal stacked bar per entity at a single target time; segments in
 * metric order (series strategy is always metric). Entities missing ALL
 * metrics are excluded; partial entities render partial stacks with the
 * gaps flagged in the tooltip. Negative segments extend left of zero with
 * offsets independent of the positives (OWID contract: the first negative
 * segment has valueOffset 0). Relative mode normalizes each bar by its
 * absolute total; the total label hides.
 */

import { assignColours, createColourState } from "../../color/categoricalAssigner.ts"
import { resolveValue } from "../../data/derived.ts"
import { formatValue } from "../../format/number.ts"
import { formatTime } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, SeriesPoint, TooltipRow } from "../../scene/nodes.ts"
import { truncateWithEllipsis } from "../../text/truncate.ts"
import type { Diagnostic, ResolvedValue, SortConfig } from "../../types.ts"
import { horizontalValueAxisNodes, prepareValueAxis, PLOT_TOP_PAD } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { bandPositions, createValueScale } from "../scales.ts"
import { stackSeriesInBothDirections, type StackedSeries } from "../stacking.ts"
import {
    buildFooters,
    centeredBaseline,
    collectFooterFlags,
    compareStrings,
    emptyLayer,
    missingRow,
    noteFooterFlags,
    noticeFor,
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

const BAR_HEIGHT_FLOOR = 3
const BAR_HEIGHT_MAX = 36
const DEFAULT_SORT: SortConfig = { by: "total", order: "desc" }

interface Cell {
    slug: string
    /** Absolute (pre-relative) resolved point; undefined when missing. */
    point?: SeriesPoint
    /** Display value (share in relative mode); 0 when missing. */
    value: number
    missing: boolean
}

interface EntityBar {
    entity: string
    cells: Cell[]
    /** Net display total. */
    total: number
    /** Net absolute total. */
    absTotal: number
    partial: boolean
}

function toPoint(resolved: ResolvedValue, time: number | null): SeriesPoint | undefined {
    if (resolved.status !== "value" || !Number.isFinite(resolved.value)) return undefined
    return {
        time,
        value: resolved.value,
        sourceTime: resolved.sourceTime,
        ...(resolved.projected ? { projected: true } : {}),
        ...(resolved.interpolated ? { interpolated: true } : {}),
    }
}

export function layoutStackedDiscreteBar(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale
    const relative = ctx.stackMode === "relative"
    const target = ctx.window?.end ?? null

    const diagnostics: Diagnostic[] = []
    const slugs = ctx.definition.y.filter((slug) => ctx.dataset.columns.has(slug))
    if (slugs.length === 0) return emptyLayer(area, diagnostics)

    // Metric → colour (column colour fixed, rest from the palette).
    const fixed = new Map<string, string>()
    for (const slug of slugs) {
        const colour = ctx.columns[slug]?.colour
        if (colour !== undefined) fixed.set(slug, colour)
    }
    const colours = assignColours(createColourState(ctx.theme.palette.categorical), slugs, fixed)
    const labelOf = (slug: string): string => ctx.columns[slug]?.name ?? slug

    // --- Resolve every (entity × metric) cell -----------------------------------
    let bars: EntityBar[] = []
    for (const entity of ctx.entities) {
        const cells: Cell[] = slugs.map((slug) => {
            const resolved = resolveValue(ctx.dataset, slug, entity, target, ctx.definition.bindings?.[slug])
            const point = toPoint(resolved, target)
            return { slug, value: point?.value ?? 0, missing: point === undefined, ...(point !== undefined ? { point } : {}) }
        })
        const presentCells = cells.filter((cell) => !cell.missing)
        if (presentCells.length === 0) continue // missing ALL metrics → excluded
        if (ctx.definition.missingData === "hide" && presentCells.length < cells.length) {
            diagnostics.push({
                severity: "warning",
                code: "entity-hidden-missing-data",
                message: `Entity "${entity}" hidden: it is missing some metrics at the target time (missingData: hide)`,
                context: { entity },
            })
            continue
        }
        const absTotal = presentCells.reduce((sum, cell) => sum + cell.value, 0)
        bars.push({ entity, cells, total: absTotal, absTotal, partial: presentCells.length < cells.length })
    }
    if (bars.length === 0) return emptyLayer(area, diagnostics)

    // Relative mode: each bar normalizes by its absolute total (spec 16).
    if (relative) {
        for (const bar of bars) {
            const absSum = bar.cells.reduce((sum, cell) => sum + Math.abs(cell.value), 0)
            for (const cell of bar.cells) cell.value = absSum > 0 ? (cell.value / absSum) * 100 : 0
            bar.total = bar.cells.reduce((sum, cell) => sum + (cell.missing ? 0 : cell.value), 0)
        }
    }

    // --- Sort ---------------------------------------------------------------------
    const sort = ctx.definition.sort ?? DEFAULT_SORT
    const direction = sort.order === "asc" ? 1 : -1
    switch (sort.by) {
        case "name":
            bars.sort((a, b) => direction * compareStrings(a.entity, b.entity))
            break
        case "column": {
            const slug = sort.column ?? slugs[0]
            const valueOf = (bar: EntityBar): number => {
                const cell = bar.cells.find((c) => c.slug === slug)
                return cell !== undefined && !cell.missing ? cell.value : Number.NEGATIVE_INFINITY
            }
            bars.sort((a, b) => direction * (valueOf(a) - valueOf(b)))
            break
        }
        case "custom":
            break
        case "total":
        case "change":
        default:
            bars.sort((a, b) => direction * (a.total - b.total))
            break
    }

    // --- Stack offsets (OWID both-directions contract) ----------------------------
    const stackedInput: StackedSeries[] = slugs.map((slug) => ({
        seriesKey: slug,
        points: bars.map((bar, index) => {
            const cell = bar.cells.find((c) => c.slug === slug)
            return {
                position: index,
                time: target ?? 0,
                value: cell !== undefined && !cell.missing ? cell.value : 0,
                valueOffset: 0,
                missing: cell === undefined || cell.missing,
            }
        }),
    }))
    const stacked = stackSeriesInBothDirections(stackedInput)

    // --- Geometry --------------------------------------------------------------------
    const labelFont = seriesLabelFont(scale)
    const valueFont = valueLabelFont(scale)
    const labelMaxWidth = Math.min(
        Math.max(...bars.map((bar) => measurer.measure(bar.entity, labelFont).width)),
        area.width * 0.3,
    )
    const labelColWidth = labelMaxWidth + 6

    const showTotals = !ctx.definition.hideTotalLabel && !relative
    const totalTexts = new Map<string, string>()
    let rightReserve = 0
    if (showTotals) {
        for (const bar of bars) {
            const text = formatValue(bar.total, metaFor(ctx, slugs[0]), { locale, verbosity: "label" })
            totalTexts.set(bar.entity, text)
            rightReserve = Math.max(rightReserve, measurer.measure(text, valueFont).width + 6)
        }
    }

    const axisFont = tickFont(scale)
    const sample = measurer.measure("0", axisFont)
    const axisHeight = sample.ascent + sample.descent + PLOT_TOP_PAD + 2

    const plotArea: Rect = {
        x: area.x + labelColWidth,
        y: area.y + 4,
        width: Math.max(10, area.width - labelColWidth - rightReserve),
        height: Math.max(10, area.height - 4 - axisHeight),
    }

    const extents = stacked.flatMap((s) => s.points.map((p) => p.value + p.valueOffset))
    const spec = prepareValueAxis({
        values: [0, ...extents],
        markType: "bar",
        scaleType: "linear",
        config: ctx.definition.xAxis,
        pixelLength: plotArea.width,
        font: axisFont,
        meta: relative ? RELATIVE_META : metaFor(ctx, slugs[0]),
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

    // --- Rows ----------------------------------------------------------------------------
    const rows = bandPositions(bars.length, [plotArea.y, plotArea.y + plotArea.height], 1)
    const barHeight = Math.min(Math.max((rows[0]?.width ?? plotArea.height) * 0.7, BAR_HEIGHT_FLOOR), BAR_HEIGHT_MAX)
    const targets: HitTarget[] = []
    const t = strings(locale)

    const tooltipRowsFor = (bar: EntityBar, emphasizedSlug: string): TooltipRow[] =>
        bar.cells.map((cell) => {
            if (cell.missing || cell.point === undefined) {
                return missingRow(cell.slug, labelOf(cell.slug), colours.get(cell.slug) ?? theme.palette.noData, locale)
            }
            const absText = tooltipValueText(ctx, cell.slug, cell.point.value, false)
            const notice = noticeFor(cell.point, target)
            return {
                seriesKey: cell.slug,
                label: labelOf(cell.slug),
                swatch: colours.get(cell.slug) ?? theme.palette.noData,
                valueText: relative
                    ? `${formatValue(cell.value, RELATIVE_META, { locale, verbosity: "long" })} (${absText})`
                    : absText,
                emphasized: cell.slug === emphasizedSlug,
                ...(notice !== undefined ? { notice } : {}),
            }
        })

    bars.forEach((bar, barIndex) => {
        const row = rows[barIndex]
        const barTop = row.center - barHeight / 2

        // Entity label.
        const rowLabel = truncateWithEllipsis(bar.entity, labelFont, Math.max(10, labelMaxWidth), measurer)
        const rowLabelMetrics = measurer.measure(rowLabel, labelFont)
        nodes.push(
            textNode({
                key: `label/${bar.entity}`,
                role: "label",
                text: rowLabel,
                font: labelFont,
                anchor: "end",
                x: area.x + labelColWidth - 6,
                baselineY: centeredBaseline(row.center, rowLabelMetrics),
                colour: theme.chrome.tickLabel,
                measurer,
            }),
        )

        // Segments in metric order.
        let positiveExtent = 0
        for (const series of stacked) {
            const point = series.points[barIndex]
            if (point.missing === true || point.value === 0) continue
            const x1 = xScale.place(point.valueOffset)
            const x2 = xScale.place(point.value + point.valueOffset)
            if (point.value > 0) positiveExtent = Math.max(positiveExtent, point.value + point.valueOffset)
            const cell = bar.cells.find((c) => c.slug === series.seriesKey)
            const segmentRect: Rect = {
                x: Math.min(x1, x2),
                y: barTop,
                width: Math.max(Math.abs(x2 - x1), 0.5),
                height: barHeight,
            }
            nodes.push({
                key: `series/${series.seriesKey}/bar/${bar.entity}`,
                seriesKey: series.seriesKey,
                role: "mark",
                kind: "rect",
                rect: segmentRect,
                style: {
                    fill: colours.get(series.seriesKey) ?? theme.palette.noData,
                    ...(cell?.point?.projected === true ? { patternId: "projection", opacity: 0.85 } : {}),
                },
            })

            // Hover: one target per segment.
            const flags = collectFooterFlags()
            for (const c of bar.cells) noteFooterFlags(flags, c.point, target)
            targets.push({
                kind: "series",
                seriesKey: series.seriesKey,
                shape: segmentRect,
                tooltip: {
                    title: bar.entity,
                    ...(target !== null ? { titleAnnotation: formatTime(target, grain, locale) } : {}),
                    rows: tooltipRowsFor(bar, series.seriesKey),
                    ...(bar.cells.filter((c) => !c.missing).length >= 2 && !relative
                        ? {
                              totalRow: {
                                  seriesKey: "total",
                                  label: t.total,
                                  swatch: theme.chrome.axisLine,
                                  valueText: tooltipValueText(ctx, slugs[0], bar.total, false),
                                  emphasized: true,
                              },
                          }
                        : {}),
                    footers: buildFooters(flags, grain, locale),
                },
            })
        }

        // Total label beyond the positive extent (spec 16 mixed-sign rule).
        if (showTotals) {
            const text = totalTexts.get(bar.entity) ?? ""
            const metrics = measurer.measure(text, valueFont)
            nodes.push(
                textNode({
                    key: `value/${bar.entity}/total`,
                    role: "label",
                    text,
                    font: valueFont,
                    anchor: "start",
                    x: xScale.place(Math.max(positiveExtent, 0)) + 4,
                    baselineY: centeredBaseline(row.center, metrics),
                    colour: theme.chrome.tickLabel,
                    measurer,
                }),
            )
        }
    })

    // --- Series models (one per metric, points in sorted-entity order) -----------
    const outSeries: SeriesModel[] = stacked.map((series) => {
        const colour = colours.get(series.seriesKey) ?? theme.palette.noData
        return {
            key: series.seriesKey,
            label: labelOf(series.seriesKey),
            colour,
            column: series.seriesKey,
            points: series.points
                .filter((p) => p.missing !== true)
                .map((p) => {
                    const bar = bars[series.points.indexOf(p)]
                    const cell = bar?.cells.find((c) => c.slug === series.seriesKey)
                    return {
                        time: target,
                        value: p.value,
                        valueOffset: p.valueOffset,
                        ...(cell?.point?.sourceTime !== undefined ? { sourceTime: cell.point.sourceTime } : {}),
                        ...(cell?.point?.projected === true ? { projected: true } : {}),
                    }
                }),
        }
    })

    return {
        plotArea,
        nodes,
        series: outSeries,
        hover: { targets },
        legendItems: slugs.map((slug) => ({
            seriesKey: slug,
            label: labelOf(slug),
            swatch: colours.get(slug) ?? theme.palette.noData,
        })),
        greyedLegendKeys: [],
        needsLegendFallback: false,
        empty: false,
        diagnostics,
    }
}
