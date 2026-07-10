import type { ChartDefinition } from "../types"

export interface ExplorerControlOption {
    value: string
    label: string
}

export interface ExplorerControl {
    slug: string
    label: string
    type: "dropdown" | "radio" | "toggle"
    defaultValue?: string
    options: ExplorerControlOption[]
}

export interface ExplorerView {
    choices: Record<string, string>
    definition: ChartDefinition
}

export interface ExplorerDefinition {
    slug: string
    title: string
    controls: ExplorerControl[]
    views: ExplorerView[]
}

export interface ResolvedExplorerView {
    choices: Record<string, string>
    definition: ChartDefinition
    disabledOptions: Record<string, string[]>
}

export const resolveExplorerView = (
    explorer: ExplorerDefinition,
    requestedChoices: Record<string, string> = {}
): ResolvedExplorerView => {
    const choices = normalizeChoices(explorer, requestedChoices)
    const exact = findView(explorer.views, choices)
    if (exact) {
        return {
            choices,
            definition: exact.definition,
            disabledOptions: getDisabledOptions(explorer),
        }
    }

    const fallbackChoices = { ...choices }
    for (const control of [...explorer.controls].reverse()) {
        const candidates = [
            fallbackChoices[control.slug],
            control.defaultValue,
            control.options[0]?.value,
        ].filter((value): value is string => Boolean(value))

        for (const candidate of candidates) {
            fallbackChoices[control.slug] = candidate
            const view = findView(explorer.views, fallbackChoices)
            if (view) {
                return {
                    choices: { ...fallbackChoices },
                    definition: view.definition,
                    disabledOptions: getDisabledOptions(explorer),
                }
            }
        }
    }

    const firstView = explorer.views[0]
    if (!firstView) {
        throw new Error("Explorer has no views")
    }

    return {
        choices: { ...firstView.choices },
        definition: firstView.definition,
        disabledOptions: getDisabledOptions(explorer),
    }
}

export const encodeExplorerState = (choices: Record<string, string>): string => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(choices).sort(([a], [b]) => a.localeCompare(b))) {
        params.set(key, value)
    }
    return params.toString()
}

export const decodeExplorerState = (query: string): Record<string, string> =>
    Object.fromEntries(new URLSearchParams(query.startsWith("?") ? query.slice(1) : query))

const normalizeChoices = (
    explorer: ExplorerDefinition,
    requestedChoices: Record<string, string>
): Record<string, string> => {
    const result: Record<string, string> = {}
    for (const control of explorer.controls) {
        const requested = requestedChoices[control.slug]
        const validRequested = control.options.some((option) => option.value === requested)
        result[control.slug] =
            validRequested
                ? requested
                : control.defaultValue ?? control.options[0]?.value ?? ""
    }
    return result
}

const findView = (
    views: ExplorerView[],
    choices: Record<string, string>
): ExplorerView | undefined =>
    views.find((view) =>
        Object.entries(choices).every(([key, value]) => view.choices[key] === value)
    )

const getDisabledOptions = (
    explorer: ExplorerDefinition
): Record<string, string[]> => {
    const disabled: Record<string, string[]> = {}
    for (const control of explorer.controls) {
        disabled[control.slug] = control.options
            .filter((option) => !explorer.views.some((view) => view.choices[control.slug] === option.value))
            .map((option) => option.value)
    }
    return disabled
}
