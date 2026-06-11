/**
 * Shared chart-layer plumbing: the ChartLayer contract every chart module
 * returns, the chart font ramp, localized strings, and tooltip helpers.
 */

import type { FormatMeta } from "../../format/number.ts"
import { formatValue } from "../../format/number.ts"
import { formatTime } from "../../format/timeLabels.ts"
import type {
    HoverModel,
    LegendItem,
    Rect,
    SceneNode,
    SeriesModel,
    SeriesPoint,
    TooltipModel,
    TooltipRow,
} from "../../scene/nodes.ts"
import { round2 } from "../../scene/nodes.ts"
import type { FontSpec, TextMeasurer } from "../../text/measurer.ts"
import type { ColumnMeta, Diagnostic, Locale, SeriesKey, TimeGrain, TimeOrdinal } from "../../types.ts"
import type { LayoutContext } from "../context.ts"

// ---------------------------------------------------------------------------
// ChartLayer — what every chart module hands back to layoutChart
// ---------------------------------------------------------------------------

export interface ChartLayer {
    plotArea: Rect
    nodes: SceneNode[]
    series: SeriesModel[]
    hover: HoverModel
    /** Legend items, in series order, for when layoutChart shows a legend. */
    legendItems: LegendItem[]
    /** Keys rendered greyed in the legend (zero-throughout stacked bands). */
    greyedLegendKeys: SeriesKey[]
    /** Direct labelling failed: request a legend when none was reserved. */
    needsLegendFallback: boolean
    /** No drawable data — layoutChart renders the no-data panel instead. */
    empty: boolean
    diagnostics: Diagnostic[]
}

export function emptyLayer(plotArea: Rect, diagnostics: Diagnostic[]): ChartLayer {
    return {
        plotArea,
        nodes: [],
        series: [],
        hover: { targets: [] },
        legendItems: [],
        greyedLegendKeys: [],
        needsLegendFallback: false,
        empty: true,
        diagnostics,
    }
}

export interface ChartLayerOptions {
    /** A legend is (or will be) shown above the chart. */
    legendReserved: boolean
    /** Thumbnail chrome: minimal labelling. */
    thumbnail: boolean
    /** Breakpoint font scale derived from the scene width (spec 10 §6). */
    fontScale: number
}

// ---------------------------------------------------------------------------
// Fonts (theme base size × breakpoint scale)
// ---------------------------------------------------------------------------

/** Spec 10 §6: named breakpoints gate the font scale. */
export function fontScaleFor(width: number): number {
    if (width < 400) return 0.85
    if (width < 700) return 0.95
    return 1
}

function font(family: FontSpec["family"], sizePx: number, weight: FontSpec["weight"]): FontSpec {
    return { family, sizePx: round2(sizePx), weight }
}

export const titleFont = (scale: number): FontSpec => font("heading", 20 * scale, 700)
export const subtitleFont = (scale: number): FontSpec => font("body", 13 * scale, 400)
export const tickFont = (scale: number): FontSpec => font("body", 12 * scale, 400)
export const seriesLabelFont = (scale: number): FontSpec => font("body", 12 * scale, 400)
export const valueLabelFont = (scale: number): FontSpec => font("body", 12 * scale, 400)
export const legendFont = (scale: number): FontSpec => font("body", 12 * scale, 400)
export const footerFont = (scale: number): FontSpec => font("body", 11 * scale, 400)
export const noDataFont = (scale: number): FontSpec => font("body", 14 * scale, 400)

// ---------------------------------------------------------------------------
// Localized strings
// ---------------------------------------------------------------------------

export interface ChartStrings {
    noData: string
    noDataPanel: string
    projected: string
    interpolated: string
    total: string
    source: string
    dataFrom: (time: string) => string
    inTime: (time: string) => string
}

const STRINGS: Record<Locale, ChartStrings> = {
    en: {
        noData: "No data",
        noDataPanel: "No data for the current selection",
        projected: "Projected data",
        interpolated: "Includes interpolated values",
        total: "Total",
        source: "Source",
        dataFrom: (time: string) => `Data from ${time}`,
        inTime: (time: string) => ` in ${time}`,
    },
    fr: {
        noData: "Aucune donnée",
        noDataPanel: "Aucune donnée pour la sélection actuelle",
        projected: "Données projetées",
        interpolated: "Comprend des valeurs interpolées",
        total: "Total",
        source: "Source",
        dataFrom: (time: string) => `Données de ${time}`,
        inTime: (time: string) => ` en ${time}`,
    },
}

