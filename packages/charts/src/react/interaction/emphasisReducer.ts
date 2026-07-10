/**
 * Emphasis state machine (spec 07 §3): hover / focus / dimming.
 *
 * Pure functions — no React. The Chart component drives this through
 * useReducer; tests exercise it directly. Hover is transient and never
 * alters focus; Escape clears focus only. Emphasis styling is applied by
 * SceneSVG via seriesKey opacity — it NEVER triggers relayout.
 */

import type { SeriesKey } from "../../core/types.ts"

export interface EmphasisState {
    /** Series under the pointer, or null. Transient. */
    hover: SeriesKey | null
    /** Clicked-in focus set. Persists in the URL (`focus=`). */
    focus: ReadonlySet<SeriesKey>
}

export type EmphasisEvent =
    | { type: "hover-series"; key: SeriesKey }
    | { type: "hover-clear" }
    | { type: "toggle-focus"; key: SeriesKey }
    | { type: "clear-focus" }
    | { type: "escape" }

export const initialEmphasisState: EmphasisState = { hover: null, focus: new Set() }

export function emphasisReducer(state: EmphasisState, event: EmphasisEvent): EmphasisState {
    switch (event.type) {
        case "hover-series":
            return state.hover === event.key ? state : { hover: event.key, focus: state.focus }
        case "hover-clear":
            return state.hover === null ? state : { hover: null, focus: state.focus }
        case "toggle-focus": {
            const focus = new Set(state.focus)
            if (focus.has(event.key)) focus.delete(event.key)
            else focus.add(event.key)
            return { hover: state.hover, focus }
        }
        case "clear-focus":
        case "escape":
            // Escape clears focus only — hover is owned by the pointer.
            return state.focus.size === 0 ? state : { hover: state.hover, focus: new Set() }
    }
}

/**
 * What SceneSVG consumes: idle (everything full opacity) or an emphasized
 * key set (everything else dimmed). Derived, never stored.
 */
export type EmphasisModel =
    | { mode: "idle" }
    | { mode: "emphasis"; keys: ReadonlySet<SeriesKey> }

export function emphasisFor(state: EmphasisState): EmphasisModel {
    if (state.hover === null && state.focus.size === 0) return { mode: "idle" }
    const keys = new Set(state.focus)
    if (state.hover !== null) keys.add(state.hover)
    return { mode: "emphasis", keys }
}
