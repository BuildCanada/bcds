/**
 * Data table tab (spec 22): one row per entity (entity column pinned left
 * via CSS), per metric either one value column (single time) or start /
 * end / absolute change / relative change columns (time range). Every cell
 * resolves through resolveValue, so missing ≠ zero, tolerance is marked
 * with the actual time, and projected values are flagged.
 *
 * Sort, search, and scope STATE live in the caller (they persist in URL
 * state per spec 22 §3) — this component renders the given state and emits
 * change events.
 */

import { useMemo } from "react"
import type { ReactNode } from "react"
import { Button, SegmentedControl, TextField } from "@buildcanada/components"
import { resolveValue } from "../../core/data/derived.ts"
import { snapToAvailable } from "../../core/data/time.ts"
import { formatChange, formatValue } from "../../core/format/number.ts"
import { formatTime } from "../../core/format/timeLabels.ts"
import type {
    ColumnMeta,
    Dataset,
    Locale,
    ResolvedValue,
    SortOrder,
    TimeBound,
    TimeGrain,
    TimeOrdinal,
    TimeSelection,
} from "../../core/types.ts"
import { createFuzzySearch, foldAccents } from "./fuzzySearch.ts"

export const EM_DASH = "—"

export type DataTableScope = "selected" | "all"

export interface DataTableSort {
    /** "entity", a metric slug (single time), or "slug.start|.end|.change|.relativeChange". */
    column: string
    order: SortOrder
}

export interface DataTableProps {
    dataset: Dataset
    /** Metric columns to show, in order (slug → bound column metadata). */
    columns: Record<string, ColumnMeta>
    /** The selected entities (the rows when scope is "selected"). */
    entities: string[]
    /** Resolved time selection (ordinals; earliest/latest tolerated). */
    timeSelection: TimeSelection
    grain: TimeGrain
    locale: Locale
    scope: DataTableScope
    onScopeChange: (scope: DataTableScope) => void
    sort: DataTableSort
    onSortChange: (sort: DataTableSort) => void
    searchQuery: string
    onSearchChange: (query: string) => void
}

const SUB_COLUMN_PATTERN = /^(.*)\.(start|end|change|relativeChange)$/

function resolveBound(bound: TimeBound, times: readonly TimeOrdinal[]): TimeOrdinal | null {
    if (times.length === 0) return null
    if (bound === "earliest") return times[0]
    if (bound === "latest") return times[times.length - 1]
    return snapToAvailable(bound, times)
}

function compareNames(a: string, b: string): number {
    const left = foldAccents(a).toLowerCase()
    const right = foldAccents(b).toLowerCase()
    return left < right ? -1 : left > right ? 1 : 0
}

function capitalize(word: string): string {
    return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1)
}

