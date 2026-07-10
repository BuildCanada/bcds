import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect, SceneNode } from "../../scene/nodes.ts"
import type { ChartDefinition, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import { layoutMarimekko } from "./marimekko.ts"
import type { ChartLayer, ChartLayerOptions } from "./shared.ts"

const AREA: Rect = { x: 0, y: 0, width: 800, height: 500 }
const OPTS: ChartLayerOptions = { legendReserved: true, thumbnail: false, fontScale: 1 }
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

/** Column width from a segment rect (all segments in a column share its width). */
function columnWidth(layer: ChartLayer, entity: string, slug: string): number {
    const node = layer.nodes.find((n) => n.key === `series/${entity}/${slug}/seg`)
    if (node === undefined || node.kind !== "rect") throw new Error(`no segment for ${entity}/${slug}`)
    return node.rect.width
}

/** Entity order left-to-right, read from segment rects (always drawn). */
function columnOrder(layer: ChartLayer, slug: string): string[] {
    return layer.nodes
        .filter((n): n is Extract<SceneNode, { kind: "rect" }> => n.kind === "rect" && n.key.endsWith(`/${slug}/seg`))
        .map((n) => ({ entity: n.key.slice("series/".length, -`/${slug}/seg`.length), x: n.rect.x }))
        .sort((a, b) => a.x - b.x)
        .map((v) => v.entity)
}

/** Entity labels actually placed beneath columns. */
function labelOrder(layer: ChartLayer): string[] {
    return layer.nodes
        .filter((n): n is Extract<SceneNode, { kind: "text" }> => n.kind === "text" && n.key.startsWith("label/"))
        .map((n) => ({ entity: n.key.slice("label/".length), x: n.position.x }))
        .sort((a, b) => a.x - b.x)
        .map((v) => v.entity)
}

describe("marimekko column widths (spec 19)", () => {
    const raw = {
        y: ["program_spending", "debt_charges"],
        x: "total_spending",
        selectedEntities: ALL_PROVINCES,
        time: "2023-24",
        types: ["marimekko"],
    }
    // total_spending 2023-24: On 204.3, Qc 156.1, BC 79.5, Ab 68.3, NS 15.4 → 523.6.
    const TOTAL_X = 204.3 + 156.1 + 79.5 + 68.3 + 15.4

    it("makes a column's pixel share equal its x-value share", () => {
        const layer = layoutMarimekko(ctxFor("provincial-budgets", raw), AREA, OPTS)
        const widths = new Map(ALL_PROVINCES.map((e) => [e, columnWidth(layer, e, "program_spending")]))
        const sum = [...widths.values()].reduce((a, b) => a + b, 0)
        expect((widths.get("Ontario") ?? 0) / sum).toBeCloseTo(204.3 / TOTAL_X, 4)
        expect((widths.get("Nova Scotia") ?? 0) / sum).toBeCloseTo(15.4 / TOTAL_X, 4)
    })

    it("enforces a minimum width for a tiny column, inflating it beyond its share", () => {
        const narrow: Rect = { x: 0, y: 0, width: 120, height: 200 }
        const layer = layoutMarimekko(ctxFor("provincial-budgets", raw), narrow, OPTS)
        const nsWidth = columnWidth(layer, "Nova Scotia", "program_spending")
        const onWidth = columnWidth(layer, "Ontario", "program_spending")
        expect(nsWidth).toBeCloseTo(4, 5) // pinned to MIN_COL_WIDTH
        // Min enforcement breaks proportionality in the small column's favour.
        expect(nsWidth / onWidth).toBeGreaterThan(15.4 / 204.3)
    })

    it("uses equal widths when x is unbound", () => {
        const layer = layoutMarimekko(
            ctxFor("provincial-budgets", { ...raw, x: undefined }),
            AREA,
            OPTS,
        )
        const widths = ALL_PROVINCES.map((e) => columnWidth(layer, e, "program_spending"))
        expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(0.001)
    })
})

describe("marimekko sorting (spec 19)", () => {
    const raw = {
        y: ["program_spending", "debt_charges"],
        x: "total_spending",
        selectedEntities: ALL_PROVINCES,
        time: "2023-24",
        types: ["marimekko"],
    }

    it("orders columns by width descending by default", () => {
        const layer = layoutMarimekko(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(columnOrder(layer, "program_spending")).toEqual(["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"])
    })

    it("orders columns by name when sorted by name", () => {
        const layer = layoutMarimekko(
            ctxFor("provincial-budgets", { ...raw, sort: { by: "name", order: "asc" } }),
            AREA,
            OPTS,
        )
        expect(columnOrder(layer, "program_spending")).toEqual(["Alberta", "British Columbia", "Nova Scotia", "Ontario", "Quebec"])
    })

    it("orders columns by y-total when sorted by total", () => {
        const layer = layoutMarimekko(
            ctxFor("provincial-budgets", { ...raw, sort: { by: "total", order: "asc" } }),
            AREA,
            OPTS,
        )
        expect(columnOrder(layer, "program_spending")).toEqual(["Nova Scotia", "Alberta", "British Columbia", "Quebec", "Ontario"])
    })
})

describe("marimekko segments (spec 19)", () => {
    const raw = {
        y: ["program_spending", "debt_charges"],
        x: "total_spending",
        selectedEntities: ALL_PROVINCES,
        time: "2023-24",
        types: ["marimekko"],
        stackMode: "relative",
    }

    it("stacks metrics in order and sums each column to 100% in relative mode", () => {
        const layer = layoutMarimekko(ctxFor("provincial-budgets", raw), AREA, OPTS)
        const program = layer.series.find((s) => s.key === "program_spending")
        const debt = layer.series.find((s) => s.key === "debt_charges")
        // Metric order preserved.
        expect(layer.series.map((s) => s.key)).toEqual(["program_spending", "debt_charges"])
        // debt stacks on top of program (first metric at offset 0).
        expect(program?.points[0].valueOffset).toBe(0)
        expect(debt?.points[0].valueOffset).toBeCloseTo(program?.points[0].value ?? -1, 6)
        // Each column sums to 100%.
        for (let i = 0; i < ALL_PROVINCES.length; i++) {
            const sum = layer.series.reduce((acc, s) => acc + (s.points[i]?.value ?? 0), 0)
            expect(sum).toBeCloseTo(100, 6)
        }
    })
})

describe("marimekko entities without y data (spec 19)", () => {
    // At 2024-25 Quebec has no program_spending (row 12) but keeps total_spending.
    const raw = {
        y: ["program_spending"],
        x: "total_spending",
        selectedEntities: ["Ontario", "Quebec", "Alberta"],
        time: "2024-25",
        types: ["marimekko"],
    }

    it("excludes an entity missing all y metrics and reports it", () => {
        const layer = layoutMarimekko(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(layer.nodes.some((n) => n.key.startsWith("series/Quebec/"))).toBe(false)
        expect(layer.nodes.some((n) => n.key === "series/Ontario/program_spending/seg")).toBe(true)
        expect(layer.diagnostics.some((d) => d.code === "entities-excluded-no-data")).toBe(true)
    })

    it("groups no-data entities into the right-edge area when showNoDataArea", () => {
        const layer = layoutMarimekko(
            ctxFor("provincial-budgets", { ...raw, showNoDataArea: true }),
            AREA,
            OPTS,
        )
        expect(layer.nodes.some((n) => n.key === "nodata/area")).toBe(true)
        expect(layer.nodes.some((n) => n.key.startsWith("series/Quebec/"))).toBe(false)
        expect(layer.diagnostics.some((d) => d.code === "no-data-area")).toBe(true)
    })
})

describe("marimekko legend (spec 19)", () => {
    it("provides one legend entry per metric, in metric order", () => {
        const layer = layoutMarimekko(
            ctxFor("provincial-budgets", {
                y: ["program_spending", "debt_charges"],
                x: "total_spending",
                selectedEntities: ALL_PROVINCES,
                time: "2023-24",
                types: ["marimekko"],
            }),
            AREA,
            OPTS,
        )
        expect(layer.legendItems.map((i) => i.seriesKey)).toEqual(["program_spending", "debt_charges"])
        expect(layer.legendItems.map((i) => i.label)).toEqual(["Program spending", "Debt charges"])
    })
})

describe("marimekko label declutter (spec 19)", () => {
    it("keeps the widest column's label and drops labels that do not fit", () => {
        const narrow: Rect = { x: 0, y: 0, width: 120, height: 200 }
        const layer = layoutMarimekko(
            ctxFor("provincial-budgets", {
                y: ["program_spending", "debt_charges"],
                x: "total_spending",
                selectedEntities: ALL_PROVINCES,
                time: "2023-24",
                types: ["marimekko"],
            }),
            narrow,
            OPTS,
        )
        const labels = labelOrder(layer)
        expect(labels).toContain("Ontario") // widest column keeps its label
        expect(labels).not.toContain("Nova Scotia") // tiniest column is dropped
        expect(labels.length).toBeLessThan(ALL_PROVINCES.length)
    })
})
