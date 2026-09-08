/**
 * Chart definition parsing: raw JSON → ChartDefinition with defaults
 * applied. Spec 02 §1–2.
 *
 * Defaults philosophy (spec 02 §2): a minimal definition — title, data, y —
 * must produce a publishable chart; every other field is progressive
 * refinement with a documented default. Unknown fields are warnings, never
 * silently dropped (spec 02 §4); structural problems (missing title, empty
 * y, malformed time) are errors and yield a null definition.
 *
 * Time bounds accept ordinals, "earliest"/"latest", or grain-encoded raw
 * strings ("2024-25"). The grain is a dataset property the schema cannot
 * know, so string bounds are carried verbatim until the manifest is loaded;
 * resolveDefinitionTimes(definition, grain) then converts them to ordinals.
 */

import { z } from "zod"

import { parseTime } from "../data/time.ts"
import type { ChartDefinition, ChartType, Diagnostic, TimeBound, TimeGrain, TimeSelection } from "../types.ts"
import { CURRENT_SCHEMA_VERSION, migrateDefinition } from "./migrate.ts"

/** Spec 02 §1: a definition supports the line + discrete-bar pair by default. */
export const DEFAULT_CHART_TYPES: readonly ChartType[] = ["line", "discrete-bar"]

// ---------------------------------------------------------------------------
// Schemas (zod v4) — unknown keys are stripped here and warned about below.
// ---------------------------------------------------------------------------

const chartTypeSchema = z.enum([
    "line",
    "discrete-bar",
    "stacked-area",
    "stacked-bar",
    "stacked-discrete-bar",
    "slope",
    "dumbbell",
    "scatter",
    "marimekko",
])

const tabSchema = z.union([chartTypeSchema, z.literal("table")])

const scaleTypeSchema = z.enum(["linear", "log"])

const columnTypeSchema = z.enum(["numeric", "integer", "percentage", "currency", "categorical", "ordinal"])

const toleranceDirectionSchema = z.enum(["both", "backwards", "forwards"])

const axisConfigSchema = z.object({
    min: z.union([z.number(), z.literal("auto")]).optional(),
    max: z.union([z.number(), z.literal("auto")]).optional(),
    scale: scaleTypeSchema.optional(),
    canToggleScale: z.boolean().optional(),
    label: z.string().optional(),
    hideGridlines: z.boolean().optional(),
    hideTickLabels: z.boolean().optional(),
})

const sortConfigSchema = z.object({
    by: z.enum(["total", "name", "column", "change", "custom"]),
    order: z.enum(["asc", "desc"]),
    column: z.string().optional(),
})

const titleAnnotationsSchema = z
    .object({
        entity: z.boolean().default(true),
        time: z.boolean().default(true),
        changePrefix: z.boolean().default(true),
    })
    .default({ entity: true, time: true, changePrefix: true })

/** Per-binding column metadata overrides: Partial<ColumnMeta>. Spec 02 §1, spec 01 §7. */
const bindingOverrideSchema = z.object({
    name: z.string().optional(),
    type: columnTypeSchema.optional(),
    unit: z.string().optional(),
    shortUnit: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    currency: z.string().optional(),
    displayFactor: z.number().optional(),
    decimals: z.number().int().min(0).optional(),
    tolerance: z.number().int().min(0).optional(),
    toleranceDirection: toleranceDirectionSchema.optional(),
    projection: z.boolean().optional(),
    projectionFrom: z.number().optional(),
    denominator: z.string().optional(),
    derivedUnit: z.string().optional(),
    derivedShortUnit: z.string().optional(),
    colour: z.string().optional(),
    order: z.array(z.string()).optional(),
    description: z.string().optional(),
    source: z.number().int().optional(),
})

const comparisonLineSchema = z.object({
    y: z.number().optional(),
    x: z.number().optional(),
    label: z.string().optional(),
})

/** Raw time bound: ordinal, "earliest"/"latest", or grain-encoded string. */
const timeBoundRawSchema = z.union([z.number(), z.string()])

