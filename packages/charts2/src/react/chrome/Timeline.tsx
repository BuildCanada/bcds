/**
 * Timeline control (spec 08 §2–3): a slider over the available times with
 * tick marks, one handle (single-time charts) or two handles (range charts),
 * keyboard stepping, and a play button that advances the end handle through
 * available times targeting a ~4 second total sweep.
 *
 * Self-contained chrome: receives the available times via props, emits
 * snapped TimeSelections, and never reads chart or layout state. Spacing is
 * proportional to time by default and switches to equal spacing when the
 * data is sparse/irregular (see shouldUseEqualSpacing).
 */

import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react"
import { snapToAvailable } from "../../core/data/time.ts"
import { formatTime, formatTimeRange } from "../../core/format/timeLabels.ts"
import type { Locale, TimeBound, TimeGrain, TimeOrdinal, TimeSelection } from "../../core/types.ts"

export type TimelineMode = "range" | "single"

export interface TimelineProps {
    /** Sorted available time ordinals. Fewer than 2 hides the control. */
    times: readonly TimeOrdinal[]
    grain: TimeGrain
    locale: Locale
    /** Current selection; ordinals are snapped, earliest/latest resolved. */
    selection: TimeSelection
    mode: TimelineMode
    onChange: (selection: TimeSelection) => void
    /** Render the play button. Default true. */
    playable?: boolean
    onPlayStateChange?: (playing: boolean) => void
}

// ---------------------------------------------------------------------------
// Playback pacing (spec 08 §3): ~4s sweep, per-step clamp 100–200ms
// ---------------------------------------------------------------------------

export const PLAY_TOTAL_MS = 4000
export const PLAY_STEP_MIN_MS = 100
export const PLAY_STEP_MAX_MS = 200

/** Per-step playback duration for a dataset with `pointCount` times. */
export function playStepMs(pointCount: number): number {
    if (pointCount <= 0) return PLAY_STEP_MAX_MS
    return Math.min(PLAY_STEP_MAX_MS, Math.max(PLAY_STEP_MIN_MS, PLAY_TOTAL_MS / pointCount))
}

// ---------------------------------------------------------------------------
// Spacing rule (spec 08 §2): proportional by default; equal when sparse
// ---------------------------------------------------------------------------

/**
 * Equal spacing when proportional spacing would crush most points into a
 * corner: many points (≥20) AND the top 10% of gaps dominate (>50% of the
 * span). Dense regular data stays proportional.
 */
export function shouldUseEqualSpacing(times: readonly TimeOrdinal[]): boolean {
    if (times.length < 20) return false
    const span = times[times.length - 1] - times[0]
    if (span <= 0) return false

    const gaps: number[] = []
    for (let i = 1; i < times.length; i++) {
        gaps.push(times[i] - times[i - 1])
    }
    gaps.sort((a, b) => b - a)

    const topCount = Math.max(1, Math.ceil(gaps.length * 0.1))
    let topSum = 0
    for (let i = 0; i < topCount; i++) {
        topSum += gaps[i]
    }
    return topSum > span * 0.5
}

// ---------------------------------------------------------------------------
// Pure position/selection helpers
// ---------------------------------------------------------------------------

function resolveBound(bound: TimeBound, times: readonly TimeOrdinal[]): TimeOrdinal {
    if (times.length === 0) return 0
    if (bound === "earliest") return times[0]
    if (bound === "latest") return times[times.length - 1]
    return snapToAvailable(bound, times) ?? times[0]
}

function fractionOf(times: readonly TimeOrdinal[], equal: boolean, time: TimeOrdinal): number {
    if (times.length <= 1) return 0
    const span = times[times.length - 1] - times[0]
    if (equal || span === 0) {
        const index = times.indexOf(time)
        return index < 0 ? 0 : index / (times.length - 1)
    }
    return (time - times[0]) / span
}

function timeAtFraction(times: readonly TimeOrdinal[], equal: boolean, fraction: number): TimeOrdinal {
    if (times.length === 0) return 0
    if (times.length === 1) return times[0]
    const clamped = Math.min(1, Math.max(0, fraction))
    const span = times[times.length - 1] - times[0]
    if (equal || span === 0) {
        return times[Math.round(clamped * (times.length - 1))]
    }
    return snapToAvailable(times[0] + clamped * span, times) ?? times[0]
}

