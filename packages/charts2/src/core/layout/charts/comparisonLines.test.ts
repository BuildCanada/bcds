import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import type { Rect } from "../../scene/nodes.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { ChartDefinition } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import { layoutChart } from "../layoutChart.ts"
import { layoutLineChart } from "./line.ts"
import type { ChartLayerOptions } from "./shared.ts"

const AREA: Rect = { x: 0, y: 0, width: 800, height: 500 }
const OPTS: ChartLayerOptions = { legendReserved: false, thumbnail: false, fontScale: 1 }

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

function ctxFor(fixture: FixtureName, raw: Record<string, unknown>): LayoutContext {
    const { dataset } = loadFixtureDataset(fixture)
    return buildContext({ definition: definitionFor(raw), dataset, theme: buildCanadaTheme, measurer: defaultMeasurer })
}

describe("comparison lines (spec 02 §2)", () => {
    it("renders a horizontal reference line spanning the plot, with its label", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Ontario"],
            comparisonLines: [{ y: 0, label: "Balanced" }],
        })
        const layer = layoutLineChart(ctx, AREA, OPTS)

        const rule = layer.nodes.find((n) => n.key === "annotation/comparison/0/h")
        expect(rule?.kind).toBe("rule")
        if (rule?.kind !== "rule") return
        expect(rule.role).toBe("annotation")
        expect(rule.from.y).toBe(rule.to.y) // horizontal
        expect(rule.from.x).toBeCloseTo(layer.plotArea.x)
        expect(rule.to.x).toBeCloseTo(layer.plotArea.x + layer.plotArea.width)

        const label = layer.nodes.find((n) => n.key === "annotation/comparison/0/h-label")
        expect(label?.kind).toBe("text")
        if (label?.kind === "text") expect(label.text).toBe("Balanced")
    })

    it("renders a vertical reference line at a time ordinal", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["total_spending"], selectedEntities: ["Ontario"] })
        const at = ctx.times[1]
        const ctxWithLine = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Ontario"],
            comparisonLines: [{ x: at }],
        })
        const layer = layoutLineChart(ctxWithLine, AREA, OPTS)

        const rule = layer.nodes.find((n) => n.key === "annotation/comparison/0/v")
        expect(rule?.kind).toBe("rule")
        if (rule?.kind !== "rule") return
        expect(rule.from.x).toBe(rule.to.x) // vertical
        expect(rule.from.y).toBeCloseTo(layer.plotArea.y)
        expect(rule.to.y).toBeCloseTo(layer.plotArea.y + layer.plotArea.height)
    })

    it("skips a reference line whose value is outside the plot range", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Ontario"],
            comparisonLines: [{ y: 1e18, label: "Way up there" }],
        })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        expect(layer.nodes.some((n) => n.key.startsWith("annotation/comparison/"))).toBe(false)
    })

    it("warns when comparison lines are set on a chart type that cannot render them", () => {
        const { dataset } = loadFixtureDataset("provincial-budgets")
        const scene = layoutChart({
            definition: definitionFor({
                y: ["total_spending"],
                types: ["discrete-bar"],
                comparisonLines: [{ y: 0, label: "Balanced" }],
            }),
            dataset,
            theme: buildCanadaTheme,
            measurer: defaultMeasurer,
            size: { width: 800, height: 500 },
        })
        expect(scene.diagnostics.some((d) => d.code === "comparison-lines-unsupported")).toBe(true)
        expect(scene.nodes.some((n) => n.key.startsWith("annotation/comparison/"))).toBe(false)
    })
})