/** Spec 02 §1: `time` accepts a single value, [start, end], or {start, end}. */
const timeSelectionRawSchema = z.union([
    timeBoundRawSchema,
    z.tuple([timeBoundRawSchema, timeBoundRawSchema]),
    z.object({ start: timeBoundRawSchema, end: timeBoundRawSchema }),
])

const definitionSchema = z.object({
    schemaVersion: z.number().int().default(CURRENT_SCHEMA_VERSION),
    slug: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    note: z.string().optional(),
    sourceText: z.string().optional(),
    titleAnnotations: titleAnnotationsSchema,

    data: z.string(),
    y: z.array(z.string()).min(1),
    x: z.string().optional(),
    sizeMetric: z.string().optional(),
    colourMetric: z.string().optional(),
    connector: z.enum(["arrow", "line"]).optional(),
    valueLabelMode: z.enum(["absolute", "change", "percentChange", "none"]).optional(),
    trendColouring: z.boolean().optional(),
    showNoDataArea: z.boolean().optional(),
    filter: z.record(z.string(), z.string()).optional(),
    bindings: z.record(z.string(), bindingOverrideSchema).optional(),

    types: z.array(chartTypeSchema).min(1).default([...DEFAULT_CHART_TYPES]),
    defaultTab: tabSchema.optional(),

    selectedEntities: z.array(z.string()).optional(),
    includedEntities: z.array(z.string()).optional(),
    excludedEntities: z.array(z.string()).optional(),
    entityColours: z.record(z.string(), z.string()).optional(),
    selectionMode: z.enum(["multi", "single", "fixed"]).default("multi"),
    focusedSeries: z.array(z.string()).optional(),

    time: timeSelectionRawSchema.optional(),
    timelineRange: timeSelectionRawSchema.optional(),
    hideTimeline: z.boolean().default(false),

    xAxis: axisConfigSchema.optional(),
    yAxis: axisConfigSchema.optional(),
    stackMode: z.enum(["absolute", "relative"]).default("absolute"),
    sort: sortConfigSchema.optional(),
    facet: z.enum(["none", "entity", "metric"]).default("none"),
    missingData: z.enum(["auto", "hide", "show"]).default("auto"),
    comparisonLines: z.array(comparisonLineSchema).optional(),
    seriesStrategy: z.enum(["entity", "metric"]).optional(),
    rowGroupBreaks: z.array(z.string()).optional(),
    rowGroupGap: z.number().min(0).max(4).optional(),

    hideLegend: z.boolean().default(false),
    hideSeriesLabels: z.boolean().default(false),
    hideRelativeToggle: z.boolean().default(false),
    hideTotalLabel: z.boolean().default(false),

    theme: z.string().optional(),
    locale: z.enum(["en", "fr"]).optional(),
})

const KNOWN_DEFINITION_KEYS = new Set(Object.keys(definitionSchema.shape))
const KNOWN_TITLE_ANNOTATION_KEYS = new Set(["entity", "time", "changePrefix"])
const KNOWN_AXIS_KEYS = new Set(Object.keys(axisConfigSchema.shape))
const KNOWN_SORT_KEYS = new Set(Object.keys(sortConfigSchema.shape))
const KNOWN_BINDING_KEYS = new Set(Object.keys(bindingOverrideSchema.shape))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnUnknownKeys(
    raw: Record<string, unknown>,
    known: ReadonlySet<string>,
    where: string | null,
    diagnostics: Diagnostic[],
): void {
    for (const key of Object.keys(raw)) {
        if (!known.has(key)) {
            diagnostics.push({
                severity: "warning",
                code: "unknown-definition-field",
                message:
                    where === null
                        ? `Unknown definition field "${key}" was ignored`
                        : `Unknown field "${key}" on ${where} was ignored`,
                context: where === null ? { field: key } : { field: key, where },
            })
        }
    }
}