export function strings(locale: Locale): ChartStrings {
    return STRINGS[locale]
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export const RELATIVE_META: FormatMeta = { type: "percentage" }

export function metaFor(ctx: LayoutContext, slug: string): ColumnMeta | FormatMeta {
    return ctx.columns[slug] ?? { type: "numeric" }
}

export function tooltipValueText(ctx: LayoutContext, slug: string, value: number, relative: boolean): string {
    if (relative) return formatValue(value, RELATIVE_META, { locale: ctx.locale, verbosity: "long", showSign: true })
    return formatValue(value, metaFor(ctx, slug), { locale: ctx.locale, verbosity: "long" })
}

export function labelValueText(ctx: LayoutContext, slug: string, value: number, relative: boolean): string {
    if (relative) return formatValue(value, RELATIVE_META, { locale: ctx.locale, verbosity: "label", showSign: true })
    return formatValue(value, metaFor(ctx, slug), { locale: ctx.locale, verbosity: "label" })
}

/** Tooltip subtitle (spec 06 §1): metric name + unit when not obvious. */
export function metricSubtitle(ctx: LayoutContext, slug: string): string | undefined {
    const meta = ctx.columns[slug]
    if (meta === undefined) return undefined
    const unit = meta.denominator !== undefined ? (meta.derivedUnit ?? meta.derivedShortUnit) : meta.unit
    return unit !== undefined && unit !== "" ? `${meta.name} (${unit})` : meta.name
}

// ---------------------------------------------------------------------------
// Tooltip assembly
// ---------------------------------------------------------------------------

export interface FooterFlags {
    /** Distinct borrowed source times (sourceTime ≠ requested time). */
    borrowedTimes: TimeOrdinal[]
    projected: boolean
    interpolated: boolean
}

export function collectFooterFlags(): FooterFlags {
    return { borrowedTimes: [], projected: false, interpolated: false }
}

export function noteFooterFlags(flags: FooterFlags, point: SeriesPoint | undefined, time: TimeOrdinal | null): void {
    if (point === undefined) return
    if (point.projected === true) flags.projected = true
    if (point.interpolated === true) flags.interpolated = true
    if (
        time !== null &&
        point.sourceTime !== undefined &&
        point.sourceTime !== time &&
        !flags.borrowedTimes.includes(point.sourceTime)
    ) {
        flags.borrowedTimes.push(point.sourceTime)
    }
}

export function buildFooters(flags: FooterFlags, grain: TimeGrain, locale: Locale): TooltipModel["footers"] {
    const footers: TooltipModel["footers"] = []
    const t = strings(locale)
    for (const time of [...flags.borrowedTimes].sort((a, b) => a - b)) {
        footers.push({ icon: "notice", text: t.dataFrom(formatTime(time, grain, locale)) })
    }
    if (flags.interpolated) footers.push({ icon: "notice", text: t.interpolated })
    if (flags.projected) footers.push({ icon: "projection", text: t.projected })
    return footers
}

export function missingRow(seriesKey: SeriesKey, label: string, swatch: string, locale: Locale): TooltipRow {
    return {
        seriesKey,
        label,
        swatch,
        valueText: strings(locale).noData,
        emphasized: false,
        notice: "missing",
    }
}

export function noticeFor(point: SeriesPoint, time: TimeOrdinal | null): TooltipRow["notice"] {
    if (point.projected === true) return "projected"
    if (time !== null && point.sourceTime !== undefined && point.sourceTime !== time) return "toleranced"
    return undefined
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function pointByTime(series: SeriesModel): Map<TimeOrdinal | null, SeriesPoint> {
    return new Map(series.points.map((point) => [point.time, point]))
}

export function legendItemsFor(series: readonly SeriesModel[]): LegendItem[] {
    return series.map((s) => ({ seriesKey: s.key, label: s.label, swatch: s.colour }))
}

/** Baseline so the text's vertical center sits on `centerY`. */
export function centeredBaseline(centerY: number, metrics: { ascent: number; descent: number }): number {
    return centerY + (metrics.ascent - metrics.descent) / 2
}

export interface TextNodeArgs {
    key: string
    role: "mark" | "axis" | "grid" | "label" | "annotation" | "chrome"
    text: string
    font: FontSpec
    anchor: "start" | "middle" | "end"
    x: number
    baselineY: number
    colour: string
    measurer: TextMeasurer
    seriesKey?: SeriesKey
    opacity?: number
}

export function textNode(args: TextNodeArgs): SceneNode {
    return {
        key: args.key,
        role: args.role,
        kind: "text",
        position: { x: args.x, y: args.baselineY },
        text: args.text,
        font: args.font,
        anchor: args.anchor,
        colour: args.colour,
        measured: args.measurer.measure(args.text, args.font),
        ...(args.seriesKey !== undefined ? { seriesKey: args.seriesKey } : {}),
        ...(args.opacity !== undefined ? { opacity: args.opacity } : {}),
    }
}

/** Deterministic string-comparison (no Intl, no locale-dependent collation). */
export function compareStrings(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0
}
