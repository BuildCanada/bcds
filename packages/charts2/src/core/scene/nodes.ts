/**
 * Frozen scene-graph contract.
 *
 * A ChartScene is the output of layout and the input to the single React
 * renderer (SceneSVG). Geometry is plain numbers — never pre-built SVG path
 * strings — so future video passes can interpolate between scenes.
 *
 * Determinism rules (spec 24 §3):
 * - Every node key is stable across re-layouts of the same definition
 *   (derived from entity/metric/role, never an array index).
 * - All coordinates pass through round2() before SVG serialization.
 * - No node carries environment-derived data (timestamps, random ids).
 */

import type { Diagnostic, HexColour, SeriesKey, TimeOrdinal } from "../types.ts"
import type { FontSpec, TextMetrics } from "../text/measurer.ts"

// ---------------------------------------------------------------------------
// Geometry primitives
// ---------------------------------------------------------------------------

export interface Vec2 {
    x: number
    y: number
}

export interface Rect {
    x: number
    y: number
    width: number
    height: number
}

// ---------------------------------------------------------------------------
// Styles — colours are resolved hex by layout time (theme applied in layout,
// not in the renderer).
// ---------------------------------------------------------------------------

export interface StrokeStyle {
    stroke: HexColour
    strokeWidth: number
    /** Dash pattern in px, e.g. [4, 2]. Solid when absent. */
    dash?: number[]
    opacity?: number
    lineCap?: "butt" | "round"
}

export interface FillStyle {
    fill: HexColour
    opacity?: number
    /** Reference to a defs pattern (e.g. projection hatch). */
    patternId?: string
    stroke?: HexColour
    strokeWidth?: number
}

// ---------------------------------------------------------------------------
// Scene nodes
// ---------------------------------------------------------------------------

export type NodeRole = "mark" | "axis" | "grid" | "label" | "annotation" | "chrome"

interface MarkBase {
    /** Stable across re-layouts of the same definition. */
    key: string
    /** Present on series-owned nodes: drives emphasis/dimming and video keying. */
    seriesKey?: SeriesKey
    role: NodeRole
}

export type SceneNode =
    | (MarkBase & { kind: "group"; children: SceneNode[]; clip?: Rect })
    /** Polyline series; separate segments encode data gaps. */
    | (MarkBase & { kind: "line"; segments: Vec2[][]; style: StrokeStyle })
    | (MarkBase & { kind: "area"; upper: Vec2[]; lower: Vec2[]; style: FillStyle })
    | (MarkBase & { kind: "image"; href: string; rect: Rect; preserveAspectRatio?: string; opacity?: number })
    | (MarkBase & { kind: "rect"; rect: Rect; style: FillStyle })
    | (MarkBase & { kind: "point"; center: Vec2; radius: number; style: FillStyle })
    | (MarkBase & { kind: "rule"; from: Vec2; to: Vec2; style: StrokeStyle })
    | (MarkBase & {
          kind: "text"
          position: Vec2
          text: string
          font: FontSpec
          anchor: "start" | "middle" | "end"
          colour: HexColour
          /** Measured by the layout's TextMeasurer; renderer trusts it. */
          measured: TextMetrics
          opacity?: number
      })

// ---------------------------------------------------------------------------
// Computed series model — the layer-2 testable contract (spec 26 §1.2)
// ---------------------------------------------------------------------------

export interface SeriesPoint {
    time: TimeOrdinal | null
    /** Display value (post denominator/displayFactor). */
    value: number
    /** Stacked offset where applicable. */
    valueOffset?: number
    sourceTime?: TimeOrdinal
    projected?: boolean
    interpolated?: boolean
}

export interface SeriesModel {
    key: SeriesKey
    /** Display label (entity name or metric name). */
    label: string
    colour: HexColour
    entity?: string
    column?: string
    points: SeriesPoint[]
}

// ---------------------------------------------------------------------------
// Hover model — precomputed pure hit/tooltip data; React consumes it without
// recomputing layout. Hover NEVER triggers relayout.
// ---------------------------------------------------------------------------

export interface TooltipRow {
    seriesKey: SeriesKey
    label: string
    swatch: HexColour
    /** Formatted display string (formatting service output). */
    valueText: string
    emphasized: boolean
    notice?: "toleranced" | "projected" | "missing"
}

export interface TooltipModel {
    title: string
    titleAnnotation?: string
    subtitle?: string
    rows: TooltipRow[]
    totalRow?: TooltipRow
    footers: { icon: "notice" | "projection"; text: string }[]
}

export type HitTarget =
    | { kind: "time"; time: TimeOrdinal; x: number; tooltip: TooltipModel }
    | { kind: "series"; seriesKey: SeriesKey; shape: Rect; tooltip: TooltipModel }

export interface HoverModel {
    targets: HitTarget[]
    /** Vertical guide line bounds for time-hover charts (line, stacked area). */
    timeGuide?: { y0: number; y1: number }
}

// ---------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------

export interface LegendItem {
    seriesKey: SeriesKey
    label: string
    swatch: HexColour
}

export interface ChartScene {
    width: number
    height: number
    background: HexColour
    /** The data area, inside axes and chrome. */
    plotArea: Rect
    nodes: SceneNode[]
    series: SeriesModel[]
    legend?: LegendItem[]
    hover: HoverModel
    diagnostics: Diagnostic[]
}

// ---------------------------------------------------------------------------
// Coordinate formatting — THE single rounding rule (determinism, spec 24 §3)
// ---------------------------------------------------------------------------

/**
 * Round to 2 decimal places, normalizing -0 to 0. All scene coordinates and
 * the SVG serializer must route numbers through this — never toFixed or raw
 * floats (exponent notation like 1e-7 would leak into SVG output).
 */
export const round2 = (n: number): number => {
    const r = Math.round(n * 100) / 100
    return r === 0 ? 0 : r
}
