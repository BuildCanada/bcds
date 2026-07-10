/**
 * Manifest parsing: raw JSON → Manifest with defaults applied. Spec 01 §4–5.
 *
 * Unknown fields are warnings, never errors (forward compatibility);
 * structural problems (bad grain, missing name, …) are errors and yield
 * a null manifest.
 */

import { z } from "zod"

import type { ColumnMeta, Diagnostic, Manifest } from "../types.ts"
import { parseTime } from "./time.ts"

// ---------------------------------------------------------------------------
// Schemas (zod v4) — unknown keys are stripped here and warned about below.
// ---------------------------------------------------------------------------

const timeGrainSchema = z.enum(["year", "fiscal-year", "quarter", "month", "date", "none"])

const columnTypeSchema = z.enum(["numeric", "integer", "percentage", "currency", "categorical", "ordinal"])

const toleranceDirectionSchema = z.enum(["both", "backwards", "forwards"])

const columnSchema = z.object({
    name: z.string().optional(),
    type: columnTypeSchema.default("numeric"),
    unit: z.string().optional(),
    shortUnit: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    currency: z.string().optional(),
    displayFactor: z.number().default(1),
    decimals: z.number().int().min(0).optional(),
    tolerance: z.number().int().min(0).default(0),
    toleranceDirection: toleranceDirectionSchema.default("both"),
    projection: z.boolean().default(false),
    projectionFrom: z.union([z.number(), z.string()]).optional(),
    denominator: z.string().optional(),
    derivedUnit: z.string().optional(),
    derivedShortUnit: z.string().optional(),
    colour: z.string().nullish(),
    order: z.array(z.string()).optional(),
    description: z.string().optional(),
    source: z.number().int().optional(),
})

const entityLabelSchema = z.object({
    label: z.string(),
    labelPlural: z.string().optional(),
    kind: z.string().optional(),
})

const entityMetaSchema = z.object({
    name: z.string(),
    code: z.string().optional(),
    nameFr: z.string().optional(),
    aliases: z.array(z.string()).optional(),
    group: z.string().optional(),
    colour: z.string().optional(),
})

const sourceMetaSchema = z.object({
    name: z.string(),
    url: z.string().optional(),
    publisher: z.string().optional(),
    retrieved: z.string().optional(),
    citation: z.string().optional(),
    license: z.string().optional(),
})

const manifestSchema = z.object({
    name: z.string(),
    title: z.string().optional(),
    timeGrain: timeGrainSchema,
    fiscalYearStartMonth: z.number().int().min(1).max(12).default(4),
    entity: entityLabelSchema.default({ label: "entity" }),
    columns: z.record(z.string(), columnSchema),
    dimensions: z.array(z.string()).optional(),
    entities: z.array(entityMetaSchema).optional(),
    sources: z.array(sourceMetaSchema).default([]),
})

const KNOWN_MANIFEST_KEYS = new Set(Object.keys(manifestSchema.shape))
const KNOWN_COLUMN_KEYS = new Set(Object.keys(columnSchema.shape))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Naive English plural for derived entity labels: "province" → "provinces", "entity" → "entities". */
function pluralize(label: string): string {
    if (/[^aeiou]y$/.test(label)) return `${label.slice(0, -1)}ies`
    if (/(s|x|z|ch|sh)$/.test(label)) return `${label}es`
    return `${label}s`
}

