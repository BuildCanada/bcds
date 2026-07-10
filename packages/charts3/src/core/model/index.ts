import { getEntities, getTimesForDataset, resolveNumericValue } from "../data"
import { getYColumns, normalizeDefinition } from "../definition"
import { formatValue } from "../format"
import { createDefaultViewState } from "../state"
import { assignSeriesColours, resolveTheme } from "../theme"
import { compareTimes, isRangeSelection, resolveTimeSelection, selectionLabel } from "../time"
import type {
    ChartDataset,
    ChartDefinition,
    ChartModel,
    ChartType,
    ChartViewState,
    RenderSize,
    ResolvedDatum,
    SeriesModel,
    TableModel,
    TimeValue,
} from "../types"

export interface CreateChartModelOptions {
    state?: Partial<ChartViewState>
    size?: Partial<RenderSize>
}

export const createChartModel = (
    definitionInput: ChartDefinition,
    dataset: ChartDataset,
    options: CreateChartModelOptions = {}
): ChartModel => {
    const definition = normalizeDefinition(definitionInput)
    const size = {
        width: options.size?.width ?? 850,
        height: options.size?.height ?? 600,
    }
    const state = createDefaultViewState(definition, dataset, options.state)
    const theme = resolveTheme(state.theme)
    const yColumns = getYColumns(definition)
    const activeType = state.tab === "table" ? "table" : (state.tab as ChartType)
    const series = buildSeries(definition, dataset, state, activeType, theme.categoricalPalette)
    const table = buildTable(dataset, state, yColumns)
    const title = buildTitle(definition.title, dataset, state)
    const sourceText =
        definition.sourceText ??
        dataset.manifest.sources?.map((source) => source.name).join("; ") ??
        undefined

    return {
        definition,
        dataset,
        state,
        theme,
        size,
        activeType,
        yColumns,
        title,
        subtitle: definition.subtitle,
        note: definition.note,
        sourceText,
        series,
        table,
        warnings: [],
    }
}

export const getNumericExtent = (model: ChartModel): [number, number] => {
    const values = model.series.flatMap((series) =>
        series.points.flatMap((point) => (point.value === null ? [] : [point.value]))
    )
    const min = values.length ? Math.min(...values) : undefined
    const max = values.length ? Math.max(...values) : undefined
    if (min === undefined || max === undefined) return [0, 1]
    if (min === max) return [Math.min(0, min), max + 1]
    return [Math.min(0, min), max]
}

const buildSeries = (
    definition: ChartDefinition,
    dataset: ChartDataset,
    state: ChartViewState,
    activeType: ChartType | "table",
    palette: string[]
): SeriesModel[] => {
    const yColumns = getYColumns(definition)
    const selectedEntities = state.selectedEntities.length ? state.selectedEntities : getEntities(dataset)
    const times = resolveTimesForType(dataset, state, activeType)
    const metricSeries =
        yColumns.length > 1 &&
        (selectedEntities.length === 1 ||
            [
                "stacked-area",
                "stacked-bar",
                "stacked-discrete-bar",
                "waterfall",
                "dumbbell",
                "bullet",
            ].includes(activeType))
    const ids = metricSeries ? yColumns : selectedEntities
    const fixedColours = buildFixedColourMap(definition, dataset, ids, metricSeries)
    const colours = assignSeriesColours(ids, { categoricalPalette: palette }, fixedColours)

    return ids.map((id) => {
        const metric = metricSeries ? id : yColumns[0]
        const entity = metricSeries ? selectedEntities[0] : id
        const column = dataset.manifest.columns[metric]
        const label = metricSeries ? column.name ?? metric : entity
        const points = times.map((time) => resolvePoint(dataset, entity, metric, time))

        return {
            id,
            label,
            colour: colours[id],
            points,
        }
    })
}

