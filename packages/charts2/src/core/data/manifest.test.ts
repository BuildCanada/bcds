import { describe, expect, it } from "vitest"

import { parseManifest } from "./manifest.ts"

const minimal = {
    name: "test",
    timeGrain: "year",
    columns: { total_spending: {} },
}

describe("parseManifest defaults", () => {
    it("applies column defaults: displayFactor 1, tolerance 0, direction both, projection false", () => {
        const { manifest, diagnostics } = parseManifest(minimal)
        expect(diagnostics).toEqual([])
        const column = manifest!.columns.total_spending
        expect(column.displayFactor).toBe(1)
        expect(column.tolerance).toBe(0)
        expect(column.toleranceDirection).toBe("both")
        expect(column.projection).toBe(false)
        expect(column.type).toBe("numeric")
    })

    it("defaults the column name to the slug, title-cased", () => {
        const { manifest } = parseManifest(minimal)
        expect(manifest!.columns.total_spending.name).toBe("Total Spending")
    })

    it("defaults fiscalYearStartMonth to 4 (April)", () => {
        const { manifest } = parseManifest(minimal)
        expect(manifest!.fiscalYearStartMonth).toBe(4)
    })

    it("defaults sources to an empty list", () => {
        const { manifest } = parseManifest(minimal)
        expect(manifest!.sources).toEqual([])
    })

    it("derives labelPlural from label when missing", () => {
        const { manifest } = parseManifest({ ...minimal, entity: { label: "province" } })
        expect(manifest!.entity.labelPlural).toBe("provinces")
        const withY = parseManifest({ ...minimal, entity: { label: "category" } })
        expect(withY.manifest!.entity.labelPlural).toBe("categories")
    })

    it("defaults the entity labels entirely when entity is absent", () => {
        const { manifest } = parseManifest(minimal)
        expect(manifest!.entity.label).toBe("entity")
        expect(manifest!.entity.labelPlural).toBe("entities")
    })

    it("keeps an explicit labelPlural", () => {
        const { manifest } = parseManifest({
            ...minimal,
            entity: { label: "province or territory", labelPlural: "provinces and territories" },
        })
        expect(manifest!.entity.labelPlural).toBe("provinces and territories")
    })
})

describe("parseManifest unknown fields", () => {
    it("warns on unknown top-level fields without rejecting the manifest", () => {
        const { manifest, diagnostics } = parseManifest({ ...minimal, futureFeature: true })
        expect(manifest).not.toBeNull()
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({
            severity: "warning",
            code: "unknown-manifest-field",
            context: { field: "futureFeature" },
        })
    })

    it("warns on unknown column fields with the column slug in context", () => {
        const { manifest, diagnostics } = parseManifest({
            ...minimal,
            columns: { total_spending: { sparkles: "yes" } },
        })
        expect(manifest).not.toBeNull()
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({
            severity: "warning",
            code: "unknown-manifest-field",
            context: { column: "total_spending", field: "sparkles" },
        })
    })
})

describe("parseManifest errors", () => {
    it("rejects non-object input", () => {
        const { manifest, diagnostics } = parseManifest("not a manifest")
        expect(manifest).toBeNull()
        expect(diagnostics[0].severity).toBe("error")
    })

    it("rejects an invalid timeGrain with the path in the message", () => {
        const { manifest, diagnostics } = parseManifest({ ...minimal, timeGrain: "weekly" })
        expect(manifest).toBeNull()
        expect(diagnostics.some((d) => d.severity === "error" && d.message.includes("timeGrain"))).toBe(true)
    })

    it("rejects a missing name", () => {
        const { manifest } = parseManifest({ timeGrain: "year", columns: {} })
        expect(manifest).toBeNull()
    })

    it("rejects fiscalYearStartMonth outside 1-12", () => {
        const { manifest } = parseManifest({ ...minimal, fiscalYearStartMonth: 13 })
        expect(manifest).toBeNull()
    })
})

describe("parseManifest projectionFrom", () => {
    it("parses string projectionFrom values under the manifest's grain", () => {
        const { manifest, diagnostics } = parseManifest({
            name: "test",
            timeGrain: "fiscal-year",
            columns: { spending: { projectionFrom: "2024-25" } },
        })
        expect(diagnostics).toEqual([])
        expect(manifest!.columns.spending.projectionFrom).toBe(2024)
    })

    it("accepts numeric projectionFrom values as ordinals", () => {
        const { manifest } = parseManifest({
            ...minimal,
            columns: { spending: { projectionFrom: 2025 } },
        })
        expect(manifest!.columns.spending.projectionFrom).toBe(2025)
    })

    it("errors when a string projectionFrom does not parse under the grain", () => {
        const { manifest, diagnostics } = parseManifest({
            ...minimal,
            columns: { spending: { projectionFrom: "2024-Q3" } },
        })
        expect(manifest).not.toBeNull()
        expect(manifest!.columns.spending.projectionFrom).toBeUndefined()
        expect(diagnostics.some((d) => d.severity === "error" && d.code === "manifest-invalid")).toBe(true)
    })
})

describe("parseManifest denominators", () => {
    it("warns when a denominator references an undeclared column", () => {
        const { diagnostics } = parseManifest({
            ...minimal,
            columns: { spending: { denominator: "gdp" } },
        })
        expect(diagnostics.some((d) => d.code === "unknown-denominator" && d.severity === "warning")).toBe(true)
    })

    it("accepts a denominator that references a declared column", () => {
        const { diagnostics } = parseManifest({
            ...minimal,
            columns: { spending: { denominator: "gdp" }, gdp: {} },
        })
        expect(diagnostics).toEqual([])
    })
})

describe("parseManifest miscellaneous normalization", () => {
    it("drops explicit null colours (JSON manifests use null for 'theme-assigned')", () => {
        const { manifest } = parseManifest({
            ...minimal,
            columns: { spending: { colour: null } },
        })
        expect(manifest!.columns.spending.colour).toBeUndefined()
    })

    it("passes entities metadata through", () => {
        const { manifest } = parseManifest({
            ...minimal,
            entities: [{ name: "Quebec", nameFr: "Québec", aliases: ["QC"], group: "Central" }],
        })
        expect(manifest!.entities).toEqual([{ name: "Quebec", nameFr: "Québec", aliases: ["QC"], group: "Central" }])
    })
})
