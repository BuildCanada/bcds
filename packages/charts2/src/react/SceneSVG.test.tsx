/**
 * SceneSVG renderer tests (spec 26 §3, spec 28 §2): every node kind renders,
 * output is byte-deterministic under renderToStaticMarkup, numbers are plain
 * decimals (no exponents, no -0), ids never collide across idPrefixes, and
 * dimming touches only seriesKey-owning nodes.
 */

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { ChartScene, SceneNode } from "../core/scene/nodes.ts"
import type { FontSpec } from "../core/text/measurer.ts"
import { SceneSVG } from "./SceneSVG.tsx"

const font: FontSpec = { family: "body", sizePx: 12, weight: 400 }

function minimalScene(): ChartScene {
    const nodes: SceneNode[] = [
        {
            kind: "group",
            key: "plot",
            role: "mark",
            clip: { x: 10, y: 10, width: 180, height: 80 },
            children: [
                {
                    kind: "line",
                    key: "series/alpha/line",
                    seriesKey: "alpha",
                    role: "mark",
                    // Two segments encode a data gap → one d with two subpaths.
                    segments: [
                        [
                            { x: 10, y: 80 },
                            { x: 50, y: 40.5 },
                        ],
                        [
                            { x: 90, y: 30 },
                            { x: 130, y: 20 },
                        ],
                    ],
                    style: { stroke: "#112233", strokeWidth: 2 },
                },
                {
                    kind: "area",
                    key: "series/beta/area",
                    seriesKey: "beta",
                    role: "mark",
                    upper: [
                        { x: 10, y: 40 },
                        { x: 130, y: 30 },
                    ],
                    lower: [
                        { x: 10, y: 80 },
                        { x: 130, y: 80 },
                    ],
                    style: { fill: "#334455", opacity: 0.8 },
                },
                {
                    kind: "rect",
                    key: "series/beta/bar",
                    seriesKey: "beta",
                    role: "mark",
                    // -0.0001 must serialize as "0", never "-0".
                    rect: { x: 20, y: -0.0001, width: 10, height: 30 },
                    style: { fill: "#556677" },
                },
                {
                    kind: "point",
                    key: "series/alpha/point",
                    seriesKey: "alpha",
                    role: "mark",
                    center: { x: 50, y: 40.5 },
                    radius: 3,
                    style: { fill: "#112233" },
                },
            ],
        },
        {
            kind: "image",
            key: "chrome/logo/build-canada-square",
            role: "chrome",
            href: "data:image/svg+xml;base64,PHN2Zy8+",
            rect: { x: 160, y: 5, width: 24, height: 24 },
            preserveAspectRatio: "xMidYMid meet",
        },
        {
            kind: "rule",
            key: "axis/x/domain",
            role: "axis",
            from: { x: 10, y: 90 },
            to: { x: 190, y: 90 },
            style: { stroke: "#000000", strokeWidth: 1, dash: [4, 2] },
        },
        {
            kind: "text",
            key: "chrome/title",
            role: "chrome",
            // 1e-7 must serialize as "0", never exponent notation.
            position: { x: 100, y: 0.0000001 },
            text: "Hello chart",
            font,
            anchor: "middle",
            colour: "#101010",
            measured: { width: 60, ascent: 9, descent: 3 },
        },
    ]
    return {
        width: 200,
        height: 100,
        background: "#fffdf5",
        plotArea: { x: 10, y: 10, width: 180, height: 80 },
        nodes,
        series: [],
        hover: { targets: [] },
        diagnostics: [],
    }
}

const emptyTooltip = { title: "t", rows: [], footers: [] }

function sceneWithTargets(): ChartScene {
    const scene = minimalScene()
    return {
        ...scene,
        hover: {
            targets: [
                { kind: "time", time: 2019, x: 50, tooltip: emptyTooltip },
                { kind: "time", time: 2020, x: 150, tooltip: emptyTooltip },
                {
                    kind: "series",
                    seriesKey: "beta",
                    shape: { x: 20, y: 0, width: 10, height: 30 },
                    tooltip: emptyTooltip,
                },
            ],
            timeGuide: { y0: 10, y1: 90 },
        },
    }
}

