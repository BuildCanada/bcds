import type { ColumnMetadata, LocaleCode, TimeGrain, TimeValue } from "../types"
import { formatTime } from "../time"

export const formatValue = (
    value: number | null,
    metadata: ColumnMetadata,
    locale: LocaleCode = "en"
): string => {
    if (value === null || Number.isNaN(value)) return "No data"

    const displayFactor = metadata.displayFactor ?? 1
    const displayValue = value * displayFactor
    const decimals =
        metadata.decimals ??
        (metadata.type === "integer" ? 0 : Math.abs(displayValue) >= 100 ? 0 : 1)

    const formatter = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
    const formatted = formatter.format(displayValue)

    if (metadata.type === "currency") {
        const currency = metadata.currency ?? "CAD"
        return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
            style: "currency",
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(displayValue)
    }

    const unit = metadata.derivedShortUnit ?? metadata.shortUnit ?? ""
    if (metadata.type === "percentage" && !unit) return `${formatted}%`
    return unit ? `${unit}${formatted}` : formatted
}

export const formatTimeSelection = (
    start: TimeValue | undefined,
    end: TimeValue | undefined,
    grain: TimeGrain
): string => {
    if (start === undefined && end === undefined) return ""
    if (start === undefined || end === undefined || start === end) {
        return formatTime(end ?? start, grain)
    }
    return `${formatTime(start, grain)} to ${formatTime(end, grain)}`
}
