/**
 * Property tests for the emphasis state machine (spec 07 §3, spec 26 §3):
 * random event sequences from a seeded PRNG (no Math.random — determinism)
 * must never strand a state that references unknown keys or a dimmed chart
 * with nothing emphasized.
 */

import { describe, expect, it } from "vitest"

import type { SeriesKey } from "../../core/types.ts"
import {
    emphasisFor,
    emphasisReducer,
    initialEmphasisState,
    type EmphasisEvent,
    type EmphasisState,
} from "./emphasisReducer.ts"

// ---------------------------------------------------------------------------
// Seeded PRNG — tiny LCG (numerical recipes constants), deterministic
// ---------------------------------------------------------------------------

function lcg(seed: number): () => number {
    let state = seed >>> 0
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        return state / 4294967296
    }
}

const KEYS: SeriesKey[] = ["Ontario", "Quebec", "Alberta", "Nova Scotia"]

function randomEvent(next: () => number): EmphasisEvent {
    const key = KEYS[Math.floor(next() * KEYS.length)]
    const roll = next()
    if (roll < 0.35) return { type: "hover-series", key }
    if (roll < 0.55) return { type: "hover-clear" }
    if (roll < 0.85) return { type: "toggle-focus", key }
    if (roll < 0.93) return { type: "clear-focus" }
    return { type: "escape" }
}

function setEquals(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
    if (a.size !== b.size) return false
    for (const key of a) if (!b.has(key)) return false
    return true
}

describe("emphasisReducer properties", () => {
    it("random event sequences never strand an invalid state", () => {
        const next = lcg(20260611)
        for (let run = 0; run < 200; run++) {
            let state = initialEmphasisState
            for (let step = 0; step < 60; step++) {
                const event = randomEvent(next)
                const previous = state
                state = emphasisReducer(state, event)

                // States only reference known keys.
                expect(state.hover === null || KEYS.includes(state.hover)).toBe(true)
                for (const key of state.focus) expect(KEYS).toContain(key)

                // Event-specific invariants.
                if (event.type === "hover-series") {
                    expect(state.hover).toBe(event.key)
                    expect(setEquals(state.focus, previous.focus)).toBe(true)
                }
                if (event.type === "hover-clear") {
                    expect(state.hover).toBeNull()
                    expect(setEquals(state.focus, previous.focus)).toBe(true)
                }
                if (event.type === "toggle-focus") {
                    expect(state.focus.has(event.key)).toBe(!previous.focus.has(event.key))
                    expect(state.hover).toBe(previous.hover)
                }
                if (event.type === "escape" || event.type === "clear-focus") {
                    expect(state.focus.size).toBe(0)
                    expect(state.hover).toBe(previous.hover)
                }

                // Derived emphasis = focus ∪ hover; never an empty emphasis set.
                const emphasis = emphasisFor(state)
                if (state.hover === null && state.focus.size === 0) {
                    expect(emphasis.mode).toBe("idle")
                } else {
                    expect(emphasis.mode).toBe("emphasis")
                    if (emphasis.mode === "emphasis") {
                        expect(emphasis.keys.size).toBeGreaterThan(0)
                        const expected = new Set(state.focus)
                        if (state.hover !== null) expected.add(state.hover)
                        expect(setEquals(emphasis.keys, expected)).toBe(true)
                    }
                }
            }
        }
    })

    it("hover is transient and never alters focus", () => {
        let state: EmphasisState = initialEmphasisState
        state = emphasisReducer(state, { type: "toggle-focus", key: "Ontario" })
        const focusBefore = state.focus
        state = emphasisReducer(state, { type: "hover-series", key: "Quebec" })
        expect(state.focus).toBe(focusBefore)
        state = emphasisReducer(state, { type: "hover-clear" })
        expect(state.focus).toBe(focusBefore)
        expect(state.hover).toBeNull()
    })

    it("escape clears focus only, leaving hover untouched", () => {
        let state: EmphasisState = initialEmphasisState
        state = emphasisReducer(state, { type: "toggle-focus", key: "Ontario" })
        state = emphasisReducer(state, { type: "hover-series", key: "Quebec" })
        state = emphasisReducer(state, { type: "escape" })
        expect(state.focus.size).toBe(0)
        expect(state.hover).toBe("Quebec")
    })

    it("toggling focus twice round-trips to an empty set", () => {
        let state: EmphasisState = initialEmphasisState
        state = emphasisReducer(state, { type: "toggle-focus", key: "Alberta" })
        expect(state.focus.has("Alberta")).toBe(true)
        state = emphasisReducer(state, { type: "toggle-focus", key: "Alberta" })
        expect(state.focus.size).toBe(0)
        expect(emphasisFor(state).mode).toBe("idle")
    })

    it("no-op events return the same state reference (cheap renders)", () => {
        const cleared = emphasisReducer(initialEmphasisState, { type: "hover-clear" })
        expect(cleared).toBe(initialEmphasisState)
        const escaped = emphasisReducer(initialEmphasisState, { type: "escape" })
        expect(escaped).toBe(initialEmphasisState)
        const hovered = emphasisReducer(initialEmphasisState, { type: "hover-series", key: "Quebec" })
        expect(emphasisReducer(hovered, { type: "hover-series", key: "Quebec" })).toBe(hovered)
    })
})
