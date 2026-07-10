import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect } from "../../scene/nodes.ts"
import type { ChartDefinition, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import { layoutLineChart } from "./line.ts"
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

describe("line chart gaps (spec 11)", () => {
    it("renders an interior-gap series as two segments in one line node", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["program_spending"], selectedEntities: ["Nova Scotia"] })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const line = layer.nodes.find((n) => n.key === "series/Nova Scotia/line")
        expect(line?.kind).toBe("line")
        if (line?.kind !== "line") return
        expect(line.segments.length).toBe(2)
        expect(line.segments[0].length).toBe(3) // 2019-20 .. 2021-22
        expect(line.segments[1].length).toBe(2) // 2023-24 .. 2024-25
    })

    it("renders a gapless series as a single segment", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["total_spending"], selectedEntities: ["Ontario"] })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const line = layer.nodes.find((n) => n.key === "series/Ontario/line")
        expect(line?.kind).toBe("line")
        if (line?.kind !== "line") return
        expect(line.segments.length).toBe(1)
        expect(line.segments[0].length).toBe(6)
    })
})

describe("line chart hover model (spec 06/11)", () => {
    it("creates one time target per time with rows sorted by value descending", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Nova Scotia", "Ontario", "Alberta"],
        })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        expect(layer.hover.targets.filter((t) => t.kind === "time").length).toBe(6)
        expect(layer.hover.timeGuide).toBeDefined()
        const first = layer.hover.targets[0]
        expect(first.kind).toBe("time")
        if (first.kind !== "time") return
        expect(first.tooltip.title).toBe("2019–20")
        expect(first.tooltip.rows.map((r) => r.label)).toEqual(["Ontario", "Alberta", "Nova Scotia"])
    })

    it("emits a series hit target per end label so hovering the label focuses the line (spec 07 §3)", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Nova Scotia", "Ontario", "Alberta"],
        })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const seriesTargets = layer.hover.targets.filter((t) => t.kind === "series")
        expect(seriesTargets.length).toBeGreaterThan(0)
        for (const target of seriesTargets) {
            if (target.kind !== "series") continue
            expect(layer.series.some((s) => s.key === target.seriesKey)).toBe(true)
            // Labels sit in the right-reserve margin, past the plot's right edge.
            expect(target.shape.x).toBeGreaterThanOrEqual(layer.plotArea.x + layer.plotArea.width)
            expect(target.shape.width).toBeGreaterThan(0)
            expect(target.shape.height).toBeGreaterThan(0)
        }
        // Ontario has the top value, so its label is always placed.
        expect(seriesTargets.some((t) => t.kind === "series" && t.seriesKey === "Ontario")).toBe(true)
    })

    it("emits no series hit targets when the legend is reserved (end labels hidden)", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Nova Scotia", "Ontario", "Alberta"],
        })
        const layer = layoutLineChart(ctx, AREA, { ...OPTS, legendReserved: true })
        expect(layer.hover.targets.every((t) => t.kind === "time")).toBe(true)
    })

    it("reports missing values as 'No data' rows, never zero", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["program_spending"],
            selectedEntities: ["Ontario", "Nova Scotia"],
        })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const target = layer.hover.targets.find((t) => t.kind === "time" && t.time === 2022)
        expect(target).toBeDefined()
        const row = target?.tooltip.rows.find((r) => r.seriesKey === "Nova Scotia")
        expect(row?.notice).toBe("missing")
        expect(row?.valueText).toBe("No data")
    })

    it("adds a tolerance footer for borrowed values", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["debt_charges"], selectedEntities: ["Quebec"] })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const target = layer.hover.targets.find((t) => t.kind === "time" && t.time === 2024)
        expect(target?.tooltip.footers.some((f) => f.text === "Data from 2023–24")).toBe(true)
    })
})

describe("line chart end labels", () => {
    it("places non-overlapping end labels for many colliding series", () => {
        const ctx = ctxFor("federal-departments", { y: ["spending"] })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const labels = layer.nodes.filter((n) => n.kind === "text" && n.key.startsWith("label/"))
        expect(labels.length).toBeGreaterThanOrEqual(2)
        const boxes = labels
            .map((n) => (n.kind === "text" ? { top: n.position.y - n.measured.ascent, bottom: n.position.y + n.measured.descent } : null))
            .filter((b) => b !== null)
            .sort((a, b) => a.top - b.top)
        for (let i = 1; i < boxes.length; i++) {
            expect(boxes[i].top + 0.001).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 1)
        }
    })

    it("skips end labels and offers a legend when hideSeriesLabels is set", () => {
        const ctx = ctxFor("provincial-budgets", { y: ["total_spending"], hideSeriesLabels: true })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        expect(layer.nodes.some((n) => n.key.startsWith("label/"))).toBe(false)
        expect(layer.needsLegendFallback).toBe(true)
        expect(layer.legendItems.length).toBeGreaterThan(0)
    })
})

describe("line chart relative mode (spec 11)", () => {
    it("rebases values and formats the axis as signed percentages", () => {
        const ctx = ctxFor("government-debt", { y: ["federal_debt"], stackMode: "relative" })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const values = layer.series[0].points.map((p) => p.value)
        expect(values[0]).toBeCloseTo(0)
        expect(values[1]).toBeCloseTo(20)
        const positiveTick = layer.nodes.find(
            (n) => n.kind === "text" && n.role === "axis" && n.text.startsWith("+"),
        )
        expect(positiveTick).toBeDefined()
    })
})

describe("line chart projections", () => {
    it("renders projected runs as a separate dashed node sharing the transition point", () => {
        const ctx = ctxFor("provincial-budgets", {
            y: ["total_spending"],
            selectedEntities: ["Ontario"],
            bindings: { total_spending: { projectionFrom: 2023 } },
        })
        const layer = layoutLineChart(ctx, AREA, OPTS)
        const solid = layer.nodes.find((n) => n.key === "series/Ontario/line")
        const projected = layer.nodes.find((n) => n.key === "series/Ontario/line/projected")
        expect(solid?.kind).toBe("line")
        expect(projected?.kind).toBe("line")
        if (solid?.kind !== "line" || projected?.kind !== "line") return
        expect(projected.style.dash).toBeDefined()
        // Transition point shared: last solid vertex === first projected vertex.
        const lastSolid = solid.segments[0][solid.segments[0].length - 1]
        expect(projected.segments[0][0]).toEqual(lastSolid)
    })
})
