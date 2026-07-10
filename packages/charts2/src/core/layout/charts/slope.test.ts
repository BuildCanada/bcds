import { describe, expect, it } from "vitest"

import { buildDataset } from "../../data/dataset.ts"
import { parseManifest } from "../../data/manifest.ts"
import { parseCsv } from "../../data/parse.ts"
import { loadFixtureDataset, type FixtureName } from "../../../fixtures/index.ts"
import { parseDefinition } from "../../definition/schema.ts"
import { defaultMeasurer } from "../../text/createMeasurer.ts"
import { buildCanadaTheme } from "../../theme/themes.ts"
import type { Rect } from "../../scene/nodes.ts"
import type { ChartDefinition, ViewState } from "../../types.ts"
import { buildContext, type LayoutContext } from "../context.ts"
import { layoutSlope } from "./slope.ts"
import { seriesLabelFont, type ChartLayerOptions } from "./shared.ts"

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

// A synthetic dataset exercising a zero start, a flat series, a rising series,
// and a sign-crossing series — none of which the committed fixtures provide.
const SYNTH_CSV = `entity,time,metric
Zeroland,2000,0
Zeroland,2010,50
Flatland,2000,42
Flatland,2010,42
Riser,2000,10
Riser,2010,30
Faller,2000,20
Faller,2010,-10
`

const SYNTH_MANIFEST = {
    name: "synthetic-slope",
    title: "Synthetic slope",
    timeGrain: "year",
    entity: { label: "place", labelPlural: "places" },
    columns: { metric: { name: "Metric", type: "numeric" } },
    sources: [{ name: "Synthetic test data" }],
}

function synthCtx(raw: Record<string, unknown>): LayoutContext {
    const { manifest } = parseManifest(SYNTH_MANIFEST)
    if (manifest === null) throw new Error("synthetic manifest failed to parse")
    const parsed = parseCsv(SYNTH_CSV, manifest)
    const { dataset } = buildDataset(manifest, parsed.rows)
    return buildContext({ definition: definitionFor(raw), dataset, theme: buildCanadaTheme, measurer: defaultMeasurer })
}

describe("slope marks (spec 12)", () => {
    const raw = {
        y: ["total_spending"],
        types: ["slope"],
        selectedEntities: ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"],
    }

    it("renders one slope line and two endpoint dots per renderable series", () => {
        const layer = layoutSlope(ctxFor("provincial-budgets", raw), AREA, OPTS)
        expect(layer.empty).toBe(false)
        expect(layer.series.length).toBe(5)
        for (const series of layer.series) expect(series.points.length).toBe(2)

        const slopeLines = layer.nodes.filter((n) => n.kind === "line" && n.key.endsWith("/slope"))
        // Coloured endpoint dots only (each also has a background halo dot beneath).
        const dots = layer.nodes.filter((n) => n.kind === "point" && !n.key.endsWith("-halo"))
        expect(slopeLines.length).toBe(5)
        expect(dots.length).toBe(10)
        expect(layer.valueDomain).toBeDefined()
    })

    it("returns an empty layer when there is no time window", () => {
        const layer = layoutSlope(ctxFor("population-snapshot", { y: ["population"], types: ["slope"] }), AREA, OPTS)
        expect(layer.empty).toBe(true)
    })
})

describe("slope endpoint filtering (spec 12)", () => {
    it("excludes a series missing an endpoint and emits a diagnostic", () => {
        // Quebec has no program_spending in the final fiscal year (the end
        // endpoint), so it drops out; Nova Scotia is missing only an interior
        // year and still renders.
        const layer = layoutSlope(
            ctxFor("provincial-budgets", {
                y: ["program_spending"],
                types: ["slope"],
                selectedEntities: ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"],
            }),
            AREA,
            OPTS,
        )
        const labels = layer.series.map((s) => s.label)
        expect(labels).not.toContain("Quebec")
        expect(labels).toContain("Nova Scotia")
        expect(labels.length).toBe(4)

        const diag = layer.diagnostics.find((d) => d.code === "slope-incomplete-endpoints")
        expect(diag).toBeDefined()
        expect(diag?.context?.series).toBe("Quebec")
    })
})

