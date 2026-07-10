/**
 * Tolerance matching (borrowed values). Spec 08 §4, spec 01 column metadata.
 *
 * A missing value at the target time may be filled from the nearest time
 * within ±tolerance (direction configurable). Borrowing never invents
 * values — only existing cells are returned, and the sourceTime is always
 * reported so borrowed values can be marked everywhere downstream.
 * Ties (equidistant earlier/later candidates) go to the earlier time for
 * determinism.
 */

import type { CellValue, TimeOrdinal, ToleranceDirection } from "../types.ts"

export interface ToleranceMatch {
    value: CellValue
    /** The time the value actually came from (≠ target ⇒ borrowed). */
    sourceTime: TimeOrdinal
}

/**
 * Resolve one entity's column value at targetTime, borrowing from the
 * nearest non-null neighbour within tolerance. `times` and `values` are
 * parallel arrays describing that entity's series (times sorted ascending).
 *
 * Direction is in time: "backwards" borrows only from earlier times
 * (sourceTime <= target), "forwards" only from later ones.
 */
export function resolveWithTolerance(
    times: readonly TimeOrdinal[],
    values: readonly CellValue[],
    targetTime: TimeOrdinal,
    tolerance: number,
    direction: ToleranceDirection,
): ToleranceMatch | null {
    let best: ToleranceMatch | null = null
    let bestDistance = Infinity

    for (let i = 0; i < times.length; i++) {
        const value = values[i]
        if (value === null || value === undefined) continue

        const delta = times[i] - targetTime
        if (direction === "backwards" && delta > 0) continue
        if (direction === "forwards" && delta < 0) continue

        const distance = Math.abs(delta)
        if (distance > tolerance) continue

        // Strict < keeps the earlier candidate on ties (times scan ascending).
        if (distance < bestDistance) {
            bestDistance = distance
            best = { value, sourceTime: times[i] }
        }
    }

    return best
}
