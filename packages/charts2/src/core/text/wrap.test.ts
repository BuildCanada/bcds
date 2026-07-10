import { describe, expect, it } from "vitest"
import { defaultMeasurer } from "./createMeasurer.ts"
import type { FontSpec } from "./measurer.ts"
import { LINE_HEIGHT, shrinkToFit, wrapText } from "./wrap.ts"

const heading = (sizePx: number): FontSpec => ({ family: "heading", sizePx, weight: 500 })

describe("wrapText", () => {
    it("keeps text that fits exactly on one line", () => {
        const font = heading(16)
        const width = defaultMeasurer.measure("Hello world", font).width
        const wrapped = wrapText("Hello world", font, width, defaultMeasurer)
        expect(wrapped.lines).toEqual(["Hello world"])
        expect(wrapped.width).toBeCloseTo(width, 10)
        expect(wrapped.height).toBeCloseTo(LINE_HEIGHT * 16, 10)
    })

    it("breaks on spaces, never mid-word, when words fit", () => {
        const font = heading(16)
        // "world" is wider than "Hello" in Söhne; size to the wider word
        const maxWidth = defaultMeasurer.measure("world", font).width
        const wrapped = wrapText("Hello world", font, maxWidth, defaultMeasurer)
        expect(wrapped.lines).toEqual(["Hello", "world"])
        expect(wrapped.height).toBeCloseTo(2 * LINE_HEIGHT * 16, 10)
        for (const line of wrapped.lines) {
            expect(defaultMeasurer.measure(line, font).width).toBeLessThanOrEqual(maxWidth)
        }
    })

    it("hard-breaks a single word wider than maxWidth, without a hyphen", () => {
        const font = heading(16)
        const maxWidth = defaultMeasurer.measure("Hel", font).width
        const wrapped = wrapText("Hello", font, maxWidth, defaultMeasurer)
        expect(wrapped.lines.length).toBeGreaterThan(1)
        expect(wrapped.lines.join("")).toBe("Hello")
        for (const line of wrapped.lines) {
            expect(line).not.toContain("-")
            expect(defaultMeasurer.measure(line, font).width).toBeLessThanOrEqual(maxWidth)
        }
    })

    it("wraps the empty string to zero lines", () => {
        expect(wrapText("", heading(16), 100, defaultMeasurer)).toEqual({
            lines: [],
            width: 0,
            height: 0,
        })
    })

    it("wraps a single character to one line", () => {
        const wrapped = wrapText("H", heading(16), 100, defaultMeasurer)
        expect(wrapped.lines).toEqual(["H"])
        expect(wrapped.height).toBeCloseTo(LINE_HEIGHT * 16, 10)
    })

    it("treats explicit newlines as forced breaks", () => {
        const wrapped = wrapText("one\ntwo", heading(16), 1000, defaultMeasurer)
        expect(wrapped.lines).toEqual(["one", "two"])
    })
})

describe("shrinkToFit", () => {
    const text = "Government of Canada infrastructure spending by province"

    it("returns the original font when the text already fits", () => {
        const font = heading(16)
        const result = shrinkToFit(text, font, 10_000, 2, defaultMeasurer, 12)
        expect(result.font.sizePx).toBe(16)
        expect(result.lines.length).toBeLessThanOrEqual(2)
    })

    it("steps sizePx down in 0.5px increments until the text fits", () => {
        const font = heading(20)
        const result = shrinkToFit(text, font, 220, 2, defaultMeasurer, 10)
        expect(result.font.sizePx).toBeLessThan(20)
        expect(result.font.sizePx).toBeGreaterThanOrEqual(10)
        expect((result.font.sizePx * 2) % 1).toBe(0)
        expect(result.lines.length).toBeLessThanOrEqual(2)
        for (const line of result.lines) {
            expect(defaultMeasurer.measure(line, result.font).width).toBeLessThanOrEqual(220)
        }
        // No truncation was needed
        expect(result.lines.join(" ")).toBe(text)
    })

    it("truncates with an ellipsis at minSizePx when shrinking is not enough", () => {
        const font = heading(20)
        const result = shrinkToFit(text, font, 80, 1, defaultMeasurer, 12)
        expect(result.font.sizePx).toBe(12)
        expect(result.lines).toHaveLength(1)
        expect(result.lines[0]!.endsWith("…")).toBe(true)
        expect(defaultMeasurer.measure(result.lines[0]!, result.font).width).toBeLessThanOrEqual(80)
    })
})
