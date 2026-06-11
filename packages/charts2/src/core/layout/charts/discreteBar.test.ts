import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect } from "../../scene/nodes.ts"
import type { ChartDefinition, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import { layoutDiscreteBar } from "./discreteBar.ts"
import type { ChartLayerOptions } from "./shared.ts"

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

describe("discrete bar sorting (spec 13)", () => {
    const raw = { y: ["total_spending"], selectedEntities: ["Nova Scotia", "Ontario", "Quebec", "British Columbia", "Alberta"] }

    it("defaults to value descending", () => {
        const layer = layoutDiscreteBar(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(layer.series.map((s) => s.label)).toEqual([
            "Ontario",
            "Quebec",
            "British Columbia",
            "Alberta",
            "Nova Scotia",
        ])
    })

    it("sorts by value ascending when asked", () => {
        const layer = layoutDiscreteBar(
            ctxFor("provincial-budgets", { ...raw, sort: { by: "total", order: "asc" } }),
            AREA,
            OPTS,
        )
        expect(layer.series.map((s) => s.label)).toEqual([
            "Nova Scotia",
            "Alberta",
            "British Columbia",
            "Quebec",
            "Ontario",
        ])
    })

    it("sorts by name", () => {
        const layer = layoutDiscreteBar(
            ctxFor("provincial-budgets", { ...raw, sort: { by: "name", order: "asc" } }),
            AREA,
            OPTS,
        )
        expect(layer.series.map((s) => s.label)).toEqual([
            "Alberta",
            "British Columbia",
            "Nova Scotia",
            "Ontario",
            "Quebec",
        ])
    })

    it("keeps the selection order for custom sort", () => {
        const layer = layoutDiscreteBar(
            ctxFor("provincial-budgets", { ...raw, sort: { by: "custom", order: "asc" } }),
            AREA,
            OPTS,
        )
        expect(layer.series.map((s) => s.label)).toEqual([
            "Nova Scotia",
            "Ontario",
            "Quebec",
            "British Columbia",
            "Alberta",
        ])
    })
})

describe("discrete bar tolerance suffix (spec 13)", () => {
    it("appends 'in ‹time›' exactly when the value time differs from the target", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["debt_charges"], time: "2024-25" })
        const layer = layoutDiscreteBar(ctx, AREA, OPTS)
        const quebec = layer.nodes.find((n) => n.key === "value/Quebec")
        const ontario = layer.nodes.find((n) => n.key === "value/Ontario")
        expect(quebec?.kind).toBe("text")
        if (quebec?.kind !== "text" || ontario?.kind !== "text") return
        expect(quebec.text).toContain("in 2023–24") // borrowed via tolerance 2
        expect(ontario.text).not.toContain("in ") // exact hit, no suffix
    })
})

describe("discrete bar negatives (spec 13)", () => {
    it("extends bars left of the zero baseline and mirrors the value labels", () => {
        const ctx = ctxFor("pathological", { y: ["negatives"], time: 2021 })
        const layer = layoutDiscreteBar(ctx, AREA, OPTS)
        const bars = layer.nodes.filter((n) => n.kind === "rect" && n.key.endsWith("/bar"))
        expect(bars.length).toBe(3)
        // All values are negative, so every bar's right edge is the shared zero line.
        const rightEdges = bars.map((n) => (n.kind === "rect" ? n.rect.x + n.rect.width : 0))
        for (const edge of rightEdges) expect(edge).toBeCloseTo(rightEdges[0], 5)
        const valueLabels = layer.nodes.filter((n) => n.kind === "text" && n.key.startsWith("value/"))
        for (const label of valueLabels) {
            if (label.kind === "text") expect(label.anchor).toBe("end")
        }
    })
})

describe("discrete bar without a time dimension", () => {
    it("lays out grain-none datasets at a null target time", () => {
        const ctx = ctxFor("population-snapshot", { y: ["population"], types: ["discrete-bar"] })
        const layer = layoutDiscreteBar(ctx, AREA, OPTS)
        expect(layer.series.length).toBeGreaterThan(0)
        expect(layer.series[0].points[0].time).toBe(null)
        // No tolerance suffix and no title annotation without time.
        const target = layer.hover.targets[0]
        if (target.kind === "series") expect(target.tooltip.titleAnnotation).toBeUndefined()
    })
})

describe("discrete bar relative mode", () => {
    it("shows shares of the visible total using absolute weights", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Ontario", "Quebec"],
            stackMode: "relative",
        })
        const layer = layoutDiscreteBar(ctx, AREA, OPTS)
        const total = layer.series.reduce((sum, s) => sum + s.points[0].value, 0)
        expect(total).toBeCloseTo(100)
    })
})

describe("discrete bar hover", () => {
    it("emits one series target per bar with an emphasized single row", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["total_spending"], selectedEntities: ["Ontario", "Quebec"] })
        const layer = layoutDiscreteBar(ctx, AREA, OPTS)
        expect(layer.hover.targets.length).toBe(2)
        const target = layer.hover.targets[0]
        expect(target.kind).toBe("series")
        if (target.kind !== "series") return
        expect(target.tooltip.rows.length).toBe(1)
        expect(target.tooltip.rows[0].emphasized).toBe(true)
    })
})
