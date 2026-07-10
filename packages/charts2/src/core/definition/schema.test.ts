import { describe, expect, it } from "vitest"

import { parseDefinition, resolveDefinitionTimes } from "./schema.ts"

const minimal = {
    title: "Provincial spending",
    data: "provincial-budgets",
    y: ["spending"],
}

describe("parseDefinition defaults (spec 02 §2)", () => {
    it("parses a minimal definition without diagnostics", () => {
        const { definition, diagnostics } = parseDefinition(minimal)
        expect(diagnostics).toEqual([])
        expect(definition).not.toBeNull()
        expect(definition!.title).toBe("Provincial spending")
        expect(definition!.data).toBe("provincial-budgets")
        expect(definition!.y).toEqual(["spending"])
    })

    it("defaults schemaVersion to the current version (1)", () => {
        const { definition } = parseDefinition(minimal)
        expect(definition!.schemaVersion).toBe(1)
    })

    it("defaults types to the line + discrete-bar pair", () => {
        const { definition } = parseDefinition(minimal)
        expect(definition!.types).toEqual(["line", "discrete-bar"])
    })

    it("defaults every title annotation to enabled", () => {
        const { definition } = parseDefinition(minimal)
        expect(definition!.titleAnnotations).toEqual({ entity: true, time: true, changePrefix: true })
    })

    it("fills the missing keys of a partial titleAnnotations object", () => {
        const { definition } = parseDefinition({ ...minimal, titleAnnotations: { entity: false } })
        expect(definition!.titleAnnotations).toEqual({ entity: false, time: true, changePrefix: true })
    })

    it("defaults selectionMode multi, stackMode absolute, facet none, missingData auto", () => {
        const { definition } = parseDefinition(minimal)
        expect(definition!.selectionMode).toBe("multi")
        expect(definition!.stackMode).toBe("absolute")
        expect(definition!.facet).toBe("none")
        expect(definition!.missingData).toBe("auto")
    })

    it("defaults hideTimeline and every hide* toggle to false", () => {
        const { definition } = parseDefinition(minimal)
        expect(definition!.hideTimeline).toBe(false)
        expect(definition!.hideLegend).toBe(false)
        expect(definition!.hideSeriesLabels).toBe(false)
        expect(definition!.hideRelativeToggle).toBe(false)
        expect(definition!.hideTotalLabel).toBe(false)
    })

    it("leaves optional fields undefined rather than inventing values", () => {
        const { definition } = parseDefinition(minimal)
        expect(definition!.time).toBeUndefined()
        expect(definition!.selectedEntities).toBeUndefined()
        expect(definition!.sort).toBeUndefined()
        expect(definition!.defaultTab).toBeUndefined()
    })
})

describe("parseDefinition required fields", () => {
    it("rejects a definition without a title", () => {
        const { definition, diagnostics } = parseDefinition({ data: "d", y: ["a"] })
        expect(definition).toBeNull()
        expect(diagnostics.some((d) => d.severity === "error" && d.message.includes("title"))).toBe(true)
    })

    it("rejects a definition without a data reference", () => {
        const { definition, diagnostics } = parseDefinition({ title: "T", y: ["a"] })
        expect(definition).toBeNull()
        expect(diagnostics.some((d) => d.severity === "error" && d.message.includes("data"))).toBe(true)
    })

    it("rejects a definition without y columns", () => {
        const { definition, diagnostics } = parseDefinition({ title: "T", data: "d" })
        expect(definition).toBeNull()
        expect(diagnostics.some((d) => d.severity === "error" && d.message.includes("y"))).toBe(true)
    })

    it("rejects an empty y array", () => {
        const { definition, diagnostics } = parseDefinition({ title: "T", data: "d", y: [] })
        expect(definition).toBeNull()
        expect(diagnostics.some((d) => d.severity === "error")).toBe(true)
    })

    it("rejects a non-object definition", () => {
        const { definition, diagnostics } = parseDefinition("not a definition")
        expect(definition).toBeNull()
        expect(diagnostics[0].severity).toBe("error")
    })
})

describe("parseDefinition unknown fields (spec 02 §4)", () => {
    it("warns about unknown top-level fields instead of silently ignoring them", () => {
        const { definition, diagnostics } = parseDefinition({ ...minimal, notARealField: "gdp" })
        expect(definition).not.toBeNull()
        expect(diagnostics).toEqual([
            expect.objectContaining({
                severity: "warning",
                code: "unknown-definition-field",
                context: { field: "notARealField" },
            }),
        ])
    })

    it("warns about unknown fields inside binding overrides", () => {
        const { definition, diagnostics } = parseDefinition({
            ...minimal,
            bindings: { spending: { wat: 1 } },
        })
        expect(definition).not.toBeNull()
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "warning", code: "unknown-definition-field" }),
        ])
        expect(diagnostics[0].message).toContain("spending")
    })

    it("warns about unknown fields inside axis configs", () => {
        const { diagnostics } = parseDefinition({ ...minimal, yAxis: { min: 0, gridlines: "dotted" } })
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "warning", code: "unknown-definition-field" }),
        ])
    })
})

