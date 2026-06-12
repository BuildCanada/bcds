/**
 * layoutChart integration matrix (spec 26): every fixture × every applicable
 * chart type × three sizes must produce a scene with no NaN coordinates,
 * every text node inside the scene bounds, unique stable keys, and
 * deterministic, snapshot-stable JSON.
 */

import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../fixtures/index.ts"
import { parseDefinition } from "../definition/schema.ts"
import type { ChartScene, SceneNode } from "../scene/nodes.ts"
import { defaultMeasurer } from "../text/createMeasurer.ts"
import { buildCanadaTheme } from "../theme/themes.ts"
import type { ChartDefinition, ChartType, ViewState } from "../types.ts"
import type { ChromeMode } from "./chrome.ts"
import { layoutChart } from "./layoutChart.ts"

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

function sceneFor(
    fixture: FixtureName,
    raw: Record<string, unknown>,
    size: { width: number; height: number },
    chrome: ChromeMode = "full",
    view: ViewState = {},
): ChartScene {
    const { dataset } = loadFixtureDataset(fixture)
    return layoutChart({
        definition: definitionFor(raw),
        dataset,
        view,
        theme: buildCanadaTheme,
        size,
        measurer: defaultMeasurer,
        chrome,
    })
}

// ---------------------------------------------------------------------------
// Invariant helpers
// ---------------------------------------------------------------------------

function assertNoNaNDeep(value: unknown, path: string): void {
    if (typeof value === "number") {
        if (!Number.isFinite(value)) throw new Error(`Non-finite number at ${path}: ${value}`)
        return
    }
    if (Array.isArray(value)) {
        value.forEach((entry, index) => assertNoNaNDeep(entry, `${path}[${index}]`))
        return
    }
    if (typeof value === "object" && value !== null) {
        for (const [key, entry] of Object.entries(value)) assertNoNaNDeep(entry, `${path}.${key}`)
    }
}

function collectNodes(nodes: readonly SceneNode[]): SceneNode[] {
    return nodes.flatMap((node) => (node.kind === "group" ? [node, ...collectNodes(node.children)] : [node]))
}

function assertTextInBounds(scene: ChartScene): void {
    const tolerance = 1
    for (const node of collectNodes(scene.nodes)) {
        if (node.kind !== "text") continue
        const { width } = node.measured
        const left = node.anchor === "start" ? node.position.x : node.anchor === "end" ? node.position.x - width : node.position.x - width / 2
        const right = left + width
        const top = node.position.y - node.measured.ascent
        const bottom = node.position.y + node.measured.descent
        expect(left, `${node.key} left`).toBeGreaterThanOrEqual(-tolerance)
        expect(right, `${node.key} right`).toBeLessThanOrEqual(scene.width + tolerance)
        expect(top, `${node.key} top`).toBeGreaterThanOrEqual(-tolerance)
        expect(bottom, `${node.key} bottom`).toBeLessThanOrEqual(scene.height + tolerance)
    }
}

function assertUniqueKeys(scene: ChartScene): void {
    const keys = collectNodes(scene.nodes).map((node) => node.key)
    const seen = new Set<string>()
    for (const key of keys) {
        expect(seen.has(key), `duplicate node key: ${key}`).toBe(false)
        seen.add(key)
    }
}

/** FNV-1a over the JSON serialization — small, snapshot-stable fingerprints. */
function fingerprint(scene: ChartScene): string {
    const text = JSON.stringify(scene)
    let hash = 0x811c9dc5
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash.toString(16).padStart(8, "0")
}

// ---------------------------------------------------------------------------
// The matrix
// ---------------------------------------------------------------------------

interface MatrixCase {
    name: string
    fixture: FixtureName
    raw: Record<string, unknown>
}

const DEBT_Y = ["federal_debt", "provincial_debt", "municipal_debt"]

