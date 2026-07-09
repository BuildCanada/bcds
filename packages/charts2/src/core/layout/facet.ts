/**
 * Faceting — small multiples (spec 09).
 *
 * Splits one chart into a grid of panels: one per entity (each panel shows all
 * metrics) or one per metric (each shows all entities). Panels share a common
 * value domain by default so they read on the same scale, and colours stay
 * consistent across panels (same series → same colour everywhere), driven by
 * the deterministic series-colour assignment the chart layers already do. A
 * single shared legend sits above the grid when panels carry more than one
 * series; a single-series facet (e.g. one metric per entity) needs none — the
 * panel title is the identity.
 *
 * Two passes: pass 1 lays every panel out independently to collect the union
 * value domain and the legend set; pass 2 re-lays them with that domain pinned
 * into the value-axis config, so gridlines align across the grid.
 *
 * Deferred (documented, spec 09 §3/§4/§6): the reader-togglable independent-
 * axis mode, leftmost-column / bottom-row tick-label thinning, monochrome
 * single-metric entity facets, and faceted maps.
 */

import type { HoverModel, LegendItem, Rect, SceneNode, SeriesModel } from "../scene/nodes.ts"
import type { TextMeasurer } from "../text/measurer.ts"
import { truncateWithEllipsis } from "../text/truncate.ts"
import type { Theme } from "../theme/types.ts"
import type { AxisConfig, ChartDefinition, ChartType, Diagnostic } from "../types.ts"
import { legendFont, seriesLabelFont, textNode, type ChartLayer, type ChartLayerOptions } from "./charts/shared.ts"
import type { LayoutContext } from "./context.ts"
import { layoutLegend } from "./legend.ts"

export const MAX_FACET_PANELS = 16
const PANEL_GAP = 16
const TITLE_GAP = 4

type ChartLayoutFn = (ctx: LayoutContext, area: Rect, opts: ChartLayerOptions) => ChartLayer

interface PanelDescriptor {
    key: string
    title: string
    entities: string[]
    y: string[]
}

export interface FacetInput {
    ctx: LayoutContext
    chartType: ChartType
    run: ChartLayoutFn
    area: Rect
    theme: Theme
    measurer: TextMeasurer
    fontScale: number
}

export interface FacetResult {
    nodes: SceneNode[]
    series: SeriesModel[]
    hover: HoverModel
    legend: LegendItem[] | null
    plotArea: Rect
    diagnostics: Diagnostic[]
    /** Every panel was empty — the caller renders the no-data panel instead. */
    empty: boolean
}

function panelsFor(ctx: LayoutContext): PanelDescriptor[] {
    if (ctx.definition.facet === "entity") {
        return ctx.entities.map((entity) => ({ key: entity, title: entity, entities: [entity], y: ctx.definition.y }))
    }
    if (ctx.definition.facet === "metric") {
        return ctx.definition.y.map((slug) => ({
            key: slug,
            title: ctx.columns[slug]?.name ?? slug,
            entities: ctx.entities,
            y: [slug],
        }))
    }
    return []
}

/** Balance columns/rows to the frame's aspect ratio, filling left-to-right. */
function gridDimensions(count: number, area: Rect): { cols: number; rows: number } {
    const aspect = area.height > 0 ? area.width / area.height : 1
    let cols = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * Math.max(aspect, 0.1)))))
    const rows = Math.ceil(count / cols)
    cols = Math.ceil(count / rows) // tighten so the last row has no empty leading column
    return { cols, rows }
}

/** The value axis is horizontal for the discrete-bar family, vertical elsewhere. */
function valueAxisKey(chartType: ChartType): "xAxis" | "yAxis" {
    return chartType === "discrete-bar" || chartType === "stacked-discrete-bar" ? "xAxis" : "yAxis"
}

function panelContext(
    base: LayoutContext,
    panel: PanelDescriptor,
    sharedDomain: { min: number; max: number } | null,
    axisKey: "xAxis" | "yAxis",
): LayoutContext {
    const definition: ChartDefinition = {
        ...base.definition,
        y: panel.y,
        facet: "none",
        hideLegend: true,
        hideSeriesLabels: true,
    }
    if (sharedDomain !== null) {
        const merged: AxisConfig = { ...(base.definition[axisKey] ?? {}), min: sharedDomain.min, max: sharedDomain.max }
        definition[axisKey] = merged
    }
    return { ...base, definition, entities: panel.entities }
}

/** Rewrite node keys under a stable panel prefix; seriesKey is left intact so
 *  hover emphasis and the shared legend key the same series across every panel. */
function prefixKeys(nodes: readonly SceneNode[], prefix: string): SceneNode[] {
    return nodes.map((node) =>
        node.kind === "group"
            ? { ...node, key: `${prefix}/${node.key}`, children: prefixKeys(node.children, prefix) }
            : { ...node, key: `${prefix}/${node.key}` },
    )
}

/**
 * Lay a faceted chart out, or return null when the strategy yields fewer than
 * two panels (the caller then renders a single, unfaceted chart).
 */