describe("slope tooltip (spec 12) — OWID format", () => {
    it("shows a single start→end range row with a trend arrow and a time-range subtitle", () => {
        const layer = layoutSlope(
            ctxFor("provincial-budgets", { y: ["total_spending"], types: ["slope"], selectedEntities: ["Ontario"] }),
            AREA,
            OPTS,
        )
        const target = layer.hover.targets.find((t) => t.kind === "series" && t.seriesKey === "Ontario")
        expect(target?.kind).toBe("series")
        if (target?.kind !== "series") return
        // OWID: one row (not start/end/Δ) plus a time-range subtitle.
        expect(target.tooltip.rows).toHaveLength(1)
        expect(target.tooltip.subtitle).toBeTruthy()
        const row = target.tooltip.rows[0]
        // Ontario rises → up arrow, both endpoint values present, emphasized.
        expect(row.valueText).toContain("↑")
        expect(row.emphasized).toBe(true)
    })

    it("uses ↑ / ↓ / → for rising, falling, and flat series", () => {
        const layer = layoutSlope(
            synthCtx({ y: ["metric"], types: ["slope"], selectedEntities: ["Riser", "Faller", "Flatland"] }),
            AREA,
            OPTS,
        )
        const rangeFor = (key: string): string => {
            const t = layer.hover.targets.find((x) => x.kind === "series" && x.seriesKey === key)
            if (t?.kind !== "series") throw new Error(`missing target ${key}`)
            return t.tooltip.rows[0].valueText
        }
        expect(rangeFor("Riser")).toContain("↑")
        expect(rangeFor("Faller")).toContain("↓")
        expect(rangeFor("Flatland")).toContain("→")
    })
})

describe("slope edge cases (spec 12)", () => {
    it("renders a flat series as a horizontal line", () => {
        const layer = layoutSlope(synthCtx({ y: ["metric"], types: ["slope"], selectedEntities: ["Flatland"] }), AREA, OPTS)
        const line = layer.nodes.find((n) => n.kind === "line" && n.key === "series/Flatland/slope")
        expect(line?.kind).toBe("line")
        if (line?.kind !== "line") return
        const [start, end] = line.segments[0]
        expect(start.y).toBeCloseTo(end.y, 5)
        expect(start.x).not.toBeCloseTo(end.x, 1)
    })

    it("draws a zero line when the value domain spans zero", () => {
        const layer = layoutSlope(
            synthCtx({ y: ["metric"], types: ["slope"], selectedEntities: ["Riser", "Faller"] }),
            AREA,
            OPTS,
        )
        expect(layer.valueDomain?.[0]).toBeLessThan(0)
        expect(layer.valueDomain?.[1]).toBeGreaterThan(0)
        expect(layer.nodes.some((n) => n.key === "slope/zero-line")).toBe(true)
    })
})

describe("slope label collision (spec 12)", () => {
    it("keeps ≥10 labels non-overlapping and adjacent to their lines", () => {
        const layer = layoutSlope(
            ctxFor("federal-departments", {
                y: ["spending"],
                types: ["slope"],
                selectedEntities: [
                    "National Defence",
                    "Employment and Social Development Canada",
                    "Indigenous Services Canada",
                    "Health Canada",
                    "Innovation, Science and Economic Development Canada",
                    "Global Affairs Canada",
                    "Public Safety Canada",
                    "Transport Canada",
                    "Environment and Climate Change Canada",
                    "Agriculture and Agri-Food Canada",
                    "Canada Revenue Agency",
                    "Fisheries and Oceans Canada",
                ],
            }),
            AREA,
            OPTS,
        )
        expect(layer.series.length).toBeGreaterThanOrEqual(10)

        // Right-side (end) labels only; time-head labels are role "annotation".
        const endLabels = layer.nodes.filter(
            (n) => n.kind === "text" && n.role === "label" && n.key.startsWith("label/") && n.key.endsWith("/end"),
        )
        expect(endLabels.length).toBe(layer.series.length)

        const font = seriesLabelFont(OPTS.fontScale)
        const lineHeight = (() => {
            const m = defaultMeasurer.measure("Ag", font)
            return m.ascent + m.descent
        })()

        const endValue = new Map(layer.series.map((s) => [s.key, s.points[1].value]))
        const sorted = endLabels
            .map((n) => (n.kind === "text" ? { key: n.seriesKey ?? "", y: n.position.y } : { key: "", y: 0 }))
            .sort((a, b) => a.y - b.y)

        // No two labels overlap vertically.
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].y - sorted[i - 1].y).toBeGreaterThanOrEqual(lineHeight - 0.5)
        }
        // Adjacency: top-to-bottom label order tracks descending end value
        // (larger value sits higher on the axis), so labels attribute to lines.
        for (let i = 1; i < sorted.length; i++) {
            const prev = endValue.get(sorted[i - 1].key) ?? Number.NEGATIVE_INFINITY
            const cur = endValue.get(sorted[i].key) ?? Number.NEGATIVE_INFINITY
            expect(prev).toBeGreaterThanOrEqual(cur - 1e-6)
        }
    })
})
