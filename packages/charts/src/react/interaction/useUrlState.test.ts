/**
 * useUrlState round-trips ViewState through window.location.search using the
 * core codec: read once on mount, debounced history.replaceState writes,
 * foreign params untouched (spec 02 §3).
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useUrlState } from "./useUrlState.ts"

function setUrl(search: string): void {
    window.history.replaceState(null, "", `/page${search}`)
}

beforeEach(() => {
    vi.useFakeTimers()
    setUrl("")
})

afterEach(() => {
    vi.useRealTimers()
})

describe("useUrlState", () => {
    it("reads owned params from the URL once on mount, layered over the initial state", () => {
        setUrl("?time=2019..2024&entities=Ontario~Quebec&foreign=1&yScale=log")
        const { result } = renderHook(() =>
            useUrlState("year", { initial: { stackMode: "relative" } }),
        )
        const [state] = result.current
        expect(state.time).toEqual({ start: 2019, end: 2024 })
        expect(state.entities).toEqual(["Ontario", "Quebec"])
        expect(state.yScale).toBe("log")
        // Initial state survives where the URL says nothing.
        expect(state.stackMode).toBe("relative")
    })

    it("does not write the URL back on mount", () => {
        setUrl("?time=2020&foreign=1")
        renderHook(() => useUrlState("year"))
        act(() => {
            vi.advanceTimersByTime(500)
        })
        expect(window.location.search).toBe("?time=2020&foreign=1")
    })

    it("writes state changes via debounced replaceState, preserving foreign params", () => {
        setUrl("?foreign=1&time=2019..2024")
        const { result } = renderHook(() => useUrlState("year"))
        act(() => {
            const [, setState] = result.current
            setState((prev) => ({ ...prev, yScale: "log", entities: ["Ontario"] }))
        })
        // Debounced: nothing yet.
        expect(window.location.search).toBe("?foreign=1&time=2019..2024")
        act(() => {
            vi.advanceTimersByTime(200)
        })
        const params = new URLSearchParams(window.location.search)
        expect(params.get("foreign")).toBe("1")
        expect(params.get("yScale")).toBe("log")
        expect(params.get("entities")).toBe("Ontario")
        expect(params.get("time")).toBe("2019..2024")
    })

    it("round-trips: written params decode back to the same state", () => {
        const first = renderHook(() => useUrlState("year"))
        act(() => {
            const [, setState] = first.result.current
            setState({
                time: { start: 2019, end: "latest" },
                entities: ["Nova Scotia", "Ontario"],
                focus: ["Ontario"],
                yScale: "log",
            })
        })
        act(() => {
            vi.advanceTimersByTime(200)
        })
        first.unmount()

        const second = renderHook(() => useUrlState("year"))
        expect(second.result.current[0]).toEqual({
            time: { start: 2019, end: "latest" },
            entities: ["Nova Scotia", "Ontario"],
            focus: ["Ontario"],
            yScale: "log",
        })
    })

    it("drops unknown owned-param values with a clean state (codec never throws)", () => {
        setUrl("?yScale=banana&tab=line")
        const { result } = renderHook(() => useUrlState("year"))
        expect(result.current[0].yScale).toBeUndefined()
        expect(result.current[0].tab).toBe("line")
    })

    it("is inert when disabled: no URL read, no URL write", () => {
        setUrl("?time=2020&foreign=1")
        const { result } = renderHook(() =>
            useUrlState("year", { initial: { yScale: "log" }, enabled: false }),
        )
        expect(result.current[0]).toEqual({ yScale: "log" })
        act(() => {
            const [, setState] = result.current
            setState({ yScale: "linear" })
        })
        act(() => {
            vi.advanceTimersByTime(500)
        })
        expect(window.location.search).toBe("?time=2020&foreign=1")
        expect(result.current[0]).toEqual({ yScale: "linear" })
    })
})
