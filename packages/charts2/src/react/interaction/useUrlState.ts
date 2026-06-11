/**
 * useUrlState — ViewState ↔ window.location.search (spec 02 §3).
 *
 * Reads once on mount via paramsToViewState (which ignores unknown values
 * with diagnostics and unknown names silently), writes via a debounced
 * history.replaceState. Params the codec does not own are preserved on
 * write — chart params share the page URL with the host application.
 * SSR-safe: no window access during render beyond a typeof guard.
 */

import { useEffect, useRef, useState } from "react"

import { paramsToViewState, viewStateToParams } from "../../core/definition/urlState.ts"
import type { TimeGrain, ViewState } from "../../core/types.ts"

/** Param names written by viewStateToParams; cleared before each write. */
const OWNED_PARAMS = [
    "tab",
    "time",
    "entities",
    "focus",
    "yScale",
    "stackMode",
    "facet",
    "tableSort",
    "tableScope",
] as const

const WRITE_DEBOUNCE_MS = 150

export type SetViewState = (next: ViewState | ((prev: ViewState) => ViewState)) => void

export interface UseUrlStateOptions {
    /** Base state; URL params layer on top of it at mount. */
    initial?: ViewState
    /** When false, behaves as plain local state (no URL reads or writes). */
    enabled?: boolean
}

export function useUrlState(grain: TimeGrain, options: UseUrlStateOptions = {}): [ViewState, SetViewState] {
    const enabled = options.enabled ?? true

    const [state, setState] = useState<ViewState>(() => {
        const initial = options.initial ?? {}
        if (!enabled || typeof window === "undefined") return initial
        const { state: fromUrl } = paramsToViewState(new URLSearchParams(window.location.search), grain)
        return { ...initial, ...fromUrl }
    })

    const mounted = useRef(false)
    useEffect(() => {
        if (!enabled || typeof window === "undefined") return
        if (!mounted.current) {
            // The first state came FROM the URL — writing it back would be a no-op
            // at best and would clobber host params present before hydration.
            mounted.current = true
            return
        }
        const timer = window.setTimeout(() => {
            const params = new URLSearchParams(window.location.search)
            for (const name of OWNED_PARAMS) params.delete(name)
            for (const [name, value] of viewStateToParams(state, grain)) params.set(name, value)
            const query = params.toString()
            const url = `${window.location.pathname}${query === "" ? "" : `?${query}`}${window.location.hash}`
            window.history.replaceState(window.history.state, "", url)
        }, WRITE_DEBOUNCE_MS)
        return () => window.clearTimeout(timer)
    }, [state, grain, enabled])

    return [state, setState]
}