export function DataTable({
    dataset,
    columns,
    entities,
    timeSelection,
    grain,
    locale,
    scope,
    onScopeChange,
    sort,
    onSortChange,
    searchQuery,
    onSearchChange,
}: DataTableProps) {
    const slugs = Object.keys(columns)
    const startTime = resolveBound(timeSelection.start, dataset.times)
    const endTime = resolveBound(timeSelection.end, dataset.times)
    const isRange = startTime !== null && endTime !== null && startTime !== endTime
    const rangeStart = startTime ?? 0
    const rangeEnd = endTime ?? 0

    const metaByEntity = useMemo(() => {
        const map = new Map<string, { aliases: string[] }>()
        for (const meta of dataset.manifest.entities ?? []) {
            const aliases: string[] = []
            if (meta.nameFr !== undefined) aliases.push(meta.nameFr)
            if (meta.code !== undefined) aliases.push(meta.code)
            aliases.push(...(meta.aliases ?? []))
            map.set(meta.name, { aliases })
        }
        return map
    }, [dataset])

    const searcher = useMemo(
        () => createFuzzySearch(dataset.entities, (name) => [name, ...(metaByEntity.get(name)?.aliases ?? [])]),
        [dataset, metaByEntity],
    )

    function resolveCell(entity: string, slug: string, time: TimeOrdinal | null): ResolvedValue {
        return resolveValue(dataset, slug, entity, time, columns[slug])
    }

    function sortValueFor(entity: string, columnId: string): number | string | null {
        if (columnId === "entity") return entity
        const match = SUB_COLUMN_PATTERN.exec(columnId)
        const slug = match !== null && slugs.includes(match[1]) ? match[1] : columnId
        const part = match !== null && slugs.includes(match[1]) ? match[2] : isRange ? "end" : "value"
        if (!slugs.includes(slug)) return null

        if (part === "start") {
            const cell = resolveCell(entity, slug, startTime)
            return cell.status === "value" ? cell.value : null
        }
        if (part === "change" || part === "relativeChange") {
            const startCell = resolveCell(entity, slug, startTime)
            const endCell = resolveCell(entity, slug, endTime)
            if (startCell.status !== "value" || endCell.status !== "value") return null
            const diff = endCell.value - startCell.value
            if (part === "change") return diff
            return startCell.value === 0 ? null : diff / Math.abs(startCell.value)
        }
        const cell = resolveCell(entity, slug, endTime)
        return cell.status === "value" ? cell.value : null
    }

    const visibleEntities = useMemo(() => {
        const base = scope === "all" ? [...dataset.entities] : entities.filter((name) => dataset.entities.includes(name))
        const filtered =
            searchQuery.trim() === "" ? base : searcher.search(searchQuery).filter((name) => base.includes(name))
        const direction = sort.order === "asc" ? 1 : -1
        const sorted = [...filtered].sort((a, b) => {
            const left = sortValueFor(a, sort.column)
            const right = sortValueFor(b, sort.column)
            if (typeof left === "string" && typeof right === "string") return direction * compareNames(left, right)
            if (left === null && right === null) return compareNames(a, b)
            if (left === null) return 1
            if (right === null) return -1
            if (typeof left === "string" || typeof right === "string") return 0
            return direction * (left - right)
        })
        return sorted
    }, [dataset, entities, scope, searchQuery, searcher, sort, startTime, endTime, columns])

    function headerButton(columnId: string, content: ReactNode): ReactNode {
        const isActive = sort.column === columnId
        const nextOrder: SortOrder = isActive ? (sort.order === "asc" ? "desc" : "asc") : columnId === "entity" ? "asc" : "desc"
        return (
            <Button
                className="bcds2-data-table__sort-button"
                onClick={() => onSortChange({ column: columnId, order: nextOrder })}
                variant="outline-charcoal"
                size="sm"
                icon={null}
            >
                {content}
                {isActive && (
                    <span className="bcds2-data-table__sort-arrow" aria-hidden="true">
                        {sort.order === "asc" ? "▲" : "▼"}
                    </span>
                )}
            </Button>
        )
    }

    function ariaSort(columnId: string): "ascending" | "descending" | undefined {
        if (sort.column !== columnId) return undefined
        return sort.order === "asc" ? "ascending" : "descending"
    }

    function renderValueCell(entity: string, slug: string, time: TimeOrdinal | null, key: string): ReactNode {
        const cell = resolveCell(entity, slug, time)
        if (cell.status === "missing") {
            return (
                <td key={key} className="bcds2-data-table__cell bcds2-data-table__cell--numeric bcds2-data-table__cell--missing">
                    {EM_DASH}
                </td>
            )
        }
        const toleranced = cell.sourceTime !== cell.time
        const classes = ["bcds2-data-table__cell", "bcds2-data-table__cell--numeric"]
        if (cell.projected) classes.push("bcds2-data-table__cell--projected")
        return (
            <td key={key} className={classes.join(" ")}>
                {formatValue(cell.value, columns[slug], { locale, verbosity: "long" })}
                {toleranced && (
                    <span
                        className="bcds2-data-table__marker bcds2-data-table__marker--toleranced"
                        title={`Data from ${formatTime(cell.sourceTime, grain, locale)}`}
                    >
                        ⓘ
                    </span>
                )}
                {cell.projected && (
                    <span className="bcds2-data-table__marker bcds2-data-table__marker--projected" title="Projected">
                        *
                    </span>
                )}
            </td>
        )
    }

    function renderChangeCells(entity: string, slug: string): ReactNode[] {
        const startCell = resolveCell(entity, slug, startTime)
        const endCell = resolveCell(entity, slug, endTime)
        const missingClass = "bcds2-data-table__cell bcds2-data-table__cell--numeric bcds2-data-table__cell--missing"
        if (startCell.status !== "value" || endCell.status !== "value") {
            return [
                <td key={`${slug}.change`} className={missingClass}>
                    {EM_DASH}
                </td>,
                <td key={`${slug}.relativeChange`} className={missingClass}>
                    {EM_DASH}
                </td>,
            ]
        }
        const change = formatChange(startCell.value, endCell.value, columns[slug], { locale })
        return [
            <td key={`${slug}.change`} className="bcds2-data-table__cell bcds2-data-table__cell--numeric">
                {change.absolute}
            </td>,
            <td
                key={`${slug}.relativeChange`}
                className={change.relative === null ? missingClass : "bcds2-data-table__cell bcds2-data-table__cell--numeric"}
            >
                {change.relative ?? EM_DASH}
            </td>,
        ]
    }

    function metricHeading(slug: string): ReactNode {
        const meta = columns[slug]
        const unit = meta.denominator !== undefined ? (meta.derivedUnit ?? meta.derivedShortUnit) : (meta.unit ?? meta.shortUnit)
        return (
            <span className="bcds2-data-table__metric">
                <span className="bcds2-data-table__metric-name">{meta.name}</span>
                {unit !== undefined && <span className="bcds2-data-table__metric-unit">{unit}</span>}
            </span>
        )
    }

    const entityHeading = capitalize(dataset.manifest.entity.label)

    return (
        <div className="bcds2-data-table">
            <div className="bcds2-data-table__toolbar">
                <SegmentedControl
                    className="bcds2-data-table__scope"
                    label="Table scope"
                    mode="toggle"
                    value={scope}
                    onValueChange={(value) => onScopeChange(value as DataTableScope)}
                    items={[
                        { value: "selected", label: "Selected" },
                        { value: "all", label: "All" },
                    ]}
                />
                <TextField
                    type="search"
                    className="bcds2-data-table__search"
                    label={`Search ${dataset.manifest.entity.labelPlural}`}
                    placeholder={`Search ${dataset.manifest.entity.labelPlural}`}
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>
            <div className="bcds2-data-table__scroll">
                <table className="bcds2-data-table__table">
                    <thead>
                        {isRange ? (
                            <>
                                <tr>
                                    <th rowSpan={2} scope="col" className="bcds2-data-table__header bcds2-data-table__header--entity" aria-sort={ariaSort("entity")}>
                                        {headerButton("entity", entityHeading)}
                                    </th>
                                    {slugs.map((slug) => (
                                        <th key={slug} colSpan={4} scope="colgroup" className="bcds2-data-table__header bcds2-data-table__header--metric">
                                            {metricHeading(slug)}
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    {slugs.flatMap((slug) => [
                                        <th key={`${slug}.start`} scope="col" className="bcds2-data-table__header bcds2-data-table__header--numeric" aria-sort={ariaSort(`${slug}.start`)}>
                                            {headerButton(`${slug}.start`, formatTime(rangeStart, grain, locale))}
                                        </th>,
                                        <th key={`${slug}.end`} scope="col" className="bcds2-data-table__header bcds2-data-table__header--numeric" aria-sort={ariaSort(`${slug}.end`)}>
                                            {headerButton(`${slug}.end`, formatTime(rangeEnd, grain, locale))}
                                        </th>,
                                        <th key={`${slug}.change`} scope="col" className="bcds2-data-table__header bcds2-data-table__header--numeric" aria-sort={ariaSort(`${slug}.change`)}>
                                            {headerButton(`${slug}.change`, "Change")}
                                        </th>,
                                        <th key={`${slug}.relativeChange`} scope="col" className="bcds2-data-table__header bcds2-data-table__header--numeric" aria-sort={ariaSort(`${slug}.relativeChange`)}>
                                            {headerButton(`${slug}.relativeChange`, "% change")}
                                        </th>,
                                    ])}
                                </tr>
                            </>
                        ) : (
                            <tr>
                                <th scope="col" className="bcds2-data-table__header bcds2-data-table__header--entity" aria-sort={ariaSort("entity")}>
                                    {headerButton("entity", entityHeading)}
                                </th>
                                {slugs.map((slug) => (
                                    <th key={slug} scope="col" className="bcds2-data-table__header bcds2-data-table__header--numeric" aria-sort={ariaSort(slug)}>
                                        {headerButton(
                                            slug,
                                            <span className="bcds2-data-table__metric">
                                                {metricHeading(slug)}
                                                {endTime !== null && (
                                                    <span className="bcds2-data-table__metric-time">{formatTime(endTime, grain, locale)}</span>
                                                )}
                                            </span>,
                                        )}
                                    </th>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {visibleEntities.map((entity) => (
                            <tr key={entity} className="bcds2-data-table__row">
                                <th scope="row" className="bcds2-data-table__cell bcds2-data-table__cell--entity">
                                    {entity}
                                </th>
                                {isRange
                                    ? slugs.flatMap((slug) => [
                                          renderValueCell(entity, slug, startTime, `${slug}.start`),
                                          renderValueCell(entity, slug, endTime, `${slug}.end`),
                                          ...renderChangeCells(entity, slug),
                                      ])
                                    : slugs.map((slug) => renderValueCell(entity, slug, endTime, slug))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
