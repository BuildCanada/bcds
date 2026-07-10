/**
 * Categorical legend layout (spec 05).
 *
 * Horizontal rows of swatch + label above the plot, wrapping as needed;
 * order matches series order (which matches stacking/sort order). Greyed
 * items (zero-throughout stacked bands) render with the noData swatch and
 * dimmed labels. Legend nodes carry seriesKey so hover emphasis works
 * through the same model as the marks.
 */

import type { LegendItem, SceneNode } from "../scene/nodes.ts"
import type { FontSpec, TextMeasurer } from "../text/measurer.ts"
import { truncateWithEllipsis } from "../text/truncate.ts"
import type { Theme } from "../theme/types.ts"
import type { SeriesKey } from "../types.ts"

const SWATCH_SIZE = 10
const SWATCH_GAP = 6
const ITEM_GAP = 20
const ROW_GAP = 6
const BOTTOM_GAP = 8

export interface LegendLayoutInput {
    items: readonly LegendItem[]
    x: number
    y: number
    width: number
    theme: Theme
    measurer: TextMeasurer
    font: FontSpec
    greyedKeys?: readonly SeriesKey[]
}

export interface LegendLayout {
    nodes: SceneNode[]
    items: LegendItem[]
    /** Total height consumed, including the gap below the legend. */
    height: number
}

export function layoutLegend(input: LegendLayoutInput): LegendLayout {
    const { items, x, y, width, theme, measurer, font, greyedKeys = [] } = input
    if (items.length === 0) return { nodes: [], items: [], height: 0 }

    const greyed = new Set(greyedKeys)
    const rowHeight = Math.max(font.sizePx * 1.2, SWATCH_SIZE + 2)
    const nodes: SceneNode[] = []

    let cursorX = x
    let cursorY = y
    for (const item of items) {
        const maxLabelWidth = Math.max(20, width - SWATCH_SIZE - SWATCH_GAP)
        const label = truncateWithEllipsis(item.label, font, maxLabelWidth, measurer)
        const metrics = measurer.measure(label, font)
        const itemWidth = SWATCH_SIZE + SWATCH_GAP + metrics.width

        if (cursorX + itemWidth > x + width && cursorX > x) {
            cursorX = x
            cursorY += rowHeight + ROW_GAP
        }

        const centerY = cursorY + rowHeight / 2
        const isGreyed = greyed.has(item.seriesKey)
        nodes.push({
            key: `legend/${item.seriesKey}/swatch`,
            seriesKey: item.seriesKey,
            role: "label",
            kind: "rect",
            rect: { x: cursorX, y: centerY - SWATCH_SIZE / 2, width: SWATCH_SIZE, height: SWATCH_SIZE },
            style: { fill: isGreyed ? theme.palette.noData : item.swatch },
        })
        nodes.push({
            key: `legend/${item.seriesKey}/label`,
            seriesKey: item.seriesKey,
            role: "label",
            kind: "text",
            position: {
                x: cursorX + SWATCH_SIZE + SWATCH_GAP,
                y: centerY + (metrics.ascent - metrics.descent) / 2,
            },
            text: label,
            font,
            anchor: "start",
            colour: theme.chrome.tickLabel,
            measured: metrics,
            ...(isGreyed ? { opacity: 0.6 } : {}),
        })

        cursorX += itemWidth + ITEM_GAP
    }

    return {
        nodes,
        items: [...items],
        height: cursorY + rowHeight + BOTTOM_GAP - y,
    }
}
