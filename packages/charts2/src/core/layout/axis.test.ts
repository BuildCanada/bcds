import { describe, expect, it } from "vitest"

import { defaultMeasurer } from "../text/createMeasurer.ts"
import {
    horizontalValueAxisNodes,
    linearTicks,
    logTicks,
    prepareValueAxis,
    timeAxisNodes,
    verticalValueAxisNodes,
} from "./axis.ts"
import { computeValueDomain, createValueScale, niceLinearDomain, targetTickCount } from "./scales.ts"
import { buildCanadaTheme } from "../theme/themes.ts"

describe("targetTickCount", () => {
    it("adapts to pixel length and clamps to 2–6", () => {
        expect(targetTickCount(500, 12)).toBe(6)
        expect(targetTickCount(100, 12)).toBe(5)
        expect(targetTickCount(10, 12)).toBe(2)
    })
})

describe("niceLinearDomain", () => {
    it("extends to a round tick when the data edge exceeds the last tick by more than 25% of a step", () => {
        const { domain, ticks } = niceLinearDomain(0, 97, 6)
        expect(domain).toEqual([0, 100])
        expect(ticks).toContain(100)
        for (const tick of ticks) expect(tick % 10).toBe(0)
    })

    it("keeps the data edge when the overshoot is within 25% of a step", () => {
        const { domain, ticks } = niceLinearDomain(0, 81, 6)
        expect(domain).toEqual([0, 81])
        expect(ticks[ticks.length - 1]).toBe(80)
    })

    it("extends below the first tick symmetrically", () => {
        const { domain } = niceLinearDomain(-97, 0, 6)
        expect(domain[0]).toBe(-100)
    })

    it("degenerates gracefully for a single value", () => {
        expect(niceLinearDomain(5, 5, 6)).toEqual({ domain: [5, 5], ticks: [5] })
    })
})

describe("linearTicks", () => {
    it("produces round in-domain ticks and marks zero solid", () => {
        const { domain, ticks } = linearTicks([0, 97], 6)
        for (const tick of ticks) {
            expect(tick.value).toBeGreaterThanOrEqual(domain[0])
            expect(tick.value).toBeLessThanOrEqual(domain[1])
        }
        const zero = ticks.find((t) => t.value === 0)
        expect(zero?.solid).toBe(true)
    })
})

describe("logTicks", () => {
    it("prioritizes powers of ten over 2×/5× over in-between values", () => {
        const ticks = logTicks([1, 1000], 6)
        const p1 = ticks.filter((t) => t.priority === 1).map((t) => t.value)
        expect(p1).toEqual(expect.arrayContaining([1, 10, 100, 1000]))
        for (const tick of ticks) expect(tick.value).toBeGreaterThan(0)
    })
})

describe("computeValueDomain", () => {
    it("always includes zero for bar marks", () => {
        const { min, max } = computeValueDomain({ values: [40, 80], markType: "bar", scaleType: "linear" })
        expect(min).toBe(0)
        expect(max).toBe(80)
    })

    it("includes zero for lines by default but releases it with min auto", () => {
        const anchored = computeValueDomain({ values: [40, 80], markType: "line", scaleType: "linear" })
        expect(anchored.min).toBe(0)
        const released = computeValueDomain({
            values: [40, 80],
            markType: "line",
            scaleType: "linear",
            config: { min: "auto" },
        })
        expect(released.min).toBe(40)
    })

    it("honours manual min/max", () => {
        const { min, max } = computeValueDomain({
            values: [40, 80],
            markType: "line",
            scaleType: "linear",
            config: { min: 10, max: 200 },
        })
        expect(min).toBe(10)
        expect(max).toBe(200)
    })

    it("excludes non-positive values on log scales with a counted diagnostic", () => {
        const result = computeValueDomain({ values: [-5, 0, 10, 100], markType: "line", scaleType: "log" })
        expect(result.min).toBe(10)
        expect(result.excludedCount).toBe(2)
        expect(result.diagnostics[0]?.code).toBe("log-excluded-values")
        expect(result.diagnostics[0]?.context?.count).toBe(2)
    })
})

