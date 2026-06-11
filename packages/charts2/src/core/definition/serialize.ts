/**
 * Definition serialization: ChartDefinition → plain JSON-safe object,
 * omitting every field equal to its documented default. Spec 02 test
 * expectation: "serializing a definition omits defaulted fields", and
 * parseDefinition(serializeDefinition(d)) round-trips to an identical
 * definition.
 */

import type { ChartDefinition, TimeSelection } from "../types.ts"
import { DEFAULT_CHART_TYPES } from "./schema.ts"

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index])
}

/** {start, end} → single value when collapsed, [start, end] otherwise. */
function serializeTimeSelection(selection: TimeSelection): unknown {
    if (selection.start === selection.end) return selection.start
    return [selection.start, selection.end]
}

export function serializeDefinition(definition: ChartDefinition): Record<string, unknown> {
    const out: Record<string, unknown> = {}

    // A missing schemaVersion is read as 1 (spec 02 §4), so 1 is the omitted default.
    if (definition.schemaVersion !== 1) out.schemaVersion = definition.schemaVersion

    if (definition.slug !== undefined) out.slug = definition.slug
    out.title = definition.title
    if (definition.subtitle !== undefined) out.subtitle = definition.subtitle
    if (definition.note !== undefined) out.note = definition.note
    if (definition.sourceText !== undefined) out.sourceText = definition.sourceText

    // Each annotation defaults to true; only suppressed ones are written.
    const annotations: Record<string, boolean> = {}
    if (!definition.titleAnnotations.entity) annotations.entity = false
    if (!definition.titleAnnotations.time) annotations.time = false
    if (!definition.titleAnnotations.changePrefix) annotations.changePrefix = false
    if (Object.keys(annotations).length > 0) out.titleAnnotations = annotations

    out.data = definition.data
    out.y = [...definition.y]
    if (definition.filter !== undefined) out.filter = { ...definition.filter }
    if (definition.bindings !== undefined) {
        out.bindings = Object.fromEntries(
            Object.entries(definition.bindings).map(([slug, override]) => [slug, { ...override }]),
        )
    }

    if (!arraysEqual(definition.types, DEFAULT_CHART_TYPES)) out.types = [...definition.types]
    if (definition.defaultTab !== undefined) out.defaultTab = definition.defaultTab

    if (definition.selectedEntities !== undefined) out.selectedEntities = [...definition.selectedEntities]
    if (definition.includedEntities !== undefined) out.includedEntities = [...definition.includedEntities]
    if (definition.excludedEntities !== undefined) out.excludedEntities = [...definition.excludedEntities]
    if (definition.entityColours !== undefined) out.entityColours = { ...definition.entityColours }
    if (definition.selectionMode !== "multi") out.selectionMode = definition.selectionMode
    if (definition.focusedSeries !== undefined) out.focusedSeries = [...definition.focusedSeries]

    if (definition.time !== undefined) out.time = serializeTimeSelection(definition.time)
    if (definition.timelineRange !== undefined) out.timelineRange = serializeTimeSelection(definition.timelineRange)
    if (definition.hideTimeline) out.hideTimeline = true

    if (definition.xAxis !== undefined) out.xAxis = { ...definition.xAxis }
    if (definition.yAxis !== undefined) out.yAxis = { ...definition.yAxis }
    if (definition.stackMode !== "absolute") out.stackMode = definition.stackMode
    if (definition.sort !== undefined) out.sort = { ...definition.sort }
    if (definition.facet !== "none") out.facet = definition.facet
    if (definition.missingData !== "auto") out.missingData = definition.missingData
    if (definition.comparisonLines !== undefined) {
        out.comparisonLines = definition.comparisonLines.map((line) => ({ ...line }))
    }
    if (definition.seriesStrategy !== undefined) out.seriesStrategy = definition.seriesStrategy

    if (definition.hideLegend) out.hideLegend = true
    if (definition.hideSeriesLabels) out.hideSeriesLabels = true
    if (definition.hideRelativeToggle) out.hideRelativeToggle = true
    if (definition.hideTotalLabel) out.hideTotalLabel = true

    if (definition.theme !== undefined) out.theme = definition.theme
    if (definition.locale !== undefined) out.locale = definition.locale

    return out
}
