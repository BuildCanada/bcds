import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect } from "../../scene/nodes.ts"
import type { ChartDefinition, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import type { ChartLayerOptions } from "./shared.ts"
import { layoutStackedBar } from "./stackedBar.ts"
import { layoutStackedDiscreteBar } from "./stackedDiscreteBar.ts"

const AREA: Rect = { x: 0, y: 0, width: 800, height: 500 }
const OPTS: ChartLayerOptions = { legendReserved: true, thumbnail: false, fontScale: 1 }

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

function ctxFor(fixture: FixtureName, raw: Record<string, unknown>, view?: ViewState): LayoutContext {
    const { dataset } = loadFixtureDataset(fixture)
    return buildContext({ definition: definitionFor(raw), dataset, view, theme: buildCanadaTheme, measurer: defaultMeasurer })
}

describe("stacked discrete bar negative offsets (OWID contract, spec 16)", () => {
    it("gives a negative segment valueOffset 0 when it is the first negative", () => {
        const ctx = ctxFor("pathological", {
            y: ["spending", "negatives"],
            selectedEntities: ["Québec"],
            time: 2021,
            types: ["stacked-discrete-bar"],
        })
        const layer = layoutStackedDiscreteBar(ctx, AREA, OPTS)
        const spending = layer.series.find((s) => s.key === "spending")
        const negatives = layer.series.find((s) => s.key === "negatives")
        expect(spending?.points[0].value).toBeCloseTo(2) // 110 ÷ 55 per person
        expect(spending?.points[0].valueOffset).toBe(0)
        expect(negatives?.points[0].value).toBeCloseTo(-6)
        expect(negatives?.points[0].valueOffset).toBe(0) // negatives offset independently
    })
})

describe("stacked discrete bar partial entities (spec 16)", () => {
    it("renders partial stacks with the missing segments flagged in the tooltip", () => {
        const ctx = ctxFor("pathological", {
            y: ["spending", "negatives"],
            selectedEntities: ["Québec"],
            time: 2023, // population 0 → spending per person missing
            types: ["stacked-discrete-bar"],
        })
        const layer = layoutStackedDiscreteBar(ctx, AREA, OPTS)
        expect(layer.nodes.some((n) => n.key === "series/spending/bar/Québec")).toBe(false)
        expect(layer.nodes.some((n) => n.key === "series/negatives/bar/Québec")).toBe(true)
        const target = layer.hover.targets[0]
        if (target.kind !== "series") return
        const spendingRow = target.tooltip.rows.find((r) => r.seriesKey === "spending")
        expect(spendingRow?.notice).toBe("missing")
        expect(spendingRow?.valueText).toBe("No data")
    })

    it("excludes entities missing all metrics", () => {
        const ctx = ctxFor("pathological", {
            y: ["spending", "negatives"],
            selectedEntities: ["Québec", "Î.-P.-É."],
            time: 2022, // Québec has no 2022 row at all
            types: ["stacked-discrete-bar"],
        })
        const layer = layoutStackedDiscreteBar(ctx, AREA, OPTS)
        expect(layer.nodes.some((n) => n.key === "label/Québec")).toBe(false)
        expect(layer.nodes.some((n) => n.key === "label/Î.-P.-É.")).toBe(true)
    })
})

describe("stacked discrete bar relative mode (spec 16)", () => {
    it("normalizes each bar by its absolute total and hides the total label", () => {
        const ctx = ctxFor("government-debt", {
            y: ["federal_debt", "provincial_debt", "municipal_debt"],
            types: ["stacked-discrete-bar"],
            stackMode: "relative",
        })
        const layer = layoutStackedDiscreteBar(ctx, AREA, OPTS)
        const sum = layer.series.reduce((acc, s) => acc + (s.points[0]?.value ?? 0), 0)
        expect(sum).toBeCloseTo(100, 6)
        expect(layer.nodes.some((n) => n.key.endsWith("/total"))).toBe(false)
    })
})

describe("stacked discrete bar sorting and totals", () => {
    const raw = {
        y: ["program_spending", "debt_charges"],
        selectedEntities: ["Nova Scotia", "Ontario", "Quebec"],
        time: "2023-24",
        types: ["stacked-discrete-bar"],
    }

    it("sorts entities by net total descending by default", () => {
        const layer = layoutStackedDiscreteBar(ctxFor("provincial-budgets", raw), AREA, OPTS)
        const labels = layer.nodes.filter((n) => n.kind === "text" && n.key.startsWith("label/"))
        // Bands are laid out top-to-bottom in sorted order.
        const sorted = labels
            .map((n) => (n.kind === "text" ? { text: n.text, y: n.position.y } : null))
            .filter((v) => v !== null)
            .sort((a, b) => a.y - b.y)
            .map((v) => v.text)
        expect(sorted).toEqual(["Ontario", "Quebec", "Nova Scotia"])
    })

    it("shows total labels unless hideTotalLabel", () => {
        const withTotals = layoutStackedDiscreteBar(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(withTotals.nodes.some((n) => n.key === "value/Ontario/total")).toBe(true)
        const without = layoutStackedDiscreteBar(
            ctxFor("provincial-budgets", { ...raw, hideTotalLabel: true }),
            AREA,
            OPTS,
        )
        expect(without.nodes.some((n) => n.key.endsWith("/total"))).toBe(false)
    })

    it("provides a metric legend in metric order", () => {
        const layer = layoutStackedDiscreteBar(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(layer.legendItems.map((item) => item.seriesKey)).toEqual(["program_spending", "debt_charges"])
        expect(layer.legendItems.map((item) => item.label)).toEqual(["Program spending", "Debt charges"])
    })
})

describe("stacked bar both-direction stacking (spec 15)", () => {
    it("stacks mixed-sign series without negatives offsetting positives", () => {
        const ctx = ctxFor("pathological", {
            y: ["negatives"],
            selectedEntities: ["Québec", "Î.-P.-É."],
            types: ["stacked-bar"],
        })
        const layer = layoutStackedBar(ctx, AREA, OPTS)
        // Both series are negative: the second stacks below the first.
        const quebec = layer.series.find((s) => s.key === "Québec")
        const ipe = layer.series.find((s) => s.key === "Î.-P.-É.")
        const at2020q = quebec?.points.find((p) => p.time === 2020)
        const at2020i = ipe?.points.find((p) => p.time === 2020)
        expect(at2020q?.valueOffset).toBe(0)
        expect(at2020i?.valueOffset).toBeCloseTo(-5)
    })

    it("reports missing column values as 'No data' tooltip rows", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["program_spending"],
            selectedEntities: ["Ontario", "Nova Scotia"],
            types: ["stacked-bar"],
        })
        const layer = layoutStackedBar(ctx, AREA, OPTS)
        const target = layer.hover.targets.find((t) => t.kind === "time" && t.time === 2022)
        const row = target?.tooltip.rows.find((r) => r.seriesKey === "Nova Scotia")
        expect(row?.notice).toBe("missing")
        // And no rect is drawn for the missing contribution.
        expect(layer.nodes.some((n) => n.key === "series/Nova Scotia/bar/2022")).toBe(false)
    })

    it("relative mode sums each column to 100 using absolute weights", () => {
        const ctx = ctxFor("government-debt", {
            y: ["federal_debt", "provincial_debt", "municipal_debt"],
            types: ["stacked-bar"],
            stackMode: "relative",
        })
        const layer = layoutStackedBar(ctx, AREA, OPTS)
        for (const time of ctx.times) {
            const sum = layer.series.reduce((acc, s) => acc + (s.points.find((p) => p.time === time)?.value ?? 0), 0)
            expect(sum).toBeCloseTo(100, 6)
        }
    })
})
