import { describe, expect, it } from "vitest"
import {
    createChartModel,
    createDataset,
    decodeViewState,
    encodeViewState,
    formatTime,
    getTimesForDataset,
    renderChartSvg,
    validateDataset,
} from "."
import type { ChartDefinition, ChartDataset } from "./types"

const dataset = createDataset({
    manifest: {
        name: "provincial-budgets",
        timeGrain: "fiscal-year",
        entity: { label: "province", labelPlural: "provinces", kind: "province" },
        columns: {
            spending: {
                name: "Total spending",
                type: "currency",
                shortUnit: "$",
                currency: "CAD",
                decimals: 1,
            },
            population: {
                name: "Population",
                type: "numeric",
            },
            spending_per_person: {
                name: "Spending per person",
                type: "currency",
                currency: "CAD",
                denominator: "population",
                displayFactor: 1000000000,
                decimals: 0,
            },
        },
        sources: [{ name: "Fixture source" }],
        entities: [{ name: "Ontario", colour: "#356643" }],
    },
    rows: [
        { entity: "Ontario", time: "2023-24", spending: 189.1, population: 15.1, spending_per_person: 189.1 },
        { entity: "Ontario", time: "2024-25", spending: 198.4, population: 15.4, spending_per_person: 198.4 },
        { entity: "Quebec", time: "2023-24", spending: 127, population: 8.9, spending_per_person: 127 },
        { entity: "Quebec", time: "2024-25", spending: null, population: 9.0, spending_per_person: null },
    ],
})

const definition: ChartDefinition = {
    title: "Provincial spending",
    y: "spending",
    types: ["line", "discrete-bar"],
    selectedEntities: ["Ontario", "Quebec"],
}

describe("charts3 core vertical slice", () => {
    it("validates tidy datasets and preserves missing cells", () => {
        const result = validateDataset(dataset)
        expect(result.ok).toBe(true)

        const model = createChartModel(definition, dataset, {
            state: { tab: "discrete-bar", time: "2024-25" },
        })
        const quebec = model.series.find((series) => series.id === "Quebec")
        expect(quebec?.points[0].value).toBe(null)
        expect(model.table.rows.find((row) => row.entity === "Quebec" && row.time === "2024-25")?.formatted).toBe("No data")
    })

    it("sorts and formats fiscal years deterministically", () => {
        expect(getTimesForDataset(dataset)).toEqual(["2023-24", "2024-25"])
        expect(formatTime("2024-25", "fiscal-year")).toBe("2024\u201325")
    })

    it("round-trips URL view state", () => {
        const model = createChartModel(definition, dataset, {
            state: { tab: "line", time: ["2023-24", "2024-25"], selectedEntities: ["Ontario"] },
        })
        const encoded = encodeViewState(model.state)
        expect(decodeViewState(encoded)).toMatchObject({
            tab: "line",
            time: ["2023-24", "2024-25"],
            selectedEntities: ["Ontario"],
        })
    })

    it("renders byte-identical SVG for repeated inputs", () => {
        const first = renderChartSvg(definition, dataset, {
            state: { tab: "line", time: ["2023-24", "2024-25"] },
            size: { width: 640, height: 420 },
        })
        const second = renderChartSvg(definition, dataset, {
            state: { tab: "line", time: ["2023-24", "2024-25"] },
            size: { width: 640, height: 420 },
        })

        expect(first).toBe(second)
        expect(first).toContain("<svg")
        expect(first).toContain("Provincial spending, 2023\u201324 to 2024\u201325")
        expect(first).toContain("Fixture source")
    })

    it("supports denominator-derived values in the computed model", () => {
        const derivedDefinition: ChartDefinition = {
            title: "Spending per person",
            y: "spending_per_person",
            types: ["discrete-bar"],
            selectedEntities: ["Ontario"],
            time: "2024-25",
        }
        const model = createChartModel(derivedDefinition, dataset)
        expect(model.series[0].points[0].denominatorValue).toBe(15.4)
        expect(model.series[0].points[0].value).toBeCloseTo(12.8831)
    })
})

describe("charts3 validation failures", () => {
    it("reports duplicate rows and invalid numeric cells at once", () => {
        const invalid: ChartDataset = createDataset({
            manifest: {
                name: "bad",
                timeGrain: "year",
                columns: { value: { type: "numeric" } },
            },
            rows: [
                { entity: "A", time: 2024, value: "x" },
                { entity: "A", time: 2024, value: 1 },
            ],
        })
        const result = validateDataset(invalid)
        expect(result.ok).toBe(false)
        expect(result.issues.map((issue) => issue.message)).toContain("Duplicate entity/time row")
        expect(result.issues.map((issue) => issue.message)).toContain("Numeric column contains a non-numeric value")
    })
})