describe("prepareValueAxis", () => {
    const base = {
        markType: "line" as const,
        pixelLength: 400,
        font: { family: "body" as const, sizePx: 12, weight: 400 as const },
        meta: { type: "numeric" as const },
        locale: "en" as const,
        measurer: defaultMeasurer,
    }

    it("formats and measures every labelled tick", () => {
        const spec = prepareValueAxis({ ...base, values: [0, 50, 97], scaleType: "linear" })
        for (const tick of spec.ticks) {
            expect(tick.label).not.toBe("")
            expect(tick.metrics.width).toBeGreaterThan(0)
        }
        expect(spec.maxLabelWidth).toBeGreaterThan(0)
    })

    it("reports log exclusions through the spec diagnostics", () => {
        const spec = prepareValueAxis({ ...base, values: [-1, 0, 5, 500], scaleType: "log" })
        expect(spec.excludedCount).toBe(2)
        expect(spec.diagnostics.some((d) => d.code === "log-excluded-values")).toBe(true)
        for (const tick of spec.ticks) expect(tick.value).toBeGreaterThan(0)
    })

    it("pins the max for relative stacked mode", () => {
        const spec = prepareValueAxis({
            ...base,
            values: [0, 40, 60],
            scaleType: "linear",
            markType: "bar",
            pinnedMax: 100,
        })
        expect(spec.domain[1]).toBe(100)
    })
})

describe("axis nodes", () => {
    const font = { family: "body" as const, sizePx: 12, weight: 400 as const }
    const plotArea = { x: 40, y: 20, width: 300, height: 180 }

    it("renders y-axis spacing gridlines as dashed except the solid zero line", () => {
        const spec = prepareValueAxis({
            markType: "line",
            scaleType: "linear",
            values: [0, 100],
            pixelLength: 180,
            font,
            meta: { type: "numeric" },
            locale: "en",
            measurer: defaultMeasurer,
        })
        const scale = createValueScale("linear", spec.domain, [200, 20])
        const nodes = verticalValueAxisNodes(spec, scale, plotArea, 20, { theme: buildCanadaTheme, font })
        const gridRules = nodes.filter((node) => node.kind === "rule" && node.role === "grid")
        expect(gridRules.some((node) => node.kind === "rule" && node.style.dash?.join(",") === "4,4")).toBe(true)
        const zero = gridRules.find((node) => node.key === "axis/y/grid/0")
        expect(zero?.kind === "rule" ? zero.style.dash : undefined).toBeUndefined()
    })

    it("renders vertical value-axis gridlines as dashed without duplicate bottom tick marks", () => {
        const spec = prepareValueAxis({
            markType: "bar",
            scaleType: "linear",
            values: [0, 100],
            pixelLength: 300,
            font,
            meta: { type: "numeric" },
            locale: "en",
            measurer: defaultMeasurer,
        })
        const scale = createValueScale("linear", spec.domain, [40, 340])
        const nodes = horizontalValueAxisNodes(spec, scale, plotArea, plotArea, { theme: buildCanadaTheme, font })
        const gridRules = nodes.filter((node) => node.kind === "rule" && node.role === "grid")
        expect(gridRules.some((node) => node.kind === "rule" && node.style.dash?.join(",") === "4,4")).toBe(true)
        const zero = gridRules.find((node) => node.key === "axis/x/grid/0")
        expect(zero?.kind === "rule" ? zero.style.dash : undefined).toBeUndefined()
        expect(nodes.some((node) => node.kind === "rule" && node.key.startsWith("axis/x/tick-mark/"))).toBe(false)
        expect(nodes.some((node) => node.kind === "text" && node.key.startsWith("axis/x/tick/"))).toBe(true)
    })

    it("renders x-axis tick marks when vertical gridlines are hidden", () => {
        const spec = prepareValueAxis({
            markType: "bar",
            scaleType: "linear",
            values: [0, 100],
            pixelLength: 300,
            font,
            meta: { type: "numeric" },
            locale: "en",
            measurer: defaultMeasurer,
        })
        const scale = createValueScale("linear", spec.domain, [40, 340])
        const nodes = horizontalValueAxisNodes(spec, scale, plotArea, plotArea, {
            theme: buildCanadaTheme,
            font,
            hideGridlines: true,
        })
        expect(nodes.some((node) => node.kind === "rule" && node.key.startsWith("axis/x/tick-mark/"))).toBe(true)
        expect(nodes.some((node) => node.kind === "text" && node.key.startsWith("axis/x/tick/"))).toBe(true)
    })

    it("renders time-axis tick marks that descend to visible tick labels", () => {
        const nodes = timeAxisNodes({
            times: [2020, 2021, 2022],
            place: (time) => 40 + (time - 2020) * 150,
            plotArea,
            clampBounds: plotArea,
            grain: "year",
            locale: "en",
            theme: buildCanadaTheme,
            measurer: defaultMeasurer,
            font,
        })
        expect(nodes.some((node) => node.kind === "rule" && node.key.startsWith("axis/x/tick-mark/"))).toBe(true)
        expect(nodes.some((node) => node.kind === "text" && node.key.startsWith("axis/x/tick/"))).toBe(true)
    })
})
