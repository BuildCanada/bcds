import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../fixtures/index.ts"
import { parseDefinition } from "../definition/schema.ts"
import { defaultMeasurer } from "../text/createMeasurer.ts"
import { buildCanadaTheme } from "../theme/themes.ts"
import type { ChartDefinition, ViewState } from "../types.ts"
import { buildContext, type LayoutContext } from "./context.ts"
import { buildSeriesModels, toRelativeLineSeries, toShareOfTotalSeries } from "./series.ts"

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

function ctxFor(fixture: FixtureName, raw: Record<string, unknown>, view?: ViewState): LayoutContext {
    const { dataset } = loadFixtureDataset(fixture)
    return buildContext({ definition: definitionFor(raw), dataset, view, theme: buildCanadaTheme, measurer: defaultMeasurer })
}

describe("series strategy truth table (spec 11)", () => {
    it("one metric → each entity is a series", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["total_spending"], selectedEntities: ["Ontario", "Quebec"] })
        const { series, strategy } = buildSeriesModels(ctx, "line")
        expect(strategy).toBe("entity")
        expect(series.map((s) => s.key)).toEqual(["Ontario", "Quebec"])
    })

    it("multiple metrics, one entity → each metric is a series", () => {
        const ctx = ctxFor("government-debt", { y: ["federal_debt", "provincial_debt", "municipal_debt"] })
        const { series, strategy } = buildSeriesModels(ctx, "line")
        expect(strategy).toBe("metric")
        expect(series.map((s) => s.key)).toEqual(["federal_debt", "provincial_debt", "municipal_debt"])
        expect(series.map((s) => s.label)).toEqual(["Federal debt", "Provincial debt", "Municipal debt"])
    })

    it("multiple metrics × multiple entities → 'Entity – Metric' series", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending", "program_spending"],
            selectedEntities: ["Ontario", "Quebec"],
        })
        const { series } = buildSeriesModels(ctx, "line")
        expect(series.map((s) => s.key)).toEqual([
            "Ontario – total_spending",
            "Ontario – program_spending",
            "Quebec – total_spending",
            "Quebec – program_spending",
        ])
        expect(series[0].label).toBe("Ontario – Total spending")
    })

    it("definition.seriesStrategy overrides the heuristic", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending", "program_spending"],
            selectedEntities: ["Ontario", "Quebec"],
            seriesStrategy: "entity",
        })
        const { series, strategy } = buildSeriesModels(ctx, "line")
        expect(strategy).toBe("entity")
        expect(series.map((s) => s.key)).toEqual(["Ontario", "Quebec"])
    })

    it("stacked-discrete-bar always uses metric series", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Ontario"],
            seriesStrategy: "entity",
        })
        const { strategy } = buildSeriesModels(ctx, "stacked-discrete-bar")
        expect(strategy).toBe("metric")
    })
})

describe("buildSeriesModels data handling", () => {
    it("reads every value through resolveValue and carries sourceTime for borrowed cells", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["debt_charges"], selectedEntities: ["Quebec"] })
        const { series } = buildSeriesModels(ctx, "line")
        const borrowed = series[0].points.find((p) => p.time === 2024)
        expect(borrowed).toBeDefined()
        expect(borrowed?.sourceTime).toBe(2023) // tolerance 2 borrows from 2023-24
        expect(borrowed?.value).toBeCloseTo(9.3)
    })

    it("missing values never appear as zero points", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["program_spending"], selectedEntities: ["Nova Scotia"] })
        const { series } = buildSeriesModels(ctx, "line")
        expect(series[0].points.some((p) => p.time === 2022)).toBe(false)
        expect(series[0].points.length).toBe(5)
    })

    it("missingData hide drops gapped series with a warning", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["program_spending"],
            selectedEntities: ["Ontario", "Nova Scotia"],
            missingData: "hide",
        })
        const { series, diagnostics } = buildSeriesModels(ctx, "line")
        expect(series.map((s) => s.key)).toEqual(["Ontario"])
        expect(diagnostics.some((d) => d.code === "series-hidden-missing-data")).toBe(true)
    })

    it("applies fixed entity colours ahead of palette assignment", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Ontario", "Quebec"],
            entityColours: { Ontario: "#123456" },
        })
        const { series } = buildSeriesModels(ctx, "line")
        expect(series[0].colour).toBe("#123456")
        expect(series[1].colour).not.toBe("#123456")
    })

    it("supports datasets without a time dimension", () => {
        const ctx = ctxFor("population-snapshot", { y: ["population"], selectedEntities: ["Ontario", "Yukon"] })
        const { series } = buildSeriesModels(ctx, "discrete-bar")
        expect(series.length).toBe(2)
        expect(series[0].points[0].time).toBe(null)
        expect(series[0].points[0].value).toBe(15608000)
    })
})

describe("relative transforms", () => {
    it("line relative mode rebases to cumulative % change since the window start", () => {
        const ctx = ctxFor("government-debt", { y: ["federal_debt"] })
        const { series } = buildSeriesModels(ctx, "line")
        const { series: relative } = toRelativeLineSeries(series)
        // federal % of GDP: 50, 60, 51, 50, 48 → 0, +20, +2, 0, −4
        const values = relative[0].points.map((p) => p.value)
        expect(values[0]).toBeCloseTo(0)
        expect(values[1]).toBeCloseTo(20)
        expect(values[2]).toBeCloseTo(2)
        expect(values[3]).toBeCloseTo(0)
        expect(values[4]).toBeCloseTo(-4)
    })

    it("hides zero-base series in relative mode instead of dividing by zero", () => {
        const series = [
            { key: "a", label: "a", colour: "#000", points: [{ time: 1, value: 0 }, { time: 2, value: 5 }] },
        ]
        const { series: out, diagnostics } = toRelativeLineSeries(series)
        expect(out).toEqual([])
        expect(diagnostics[0]?.code).toBe("relative-zero-base")
    })

    it("share-of-total uses absolute weights and preserves sign", () => {
        const series = [
            { key: "a", label: "a", colour: "#000", points: [{ time: 1, value: 30 }] },
            { key: "b", label: "b", colour: "#000", points: [{ time: 1, value: -10 }] },
        ]
        const out = toShareOfTotalSeries(series)
        expect(out[0].points[0].value).toBeCloseTo(75)
        expect(out[1].points[0].value).toBeCloseTo(-25)
    })
})
