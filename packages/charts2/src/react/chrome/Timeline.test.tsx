import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, fireEvent, render } from "@testing-library/react"

import type { TimeSelection } from "../../core/types.ts"
import { playStepMs, shouldUseEqualSpacing, Timeline } from "./Timeline.tsx"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(() => {
    cleanup()
    vi.useRealTimers()
})

const TIMES_5 = [2019, 2020, 2021, 2022, 2023]

function stubTrackRect(container: HTMLElement, width = 100): HTMLElement {
    const track = container.querySelector(".bcds2-timeline__track") as HTMLElement
    track.getBoundingClientRect = () =>
        ({ left: 0, top: 0, right: width, bottom: 24, x: 0, y: 0, width, height: 24, toJSON: () => ({}) }) as DOMRect
    return track
}

describe("shouldUseEqualSpacing (spec 08 §2)", () => {
    it("keeps proportional spacing for dense regular data", () => {
        const dense = Array.from({ length: 30 }, (_, i) => 1990 + i)
        expect(shouldUseEqualSpacing(dense)).toBe(false)
    })

    it("switches to equal spacing when a sparse tail dominates the span", () => {
        const sparseTail = [...Array.from({ length: 19 }, (_, i) => i), 1000]
        expect(sparseTail.length).toBe(20)
        expect(shouldUseEqualSpacing(sparseTail)).toBe(true)
    })

    it("keeps proportional spacing below 20 points even when gaps dominate", () => {
        const few = [0, 1, 2, 3, 1000]
        expect(shouldUseEqualSpacing(few)).toBe(false)
    })

    it("keeps proportional spacing for evenly spaced sparse data", () => {
        const decades = Array.from({ length: 25 }, (_, i) => i * 10)
        expect(shouldUseEqualSpacing(decades)).toBe(false)
    })

    it("handles degenerate inputs", () => {
        expect(shouldUseEqualSpacing([])).toBe(false)
        expect(shouldUseEqualSpacing([2020])).toBe(false)
    })
})

describe("playStepMs (spec 08 §3)", () => {
    it("targets ~4s total with a 100–200ms per-step clamp", () => {
        expect(playStepMs(5)).toBe(200)
        expect(playStepMs(100)).toBe(100)
        expect(playStepMs(25)).toBe(160)
    })
})

describe("Timeline pointer interaction (spec 08 §2)", () => {
    it("snaps a track click to the nearest available time and moves the nearest handle", () => {
        const onChange = vi.fn()
        const { container } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2019, end: 2023 }}
                mode="range"
                onChange={onChange}
            />,
        )
        const track = stubTrackRect(container)

        // 52% of the span: 2019 + 0.52 × 4 = 2021.08 → snaps to 2021;
        // closer to the end handle than the start handle.
        fireEvent.pointerDown(track, { clientX: 52 })
        expect(onChange).toHaveBeenCalledWith({ start: 2019, end: 2021 })
    })

    it("drags via pointer events with snapping", () => {
        const onChange = vi.fn()
        const { container } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2019, end: 2023 }}
                mode="range"
                onChange={onChange}
            />,
        )
        const track = stubTrackRect(container)

        fireEvent.pointerDown(track, { clientX: 52 })
        fireEvent.pointerMove(window, { clientX: 80 })
        expect(onChange).toHaveBeenLastCalledWith({ start: 2019, end: 2022 })

        fireEvent.pointerUp(window)
        onChange.mockClear()
        fireEvent.pointerMove(window, { clientX: 10 })
        expect(onChange).not.toHaveBeenCalled()
    })

    it("never lets the handles cross while dragging", () => {
        const onChange = vi.fn()
        const { container } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2022, end: 2023 }}
                mode="range"
                onChange={onChange}
            />,
        )
        const track = stubTrackRect(container)

        // Grab the start handle (fraction 0.74 is nearest to start at 0.75)…
        fireEvent.pointerDown(track, { clientX: 74 })
        expect(onChange).not.toHaveBeenCalled()
        // …and drag past the end handle: start clamps to end, never beyond.
        fireEvent.pointerMove(window, { clientX: 100 })
        expect(onChange).toHaveBeenLastCalledWith({ start: 2023, end: 2023 })
    })

    it("moves the single handle in single mode", () => {
        const onChange = vi.fn()
        const { container } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2023, end: 2023 }}
                mode="single"
                onChange={onChange}
            />,
        )
        const track = stubTrackRect(container)
        fireEvent.pointerDown(track, { clientX: 26 })
        expect(onChange).toHaveBeenCalledWith({ start: 2020, end: 2020 })
    })
})

