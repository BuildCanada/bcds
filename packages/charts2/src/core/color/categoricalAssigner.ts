/**
 * Categorical colour assignment (spec 04 §2).
 *
 * Pure-function port of owid-grapher's CategoricalColorAssigner
 * (color/CategoricalColorAssigner.ts) and getLeastUsedColor
 * (color/ColorUtils.ts), de-MobX'd and de-classed.
 *
 * Assignment rules:
 *   1. Fixed assignments (per-chart entityColours / column colour / entity
 *      registry colour, pre-resolved by the caller into one map) win and
 *      claim their colours up front — auto-assignment skips colours claimed
 *      anywhere in the fixed map, even for series later in the list.
 *   2. A series already in the state keeps its colour (persistence).
 *   3. Otherwise the series takes the least-used palette colour, ties broken
 *      by palette order — so fresh assignment walks the palette in order,
 *      skipping claimed colours, and repeats least-used-first once the
 *      palette is exhausted.
 */

import type { HexColour, SeriesKey } from "../types.ts"

/** Returned when the palette is empty (mirrors OWID's "#000" fallback). */
export const FALLBACK_COLOUR: HexColour = "#000000"

/**
 * Session memory for colour assignment. A plain serializable object — no
 * classes, no Maps — so it can round-trip through JSON (e.g. across render
 * modes or worker boundaries).
 */
export interface ColourState {
    /** Ordered categorical palette (theme.palette.categorical, by reference). */
    palette: readonly HexColour[]
    /**
     * Every series ever assigned in this session, with its colour.
     *
     * Removed series deliberately KEEP their reservation (this matches
     * OWID's autoColorMapCache): spec 04 guarantees surviving series never
     * change colour within a session, and a removed-then-re-added series
     * gets its original colour back. There is intentionally no
     * releaseColour — freeing a removed series' colour would hand it to the
     * next new series and break that guarantee.
     */
    assigned: Record<SeriesKey, HexColour>
}

export function createColourState(palette: readonly HexColour[]): ColourState {
    return { palette, assigned: {} }
}

/**
 * Port of OWID getLeastUsedColor: the first unused palette colour in
 * palette order, else the least-used one (ties broken by palette order).
 */
function leastUsedColour(
    palette: readonly HexColour[],
    usedColours: readonly HexColour[],
): HexColour {
    if (palette.length === 0) return FALLBACK_COLOUR
    const counts = new Map<HexColour, number>()
    for (const colour of usedColours) {
        counts.set(colour, (counts.get(colour) ?? 0) + 1)
    }
    let best = palette[0]
    let bestCount = Number.POSITIVE_INFINITY
    for (const colour of palette) {
        const count = counts.get(colour) ?? 0
        if (count === 0) return colour
        if (count < bestCount) {
            best = colour
            bestCount = count
        }
    }
    return best
}

/**
 * Colours currently claimed: the session memory overlaid with this call's
 * fixed assignments (fixed wins per key — mirrors OWID merging
 * autoColorMapCache then colorMap). Fixed entries whose series are not in
 * this call's seriesKeys still claim their colours.
 */
function usedColours(
    state: ColourState,
    fixed: ReadonlyMap<SeriesKey, HexColour>,
): HexColour[] {
    const merged: Record<SeriesKey, HexColour> = { ...state.assigned }
    for (const [key, colour] of fixed) merged[key] = colour
    return Object.values(merged)
}

/**
 * Assign a colour to every series key, in order. MUTATES state.assigned —
 * the state is the session memory that makes assignment persistent across
 * calls. Returns a fresh Map in seriesKeys order.
 */
export function assignColours(
    state: ColourState,
    seriesKeys: readonly SeriesKey[],
    fixed: ReadonlyMap<SeriesKey, HexColour> = new Map(),
): Map<SeriesKey, HexColour> {
    const result = new Map<SeriesKey, HexColour>()
    for (const key of seriesKeys) {
        let colour = fixed.get(key)
        if (colour === undefined) colour = state.assigned[key]
        if (colour === undefined) {
            colour = leastUsedColour(state.palette, usedColours(state, fixed))
        }
        state.assigned[key] = colour
        result.set(key, colour)
    }
    return result
}
