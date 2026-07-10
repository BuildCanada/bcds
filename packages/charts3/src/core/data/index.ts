import { compareTimes, getAvailableTimes, parseTimeIndex } from "../time"
import type {
    ChartDataset,
    ColumnMetadata,
    DatasetManifest,
    DatasetRow,
    TimeValue,
    ValidationIssue,
    ValidationResult,
} from "../types"

export interface InlineDatasetInput {
    manifest: DatasetManifest
    rows: DatasetRow[]
}

export const createDataset = (input: InlineDatasetInput): ChartDataset => {
    return {
        manifest: normalizeManifest(input.manifest),
        rows: input.rows.map(normalizeRow),
    }
}

export const normalizeManifest = (manifest: DatasetManifest): DatasetManifest => {
    const columns: Record<string, ColumnMetadata> = {}
    for (const [slug, column] of Object.entries(manifest.columns)) {
        columns[slug] = {
            type: "numeric",
            displayFactor: 1,
            tolerance: 0,
            toleranceDirection: "both",
            ...column,
            name: column.name ?? titleCase(slug),
        }
    }

    return {
        fiscalYearStartMonth: 4,
        sources: [],
        ...manifest,
        columns,
    }
}

export const validateDataset = (dataset: ChartDataset): ValidationResult => {
    const issues: ValidationIssue[] = []
    const { manifest, rows } = dataset
    const declaredColumns = new Set(Object.keys(manifest.columns))
    const dimensionColumns = new Set(manifest.dimensions ?? [])
    const rowKeys = new Set<string>()

    rows.forEach((row, rowIndex) => {
        if (!row.entity) {
            issues.push({ severity: "error", message: "Missing entity", rowIndex })
        }

        if (manifest.timeGrain !== "none") {
            if (row.time === undefined || row.time === null || row.time === "") {
                issues.push({ severity: "error", message: "Missing time", rowIndex, column: "time" })
            } else if (
                Number.isNaN(
                    parseTimeIndex(row.time, manifest.timeGrain, manifest.fiscalYearStartMonth)
                )
            ) {
                issues.push({
                    severity: "error",
                    message: `Invalid ${manifest.timeGrain} time value`,
                    rowIndex,
                    column: "time",
                })
            }
        } else if (row.time !== undefined) {
            issues.push({
                severity: "error",
                message: "Snapshot datasets must omit the time column",
                rowIndex,
                column: "time",
            })
        }

        const rowKey = `${row.entity}::${row.time ?? ""}`
        if (rowKeys.has(rowKey)) {
            issues.push({
                severity: "error",
                message: "Duplicate entity/time row",
                rowIndex,
            })
        }
        rowKeys.add(rowKey)

        for (const [column, value] of Object.entries(row)) {
            if (column === "entity" || column === "time" || dimensionColumns.has(column)) continue
            if (!declaredColumns.has(column)) {
                issues.push({
                    severity: "warning",
                    message: "Undeclared column present in row",
                    rowIndex,
                    column,
                })
                continue
            }

            const metadata = manifest.columns[column]
            if (isNumericColumn(metadata) && value !== null && value !== "" && value !== undefined) {
                const numericValue = Number(value)
                if (Number.isNaN(numericValue)) {
                    issues.push({
                        severity: "error",
                        message: "Numeric column contains a non-numeric value",
                        rowIndex,
                        column,
                    })
                }
            }
        }

        for (const column of declaredColumns) {
            if (!(column in row)) {
                issues.push({
                    severity: "warning",
                    message: "Declared column absent from row",
                    rowIndex,
                    column,
                })
            }
        }
    })

    return { ok: !issues.some((issue) => issue.severity === "error"), issues }
}

export const getEntities = (dataset: ChartDataset): string[] => {
    const seen = new Set<string>()
    for (const row of dataset.rows) seen.add(row.entity)
    return [...seen].sort((a, b) => a.localeCompare(b))
}

