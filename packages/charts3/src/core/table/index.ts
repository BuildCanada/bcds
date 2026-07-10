import type { TableModel } from "../types"

export const tableToCsv = (table: TableModel): string => {
    const header = ["entity", "time", "metric", "value", "formatted"]
    const rows = table.rows.map((row) => [
        row.entity,
        row.time ?? "",
        row.metric,
        row.value ?? "",
        row.formatted,
    ])
    return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")
}

const csvCell = (value: string | number): string => {
    const stringValue = String(value)
    return /[",\n]/.test(stringValue)
        ? `"${stringValue.replaceAll('"', '""')}"`
        : stringValue
}
