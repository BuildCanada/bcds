/**
 * ViewState ↔ URLSearchParams codec. Spec 02 §3.
 *
 * User state layers over the definition and round-trips through the URL so
 * any explored view is shareable. Parameter semantics follow owid-grapher's
 * (`time=2010..2024`, `time=latest`), adapted to our time encodings
 * (fiscal years: `time=2014-15..2024-25`).
 *
 * Params: tab, time, entities, focus, yScale, stackMode, facet, tableSort,
 * tableScope. Encodings:
 *   - time: one canonical raw string, or "start..end"; bounds are
 *     formatTimeOrdinalRaw under the dataset grain or "earliest"/"latest"
 *   - entities/focus: "~"-joined, each name URL-encoded individually
 *     (literal "~" in a name is escaped as %7E before joining)
 *   - tableSort: "column:asc" | "column:desc" (":" never appears in the
 *     order token, so the last ":" splits unambiguously)
 *
 * Decoding never throws: unknown values produce a warning Diagnostic and
 * the field is dropped. Unrecognized parameter NAMES are ignored silently —
 * chart params share the page URL with the host application's own params.
 */

import { formatTimeOrdinalRaw, parseTime } from "../data/time.ts"
import type { Diagnostic, SortOrder, Tab, TimeBound, TimeGrain, TimeSelection, ViewState } from "../types.ts"

const TABS = new Set(["line", "discrete-bar", "stacked-area", "stacked-bar", "stacked-discrete-bar", "table"])
const SCALES = new Set(["linear", "log"])
const STACK_MODES = new Set(["absolute", "relative"])
const FACETS = new Set(["none", "entity", "metric"])
const TABLE_SCOPES = new Set(["selected", "all"])
const SORT_ORDERS = new Set(["asc", "desc"])

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

function encodeTimeBound(bound: TimeBound, grain: TimeGrain): string {
    if (typeof bound === "number") return formatTimeOrdinalRaw(bound, grain)
    return bound
}

function encodeTimeSelection(selection: TimeSelection, grain: TimeGrain): string {
    const start = encodeTimeBound(selection.start, grain)
    const end = encodeTimeBound(selection.end, grain)
    return start === end ? start : `${start}..${end}`
}

function encodeNameList(names: readonly string[]): string {
    // encodeURIComponent leaves "~" alone (it is unreserved), so escape it
    // by hand — it is our join separator.
    return names.map((name) => encodeURIComponent(name).replaceAll("~", "%7E")).join("~")
}

/** Encode a view state as URL query parameters; only defined fields are written. */
export function viewStateToParams(state: ViewState, grain: TimeGrain): URLSearchParams {
    const params = new URLSearchParams()
    if (state.tab !== undefined) params.set("tab", state.tab)
    if (state.time !== undefined) params.set("time", encodeTimeSelection(state.time, grain))
    if (state.entities !== undefined) params.set("entities", encodeNameList(state.entities))
    if (state.focus !== undefined) params.set("focus", encodeNameList(state.focus))
    if (state.yScale !== undefined) params.set("yScale", state.yScale)
    if (state.stackMode !== undefined) params.set("stackMode", state.stackMode)
    if (state.facet !== undefined) params.set("facet", state.facet)
    if (state.tableSort !== undefined) params.set("tableSort", `${state.tableSort.column}:${state.tableSort.order}`)
    if (state.tableScope !== undefined) params.set("tableScope", state.tableScope)
    return params
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

export interface ParamsToViewStateResult {
    state: ViewState
    diagnostics: Diagnostic[]
}

function invalidParam(param: string, value: string): Diagnostic {
    return {
        severity: "warning",
        code: "invalid-url-param",
        message: `URL parameter "${param}" has unrecognized value "${value}" and was ignored`,
        context: { param, value },
    }
}

function decodeTimeBound(text: string, grain: TimeGrain): TimeBound | null {
    if (text === "earliest" || text === "latest") return text
    return parseTime(text, grain)
}

function decodeTimeSelection(text: string, grain: TimeGrain): TimeSelection | null {
    const parts = text.split("..")
    if (parts.length === 1) {
        const bound = decodeTimeBound(parts[0], grain)
        if (bound === null) return null
        return { start: bound, end: bound }
    }
    if (parts.length === 2) {
        const start = decodeTimeBound(parts[0], grain)
        const end = decodeTimeBound(parts[1], grain)
        if (start === null || end === null) return null
        return { start, end }
    }
    return null
}

function decodeNameList(value: string): string[] | null {
    if (value === "") return []
    try {
        return value.split("~").map((part) => decodeURIComponent(part))
    } catch {
        // Malformed percent-encoding — never throw, report instead.
        return null
    }
}

/**
 * Decode URL query parameters back into a view state. Unknown values yield
 * a warning Diagnostic and the field is dropped — decoding never throws.
 */
export function paramsToViewState(params: URLSearchParams, grain: TimeGrain): ParamsToViewStateResult {
    const diagnostics: Diagnostic[] = []
    const state: ViewState = {}

    const tab = params.get("tab")
    if (tab !== null) {
        if (TABS.has(tab)) state.tab = tab as Tab
        else diagnostics.push(invalidParam("tab", tab))
    }

    const time = params.get("time")
    if (time !== null) {
        const selection = decodeTimeSelection(time, grain)
        if (selection !== null) state.time = selection
        else diagnostics.push(invalidParam("time", time))
    }

    const entities = params.get("entities")
    if (entities !== null) {
        const names = decodeNameList(entities)
        if (names !== null) state.entities = names
        else diagnostics.push(invalidParam("entities", entities))
    }

    const focus = params.get("focus")
    if (focus !== null) {
        const names = decodeNameList(focus)
        if (names !== null) state.focus = names
        else diagnostics.push(invalidParam("focus", focus))
    }

    const yScale = params.get("yScale")
    if (yScale !== null) {
        if (SCALES.has(yScale)) state.yScale = yScale as ViewState["yScale"]
        else diagnostics.push(invalidParam("yScale", yScale))
    }

    const stackMode = params.get("stackMode")
    if (stackMode !== null) {
        if (STACK_MODES.has(stackMode)) state.stackMode = stackMode as ViewState["stackMode"]
        else diagnostics.push(invalidParam("stackMode", stackMode))
    }

    const facet = params.get("facet")
    if (facet !== null) {
        if (FACETS.has(facet)) state.facet = facet as ViewState["facet"]
        else diagnostics.push(invalidParam("facet", facet))
    }

    const tableSort = params.get("tableSort")
    if (tableSort !== null) {
        // The order token never contains ":", so the LAST ":" is the split
        // point even if a column slug were to contain one.
        const separator = tableSort.lastIndexOf(":")
        const column = separator > 0 ? tableSort.slice(0, separator) : ""
        const order = separator > 0 ? tableSort.slice(separator + 1) : ""
        if (column !== "" && SORT_ORDERS.has(order)) {
            state.tableSort = { column, order: order as SortOrder }
        } else {
            diagnostics.push(invalidParam("tableSort", tableSort))
        }
    }

    const tableScope = params.get("tableScope")
    if (tableScope !== null) {
        if (TABLE_SCOPES.has(tableScope)) state.tableScope = tableScope as ViewState["tableScope"]
        else diagnostics.push(invalidParam("tableScope", tableScope))
    }

    return { state, diagnostics }
}
