import { describe, expect, it } from "vitest"
import { defaultMeasurer } from "./createMeasurer.ts"
import type { FontSpec } from "./measurer.ts"
import { truncateWithEllipsis } from "./truncate.ts"

const font: FontSpec = { family: "heading", sizePx: 16, weight: 500 }

describe("truncateWithEllipsis", () => {
    it("returns text unchanged when it fits", () => {
        const width = defaultMeasurer.measure("Hello", font).width
        expect(truncateWithEllipsis("Hello", font, width, defaultMeasurer)).toBe("Hello")
    })

    it("truncates to the longest prefix plus a single ellipsis character", () => {
        const text = "Provincial infrastructure spending"
        const maxWidth = 100
        const result = truncateWithEllipsis(text, font, maxWidth, defaultMeasurer)
        expect(result.endsWith("…")).toBe(true)
        expect(result.length).toBeLessThan(text.length)
        expect(defaultMeasurer.measure(result, font).width).toBeLessThanOrEqual(maxWidth)
        // Longest fit: one more codepoint would overflow
        const prefix = [...text].slice(0, [...result].length).join("").trimEnd() + "…"
        expect(defaultMeasurer.measure(prefix, font).width).toBeGreaterThan(maxWidth)
    })

    it("trims trailing spaces before the ellipsis", () => {
        const result = truncateWithEllipsis("Hello world", font, 50, defaultMeasurer)
        expect(result).not.toContain(" …")
    })

    it("returns the empty string when not even the ellipsis fits", () => {
        expect(truncateWithEllipsis("Hello", font, 1, defaultMeasurer)).toBe("")
    })
})
