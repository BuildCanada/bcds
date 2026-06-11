import { describe, expect, it } from "vitest"

import type { Manifest } from "../types.ts"
import { parseManifest } from "./manifest.ts"
import { parseCsv, parseJsonRows } from "./parse.ts"

function manifest(): Manifest {
    const { manifest } = parseManifest({
        name: "test",
        timeGrain: "year",
        columns: { spending: {}, category: { type: "categorical" } },
    })
    return manifest!
}

describe("parseCsv", () => {
    it("parses a simple table with manifest-driven typing", () => {
        const { rows, columns, diagnostics } = parseCsv(
            "entity,time,spending,category\nOntario,2021,189.1,Health\n",
            manifest(),
        )
        expect(diagnostics).toEqual([])
        expect(columns).toEqual(["entity", "time", "spending", "category"])
        expect(rows).toEqual([{ entity: "Ontario", time: "2021", spending: 189.1, category: "Health" }])
    })

    it("strips a UTF-8 byte-order mark", () => {
        const { rows, diagnostics } = parseCsv("\uFEFFentity,time,spending,category\nOntario,2021,1,A\n", manifest())
        expect(diagnostics).toEqual([])
        expect(rows[0].entity).toBe("Ontario")
    })

    it("treats empty cells as null, never zero", () => {
        const { rows } = parseCsv("entity,time,spending,category\nOntario,2021,,\n", manifest())
        expect(rows[0].spending).toBeNull()
        expect(rows[0].spending).not.toBe(0)
        expect(rows[0].category).toBeNull()
    })

    it("flags non-numeric cells in numeric columns with their row number", () => {
        const { rows, diagnostics } = parseCsv(
            "entity,time,spending,category\nOntario,2021,1.5,A\nQuebec,2021,n/a,B\n",
            manifest(),
        )
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({
            severity: "error",
            code: "non-numeric-cell",
            context: { column: "spending", value: "n/a", row: 2 },
        })
        // the offending raw string is kept so validate can report it too
        expect(rows[1].spending).toBe("n/a")
    })

    it("rejects numbers with thousands separators", () => {
        const { diagnostics } = parseCsv("entity,time,spending,category\nOntario,2021,\"12,000\",A\n", manifest())
        expect(diagnostics.some((d) => d.code === "non-numeric-cell")).toBe(true)
    })

    it("rejects ragged rows and skips them", () => {
        const { rows, diagnostics } = parseCsv(
            "entity,time,spending,category\nOntario,2021,1\nQuebec,2021,2,B\n",
            manifest(),
        )
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({ severity: "error", code: "ragged-row", context: { row: 1 } })
        expect(rows).toHaveLength(1)
        expect(rows[0].entity).toBe("Quebec")
    })

    it("handles quoted fields containing commas", () => {
        const { rows, diagnostics } = parseCsv(
            'entity,time,spending,category\n"Innovation, Science and Economic Development Canada",2021,5,A\n',
            manifest(),
        )
        expect(diagnostics).toEqual([])
        expect(rows[0].entity).toBe("Innovation, Science and Economic Development Canada")
    })

    it("errors on an empty file", () => {
        const { diagnostics } = parseCsv("", manifest())
        expect(diagnostics[0].code).toBe("empty-table")
    })
})

describe("parseJsonRows", () => {
    it("normalizes objects into the same row shape as parseCsv", () => {
        const { rows, columns, diagnostics } = parseJsonRows(
            [{ entity: "Ontario", time: 2021, spending: 189.1, category: "Health" }],
            manifest(),
        )
        expect(diagnostics).toEqual([])
        expect(columns).toEqual(["entity", "time", "spending", "category"])
        expect(rows).toEqual([{ entity: "Ontario", time: 2021, spending: 189.1, category: "Health" }])
    })

    it("treats null, undefined and empty-string cells as null", () => {
        const { rows } = parseJsonRows(
            [{ entity: "Ontario", time: 2021, spending: null, category: "" }],
            manifest(),
        )
        expect(rows[0].spending).toBeNull()
        expect(rows[0].category).toBeNull()
    })

    it("strictly parses numeric strings in numeric columns", () => {
        const { rows, diagnostics } = parseJsonRows(
            [
                { entity: "Ontario", time: 2021, spending: "1.5" },
                { entity: "Quebec", time: 2021, spending: "n/a" },
            ],
            manifest(),
        )
        expect(rows[0].spending).toBe(1.5)
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({ code: "non-numeric-cell", context: { row: 2 } })
    })

    it("rejects non-array input", () => {
        const { diagnostics } = parseJsonRows({ entity: "Ontario" }, manifest())
        expect(diagnostics[0].code).toBe("invalid-rows")
    })
})