/** Spec 02 §4: unknown fields are reported, not ignored silently. */
function unknownFieldWarnings(raw: Record<string, unknown>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    warnUnknownKeys(raw, KNOWN_DEFINITION_KEYS, null, diagnostics)
    if (isPlainObject(raw.titleAnnotations)) {
        warnUnknownKeys(raw.titleAnnotations, KNOWN_TITLE_ANNOTATION_KEYS, "titleAnnotations", diagnostics)
    }
    for (const axis of ["xAxis", "yAxis"]) {
        const value = raw[axis]
        if (isPlainObject(value)) warnUnknownKeys(value, KNOWN_AXIS_KEYS, axis, diagnostics)
    }
    if (isPlainObject(raw.sort)) {
        warnUnknownKeys(raw.sort, KNOWN_SORT_KEYS, "sort", diagnostics)
    }
    if (isPlainObject(raw.bindings)) {
        for (const [slug, override] of Object.entries(raw.bindings)) {
            if (isPlainObject(override)) {
                warnUnknownKeys(override, KNOWN_BINDING_KEYS, `binding "${slug}"`, diagnostics)
            }
        }
    }
    return diagnostics
}

type RawTimeBound = number | string
type RawTimeSelection = RawTimeBound | [RawTimeBound, RawTimeBound] | { start: RawTimeBound; end: RawTimeBound }

/**
 * Grain-encoded strings ("2024-25") cannot be resolved without the dataset
 * manifest, so they are carried verbatim inside the TimeBound slot until
 * resolveDefinitionTimes converts them. Numbers and the "earliest"/"latest"
 * keywords are already canonical.
 */
function toTimeBound(value: RawTimeBound): TimeBound {
    return value as TimeBound
}

function toTimeSelection(raw: RawTimeSelection): TimeSelection {
    if (typeof raw === "number" || typeof raw === "string") {
        return { start: toTimeBound(raw), end: toTimeBound(raw) }
    }
    if (Array.isArray(raw)) {
        return { start: toTimeBound(raw[0]), end: toTimeBound(raw[1]) }
    }
    return { start: toTimeBound(raw.start), end: toTimeBound(raw.end) }
}

// ---------------------------------------------------------------------------
// parseDefinition
// ---------------------------------------------------------------------------

export interface ParseDefinitionResult {
    /** null when the definition has structural errors (see diagnostics). */
    definition: ChartDefinition | null
    diagnostics: Diagnostic[]
}

