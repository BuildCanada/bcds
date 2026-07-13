/**
 * Series construction (spec 11 "Data consumed", spec 26 §1.2).
 *
 * Series strategy truth table:
 * - one metric  → each entity is a series
 * - >1 metrics  → each metric is a series (per selected entity); with
 *   multiple entities × multiple metrics, series are "Entity – Metric"
 * - definition.seriesStrategy overrides; stacked-discrete-bar is always
 *   metric series (spec 16).
 *
 * EVERY value is read through resolveValue — missing is never zero, and
 * sourceTime/projected travel onto SeriesPoint for downstream marking.
 */

import { resolveValue } from "../data/derived.ts"
import type { SeriesModel, SeriesPoint } from "../scene/nodes.ts"
import { assignColours, createColourState } from "../color/categoricalAssigner.ts"
import type {
    ChartType,
    Diagnostic,
    HexColour,
    SeriesKey,
    SeriesStrategy,
    TimeOrdinal,
} from "../types.ts"
import type { LayoutContext } from "./context.ts"

/** "Entity – Metric" separator (en dash, spaced). */
export const SERIES_KEY_SEPARATOR = " – "

export function resolveSeriesStrategy(ctx: LayoutContext, chartType: ChartType): SeriesStrategy {
    if (chartType === "stacked-discrete-bar") return "metric"
    if (ctx.definition.seriesStrategy !== undefined) return ctx.definition.seriesStrategy
    return ctx.definition.y.length > 1 ? "metric" : "entity"
}

export interface BuildSeriesResult {
    series: SeriesModel[]
    strategy: SeriesStrategy
    diagnostics: Diagnostic[]
}

interface SeriesDef {
    key: SeriesKey
    label: string
    entity?: string
    column: string
}

function seriesDefsFor(ctx: LayoutContext, strategy: SeriesStrategy): SeriesDef[] {
    const slugs = ctx.definition.y.filter((slug) => ctx.dataset.columns.has(slug))
    if (slugs.length === 0) return []

    if (strategy === "entity") {
        const slug = slugs[0]
        return ctx.entities.map((entity) => ({ key: entity, label: entity, entity, column: slug }))
    }

    // Metric series: per selected entity × metric. Single entity keeps bare
    // metric keys; multiple entities produce "Entity – Metric".
    const defs: SeriesDef[] = []
    const multiEntity = ctx.entities.length > 1
    for (const entity of ctx.entities) {
        for (const slug of slugs) {
            const name = ctx.columns[slug]?.name ?? slug
            defs.push({
                key: multiEntity ? `${entity}${SERIES_KEY_SEPARATOR}${slug}` : slug,
                label: multiEntity ? `${entity}${SERIES_KEY_SEPARATOR}${name}` : name,
                entity,
                column: slug,
            })
        }
    }
    return defs
}

/**
 * Fixed-colour map for assignColours, in the precedence: per-chart
 * entityColours → column colour (metric series) → registry entity colour.
 */
function fixedColours(ctx: LayoutContext, defs: readonly SeriesDef[], strategy: SeriesStrategy): Map<SeriesKey, HexColour> {
    const registry = new Map<string, string>()
    for (const entity of ctx.dataset.manifest.entities ?? []) {
        if (entity.colour !== undefined) registry.set(entity.name, entity.colour)
    }
    const fixed = new Map<SeriesKey, HexColour>()
    for (const def of defs) {
        const entityColour = def.entity !== undefined ? ctx.definition.entityColours?.[def.entity] : undefined
        const columnColour = strategy === "metric" ? ctx.columns[def.column]?.colour : undefined
        const registryColour = def.entity !== undefined ? registry.get(def.entity) : undefined
        const colour = entityColour ?? columnColour ?? registryColour
        if (colour !== undefined) fixed.set(def.key, colour)
    }
    return fixed
}

