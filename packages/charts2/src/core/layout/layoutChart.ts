/**
 * layoutChart — THE layout entry point (spec 28 architecture).
 *
 * (definition, dataset, view, theme, size, measurer) → ChartScene.
 * Orchestrates: buildContext → chooseType → chrome → legend → axes + chart
 * layout → assembly. Every coordinate passes through round2; node keys are
 * stable (derived from region/series/value, never bare array indices over
 * data); diagnostics aggregate from every stage. An empty selection or a
 * window with no data yields a "No data for the current selection" scene
 * (spec 07 §4) — never a throw.
 */

import type { ChartScene, HitTarget, HoverModel, Rect, SceneNode, Vec2 } from "../scene/nodes.ts"
import { round2 } from "../scene/nodes.ts"
import { defaultMeasurer } from "../text/createMeasurer.ts"
import type { TextMeasurer } from "../text/measurer.ts"
import { getTheme } from "../theme/registry.ts"
import type { Theme } from "../theme/types.ts"
import { truncateWithEllipsis } from "../text/truncate.ts"
import type { ChartDefinition, ChartType, Dataset, Diagnostic, ViewState } from "../types.ts"
import { layoutDiscreteBar } from "./charts/discreteBar.ts"
import { layoutLineChart } from "./charts/line.ts"
import { layoutStackedArea } from "./charts/stackedArea.ts"
import { layoutStackedBar } from "./charts/stackedBar.ts"
import { layoutStackedDiscreteBar } from "./charts/stackedDiscreteBar.ts"
import {
    centeredBaseline,
    fontScaleFor,
    legendFont,
    noDataFont,
    strings,
    textNode,
    type ChartLayer,
    type ChartLayerOptions,
} from "./charts/shared.ts"
import { activeChartType } from "./chooseType.ts"
import { layoutChrome, type ChromeMode } from "./chrome.ts"
import { buildContext, type LayoutContext } from "./context.ts"
import { layoutFacetedChart } from "./facet.ts"
import { layoutLegend, type LegendLayout } from "./legend.ts"

export interface LayoutChartOptions {
    definition: ChartDefinition
    dataset: Dataset
    view?: ViewState
    /** Defaults to the registry lookup of definition.theme. */
    theme?: Theme
    size: { width: number; height: number }
    /** Defaults to the committed brand metrics measurer. */
    measurer?: TextMeasurer
    chrome?: ChromeMode
}

type ChartLayoutFn = (ctx: LayoutContext, area: Rect, opts: ChartLayerOptions) => ChartLayer

const CHART_LAYOUTS: Record<ChartType, ChartLayoutFn> = {
    line: layoutLineChart,
    "discrete-bar": layoutDiscreteBar,
    "stacked-area": layoutStackedArea,
    "stacked-bar": layoutStackedBar,
    "stacked-discrete-bar": layoutStackedDiscreteBar,
}

/** Spec 05 §1: when a legend is planned before the chart is laid out. */
function legendPlanned(chartType: ChartType, definition: ChartDefinition, mode: ChromeMode): boolean {
    if (definition.hideLegend || mode === "thumbnail" || mode === "none") return false
    if (chartType === "stacked-bar" || chartType === "stacked-discrete-bar") return true
    if (definition.hideSeriesLabels && (chartType === "line" || chartType === "stacked-area")) return true
    return false
}