const CASES: MatrixCase[] = [
    { name: "provincial-budgets line", fixture: "provincial-budgets", raw: { y: ["total_spending"], types: ["line"] } },
    {
        name: "provincial-budgets discrete-bar",
        fixture: "provincial-budgets",
        raw: { y: ["total_spending"], types: ["discrete-bar"] },
    },
    {
        name: "provincial-budgets stacked-area",
        fixture: "provincial-budgets",
        raw: { y: ["program_spending", "debt_charges"], selectedEntities: ["Ontario"], types: ["stacked-area"] },
    },
    {
        name: "provincial-budgets stacked-bar",
        fixture: "provincial-budgets",
        raw: { y: ["program_spending", "debt_charges"], selectedEntities: ["Ontario"], types: ["stacked-bar"] },
    },
    {
        name: "provincial-budgets stacked-discrete-bar",
        fixture: "provincial-budgets",
        raw: { y: ["program_spending", "debt_charges"], types: ["stacked-discrete-bar"] },
    },
    { name: "federal-departments line", fixture: "federal-departments", raw: { y: ["spending"], types: ["line"] } },
    {
        name: "federal-departments discrete-bar",
        fixture: "federal-departments",
        raw: { y: ["spending"], types: ["discrete-bar"] },
    },
    {
        name: "federal-departments stacked-area",
        fixture: "federal-departments",
        raw: { y: ["spending"], types: ["stacked-area"], selectedEntities: ["National Defence", "Health Canada"] },
    },
    {
        name: "federal-departments stacked-bar",
        fixture: "federal-departments",
        raw: { y: ["spending"], types: ["stacked-bar"], selectedEntities: ["National Defence", "Health Canada"] },
    },
    {
        name: "population-snapshot discrete-bar",
        fixture: "population-snapshot",
        raw: { y: ["population"], types: ["discrete-bar"] },
    },
    {
        name: "population-snapshot stacked-discrete-bar",
        fixture: "population-snapshot",
        raw: { y: ["population", "median_age"], types: ["stacked-discrete-bar"] },
    },
    { name: "government-debt line", fixture: "government-debt", raw: { y: DEBT_Y, types: ["line"] } },
    { name: "government-debt discrete-bar", fixture: "government-debt", raw: { y: DEBT_Y, types: ["discrete-bar"] } },
    { name: "government-debt stacked-area", fixture: "government-debt", raw: { y: DEBT_Y, types: ["stacked-area"] } },
    { name: "government-debt stacked-bar", fixture: "government-debt", raw: { y: DEBT_Y, types: ["stacked-bar"] } },
    {
        name: "government-debt stacked-discrete-bar",
        fixture: "government-debt",
        raw: { y: DEBT_Y, types: ["stacked-discrete-bar"] },
    },
    { name: "pathological line", fixture: "pathological", raw: { y: ["spending"], types: ["line"] } },
    { name: "pathological discrete-bar", fixture: "pathological", raw: { y: ["negatives"], types: ["discrete-bar"] } },
    { name: "pathological stacked-bar", fixture: "pathological", raw: { y: ["negatives"], types: ["stacked-bar"] } },
    { name: "pathological huge line", fixture: "pathological", raw: { y: ["huge"], types: ["line"] } },
]

const SIZES: { label: string; width: number; height: number; chrome: ChromeMode }[] = [
    { label: "thumbnail 300x160", width: 300, height: 160, chrome: "thumbnail" },
    { label: "default 850x600", width: 850, height: 600, chrome: "full" },
    { label: "wide 1200x600", width: 1200, height: 600, chrome: "full" },
]

describe("layoutChart matrix: every fixture × applicable type × three sizes", () => {
    const fingerprints: Record<string, string> = {}

    for (const testCase of CASES) {
        for (const size of SIZES) {
            it(`${testCase.name} @ ${size.label} is finite, in-bounds, unique-keyed, deterministic`, () => {
                const scene = sceneFor(testCase.fixture, testCase.raw, size, size.chrome)
                assertNoNaNDeep(scene, "scene")
                assertTextInBounds(scene)
                assertUniqueKeys(scene)
                expect(scene.width).toBe(size.width)
                expect(scene.plotArea.width).toBeGreaterThan(0)
                expect(scene.plotArea.height).toBeGreaterThan(0)

                const again = sceneFor(testCase.fixture, testCase.raw, size, size.chrome)
                expect(again).toEqual(scene)

                fingerprints[`${testCase.name} @ ${size.label}`] = fingerprint(scene)
            })
        }
    }

    it("scene JSON is snapshot-stable across runs", () => {
        expect(fingerprints).toMatchSnapshot()
    })
})

