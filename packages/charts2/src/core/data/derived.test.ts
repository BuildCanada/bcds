import { describe, expect, it } from "vitest"

import type { Dataset } from "../types.ts"
import { buildDataset } from "./dataset.ts"
import { resolveValue } from "./derived.ts"
import { parseManifest } from "./manifest.ts"
import { parseCsv } from "./parse.ts"

function makeDataset(rawManifest: Record<string, unknown>, csv: string): Dataset {
    const { manifest, diagnostics } = parseManifest(rawManifest)
    if (manifest === null) throw new Error(diagnostics.map((d) => d.message).join("; "))
    const parsed = parseCsv(csv, manifest)
    return buildDataset(manifest, parsed.rows).dataset
}

const debtManifest = {
    name: "debt",
    timeGrain: "year",
    columns: {
        debt: { denominator: "gdp", derivedUnit: "% of GDP", displayFactor: 100 },
        gdp: {},
        plain: {},
    },
}

const debtCsv = `entity,time,debt,gdp,plain
Canada,2019,1100,2200,7
Canada,2020,1200,2000,8
Canada,2021,1224,,9
Canada,2022,,2500,10
`

describe("resolveValue without a denominator", () => {
    const dataset = makeDataset(debtManifest, debtCsv)

    it("returns the raw value times displayFactor (default 1)", () => {
        expect(resolveValue(dataset, "plain", "Canada", 2019)).toEqual({
            status: "value",
            value: 7,
            time: 2019,
            sourceTime: 2019,
            projected: false,
            interpolated: false,
        })
    })

    it("applies displayFactor to plain columns", () => {
        expect(resolveValue(dataset, "plain", "Canada", 2019, { displayFactor: 1000 })).toMatchObject({
            status: "value",
            value: 7000,
        })
    })

    it("is missing (no-data), never zero, for an absent cell", () => {
        expect(resolveValue(dataset, "debt", "Canada", 2022)).toEqual({ status: "missing", reason: "no-data" })
    })

    it("is missing (no-data) for an unknown entity or column", () => {
        expect(resolveValue(dataset, "plain", "Atlantis", 2019)).toEqual({ status: "missing", reason: "no-data" })
        expect(resolveValue(dataset, "nope", "Canada", 2019)).toEqual({ status: "missing", reason: "no-data" })
    })
})

describe("resolveValue with a denominator (spec 01 §7)", () => {
    const dataset = makeDataset(debtManifest, debtCsv)

    it("divides per (entity, time) and applies displayFactor AFTER division", () => {
        const resolved = resolveValue(dataset, "debt", "Canada", 2019)
        expect(resolved).toEqual({
            status: "value",
            value: 50, // 1100 / 2200 × 100
            time: 2019,
            sourceTime: 2019,
            projected: false,
            interpolated: false,
            raw: { numerator: 1100, denominator: 2200 },
        })
    })

    it("attaches the unscaled numerator and denominator for auditability", () => {
        const resolved = resolveValue(dataset, "debt", "Canada", 2020)
        expect(resolved).toMatchObject({ value: 60, raw: { numerator: 1200, denominator: 2000 } })
    })

    it("is missing (zero-denominator) when the denominator is missing after tolerance", () => {
        expect(resolveValue(dataset, "debt", "Canada", 2021)).toEqual({
            status: "missing",
            reason: "zero-denominator",
        })
    })

    it("is missing (zero-denominator) when the denominator is zero — never Infinity", () => {
        const zeroDataset = makeDataset(debtManifest, "entity,time,debt,gdp,plain\nCanada,2019,1100,0,7\n")
        expect(resolveValue(zeroDataset, "debt", "Canada", 2019)).toEqual({
            status: "missing",
            reason: "zero-denominator",
        })
    })

    it("is missing (no-data) when the numerator is missing, even if the denominator is too", () => {
        const bothMissing = makeDataset(debtManifest, "entity,time,debt,gdp,plain\nCanada,2019,,,7\n")
        expect(resolveValue(bothMissing, "debt", "Canada", 2019)).toEqual({ status: "missing", reason: "no-data" })
    })

    it("resolves the denominator with the DENOMINATOR column's own tolerance", () => {
        const tolerant = makeDataset(
            {
                name: "debt",
                timeGrain: "year",
                columns: {
                    debt: { denominator: "gdp", displayFactor: 100 },
                    gdp: { tolerance: 1 },
                },
            },
            "entity,time,debt,gdp\nCanada,2019,1100,2200\nCanada,2020,1200,\n",
        )
        // gdp missing at 2020 borrows 2019's 2200 via its own tolerance
        expect(resolveValue(tolerant, "debt", "Canada", 2020)).toMatchObject({
            status: "value",
            value: (1200 / 2200) * 100,
            raw: { numerator: 1200, denominator: 2200 },
        })
    })
})

describe("resolveValue tolerance and overrides", () => {
    const tolerantManifest = {
        name: "test",
        timeGrain: "year",
        columns: { spending: { tolerance: 2, toleranceDirection: "backwards" } },
    }
    const csv = "entity,time,spending\nCanada,2019,10\nCanada,2020,\nCanada,2021,\n"

    it("borrows within the column's tolerance and reports the sourceTime", () => {
        const dataset = makeDataset(tolerantManifest, csv)
        expect(resolveValue(dataset, "spending", "Canada", 2021)).toEqual({
            status: "value",
            value: 10,
            time: 2021,
            sourceTime: 2019,
            projected: false,
            interpolated: false,
        })
    })

    it("per-binding overrides replace the column's tolerance", () => {
        const dataset = makeDataset(tolerantManifest, csv)
        expect(resolveValue(dataset, "spending", "Canada", 2021, { tolerance: 0 })).toEqual({
            status: "missing",
            reason: "no-data",
        })
    })
})

describe("resolveValue projection flags", () => {
    it("marks every value of a projection: true column", () => {
        const dataset = makeDataset(
            { name: "test", timeGrain: "year", columns: { forecast: { projection: true } } },
            "entity,time,forecast\nCanada,2019,1\n",
        )
        expect(resolveValue(dataset, "forecast", "Canada", 2019)).toMatchObject({ projected: true })
    })

    it("marks values at/after projectionFrom, judged on the sourceTime", () => {
        const dataset = makeDataset(
            { name: "test", timeGrain: "year", columns: { spending: { projectionFrom: 2021, tolerance: 1 } } },
            "entity,time,spending\nCanada,2020,10\nCanada,2021,11\nCanada,2022,\n",
        )
        expect(resolveValue(dataset, "spending", "Canada", 2020)).toMatchObject({ projected: false })
        expect(resolveValue(dataset, "spending", "Canada", 2021)).toMatchObject({ projected: true })
        // 2022 borrows from 2021 (sourceTime 2021 >= projectionFrom 2021) → projected
        expect(resolveValue(dataset, "spending", "Canada", 2022)).toMatchObject({
            projected: true,
            sourceTime: 2021,
        })
    })
})

describe("resolveValue on a none-grain dataset", () => {
    const dataset = makeDataset(
        { name: "snapshot", timeGrain: "none", columns: { population: {} } },
        "entity,population\nOntario,15608000\nQuebec,\n",
    )

    it("resolves cells with a null time", () => {
        expect(resolveValue(dataset, "population", "Ontario", null)).toMatchObject({
            status: "value",
            value: 15608000,
            time: 0,
            sourceTime: 0,
        })
    })

    it("missing cells stay missing", () => {
        expect(resolveValue(dataset, "population", "Quebec", null)).toEqual({
            status: "missing",
            reason: "no-data",
        })
    })
})