export function parseDefinition(raw: unknown): ParseDefinitionResult {
    const diagnostics: Diagnostic[] = []

    const migrated = migrateDefinition(raw)
    diagnostics.push(...migrated.diagnostics)
    if (migrated.raw === null) return { definition: null, diagnostics }

    diagnostics.push(...unknownFieldWarnings(migrated.raw))

    const result = definitionSchema.safeParse(migrated.raw)
    if (!result.success) {
        for (const issue of result.error.issues) {
            diagnostics.push({
                severity: "error",
                code: "definition-invalid",
                message: issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
                context: { path: issue.path.join(".") },
            })
        }
        return { definition: null, diagnostics }
    }

    const parsed = result.data

    const definition: ChartDefinition = {
        schemaVersion: parsed.schemaVersion,
        title: parsed.title,
        titleAnnotations: parsed.titleAnnotations,
        data: parsed.data,
        y: parsed.y,
        types: parsed.types,
        selectionMode: parsed.selectionMode,
        hideTimeline: parsed.hideTimeline,
        stackMode: parsed.stackMode,
        facet: parsed.facet,
        missingData: parsed.missingData,
        hideLegend: parsed.hideLegend,
        hideSeriesLabels: parsed.hideSeriesLabels,
        hideRelativeToggle: parsed.hideRelativeToggle,
        hideTotalLabel: parsed.hideTotalLabel,
        ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
        ...(parsed.subtitle !== undefined ? { subtitle: parsed.subtitle } : {}),
        ...(parsed.note !== undefined ? { note: parsed.note } : {}),
        ...(parsed.sourceText !== undefined ? { sourceText: parsed.sourceText } : {}),
        ...(parsed.x !== undefined ? { x: parsed.x } : {}),
        ...(parsed.sizeMetric !== undefined ? { sizeMetric: parsed.sizeMetric } : {}),
        ...(parsed.colourMetric !== undefined ? { colourMetric: parsed.colourMetric } : {}),
        ...(parsed.connector !== undefined ? { connector: parsed.connector } : {}),
        ...(parsed.valueLabelMode !== undefined ? { valueLabelMode: parsed.valueLabelMode } : {}),
        ...(parsed.trendColouring !== undefined ? { trendColouring: parsed.trendColouring } : {}),
        ...(parsed.showNoDataArea !== undefined ? { showNoDataArea: parsed.showNoDataArea } : {}),
        ...(parsed.filter !== undefined ? { filter: parsed.filter } : {}),
        ...(parsed.bindings !== undefined ? { bindings: parsed.bindings } : {}),
        ...(parsed.defaultTab !== undefined ? { defaultTab: parsed.defaultTab } : {}),
        ...(parsed.selectedEntities !== undefined ? { selectedEntities: parsed.selectedEntities } : {}),
        ...(parsed.includedEntities !== undefined ? { includedEntities: parsed.includedEntities } : {}),
        ...(parsed.excludedEntities !== undefined ? { excludedEntities: parsed.excludedEntities } : {}),
        ...(parsed.entityColours !== undefined ? { entityColours: parsed.entityColours } : {}),
        ...(parsed.focusedSeries !== undefined ? { focusedSeries: parsed.focusedSeries } : {}),
        ...(parsed.time !== undefined ? { time: toTimeSelection(parsed.time) } : {}),
        ...(parsed.timelineRange !== undefined ? { timelineRange: toTimeSelection(parsed.timelineRange) } : {}),
        ...(parsed.xAxis !== undefined ? { xAxis: parsed.xAxis } : {}),
        ...(parsed.yAxis !== undefined ? { yAxis: parsed.yAxis } : {}),
        ...(parsed.sort !== undefined ? { sort: parsed.sort } : {}),
        ...(parsed.comparisonLines !== undefined ? { comparisonLines: parsed.comparisonLines } : {}),
        ...(parsed.seriesStrategy !== undefined ? { seriesStrategy: parsed.seriesStrategy } : {}),
        ...(parsed.rowGroupBreaks !== undefined ? { rowGroupBreaks: parsed.rowGroupBreaks } : {}),
        ...(parsed.rowGroupGap !== undefined ? { rowGroupGap: parsed.rowGroupGap } : {}),
        ...(parsed.theme !== undefined ? { theme: parsed.theme } : {}),
        ...(parsed.locale !== undefined ? { locale: parsed.locale } : {}),
    }

    return { definition, diagnostics }
}

// ---------------------------------------------------------------------------
// resolveDefinitionTimes
// ---------------------------------------------------------------------------

export interface ResolveDefinitionTimesResult {
    definition: ChartDefinition
    diagnostics: Diagnostic[]
}

function resolveTimeBound(
    bound: number | string,
    grain: TimeGrain,
    field: string,
    diagnostics: Diagnostic[],
): TimeBound | null {
    if (typeof bound === "number" || bound === "earliest" || bound === "latest") return bound
    const ordinal = parseTime(bound, grain)
    if (ordinal === null) {
        diagnostics.push({
            severity: "error",
            code: "bad-time-bound",
            message: `Time bound "${bound}" in "${field}" does not parse under grain "${grain}"`,
            context: { field, value: bound, grain },
        })
        return null
    }
    return ordinal
}

/**
 * Convert any grain-encoded string time bounds ("2024-25", "2024-Q1", …)
 * left by parseDefinition into ordinals, now that the dataset's grain is
 * known. A selection containing an invalid bound is dropped with an error
 * Diagnostic; numbers and "earliest"/"latest" pass through untouched.
 * Never mutates the input definition.
 */
export function resolveDefinitionTimes(definition: ChartDefinition, grain: TimeGrain): ResolveDefinitionTimesResult {
    const diagnostics: Diagnostic[] = []
    const resolved: ChartDefinition = { ...definition }

    for (const field of ["time", "timelineRange"] as const) {
        const selection = definition[field]
        if (selection === undefined) continue
        const start = resolveTimeBound(selection.start, grain, field, diagnostics)
        const end = resolveTimeBound(selection.end, grain, field, diagnostics)
        if (start === null || end === null) {
            delete resolved[field]
        } else {
            resolved[field] = { start, end }
        }
    }

    return { definition: resolved, diagnostics }
}
