/**
 * LayoutContext — the resolved inputs every layout stage consumes.
 *
 * buildContext merges the reader's ViewState over the definition's defaults
 * (view.time ?? definition.time, view.entities ?? resolved selection, …),
 * resolves grain-encoded time bounds, merges column bindings, and snaps the
 * time window to times present in the data (spec 08 §1). Pure: no I/O, no
 * mutation of inputs.
 */

import { snapToAvailable } from "../data/time.ts"
import { resolveBindings, resolveSelection } from "../definition/resolve.ts"
import { resolveDefinitionTimes } from "../definition/schema.ts"
import type { TextMeasurer } from "../text/measurer.ts"
import type { Theme } from "../theme/types.ts"
import type {
    ChartDefinition,
    ColumnMeta,
    Dataset,
    Diagnostic,
    Locale,
    ScaleType,
    StackMode,
    TimeBound,
    TimeGrain,
    TimeOrdinal,
    ViewState,
} from "../types.ts"

export interface TimeWindow {
    start: TimeOrdinal
    end: TimeOrdinal
}

export interface LayoutContext {
    /** Definition with grain-encoded time bounds resolved to ordinals. */
    definition: ChartDefinition
    dataset: Dataset
    view: ViewState
    theme: Theme
    locale: Locale
    measurer: TextMeasurer
    /** Manifest column meta with per-binding overrides applied, by slug. */
    columns: Record<string, ColumnMeta>
    /** Effective entity selection (view.entities over the resolved default). */
    entities: string[]
    /** Dataset times filtered to the selected window (empty for grain "none"). */
    times: TimeOrdinal[]
    /** Snapped selection window; null for grain "none" or an empty dataset. */
    window: TimeWindow | null
    grain: TimeGrain
    /** Effective stack/relative mode (view over definition). */
    stackMode: StackMode
    /** Effective y scale (view over definition yAxis config). */
    scaleType: ScaleType
    /** True when the window is a single time (drives line↔bar collapse). */
    collapsed: boolean
    diagnostics: Diagnostic[]
}

export interface BuildContextArgs {
    definition: ChartDefinition
    dataset: Dataset
    view?: ViewState
    theme: Theme
    measurer: TextMeasurer
}

function resolveBound(bound: TimeBound, times: readonly TimeOrdinal[]): TimeOrdinal | null {
    if (times.length === 0) return null
    if (bound === "earliest") return times[0]
    if (bound === "latest") return times[times.length - 1]
    if (typeof bound === "number") return snapToAvailable(bound, times)
    return null
}

export function buildContext({ definition, dataset, view = {}, theme, measurer }: BuildContextArgs): LayoutContext {
    const diagnostics: Diagnostic[] = []
    const grain = dataset.manifest.timeGrain

    const resolvedTimes = resolveDefinitionTimes(definition, grain)
    diagnostics.push(...resolvedTimes.diagnostics)
    const def = resolvedTimes.definition

    const bindings = resolveBindings(def, dataset.manifest)
    diagnostics.push(...bindings.diagnostics)

    let entities: string[]
    if (view.entities !== undefined) {
        const known = new Set(dataset.entities)
        entities = view.entities.filter((name) => known.has(name))
    } else {
        const selection = resolveSelection(def, dataset)
        diagnostics.push(...selection.diagnostics)
        entities = selection.entities
    }

    let window: TimeWindow | null = null
    let times: TimeOrdinal[] = []
    if (grain !== "none" && dataset.times.length > 0) {
        const selection = view.time ?? def.time ?? { start: "earliest" as const, end: "latest" as const }
        let start = resolveBound(selection.start, dataset.times)
        let end = resolveBound(selection.end, dataset.times)
        if (start !== null && end !== null) {
            if (start > end) {
                const swap = start
                start = end
                end = swap
            }
            window = { start, end }
            const lo = start
            const hi = end
            times = dataset.times.filter((t) => t >= lo && t <= hi)
        }
    }

    const collapsed = grain === "none" || window === null || window.start === window.end

    return {
        definition: def,
        dataset,
        view,
        theme,
        locale: def.locale ?? theme.localeDefault,
        measurer,
        columns: bindings.columns,
        entities,
        times,
        window,
        grain,
        stackMode: view.stackMode ?? def.stackMode,
        scaleType: view.yScale ?? def.yAxis?.scale ?? "linear",
        collapsed,
        diagnostics,
    }
}
