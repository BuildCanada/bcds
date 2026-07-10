import type { DatasetManifest, TimeGrain, TimeRange, TimeSelection, TimeValue } from "../types"

export const isRangeSelection = (time: TimeSelection): time is TimeRange =>
    Array.isArray(time)

export const timeToKey = (time: TimeValue): string => String(time)

export const parseTimeIndex = (
    value: TimeValue,
    grain: TimeGrain,
    fiscalYearStartMonth = 4
): number => {
    if (grain === "none") return 0
    if (grain === "year") return Number(value)
    if (grain === "fiscal-year") {
        const match = String(value).match(/^(\d{4})-\d{2}$/)
        if (!match) return Number.NaN
        return Number(match[1]) + (fiscalYearStartMonth - 1) / 12
    }
    if (grain === "quarter") {
        const match = String(value).match(/^(\d{4})-Q([1-4])$/)
        if (!match) return Number.NaN
        return Number(match[1]) * 4 + Number(match[2]) - 1
    }
    if (grain === "month") {
        const match = String(value).match(/^(\d{4})-(\d{2})$/)
        if (!match) return Number.NaN
        return Number(match[1]) * 12 + Number(match[2]) - 1
    }
    const date = new Date(String(value))
    return date.getTime()
}

export const compareTimes = (
    a: TimeValue,
    b: TimeValue,
    manifest: DatasetManifest
): number => {
    return (
        parseTimeIndex(a, manifest.timeGrain, manifest.fiscalYearStartMonth) -
        parseTimeIndex(b, manifest.timeGrain, manifest.fiscalYearStartMonth)
    )
}

export const getAvailableTimes = (manifest: DatasetManifest, rows: { time?: TimeValue }[]): TimeValue[] => {
    if (manifest.timeGrain === "none") return []
    const seen = new Map<string, TimeValue>()
    for (const row of rows) {
        if (row.time !== undefined) seen.set(timeToKey(row.time), row.time)
    }
    return [...seen.values()].sort((a, b) => compareTimes(a, b, manifest))
}

export const resolveTimeToken = (
    token: TimeValue | "earliest" | "latest",
    times: TimeValue[]
): TimeValue | undefined => {
    if (token === "earliest") return times[0]
    if (token === "latest") return times[times.length - 1]
    return token
}

export const resolveTimeSelection = (
    selection: TimeSelection,
    times: TimeValue[]
): TimeSelection => {
    if (Array.isArray(selection)) {
        return [
            resolveTimeToken(selection[0], times) ?? selection[0],
            resolveTimeToken(selection[1], times) ?? selection[1],
        ]
    }
    return resolveTimeToken(selection, times) ?? selection
}

export const formatTime = (value: TimeValue | undefined, grain: TimeGrain): string => {
    if (value === undefined) return ""
    if (grain === "fiscal-year") return String(value).replace("-", "\u2013")
    if (grain === "quarter") {
        const [year, quarter] = String(value).split("-")
        return `${quarter} ${year}`
    }
    return String(value)
}

export const selectionLabel = (selection: TimeSelection, grain: TimeGrain): string => {
    if (Array.isArray(selection)) {
        const start = formatTime(selection[0] as TimeValue, grain)
        const end = formatTime(selection[1] as TimeValue, grain)
        return start === end ? start : `${start} to ${end}`
    }
    return formatTime(selection as TimeValue, grain)
}
