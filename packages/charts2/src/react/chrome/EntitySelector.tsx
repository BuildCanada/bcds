/**
 * Entity selector panel (spec 07 §2): accent/alias-tolerant search, group
 * headers with group-level select, sort by name or by a numeric column
 * (showing the sort value beside each entity), select all / clear, and
 * "no data" tagging. Rendered as a plain panel — the host app decides
 * whether it lives in a drawer, modal, or sidebar.
 */

import { useMemo, useState } from "react"
import { Button, Checkbox, IconButton, RadioGroup, Select, TextField } from "@buildcanada/components"
import { resolveValue } from "../../core/data/derived.ts"
import { formatValue } from "../../core/format/number.ts"
import type { Dataset, EntityMeta, Locale, SortOrder } from "../../core/types.ts"
import { createFuzzySearch, foldAccents } from "./fuzzySearch.ts"

export type EntitySelectorMode = "multi" | "single"

export interface EntitySelectorProps {
    dataset: Dataset
    selected: string[]
    mode: EntitySelectorMode
    onChange: (selected: string[]) => void
    /** Numeric column slugs offered as sort options ("sort by Total spending"). */
    sortColumns?: string[]
    locale: Locale
}

interface RowModel {
    name: string
    group: string | null
    hasData: boolean
    value: number | null
    valueText: string | null
}

function compareNames(a: string, b: string): number {
    const left = foldAccents(a).toLowerCase()
    const right = foldAccents(b).toLowerCase()
    return left < right ? -1 : left > right ? 1 : 0
}

