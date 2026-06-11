/**
 * Raw table parsing: CSV / JSON rows → typed raw rows. Spec 01 §2.
 *
 * Invariants:
 * - An empty cell is null, NEVER 0 ("missing ≠ zero" starts here).
 * - Numeric columns parse strictly: a non-numeric, non-empty cell is an
 *   error Diagnostic with its row number; the offending raw string is kept
 *   in the row so validateDataset can also report it.
 * - Ragged CSV rows are rejected (skipped with an error Diagnostic).
 *
 * Typing comes from the manifest (d3-dsv does no inference of its own):
 * declared numeric columns become numbers; entity, time, dimensions and
 * categorical columns stay strings. Time stays in its raw string/number
 * form — ordinal conversion happens in buildDataset via core/data/time.
 */

import { csvParseRows } from "d3-dsv"

import type { CellValue, ColumnType, Diagnostic, Manifest } from "../types.ts"

/** One raw table row, keyed by column name. Missing/empty cells are null. */
export type RawRow = Record<string, CellValue>

export interface ParsedRows {
    rows: RawRow[]
    /** Column names in table order (CSV header / first-appearance for JSON). */
    columns: string[]
    diagnostics: Diagnostic[]
}

const NUMERIC_TYPES: ReadonlySet<ColumnType> = new Set(["numeric", "integer", "percentage", "currency"])

/** True when the manifest declares this column as a numeric type. */
export function isNumericColumn(manifest: Manifest, column: string): boolean {
    const meta = manifest.columns[column]
    return meta !== undefined && NUMERIC_TYPES.has(meta.type)
}

/**
 * Strictly parse one numeric cell. Empty → null. A parse failure returns
 * the trimmed raw string (callers emit the Diagnostic).
 */
function parseNumericCell(trimmed: string): number | string | null {
    if (trimmed === "") return null
    const value = Number(trimmed)
    return Number.isFinite(value) ? value : trimmed
}

function nonNumericDiagnostic(column: string, value: string, row: number): Diagnostic {
    return {
        severity: "error",
        code: "non-numeric-cell",
        message: `Column "${column}" expects numbers but row ${row} contains "${value}"`,
        context: { column, value, row },
    }
}

/**
 * Parse CSV text into raw rows. Row numbers in diagnostics are 1-based
 * data-row positions (the header row is not counted).
 */
export function parseCsv(text: string, manifest: Manifest): ParsedRows {
    const diagnostics: Diagnostic[] = []

    // Strip a UTF-8 byte-order mark if present.
    const stripped = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
    const grid = csvParseRows(stripped)

    if (grid.length === 0) {
        return {
            rows: [],
            columns: [],
            diagnostics: [{ severity: "error", code: "empty-table", message: "CSV contains no header row" }],
        }
    }

    const header = grid[0].map((name) => name.trim())
    const rows: RawRow[] = []

    for (let i = 1; i < grid.length; i++) {
        const line = grid[i]
        const rowNumber = i // 1-based data-row position
        if (line.length !== header.length) {
            diagnostics.push({
                severity: "error",
                code: "ragged-row",
                message: `Row ${rowNumber} has ${line.length} cells but the header declares ${header.length}`,
                context: { row: rowNumber, cells: line.length, expected: header.length },
            })
            continue
        }

        const row: RawRow = {}
        for (let j = 0; j < header.length; j++) {
            const column = header[j]
            const trimmed = line[j].trim()
            if (column === "entity") {
                row[column] = trimmed
            } else if (isNumericColumn(manifest, column)) {
                const value = parseNumericCell(trimmed)
                if (typeof value === "string") {
                    diagnostics.push(nonNumericDiagnostic(column, value, rowNumber))
                }
                row[column] = value
            } else {
                // time, dimensions, categorical, and undeclared columns stay strings
                row[column] = trimmed === "" ? null : trimmed
            }
        }
        rows.push(row)
    }

    return { rows, columns: header, diagnostics }
}

/**
 * Normalize JSON rows (array of objects) into the same shape parseCsv
 * produces. null/undefined/"" cells become null; numeric columns accept
 * numbers or strictly-parsed numeric strings.
 */
export function parseJsonRows(raw: unknown, manifest: Manifest): ParsedRows {
    const diagnostics: Diagnostic[] = []

    if (!Array.isArray(raw)) {
        return {
            rows: [],
            columns: [],
            diagnostics: [{ severity: "error", code: "invalid-rows", message: "JSON rows must be an array of objects" }],
        }
    }

    const columns: string[] = []
    const seen = new Set<string>()
    const rows: RawRow[] = []

    for (let i = 0; i < raw.length; i++) {
        const input = raw[i]
        const rowNumber = i + 1
        if (typeof input !== "object" || input === null || Array.isArray(input)) {
            diagnostics.push({
                severity: "error",
                code: "invalid-rows",
                message: `Row ${rowNumber} is not an object`,
                context: { row: rowNumber },
            })
            continue
        }

        const row: RawRow = {}
        for (const [column, value] of Object.entries(input as Record<string, unknown>)) {
            if (!seen.has(column)) {
                seen.add(column)
                columns.push(column)
            }
            if (value === null || value === undefined || value === "") {
                row[column] = null
            } else if (isNumericColumn(manifest, column)) {
                if (typeof value === "number" && Number.isFinite(value)) {
                    row[column] = value
                } else {
                    const parsed = parseNumericCell(String(value).trim())
                    if (typeof parsed === "string") {
                        diagnostics.push(nonNumericDiagnostic(column, parsed, rowNumber))
                    }
                    row[column] = parsed
                }
            } else if (typeof value === "number") {
                row[column] = value
            } else {
                row[column] = String(value)
            }
        }
        rows.push(row)
    }

    return { rows, columns, diagnostics }
}
