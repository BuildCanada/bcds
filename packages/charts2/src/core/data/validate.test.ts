import { describe, expect, it } from "vitest"

import { federalDepartments } from "../../fixtures/federal-departments.ts"
import { pathological } from "../../fixtures/pathological.ts"
import type { Diagnostic } from "../types.ts"
import { parseManifest } from "./manifest.ts"
import { parseCsv } from "./parse.ts"
import { validateDataset } from "./validate.ts"

function validateFixture(rawManifest: Record<string, unknown>, csv: string): Diagnostic[] {
    const { manifest, diagnostics } = parseManifest(rawManifest)
    if (manifest === null) throw new Error(diagnostics.map((d) => d.message).join("; "))
    const parsed = parseCsv(csv, manifest)
    return validateDataset(manifest, parsed.rows)
}

describe("validateDataset on the pathological fixture", () => {
    const diagnostics = validateFixture(pathological.manifest, pathological.csv)

    it("flags the duplicate (Québec, 2021) row with both row references", () => {
        const duplicate = diagnostics.find((d) => d.code === "duplicate-row")
        expect(duplicate).toMatchObject({
            severity: "error",
            context: { row: 3, firstRow: 2, entity: "Québec", time: 2021 },
        })
    })

    it("flags the non-numeric 'n/a' cell with its row and column", () => {
        const nonNumeric = diagnostics.find((d) => d.code === "non-numeric-cell")
        expect(nonNumeric).toMatchObject({
            severity: "error",
            context: { column: "spending", value: "n/a", row: 6 },
        })
    })

    it("flags the zero denominator cell", () => {
        const zero = diagnostics.find((d) => d.code === "zero-denominator")
        expect(zero).toMatchObject({
            severity: "warning",
            context: { column: "population", row: 4 },
        })
    })

    it("reports all problems at once (no early exit)", () => {
        const codes = diagnostics.map((d) => d.code)
        expect(codes).toContain("duplicate-row")
        expect(codes).toContain("non-numeric-cell")
        expect(codes).toContain("zero-denominator")
    })
})

describe("validateDataset column checks", () => {
    const manifest = {
        name: "test",
        timeGrain: "year",
        columns: { spending: {}, ghost: {} },
    }
    const csv = "entity,time,spending,mystery\nQuebec,2021,1,9\n"

    it("errors on declared-but-absent columns", () => {
        const diagnostics = validateFixture(manifest, csv)
        const missing = diagnostics.find((d) => d.code === "missing-column")
        expect(missing).toMatchObject({ severity: "error", context: { column: "ghost" } })
    })

    it("warns on undeclared-but-present columns", () => {
        const diagnostics = validateFixture(manifest, csv)
        const undeclared = diagnostics.find((d) => d.code === "undeclared-column")
        expect(undeclared).toMatchObject({ severity: "warning", context: { column: "mystery" } })
    })

    it("does not warn about entity, time, or declared dimension columns", () => {
        const diagnostics = validateFixture(
            { name: "test", timeGrain: "year", columns: { spending: {} }, dimensions: ["category"] },
            "entity,time,category,spending\nQuebec,2021,Health,1\n",
        )
        expect(diagnostics).toEqual([])
    })

    it("errors when the time column is absent under a time grain", () => {
        const diagnostics = validateFixture(
            { name: "test", timeGrain: "year", columns: { spending: {} } },
            "entity,spending\nQuebec,1\n",
        )
        expect(diagnostics.some((d) => d.code === "missing-column" && d.context?.column === "time")).toBe(true)
    })

    it("warns when a time column is present under grain none", () => {
        const diagnostics = validateFixture(
            { name: "test", timeGrain: "none", columns: { spending: {} } },
            "entity,time,spending\nQuebec,2021,1\n",
        )
        expect(diagnostics.some((d) => d.code === "unexpected-time-column" && d.severity === "warning")).toBe(true)
    })
})

describe("validateDataset time checks", () => {
    it("flags every row whose time fails to parse under the declared grain", () => {
        const diagnostics = validateFixture(
            { name: "test", timeGrain: "fiscal-year", columns: { spending: {} } },
            "entity,time,spending\nQuebec,2021-22,1\nQuebec,2021,2\nQuebec,2021-23,3\n",
        )
        const badTimes = diagnostics.filter((d) => d.code === "bad-time")
        expect(badTimes).toHaveLength(2)
        expect(badTimes[0].context).toMatchObject({ row: 2, value: "2021" })
        expect(badTimes[1].context).toMatchObject({ row: 3, value: "2021-23" })
    })

    it("detects duplicates on none-grain datasets by entity alone", () => {
        const diagnostics = validateFixture(
            { name: "test", timeGrain: "none", columns: { spending: {} } },
            "entity,spending\nQuebec,1\nQuebec,2\n",
        )
        expect(diagnostics.some((d) => d.code === "duplicate-row" && d.context?.row === 2)).toBe(true)
    })
})

describe("validateDataset entity resolution", () => {
    it("resolves aliases before duplicate detection", () => {
        const diagnostics = validateFixture(
            {
                name: "test",
                timeGrain: "year",
                columns: { spending: {} },
                entities: [{ name: "Quebec", aliases: ["QC"] }],
            },
            "entity,time,spending\nQuebec,2021,1\nQC,2021,2\n",
        )
        expect(diagnostics.some((d) => d.code === "duplicate-row")).toBe(true)
    })

    it("warns once, listing all unknown entities, when the manifest declares an entities list", () => {
        const { manifest } = parseManifest(federalDepartments.manifest)
        const parsed = parseCsv(
            federalDepartments.csv + "Ministry of Silly Walks,2019-20,1\nDepartment of Mystery,2019-20,2\n",
            manifest!,
        )
        const diagnostics = validateDataset(manifest!, parsed.rows)
        const unknown = diagnostics.filter((d) => d.code === "unknown-entities")
        expect(unknown).toHaveLength(1)
        expect(unknown[0]).toMatchObject({
            severity: "warning",
            context: { entities: "Ministry of Silly Walks, Department of Mystery", count: 2 },
        })
    })

    it("does not warn about entities when the manifest has no entities list", () => {
        const diagnostics = validateFixture(
            { name: "test", timeGrain: "year", columns: { spending: {} } },
            "entity,time,spending\nAnybody,2021,1\n",
        )
        expect(diagnostics).toEqual([])
    })
})