export function EntitySelector({ dataset, selected, mode, onChange, sortColumns = [], locale }: EntitySelectorProps) {
    const [query, setQuery] = useState("")
    const [sortBy, setSortBy] = useState<string>("name")
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

    const labelPlural = dataset.manifest.entity.labelPlural
    const latestTime = dataset.times.length > 0 ? dataset.times[dataset.times.length - 1] : null

    const metaByName = useMemo(() => {
        const map = new Map<string, EntityMeta>()
        for (const meta of dataset.manifest.entities ?? []) {
            map.set(meta.name, meta)
        }
        return map
    }, [dataset])

    const searcher = useMemo(
        () =>
            createFuzzySearch(dataset.entities, (name) => {
                const meta = metaByName.get(name)
                const keys = [name]
                if (meta?.nameFr !== undefined) keys.push(meta.nameFr)
                if (meta?.code !== undefined) keys.push(meta.code)
                for (const alias of meta?.aliases ?? []) keys.push(alias)
                return keys
            }),
        [dataset, metaByName],
    )

    /** Entities with at least one non-missing cell anywhere in the dataset. */
    const entitiesWithData = useMemo(() => {
        const set = new Set<string>()
        const timesToCheck: (number | null)[] = dataset.times.length > 0 ? [...dataset.times] : [null]
        const columns = [...dataset.columns.values()]
        for (const entity of dataset.entities) {
            let found = false
            for (const time of timesToCheck) {
                const row = dataset.rowIndexOf(entity, time)
                if (row < 0) continue
                if (columns.some((column) => column.values[row] !== null && column.values[row] !== undefined)) {
                    found = true
                    break
                }
            }
            if (found) set.add(entity)
        }
        return set
    }, [dataset])

    const rows = useMemo<RowModel[]>(() => {
        const names = query.trim() === "" ? [...dataset.entities] : searcher.search(query)
        const sortColumn = sortBy === "name" ? null : sortBy
        const columnMeta = sortColumn !== null ? dataset.columns.get(sortColumn)?.meta : undefined

        const models = names.map<RowModel>((name) => {
            let value: number | null = null
            let valueText: string | null = null
            if (sortColumn !== null && columnMeta !== undefined) {
                const cell = resolveValue(dataset, sortColumn, name, latestTime)
                if (cell.status === "value") {
                    value = cell.value
                    valueText = formatValue(cell.value, columnMeta, { locale, verbosity: "label" })
                }
            }
            return {
                name,
                group: metaByName.get(name)?.group ?? null,
                hasData: entitiesWithData.has(name),
                value,
                valueText,
            }
        })

        const direction = sortOrder === "asc" ? 1 : -1
        models.sort((a, b) => {
            if (sortBy === "name") return direction * compareNames(a.name, b.name)
            if (a.value === null && b.value === null) return compareNames(a.name, b.name)
            if (a.value === null) return 1
            if (b.value === null) return -1
            return direction * (a.value - b.value)
        })
        return models
    }, [dataset, searcher, metaByName, entitiesWithData, query, sortBy, sortOrder, latestTime, locale])

    const groups = useMemo(() => {
        const list: { name: string | null; rows: RowModel[] }[] = []
        const byName = new Map<string | null, { name: string | null; rows: RowModel[] }>()
        for (const row of rows) {
            let bucket = byName.get(row.group)
            if (bucket === undefined) {
                bucket = { name: row.group, rows: [] }
                byName.set(row.group, bucket)
                list.push(bucket)
            }
            bucket.rows.push(row)
        }
        return list
    }, [rows])

    function toggleEntity(name: string): void {
        if (mode === "single") {
            onChange([name])
            return
        }
        if (selected.includes(name)) {
            onChange(selected.filter((entity) => entity !== name))
        } else {
            onChange([...selected, name])
        }
    }

    function toggleGroup(names: readonly string[]): void {
        const allSelected = names.every((name) => selected.includes(name))
        if (allSelected) {
            onChange(selected.filter((entity) => !names.includes(entity)))
        } else {
            const merged = [...selected]
            for (const name of names) {
                if (!merged.includes(name)) merged.push(name)
            }
            onChange(merged)
        }
    }

    function handleSortByChange(value: string): void {
        setSortBy(value)
        setSortOrder(value === "name" ? "asc" : "desc")
    }

    return (
        <div className="bcds2-entity-selector">
            <TextField
                type="search"
                className="bcds2-entity-selector__search"
                label={`Search ${labelPlural}`}
                placeholder={`Search ${labelPlural}`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />
            <div className="bcds2-entity-selector__controls">
                <Select
                    className="bcds2-entity-selector__sort"
                    label="Sort by"
                    value={sortBy}
                    onChange={(event) => handleSortByChange(event.target.value)}
                    options={[
                        { value: "name", label: "Name" },
                        ...sortColumns.map((slug) => ({
                            value: slug,
                            label: dataset.columns.get(slug)?.meta.name ?? slug,
                        })),
                    ]}
                />
                <IconButton
                    className="bcds2-entity-selector__order"
                    label={sortOrder === "asc" ? "Sorted ascending" : "Sorted descending"}
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    variant="outline-charcoal"
                    size="sm"
                    icon={<span aria-hidden="true">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                />
                {mode === "multi" && (
                    <span className="bcds2-entity-selector__bulk">
                        <Button
                            className="bcds2-entity-selector__action"
                            onClick={() => onChange([...dataset.entities])}
                            variant="outline-charcoal"
                            size="sm"
                            icon={null}
                        >
                            Select all
                        </Button>
                        <Button
                            className="bcds2-entity-selector__action"
                            onClick={() => onChange([])}
                            variant="outline-charcoal"
                            size="sm"
                            icon={null}
                        >
                            Clear
                        </Button>
                    </span>
                )}
            </div>
            <div className="bcds2-entity-selector__groups">
                {groups.map((group) => {
                    const groupNames = group.rows.map((row) => row.name)
                    const allSelected = groupNames.length > 0 && groupNames.every((name) => selected.includes(name))
                    return (
                        <div key={group.name ?? ""} className="bcds2-entity-selector__group">
                            {group.name !== null &&
                                (mode === "multi" ? (
                                    <div className="bcds2-entity-selector__group-header">
                                        <Checkbox
                                            className="bcds2-entity-selector__group-checkbox"
                                            label={group.name}
                                            checked={allSelected}
                                            onChange={() => toggleGroup(groupNames)}
                                        />
                                    </div>
                                ) : (
                                    <div className="bcds2-entity-selector__group-header">
                                        <span>{group.name}</span>
                                    </div>
                                ))}
                            {mode === "single" ? (
                                <RadioGroup
                                    className="bcds2-entity-selector__radio-group"
                                    legend={group.name ?? `Select ${labelPlural}`}
                                    visuallyHiddenLegend
                                    name="bcds2-entity-selector"
                                    value={selected[0] ?? ""}
                                    onValueChange={(value) => toggleEntity(value)}
                                    options={group.rows.map((row) => ({
                                        value: row.name,
                                        label: (
                                            <span
                                                className={
                                                    row.hasData
                                                        ? "bcds2-entity-selector__row"
                                                        : "bcds2-entity-selector__row bcds2-entity-selector__row--no-data"
                                                }
                                            >
                                                <span className="bcds2-entity-selector__name">{row.name}</span>
                                                {!row.hasData && <span className="bcds2-entity-selector__tag">no data</span>}
                                                {row.valueText !== null && <span className="bcds2-entity-selector__value">{row.valueText}</span>}
                                            </span>
                                        ),
                                    }))}
                                />
                            ) : (
                                group.rows.map((row) => {
                                    const rowClass = row.hasData
                                        ? "bcds2-entity-selector__row"
                                        : "bcds2-entity-selector__row bcds2-entity-selector__row--no-data"
                                    return (
                                        <div key={row.name} className={`${rowClass} bcds2-entity-selector__row--multi`}>
                                            <Checkbox
                                                className="bcds2-entity-selector__row-checkbox"
                                                label={row.name}
                                                checked={selected.includes(row.name)}
                                                onChange={() => toggleEntity(row.name)}
                                            />
                                            {!row.hasData && <span className="bcds2-entity-selector__tag">no data</span>}
                                            {row.valueText !== null && <span className="bcds2-entity-selector__value">{row.valueText}</span>}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
