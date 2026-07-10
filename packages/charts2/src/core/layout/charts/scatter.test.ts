import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect } from "../../scene/nodes.ts"
import type { ChartDefinition, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import { layoutScatter } from "./scatter.ts"
import type { ChartLayerOptions } from "./shared.ts"

const AREA: Rect = { x: 0, y: 0, width: 800, height: 500 }
const OPTS: ChartLayerOptions = { legendReserved: false, thumbnail: false, fontScale: 1 }

const ALL_PROVINCES = ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"]

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

function ctxFor(fixture: FixtureName, raw: Record<string, unknown>, view?: ViewState): LayoutContext {
    const { dataset } = loadFixtureDataset(fixture)
    return buildContext({ definition: definitionFor(raw), dataset, view, theme: buildCanadaTheme, measurer: defaultMeasurer })
}

describe("scatter requires an x metric (spec 18)", () => {
    it("returns an empty layer with an error diagnostic when x is missing", () => {
        const layer = layoutScatter(ctxFor("provincial-budgets", { y: ["debt_charges"], types: ["scatter"] }), AREA, OPTS)
        expect(layer.empty).toBe(true)
        expect(layer.diagnostics).toContainEqual(
            expect.objectContaining({ severity: "error", code: "scatter-missing-x" }),
        )
    })
})

describe("scatter snapshot (spec 18)", () => {
    const raw = {
        x: "program_spending",
        y: ["debt_charges"],
        types: ["scatter"],
        time: "2023-24",
        selectedEntities: ALL_PROVINCES,
    }

    it("renders one point per entity with a matched pair at the target time", () => {
        const layer = layoutScatter(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(layer.empty).toBe(false)
        const points = layer.nodes.filter((n) => n.kind === "point")
        expect(points.length).toBe(5)
        expect(new Set(points.map((n) => n.key))).toEqual(
            new Set(ALL_PROVINCES.map((e) => `point/${e}`)),
        )
        expect(layer.series.length).toBe(5)
        expect(layer.valueDomain).toBeDefined()
    })

    it("sets a series hit target per point", () => {
        const layer = layoutScatter(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(layer.hover.targets.length).toBe(5)
        expect(layer.hover.targets.every((t) => t.kind === "series")).toBe(true)
    })
})

describe("scatter excludes entities without a matched pair (spec 18)", () => {
    it("drops entities missing x or y and reports each via a diagnostic", () => {
        // Quebec 2024-25 has no program_spending (x) and no debt_charges;
        // debt_charges borrows via tolerance but program_spending does not.
        const layer = layoutScatter(
            ctxFor("provincial-budgets", {
                x: "program_spending",
                y: ["debt_charges"],
                types: ["scatter"],
                time: "2024-25",
                selectedEntities: ALL_PROVINCES,
            }),
            AREA,
            OPTS,
        )
        expect(layer.series.map((s) => s.entity)).not.toContain("Quebec")
        expect(layer.diagnostics).toContainEqual(
            expect.objectContaining({ code: "scatter-missing-pair", context: { entity: "Quebec" } }),
        )
    })
})

describe("scatter size scaling (spec 18)", () => {
    it("maps the min size value to the min radius and the max to the max radius", () => {
        const layer = layoutScatter(
            ctxFor("provincial-budgets", {
                x: "program_spending",
                y: ["debt_charges"],
                sizeMetric: "total_spending",
                types: ["scatter"],
                time: "2023-24",
                selectedEntities: ALL_PROVINCES,
            }),
            AREA,
            OPTS,
        )
        // total_spending 2023-24: Ontario 204.3 (max), Nova Scotia 15.4 (min).
        const ontario = layer.nodes.find((n) => n.key === "point/Ontario")
        const novaScotia = layer.nodes.find((n) => n.key === "point/Nova Scotia")
        expect(ontario?.kind).toBe("point")
        expect(novaScotia?.kind).toBe("point")
        if (ontario?.kind !== "point" || novaScotia?.kind !== "point") return
        // fontScale 1 → minRadius 3, maxRadius 18.
        expect(ontario.radius).toBeCloseTo(18, 5)
        expect(novaScotia.radius).toBeCloseTo(3, 5)
        // Every other point sits between the extremes.
        for (const node of layer.nodes) {
            if (node.kind === "point") {
                expect(node.radius).toBeGreaterThanOrEqual(3 - 1e-6)
                expect(node.radius).toBeLessThanOrEqual(18 + 1e-6)
            }
        }
    })
})

describe("scatter log axis (spec 18)", () => {
    it("excludes non-positive values on a log axis and reports a diagnostic", () => {
        // pathological "negatives" is all-negative; a log y-axis excludes them.
        const layer = layoutScatter(
            ctxFor("pathological", {
                x: "spending",
                y: ["negatives"],
                types: ["scatter"],
                time: 2021,
                selectedEntities: ["Québec", "Lonely Station"],
                yAxis: { scale: "log" },
            }),
            AREA,
            OPTS,
        )
        expect(layer.diagnostics).toContainEqual(
            expect.objectContaining({ code: "scatter-log-excluded", context: expect.objectContaining({ axis: "y" }) }),
        )
        expect(layer.empty).toBe(true)
    })
})

describe("scatter tooltip (spec 18)", () => {
    it("includes formatted x and y values", () => {
        const layer = layoutScatter(
            ctxFor("provincial-budgets", {
                x: "program_spending",
                y: ["debt_charges"],
                types: ["scatter"],
                time: "2023-24",
                selectedEntities: ["Ontario"],
            }),
            AREA,
            OPTS,
        )
        const target = layer.hover.targets[0]
        expect(target.kind).toBe("series")
        if (target.kind !== "series") return
        expect(target.tooltip.title).toBe("Ontario")
        const labels = target.tooltip.rows.map((r) => r.label)
        expect(labels).toContain("Program spending")
        expect(labels).toContain("Debt charges")
        for (const row of target.tooltip.rows) {
            expect(row.valueText).toMatch(/\d/)
        }
    })
})
