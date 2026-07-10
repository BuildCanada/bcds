/**
 * Marimekko chart layout (spec 19).
 *
 * One vertical column per entity at a single target time. Column WIDTH is
 * proportional to the entity's `x` metric (equal widths when `x` is unbound),
 * with a minimum visible width enforced. Within each column the `y` metrics
 * stack in metric order — this is a stacked-discrete-bar turned on its side,
 * so segment offsets come from the same both-directions stacking helper.
 *
 * Height encodes value: relative mode normalizes each column to 100% (the
 * natural marimekko mode); absolute mode shares one value axis so column
 * heights differ. Entities lacking any `y` value are grouped into a right-edge
 * no-data area when `showNoDataArea`, otherwise excluded and reported. Text
 * nodes never rotate, so entity labels sit horizontally beneath the columns,
 * truncated to the column width and decluttered widest-first.
 */

import { assignColours, createColourState } from "../../color/categoricalAssigner.ts"
import { resolveValue } from "../../data/derived.ts"
import { formatValue } from "../../format/number.ts"
import { formatTime } from "../../format/timeLabels.ts"
import type { HitTarget, Rect, SceneNode, SeriesModel, SeriesPoint, TooltipRow } from "../../scene/nodes.ts"
import { truncateWithEllipsis } from "../../text/truncate.ts"
import type { Diagnostic, ResolvedValue, SortConfig } from "../../types.ts"
import { horizontalValueAxisNodes, prepareValueAxis, verticalValueAxisNodes, PLOT_TOP_PAD, TICK_PADDING } from "../axis.ts"
import type { LayoutContext } from "../context.ts"
import { createValueScale } from "../scales.ts"
import { stackSeriesInBothDirections, type StackedSeries } from "../stacking.ts"
import {
    buildFooters,
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
    metaFor,
    RELATIVE_META,
    type ChartLayer,
    type ChartLayerOptions,
} from "./shared.ts"

const MIN_COL_WIDTH = 4
const COL_GAP = 2
const LABEL_CAP = 20
/** Columns narrower than this get no entity label (nothing legible fits). */
const MIN_LABEL_WIDTH = 22

interface Cell {
    slug: string
    /** Absolute (pre-relative) resolved point; undefined when missing. */
    point?: SeriesPoint
    /** Display value (share within the column in relative mode); 0 when missing. */
    value: number
    /** Absolute pre-relative value (for share-of-column tooltip text). */
    absValue: number
    missing: boolean
}

