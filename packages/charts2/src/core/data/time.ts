/**
 * Time grain parsing and canonical (raw) formatting. Spec 01 §3, spec 08.
 *
 * Times are integer ordinals, uniform per grain (see core/types.ts):
 *   year        → the year (2024)
 *   fiscal-year → the start year (2024 for "2024-25")
 *   quarter     → year * 4 + (q - 1)
 *   month       → year * 12 + (m - 1)
 *   date        → days since 1970-01-01 (UTC, no timezone math)
 *   none        → ordinals never occur
 *
 * Only canonical *raw* string forms live here; display formatting (en-dashes,
 * locale month names, …) lives in core/format (M2), not in this module.
 *
 * Determinism: no Intl, no Date.now, no timezone-dependent Date parsing.
 * Date strings are decomposed into components and combined via Date.UTC.
 */

import type { TimeGrain, TimeOrdinal } from "../types.ts"

const MS_PER_DAY = 86_400_000

const YEAR_RE = /^-?\d{1,6}$/
const FISCAL_YEAR_RE = /^(\d{4})-(\d{2})$/
const QUARTER_RE = /^(\d{4})-Q([1-4])$/
const MONTH_RE = /^(\d{4})-(\d{2})$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function pad2(n: number): string {
    return String(n).padStart(2, "0")
}

/**
 * Parse a raw time cell (the canonical encoding for the grain) into an
 * integer ordinal. Returns null when the value does not parse under the
 * declared grain — callers turn that into a Diagnostic with row context.
 */
export function parseTime(raw: string | number | null | undefined, grain: TimeGrain): TimeOrdinal | null {
    if (raw === null || raw === undefined) return null
    if (grain === "none") return null

    if (typeof raw === "number") {
        // Only the year grain accepts bare numbers (CSV always yields strings;
        // JSON year datasets naturally carry numeric times).
        if (grain === "year" && Number.isInteger(raw)) return raw
        return null
    }

    const text = raw.trim()
    switch (grain) {
        case "year": {
            if (!YEAR_RE.test(text)) return null
            return parseInt(text, 10)
        }
        case "fiscal-year": {
            const m = FISCAL_YEAR_RE.exec(text)
            if (m === null) return null
            const start = parseInt(m[1], 10)
            // The YY suffix must be the start year + 1 (e.g. "2024-25", "1999-00").
            if (m[2] !== pad2((start + 1) % 100)) return null
            return start
        }
        case "quarter": {
            const m = QUARTER_RE.exec(text)
            if (m === null) return null
            return parseInt(m[1], 10) * 4 + (parseInt(m[2], 10) - 1)
        }
        case "month": {
            const m = MONTH_RE.exec(text)
            if (m === null) return null
            const month = parseInt(m[2], 10)
            if (month < 1 || month > 12) return null
            return parseInt(m[1], 10) * 12 + (month - 1)
        }
        case "date": {
            const m = DATE_RE.exec(text)
            if (m === null) return null
            const year = parseInt(m[1], 10)
            const month = parseInt(m[2], 10)
            const day = parseInt(m[3], 10)
            // Date.UTC of explicit components — never timezone-dependent parsing.
            const ms = Date.UTC(year, month - 1, day)
            const check = new Date(ms)
            // Reject overflowed components (e.g. "2024-02-30" → March 1).
            if (
                check.getUTCFullYear() !== year ||
                check.getUTCMonth() !== month - 1 ||
                check.getUTCDate() !== day
            ) {
                return null
            }
            return ms / MS_PER_DAY
        }
    }
}

/**
 * Format an ordinal back into the grain's canonical raw string — the exact
 * inverse of parseTime. This is the encoding for CSV round-trips and URLs;
 * human display strings are produced by core/format (M2).
 */
export function formatTimeOrdinalRaw(ordinal: TimeOrdinal, grain: TimeGrain): string {
    switch (grain) {
        case "year":
            return String(ordinal)
        case "fiscal-year":
            return `${ordinal}-${pad2((ordinal + 1) % 100)}`
        case "quarter": {
            const year = Math.floor(ordinal / 4)
            return `${year}-Q${ordinal - year * 4 + 1}`
        }
        case "month": {
            const year = Math.floor(ordinal / 12)
            return `${year}-${pad2(ordinal - year * 12 + 1)}`
        }
        case "date": {
            const d = new Date(ordinal * MS_PER_DAY)
            return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
        }
        case "none":
            return ""
    }
}

/**
 * Snap an arbitrary ordinal to the nearest available time (spec 08 §1:
 * selection always snaps to times present in the data). `times` must be
 * sorted ascending. Ties go to the earlier time for determinism.
 * Returns null when no times are available.
 */
export function snapToAvailable(ordinal: TimeOrdinal, times: readonly TimeOrdinal[]): TimeOrdinal | null {
    if (times.length === 0) return null

    // Binary search: first index with times[i] >= ordinal.
    let lo = 0
    let hi = times.length
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (times[mid] < ordinal) lo = mid + 1
        else hi = mid
    }

    if (lo === 0) return times[0]
    if (lo === times.length) return times[times.length - 1]
    const before = times[lo - 1]
    const after = times[lo]
    // <= : equal distance resolves to the earlier time.
    return ordinal - before <= after - ordinal ? before : after
}

/** Total order over time ordinals (ascending). */
export function compareTimes(a: TimeOrdinal, b: TimeOrdinal): number {
    return a - b
}
