import { describe, expect, it } from "vitest"

import { parseDefinition } from "./schema.ts"
import { serializeDefinition } from "./serialize.ts"

const minimal = {
    title: "Provincial spending",
    data: "provincial-budgets",
    y: ["spending"],
}

/** Parse a raw definition that is known to be valid in these tests. */
function parse(raw: unknown) {
    const { definition } = parseDefinition(raw)
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

const fullyPopulated = {
    schemaVersion: 1,
    slug: "provincial-spending",
    title: "Provincial spending",
    subtitle: "In billions of dollars",
    note: "Excludes territories",
    sourceText: "Public Accounts",
    titleAnnotations: { entity: false, time: true, changePrefix: false },
    data: "provincial-budgets",
    y: ["spending", "revenue"],
    filter: { sector: "health" },
    bindings: { spending: { name: "Total spending", decimals: 0, denominator: "gdp" } },
    types: ["stacked-area", "line"],
    defaultTab: "table",
    selectedEntities: ["Alberta", "Ontario"],
    includedEntities: ["Alberta", "Ontario", "Québec"],
    excludedEntities: ["Canada"],
    entityColours: { Alberta: "blue" },
    selectionMode: "single",
    focusedSeries: ["Alberta"],
    time: [2010, "latest"],
    timelineRange: ["earliest", "latest"],
    hideTimeline: true,
    xAxis: { label: "Fiscal year" },
    yAxis: { min: 0, max: "auto", scale: "log", canToggleScale: true, hideGridlines: true },
    stackMode: "relative",
    sort: { by: "column", order: "desc", column: "spending" },
    facet: "entity",
    missingData: "hide",
    comparisonLines: [{ y: 100, label: "Target" }, { x: 2020 }],
    seriesStrategy: "entity",
    hideLegend: true,
    hideSeriesLabels: true,
    hideRelativeToggle: true,
    hideTotalLabel: true,
    theme: "dark",
    locale: "fr",
}

describe("serializeDefinition omits defaults (spec 02 test expectation)", () => {
    it("serializes a minimal definition to exactly title, data, y", () => {
        const serialized = serializeDefinition(parse(minimal))
        expect(Object.keys(serialized).sort()).toEqual(["data", "title", "y"])
        expect(serialized).toEqual(minimal)
    })

    it("omits schemaVersion when it is 1 (missing reads as 1)", () => {
        const serialized = serializeDefinition(parse({ ...minimal, schemaVersion: 1 }))
        expect("schemaVersion" in serialized).toBe(false)
    })

    it("omits types when they equal the default pair, keeps them otherwise", () => {
        expect("types" in serializeDefinition(parse({ ...minimal, types: ["line", "discrete-bar"] }))).toBe(false)
        expect(serializeDefinition(parse({ ...minimal, types: ["line"] })).types).toEqual(["line"])
    })

    it("writes only the suppressed title annotations", () => {
        const serialized = serializeDefinition(parse({ ...minimal, titleAnnotations: { time: false } }))
        expect(serialized.titleAnnotations).toEqual({ time: false })
        const allOn = serializeDefinition(parse({ ...minimal, titleAnnotations: { entity: true } }))
        expect("titleAnnotations" in allOn).toBe(false)
    })

    it("omits explicitly-written default enum values", () => {
        const serialized = serializeDefinition(
            parse({ ...minimal, selectionMode: "multi", stackMode: "absolute", facet: "none", missingData: "auto" }),
        )
        expect(Object.keys(serialized).sort()).toEqual(["data", "title", "y"])
    })

    it("omits hide* toggles written as false", () => {
        const serialized = serializeDefinition(parse({ ...minimal, hideTimeline: false, hideLegend: false }))
        expect(Object.keys(serialized).sort()).toEqual(["data", "title", "y"])
    })

    it("collapses an equal-bound time selection to a single value", () => {
        const serialized = serializeDefinition(parse({ ...minimal, time: 2020 }))
        expect(serialized.time).toBe(2020)
    })

    it("serializes a range as [start, end]", () => {
        const serialized = serializeDefinition(parse({ ...minimal, time: ["earliest", 2024] }))
        expect(serialized.time).toEqual(["earliest", 2024])
    })
})

describe("serializeDefinition round-trips (spec 02 test expectation)", () => {
    it("round-trips a minimal definition", () => {
        const definition = parse(minimal)
        const reparsed = parseDefinition(serializeDefinition(definition))
        expect(reparsed.diagnostics).toEqual([])
        expect(reparsed.definition).toEqual(definition)
    })

    it("round-trips a fully-populated definition", () => {
        const definition = parse(fullyPopulated)
        const serialized = serializeDefinition(definition)
        const reparsed = parseDefinition(serialized)
        expect(reparsed.diagnostics).toEqual([])
        expect(reparsed.definition).toEqual(definition)
    })

    it("round-trips unresolved grain-encoded time strings", () => {
        const definition = parse({ ...minimal, time: ["2014-15", "2024-25"] })
        const serialized = serializeDefinition(definition)
        expect(serialized.time).toEqual(["2014-15", "2024-25"])
        expect(parseDefinition(serialized).definition).toEqual(definition)
    })

    it("serializes to a plain JSON-safe object", () => {
        const definition = parse(fullyPopulated)
        const serialized = serializeDefinition(definition)
        const viaJson = JSON.parse(JSON.stringify(serialized))
        expect(parseDefinition(viaJson).definition).toEqual(definition)
    })
})
