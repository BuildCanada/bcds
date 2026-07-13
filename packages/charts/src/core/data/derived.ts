/**
 * Derived value resolution — THE single data-access path. Spec 01 §7.
 *
 * Every chart, tooltip, table cell and CSV download obtains cell values
 * through resolveValue, so "missing ≠ zero", tolerance borrowing,
 * denominator division, displayFactor and projection flagging behave
 * identically on every surface.
 *
 * Pipeline per (column, entity, time):
 *   1. Resolve the numerator with the column's own tolerance.
 *   2. If the column declares a denominator, resolve it per (entity, time)
 *      with the DENOMINATOR column's tolerance; missing-after-tolerance or
 *      zero ⇒ missing ("zero-denominator"), never Infinity or 0.
 *   3. value = numerator [/ denominator] × displayFactor
 *      (displayFactor applies AFTER division — e.g. ×1,000 per-capita rates).
 *   4. Denominator-derived cells carry raw {numerator, denominator} for
 *      auditability (tooltip detail line, table download).
 */

import type { CellValue, ColumnData, ColumnMeta, Dataset, ResolvedValue, TimeOrdinal } from "../types.ts"
import { resolveWithTolerance } from "./tolerance.ts"

const MISSING_NO_DATA: ResolvedValue = { status: "missing", reason: "no-data" }
const MISSING_ZERO_DENOMINATOR: ResolvedValue = { status: "missing", reason: "zero-denominator" }

interface ResolvedCell {
    value: CellValue
    sourceTime: TimeOrdinal
}

/**
 * Resolve one column's cell for an entity at a time, applying tolerance.
 * For "none"-grain datasets (time === null) the lookup is direct and the
 * reported sourceTime is 0.
 */
function resolveCell(
    dataset: Dataset,
    column: ColumnData,
    entity: string,
    time: TimeOrdinal | null,
    tolerance: number,
    direction: ColumnMeta["toleranceDirection"],
): ResolvedCell | null {
    if (time === null) {
        const row = dataset.rowIndexOf(entity, null)
        if (row < 0) return null
        const value = column.values[row]
        if (value === null || value === undefined) return null
        return { value, sourceTime: 0 }
    }

    // Fast path: exact hit needs no series scan.
    const row = dataset.rowIndexOf(entity, time)
    if (row >= 0) {
        const value = column.values[row]
        if (value !== null && value !== undefined) return { value, sourceTime: time }
    }
    if (tolerance <= 0) return null

    // Build the entity's series over the dataset's sorted times and borrow.
    const times: TimeOrdinal[] = []
    const values: CellValue[] = []
    for (const t of dataset.times) {
        const r = dataset.rowIndexOf(entity, t)
        if (r < 0) continue
        times.push(t)
        values.push(column.values[r])
    }
    return resolveWithTolerance(times, values, time, tolerance, direction)
}

/** Merge per-binding overrides into column metadata, ignoring undefined entries. */
function mergeMeta(meta: ColumnMeta, overrides?: Partial<ColumnMeta>): ColumnMeta {
    if (overrides === undefined) return meta
    const merged: ColumnMeta = { ...meta }
    for (const [key, value] of Object.entries(overrides)) {
        if (value !== undefined) {
            ;(merged as unknown as Record<string, unknown>)[key] = value
        }
    }
    return merged
}

/**
 * Resolve the display value of `columnSlug` for `entity` at `time`
 * (null for "none"-grain datasets). `overrides` are per-binding column
 * metadata overrides from the chart definition (spec 02).
 */
export function resolveValue(
    dataset: Dataset,
    columnSlug: string,
    entity: string,
    time: TimeOrdinal | null,
    overrides?: Partial<ColumnMeta>,
): ResolvedValue {
    const column = dataset.columns.get(columnSlug)
    if (column === undefined) return MISSING_NO_DATA

    const meta = mergeMeta(column.meta, overrides)

    const numerator = resolveCell(dataset, column, entity, time, meta.tolerance, meta.toleranceDirection)
    if (numerator === null || typeof numerator.value !== "number") return MISSING_NO_DATA

    let value = numerator.value
    let raw: { numerator: number; denominator: number } | undefined

    if (meta.denominator !== undefined) {
        const denominatorColumn = dataset.columns.get(meta.denominator)
        const denominator =
            denominatorColumn === undefined
                ? null
                : resolveCell(
                      dataset,
                      denominatorColumn,
                      entity,
                      time,
                      denominatorColumn.meta.tolerance,
                      denominatorColumn.meta.toleranceDirection,
                  )
        if (denominator === null || typeof denominator.value !== "number" || denominator.value === 0) {
            return MISSING_ZERO_DENOMINATOR
        }
        raw = { numerator: numerator.value, denominator: denominator.value }
        value = numerator.value / denominator.value
    }

    value *= meta.displayFactor

    const requestedTime = time ?? 0
    const projected =
        meta.projection || (meta.projectionFrom !== undefined && numerator.sourceTime >= meta.projectionFrom)

    return {
        status: "value",
        value,
        time: requestedTime,
        sourceTime: numerator.sourceTime,
        projected,
        interpolated: false,
        ...(raw !== undefined ? { raw } : {}),
    }
}
