import { describe, expect, it } from "vitest"

import {
    assignColours,
    createColourState,
    FALLBACK_COLOUR,
} from "./categoricalAssigner.ts"

const palette = ["#p0", "#p1", "#p2", "#p3", "#p4"] as const

describe("createColourState", () => {
    it("keeps the palette by reference and starts with no assignments", () => {
        const state = createColourState(palette)
        expect(state.palette).toBe(palette)
        expect(state.assigned).toEqual({})
    })

    it("is a plain serializable object that survives a JSON round-trip", () => {
        const state = createColourState(palette)
        assignColours(state, ["A", "B"])
        const revived = JSON.parse(JSON.stringify(state))
        expect(assignColours(revived, ["A", "B", "C"])).toEqual(
            new Map([
                ["A", "#p0"],
                ["B", "#p1"],
                ["C", "#p2"],
            ]),
        )
    })
})

describe("assignColours", () => {
    it("assigns palette colours in palette order for fresh series", () => {
        const state = createColourState(palette)
        expect(assignColours(state, ["A", "B", "C"])).toEqual(
            new Map([
                ["A", "#p0"],
                ["B", "#p1"],
                ["C", "#p2"],
            ]),
        )
    })

    it("is deterministic: same inputs produce the same map twice", () => {
        const run = () => {
            const state = createColourState(palette)
            const fixed = new Map([["B", "#fixed"]])
            return assignColours(state, ["A", "B", "C", "D"], fixed)
        }
        expect(run()).toEqual(run())
    })

    it("returns identical colours when called again on the same state", () => {
        const state = createColourState(palette)
        const first = assignColours(state, ["A", "B", "C"])
        const second = assignColours(state, ["A", "B", "C"])
        expect(second).toEqual(first)
    })

    it("persists colours when series are removed and added (A,B,C → -B → +D,E)", () => {
        const state = createColourState(palette)
        const first = assignColours(state, ["A", "B", "C"])

        // remove B, add D and E
        const second = assignColours(state, ["A", "C", "D", "E"])

        // surviving series never change colour
        expect(second.get("A")).toBe(first.get("A"))
        expect(second.get("C")).toBe(first.get("C"))

        // B keeps its reservation within the session: D and E take the
        // next unused palette colours, not B's
        expect(second.get("D")).toBe("#p3")
        expect(second.get("E")).toBe("#p4")

        // re-adding B returns its original colour
        const third = assignColours(state, ["A", "B", "C", "D", "E"])
        expect(third.get("B")).toBe(first.get("B"))
    })

    it("does not reshuffle colours when series are reordered", () => {
        const state = createColourState(palette)
        const first = assignColours(state, ["A", "B", "C"])
        const reordered = assignColours(state, ["C", "A", "B"])
        for (const key of ["A", "B", "C"]) {
            expect(reordered.get(key)).toBe(first.get(key))
        }
    })

    it("gives fixed assignments precedence and skips their palette colours", () => {
        const state = createColourState(palette)
        const fixed = new Map([["B", "#p2"]])
        const result = assignColours(state, ["A", "B", "C"], fixed)
        expect(result.get("B")).toBe("#p2")
        // auto assignment skips #p2 even though B comes after A
        expect(result.get("A")).toBe("#p0")
        expect(result.get("C")).toBe("#p1")
    })

    it("claims fixed palette colours even before the fixed series is reached", () => {
        const state = createColourState(palette)
        const fixed = new Map([["Z", "#p0"]])
        // Z is not even in seriesKeys, but its colour is claimed
        const result = assignColours(state, ["A"], fixed)
        expect(result.get("A")).toBe("#p1")
    })

    it("lets fixed override a previously cached colour", () => {
        const state = createColourState(palette)
        expect(assignColours(state, ["A"]).get("A")).toBe("#p0")
        const fixed = new Map([["A", "#brand"]])
        expect(assignColours(state, ["A"], fixed).get("A")).toBe("#brand")
        // the override is cached: it sticks even without the fixed map
        expect(assignColours(state, ["A"]).get("A")).toBe("#brand")
    })

    it("supports off-palette fixed colours without disturbing palette order", () => {
        const state = createColourState(palette)
        const fixed = new Map([["B", "#off-palette"]])
        const result = assignColours(state, ["A", "B", "C"], fixed)
        expect(result.get("A")).toBe("#p0")
        expect(result.get("B")).toBe("#off-palette")
        expect(result.get("C")).toBe("#p1")
    })

    it("repeats colours least-used-first when the palette is exhausted", () => {
        const small = ["#p0", "#p1", "#p2"]
        const state = createColourState(small)
        const result = assignColours(state, ["A", "B", "C", "D", "E", "F", "G"])
        expect([...result.values()]).toEqual([
            "#p0",
            "#p1",
            "#p2",
            "#p0",
            "#p1",
            "#p2",
            "#p0",
        ])
    })

    it("falls back to black on an empty palette", () => {
        const state = createColourState([])
        expect(assignColours(state, ["A"]).get("A")).toBe(FALLBACK_COLOUR)
    })

    it("returns the map in seriesKeys order", () => {
        const state = createColourState(palette)
        const result = assignColours(state, ["C", "A", "B"])
        expect([...result.keys()]).toEqual(["C", "A", "B"])
    })
})