describe("Timeline keyboard (spec 08 §2)", () => {
    it("steps one available time with arrow keys", () => {
        const onChange = vi.fn()
        const { getByLabelText } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2019, end: 2023 }}
                mode="range"
                onChange={onChange}
            />,
        )
        fireEvent.keyDown(getByLabelText("End time"), { key: "ArrowLeft" })
        expect(onChange).toHaveBeenCalledWith({ start: 2019, end: 2022 })

        onChange.mockClear()
        fireEvent.keyDown(getByLabelText("Start time"), { key: "ArrowRight" })
        expect(onChange).toHaveBeenCalledWith({ start: 2020, end: 2023 })
    })

    it("jumps to extremes with Home/End without crossing the other handle", () => {
        const onChange = vi.fn()
        const { getByLabelText } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2020, end: 2021 }}
                mode="range"
                onChange={onChange}
            />,
        )
        fireEvent.keyDown(getByLabelText("Start time"), { key: "Home" })
        expect(onChange).toHaveBeenCalledWith({ start: 2019, end: 2021 })

        onChange.mockClear()
        // End on the start handle clamps at the end handle, never beyond.
        fireEvent.keyDown(getByLabelText("Start time"), { key: "End" })
        expect(onChange).toHaveBeenCalledWith({ start: 2021, end: 2021 })
    })

    it("does not emit when stepping past the data extent", () => {
        const onChange = vi.fn()
        const { getByLabelText } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2019, end: 2023 }}
                mode="range"
                onChange={onChange}
            />,
        )
        fireEvent.keyDown(getByLabelText("End time"), { key: "ArrowRight" })
        expect(onChange).not.toHaveBeenCalled()
    })
})

describe("Timeline playback (spec 08 §3)", () => {
    it("advances the handle every 200ms for 5 times (4000/5 = 800 clamps to 200) and stops at the end", () => {
        vi.useFakeTimers()
        const onChange = vi.fn()
        const onPlayStateChange = vi.fn()
        const { getByLabelText } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2019, end: 2019 }}
                mode="single"
                onChange={onChange}
                onPlayStateChange={onPlayStateChange}
            />,
        )

        fireEvent.click(getByLabelText("Play"))
        expect(onPlayStateChange).toHaveBeenLastCalledWith(true)

        act(() => {
            vi.advanceTimersByTime(199)
        })
        expect(onChange).not.toHaveBeenCalled()

        act(() => {
            vi.advanceTimersByTime(1)
        })
        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenLastCalledWith({ start: 2020, end: 2020 })

        act(() => {
            vi.advanceTimersByTime(600)
        })
        expect(onChange).toHaveBeenCalledTimes(4)
        expect(onChange).toHaveBeenLastCalledWith({ start: 2023, end: 2023 })
        expect(onPlayStateChange).toHaveBeenLastCalledWith(false)

        act(() => {
            vi.advanceTimersByTime(2000)
        })
        expect(onChange).toHaveBeenCalledTimes(4)
    })

    it("clamps to 100ms steps for 100 times (4000/100 = 40 clamps to 100)", () => {
        vi.useFakeTimers()
        const times = Array.from({ length: 100 }, (_, i) => 1900 + i)
        const onChange = vi.fn()
        const { getByLabelText } = render(
            <Timeline
                times={times}
                grain="year"
                locale="en"
                selection={{ start: 1900, end: 1900 }}
                mode="single"
                onChange={onChange}
            />,
        )

        fireEvent.click(getByLabelText("Play"))
        act(() => {
            vi.advanceTimersByTime(99)
        })
        expect(onChange).not.toHaveBeenCalled()
        act(() => {
            vi.advanceTimersByTime(1)
        })
        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenLastCalledWith({ start: 1901, end: 1901 })
    })

    it("keeps the start handle fixed in range mode", () => {
        vi.useFakeTimers()
        const onChange = vi.fn()
        const { getByLabelText } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2020, end: 2021 }}
                mode="range"
                onChange={onChange}
            />,
        )
        fireEvent.click(getByLabelText("Play"))
        act(() => {
            vi.advanceTimersByTime(200)
        })
        expect(onChange).toHaveBeenLastCalledWith({ start: 2020, end: 2022 })
    })

    it("replays from the beginning when already at the end", () => {
        vi.useFakeTimers()
        const onChange = vi.fn()
        const { getByLabelText } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2023, end: 2023 }}
                mode="single"
                onChange={onChange}
            />,
        )
        fireEvent.click(getByLabelText("Play"))
        expect(onChange).toHaveBeenCalledWith({ start: 2019, end: 2019 })
        act(() => {
            vi.advanceTimersByTime(200)
        })
        expect(onChange).toHaveBeenLastCalledWith({ start: 2020, end: 2020 })
    })
})

describe("Timeline chrome", () => {
    it("renders ticks at every available time and a text readout of the selection", () => {
        const { container } = render(
            <Timeline
                times={TIMES_5}
                grain="year"
                locale="en"
                selection={{ start: 2019, end: 2023 }}
                mode="range"
                onChange={() => undefined}
            />,
        )
        expect(container.querySelectorAll(".bcds2-timeline__tick").length).toBe(5)
        expect(container.querySelector(".bcds2-timeline__readout")?.textContent).toBe("2019–2023")
    })

    it("hides entirely with fewer than two time points", () => {
        const { container } = render(
            <Timeline
                times={[2020]}
                grain="year"
                locale="en"
                selection={{ start: 2020, end: 2020 }}
                mode="single"
                onChange={() => undefined}
            />,
        )
        expect(container.querySelector(".bcds2-timeline")).toBeNull()
    })

    it("resolves earliest/latest bounds against the data", () => {
        const selection: TimeSelection = { start: "earliest", end: "latest" }
        const { container } = render(
            <Timeline times={TIMES_5} grain="year" locale="en" selection={selection} mode="range" onChange={() => undefined} />,
        )
        expect(container.querySelector(".bcds2-timeline__readout")?.textContent).toBe("2019–2023")
    })
})
