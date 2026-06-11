/**
 * Time label formatting (spec 03 §5, spec 08).
 *
 * Times are integer ordinals (see TimeOrdinal in ../types.ts); display
 * strings derive purely from (ordinal, grain, locale). No Intl and no Date —
 * month names come from static tables and calendar math is pure integer
 * arithmetic, so labels are byte-identical across runtimes.
 */

import type { Locale, TimeGrain, TimeOrdinal } from "../types.ts"

/** En dash (U+2013): fiscal years ("2024–25") and ranges ("2010–2024"). */
export const EN_DASH = "\u2013"

const MONTHS_EN = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const

const MONTHS_FR = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
] as const

interface CivilDate {
    year: number
    /** 1–12 */
    month: number
    /** 1–31 */
    day: number
}

/**
 * Days since 1970-01-01 → civil date (proleptic Gregorian, UTC, no timezone
 * math). Howard Hinnant's civil_from_days algorithm.
 */
function civilFromDays(days: number): CivilDate {
    const z = days + 719468
    const era = Math.floor(z / 146097)
    const doe = z - era * 146097
    const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365)
    const y = yoe + era * 400
    const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
    const mp = Math.floor((5 * doy + 2) / 153)
    const day = doy - Math.floor((153 * mp + 2) / 5) + 1
    const month = mp < 10 ? mp + 3 : mp - 9
    return { year: month <= 2 ? y + 1 : y, month, day }
}

/** "2024–25" with an en dash; century boundaries wrap to "2099–00". */
function formatFiscalYear(startYear: number): string {
    const endYear = String((startYear + 1) % 100).padStart(2, "0")
    return `${startYear}${EN_DASH}${endYear}`
}

/**
 * Format a single time ordinal per its grain (spec 03 §5):
 * - year: "2024"
 * - fiscal-year: "2024–25" (ordinal is the start year)
 * - quarter: "Q3 2024" (fr "T3 2024")
 * - month: "July 2024" (fr "juillet 2024")
 * - date: "July 1, 2024" (fr "1 juillet 2024")
 * - none: "" (ordinals never occur for this grain)
 */
export function formatTime(ordinal: TimeOrdinal, grain: TimeGrain, locale: Locale): string {
    switch (grain) {
        case "year":
            return String(ordinal)
        case "fiscal-year":
            return formatFiscalYear(ordinal)
        case "quarter": {
            const year = Math.floor(ordinal / 4)
            const quarter = ordinal - year * 4 + 1
            const prefix = locale === "fr" ? "T" : "Q"
            return `${prefix}${quarter} ${year}`
        }
        case "month": {
            const year = Math.floor(ordinal / 12)
            const month = ordinal - year * 12
            const name = locale === "fr" ? MONTHS_FR[month] : MONTHS_EN[month]
            return `${name} ${year}`
        }
        case "date": {
            const { year, month, day } = civilFromDays(ordinal)
            if (locale === "fr") return `${day} ${MONTHS_FR[month - 1]} ${year}`
            return `${MONTHS_EN[month - 1]} ${day}, ${year}`
        }
        case "none":
            return ""
    }
}

/**
 * Format a time range (spec 03 §5):
 * - equal endpoints collapse to a single label
 * - calendar years join with an en dash: "2010–2024"
 * - every other grain spells the connective so labels that contain spaces
 *   or dashes stay readable: "2014–15 to 2024–25", fr "de 2014–15 à 2024–25"
 */
export function formatTimeRange(start: TimeOrdinal, end: TimeOrdinal, grain: TimeGrain, locale: Locale): string {
    if (start === end || grain === "none") return formatTime(start, grain, locale)
    const startLabel = formatTime(start, grain, locale)
    const endLabel = formatTime(end, grain, locale)
    if (grain === "year") return `${startLabel}${EN_DASH}${endLabel}`
    if (locale === "fr") return `de ${startLabel} à ${endLabel}`
    return `${startLabel} to ${endLabel}`
}
