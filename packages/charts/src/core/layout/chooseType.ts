/**
 * Active chart type resolution (spec 08 §1).
 *
 * A multi-type definition behaves like OWID's [LineChart, DiscreteBar] pair:
 * the range form when the window spans time, the single-time form when the
 * window collapses to start === end — and back when it expands. The same
 * collapse pairs stacked-area with stacked-discrete-bar.
 */

import type { ChartType, Tab, ViewState } from "../types.ts"

/** range form → single-time form when the window collapses. */
const COLLAPSE_PAIR: Partial<Record<ChartType, ChartType>> = {
    line: "discrete-bar",
    "stacked-area": "stacked-discrete-bar",
}

/** single-time form → range form when the window expands. */
const EXPAND_PAIR: Partial<Record<ChartType, ChartType>> = {
    "discrete-bar": "line",
    "stacked-discrete-bar": "stacked-area",
}

function isChartType(tab: Tab | undefined): tab is ChartType {
    return tab !== undefined && tab !== "table"
}

/**
 * Pick the chart type to lay out, honouring the reader's tab, the author's
 * defaultTab, and the line↔bar collapse at start === end.
 */
export function activeChartType(
    types: readonly ChartType[],
    view: ViewState | undefined,
    collapsed: boolean,
    defaultTab?: Tab,
): ChartType {
    let requested: ChartType =
        isChartType(view?.tab) && types.includes(view.tab)
            ? view.tab
            : isChartType(defaultTab) && types.includes(defaultTab)
              ? defaultTab
              : types[0]

    if (collapsed) {
        const partner = COLLAPSE_PAIR[requested]
        if (partner !== undefined && types.includes(partner)) requested = partner
    } else {
        const partner = EXPAND_PAIR[requested]
        if (partner !== undefined && types.includes(partner)) requested = partner
    }
    return requested
}
