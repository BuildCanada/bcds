import { describe, expect, it } from "vitest"

import type { TimeGrain, ViewState } from "../types.ts"
import { paramsToViewState, viewStateToParams } from "./urlState.ts"

function decode(query: string, grain: TimeGrain = "year") {
    return paramsToViewState(new URLSearchParams(query), grain)
}

describe("viewStateToParams encoding", () => {
    const encodeCases: { name: string; state: ViewState; grain: TimeGrain; expected: string }[] = [
        { name: "tab", state: { tab: "discrete-bar" }, grain: "year", expected: "tab=discrete-bar" },
        { name: "table tab", state: { tab: "table" }, grain: "year", expected: "tab=table" },
        {
            name: "fiscal-year time range",
            state: { time: { start: 2014, end: 2024 } },
            grain: "fiscal-year",
            expected: "time=2014-15..2024-25",
        },
        {
            name: "year time range",
            state: { time: { start: 2010, end: 2024 } },
            grain: "year",
            expected: "time=2010..2024",
        },
        {
            name: "earliest..year",
            state: { time: { start: "earliest", end: 2020 } },
            grain: "year",
            expected: "time=earliest..2020",
        },
        {
            name: "collapsed latest",
            state: { time: { start: "latest", end: "latest" } },
            grain: "fiscal-year",
            expected: "time=latest",
        },
        {
            name: "collapsed single year",
            state: { time: { start: 2020, end: 2020 } },
            grain: "year",
            expected: "time=2020",
        },
        {
            name: "quarter range",
            state: { time: { start: 2024 * 4, end: 2024 * 4 + 3 } },
            grain: "quarter",
            expected: "time=2024-Q1..2024-Q4",
        },
        { name: "yScale", state: { yScale: "log" }, grain: "year", expected: "yScale=log" },
        { name: "stackMode", state: { stackMode: "relative" }, grain: "year", expected: "stackMode=relative" },
        { name: "facet", state: { facet: "entity" }, grain: "year", expected: "facet=entity" },
        {
            name: "tableSort",
            state: { tableSort: { column: "spending", order: "asc" } },
            grain: "year",
            expected: "tableSort=spending%3Aasc",
        },
        { name: "tableScope", state: { tableScope: "all" }, grain: "year", expected: "tableScope=all" },
    ]

    for (const { name, state, grain, expected } of encodeCases) {
        it(`encodes ${name} as ${expected}`, () => {
            expect(viewStateToParams(state, grain).toString()).toBe(expected)
        })
    }

    it("encodes entity lists with ~ joins and per-name URL encoding", () => {
        const params = viewStateToParams({ entities: ["Île-du-Prince-Édouard", "Ontario"] }, "year")
        expect(params.get("entities")).toBe("%C3%8Ele-du-Prince-%C3%89douard~Ontario")
    })

    it("writes nothing for an empty state", () => {
        expect(viewStateToParams({}, "year").toString()).toBe("")
    })

    it("omits undefined fields entirely", () => {
        const params = viewStateToParams({ tab: "line" }, "year")
        expect([...params.keys()]).toEqual(["tab"])
    })
})

describe("paramsToViewState decoding", () => {
    const decodeCases: { name: string; query: string; grain: TimeGrain; expected: ViewState }[] = [
        { name: "tab", query: "tab=stacked-area", grain: "year", expected: { tab: "stacked-area" } },
        {
            name: "fiscal-year range",
            query: "time=2014-15..2024-25",
            grain: "fiscal-year",
            expected: { time: { start: 2014, end: 2024 } },
        },
        {
            name: "year range",
            query: "time=2010..2024",
            grain: "year",
            expected: { time: { start: 2010, end: 2024 } },
        },
        {
            name: "earliest..year",
            query: "time=earliest..2020",
            grain: "year",
            expected: { time: { start: "earliest", end: 2020 } },
        },
        {
            name: "bare latest",
            query: "time=latest",
            grain: "fiscal-year",
            expected: { time: { start: "latest", end: "latest" } },
        },
        {
            name: "single year",
            query: "time=2020",
            grain: "year",
            expected: { time: { start: 2020, end: 2020 } },
        },
        {
            name: "month range",
            query: "time=2024-01..2024-06",
            grain: "month",
            expected: { time: { start: 2024 * 12, end: 2024 * 12 + 5 } },
        },
        {
            name: "accented entities",
            query: "entities=%C3%8Ele-du-Prince-%C3%89douard~Ontario",
            grain: "year",
            expected: { entities: ["Île-du-Prince-Édouard", "Ontario"] },
        },
        { name: "focus", query: "focus=Alberta", grain: "year", expected: { focus: ["Alberta"] } },
        { name: "yScale", query: "yScale=linear", grain: "year", expected: { yScale: "linear" } },
        { name: "stackMode", query: "stackMode=absolute", grain: "year", expected: { stackMode: "absolute" } },
        { name: "facet", query: "facet=metric", grain: "year", expected: { facet: "metric" } },
        {
            name: "tableSort",
            query: "tableSort=spending:desc",
            grain: "year",
            expected: { tableSort: { column: "spending", order: "desc" } },
        },
        { name: "tableScope", query: "tableScope=selected", grain: "year", expected: { tableScope: "selected" } },
    ]

    for (const { name, query, grain, expected } of decodeCases) {
        it(`decodes ${name} from "${query}"`, () => {
            const { state, diagnostics } = decode(query, grain)
            expect(diagnostics).toEqual([])
            expect(state).toEqual(expected)
        })
    }

    it("decodes an empty entities param as an empty selection", () => {
        const { state } = decode("entities=")
        expect(state.entities).toEqual([])
    })

    it("ignores parameter names it does not own, without diagnostics", () => {
        const { state, diagnostics } = decode("utm_source=newsletter&page=2")
        expect(state).toEqual({})
        expect(diagnostics).toEqual([])
    })
})