export function layoutFacetedChart(input: FacetInput): FacetResult | null {
    const { ctx, chartType, run, area, theme, measurer, fontScale } = input
    let panels = panelsFor(ctx)
    if (panels.length < 2) return null

    const diagnostics: Diagnostic[] = []
    if (panels.length > MAX_FACET_PANELS) {
        diagnostics.push({
            severity: "warning",
            code: "facet-panel-cap",
            message: `Faceting shows the first ${MAX_FACET_PANELS} of ${panels.length} panels; narrow the selection to see the rest`,
            context: { shown: MAX_FACET_PANELS, total: panels.length },
        })
        panels = panels.slice(0, MAX_FACET_PANELS)
    }

    const axisKey = valueAxisKey(chartType)
    const panelOpts: ChartLayerOptions = { legendReserved: true, thumbnail: false, fontScale }

    // --- Pass 1: independent layout to collect the union domain + legend --------
    const probeCell: Rect = { x: 0, y: 0, width: Math.max(10, area.width), height: Math.max(10, area.height) }
    let domainMin = Number.POSITIVE_INFINITY
    let domainMax = Number.NEGATIVE_INFINITY
    let haveDomain = true
    const legendItems: LegendItem[] = []
    const seenLegend = new Set<string>()
    for (const panel of panels) {
        const probe = run(panelContext(ctx, panel, null, axisKey), probeCell, panelOpts)
        if (probe.valueDomain !== undefined) {
            domainMin = Math.min(domainMin, probe.valueDomain[0])
            domainMax = Math.max(domainMax, probe.valueDomain[1])
        } else {
            haveDomain = false
        }
        for (const item of probe.legendItems) {
            if (!seenLegend.has(item.seriesKey)) {
                seenLegend.add(item.seriesKey)
                legendItems.push(item)
            }
        }
    }
    const sharedDomain =
        haveDomain && Number.isFinite(domainMin) && Number.isFinite(domainMax) && domainMin !== domainMax
            ? { min: domainMin, max: domainMax }
            : null

    // --- Shared legend above the grid -------------------------------------------
    const nodes: SceneNode[] = []
    let legendModelItems: LegendItem[] | null = null
    let gridTop = area.y
    if (legendItems.length > 1) {
        const legend = layoutLegend({
            items: legendItems,
            x: area.x,
            y: area.y,
            width: area.width,
            theme,
            measurer,
            font: legendFont(fontScale),
        })
        nodes.push(...legend.nodes)
        legendModelItems = legend.items
        gridTop = area.y + legend.height
    }

    const gridArea: Rect = {
        x: area.x,
        y: gridTop,
        width: area.width,
        height: Math.max(10, area.height - (gridTop - area.y)),
    }
    const { cols, rows } = gridDimensions(panels.length, gridArea)
    const cellW = Math.max(10, (gridArea.width - PANEL_GAP * (cols - 1)) / cols)
    const cellH = Math.max(10, (gridArea.height - PANEL_GAP * (rows - 1)) / rows)

    const titleFont = seriesLabelFont(fontScale)
    const titleSample = measurer.measure("Ag", titleFont)
    const titleHeight = titleSample.ascent + titleSample.descent + TITLE_GAP

    // --- Pass 2: final panels ----------------------------------------------------
    const hoverTargets: HoverModel["targets"] = []
    const series: SeriesModel[] = []
    const seenSeries = new Set<string>()
    let anyContent = false

    panels.forEach((panel, index) => {
        const col = index % cols
        const rowIndex = Math.floor(index / cols)
        const cellX = gridArea.x + col * (cellW + PANEL_GAP)
        const cellY = gridArea.y + rowIndex * (cellH + PANEL_GAP)

        const titleText = truncateWithEllipsis(panel.title, titleFont, cellW, measurer)
        const titleMetrics = measurer.measure(titleText, titleFont)
        nodes.push(
            textNode({
                key: `facet/${index}/title`,
                role: "label",
                text: titleText,
                font: titleFont,
                anchor: "start",
                x: cellX,
                baselineY: cellY + titleMetrics.ascent,
                colour: theme.chrome.title,
                measurer,
            }),
        )

        const panelArea: Rect = {
            x: cellX,
            y: cellY + titleHeight,
            width: cellW,
            height: Math.max(10, cellH - titleHeight),
        }
        const layer = run(panelContext(ctx, panel, sharedDomain, axisKey), panelArea, panelOpts)
        if (layer.empty) return
        anyContent = true
        nodes.push(...prefixKeys(layer.nodes, `facet/${index}`))
        hoverTargets.push(...layer.hover.targets)
        for (const s of layer.series) {
            if (!seenSeries.has(s.key)) {
                seenSeries.add(s.key)
                series.push(s)
            }
        }
    })

    if (!anyContent) {
        return { nodes: [], series: [], hover: { targets: [] }, legend: null, plotArea: gridArea, diagnostics, empty: true }
    }

    return {
        nodes,
        series,
        hover: { targets: hoverTargets },
        legend: legendModelItems,
        plotArea: gridArea,
        diagnostics,
        empty: false,
    }
}
