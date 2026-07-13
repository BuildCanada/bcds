/**
 * Dataset assembly: manifest + raw rows → Dataset. Spec 01 §2, §5.
 *
 * - Entity order is order of first appearance (after alias resolution).
 * - times are the sorted unique ordinals present in the data.
 * - Column values are row-aligned arrays; rowIndexOf(entity, time) finds
 *   the row via an internal Map.
 * - Duplicate (entity, time) rows are error Diagnostics; the first row wins.
 */

import type { CellValue, ColumnData, Dataset, Diagnostic, Manifest, TimeOrdinal } from "../types.ts"
import type { RawRow } from "./parse.ts"
import { compareTimes, parseTime } from "./time.ts"

/**
 * Build an entity-name resolver from the manifest's optional entities list:
 * canonical names, French names, and aliases all resolve to the canonical
 * name; unknown names pass through unchanged (validateDataset warns).
 */
export function buildEntityResolver(manifest: Manifest): (name: string) => string {
    const lookup = new Map<string, string>()
    for (const entity of manifest.entities ?? []) {
        lookup.set(entity.name, entity.name)
        if (entity.nameFr !== undefined) lookup.set(entity.nameFr, entity.name)
        for (const alias of entity.aliases ?? []) lookup.set(alias, entity.name)
    }
    return (name: string) => lookup.get(name) ?? name
}

function rowKey(entity: string, time: TimeOrdinal | null): string {
    return `${entity} ${time}`
}

export interface BuildDatasetResult {
    dataset: Dataset
    diagnostics: Diagnostic[]
}

export function buildDataset(manifest: Manifest, rows: readonly RawRow[]): BuildDatasetResult {
    const diagnostics: Diagnostic[] = []
    const resolveEntity = buildEntityResolver(manifest)
    const hasTime = manifest.timeGrain !== "none"

    interface KeptRow {
        entity: string
        time: TimeOrdinal | null
        cells: RawRow
    }

    const kept: KeptRow[] = []
    const entities: string[] = []
    const seenEntities = new Set<string>()
    const timeSet = new Set<TimeOrdinal>()
    const indexByKey = new Map<string, number>()
    const firstRowByKey = new Map<string, number>()

    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 1
        const cells = rows[i]
        const entity = resolveEntity(typeof cells.entity === "string" ? cells.entity : String(cells.entity ?? ""))

        let time: TimeOrdinal | null = null
        if (hasTime) {
            const rawTime = cells.time
            time = typeof rawTime === "string" || typeof rawTime === "number" ? parseTime(rawTime, manifest.timeGrain) : null
            if (time === null) {
                diagnostics.push({
                    severity: "error",
                    code: "bad-time",
                    message: `Row ${rowNumber}: time "${cells.time}" does not parse under grain "${manifest.timeGrain}"`,
                    context: { row: rowNumber, value: String(cells.time), grain: manifest.timeGrain },
                })
                continue
            }
        }

        const key = rowKey(entity, time)
        const firstRow = firstRowByKey.get(key)
        if (firstRow !== undefined) {
            diagnostics.push({
                severity: "error",
                code: "duplicate-row",
                message: `Row ${rowNumber} duplicates (${entity}${time !== null ? `, ${time}` : ""}) first seen at row ${firstRow}; the first row wins`,
                context: { row: rowNumber, firstRow, entity, ...(time !== null ? { time } : {}) },
            })
            continue
        }

        firstRowByKey.set(key, rowNumber)
        indexByKey.set(key, kept.length)
        kept.push({ entity, time, cells })

        if (!seenEntities.has(entity)) {
            seenEntities.add(entity)
            entities.push(entity)
        }
        if (time !== null) timeSet.add(time)
    }

    const times = [...timeSet].sort(compareTimes)

    const columns = new Map<string, ColumnData>()
    for (const [slug, meta] of Object.entries(manifest.columns)) {
        const values: CellValue[] = kept.map((row) => row.cells[slug] ?? null)
        columns.set(slug, { slug, meta, values })
    }

    const dataset: Dataset = {
        manifest,
        entities,
        times,
        rowIndexOf: (entity: string, time: TimeOrdinal | null) => indexByKey.get(rowKey(entity, time)) ?? -1,
        columns,
    }

    return { dataset, diagnostics }
}
