/**
 * Comparison (reference) lines — spec 02 §2, spec 18.
 *
 * Straight annotation lines drawn over a cartesian plot: a horizontal rule at
 * a fixed y value and/or a vertical rule at a fixed x (time ordinal), each
 * with an optional label. Rendered for charts with a continuous value axis
 * and a continuous time axis (line, stacked area). A line whose target falls
 * outside the current plot range is skipped rather than clamped, so a
 * reference the reader has scrolled past simply disappears.
 */

import type { Rect, SceneNode } from "../../scene/nodes.ts"
import type { TextMeasurer } from "../../text/measurer.ts"
import type { Theme } from "../../theme/types.ts"
import type { ComparisonLine } from "../../types.ts"
import type { ValueScale } from "../scales.ts"
import { footerFont, textNode } from "./shared.ts"

const LINE_DASH = [6, 4]
const LABEL_PAD = 4

export interface ComparisonLineInput {
    lines: readonly ComparisonLine[]
    plotArea: Rect
    /** value → pixel on the vertical (value) axis. */
    yScale: ValueScale
    /** time/x → pixel on the horizontal axis. */
    xScale: ValueScale
    theme: Theme
    measurer: TextMeasurer
    fontScale: number
}

/** Inclusive membership with a half-pixel slack so an on-edge target counts. */
function within(value: number, a: number, b: number): boolean {
    return value >= Math.min(a, b) - 0.5 && value <= Math.max(a, b) + 0.5
}

export function comparisonLineNodes(input: ComparisonLineInput): SceneNode[] {
    const { lines, plotArea, yScale, xScale, theme, measurer, fontScale } = input
    const nodes: SceneNode[] = []
    const font = footerFont(fontScale)
    const stroke = { stroke: theme.chrome.axisLine, strokeWidth: 1, dash: [...LINE_DASH], opacity: 0.75 }
    const left = plotArea.x
    const right = plotArea.x + plotArea.width
    const top = plotArea.y
    const bottom = plotArea.y + plotArea.height

    lines.forEach((line, index) => {
        if (line.y !== undefined) {
            const py = yScale.place(line.y)
            if (Number.isFinite(py) && within(py, top, bottom)) {
                nodes.push({
                    key: `annotation/comparison/${index}/h`,
                    role: "annotation",
                    kind: "rule",
                    from: { x: left, y: py },
                    to: { x: right, y: py },
                    style: { ...stroke },
                })
                if (line.label !== undefined && line.label !== "") {
                    const metrics = measurer.measure(line.label, font)
                    nodes.push(
                        textNode({
                            key: `annotation/comparison/${index}/h-label`,
                            role: "annotation",
                            text: line.label,
                            font,
                            anchor: "start",
                            x: left + LABEL_PAD,
                            baselineY: Math.max(py - LABEL_PAD, top + metrics.ascent),
                            colour: theme.chrome.subtitle,
                            measurer,
                        }),
                    )
                }
            }
        }
        if (line.x !== undefined) {
            const px = xScale.place(line.x)
            if (Number.isFinite(px) && within(px, left, right)) {
                nodes.push({
                    key: `annotation/comparison/${index}/v`,
                    role: "annotation",
                    kind: "rule",
                    from: { x: px, y: top },
                    to: { x: px, y: bottom },
                    style: { ...stroke },
                })
                if (line.label !== undefined && line.label !== "") {
                    const metrics = measurer.measure(line.label, font)
                    const anchorEnd = px + LABEL_PAD + metrics.width > right
                    nodes.push(
                        textNode({
                            key: `annotation/comparison/${index}/v-label`,
                            role: "annotation",
                            text: line.label,
                            font,
                            anchor: anchorEnd ? "end" : "start",
                            x: anchorEnd ? px - LABEL_PAD : px + LABEL_PAD,
                            baselineY: top + metrics.ascent + LABEL_PAD,
                            colour: theme.chrome.subtitle,
                            measurer,
                        }),
                    )
                }
            }
        }
    })

    return nodes
}