const resolveTimesForType = (
    dataset: ChartDataset,
    state: ChartViewState,
    activeType: ChartType | "table"
): (TimeValue | undefined)[] => {
    if (dataset.manifest.timeGrain === "none") return [undefined]
    const allTimes = getTimesForDataset(dataset)
    const selection = resolveTimeSelection(state.time, allTimes)

    if ((activeType === "line" || activeType === "stacked-area" || activeType === "stacked-bar") && isRangeSelection(selection)) {
        const [start, end] = selection
        return allTimes.filter(
            (time) =>
                compareTimes(time, start as TimeValue, dataset.manifest) >= 0 &&
                compareTimes(time, end as TimeValue, dataset.manifest) <= 0
        )
    }

    if ((activeType === "slope" || activeType === "dumbbell") && isRangeSelection(selection)) {
        return [selection[0] as TimeValue, selection[1] as TimeValue]
    }

    const selected = isRangeSelection(selection) ? selection[1] : selection
    return [selected as TimeValue]
}

const resolvePoint = (
    dataset: ChartDataset,
    entity: string,
    metric: string,
    time?: TimeValue
): ResolvedDatum => {
    const metadata = dataset.manifest.columns[metric]
    const resolved = resolveNumericValue(dataset, entity, metric, time)
    const projected =
        metadata.projection ||
        (metadata.projectionFrom !== undefined &&
            time !== undefined &&
            compareTimes(time, metadata.projectionFrom, dataset.manifest) > 0)

    return {
        entity,
        time,
        value: resolved.value,
        metric,
        originalValue: resolved.originalValue,
        denominatorValue: resolved.denominatorValue,
        toleranced: resolved.toleranced,
        projected,
    }
}

const buildTable = (
    dataset: ChartDataset,
    state: ChartViewState,
    yColumns: string[]
): TableModel => {
    const selectedEntities = state.selectedEntities.length ? state.selectedEntities : getEntities(dataset)
    const times =
        dataset.manifest.timeGrain === "none"
            ? [undefined]
            : getTimesForDataset(dataset).filter((time) => isTimeInSelection(time, dataset, state))

    const rows = selectedEntities.flatMap((entity) =>
        times.flatMap((time) =>
            yColumns.map((metric) => {
                const metadata = dataset.manifest.columns[metric]
                const value = resolveNumericValue(dataset, entity, metric, time).value
                return {
                    entity,
                    time,
                    metric,
                    value,
                    formatted: formatValue(value, metadata, state.locale),
                }
            })
        )
    )

    return {
        columns: ["entity", "time", ...yColumns],
        rows,
    }
}

const isTimeInSelection = (
    time: TimeValue,
    dataset: ChartDataset,
    state: ChartViewState
): boolean => {
    const selection = resolveTimeSelection(state.time, getTimesForDataset(dataset))
    if (!isRangeSelection(selection)) return time === selection
    return (
        compareTimes(time, selection[0] as TimeValue, dataset.manifest) >= 0 &&
        compareTimes(time, selection[1] as TimeValue, dataset.manifest) <= 0
    )
}

const buildTitle = (
    title: string,
    dataset: ChartDataset,
    state: ChartViewState
): string => {
    if (dataset.manifest.timeGrain === "none") return title
    const times = getTimesForDataset(dataset)
    const selection = resolveTimeSelection(state.time, times)
    const label = selectionLabel(selection, dataset.manifest.timeGrain)
    return label ? `${title}, ${label}` : title
}

const buildFixedColourMap = (
    definition: ChartDefinition,
    dataset: ChartDataset,
    ids: string[],
    metricSeries: boolean
): Record<string, string | undefined> => {
    const result: Record<string, string | undefined> = {}
    const entityColours = new Map(
        dataset.manifest.entities?.map((entity) => [entity.name, entity.colour]) ?? []
    )

    for (const id of ids) {
        result[id] = metricSeries
            ? dataset.manifest.columns[id]?.colour ?? undefined
            : definition.entityColours?.[id] ?? entityColours.get(id)
    }

    return result
}
