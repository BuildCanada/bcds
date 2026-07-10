/**
 * Binding and selection resolution: definition × dataset → effective column
 * metadata and the initial entity selection. Spec 02 §1.
 *
 * - resolveBindings merges manifest column meta with the definition's
 *   per-binding overrides (undefined entries ignored) and enforces the
 *   chart-level stacking rule from spec 01 §7: y columns stacked together
 *   must share a denominator.
 * - resolveSelection computes the initial entities: the author's
 *   selectedEntities intersected with the choosable set, else the top 8
 *   by latest y[0] value (spec 02 default).
 */

import { resolveValue } from "../data/derived.ts"
import type { ChartDefinition, ColumnMeta, Dataset, Diagnostic, Manifest } from "../types.ts"

/** Spec 02 §1: default initial selection is the "top N (≈8)" entities. */
export const DEFAULT_SELECTION_SIZE = 8

// ---------------------------------------------------------------------------
// resolveBindings
// ---------------------------------------------------------------------------

export interface ResolveBindingsResult {
    /** Manifest column meta with per-binding overrides applied, by slug. */
    columns: Record<string, ColumnMeta>
    diagnostics: Diagnostic[]
}

/** Merge per-binding overrides into column metadata, ignoring undefined entries. */
function mergeColumnMeta(meta: ColumnMeta, overrides: Partial<ColumnMeta> | undefined): ColumnMeta {
    const merged: ColumnMeta = { ...meta }
    if (overrides !== undefined) {
        for (const [key, value] of Object.entries(overrides)) {
            if (value !== undefined) {
                ;(merged as unknown as Record<string, unknown>)[key] = value
            }
        }
    }
    return merged
}

export function resolveBindings(definition: ChartDefinition, manifest: Manifest): ResolveBindingsResult {
    const diagnostics: Diagnostic[] = []

    const columns: Record<string, ColumnMeta> = {}
    for (const [slug, meta] of Object.entries(manifest.columns)) {
        columns[slug] = mergeColumnMeta(meta, definition.bindings?.[slug])
    }

    for (const slug of Object.keys(definition.bindings ?? {})) {
        if (!(slug in manifest.columns)) {
            diagnostics.push({
                severity: "warning",
                code: "unknown-binding-column",
                message: `Binding override for "${slug}" references a column not in dataset "${manifest.name}"`,
                context: { column: slug, dataset: manifest.name },
            })
        }
    }

    for (const slug of definition.y) {
        if (!(slug in manifest.columns)) {
            diagnostics.push({
                severity: "error",
                code: "unknown-y-column",
                message: `y references column "${slug}" which is not in dataset "${manifest.name}"`,
                context: { column: slug, dataset: manifest.name },
            })
        }
    }

    // Spec 01 §7: stacking columns with different denominators is a
    // validation error — component ÷ D only sums coherently to total ÷ D
    // when every stacked column shares the same D.
    const stackingCapable = definition.types.some((type) => type.startsWith("stacked-"))
    if (stackingCapable) {
        const stackedColumns = definition.y.filter((slug) => slug in columns)
        const denominators = new Set(stackedColumns.map((slug) => columns[slug].denominator ?? ""))
        if (stackedColumns.length > 1 && denominators.size > 1) {
            diagnostics.push({
                severity: "error",
                code: "mixed-denominators",
                message:
                    `Stacked y columns must share one denominator; got ` +
                    stackedColumns.map((slug) => `${slug}: ${columns[slug].denominator ?? "(none)"}`).join(", "),
                context: { columns: stackedColumns.join(", ") },
            })
        }
    }

    return { columns, diagnostics }
}

// ---------------------------------------------------------------------------
// resolveSelection
// ---------------------------------------------------------------------------

export interface ResolveSelectionResult {
    /** Initial entity selection, in selection order. */
    entities: string[]
    diagnostics: Diagnostic[]
}

/** The latest resolved y[0] value for an entity, or null when it has none. */
function latestValue(dataset: Dataset, slug: string, entity: string, overrides: Partial<ColumnMeta> | undefined): number | null {
    if (dataset.manifest.timeGrain === "none" || dataset.times.length === 0) {
        const resolved = resolveValue(dataset, slug, entity, null, overrides)
        return resolved.status === "value" ? resolved.value : null
    }
    for (let i = dataset.times.length - 1; i >= 0; i--) {
        const resolved = resolveValue(dataset, slug, entity, dataset.times[i], overrides)
        if (resolved.status === "value") return resolved.value
    }
    return null
}

export function resolveSelection(definition: ChartDefinition, dataset: Dataset): ResolveSelectionResult {
    const diagnostics: Diagnostic[] = []

    const included = definition.includedEntities !== undefined ? new Set(definition.includedEntities) : null
    const excluded = new Set(definition.excludedEntities ?? [])
    const available = dataset.entities.filter(
        (entity) => (included === null || included.has(entity)) && !excluded.has(entity),
    )

    if (definition.selectedEntities !== undefined) {
        const availableSet = new Set(available)
        const entities: string[] = []
        for (const name of definition.selectedEntities) {
            if (availableSet.has(name)) {
                entities.push(name)
            } else {
                diagnostics.push({
                    severity: "warning",
                    code: "unavailable-selected-entity",
                    message: `Selected entity "${name}" is not available in dataset "${dataset.manifest.name}"`,
                    context: { entity: name, dataset: dataset.manifest.name },
                })
            }
        }
        return { entities, diagnostics }
    }

    // Default: top N by latest y[0] value, descending; ties keep the
    // dataset's canonical entity order for determinism. Entities without
    // any resolvable y[0] value never enter the default selection.
    const slug = definition.y[0]
    const overrides = definition.bindings?.[slug]
    const ranked: { entity: string; value: number; index: number }[] = []
    available.forEach((entity, index) => {
        const value = latestValue(dataset, slug, entity, overrides)
        if (value !== null) ranked.push({ entity, value, index })
    })
    ranked.sort((a, b) => b.value - a.value || a.index - b.index)

    return {
        entities: ranked.slice(0, DEFAULT_SELECTION_SIZE).map((entry) => entry.entity),
        diagnostics,
    }
}
