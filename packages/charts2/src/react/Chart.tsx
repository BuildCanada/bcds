/**
 * Chart — the interactive component: definition + dataset → SceneSVG with
 * hover/focus emphasis, tooltips (via render prop), URL state, and
 * container-driven sizing.
 *
 * Re-layout happens ONLY when definition/dataset/view/size change. Hover and
 * focus apply styling through seriesKey emphasis on the already-built scene —
 * they NEVER call layoutChart (spec 07 §3, spec 28 §1). Focus round-trips
 * through ViewState (`focus=` in the URL) but is excluded from the layout
 * inputs, so toggling it cannot invalidate the scene memo.
 */

import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import type { ReactNode } from "react"

import { layoutChart } from "../core/layout/layoutChart.ts"
import type { HitTarget, TooltipModel, Vec2 } from "../core/scene/nodes.ts"
import { getTheme } from "../core/theme/registry.ts"
import type { Theme } from "../core/theme/types.ts"
import type { ChartDefinition, Dataset, SeriesKey, ViewState } from "../core/types.ts"
import { emphasisFor, emphasisReducer, type EmphasisState } from "./interaction/emphasisReducer.ts"
import { useUrlState } from "./interaction/useUrlState.ts"
import { SceneSVG } from "./SceneSVG.tsx"

export interface RenderTooltipArgs {
    tooltip: TooltipModel
    /** Anchor position in scene coordinates, clamped inside the plot area. */
    x: number
    y: number
}

export interface ChartProps {
    definition: ChartDefinition
    dataset: Dataset
    /** Defaults to the registry lookup of definition.theme. */
    theme?: Theme
    initialView?: ViewState
    /** Sync ViewState with window.location.search (history.replaceState). */
    syncUrl?: boolean
    /** Fixed size; when omitted the container is measured (ResizeObserver). */
    width?: number
    height?: number
    /** Tooltip render prop — the chrome Tooltip component plugs in here. */
    renderTooltip?: (args: RenderTooltipArgs) => ReactNode
    /** Force an initial focus set (spec 07 §3), taking precedence over the
     *  view's `focus` and the definition's `focusedSeries`. Hover and Escape
     *  still apply on top. */
    focusedSeries?: SeriesKey[]
}

/** SSR/first-paint size before the container has been measured. */
const DEFAULT_SIZE = { width: 850, height: 600 }

function clamp(value: number, low: number, high: number): number {
    return Math.min(high, Math.max(low, value))
}

export function Chart({
    definition,
    dataset,
    theme,
    initialView,
    syncUrl = false,
    width,
    height,
    renderTooltip,
    focusedSeries,
}: ChartProps): ReactNode {
    const grain = dataset.manifest.timeGrain

    // --- View state (URL-synced when requested) ----------------------------
    const [view, setView] = useUrlState(grain, { initial: initialView, enabled: syncUrl })

    // --- Container-driven sizing (SSR-safe) ---------------------------------
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [measured, setMeasured] = useState(DEFAULT_SIZE)
    const chartWidth = width ?? measured.width
    const chartHeight = height ?? measured.height

    useEffect(() => {
        if (width !== undefined && height !== undefined) return
        const element = containerRef.current
        if (element === null) return
        const update = () => {
            const bounds = element.getBoundingClientRect()
            setMeasured((prev) => {
                const next = {
                    width: bounds.width > 0 ? bounds.width : DEFAULT_SIZE.width,
                    height: bounds.height > 0 ? bounds.height : DEFAULT_SIZE.height,
                }
                const same =
                    Math.abs(next.width - prev.width) < 1 && Math.abs(next.height - prev.height) < 1
                return same ? prev : next
            })
        }
        update()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(update)
        observer.observe(element)
        return () => observer.disconnect()
    }, [width, height])

    // --- Emphasis (hover/focus) — render-time styling, never layout ---------
    const [emphasisState, dispatch] = useReducer(
        emphasisReducer,
        null,
        (): EmphasisState => ({
            hover: null,
            focus: new Set(focusedSeries ?? view.focus ?? definition.focusedSeries ?? []),
        }),
    )

    // Persist focus into ViewState (URL `focus=`). Focus is deliberately
    // excluded from layoutView below, so this never causes a relayout.
    useEffect(() => {
        setView((prev) => {
            const keys = [...emphasisState.focus]
            const prevKeys = prev.focus ?? []
            if (keys.length === prevKeys.length && keys.every((key, i) => key === prevKeys[i])) {
                return prev
            }
            if (keys.length === 0) {
                const { focus: _focus, ...rest } = prev
                return rest
            }
            return { ...prev, focus: keys }
        })
    }, [emphasisState.focus, setView])

    // Escape clears focus (spec 07 §3).
    useEffect(() => {
        if (typeof window === "undefined") return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") dispatch({ type: "escape" })
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    // --- Layout — the ONLY place layoutChart is called ----------------------
    // Identity is stable across hover/focus: deps are the layout-relevant view
    // fields, not the view object (whose identity changes when focus is written).
    const layoutView = useMemo<ViewState>(() => {
        const { focus: _focus, ...rest } = view
        return rest
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view.tab, view.time, view.entities, view.yScale, view.stackMode, view.facet, view.tableSort, view.tableScope])

    const scene = useMemo(
        () =>
            layoutChart({
                definition,
                dataset,
                view: layoutView,
                ...(theme !== undefined ? { theme } : {}),
                size: { width: chartWidth, height: chartHeight },
            }),
        [definition, dataset, theme, layoutView, chartWidth, chartHeight],
    )

    const resolvedTheme = theme ?? getTheme(definition.theme).theme
    const idPrefix = definition.slug ?? "chart"

    // --- Tooltip ------------------------------------------------------------
    const [tooltipState, setTooltipState] = useState<RenderTooltipArgs | null>(null)

    const handleHover = (target: HitTarget, point: Vec2) => {
        if (target.kind === "series") dispatch({ type: "hover-series", key: target.seriesKey })
        const plot = scene.plotArea
        const x = clamp(target.kind === "time" ? target.x : point.x, plot.x, plot.x + plot.width)
        const y = clamp(point.y, plot.y, plot.y + plot.height)
        setTooltipState((prev) =>
            prev !== null && prev.tooltip === target.tooltip && prev.x === x && prev.y === y
                ? prev
                : { tooltip: target.tooltip, x, y },
        )
    }

    const handleLeave = () => {
        dispatch({ type: "hover-clear" })
        setTooltipState(null)
    }

    const handleActivate = (target: HitTarget) => {
        if (target.kind === "series") dispatch({ type: "toggle-focus", key: target.seriesKey })
    }

    return (
        <div
            ref={containerRef}
            style={{ position: "relative", width: width !== undefined ? `${width}px` : "100%" }}
        >
            <SceneSVG
                scene={scene}
                idPrefix={idPrefix}
                interactive
                emphasis={emphasisFor(emphasisState)}
                dimOpacity={resolvedTheme.palette.dimOpacity}
                onHover={handleHover}
                onLeave={handleLeave}
                onActivate={handleActivate}
            />
            {tooltipState !== null && renderTooltip !== undefined ? (
                <div
                    style={{
                        position: "absolute",
                        left: `${tooltipState.x}px`,
                        top: `${tooltipState.y}px`,
                        pointerEvents: "none",
                    }}
                >
                    {renderTooltip(tooltipState)}
                </div>
            ) : null}
        </div>
    )
}