export const resolveNumericValue = (
    dataset: ChartDataset,
    entity: string,
    metric: string,
    time?: TimeValue
): {
    value: number | null
    originalValue: number | null
    denominatorValue?: number | null
    row?: DatasetRow
    toleranced?: boolean
} => {
    const metadata = dataset.manifest.columns[metric]
    const numerator = findCell(dataset, entity, metric, time, metadata)
    const originalValue = numerator.value

    if (numerator.value === null) {
        return { value: null, originalValue, row: numerator.row, toleranced: numerator.toleranced }
    }

    if (metadata.denominator) {
        const denominatorMetadata = dataset.manifest.columns[metadata.denominator]
        const denominator = findCell(dataset, entity, metadata.denominator, time, denominatorMetadata)
        if (denominator.value === null || denominator.value === 0) {
            return {
                value: null,
                originalValue,
                denominatorValue: denominator.value,
                row: numerator.row,
                toleranced: numerator.toleranced || denominator.toleranced,
            }
        }
        return {
            value: numerator.value / denominator.value,
            originalValue,
            denominatorValue: denominator.value,
            row: numerator.row,
            toleranced: numerator.toleranced || denominator.toleranced,
        }
    }

    return {
        value: numerator.value,
        originalValue,
        row: numerator.row,
        toleranced: numerator.toleranced,
    }
}

const findCell = (
    dataset: ChartDataset,
    entity: string,
    metric: string,
    time: TimeValue | undefined,
    metadata: ColumnMetadata
): { value: number | null; row?: DatasetRow; toleranced?: boolean } => {
    const rows = dataset.rows.filter((row) => row.entity === entity)
    if (dataset.manifest.timeGrain === "none" || time === undefined) {
        return coerceCell(rows[0], metric)
    }

    const exact = rows.find((row) => row.time === time)
    const exactCell = coerceCell(exact, metric)
    if (exactCell.value !== null) return exactCell

    const tolerance = metadata.tolerance ?? 0
    if (tolerance <= 0) return exactCell

    const target = parseTimeIndex(time, dataset.manifest.timeGrain, dataset.manifest.fiscalYearStartMonth)
    const candidates = rows
        .map((row) => {
            if (row.time === undefined) return undefined
            const index = parseTimeIndex(
                row.time,
                dataset.manifest.timeGrain,
                dataset.manifest.fiscalYearStartMonth
            )
            const distance = Math.abs(index - target)
            const direction = index < target ? "backwards" : "forwards"
            const cell = coerceCell(row, metric)
            return { row, distance, direction, cell }
        })
        .filter((candidate): candidate is NonNullable<typeof candidate> => {
            if (!candidate || candidate.cell.value === null) return false
            if (candidate.distance > tolerance) return false
            if (metadata.toleranceDirection === "backwards" && candidate.direction !== "backwards") return false
            if (metadata.toleranceDirection === "forwards" && candidate.direction !== "forwards") return false
            return true
        })
        .sort((a, b) => a.distance - b.distance || compareTimes(a.row.time!, b.row.time!, dataset.manifest))

    if (!candidates[0]) return exactCell
    return { ...candidates[0].cell, toleranced: true }
}

export const getTimesForDataset = (dataset: ChartDataset): TimeValue[] =>
    getAvailableTimes(dataset.manifest, dataset.rows)

const coerceCell = (row: DatasetRow | undefined, metric: string): { value: number | null; row?: DatasetRow } => {
    if (!row) return { value: null }
    const raw = row[metric]
    if (raw === undefined || raw === null || raw === "") return { value: null, row }
    const value = Number(raw)
    return Number.isNaN(value) ? { value: null, row } : { value, row }
}

const normalizeRow = (row: DatasetRow): DatasetRow => {
    const normalized: DatasetRow = { entity: String(row.entity) }
    for (const [key, value] of Object.entries(row)) {
        if (key === "entity") continue
        normalized[key] = value === "" ? null : value
    }
    return normalized
}

const isNumericColumn = (metadata: ColumnMetadata): boolean => {
    return metadata.type !== "categorical" && metadata.type !== "ordinal"
}

const titleCase = (slug: string): string =>
    slug
        .replace(/[_-]+/g, " ")
        .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
