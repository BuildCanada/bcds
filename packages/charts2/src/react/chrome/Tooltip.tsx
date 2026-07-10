/**
 * Tooltip card (spec 06). Renders a precomputed TooltipModel verbatim —
 * all formatting happened upstream in the hover model — and positions
 * itself near the cursor with smart flipping so the card always stays
 * inside the chart frame. Pointer-events are disabled (CSS) so the card
 * never steals hover from the plot.
 */

import { useLayoutEffect, useRef, useState } from "react"
import type { TooltipModel, TooltipRow } from "../../core/scene/nodes.ts"

export interface TooltipBounds {
    width: number
    height: number
}

export interface TooltipSize {
    width: number
    height: number
}

export interface TooltipPlacement {
    left: number
    top: number
}

export interface TooltipProps {
    model: TooltipModel
    /** Cursor position, in the same coordinate space as `bounds`. */
    x: number
    y: number
    /** The frame the card must stay inside (usually the chart frame). */
    bounds: TooltipBounds
}

/** Gap between the cursor and the near edge of the card. */
export const TOOLTIP_CURSOR_OFFSET = 12

/**
 * Place the card beside the cursor, flipping left/above when the default
 * right/below placement would overflow `bounds`, then clamping into the
 * frame (spec 06 §3: tooltip remains within frame bounds at all corners).
 */
export function computeTooltipPlacement(x: number, y: number, cardSize: TooltipSize, bounds: TooltipBounds): TooltipPlacement {
    let left = x + TOOLTIP_CURSOR_OFFSET
    if (left + cardSize.width > bounds.width) {
        left = x - TOOLTIP_CURSOR_OFFSET - cardSize.width
    }
    let top = y + TOOLTIP_CURSOR_OFFSET
    if (top + cardSize.height > bounds.height) {
        top = y - TOOLTIP_CURSOR_OFFSET - cardSize.height
    }
    left = Math.max(0, Math.min(left, bounds.width - cardSize.width))
    top = Math.max(0, Math.min(top, bounds.height - cardSize.height))
    return { left, top }
}

function ProjectionIcon() {
    return (
        <svg className="bcds2-tooltip__footer-icon" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M0 10 L10 0 M0 5 L5 0 M5 10 L10 5" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
    )
}

function rowClassName(row: TooltipRow, total: boolean): string {
    const classes = ["bcds2-tooltip__row"]
    if (total) classes.push("bcds2-tooltip__row--total")
    if (row.emphasized) classes.push("bcds2-tooltip__row--emphasized")
    if (row.notice === "missing") classes.push("bcds2-tooltip__row--missing")
    if (row.notice === "toleranced") classes.push("bcds2-tooltip__row--toleranced")
    if (row.notice === "projected") classes.push("bcds2-tooltip__row--projected")
    return classes.join(" ")
}

function TooltipValueRow({ row, total = false }: { row: TooltipRow; total?: boolean }) {
    return (
        <div className={rowClassName(row, total)} data-series-key={row.seriesKey}>
            <span className="bcds2-tooltip__swatch" style={{ background: row.swatch }} aria-hidden="true" />
            <span className="bcds2-tooltip__label">{row.label}</span>
            <span className="bcds2-tooltip__value">{row.valueText}</span>
        </div>
    )
}

export function Tooltip({ model, x, y, bounds }: TooltipProps) {
    const cardRef = useRef<HTMLDivElement | null>(null)
    const [size, setSize] = useState<TooltipSize>({ width: 0, height: 0 })

    useLayoutEffect(() => {
        const card = cardRef.current
        if (card === null) return
        const width = card.offsetWidth
        const height = card.offsetHeight
        setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })

    const placement = computeTooltipPlacement(x, y, size, bounds)

    return (
        <div ref={cardRef} className="bcds2-tooltip" role="status" style={{ left: placement.left, top: placement.top }}>
            <div className="bcds2-tooltip__title">
                {model.title}
                {model.titleAnnotation !== undefined && (
                    <span className="bcds2-tooltip__title-annotation"> {model.titleAnnotation}</span>
                )}
            </div>
            {model.subtitle !== undefined && <div className="bcds2-tooltip__subtitle">{model.subtitle}</div>}
            {model.rows.length > 0 && (
                <div className="bcds2-tooltip__rows">
                    {model.rows.map((row, index) => (
                        // Key by index, not seriesKey: a single series can own several
                        // rows (e.g. slope/dumbbell start/end), so seriesKey is not unique
                        // and duplicate keys corrupt reconciliation (stale rows retained).
                        <TooltipValueRow key={`${row.seriesKey}-${index}`} row={row} />
                    ))}
                </div>
            )}
            {model.totalRow !== undefined && <TooltipValueRow row={model.totalRow} total />}
            {model.footers.length > 0 && (
                <div className="bcds2-tooltip__footers">
                    {model.footers.map((footer, index) => (
                        <div key={`${footer.icon}-${index}`} className={`bcds2-tooltip__footer bcds2-tooltip__footer--${footer.icon}`}>
                            {footer.icon === "projection" ? (
                                <ProjectionIcon />
                            ) : (
                                <span className="bcds2-tooltip__footer-icon" aria-hidden="true">
                                    ⓘ
                                </span>
                            )}
                            <span className="bcds2-tooltip__footer-text">{footer.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