function trackFraction(track: HTMLDivElement | null, clientX: number): number | null {
    if (track === null) return null
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return null
    return (clientX - rect.left) / rect.width
}

type HandleId = "start" | "end"

interface ResolvedSelection {
    start: TimeOrdinal
    end: TimeOrdinal
}

interface LatestState {
    times: readonly TimeOrdinal[]
    equal: boolean
    mode: TimelineMode
    resolved: ResolvedSelection
    onChange: (selection: TimeSelection) => void
    onPlayStateChange?: (playing: boolean) => void
}

/** Move one handle to a snapped time, never letting handles cross. */
function emitHandleMove(handle: HandleId, time: TimeOrdinal, state: LatestState): void {
    const { mode, resolved, onChange } = state
    if (mode === "single") {
        if (time !== resolved.start || time !== resolved.end) onChange({ start: time, end: time })
        return
    }
    if (handle === "start") {
        const clamped = Math.min(time, resolved.end)
        if (clamped !== resolved.start) onChange({ start: clamped, end: resolved.end })
    } else {
        const clamped = Math.max(time, resolved.start)
        if (clamped !== resolved.end) onChange({ start: resolved.start, end: clamped })
    }
}

function percent(fraction: number): string {
    return `${(fraction * 100).toFixed(4)}%`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Timeline({ times, grain, locale, selection, mode, onChange, playable = true, onPlayStateChange }: TimelineProps) {
    const equal = shouldUseEqualSpacing(times)
    const resolved: ResolvedSelection = {
        start: resolveBound(selection.start, times),
        end: resolveBound(selection.end, times),
    }

    const latest = useRef<LatestState>({ times, equal, mode, resolved, onChange, onPlayStateChange })
    latest.current = { times, equal, mode, resolved, onChange, onPlayStateChange }

    const trackRef = useRef<HTMLDivElement | null>(null)
    const dragHandleRef = useRef<HandleId | null>(null)
    const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const playheadRef = useRef<TimeOrdinal>(resolved.end)
    const [playing, setPlaying] = useState(false)

    // Window-level drag listeners: created once, reading current state via refs.
    const dragHandlersRef = useRef<{ move: (event: PointerEvent) => void; up: () => void } | null>(null)
    if (dragHandlersRef.current === null) {
        const move = (event: PointerEvent) => {
            const handle = dragHandleRef.current
            if (handle === null) return
            const fraction = trackFraction(trackRef.current, event.clientX)
            if (fraction === null) return
            const state = latest.current
            emitHandleMove(handle, timeAtFraction(state.times, state.equal, fraction), state)
        }
        const up = () => {
            dragHandleRef.current = null
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
        }
        dragHandlersRef.current = { move, up }
    }

    useEffect(() => {
        return () => {
            if (playTimeoutRef.current !== null) clearTimeout(playTimeoutRef.current)
            const handlers = dragHandlersRef.current
            if (handlers !== null) {
                window.removeEventListener("pointermove", handlers.move)
                window.removeEventListener("pointerup", handlers.up)
            }
        }
    }, [])

    if (times.length < 2) return null

    function stopPlayback(): void {
        if (playTimeoutRef.current !== null) {
            clearTimeout(playTimeoutRef.current)
            playTimeoutRef.current = null
        }
        setPlaying(false)
        latest.current.onPlayStateChange?.(false)
    }

    function tick(): void {
        playTimeoutRef.current = null
        const state = latest.current
        const index = state.times.indexOf(playheadRef.current)
        if (index < 0 || index >= state.times.length - 1) {
            stopPlayback()
            return
        }
        const next = state.times[index + 1]
        playheadRef.current = next
        if (state.mode === "single") {
            state.onChange({ start: next, end: next })
        } else {
            state.onChange({ start: state.resolved.start, end: next })
        }
        if (index + 1 >= state.times.length - 1) {
            stopPlayback()
        } else {
            playTimeoutRef.current = setTimeout(tick, playStepMs(state.times.length))
        }
    }

    function handlePlayClick(): void {
        if (playing) {
            stopPlayback()
            return
        }
        let head = resolved.end
        const lastTime = times[times.length - 1]
        if (head >= lastTime) {
            // Replay: restart from the beginning (spec 08 §3).
            head = mode === "single" ? times[0] : resolved.start
            if (mode === "single") {
                onChange({ start: head, end: head })
            } else if (head !== resolved.end) {
                onChange({ start: resolved.start, end: head })
            }
        }
        playheadRef.current = head
        setPlaying(true)
        onPlayStateChange?.(true)
        playTimeoutRef.current = setTimeout(tick, playStepMs(times.length))
    }

    function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
        const fraction = trackFraction(trackRef.current, event.clientX)
        if (fraction === null) return
        event.preventDefault()
        const startDistance = Math.abs(fraction - fractionOf(times, equal, resolved.start))
        const endDistance = Math.abs(fraction - fractionOf(times, equal, resolved.end))
        const handle: HandleId = mode === "single" ? "end" : startDistance < endDistance ? "start" : "end"
        dragHandleRef.current = handle
        emitHandleMove(handle, timeAtFraction(times, equal, fraction), latest.current)
        const handlers = dragHandlersRef.current
        if (handlers !== null) {
            window.addEventListener("pointermove", handlers.move)
            window.addEventListener("pointerup", handlers.up)
        }
    }

    function handleKeyDown(handle: HandleId, event: ReactKeyboardEvent<HTMLDivElement>): void {
        const currentTime = handle === "start" ? resolved.start : resolved.end
        const currentIndex = times.indexOf(currentTime)
        let nextIndex: number
        switch (event.key) {
            case "ArrowLeft":
            case "ArrowDown":
                nextIndex = currentIndex - 1
                break
            case "ArrowRight":
            case "ArrowUp":
                nextIndex = currentIndex + 1
                break
            case "Home":
                nextIndex = 0
                break
            case "End":
                nextIndex = times.length - 1
                break
            default:
                return
        }
        event.preventDefault()
        const clampedIndex = Math.max(0, Math.min(times.length - 1, nextIndex))
        emitHandleMove(handle, times[clampedIndex], latest.current)
    }

    const startFraction = fractionOf(times, equal, resolved.start)
    const endFraction = fractionOf(times, equal, resolved.end)
    const readout =
        resolved.start === resolved.end
            ? formatTime(resolved.end, grain, locale)
            : formatTimeRange(resolved.start, resolved.end, grain, locale)

    function renderHandle(handle: HandleId, fraction: number, label: string) {
        const time = handle === "start" ? resolved.start : resolved.end
        return (
            <div
                role="slider"
                tabIndex={0}
                aria-label={label}
                aria-valuemin={times[0]}
                aria-valuemax={times[times.length - 1]}
                aria-valuenow={time}
                aria-valuetext={formatTime(time, grain, locale)}
                className={`bcds2-timeline__handle bcds2-timeline__handle--${handle}`}
                style={{ left: percent(fraction) }}
                onKeyDown={(event) => handleKeyDown(handle, event)}
            />
        )
    }

    return (
        <div className="bcds2-timeline">
            {playable && (
                <button
                    type="button"
                    className="bcds2-timeline__play"
                    aria-label={playing ? "Pause" : "Play"}
                    aria-pressed={playing}
                    onClick={handlePlayClick}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        {playing ? (
                            <path d="M2 1h3v10H2zM7 1h3v10H7z" fill="currentColor" />
                        ) : (
                            <path d="M2 1l9 5-9 5z" fill="currentColor" />
                        )}
                    </svg>
                </button>
            )}
            <div ref={trackRef} className="bcds2-timeline__track" onPointerDown={handlePointerDown}>
                <div className="bcds2-timeline__rail" aria-hidden="true" />
                {times.map((time) => (
                    <span
                        key={time}
                        className="bcds2-timeline__tick"
                        style={{ left: percent(fractionOf(times, equal, time)) }}
                        aria-hidden="true"
                    />
                ))}
                {mode === "range" && (
                    <div
                        className="bcds2-timeline__range"
                        style={{ left: percent(startFraction), width: percent(Math.max(0, endFraction - startFraction)) }}
                        aria-hidden="true"
                    />
                )}
                {mode === "range" && renderHandle("start", startFraction, "Start time")}
                {renderHandle("end", endFraction, mode === "range" ? "End time" : "Time")}
            </div>
            <span className="bcds2-timeline__readout">{readout}</span>
        </div>
    )
}
