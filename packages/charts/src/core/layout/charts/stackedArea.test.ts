import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect } from "../../scene/nodes.ts"
import type { ChartDefinition, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import type { ChartLayerOptions } from "./shared.ts"
import { layoutStackedArea } from "./stackedArea.ts"

const AREA: Rect = { x: 0, y: 0, width: 800, height: 500 }
const OPTS: ChartLayerOptions = { legendReserved: false, thumbnail: false, fontScale: 1 }

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

function ctxFor(fixture: FixtureName, raw: Record<string, unknown>, view?: ViewState): LayoutContext {
    const { dataset } = loadFixtureDataset(fixture)
    return buildContext({ definition: definitionFor(raw), dataset, view, theme: buildCanadaTheme, measurer: defaultMeasurer })
}

const DEBT_Y = ["federal_debt", "provincial_debt", "municipal_debt"]

describe("stacked area offsets vs the hand-computed government-debt fixture", () => {
    it("stacks per-time offsets as cumulative sums in definition order", () => {
        const ctx = ctxFor("government-debt", { y: DEBT_Y, types: ["stacked-area"] })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        expect(layer.series.map((s) => s.key)).toEqual(DEBT_Y)
        const at2019 = layer.series.map((s) => s.points.find((p) => p.time === 2019))
        // federal 50, provincial 30, municipal 5 (% of GDP)
        expect(at2019[0]?.value).toBeCloseTo(50)
        expect(at2019[0]?.valueOffset).toBeCloseTo(0)
        expect(at2019[1]?.value).toBeCloseTo(30)
        expect(at2019[1]?.valueOffset).toBeCloseTo(50)
        expect(at2019[2]?.value).toBeCloseTo(5)
        expect(at2019[2]?.valueOffset).toBeCloseTo(80)
    })
})

describe("stacked area interpolation (spec 14)", () => {
    it("linearly interpolates interior gaps and flags the points", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["program_spending"],
            selectedEntities: ["Ontario", "Nova Scotia"],
            types: ["stacked-area"],
        })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        const ns = layer.series.find((s) => s.key === "Nova Scotia")
        const interpolated = ns?.points.find((p) => p.time === 2022)
        expect(interpolated).toBeDefined()
        expect(interpolated?.interpolated).toBe(true)
        expect(interpolated?.value).toBeCloseTo((12.4 + 14.7) / 2)
    })

    it("flags interpolated spans in the tooltip footers", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["program_spending"],
            selectedEntities: ["Ontario", "Nova Scotia"],
            types: ["stacked-area"],
        })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        const target = layer.hover.targets.find((t) => t.kind === "time" && t.time === 2022)
        expect(target?.tooltip.footers.some((f) => f.text.includes("interpolated"))).toBe(true)
    })
})

describe("stacked area relative mode (spec 14)", () => {
    it("shares sum to ~100 at every time and the axis pins to 100", () => {
        const ctx = ctxFor("government-debt", { y: DEBT_Y, types: ["stacked-area"], stackMode: "relative" })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        for (const time of ctx.times) {
            const sum = layer.series.reduce((acc, s) => acc + (s.points.find((p) => p.time === time)?.value ?? 0), 0)
            expect(sum).toBeCloseTo(100, 6)
        }
        const topOffsets = layer.series[2].points.map((p) => p.value + (p.valueOffset ?? 0))
        for (const top of topOffsets) expect(top).toBeCloseTo(100, 6)
    })

    it("tooltip shows both share and absolute value", () => {
        const ctx = ctxFor("government-debt", { y: DEBT_Y, types: ["stacked-area"], stackMode: "relative" })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        const target = layer.hover.targets[0]
        if (target.kind !== "time") return
        expect(target.tooltip.rows[0].valueText).toMatch(/%.*\(/)
        expect(target.tooltip.totalRow).toBeUndefined()
    })
})

describe("stacked area zero-throughout series (spec 14)", () => {
    it("drops the series from the stack but keeps it greyed in the legend", () => {
        const ctx = ctxFor("government-debt", {
            y: ["federal_debt", "municipal_debt"],
            types: ["stacked-area"],
            bindings: { municipal_debt: { displayFactor: 0 } },
        })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        expect(layer.greyedLegendKeys).toEqual(["municipal_debt"])
        expect(layer.series.map((s) => s.key)).toEqual(["federal_debt"])
        const greyedItem = layer.legendItems.find((item) => item.seriesKey === "municipal_debt")
        expect(greyedItem?.swatch).toBe(buildCanadaTheme.palette.noData)
        expect(layer.nodes.some((n) => n.key === "series/municipal_debt/band")).toBe(false)
    })
})

describe("stacked area negative validation (spec 14)", () => {
    it("rejects negative inputs with an error diagnostic and renders nothing", () => {
        const ctx = ctxFor("pathological", { y: ["negatives"], types: ["stacked-area"] })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        expect(layer.empty).toBe(true)
        expect(layer.nodes).toEqual([])
        expect(layer.diagnostics.some((d) => d.severity === "error" && d.code === "negative-values-in-stacked-area")).toBe(
            true,
        )
    })
})

describe("stacked area tooltip totals", () => {
    it("includes a Total row in absolute mode and stack-ordered rows", () => {
        const ctx = ctxFor("government-debt", { y: DEBT_Y, types: ["stacked-area"] })
        const layer = layoutStackedArea(ctx, AREA, OPTS)
        const target = layer.hover.targets.find((t) => t.kind === "time" && t.time === 2019)
        expect(target?.tooltip.rows.map((r) => r.seriesKey)).toEqual(DEBT_Y)
        expect(target?.tooltip.totalRow).toBeDefined()
        expect(target?.tooltip.totalRow?.valueText).toContain("85")
    })
})
