import type { ChartDefinition, ChartType } from "../types"

export const CURRENT_SCHEMA_VERSION = 3

export interface NormalizedChartDefinition extends ChartDefinition {
    schemaVersion: number
    types: ChartType[]
    selectionMode: "multi" | "single" | "fixed"
    stackMode: "absolute" | "relative"
    facet: "none" | "entity" | "metric"
    missingData: "auto" | "hide" | "show"
}

export const normalizeDefinition = (
    definition: ChartDefinition
): NormalizedChartDefinition => {
    const yColumns = Array.isArray(definition.y) ? definition.y : [definition.y]

    return {
        schemaVersion: definition.schemaVersion ?? CURRENT_SCHEMA_VERSION,
        types: definition.types ?? ["line", "discrete-bar"],
        selectionMode: definition.selectionMode ?? "multi",
        stackMode: definition.stackMode ?? "absolute",
        facet: definition.facet ?? "none",
        missingData: definition.missingData ?? "auto",
        ...definition,
        y: yColumns,
    }
}

export const getYColumns = (definition: ChartDefinition): string[] =>
    Array.isArray(definition.y) ? definition.y : [definition.y]

export const chooseDefaultType = (
    definition: ChartDefinition,
    hasTimeRange: boolean
): ChartType => {
    const types = definition.types ?? ["line", "discrete-bar"]
    if (definition.defaultTab && definition.defaultTab !== "chart" && definition.defaultTab !== "table") {
        return definition.defaultTab
    }
    if (hasTimeRange && types.includes("line")) return "line"
    if (!hasTimeRange && types.includes("discrete-bar")) return "discrete-bar"
    return types[0] ?? "line"
}