describe("parseDefinition time forms (spec 02 §1)", () => {
    it("expands a single numeric time to a collapsed selection", () => {
        const { definition } = parseDefinition({ ...minimal, time: 2024 })
        expect(definition!.time).toEqual({ start: 2024, end: 2024 })
    })

    it('expands "latest" to a collapsed selection at latest', () => {
        const { definition } = parseDefinition({ ...minimal, time: "latest" })
        expect(definition!.time).toEqual({ start: "latest", end: "latest" })
    })

    it("accepts a [start, end] pair", () => {
        const { definition } = parseDefinition({ ...minimal, time: ["earliest", 2024] })
        expect(definition!.time).toEqual({ start: "earliest", end: 2024 })
    })

    it("accepts a {start, end} object", () => {
        const { definition } = parseDefinition({ ...minimal, time: { start: 2010, end: "latest" } })
        expect(definition!.time).toEqual({ start: 2010, end: "latest" })
    })

    it("carries grain-encoded strings verbatim until the grain is known", () => {
        const { definition, diagnostics } = parseDefinition({ ...minimal, time: ["2014-15", "2024-25"] })
        expect(diagnostics).toEqual([])
        expect(definition!.time).toEqual({ start: "2014-15", end: "2024-25" })
    })
})

describe("resolveDefinitionTimes", () => {
    it("resolves fiscal-year strings to start-year ordinals", () => {
        const { definition } = parseDefinition({ ...minimal, time: ["2014-15", "2024-25"] })
        const resolved = resolveDefinitionTimes(definition!, "fiscal-year")
        expect(resolved.diagnostics).toEqual([])
        expect(resolved.definition.time).toEqual({ start: 2014, end: 2024 })
    })

    it("leaves numbers and earliest/latest keywords untouched", () => {
        const { definition } = parseDefinition({ ...minimal, time: ["earliest", 2020], timelineRange: [2000, "latest"] })
        const resolved = resolveDefinitionTimes(definition!, "year")
        expect(resolved.diagnostics).toEqual([])
        expect(resolved.definition.time).toEqual({ start: "earliest", end: 2020 })
        expect(resolved.definition.timelineRange).toEqual({ start: 2000, end: "latest" })
    })

    it("resolves timelineRange strings under the grain too", () => {
        const { definition } = parseDefinition({ ...minimal, timelineRange: ["2019-20", "2023-24"] })
        const resolved = resolveDefinitionTimes(definition!, "fiscal-year")
        expect(resolved.definition.timelineRange).toEqual({ start: 2019, end: 2023 })
    })

    it("drops a selection with an invalid bound and reports an error", () => {
        const { definition } = parseDefinition({ ...minimal, time: ["banana", "2024-25"] })
        const resolved = resolveDefinitionTimes(definition!, "fiscal-year")
        expect(resolved.definition.time).toBeUndefined()
        expect(resolved.diagnostics).toEqual([
            expect.objectContaining({ severity: "error", code: "bad-time-bound" }),
        ])
    })

    it("rejects strings that do not match the dataset's grain", () => {
        // "2014-15" is a fiscal-year encoding; under the year grain it is invalid.
        const { definition } = parseDefinition({ ...minimal, time: "2014-15" })
        const resolved = resolveDefinitionTimes(definition!, "year")
        expect(resolved.definition.time).toBeUndefined()
        expect(resolved.diagnostics[0].code).toBe("bad-time-bound")
    })

    it("does not mutate the input definition", () => {
        const { definition } = parseDefinition({ ...minimal, time: "2014-15" })
        resolveDefinitionTimes(definition!, "fiscal-year")
        expect(definition!.time).toEqual({ start: "2014-15", end: "2014-15" })
    })
})

describe("parseDefinition versioning", () => {
    it("rejects definitions from a future schema version", () => {
        const { definition, diagnostics } = parseDefinition({ ...minimal, schemaVersion: 99 })
        expect(definition).toBeNull()
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "error", code: "unknown-schema-version" }),
        ])
    })

    it("treats a missing schemaVersion as version 1", () => {
        const { definition } = parseDefinition(minimal)
        expect(definition!.schemaVersion).toBe(1)
    })
})
