import { describe, expect, it } from "vitest"

import { resolveValue } from "../core/data/derived.ts"
import { parseManifest } from "../core/data/manifest.ts"
import { parseCsv } from "../core/data/parse.ts"
import { validateDataset } from "../core/data/validate.ts"
import { fixtureNames, loadFixture, loadFixtureDataset } from "./index.ts"

describe("fixture corpus", () => {
    it("exposes the five spec-26 fixtures by name", () => {
        expect(fixtureNames.sort()).toEqual([
            "federal-departments",
            "government-debt",
            "pathological",
            "population-snapshot",
            "provincial-budgets",
        ])
    })

    it("every fixture's manifest parses without errors", () => {
        for (const name of fixtureNames) {
            const { manifest, diagnostics } = parseManifest(loadFixture(name).manifest)
            expect(manifest, name).not.toBeNull()
            expect(diagnostics.filter((d) => d.severity === "error"), name).toEqual([])
        }
    })

    it("every fixture except pathological loads and validates clean", () => {
        for (const name of fixtureNames) {
            if (name === "pathological") continue
            const { manifest, dataset, diagnostics } = loadFixtureDataset(name)
            expect(diagnostics, name).toEqual([])
            const parsed = parseCsv(loadFixture(name).csv, manifest)
            expect(validateDataset(manifest, parsed.rows), name).toEqual([])
            expect(dataset.entities.length, name).toBeGreaterThan(0)
        }
    })
})

describe("provincial-budgets", () => {
    const { dataset } = loadFixtureDataset("provincial-budgets")

    it("has 5 provinces × 6 fiscal years", () => {
        expect(dataset.entities).toHaveLength(5)
        expect(dataset.times).toEqual([2019, 2020, 2021, 2022, 2023, 2024])
    })

    it("keeps missing cells missing (program_spending has no tolerance)", () => {
        expect(resolveValue(dataset, "program_spending", "Quebec", 2024)).toEqual({
            status: "missing",
            reason: "no-data",
        })
    })

    it("borrows debt_charges across its tolerance of 2, flagged via sourceTime", () => {
        expect(resolveValue(dataset, "debt_charges", "Quebec", 2024)).toMatchObject({
            status: "value",
            value: 9.3,
            time: 2024,
            sourceTime: 2023,
        })
    })
})

describe("federal-departments", () => {
    const { dataset } = loadFixtureDataset("federal-departments")

    it("has 15 canonical departments × 5 fiscal years", () => {
        expect(dataset.entities).toHaveLength(15)
        expect(dataset.times).toEqual([2019, 2020, 2021, 2022, 2023])
    })

    it("carries portfolio groups on entity metadata", () => {
        const defence = dataset.manifest.entities!.find((e) => e.name === "National Defence")
        expect(defence?.group).toBe("Defence and Security")
    })
})

describe("population-snapshot", () => {
    const { dataset } = loadFixtureDataset("population-snapshot")

    it("has 13 provinces/territories and no time dimension", () => {
        expect(dataset.entities).toHaveLength(13)
        expect(dataset.times).toEqual([])
        expect(resolveValue(dataset, "population", "Nunavut", null)).toMatchObject({ value: 40000 })
    })
})

describe("government-debt", () => {
    const { dataset } = loadFixtureDataset("government-debt")

    it("is a single-entity dataset", () => {
        expect(dataset.entities).toEqual(["Canada"])
    })

    it("derives the hand-computed % of GDP table", () => {
        const expected: Record<string, number[]> = {
            federal_debt: [50, 60, 51, 50, 48],
            provincial_debt: [30, 35, 30, 30, 30],
            municipal_debt: [5, 5, 5, 5, 5],
        }
        for (const [slug, perYear] of Object.entries(expected)) {
            dataset.times.forEach((time, i) => {
                expect(resolveValue(dataset, slug, "Canada", time), `${slug} @ ${time}`).toMatchObject({
                    status: "value",
                    value: perYear[i],
                })
            })
        }
    })

    it("attaches raw numerator/denominator for the tooltip detail line", () => {
        expect(resolveValue(dataset, "federal_debt", "Canada", 2019)).toMatchObject({
            raw: { numerator: 1100, denominator: 2200 },
        })
    })
})

describe("pathological", () => {
    it("loads with the duplicate and non-numeric problems reported", () => {
        const { dataset, diagnostics } = loadFixtureDataset("pathological")
        const codes = diagnostics.map((d) => d.code)
        expect(codes).toContain("duplicate-row")
        expect(codes).toContain("non-numeric-cell")
        // the dataset still builds: first duplicate wins, unicode names intact
        expect(dataset.entities).toContain("Québec")
        expect(dataset.entities).toContain("Î.-P.-É.")
    })

    it("zero denominator yields missing, never Infinity", () => {
        const { dataset } = loadFixtureDataset("pathological")
        expect(resolveValue(dataset, "spending", "Québec", 2023)).toEqual({
            status: "missing",
            reason: "zero-denominator",
        })
    })

    it("the single-time entity resolves at its one time", () => {
        const { dataset } = loadFixtureDataset("pathological")
        expect(resolveValue(dataset, "spending", "Lonely Station", 2021)).toMatchObject({
            status: "value",
            value: 7 / 3,
        })
        expect(resolveValue(dataset, "spending", "Lonely Station", 2022)).toEqual({
            status: "missing",
            reason: "no-data",
        })
    })
})