/** "total_spending" → "Total Spending" (spec 01: name defaults to the slug, title-cased). */
function titleCaseSlug(slug: string): string {
    return slug
        .split(/[_\s-]+/)
        .filter((word) => word.length > 0)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function unknownFieldWarnings(raw: Record<string, unknown>): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    for (const key of Object.keys(raw)) {
        if (!KNOWN_MANIFEST_KEYS.has(key)) {
            diagnostics.push({
                severity: "warning",
                code: "unknown-manifest-field",
                message: `Unknown manifest field "${key}" was ignored`,
                context: { field: key },
            })
        }
    }
    const columns = raw.columns
    if (isPlainObject(columns)) {
        for (const [slug, column] of Object.entries(columns)) {
            if (!isPlainObject(column)) continue
            for (const key of Object.keys(column)) {
                if (!KNOWN_COLUMN_KEYS.has(key)) {
                    diagnostics.push({
                        severity: "warning",
                        code: "unknown-manifest-field",
                        message: `Unknown field "${key}" on column "${slug}" was ignored`,
                        context: { column: slug, field: key },
                    })
                }
            }
        }
    }
    return diagnostics
}

// ---------------------------------------------------------------------------
// parseManifest
// ---------------------------------------------------------------------------

export interface ParseManifestResult {
    /** null when the manifest has structural errors (see diagnostics). */
    manifest: Manifest | null
    diagnostics: Diagnostic[]
}

export function parseManifest(raw: unknown): ParseManifestResult {
    const diagnostics: Diagnostic[] = []

    if (!isPlainObject(raw)) {
        return {
            manifest: null,
            diagnostics: [
                {
                    severity: "error",
                    code: "manifest-invalid",
                    message: "Manifest must be a JSON object",
                },
            ],
        }
    }

    diagnostics.push(...unknownFieldWarnings(raw))

    const result = manifestSchema.safeParse(raw)
    if (!result.success) {
        for (const issue of result.error.issues) {
            diagnostics.push({
                severity: "error",
                code: "manifest-invalid",
                message: issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
                context: { path: issue.path.join(".") },
            })
        }
        return { manifest: null, diagnostics }
    }

    const parsed = result.data

    const columns: Record<string, ColumnMeta> = {}
    for (const [slug, column] of Object.entries(parsed.columns)) {
        const { projectionFrom, colour, name, ...rest } = column

        let projectionFromOrdinal: number | undefined
        if (typeof projectionFrom === "number") {
            projectionFromOrdinal = projectionFrom
        } else if (typeof projectionFrom === "string") {
            const ordinal = parseTime(projectionFrom, parsed.timeGrain)
            if (ordinal === null) {
                diagnostics.push({
                    severity: "error",
                    code: "manifest-invalid",
                    message: `columns.${slug}.projectionFrom: "${projectionFrom}" does not parse under grain "${parsed.timeGrain}"`,
                    context: { column: slug, value: projectionFrom },
                })
            } else {
                projectionFromOrdinal = ordinal
            }
        }

        columns[slug] = {
            ...rest,
            name: name ?? titleCaseSlug(slug),
            ...(colour !== null && colour !== undefined ? { colour } : {}),
            ...(projectionFromOrdinal !== undefined ? { projectionFrom: projectionFromOrdinal } : {}),
        }
    }

    // Denominators must reference declared columns (spec 01 §7).
    for (const [slug, column] of Object.entries(columns)) {
        if (column.denominator !== undefined && !(column.denominator in columns)) {
            diagnostics.push({
                severity: "warning",
                code: "unknown-denominator",
                message: `Column "${slug}" declares denominator "${column.denominator}" which is not a declared column; derived values will be missing`,
                context: { column: slug, denominator: column.denominator },
            })
        }
    }

    const manifest: Manifest = {
        name: parsed.name,
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        timeGrain: parsed.timeGrain,
        fiscalYearStartMonth: parsed.fiscalYearStartMonth,
        entity: {
            label: parsed.entity.label,
            labelPlural: parsed.entity.labelPlural ?? pluralize(parsed.entity.label),
            ...(parsed.entity.kind !== undefined ? { kind: parsed.entity.kind } : {}),
        },
        columns,
        ...(parsed.dimensions !== undefined ? { dimensions: parsed.dimensions } : {}),
        ...(parsed.entities !== undefined ? { entities: parsed.entities } : {}),
        sources: parsed.sources,
    }

    return { manifest, diagnostics }
}