describe("paramsToViewState never throws on bad input", () => {
    const invalidCases: { name: string; query: string; grain: TimeGrain }[] = [
        { name: "unknown tab", query: "tab=pie", grain: "year" },
        { name: "unparseable time", query: "time=banana", grain: "year" },
        { name: "half-bad time range", query: "time=2010..banana", grain: "year" },
        { name: "triple-dotted time", query: "time=2010..2020..2024", grain: "year" },
        { name: "fiscal string under year grain", query: "time=2014-15", grain: "year" },
        { name: "unknown yScale", query: "yScale=cubic", grain: "year" },
        { name: "unknown stackMode", query: "stackMode=normalized", grain: "year" },
        { name: "unknown facet", query: "facet=both", grain: "year" },
        { name: "tableSort with dot separator", query: "tableSort=spending.asc", grain: "year" },
        { name: "tableSort with unknown order", query: "tableSort=spending:up", grain: "year" },
        { name: "tableSort without column", query: "tableSort=:asc", grain: "year" },
        { name: "unknown tableScope", query: "tableScope=everything", grain: "year" },
        { name: "malformed percent-encoding", query: "entities=%E0%A4%A", grain: "year" },
    ]

    for (const { name, query, grain } of invalidCases) {
        it(`drops the field and warns for ${name}`, () => {
            const { state, diagnostics } = decode(query, grain)
            expect(state).toEqual({})
            expect(diagnostics).toEqual([
                expect.objectContaining({ severity: "warning", code: "invalid-url-param" }),
            ])
        })
    }

    it("keeps valid params while dropping invalid ones", () => {
        const { state, diagnostics } = decode("tab=line&yScale=cubic&time=2010..2020")
        expect(state).toEqual({ tab: "line", time: { start: 2010, end: 2020 } })
        expect(diagnostics).toHaveLength(1)
    })
})

describe("URL codec round-trip property (spec 02 §3)", () => {
    const states: { grain: TimeGrain; state: ViewState }[] = [
        { grain: "year", state: {} },
        { grain: "year", state: { tab: "line" } },
        { grain: "year", state: { tab: "table", tableScope: "all" } },
        { grain: "year", state: { time: { start: 2010, end: 2024 } } },
        { grain: "year", state: { time: { start: "earliest", end: "latest" } } },
        { grain: "year", state: { time: { start: "earliest", end: 2020 } } },
        { grain: "year", state: { time: { start: 2020, end: 2020 } } },
        { grain: "fiscal-year", state: { time: { start: 2014, end: 2024 } } },
        { grain: "fiscal-year", state: { time: { start: "latest", end: "latest" } } },
        { grain: "fiscal-year", state: { time: { start: 1999, end: 2000 } } },
        { grain: "quarter", state: { time: { start: 2023 * 4 + 2, end: 2024 * 4 + 1 } } },
        { grain: "month", state: { time: { start: 2024 * 12, end: 2024 * 12 + 11 } } },
        { grain: "date", state: { time: { start: 19723, end: 20088 } } },
        { grain: "year", state: { entities: [] } },
        { grain: "year", state: { entities: ["Île-du-Prince-Édouard", "Terre-Neuve-et-Labrador"] } },
        { grain: "year", state: { entities: ["Innovation, Science and Economic Development Canada"] } },
        { grain: "year", state: { entities: ["A~B", "C & D", "50% rule"] } },
        { grain: "year", state: { focus: ["Alberta – Spending", "Québec – Spending"] } },
        { grain: "year", state: { yScale: "log", stackMode: "relative", facet: "entity" } },
        { grain: "year", state: { tableSort: { column: "total_spending", order: "asc" } } },
        { grain: "year", state: { tableSort: { column: "debt", order: "desc" }, tableScope: "selected" } },
        {
            grain: "fiscal-year",
            state: {
                tab: "stacked-discrete-bar",
                time: { start: 2019, end: "latest" },
                entities: ["Île-du-Prince-Édouard", "Ontario"],
                focus: ["Ontario"],
                yScale: "linear",
                stackMode: "relative",
                facet: "metric",
                tableSort: { column: "spending", order: "desc" },
                tableScope: "all",
            },
        },
    ]

    it("round-trips every hand-built state losslessly through a serialized URL", () => {
        for (const { grain, state } of states) {
            const params = viewStateToParams(state, grain)
            // Go through the string form: that is what actually lives in URLs.
            const reparsed = paramsToViewState(new URLSearchParams(params.toString()), grain)
            expect(reparsed.diagnostics).toEqual([])
            expect(reparsed.state).toEqual(state)
        }
    })
})
