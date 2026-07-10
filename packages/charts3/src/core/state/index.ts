import { getEntities, getTimesForDataset, resolveNumericValue } from "../data"
import { chooseDefaultType, getYColumns } from "../definition"
import { isRangeSelection, resolveTimeSelection } from "../time"
import type { ChartDataset, ChartDefinition, ChartViewState, TimeSelection } from "../types"

export const createDefaultViewState = (
    definition: ChartDefinition,
    dataset: ChartDataset,
    overrides: Partial<ChartViewState> = {}
): ChartViewState => {
    const times = getTimesForDataset(dataset)
    const defaultTime: TimeSelection =
        dataset.manifest.timeGrain === "none" ? "latest" : ["earliest", "latest"]
    const time = resolveTimeSelection(definition.time ?? defaultTime, times)
    const hasRange = isRangeSelection(time) && time[0] !== time[1]

    return {
        tab: chooseDefaultType(definition, hasRange),
        time,
        selectedEntities:
            definition.selectedEntities ??
            chooseDefaultEntities(definition, dataset, time),
        focusedSeries: definition.focusedSeries,
        stackMode: definition.stackMode ?? "absolute",
        locale: "en",
        theme: definition.theme ?? "build-canada",
        ...overrides,
    }
}

export const chooseDefaultEntities = (
    definition: ChartDefinition,
    dataset: ChartDataset,
    time: TimeSelection
): string[] => {
    const yColumn = getYColumns(definition)[0]
    const entities = getEntities(dataset).filter((entity) => {
        if (definition.includedEntities && !definition.includedEntities.includes(entity)) return false
        if (definition.excludedEntities?.includes(entity)) return false
        return true
    })

    const currentTime = Array.isArray(time) ? time[1] : time
    const ranked = entities
        .map((entity) => ({
            entity,
            value: resolveNumericValue(
                dataset,
                entity,
                yColumn,
                typeof currentTime === "string" || typeof currentTime === "number"
                    ? currentTime
                    : undefined
            ).value,
        }))
        .sort((a, b) => {
            if (a.value === null && b.value === null) return a.entity.localeCompare(b.entity)
            if (a.value === null) return 1
            if (b.value === null) return -1
            return b.value - a.value
        })

    return ranked.slice(0, 8).map((item) => item.entity)
}

export const encodeViewState = (state: ChartViewState): string => {
    const time = Array.isArray(state.time) ? `${state.time[0]}..${state.time[1]}` : String(state.time)
    const params = new URLSearchParams()
    params.set("tab", state.tab)
    params.set("time", time)
    params.set("entities", state.selectedEntities.join("~"))
    if (state.focusedSeries) params.set("focus", state.focusedSeries)
    if (state.stackMode !== "absolute") params.set("stackMode", state.stackMode)
    if (state.locale !== "en") params.set("locale", state.locale)
    if (state.theme !== "build-canada") params.set("theme", state.theme)
    return params.toString()
}

export const decodeViewState = (query: string): Partial<ChartViewState> => {
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query)
    const timeParam = params.get("time")

    return {
        tab: (params.get("tab") as ChartViewState["tab"] | null) ?? undefined,
        time: timeParam?.includes("..")
            ? (timeParam.split("..") as [string, string])
            : timeParam ?? undefined,
        selectedEntities: params.get("entities")?.split("~").filter(Boolean),
        focusedSeries: params.get("focus") ?? undefined,
        stackMode: (params.get("stackMode") as ChartViewState["stackMode"] | null) ?? undefined,
        locale: (params.get("locale") as ChartViewState["locale"] | null) ?? undefined,
        theme: params.get("theme") ?? undefined,
    }
}
