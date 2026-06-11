import { describe, expect, it } from "vitest"
import { createMeasurer, defaultMeasurer } from "./createMeasurer.ts"
import type { FontSpec } from "./measurer.ts"
import { familyNameFor, headingTable, monoTable, serifTable, tables } from "./metricsTables.ts"

const heading = (sizePx: number, letterSpacing?: number): FontSpec => ({
    family: "heading",
    sizePx,
    weight: 500,
    letterSpacing,
})

/*
 * Hand-computed expectations from src/fonts/metrics/soehne-kraftig.json
 * (unitsPerEm 1000, ascent 1171, descent -423, defaultAdvance 632):
 *   "H"      → 736 units
 *   "Hello"  → H 736 + e 540 + l 246 + l 246 + o 566        = 2334 units
 *   "AV"     → A 709 + V 687 + kern(65,86) -90              = 1306 units
 *   "Québec" → Q 730 + u 563 + é 540 + b 595 + e 540 + c 519 = 3487 units
 */
describe("createMeasurer", () => {
    it("measures width as advances scaled by sizePx/unitsPerEm", () => {
        expect(defaultMeasurer.measure("H", heading(20)).width).toBeCloseTo(736 * 0.02, 10)
        expect(defaultMeasurer.measure("Hello", heading(10)).width).toBeCloseTo(2334 * 0.01, 10)
    })

    it("applies GPOS kerning pairs (AV differs from A + V)", () => {
        const av = defaultMeasurer.measure("AV", heading(16)).width
        const a = defaultMeasurer.measure("A", heading(16)).width
        const v = defaultMeasurer.measure("V", heading(16)).width
        expect(av).toBeCloseTo(1306 * 0.016, 10)
        expect(a + v).toBeCloseTo((709 + 687) * 0.016, 10)
        expect(av).toBeLessThan(a + v)
        expect(a + v - av).toBeCloseTo(90 * 0.016, 10)
    })

    it("iterates by codepoint: Québec is 6 codepoints with é measured once", () => {
        expect(defaultMeasurer.measure("Québec", heading(10)).width).toBeCloseTo(3487 * 0.01, 10)
        expect([..."Québec"].length).toBe(6)
    })

    it("adds letterSpacing px per gap (codepoints − 1)", () => {
        const base = defaultMeasurer.measure("Québec", heading(10)).width
        const spaced = defaultMeasurer.measure("Québec", heading(10, 2)).width
        expect(spaced).toBeCloseTo(base + 2 * 5, 10)
    })

    it("does not apply letterSpacing to single-codepoint text", () => {
        expect(defaultMeasurer.measure("H", heading(10, 3)).width).toBeCloseTo(736 * 0.01, 10)
    })

    it("falls back to defaultAdvance for unknown codepoints", () => {
        expect(headingTable.advances["20320"]).toBeUndefined()
        expect(defaultMeasurer.measure("你", heading(10)).width).toBeCloseTo(632 * 0.01, 10)
    })

    it("scales ascent and descent from the table (descent positive)", () => {
        const m = defaultMeasurer.measure("H", heading(10))
        expect(m.ascent).toBeCloseTo(1171 * 0.01, 10)
        expect(m.descent).toBeCloseTo(423 * 0.01, 10)
    })

    it("measures empty text as zero width", () => {
        expect(defaultMeasurer.measure("", heading(16)).width).toBe(0)
    })

    it("uses the mono table for the mono role (no kern pairs)", () => {
        const mono: FontSpec = { family: "mono", sizePx: 10, weight: 400 }
        expect(Object.keys(monoTable.kerning)).toHaveLength(0)
        const expected =
            ((monoTable.advances["65"]! + monoTable.advances["86"]!) * 10) / monoTable.unitsPerEm
        expect(defaultMeasurer.measure("AV", mono).width).toBeCloseTo(expected, 10)
    })

    it("is deterministic across calls and across measurer instances", () => {
        const fresh = createMeasurer(tables)
        const first = defaultMeasurer.measure("Build Canada", heading(14))
        const second = defaultMeasurer.measure("Build Canada", heading(14))
        const third = fresh.measure("Build Canada", heading(14))
        expect(second).toEqual(first)
        expect(third).toEqual(first)
    })

    it("weight does not change measurement (single-weight tables)", () => {
        const w400 = defaultMeasurer.measure("Hello", { family: "body", sizePx: 12, weight: 400 })
        const w700 = defaultMeasurer.measure("Hello", { family: "body", sizePx: 12, weight: 700 })
        expect(w700.width).toBe(w400.width)
    })

    it("exposes table-derived family names for SVG attributes", () => {
        expect(familyNameFor("heading")).toBe("Söhne Kräftig")
        expect(familyNameFor("body")).toBe("Söhne Kräftig")
        expect(familyNameFor("mono")).toBe("Founders Grotesk Mono")
        expect(serifTable.familyName).toBe("Financier Text")
    })
})
