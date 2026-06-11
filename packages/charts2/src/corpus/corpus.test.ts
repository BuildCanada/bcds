/**
 * Golden SVG corpus tests (spec 26 §1.3 + §3).
 *
 * Every corpus case is re-rendered and compared byte-for-byte against its
 * committed golden in __golden__/. Cross-cutting invariants run on every
 * generated SVG: no NaN/Infinity, no exponent-notation coordinates, light
 * XML well-formedness, and same-inputs → same-bytes determinism.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Window } from "happy-dom"
import { describe, expect, it } from "vitest"

import { corpusCases, renderCorpusCase, XML_DECLARATION } from "./corpus.ts"

const goldenDir = join(dirname(fileURLToPath(import.meta.url)), "__golden__")

const REBLESS = "run `bun src/corpus/bless.ts` to re-bless after intentional changes"

/** Exponent-notation numeric token like "1e-7" or "2.5E+10".
 * The delimiter guards prevent false positives in hex colours such as #be5915. */
const EXPONENT_COORD = /(?:^|[\s=",])[-+]?\d+(?:\.\d+)?[eE][-+]?\d+(?=$|[\s=",])/
const DOMParser = new Window().DOMParser

describe("corpus definition", () => {
    it("case names are unique", () => {
        const names = corpusCases.map((corpusCase) => corpusCase.name)
        expect(new Set(names).size).toBe(names.length)
    })

    it("covers all five chart types at all three sizes", () => {
        const types = ["line", "discrete-bar", "stacked-area", "stacked-bar", "stacked-discrete-bar"]
        for (const type of types) {
            const sizes = new Set(
                corpusCases
                    .filter((corpusCase) => corpusCase.name.startsWith(`${type}--`))
                    .map((corpusCase) => `${corpusCase.size.width}x${corpusCase.size.height}`),
            )
            expect(sizes, `sizes covered for ${type}`).toEqual(new Set(["300x160", "850x600", "1200x600"]))
        }
    })

    it("the golden directory has exactly one .svg per case", () => {
        const files = readdirSync(goldenDir)
            .filter((file) => file.endsWith(".svg"))
            .sort()
        const expected = corpusCases.map((corpusCase) => `${corpusCase.name}.svg`).sort()
        expect(files, REBLESS).toEqual(expected)
    })
})

describe.each(corpusCases.map((corpusCase) => [corpusCase.name, corpusCase] as const))(
    "corpus case %s",
    (name, corpusCase) => {
        const svg = renderCorpusCase(corpusCase)

        it("matches the committed golden byte-for-byte", () => {
            const goldenPath = join(goldenDir, `${name}.svg`)
            expect(existsSync(goldenPath), `missing golden ${goldenPath} — ${REBLESS}`).toBe(true)
            const golden = readFileSync(goldenPath, "utf8")
            expect(`${svg}\n`, REBLESS).toBe(golden)
        })

        it("two consecutive generations are byte-identical", () => {
            expect(renderCorpusCase(corpusCase)).toBe(svg)
        })

        it("contains no NaN, Infinity, or exponent-notation coordinates", () => {
            expect(svg).not.toContain("NaN")
            expect(svg).not.toContain("Infinity")
            expect(EXPONENT_COORD.test(svg)).toBe(false)
        })

        it("starts with the XML declaration and parses as XML", () => {
            expect(svg.startsWith(`${XML_DECLARATION}\n<svg`)).toBe(true)
            const body = svg.slice(svg.indexOf("\n") + 1)
            const parsed = new DOMParser().parseFromString(body, "image/svg+xml")
            expect(parsed.documentElement).not.toBeNull()
            expect(parsed.documentElement.tagName.toLowerCase()).toBe("svg")
            expect(parsed.querySelector("parsererror")).toBeNull()
            expect(parsed.documentElement.childNodes.length).toBeGreaterThan(0)
        })
    },
)