describe("SceneSVG", () => {
    it("renders every scene node kind into the expected SVG elements", () => {
        const markup = renderToStaticMarkup(<SceneSVG scene={minimalScene()} idPrefix="p1" />)
        expect(markup).toContain("<svg")
        expect(markup).toContain('role="img"')
        expect(markup).toContain('viewBox="0 0 200 100"')
        expect(markup).toContain('width="200"')
        expect(markup).toContain('height="100"')
        // Background rect in the scene background colour.
        expect(markup).toContain('fill="#fffdf5"')
        // group + clip
        expect(markup).toContain("<clipPath")
        expect(markup).toContain('id="p1-clip-plot"')
        expect(markup).toContain('clip-path="url(#p1-clip-plot)"')
        // line: one path, two subpaths (gap), serialized via d3-shape
        expect(markup).toContain('d="M10,80L50,40.5M90,30L130,20"')
        // area: closed upper + reversed lower
        expect(markup).toContain('d="M10,40L130,30L130,80L10,80Z"')
        // image / rect / point / rule / text
        expect(markup).toContain("<image")
        expect(markup).toContain('href="data:image/svg+xml;base64,PHN2Zy8+"')
        expect(markup).toContain('preserveAspectRatio="xMidYMid meet"')
        expect(markup).toContain("<circle")
        expect(markup).toContain('cx="50"')
        expect(markup).toContain("<line")
        expect(markup).toContain('stroke-dasharray="4 2"')
        expect(markup).toContain("<text")
        expect(markup).toContain("Hello chart")
        expect(markup).toContain('font-family="Söhne Kräftig"')
        expect(markup).toContain("font-feature-settings")
        expect(markup).toContain('text-anchor="middle"')
        expect(markup).toContain('font-size="12"')
    })

    it("emits only plain decimal numbers — no exponents, no -0", () => {
        const markup = renderToStaticMarkup(<SceneSVG scene={minimalScene()} idPrefix="p1" />)
        expect(markup).not.toMatch(/\d[eE][+-]\d/)
        expect(markup).not.toMatch(/(?<!\d)-0(?![.\d])/)
        // The pathological coordinates landed as plain zeros.
        expect(markup).toContain('y="0"')
    })

    it("is byte-identical across repeated renders of the same scene", () => {
        const scene = minimalScene()
        const first = renderToStaticMarkup(<SceneSVG scene={scene} idPrefix="p1" />)
        const second = renderToStaticMarkup(<SceneSVG scene={scene} idPrefix="p1" />)
        expect(second).toBe(first)
    })

    it("two side-by-side idPrefixes share no element ids", () => {
        const scene = minimalScene()
        const left = renderToStaticMarkup(<SceneSVG scene={scene} idPrefix="left" />)
        const right = renderToStaticMarkup(<SceneSVG scene={scene} idPrefix="right" />)
        const ids = (markup: string) => [...markup.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
        const leftIds = ids(left)
        const rightIds = new Set(ids(right))
        expect(leftIds.length).toBeGreaterThan(0)
        for (const id of leftIds) expect(rightIds.has(id)).toBe(false)
    })

    it("dims only nodes carrying a seriesKey outside the emphasized set", () => {
        const markup = renderToStaticMarkup(
            <SceneSVG
                scene={minimalScene()}
                idPrefix="p1"
                emphasis={{ mode: "emphasis", keys: new Set(["alpha"]) }}
                dimOpacity={0.4}
            />,
        )
        // beta area: 0.8 base × 0.4 dim = 0.32; beta bar: 1 × 0.4.
        expect(markup).toContain('opacity="0.32"')
        expect(markup).toContain('opacity="0.4"')
        // alpha line keeps full opacity (no opacity attribute on its path).
        expect(markup).toContain('d="M10,80L50,40.5M90,30L130,20" fill="none" stroke="#112233" stroke-width="2">')
        // Non-series chrome (rule, text) is unaffected.
        expect(markup).toMatch(/<text(?![^>]*opacity)/)
        expect(markup).toMatch(/<line(?![^>]*opacity)/)
    })

    it("is a pass-through when emphasis is idle", () => {
        const scene = minimalScene()
        const idle = renderToStaticMarkup(
            <SceneSVG scene={scene} idPrefix="p1" emphasis={{ mode: "idle" }} dimOpacity={0.4} />,
        )
        const bare = renderToStaticMarkup(<SceneSVG scene={scene} idPrefix="p1" />)
        expect(idle).toBe(bare)
    })

    it("renders pattern defs and a hatch overlay for patternId fills", () => {
        const scene = minimalScene()
        const projected: SceneNode = {
            kind: "rect",
            key: "series/beta/bar/projected",
            seriesKey: "beta",
            role: "mark",
            rect: { x: 40, y: 10, width: 10, height: 20 },
            style: { fill: "#556677", patternId: "projection", opacity: 0.85 },
        }
        const markup = renderToStaticMarkup(
            <SceneSVG scene={{ ...scene, nodes: [...scene.nodes, projected] }} idPrefix="p1" />,
        )
        expect(markup).toContain("<defs>")
        expect(markup).toContain('<pattern id="p1-pattern-projection"')
        expect(markup).toContain('fill="url(#p1-pattern-projection)"')
    })

    it("renders no hit layer or pointer-events suppression when not interactive", () => {
        const markup = renderToStaticMarkup(<SceneSVG scene={sceneWithTargets()} idPrefix="p1" />)
        expect(markup).not.toContain("data-bc-hit")
        expect(markup).not.toContain("pointer-events")
    })

    it("interactive mode builds time strips between midpoints and series hit rects", () => {
        const markup = renderToStaticMarkup(
            <SceneSVG scene={sceneWithTargets()} idPrefix="p1" interactive />,
        )
        // Marks are inert; hits live on the overlay only.
        expect(markup).toContain("pointer-events:none")
        // Strip 1: plot left edge (10) to midpoint (100); strip 2: 100 → 190.
        expect(markup).toContain(
            '<rect data-bc-hit="time:2019" x="10" y="10" width="90" height="80" fill="transparent">',
        )
        expect(markup).toContain(
            '<rect data-bc-hit="time:2020" x="100" y="10" width="90" height="80" fill="transparent">',
        )
        // Series target covers its precomputed shape.
        expect(markup).toContain(
            '<rect data-bc-hit="series:beta" x="20" y="0" width="10" height="30" fill="transparent">',
        )
    })
})