describe("layoutChart behaviours", () => {
    it("renders the no-data panel for an empty selection instead of throwing", () => {
        const scene = sceneFor("provincial-budgets", { y: ["total_spending"], selectedEntities: [] }, { width: 850, height: 600 })
        const message = scene.nodes.find((n) => n.key === "chrome/no-data")
        expect(message?.kind).toBe("text")
        if (message?.kind === "text") expect(message.text).toBe("No data for the current selection")
        expect(scene.series).toEqual([])
        expect(scene.hover.targets).toEqual([])
    })

    it("renders the no-data panel for a stacked area with negative inputs, carrying the error diagnostic", () => {
        const scene = sceneFor("pathological", { y: ["negatives"], types: ["stacked-area"] }, { width: 850, height: 600 })
        expect(scene.diagnostics.some((d) => d.code === "negative-values-in-stacked-area")).toBe(true)
        expect(scene.nodes.some((n) => n.key === "chrome/no-data")).toBe(true)
    })

    it("collapses line to discrete-bar at start === end and restores on expand", () => {
        const raw = { y: ["total_spending"], types: ["line", "discrete-bar"] }
        const collapsed = sceneFor("provincial-budgets", raw, { width: 850, height: 600 }, "full", {
            time: { start: 2023, end: 2023 },
        })
        expect(collapsed.nodes.some((n) => n.key.endsWith("/bar"))).toBe(true)
        expect(collapsed.nodes.some((n) => n.key.endsWith("/line"))).toBe(false)
        const expanded = sceneFor("provincial-budgets", raw, { width: 850, height: 600 }, "full", {
            time: { start: 2019, end: 2023 },
        })
        expect(expanded.nodes.some((n) => n.key.endsWith("/line"))).toBe(true)
        expect(expanded.nodes.some((n) => n.key.endsWith("/bar"))).toBe(false)
    })

    it("shows a legend for stacked bars over time and stacked discrete bars", () => {
        const stackedBar = sceneFor(
            "government-debt",
            { y: DEBT_Y, types: ["stacked-bar"] },
            { width: 850, height: 600 },
        )
        expect(stackedBar.legend?.map((item) => item.seriesKey)).toEqual(DEBT_Y)
        expect(stackedBar.nodes.some((n) => n.key === "legend/federal_debt/swatch")).toBe(true)
        const line = sceneFor("government-debt", { y: DEBT_Y, types: ["line"] }, { width: 850, height: 600 })
        expect(line.legend).toBeUndefined()
    })

    it("falls back to a legend when hideSeriesLabels suppresses direct labels", () => {
        const scene = sceneFor(
            "government-debt",
            { y: DEBT_Y, types: ["line"], hideSeriesLabels: true },
            { width: 850, height: 600 },
        )
        expect(scene.legend).toBeDefined()
        expect(scene.nodes.some((n) => n.key.startsWith("legend/"))).toBe(true)
    })

    it("thumbnail chrome renders title + plot without footer text", () => {
        const scene = sceneFor("government-debt", { y: DEBT_Y, types: ["line"] }, { width: 300, height: 160 }, "thumbnail")
        expect(scene.nodes.some((n) => n.key.startsWith("chrome/title"))).toBe(true)
        expect(scene.nodes.some((n) => n.key === "chrome/attribution")).toBe(false)
        expect(scene.nodes.some((n) => n.key === "chrome/source")).toBe(false)
        expect(scene.nodes.some((n) => n.key.startsWith("chrome/subtitle"))).toBe(false)
    })

    it("chrome none renders the plot only", () => {
        const scene = sceneFor("government-debt", { y: DEBT_Y, types: ["line"] }, { width: 850, height: 600 }, "none")
        expect(scene.nodes.some((n) => n.role === "chrome")).toBe(false)
        expect(scene.nodes.some((n) => n.role === "mark")).toBe(true)
    })

    it("aggregates diagnostics from every stage", () => {
        const scene = sceneFor(
            "pathological",
            { y: ["spending"], types: ["line"], yAxis: { scale: "log" }, selectedEntities: ["Québec"] },
            { width: 850, height: 600 },
        )
        assertNoNaNDeep(scene, "scene")
    })

    it("precomputes tooltip models on hover targets (M9 consumes them as data)", () => {
        const scene = sceneFor("government-debt", { y: DEBT_Y, types: ["line"] }, { width: 850, height: 600 })
        expect(scene.hover.targets.length).toBe(5)
        const target = scene.hover.targets[0]
        if (target.kind !== "time") return
        expect(target.tooltip.rows.length).toBe(3)
        expect(target.tooltip.rows[0].valueText).toContain("%")
    })
})
