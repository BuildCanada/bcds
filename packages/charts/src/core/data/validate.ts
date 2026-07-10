/**
 * Dataset validation. Spec 01 §8: report ALL problems at once, with row
 * references, instead of silently coercing. Also powers `charts validate`
 * in the CLI (spec 24).
 *
 * Errors: duplicate (entity, time) rows, unparseable times, declared
 * columns absent from the table, non-numeric cells in numeric columns.
 * Warnings: undeclared columns present, unknown entities (when the
 * manifest declares an entities list), zero denominator cells.
 *
 * Row numbers are 1-based data-row positions (header not counted),
 * matching core/data/parse diagnostics.
 */

import type { Diagnostic, Manifest, TimeOrdinal } from "../types.ts"
import { buildEntityResolver } from "./dataset.ts"
import { isNumericColumn, type RawRow } from "./parse.ts"
import { parseTime } from "./time.ts"

export function validateDataset(manifest: Manifest, rows: readonly RawRow[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const hasTime = manifest.timeGrain !== "none"

    // -- Column presence ----------------------------------------------------
    const present: string[] = []
    const presentSet = new Set<string>()
    for (const row of rows) {
        for (const column of Object.keys(row)) {
            if (!presentSet.has(column)) {
                presentSet.add(column)
                present.push(column)
            }
        }
    }

    const special = new Set(["entity", "time", ...(manifest.dimensions ?? [])])

    if (rows.length > 0 && !presentSet.has("entity")) {
        diagnostics.push({
            severity: "error",
            code: "missing-column",
            message: 'Required column "entity" is absent from the table',
            context: { column: "entity" },
        })
    }
    if (hasTime && rows.length > 0 && !presentSet.has("time")) {
        diagnostics.push({
            severity: "error",
            code: "missing-column",
            message: `Time grain is "${manifest.timeGrain}" but the table has no "time" column`,
            context: { column: "time", grain: manifest.timeGrain },
        })
    }
    if (!hasTime && presentSet.has("time")) {
        diagnostics.push({
            severity: "warning",
            code: "unexpected-time-column",
            message: 'Time grain is "none" but the table has a "time" column; it will be ignored',
            context: { column: "time" },
        })
    }

    for (const slug of Object.keys(manifest.columns)) {
        if (!presentSet.has(slug)) {
            diagnostics.push({
                severity: "error",
                code: "missing-column",
                message: `Declared column "${slug}" is absent from the table`,
                context: { column: slug },
            })
        }
    }
    for (const column of present) {
        if (!special.has(column) && !(column in manifest.columns)) {
            diagnostics.push({
                severity: "warning",
                code: "undeclared-column",
                message: `Column "${column}" is present in the table but not declared in the manifest`,
                context: { column },
            })
        }
    }

    // Denominator column slugs declared in the manifest (for zero checks).
    const denominatorSlugs = new Set<string>()
    for (const meta of Object.values(manifest.columns)) {
        if (meta.denominator !== undefined) denominatorSlugs.add(meta.denominator)
    }

    // -- Per-row checks -----------------------------------------------------
    const resolveEntity = buildEntityResolver(manifest)
    const knownEntities =
        manifest.entities !== undefined ? new Set(manifest.entities.map((entity) => entity.name)) : null
    const unknownEntities: string[] = []
    const unknownEntitySet = new Set<string>()
    const firstRowByKey = new Map<string, number>()

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNumber = i + 1

        const rawEntity = typeof row.entity === "string" ? row.entity : String(row.entity ?? "")
        const entity = resolveEntity(rawEntity)
        if (knownEntities !== null && !knownEntities.has(entity) && !unknownEntitySet.has(rawEntity)) {
            unknownEntitySet.add(rawEntity)
            unknownEntities.push(rawEntity)
        }

        let time: TimeOrdinal | null = null
        let timeOk = !hasTime
        if (hasTime && presentSet.has("time")) {
            const rawTime = row.time
            time = typeof rawTime === "string" || typeof rawTime === "number" ? parseTime(rawTime, manifest.timeGrain) : null
            if (time === null) {
                diagnostics.push({
                    severity: "error",
                    code: "bad-time",
                    message: `Row ${rowNumber}: time "${row.time}" does not parse under grain "${manifest.timeGrain}"`,
                    context: { row: rowNumber, value: String(row.time), grain: manifest.timeGrain },
                })
            } else {
                timeOk = true
            }
        }

        // Duplicates — only among rows whose key is well-formed.
        if (timeOk) {
            const key = `${entity} ${time}`
            const firstRow = firstRowByKey.get(key)
            if (firstRow !== undefined) {
                diagnostics.push({
                    severity: "error",
                    code: "duplicate-row",
                    message: `Row ${rowNumber} duplicates (${entity}${time !== null ? `, ${time}` : ""}) first seen at row ${firstRow}`,
                    context: { row: rowNumber, firstRow, entity, ...(time !== null ? { time } : {}) },
                })
            } else {
                firstRowByKey.set(key, rowNumber)
            }
        }

        for (const [column, value] of Object.entries(row)) {
            if (isNumericColumn(manifest, column) && typeof value === "string") {
                diagnostics.push({
                    severity: "error",
                    code: "non-numeric-cell",
                    message: `Column "${column}" expects numbers but row ${rowNumber} contains "${value}"`,
                    context: { column, value, row: rowNumber },
                })
            }
            if (denominatorSlugs.has(column) && value === 0) {
                diagnostics.push({
                    severity: "warning",
                    code: "zero-denominator",
                    message: `Denominator column "${column}" is zero at row ${rowNumber}; dependent derived cells will be missing`,
                    context: { column, row: rowNumber },
                })
            }
        }
    }

    if (unknownEntities.length > 0) {
        diagnostics.push({
            severity: "warning",
            code: "unknown-entities",
            message: `Entities not in the manifest's entities list: ${unknownEntities.join(", ")}`,
            context: { entities: unknownEntities.join(", "), count: unknownEntities.length },
        })
    }

    return diagnostics
}
