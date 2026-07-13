import { describe, expect, it } from "vitest"
import { enCA, frCA, longScaleWord, shortScaleSuffixes } from "./locales.ts"

describe("static d3-format locales", () => {
    it("en-CA groups thousands with commas and a leading dollar symbol", () => {
        expect(enCA.format("$,.0f")(1234567)).toBe("$1,234,567")
    })

    it("fr-CA groups thousands with narrow NBSP and a decimal comma", () => {
        expect(frCA.format(",.1f")(1234567.8)).toBe("1\u202f234\u202f567,8")
    })

    it("fr-CA places the currency symbol after the number behind an NBSP", () => {
        expect(frCA.format("$,.0f")(1234)).toBe("1\u202f234\u00a0$")
    })
})

describe("longScaleWord pluralization", () => {
    it("English scale words never pluralize after a numeral", () => {
        expect(longScaleWord(9, "en", 24.1)).toBe("billion")
    })

    it("French scale words stay singular below two", () => {
        expect(longScaleWord(9, "fr", 1.9)).toBe("milliard")
    })

    it("French scale words pluralize from two upward", () => {
        expect(longScaleWord(9, "fr", 2)).toBe("milliards")
    })

    it("French pluralization considers magnitude, not sign", () => {
        expect(longScaleWord(6, "fr", -3)).toBe("millions")
    })

    it("French 1e12 is the long-scale billion", () => {
        expect(longScaleWord(12, "fr", 1)).toBe("billion")
    })

    it("French SI-style tick suffixes use G for milliard", () => {
        expect(shortScaleSuffixes.fr[9]).toBe("G")
        expect(shortScaleSuffixes.en[9]).toBe("B")
    })
})
