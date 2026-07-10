import { describe, expect, it } from "vitest"

import { createFuzzySearch, foldAccents, fuzzyMatches, fuzzyScore } from "./fuzzySearch.ts"

interface Entity {
    name: string
    aliases: string[]
}

const entities: Entity[] = [
    { name: "Québec", aliases: ["QC"] },
    { name: "Ontario", aliases: ["ON"] },
    { name: "Global Affairs Canada", aliases: ["Foreign Affairs and International Trade", "DFAIT"] },
    { name: "Innovation, Science and Economic Development Canada", aliases: ["Industry Canada", "ISED"] },
]

function searcher() {
    return createFuzzySearch(entities, (entity) => [entity.name, ...entity.aliases])
}

describe("foldAccents", () => {
    it("strips combining diacritics", () => {
        expect(foldAccents("Québec")).toBe("Quebec")
        expect(foldAccents("Î.-P.-É.")).toBe("I.-P.-E.")
        expect(foldAccents("plain")).toBe("plain")
    })
})

describe("fuzzy search (spec 07 §2)", () => {
    it("matches accented names from unaccented queries", () => {
        const results = searcher().search("quebec")
        expect(results.map((entity) => entity.name)).toEqual(["Québec"])
    })

    it("matches via aliases and dedupes to one result per entity", () => {
        const dfait = searcher().search("DFAIT")
        expect(dfait.map((entity) => entity.name)).toEqual(["Global Affairs Canada"])

        const industry = searcher().search("industry")
        expect(industry.map((entity) => entity.name)).toContain("Innovation, Science and Economic Development Canada")
        expect(industry.length).toBe(new Set(industry).size)
    })

    it("ranks substring matches above subsequence matches", () => {
        const substring = fuzzyScore("ontario", "ontario")
        const subsequence = fuzzyScore("onro", "ontario")
        expect(substring).not.toBeNull()
        expect(subsequence).not.toBeNull()
        expect(substring as number).toBeGreaterThan(subsequence as number)
    })

    it("returns no results for empty or whitespace queries", () => {
        expect(searcher().search("")).toEqual([])
        expect(searcher().search("   ")).toEqual([])
    })

    it("returns no results when nothing matches", () => {
        expect(searcher().search("zzzz")).toEqual([])
    })
})

describe("fuzzyMatches", () => {
    it("treats empty queries as matching and respects accents/aliases", () => {
        expect(fuzzyMatches("", ["Québec"])).toBe(true)
        expect(fuzzyMatches("quebec", ["Québec"])).toBe(true)
        expect(fuzzyMatches("dfait", ["Global Affairs Canada", "DFAIT"])).toBe(true)
        expect(fuzzyMatches("xyzq", ["Ontario"])).toBe(false)
    })
})