export function layoutChart(options: LayoutChartOptions): ChartScene {
    const { definition, dataset, view, size } = options
    const theme = options.theme ?? getTheme(definition.theme).theme
    const measurer = options.measurer ?? defaultMeasurer
    const mode: ChromeMode = options.chrome ?? "full"
    const fontScale = fontScaleFor(size.width)

    const ctx = buildContext({ definition, dataset, view, theme, measurer })
    const diagnostics: Diagnostic[] = [...ctx.diagnostics]
    if (options.theme === undefined) {
        const lookup = getTheme(definition.theme)
        if (lookup.warning !== undefined) {
            diagnostics.push({ severity: "warning", code: "unknown-theme", message: lookup.warning })
        }
    }

    const chartType = activeChartType(ctx.definition.types, view, ctx.collapsed, ctx.definition.defaultTab)

    // Comparison lines render on the continuous-axis charts only (spec 02 §2);
    // flag the request on any other type rather than silently dropping it.
    if (
        ctx.definition.comparisonLines !== undefined &&
        ctx.definition.comparisonLines.length > 0 &&
        chartType !== "line" &&
        chartType !== "stacked-area"
    ) {
        diagnostics.push({
            severity: "warning",
            code: "comparison-lines-unsupported",
            message: `Comparison lines are not yet rendered for ${chartType} charts`,
            context: { chartType },
        })
    }

    const chrome = layoutChrome({
        definition: ctx.definition,
        manifest: dataset.manifest,
        theme,
        locale: ctx.locale,
        measurer,
        size,
        mode,
        fontScale,
        window: ctx.window,
        grain: ctx.grain,
        entities: ctx.entities,
        relative: ctx.stackMode === "relative",
    })

    // --- No data before chart layout: empty selection / empty window ----------
    const noTimes = ctx.grain !== "none" && ctx.times.length === 0
    if (ctx.entities.length === 0 || noTimes) {
        return noDataScene(ctx, size, theme, chrome.nodes, chrome.contentArea, fontScale, diagnostics)
    }

    // --- Faceting: a grid of small multiples replaces the single chart --------
    if (mode === "full" && ctx.definition.facet !== "none") {
        const facet = layoutFacetedChart({
            ctx,
            chartType,
            run: CHART_LAYOUTS[chartType],
            area: chrome.contentArea,
            theme,
            measurer,
            fontScale,
        })
        // null → fewer than two panels; fall through to the single chart.
        if (facet !== null) {
            diagnostics.push(...facet.diagnostics)
            if (facet.empty) {
                return noDataScene(ctx, size, theme, chrome.nodes, chrome.contentArea, fontScale, diagnostics)
            }
            const facetNodes: SceneNode[] = [...chrome.nodes, ...facet.nodes]
            return {
                width: size.width,
                height: size.height,
                background: theme.chrome.background,
                plotArea: roundRect(facet.plotArea),
                nodes: facetNodes.map(roundNode),
                series: facet.series,
                ...(facet.legend !== null ? { legend: facet.legend } : {}),
                hover: roundHover(facet.hover),
                diagnostics,
            }
        }
    }

    // --- Chart layout, with the legend two-pass -------------------------------
    const run = CHART_LAYOUTS[chartType]
    let wantLegend = legendPlanned(chartType, ctx.definition, mode)
    const baseOpts: ChartLayerOptions = { legendReserved: wantLegend, thumbnail: mode === "thumbnail", fontScale }
    let layer = run(ctx, chrome.contentArea, baseOpts)

    if (!wantLegend && layer.needsLegendFallback && !ctx.definition.hideLegend && mode === "full") {
        wantLegend = true
        layer = run(ctx, chrome.contentArea, { ...baseOpts, legendReserved: true })
    }

    let legendLayout: LegendLayout | null = null
    if (wantLegend && !layer.empty && layer.legendItems.length > 0) {
        legendLayout = layoutLegend({
            items: layer.legendItems,
            x: chrome.contentArea.x,
            y: chrome.contentArea.y,
            width: chrome.contentArea.width,
            theme,
            measurer,
            font: legendFont(fontScale),
            greyedKeys: layer.greyedLegendKeys,
        })
        const chartArea: Rect = {
            x: chrome.contentArea.x,
            y: chrome.contentArea.y + legendLayout.height,
            width: chrome.contentArea.width,
            height: Math.max(10, chrome.contentArea.height - legendLayout.height),
        }
        layer = run(ctx, chartArea, { ...baseOpts, legendReserved: true })
    }

    diagnostics.push(...layer.diagnostics)

    if (layer.empty) {
        return noDataScene(ctx, size, theme, chrome.nodes, chrome.contentArea, fontScale, diagnostics)
    }

    const nodes: SceneNode[] = [
        ...chrome.nodes,
        ...(legendLayout !== null ? legendLayout.nodes : []),
        ...layer.nodes,
    ]

    return {
        width: size.width,
        height: size.height,
        background: theme.chrome.background,
        plotArea: roundRect(layer.plotArea),
        nodes: nodes.map(roundNode),
        series: layer.series,
        ...(legendLayout !== null ? { legend: legendLayout.items } : {}),
        hover: roundHover(layer.hover),
        diagnostics,
    }
}