interface Column {
    entity: string
    cells: Cell[]
    /** Net display total (100 in relative mode). */
    total: number
    /** Absolute pre-relative total (drives share-of-column and absolute height). */
    absTotal: number
    /** Column-width metric value; undefined when `x` is unbound. */
    xValue?: number
    /** Layout weight: the x value (clamped ≥ 0) or 1 when equal-width. */
    weight: number
    partial: boolean
    /** Pixel geometry, assigned during layout. */
    left: number
    pixelWidth: number
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

/**
 * Split `available` px across `weights`, proportional to weight, but never
 * below `minWidth`. Columns that fall below the floor are pinned to it and the
 * rest re-share the remainder (iterated to a fixed point).
 */
function distributeWidths(weights: readonly number[], available: number, minWidth: number): number[] {
    const n = weights.length
    const widths = new Array<number>(n).fill(0)
    if (n === 0 || available <= 0) return widths
    if (n * minWidth >= available) return widths.map(() => available / n)

    const fixed = new Array<boolean>(n).fill(false)
    for (;;) {
        const usedByFixed = widths.reduce((sum, w, i) => (fixed[i] ? sum + w : sum), 0)
        const remaining = available - usedByFixed
        const freeWeight = weights.reduce((sum, w, i) => (fixed[i] ? sum : sum + Math.max(0, w)), 0)
        const freeCount = fixed.reduce((sum, f) => (f ? sum : sum + 1), 0)
        let clampedAny = false
        for (let i = 0; i < n; i++) {
            if (fixed[i]) continue
            const w = freeWeight > 0 ? (Math.max(0, weights[i]) / freeWeight) * remaining : remaining / freeCount
            if (w < minWidth) {
                widths[i] = minWidth
                fixed[i] = true
                clampedAny = true
            }
        }
        if (!clampedAny) {
            for (let i = 0; i < n; i++) {
                if (fixed[i]) continue
                widths[i] = freeWeight > 0 ? (Math.max(0, weights[i]) / freeWeight) * remaining : remaining / freeCount
            }
            return widths
        }
    }
}

export function layoutMarimekko(ctx: LayoutContext, area: Rect, opts: ChartLayerOptions): ChartLayer {
    const { theme, measurer, locale, grain } = ctx
    const scale = opts.fontScale
    const relative = ctx.stackMode === "relative"
    const target = ctx.window?.end ?? null
    const t = strings(locale)

    const diagnostics: Diagnostic[] = []
    const slugs = ctx.definition.y.filter((slug) => ctx.dataset.columns.has(slug))
    if (slugs.length === 0) return emptyLayer(area, diagnostics)

    const xSlug = ctx.definition.x
    const xBound = xSlug !== undefined && ctx.dataset.columns.has(xSlug)

    // Metric → colour (column colour fixed, rest from the palette).
    const fixed = new Map<string, string>()
    for (const slug of slugs) {
        const colour = ctx.columns[slug]?.colour
        if (colour !== undefined) fixed.set(slug, colour)
    }
    const colours = assignColours(createColourState(ctx.theme.palette.categorical), slugs, fixed)
    const labelOf = (slug: string): string => ctx.columns[slug]?.name ?? slug

    // --- Resolve every entity's cells + width -----------------------------------
    const columns: Column[] = []
    const noDataEntities: string[] = []
    for (const entity of ctx.entities) {
        const cells: Cell[] = slugs.map((slug) => {
            const resolved = resolveValue(ctx.dataset, slug, entity, target, ctx.definition.bindings?.[slug])
            const point = toPoint(resolved, target)
            return {
                slug,
                value: point?.value ?? 0,
                absValue: point?.value ?? 0,
                missing: point === undefined,
                ...(point !== undefined ? { point } : {}),
            }
        })
        const presentCells = cells.filter((cell) => !cell.missing)

        let xValue: number | undefined
        if (xBound && xSlug !== undefined) {
            const resolvedX = resolveValue(ctx.dataset, xSlug, entity, target, ctx.definition.bindings?.[xSlug])
            if (resolvedX.status === "value" && Number.isFinite(resolvedX.value)) xValue = resolvedX.value
        }

        if (presentCells.length === 0) {
            // No composition to draw: group into the no-data area or drop it.
            noDataEntities.push(entity)
            continue
        }
        if (xBound && xValue === undefined) {
            diagnostics.push({
                severity: "warning",
                code: "entity-missing-width",
                message: `Entity "${entity}" excluded: the width metric is missing at the target time`,
                context: { entity },
            })
            continue
        }

        const absTotal = presentCells.reduce((sum, cell) => sum + cell.value, 0)
        columns.push({
            entity,
            cells,
            total: absTotal,
            absTotal,
            weight: xBound ? Math.max(0, xValue ?? 0) : 1,
            partial: presentCells.length < cells.length,
            left: 0,
            pixelWidth: 0,
            ...(xValue !== undefined ? { xValue } : {}),
        })
    }

    const showNoData = ctx.definition.showNoDataArea === true && noDataEntities.length > 0
    if (!showNoData && noDataEntities.length > 0) {
        diagnostics.push({
            severity: "warning",
            code: "entities-excluded-no-data",
            message: `${noDataEntities.length} entit${noDataEntities.length === 1 ? "y" : "ies"} excluded: no data for the selected metrics at the target time`,
            context: { entities: noDataEntities.join(", ") },
        })
    }
    if (showNoData) {
        diagnostics.push({
            severity: "warning",
            code: "no-data-area",
            message: `${noDataEntities.length} entit${noDataEntities.length === 1 ? "y" : "ies"} grouped into the no-data area`,
            context: { entities: noDataEntities.join(", ") },
        })
    }

    if (columns.length === 0) return emptyLayer(area, diagnostics)

    // Relative mode: each column normalizes by its own absolute total (spec 19).
    if (relative) {
        for (const col of columns) {
            const absSum = col.cells.reduce((sum, cell) => sum + Math.abs(cell.value), 0)
            for (const cell of col.cells) cell.value = absSum > 0 ? (cell.value / absSum) * 100 : 0
            col.total = col.cells.reduce((sum, cell) => sum + (cell.missing ? 0 : cell.value), 0)
        }
    }

    // --- Sort (default: width descending; also by name / by y-total) -------------
    const sort: SortConfig | undefined = ctx.definition.sort
    const direction = (sort?.order ?? "desc") === "asc" ? 1 : -1
    const widthKey = (col: Column): number => (xBound ? (col.xValue ?? 0) : col.absTotal)
    switch (sort?.by) {
        case "name":
            columns.sort((a, b) => direction * compareStrings(a.entity, b.entity))
            break
        case "column": {
            const slug = sort.column ?? slugs[0]
            const valueOf = (col: Column): number => {
                const cell = col.cells.find((c) => c.slug === slug)
                return cell !== undefined && !cell.missing ? cell.value : Number.NEGATIVE_INFINITY
            }
            columns.sort((a, b) => direction * (valueOf(a) - valueOf(b)))
            break
        }
        case "total":
        case "change":
            columns.sort((a, b) => direction * (a.absTotal - b.absTotal))
            break
        case "custom":
            break
        default:
            // No explicit sort: order by column width (spec 19 default).
            columns.sort((a, b) => direction * (widthKey(a) - widthKey(b)))
            break
    }

    // --- Per-column stack offsets (metric order, both-directions) ----------------
    const stackedInput: StackedSeries[] = slugs.map((slug) => ({
        seriesKey: slug,
        points: columns.map((col, index) => {
            const cell = col.cells.find((c) => c.slug === slug)
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

    // --- Value (height) axis + plot geometry -------------------------------------
    const axisFont = tickFont(scale)
    const labelFont = seriesLabelFont(scale)
    const extents = stacked.flatMap((s) => s.points.map((p) => p.value + p.valueOffset))
    const spec = prepareValueAxis({
        values: relative ? [0, 100] : [0, ...extents],
        markType: "bar",
        scaleType: "linear",
        config: ctx.definition.yAxis,
        pixelLength: Math.max(10, area.height),
        font: axisFont,
        meta: relative ? RELATIVE_META : metaFor(ctx, slugs[0]),
        locale,
        measurer,
    })
    diagnostics.push(...spec.diagnostics)

    const hideTickLabels = ctx.definition.yAxis?.hideTickLabels === true
    const yAxisWidth = hideTickLabels ? 0 : spec.maxLabelWidth + TICK_PADDING

    const labelSample = measurer.measure("Ag", labelFont)
    const labelBandHeight = labelSample.ascent + labelSample.descent + PLOT_TOP_PAD
    const axisSample = measurer.measure("0", axisFont)
    const widthAxisHeight = xBound ? axisSample.ascent + axisSample.descent + PLOT_TOP_PAD + 2 : 0

    const plotArea: Rect = {
        x: area.x + yAxisWidth,
        y: area.y + PLOT_TOP_PAD,
        width: Math.max(10, area.width - yAxisWidth),
        height: Math.max(10, area.height - PLOT_TOP_PAD - labelBandHeight - widthAxisHeight),
    }

    const yScale = createValueScale("linear", spec.domain, [plotArea.y + plotArea.height, plotArea.y])
    const nodes: SceneNode[] = verticalValueAxisNodes(spec, yScale, plotArea, Math.max(0, area.y), {
        theme,
        font: axisFont,
        hideGridlines: ctx.definition.yAxis?.hideGridlines,
        hideTickLabels,
    })

    // --- Column pixel widths ------------------------------------------------------
    const nColumns = columns.length
    const noDataWidth = showNoData ? Math.min(Math.max(plotArea.width * 0.1, MIN_COL_WIDTH), 60) : 0
    const gapCount = nColumns - 1 + (showNoData ? 1 : 0)
    const availableForColumns = Math.max(MIN_COL_WIDTH * nColumns, plotArea.width - noDataWidth - gapCount * COL_GAP)
    const widths = distributeWidths(
        columns.map((col) => col.weight),
        availableForColumns,
        MIN_COL_WIDTH,
    )
    let cursor = plotArea.x
    columns.forEach((col, index) => {
        col.left = cursor
        col.pixelWidth = widths[index]
        cursor += col.pixelWidth + COL_GAP
    })

    // --- Cumulative width axis (x-unit ticks), only when width-bound -------------
    if (xBound && xSlug !== undefined) {
        const totalX = columns.reduce((sum, col) => sum + Math.max(0, col.xValue ?? 0), 0)
        const widthSpec = prepareValueAxis({
            values: [0, totalX],
            markType: "bar",
            scaleType: "linear",
            pixelLength: plotArea.width,
            font: axisFont,
            meta: metaFor(ctx, xSlug),
            locale,
            measurer,
        })
        const widthScale = createValueScale("linear", widthSpec.domain, [plotArea.x, plotArea.x + plotArea.width])
        const widthAxisPlot: Rect = {
            x: plotArea.x,
            y: plotArea.y,
            width: plotArea.width,
            height: plotArea.height + labelBandHeight,
        }
        nodes.push(
            ...horizontalValueAxisNodes(widthSpec, widthScale, widthAxisPlot, area, {
                theme,
                font: axisFont,
                hideGridlines: true,
            }),
        )
    }

    // --- Segments + hover ---------------------------------------------------------
    const targets: HitTarget[] = []

    const tooltipRowsFor = (col: Column, emphasizedSlug: string): TooltipRow[] =>
        col.cells.map((cell) => {
            if (cell.missing || cell.point === undefined) {
                return missingRow(cell.slug, labelOf(cell.slug), colours.get(cell.slug) ?? theme.palette.noData, locale)
            }
            const absText = tooltipValueText(ctx, cell.slug, cell.absValue, false)
            const share = col.absTotal !== 0 ? (cell.absValue / col.absTotal) * 100 : 0
            const shareText = formatValue(share, RELATIVE_META, { locale, verbosity: "long" })
            const notice = noticeFor(cell.point, target)
            return {
                seriesKey: cell.slug,
                label: labelOf(cell.slug),
                swatch: colours.get(cell.slug) ?? theme.palette.noData,
                valueText: `${absText} (${shareText})`,
                emphasized: cell.slug === emphasizedSlug,
                ...(notice !== undefined ? { notice } : {}),
            }
        })

    columns.forEach((col, colIndex) => {
        for (const series of stacked) {
            const point = series.points[colIndex]
            if (point.missing === true || point.value === 0) continue
            const y1 = yScale.place(point.valueOffset)
            const y2 = yScale.place(point.value + point.valueOffset)
            const cell = col.cells.find((c) => c.slug === series.seriesKey)
            const segmentRect: Rect = {
                x: col.left,
                y: Math.min(y1, y2),
                width: Math.max(col.pixelWidth, 0.5),
                height: Math.max(Math.abs(y2 - y1), 0.5),
            }
            nodes.push({
                key: `series/${col.entity}/${series.seriesKey}/seg`,
                seriesKey: series.seriesKey,
                role: "mark",
                kind: "rect",
                rect: segmentRect,
                style: {
                    fill: colours.get(series.seriesKey) ?? theme.palette.noData,
                    ...(cell?.point?.projected === true ? { patternId: "projection", opacity: 0.85 } : {}),
                },
            })

            // Hover: one target per segment, entity-titled.
            const flags = collectFooterFlags()
            for (const c of col.cells) noteFooterFlags(flags, c.point, target)
            const widthSubtitle =
                xBound && xSlug !== undefined && col.xValue !== undefined
                    ? `${labelOf(xSlug)}: ${tooltipValueText(ctx, xSlug, col.xValue, false)}`
                    : undefined
            targets.push({
                kind: "series",
                seriesKey: series.seriesKey,
                shape: segmentRect,
                tooltip: {
                    title: col.entity,
                    ...(target !== null ? { titleAnnotation: formatTime(target, grain, locale) } : {}),
                    ...(widthSubtitle !== undefined ? { subtitle: widthSubtitle } : {}),
                    rows: tooltipRowsFor(col, series.seriesKey),
                    footers: buildFooters(flags, grain, locale),
                },
            })
        }
    })

    // --- No-data area at the right edge ------------------------------------------
    if (showNoData) {
        const noDataLeft = cursor
        const areaRect: Rect = {
            x: noDataLeft,
            y: plotArea.y,
            width: Math.max(noDataWidth, 0.5),
            height: plotArea.height,
        }
        nodes.push({
            key: "nodata/area",
            role: "mark",
            kind: "rect",
            rect: areaRect,
            style: { fill: theme.palette.noData, opacity: 0.5 },
        })
        const noDataLabel = truncateWithEllipsis(t.noData, labelFont, Math.max(10, noDataWidth), measurer)
        if (noDataLabel !== "" && noDataLabel !== "…") {
            const metrics = measurer.measure(noDataLabel, labelFont)
            nodes.push(
                textNode({
                    key: "nodata/label",
                    role: "label",
                    text: noDataLabel,
                    font: labelFont,
                    anchor: "middle",
                    x: noDataLeft + noDataWidth / 2,
                    baselineY: plotArea.y + plotArea.height + PLOT_TOP_PAD + metrics.ascent,
                    colour: theme.chrome.tickLabel,
                    measurer,
                }),
            )
        }
        targets.push({
            kind: "series",
            seriesKey: "nodata",
            shape: areaRect,
            tooltip: {
                title: t.noData,
                rows: noDataEntities.map((entity) => ({
                    seriesKey: entity,
                    label: entity,
                    swatch: theme.palette.noData,
                    valueText: t.noData,
                    emphasized: false,
                    notice: "missing" as const,
                })),
                footers: [],
            },
        })
    }

    // --- Entity labels beneath columns, decluttered widest-first -----------------
    const labelBaseline = plotArea.y + plotArea.height + PLOT_TOP_PAD + labelSample.ascent
    const placed: { left: number; right: number }[] = []
    const byPriority = columns.map((col, index) => ({ col, index })).sort((a, b) => b.col.pixelWidth - a.col.pixelWidth)
    for (const { col } of byPriority) {
        if (placed.length >= LABEL_CAP) break
        if (col.pixelWidth < MIN_LABEL_WIDTH) continue
        const text = truncateWithEllipsis(col.entity, labelFont, col.pixelWidth, measurer)
        if (text === "" || text === "…") continue
        const metrics = measurer.measure(text, labelFont)
        const centerX = col.left + col.pixelWidth / 2
        const left = centerX - metrics.width / 2
        const right = centerX + metrics.width / 2
        const collides = placed.some((p) => left - 2 < p.right && right + 2 > p.left)
        if (collides) continue
        placed.push({ left, right })
        nodes.push(
            textNode({
                key: `label/${col.entity}`,
                role: "label",
                text,
                font: labelFont,
                anchor: "middle",
                x: centerX,
                baselineY: labelBaseline,
                colour: theme.chrome.tickLabel,
                measurer,
            }),
        )
    }

    // --- Series models (one per metric, points in column order) ------------------
    const zeroThroughout = new Set<string>()
    const outSeries: SeriesModel[] = stacked.map((series) => {
        const anyNonZero = series.points.some((p) => p.missing !== true && p.value !== 0)
        if (!anyNonZero) zeroThroughout.add(series.seriesKey)
        return {
            key: series.seriesKey,
            label: labelOf(series.seriesKey),
            colour: colours.get(series.seriesKey) ?? theme.palette.noData,
            column: series.seriesKey,
            points: series.points.map((p, index) => {
                const col = columns[index]
                const cell = col?.cells.find((c) => c.slug === series.seriesKey)
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
        greyedLegendKeys: [...zeroThroughout],
        needsLegendFallback: false,
        empty: false,
        valueDomain: spec.domain,
        diagnostics,
    }
}