export function buildSeriesModels(ctx: LayoutContext, chartType: ChartType): BuildSeriesResult {
    const diagnostics: Diagnostic[] = []
    const strategy = resolveSeriesStrategy(ctx, chartType)
    const defs = seriesDefsFor(ctx, strategy)

    const pointTimes: (TimeOrdinal | null)[] = ctx.grain === "none" ? [null] : ctx.times
    const expectedCount = pointTimes.length

    const built: SeriesModel[] = []
    for (const def of defs) {
        if (def.entity === undefined) continue
        const overrides = ctx.definition.bindings?.[def.column]
        const points: SeriesPoint[] = []
        for (const time of pointTimes) {
            const resolved = resolveValue(ctx.dataset, def.column, def.entity, time, overrides)
            if (resolved.status !== "value" || !Number.isFinite(resolved.value)) continue
            points.push({
                time,
                value: resolved.value,
                sourceTime: resolved.sourceTime,
                ...(resolved.projected ? { projected: true } : {}),
                ...(resolved.interpolated ? { interpolated: true } : {}),
            })
        }
        if (points.length === 0) continue
        if (ctx.definition.missingData === "hide" && points.length < expectedCount) {
            diagnostics.push({
                severity: "warning",
                code: "series-hidden-missing-data",
                message: `Series "${def.label}" hidden: it is missing data in the selected window (missingData: hide)`,
                context: { series: def.key },
            })
            continue
        }
        built.push({
            key: def.key,
            label: def.label,
            colour: "#000000",
            entity: def.entity,
            column: def.column,
            points,
        })
    }

    const fixed = fixedColours(ctx, defs, strategy)
    const state = createColourState(ctx.theme.palette.categorical)
    const colours = assignColours(
        state,
        built.map((s) => s.key),
        fixed,
    )
    for (const series of built) {
        series.colour = colours.get(series.key) ?? series.colour
    }

    return { series: built, strategy, diagnostics }
}

// ---------------------------------------------------------------------------
// Relative-mode transforms
// ---------------------------------------------------------------------------

export interface RelativeSeriesResult {
    series: SeriesModel[]
    diagnostics: Diagnostic[]
}

/**
 * Line relative mode (spec 11): cumulative % change since the first point in
 * the window. Series whose base value is 0 have no defined change and are
 * hidden with a warning — never shown as 0.
 */
export function toRelativeLineSeries(seriesList: readonly SeriesModel[]): RelativeSeriesResult {
    const out: SeriesModel[] = []
    const diagnostics: Diagnostic[] = []
    for (const series of seriesList) {
        if (series.points.length === 0) {
            out.push(series)
            continue
        }
        const base = series.points[0].value
        if (base === 0) {
            diagnostics.push({
                severity: "warning",
                code: "relative-zero-base",
                message: `Series "${series.label}" starts at 0 in the selected window; relative change is undefined so it is hidden`,
                context: { series: series.key },
            })
            continue
        }
        out.push({
            ...series,
            points: series.points.map((point) => ({
                ...point,
                value: ((point.value - base) / Math.abs(base)) * 100,
            })),
        })
    }
    return { series: out, diagnostics }
}

/**
 * Stacked relative mode (specs 14/15/16): share of the per-time total using
 * absolute-value weights, sign preserved.
 */
export function toShareOfTotalSeries(seriesList: readonly SeriesModel[]): SeriesModel[] {
    const totals = new Map<TimeOrdinal, number>()
    for (const series of seriesList) {
        for (const point of series.points) {
            if (point.time === null) continue
            totals.set(point.time, (totals.get(point.time) ?? 0) + Math.abs(point.value))
        }
    }
    return seriesList.map((series) => ({
        ...series,
        points: series.points.map((point) => {
            const total = point.time !== null ? (totals.get(point.time) ?? 0) : 0
            return { ...point, value: total > 0 ? (point.value / total) * 100 : 0 }
        }),
    }))
}
