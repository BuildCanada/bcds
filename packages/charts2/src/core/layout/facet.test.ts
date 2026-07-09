import { describe, expect, it } from "vitest"

import { loadFixtureDataset, type FixtureName } from "../../fixtures/index.ts"
import { parseDefinition } from "../definition/schema.ts"
import type { ChartScene, SceneNode } from "../scene/nodes.ts"
import { defaultMeasurer } from "../text/createMeasurer.ts"
import { buildCanadaTheme } from "../theme/themes.ts"
import type { ChartDefinition } from "../types.ts"
import { layoutChart } from "./layoutChart.ts"

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

function sceneFor(fixture: FixtureName, raw: Record<string, unknown>): ChartScene {
    const { dataset } = loadFixtureDataset(fixture)
    return layoutChart({
        definition: definitionFor(raw),
        dataset,
        theme: buildCanadaTheme,
        measurer: defaultMeasurer,
        size: { width: 900, height: 640 },
        chrome: "full",
    })
}

function flatten(nodes: readonly SceneNode[]): SceneNode[] {
    return nodes.flatMap((node) => (node.kind === "group" ? [node, ...flatten(node.children)] : [node]))
}

function assertUniqueKeys(scene: ChartScene): void {
    const seen = new Set<string>()
    for (const node of flatten(scene.nodes)) {
        expect(seen.has(node.key), `duplicate key: ${node.key}`).toBe(false)
        seen.add(node.key)
    }
}

function assertFinite(scene: ChartScene): void {
    const walk = (value: unknown): void => {
        if (typeof value === "number") expect(Number.isFinite(value)).toBe(true)
        else if (Array.isArray(value)) value.forEach(walk)
        else if (typeof value === "object" && value !== null) Object.values(value).forEach(walk)
    }
    walk(scene.nodes)
}

describe("faceting (spec 09)", () => {
    it("entity facet renders one titled panel per selected entity", () => {
        const scene = sceneFor("provincial-budgets", {
            y: ["total_spending"],
            types: ["line"],
            facet: "entity",
            selectedEntities: ["Ontario", "Quebec", "Alberta"],
        })
        const titles = flatten(scene.nodes)
            .filter((n) => n.kind === "text" && /^facet\/\d+\/title$/.test(n.key))
            .map((n) => (n.kind === "text" ? n.text : ""))
        expect(titles).toEqual(["Ontario", "Quebec", "Alberta"])
        // Each panel carries its own prefixed chart nodes.
        expect(scene.nodes.some((n) => n.key.startsWith("facet/0/series/"))).toBe(true)
        expect(scene.nodes.some((n) => n.key.startsWith("facet/2/series/"))).toBe(true)
        assertUniqueKeys(scene)
        assertFinite(scene)
    })

    it("shares one value domain across panels so gridlines align", () => {
        const scene = sceneFor("provincial-budgets", {
            y: ["total_spending"],
            types: ["line"],
            facet: "entity",
            selectedEntities: ["Ontario", "Alberta"],
        })
        const gridY = (panel: number, tick: string): number | undefined => {
            const node = scene.nodes.find((n) => n.key === `facet/${panel}/axis/y/grid/${tick}`)
            return node?.kind === "rule" ? node.from.y : undefined
        }
        // A shared domain places the same tick value at the same y in every panel.
        const y0 = gridY(0, "0")
        const y1 = gridY(1, "0")
        expect(y0).toBeDefined()
        expect(y1).toBeDefined()
        expect(y0).toBeCloseTo(y1 as number)
    })

    it("metric facet renders one panel per metric with a shared legend", () => {
        const scene = sceneFor("provincial-budgets", {
            y: ["program_spending", "debt_charges"],
            types: ["line"],
            facet: "metric",
            selectedEntities: ["Ontario", "Alberta"],
        })
        const titles = flatten(scene.nodes)
            .filter((n) => n.kind === "text" && /^facet\/\d+\/title$/.test(n.key))
            .map((n) => (n.kind === "text" ? n.text : ""))
        expect(titles.length).toBe(2)
        // Two entities per panel → a shared legend above the grid.
        expect(scene.legend?.length).toBe(2)
        expect(scene.nodes.some((n) => n.key.startsWith("legend/"))).toBe(true)
        assertUniqueKeys(scene)
    })

    it("falls back to a single chart when only one panel would result", () => {
        const scene = sceneFor("provincial-budgets", {
            y: ["total_spending"],
            types: ["line"],
            facet: "entity",
            selectedEntities: ["Ontario"],
        })
        expect(scene.nodes.some((n) => n.key.startsWith("facet/"))).toBe(false)
        expect(scene.nodes.some((n) => n.key.startsWith("series/"))).toBe(true)
    })

    it("is deterministic across identical layouts", () => {
        const raw = {
            y: ["total_spending"],
            types: ["line"],
            facet: "entity",
            selectedEntities: ["Ontario", "Quebec", "Alberta", "British Columbia"],
        }
        expect(sceneFor("provincial-budgets", raw)).toEqual(sceneFor("provincial-budgets", raw))
    })
})
