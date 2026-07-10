import { describe, expect, it } from "vitest"

import { federalDepartments } from "../../fixtures/federal-departments.ts"
import { buildDataset, buildEntityResolver } from "./dataset.ts"
import { parseManifest } from "./manifest.ts"
import { parseCsv } from "./parse.ts"

function load(rawManifest: Record<string, unknown>, csv: string) {
    const { manifest, diagnostics } = parseManifest(rawManifest)
    if (manifest === null) throw new Error(diagnostics.map((d) => d.message).join("; "))
    const parsed = parseCsv(csv, manifest)
    return { manifest, ...buildDataset(manifest, parsed.rows) }
}

const simpleManifest = {
    name: "test",
    timeGrain: "year",
    columns: { spending: {} },
}

describe("buildDataset", () => {
    it("orders entities by first appearance", () => {
        const { dataset } = load(
            simpleManifest,
            "entity,time,spending\nQuebec,2021,1\nOntario,2020,2\nQuebec,2020,3\nAlberta,2021,4\n",
        )
        expect(dataset.entities).toEqual(["Quebec", "Ontario", "Alberta"])
    })

    it("collects sorted unique time ordinals", () => {
        const { dataset } = load(
            simpleManifest,
            "entity,time,spending\nQuebec,2021,1\nOntario,2019,2\nQuebec,2019,3\nQuebec,2023,4\n",
        )
        expect(dataset.times).toEqual([2019, 2021, 2023])
    })

    it("aligns column values with rowIndexOf", () => {
        const { dataset } = load(simpleManifest, "entity,time,spending\nQuebec,2021,1.5\nOntario,2020,\n")
        const spending = dataset.columns.get("spending")!
        const quebecRow = dataset.rowIndexOf("Quebec", 2021)
        const ontarioRow = dataset.rowIndexOf("Ontario", 2020)
        expect(spending.values[quebecRow]).toBe(1.5)
        expect(spending.values[ontarioRow]).toBeNull()
    })

    it("returns -1 for unknown (entity, time) lookups", () => {
        const { dataset } = load(simpleManifest, "entity,time,spending\nQuebec,2021,1\n")
        expect(dataset.rowIndexOf("Quebec", 2020)).toBe(-1)
        expect(dataset.rowIndexOf("Ontario", 2021)).toBe(-1)
    })

    it("flags duplicate (entity, time) rows and keeps the first", () => {
        const { dataset, diagnostics } = load(
            simpleManifest,
            "entity,time,spending\nQuebec,2021,1\nQuebec,2021,2\n",
        )
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({
            severity: "error",
            code: "duplicate-row",
            context: { row: 2, firstRow: 1, entity: "Quebec", time: 2021 },
        })
        const spending = dataset.columns.get("spending")!
        expect(spending.values[dataset.rowIndexOf("Quebec", 2021)]).toBe(1)
    })

    it("flags unparseable times and skips those rows", () => {
        const { dataset, diagnostics } = load(
            simpleManifest,
            "entity,time,spending\nQuebec,2021,1\nOntario,not-a-year,2\n",
        )
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({ severity: "error", code: "bad-time", context: { row: 2 } })
        expect(dataset.entities).toEqual(["Quebec"])
    })

    it("builds none-grain datasets with empty times and null-time row lookup", () => {
        const { dataset } = load(
            { name: "snapshot", timeGrain: "none", columns: { population: {} } },
            "entity,population\nOntario,100\nQuebec,200\n",
        )
        expect(dataset.times).toEqual([])
        expect(dataset.rowIndexOf("Quebec", null)).toBeGreaterThanOrEqual(0)
        expect(dataset.columns.get("population")!.values[dataset.rowIndexOf("Quebec", null)]).toBe(200)
    })

    it("treats undeclared CSV columns as absent from the dataset", () => {
        const { dataset } = load(simpleManifest, "entity,time,spending,mystery\nQuebec,2021,1,9\n")
        expect(dataset.columns.has("mystery")).toBe(false)
    })
})

describe("entity alias resolution", () => {
    it("resolves aliases and French names to the canonical entity", () => {
        const resolve = buildEntityResolver({
            name: "test",
            timeGrain: "year",
            fiscalYearStartMonth: 4,
            entity: { label: "province", labelPlural: "provinces" },
            columns: {},
            entities: [{ name: "Quebec", nameFr: "Québec", aliases: ["QC", "Province of Quebec"] }],
            sources: [],
        })
        expect(resolve("Quebec")).toBe("Quebec")
        expect(resolve("Québec")).toBe("Quebec")
        expect(resolve("QC")).toBe("Quebec")
        expect(resolve("Province of Quebec")).toBe("Quebec")
        expect(resolve("Ontario")).toBe("Ontario") // unknown names pass through
    })

    it("merges aliased rows into one entity series (federal-departments fixture)", () => {
        const { manifest } = parseManifest(federalDepartments.manifest)
        const parsed = parseCsv(federalDepartments.csv, manifest!)
        const { dataset, diagnostics } = buildDataset(manifest!, parsed.rows)

        expect(diagnostics).toEqual([])
        expect(dataset.entities).toHaveLength(15)
        expect(dataset.entities).not.toContain("Industry Canada")
        expect(dataset.entities).not.toContain("DFAIT")

        // "Industry Canada" 2019-20/2020-21 rows landed under the canonical name
        const ised = "Innovation, Science and Economic Development Canada"
        const spending = dataset.columns.get("spending")!
        expect(spending.values[dataset.rowIndexOf(ised, 2019)]).toBe(50)
        expect(spending.values[dataset.rowIndexOf(ised, 2023)]).toBe(54)
        expect(spending.values[dataset.rowIndexOf("Global Affairs Canada", 2019)]).toBe(60)
    })
})