// ---------------------------------------------------------------------------
// No-data scene (spec 07 §4)
// ---------------------------------------------------------------------------

function noDataScene(
    ctx: LayoutContext,
    size: { width: number; height: number },
    theme: Theme,
    chromeNodes: SceneNode[],
    contentArea: Rect,
    fontScale: number,
    diagnostics: Diagnostic[],
): ChartScene {
    const font = noDataFont(fontScale)
    const message = truncateWithEllipsis(strings(ctx.locale).noDataPanel, font, contentArea.width, ctx.measurer)
    const metrics = ctx.measurer.measure(message, font)
    const node = textNode({
        key: "chrome/no-data",
        role: "annotation",
        text: message,
        font,
        anchor: "middle",
        x: contentArea.x + contentArea.width / 2,
        baselineY: centeredBaseline(contentArea.y + contentArea.height / 2, metrics),
        colour: theme.chrome.subtitle,
        measurer: ctx.measurer,
    })
    return {
        width: size.width,
        height: size.height,
        background: theme.chrome.background,
        plotArea: roundRect(contentArea),
        nodes: [...chromeNodes, node].map(roundNode),
        series: [],
        hover: { targets: [] },
        diagnostics,
    }
}

// ---------------------------------------------------------------------------
// Deterministic rounding (spec 24 §3): every coordinate through round2
// ---------------------------------------------------------------------------

function roundVec(v: Vec2): Vec2 {
    return { x: round2(v.x), y: round2(v.y) }
}

function roundRect(rect: Rect): Rect {
    return { x: round2(rect.x), y: round2(rect.y), width: round2(rect.width), height: round2(rect.height) }
}

function roundNode(node: SceneNode): SceneNode {
    switch (node.kind) {
        case "group":
            return {
                ...node,
                children: node.children.map(roundNode),
                ...(node.clip !== undefined ? { clip: roundRect(node.clip) } : {}),
            }
        case "line":
            return { ...node, segments: node.segments.map((segment) => segment.map(roundVec)) }
        case "area":
            return { ...node, upper: node.upper.map(roundVec), lower: node.lower.map(roundVec) }
        case "image":
            return { ...node, rect: roundRect(node.rect) }
        case "rect":
            return { ...node, rect: roundRect(node.rect) }
        case "point":
            return { ...node, center: roundVec(node.center), radius: round2(node.radius) }
        case "rule":
            return { ...node, from: roundVec(node.from), to: roundVec(node.to) }
        case "text":
            return {
                ...node,
                position: roundVec(node.position),
                measured: {
                    width: round2(node.measured.width),
                    ascent: round2(node.measured.ascent),
                    descent: round2(node.measured.descent),
                },
            }
    }
}

function roundHover(hover: HoverModel): HoverModel {
    const targets: HitTarget[] = hover.targets.map((target) =>
        target.kind === "time"
            ? { ...target, x: round2(target.x) }
            : { ...target, shape: roundRect(target.shape) },
    )
    return {
        targets,
        ...(hover.timeGuide !== undefined
            ? { timeGuide: { y0: round2(hover.timeGuide.y0), y1: round2(hover.timeGuide.y1) } }
            : {}),
    }
}
