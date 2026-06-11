/**
 * Chart interaction tests (happy-dom, spec 26 §3). The load-bearing
 * assertion: hover and focus apply emphasis on the EXISTING scene and never
 * call layoutChart — re-layout happens only for definition/dataset/view/size
 * changes (spec 07 §3, spec 28 §1).
 */

import { fireEvent, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadFixtureDataset } from "../fixtures/index.ts"
import { parseDefinition } from "../core/definition/schema.ts"
import { layoutChart } from "../core/layout/layoutChart.ts"
import { buildCanadaTheme } from "../core/theme/themes.ts"
import type { ChartDefinition } from "../core/types.ts"
import { Chart } from "./Chart.tsx"

vi.mock("../core/layout/layoutChart.ts", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../core/layout/layoutChart.ts")>()
    return { ...actual, layoutChart: vi.fn(actual.layoutChart) }
})

const layoutSpy = vi.mocked(layoutChart)

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Test chart", data: "fixture", ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

const { dataset } = loadFixtureDataset("provincial-budgets")

beforeEach(() => {
    layoutSpy.mockClear()
})

describe("Chart", () => {
    it("renders a chart scene from a fixture definition", () => {
        const { container } = render(
            <Chart
                definition={definitionFor({ y: ["total_spending"], types: ["line"] })}
                dataset={dataset}
                width={850}
                height={600}
            />,
        )
        const svg = container.querySelector("svg")
        expect(svg).not.toBeNull()
        expect(svg?.getAttribute("role")).toBe("img")
        expect(svg?.getAttribute("width")).toBe("850")
        expect(container.querySelectorAll("path").length).toBeGreaterThan(0)
        expect(container.querySelectorAll("[data-bc-hit]").length).toBeGreaterThan(0)
    })

    it("uses the 850×600 default size before the container is measured", () => {
        const { container } = render(
            <Chart definition={definitionFor({ y: ["total_spending"], types: ["line"] })} dataset={dataset} />,
        )
        const svg = container.querySelector("svg")
        expect(svg?.getAttribute("viewBox")).toBe("0 0 850 600")
    })

    it("hover shows the tooltip via the render prop and never relayouts", () => {
        const seen: string[] = []
        const { container } = render(
            <Chart
                definition={definitionFor({ y: ["total_spending"], types: ["line"] })}
                dataset={dataset}
                width={850}
                height={600}
                renderTooltip={({ tooltip }) => {
                    seen.push(tooltip.title)
                    return <span data-testid="tip">{tooltip.title}</span>
                }}
            />,
        )
        const layoutCallsAfterMount = layoutSpy.mock.calls.length
        expect(layoutCallsAfterMount).toBeGreaterThan(0)

        const strips = [...container.querySelectorAll('[data-bc-hit^="time:"]')]
        expect(strips.length).toBeGreaterThan(1)

        fireEvent.pointerMove(strips[0], { clientX: 100, clientY: 100 })
        expect(seen.length).toBeGreaterThan(0)
        expect(container.querySelector('[data-testid="tip"]')).not.toBeNull()

        fireEvent.pointerMove(strips[1], { clientX: 200, clientY: 100 })
        // Hover NEVER calls layoutChart (spec 07 §3).
        expect(layoutSpy.mock.calls.length).toBe(layoutCallsAfterMount)
    })

    it("hover keeps the rendered scene referentially stable", () => {
        const { container } = render(
            <Chart
                definition={definitionFor({ y: ["total_spending"], types: ["line"] })}
                dataset={dataset}
                width={850}
                height={600}
                renderTooltip={({ tooltip }) => <span>{tooltip.title}</span>}
            />,
        )
        const pathBefore = container.querySelector("path")
        const strip = container.querySelector('[data-bc-hit^="time:"]')
        expect(strip).not.toBeNull()
        fireEvent.pointerMove(strip as Element, { clientX: 120, clientY: 90 })
        // Same scene, same React elements → the mark DOM nodes are untouched.
        expect(container.querySelector("path")).toBe(pathBefore)
        const results = layoutSpy.mock.results
        const scenes = new Set(results.map((r) => r.value))
        expect(scenes.size).toBe(1)
    })

    it("click toggles focus emphasis and Escape clears it — without relayout", () => {
        const { container } = render(
            <Chart
                definition={definitionFor({ y: ["total_spending"], types: ["discrete-bar"] })}
                dataset={dataset}
                width={850}
                height={600}
            />,
        )
        const layoutCallsAfterMount = layoutSpy.mock.calls.length
        const dim = buildCanadaTheme.palette.dimOpacity.toString()

        const target = container.querySelector('[data-bc-hit="series:Ontario"]')
        expect(target).not.toBeNull()
        fireEvent.click(target as Element)

        // Other series are dimmed by the theme dim factor; Ontario is not.
        const dimmed = [...container.querySelectorAll(`[opacity="${dim}"]`)]
        expect(dimmed.length).toBeGreaterThan(0)

        fireEvent.keyDown(window, { key: "Escape" })
        expect(container.querySelectorAll(`[opacity="${dim}"]`).length).toBe(0)

        // Focus and escape NEVER call layoutChart.
        expect(layoutSpy.mock.calls.length).toBe(layoutCallsAfterMount)
    })
})
