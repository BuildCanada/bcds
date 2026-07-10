import { describe, expect, it } from "vitest"

import { buildDataset } from "../../data/dataset.ts"
import { parseManifest } from "../../data/manifest.ts"
import { parseCsv } from "../../data/parse.ts"
import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect, SceneNode } from "../../scene/nodes.ts"
import type { ChartDefinition, Dataset, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import { layoutDumbbell } from "./dumbbell.ts"
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

/** Build a LayoutContext from an inline CSV + manifest (for scenarios the
 *  committed fixtures do not cover, e.g. a zero start value). */
function ctxForCsv(csv: string, manifest: Record<string, unknown>, raw: Record<string, unknown>): LayoutContext {
    const parsedManifest = parseManifest(manifest)
    if (parsedManifest.manifest === null) throw new Error("test manifest failed to parse")
    const parsed = parseCsv(csv, parsedManifest.manifest)
    const built = buildDataset(parsedManifest.manifest, parsed.rows)
    const dataset: Dataset = built.dataset
    return buildContext({ definition: definitionFor(raw), dataset, theme: buildCanadaTheme, measurer: defaultMeasurer })
}

const points = (nodes: SceneNode[]): SceneNode[] => nodes.filter((n) => n.kind === "point")
const withKey = (nodes: SceneNode[], fragment: string): SceneNode[] => nodes.filter((n) => n.key.includes(fragment))
const textOf = (nodes: SceneNode[], key: string): string | undefined => {
    const node = nodes.find((n) => n.key === key)
    return node?.kind === "text" ? node.text : undefined
}

describe("dumbbell two-metric mode (spec 17)", () => {
    const raw = { y: ["program_spending", "debt_charges"], types: ["dumbbell"], time: "2024-25", selectedEntities: ALL_PROVINCES }

    it("renders two dots and a connector per renderable entity", () => {
        const layer = layoutDumbbell(ctxFor("provincial-budgets", raw), AREA, OPTS)
        // Quebec 2024-25 has no program_spending, so it is excluded → 4 rows.
        expect(layer.series.length).toBe(4)
        expect(layer.series.map((s) => s.entity)).not.toContain("Quebec")
        for (const s of layer.series) expect(s.points.length).toBe(2)
        expect(points(layer.nodes).length).toBe(8) // 2 dots × 4 rows
        expect(withKey(layer.nodes, "/connector").length).toBe(4)
    })

    it("emits one full-row series hover target per entity with a single OWID range row", () => {
        const layer = layoutDumbbell(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(layer.hover.targets.length).toBe(4)
        const target = layer.hover.targets[0]
        expect(target.kind).toBe("series")
        if (target.kind !== "series") return
        expect(target.shape.width).toBeCloseTo(layer.plotArea.width, 5)
        // OWID format: a single "start → end" row with a trend arrow.
        expect(target.tooltip.rows.length).toBe(1)
        expect(target.tooltip.rows[0].emphasized).toBe(true)
        expect(target.tooltip.rows[0].valueText).toMatch(/[↑↓→]/)
    })
})

describe("dumbbell time-range mode (spec 17)", () => {
    it("uses the two window handles for a single metric", () => {
        const layer = layoutDumbbell(
            ctxFor("provincial-budgets", { y: ["total_spending"], types: ["dumbbell"], selectedEntities: ALL_PROVINCES }),
            AREA,
            OPTS,
        )
        expect(layer.series.length).toBe(5)
        for (const s of layer.series) {
            expect(s.points.length).toBe(2)
            expect(s.points[0].time).not.toBeNull()
            expect((s.points[0].time as number) < (s.points[1].time as number)).toBe(true)
        }
        // Default sort: end value descending.
        expect(layer.series.map((s) => s.label)).toEqual([
            "Ontario",
            "Quebec",
            "British Columbia",
            "Alberta",
            "Nova Scotia",
        ])
    })
})

describe("dumbbell endpoint filtering (spec 17)", () => {
    it("excludes entities missing an endpoint and lists them as warnings", () => {
        const layer = layoutDumbbell(
            ctxFor("provincial-budgets", {
                y: ["program_spending", "debt_charges"],
                types: ["dumbbell"],
                time: "2024-25",
                selectedEntities: ALL_PROVINCES,
            }),
            AREA,
            OPTS,
        )
        const excluded = layer.diagnostics.filter((d) => d.code === "dumbbell-incomplete-endpoints")
        expect(excluded.length).toBe(1)
        expect(excluded[0].context?.entity).toBe("Quebec")
    })

    it("renders the no-data panel when nothing is drawable", () => {
        // Every selected entity lacks program_spending at this time.
        const layer = layoutDumbbell(
            ctxFor("provincial-budgets", {
                y: ["program_spending", "debt_charges"],
                types: ["dumbbell"],
                time: "2024-25",
                selectedEntities: ["Quebec"],
            }),
            AREA,
            OPTS,
        )
        expect(layer.empty).toBe(true)
        expect(layer.series.length).toBe(0)
    })
})

describe("dumbbell value-label modes (spec 17)", () => {
    const base = { y: ["program_spending", "debt_charges"], types: ["dumbbell"], time: "2024-25", selectedEntities: ["Ontario"] }

    it("absolute: both endpoint values beside their dots", () => {
        const layer = layoutDumbbell(ctxFor("provincial-budgets", { ...base, valueLabelMode: "absolute" }), AREA, OPTS)
        expect(textOf(layer.nodes, "value/Ontario/start")).toBe("$200.1")
        expect(textOf(layer.nodes, "value/Ontario/end")).toBe("$14.4")
    })

    it("change: a single signed difference near the end", () => {
        const layer = layoutDumbbell(ctxFor("provincial-budgets", { ...base, valueLabelMode: "change" }), AREA, OPTS)
        expect(textOf(layer.nodes, "value/Ontario/change")).toBe("−$185.7")
        expect(layer.nodes.find((n) => n.key === "value/Ontario/start")).toBeUndefined()
    })

    it("percentChange: a signed percentage", () => {
        const layer = layoutDumbbell(ctxFor("provincial-budgets", { ...base, valueLabelMode: "percentChange" }), AREA, OPTS)
        expect(textOf(layer.nodes, "value/Ontario/change")).toBe("−92.8%")
    })

    it("none: no value labels", () => {
        const layer = layoutDumbbell(ctxFor("provincial-budgets", { ...base, valueLabelMode: "none" }), AREA, OPTS)
        expect(layer.nodes.filter((n) => n.key.startsWith("value/")).length).toBe(0)
    })

    it("percentChange guards a zero start with an em dash, never infinity", () => {
        const csv = "entity,time,a,b\nZeroland,2020,0,50\nRiseville,2020,20,80\n"
        const manifest = {
            name: "zero-start",
            title: "Zero start",
            timeGrain: "year",
            entity: { label: "place", labelPlural: "places" },
            columns: {
                a: { name: "Metric A", type: "numeric" },
                b: { name: "Metric B", type: "numeric" },
            },
            sources: [{ name: "Synthetic" }],
        }
        const layer = layoutDumbbell(
            ctxForCsv(csv, manifest, {
                y: ["a", "b"],
                types: ["dumbbell"],
                time: 2020,
                valueLabelMode: "percentChange",
                selectedEntities: ["Zeroland", "Riseville"],
            }),
            AREA,
            OPTS,
        )
        expect(textOf(layer.nodes, "value/Zeroland/change")).toBe("—")
        expect(textOf(layer.nodes, "value/Riseville/change")).toBe("+300%")
    })
})

describe("dumbbell sorting (spec 17)", () => {
    it("sorts by change with mixed signs", () => {
        // debt_charges 2019-20 → 2024-25: Nova Scotia falls, the rest rise.
        const layer = layoutDumbbell(
            ctxFor("provincial-budgets", {
                y: ["debt_charges"],
                types: ["dumbbell"],
                sort: { by: "change", order: "asc" },
                selectedEntities: ALL_PROVINCES,
            }),
            AREA,
            OPTS,
        )
        expect(layer.series.map((s) => s.label)).toEqual([
            "Nova Scotia",
            "British Columbia",
            "Alberta",
            "Quebec",
            "Ontario",
        ])
    })
})

describe("dumbbell connector style (spec 17)", () => {
    const raw = { y: ["debt_charges"], types: ["dumbbell"], selectedEntities: ALL_PROVINCES }

    it("arrow (default) adds arrowhead strokes; line does not", () => {
        const arrow = layoutDumbbell(ctxFor("provincial-budgets", { ...raw, connector: "arrow" }), AREA, OPTS)
        const line = layoutDumbbell(ctxFor("provincial-budgets", { ...raw, connector: "line" }), AREA, OPTS)
        expect(withKey(arrow.nodes, "/arrow/").length).toBeGreaterThan(0)
        expect(withKey(line.nodes, "/arrow/").length).toBe(0)
        // Both draw a connector; arrow uses a rule, line uses a polyline.
        expect(arrow.nodes.find((n) => n.key === "series/Ontario/connector")?.kind).toBe("rule")
        expect(line.nodes.find((n) => n.key === "series/Ontario/connector")?.kind).toBe("line")
    })
})

describe("dumbbell no-change edge case (spec 17)", () => {
    it("renders a single dot with no connector when start equals end", () => {
        // A single-time window collapses start and end onto one value per row.
        const layer = layoutDumbbell(
            ctxFor("provincial-budgets", {
                y: ["total_spending"],
                types: ["dumbbell"],
                time: "2024-25",
                selectedEntities: ALL_PROVINCES,
            }),
            AREA,
            OPTS,
        )
        expect(layer.series.length).toBe(5)
        expect(withKey(layer.nodes, "/connector").length).toBe(0)
        expect(withKey(layer.nodes, "/arrow/").length).toBe(0)
        expect(points(layer.nodes).length).toBe(5) // one dot per row
    })
})
