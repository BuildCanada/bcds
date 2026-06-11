/**
 * Acceptance test for the deterministic-fonts design (spec 28 §3):
 * the table-based measured width must match the actual rasterized ink
 * extent of the same string rendered by resvg from the real TTF.
 *
 * Ink width ≠ advance width (side bearings at the first/last glyph), so the
 * test string is long and starts/ends with vertical-edge glyphs ("H") to
 * keep the bearing contribution well under the 2% tolerance.
 */

import { Resvg } from "@resvg/resvg-js"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { defaultMeasurer } from "./createMeasurer.ts"
import type { FontSpec } from "./measurer.ts"
import { familyNameFor } from "./metricsTables.ts"

// node:path over `new URL(...)` — happy-dom replaces the URL global
const fontPath = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../../.fonts-cache/soehne-kraftig.ttf",
)

describe("ink width acceptance", () => {
    it("measured width matches rasterized ink width within 2%", () => {
        if (!existsSync(fontPath)) {
            throw new Error(
                `Missing ${fontPath} — regenerate with: bun run scripts/extract-font-metrics.ts`,
            )
        }

        const text = "Household income growth in Quebec and Ontario HHHH"
        const sizePx = 100
        const font: FontSpec = { family: "heading", sizePx, weight: 500 }
        const measured = defaultMeasurer.measure(text, font)

        const pad = 50
        const svgWidth = Math.ceil(measured.width + pad * 2)
        const svgHeight = sizePx * 2
        const family = familyNameFor("heading")
        const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">` +
            `<text x="${pad}" y="${Math.round(sizePx * 1.3)}" font-family="${family}" ` +
            `font-size="${sizePx}" fill="#000" style="font-feature-settings: 'liga' 0">` +
            `${text}</text></svg>`

        const resvg = new Resvg(svg, {
            font: {
                loadSystemFonts: false,
                fontFiles: [fontPath],
                defaultFontFamily: family,
            },
        })
        const rendered = resvg.render()
        const { width, height } = rendered
        const pixels = rendered.pixels

        // Scan RGBA pixels for the inked horizontal extent (alpha > 0).
        let minX = Infinity
        let maxX = -Infinity
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (pixels[(y * width + x) * 4 + 3]! > 0) {
                    if (x < minX) minX = x
                    if (x > maxX) maxX = x
                }
            }
        }
        expect(minX).toBeLessThan(maxX)

        const inkWidth = maxX - minX + 1
        const discrepancy = Math.abs(inkWidth - measured.width) / measured.width
        // eslint-disable-next-line no-console
        console.log(
            `ink width: ${inkWidth}px, measured: ${measured.width.toFixed(2)}px, ` +
                `discrepancy: ${(discrepancy * 100).toFixed(3)}%`,
        )
        expect(discrepancy).toBeLessThan(0.02)
    })
})
