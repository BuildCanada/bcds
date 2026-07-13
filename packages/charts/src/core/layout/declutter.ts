/**
 * End-of-line series label decluttering — port of owid-grapher
 * verticalLabels/VerticalLabelsState.ts placement (candidate at the series'
 * final y, vertical group-merge nudging) and a simplified filter pass
 * (VerticalLabelsFilterAlgorithms): when the labels can't all fit in the
 * available height, the lowest-priority candidates (smallest final value)
 * are dropped — the caller falls back to a legend.
 *
 * Deterministic: ties resolve by input order; no randomness.
 */

import type { SeriesKey } from "../types.ts"

export const LABEL_SPACING = 4

export interface LabelCandidate {
    seriesKey: SeriesKey
    text: string
    /** Ideal vertical center (the series' final point y). */
    targetY: number
    /** Importance: larger keeps the label longer (the series' final value). */
    priority: number
    width: number
    height: number
}

export interface PlacedLabel {
    seriesKey: SeriesKey
    text: string
    /** Top of the label box after collision resolution. */
    y: number
    targetY: number
    width: number
    height: number
}

export interface DeclutterResult {
    placed: PlacedLabel[]
    /** Series whose labels did not fit — legend fallback signal. */
    dropped: SeriesKey[]
}

interface Group {
    labels: PlacedLabel[]
}

function groupTop(group: Group): number {
    return group.labels[0].y
}

function groupBottom(group: Group): number {
    const last = group.labels[group.labels.length - 1]
    return last.y + last.height
}

function stackGroup(group: Group, y: number): void {
    let currentY = y
    for (const label of group.labels) {
        label.y = currentY
        currentY += label.height + LABEL_SPACING
    }
}

function totalHeight(labels: readonly { height: number }[]): number {
    if (labels.length === 0) return 0
    return labels.reduce((sum, l) => sum + l.height, 0) + (labels.length - 1) * LABEL_SPACING
}

/**
 * Place labels in [y0, y1] without overlaps.
 *
 * 1. Filter: drop lowest-priority candidates until the total stacked height
 *    fits the available space.
 * 2. Place: start each label centred on its targetY (clamped into range),
 *    then iteratively merge overlapping neighbour groups, positioning each
 *    merged group at the size-weighted compromise of its members and
 *    re-stacking with even spacing (OWID's group-merge loop).
 */
export function declutterLabels(candidates: readonly LabelCandidate[], y0: number, y1: number): DeclutterResult {
    const available = Math.max(0, y1 - y0)

    // --- Filter pass: keep highest-priority labels that fit -----------------
    const indexed = candidates.map((candidate, index) => ({ candidate, index }))
    const byPriority = [...indexed].sort(
        (a, b) => b.candidate.priority - a.candidate.priority || a.index - b.index,
    )
    const keep: typeof indexed = []
    const dropped: SeriesKey[] = []
    let usedHeight = 0
    for (const entry of byPriority) {
        const padding = keep.length === 0 ? 0 : LABEL_SPACING
        const next = usedHeight + padding + entry.candidate.height
        if (next <= available) {
            keep.push(entry)
            usedHeight = next
        } else {
            dropped.push(entry.candidate.seriesKey)
        }
    }
    // Report drops in input order for determinism.
    dropped.sort(
        (a, b) =>
            indexed.findIndex((e) => e.candidate.seriesKey === a) -
            indexed.findIndex((e) => e.candidate.seriesKey === b),
    )

    // --- Placement pass -----------------------------------------------------
    const sorted = [...keep].sort((a, b) => a.candidate.targetY - b.candidate.targetY || a.index - b.index)
    const groups: Group[] = sorted.map(({ candidate }) => {
        const clampedY = Math.min(Math.max(candidate.targetY - candidate.height / 2, y0), Math.max(y0, y1 - candidate.height))
        return {
            labels: [
                {
                    seriesKey: candidate.seriesKey,
                    text: candidate.text,
                    y: clampedY,
                    targetY: candidate.targetY,
                    width: candidate.width,
                    height: candidate.height,
                },
            ],
        }
    })

    let hasOverlap = true
    while (hasOverlap && groups.length > 1) {
        hasOverlap = false
        for (let i = 0; i < groups.length - 1; i++) {
            const top = groups[i]
            const bottom = groups[i + 1]
            if (groupBottom(top) + LABEL_SPACING > groupTop(bottom)) {
                const overlapHeight = groupBottom(top) - groupTop(bottom) + LABEL_SPACING
                const topHeight = groupBottom(top) - groupTop(top)
                const bottomHeight = groupBottom(bottom) - groupTop(bottom)
                const newHeight = topHeight + LABEL_SPACING + bottomHeight
                const targetY =
                    groupTop(top) -
                    overlapHeight * (bottom.labels.length / (top.labels.length + bottom.labels.length))
                const overflowTop = Math.max(y0 - targetY, 0)
                const overflowBottom = Math.max(targetY + newHeight - y1, 0)
                const newY = targetY + overflowTop - overflowBottom
                const merged: Group = { labels: [...top.labels, ...bottom.labels] }
                stackGroup(merged, newY)
                groups.splice(i, 2, merged)
                hasOverlap = true
                break
            }
        }
    }

    const placed = groups.flatMap((group) => group.labels)
    // Final safety clamp: when the kept labels exactly fill the range the
    // merge maths can leave sub-pixel overflow at the edges.
    if (placed.length > 0) {
        const height = totalHeight(placed)
        if (height <= y1 - y0) {
            const first = placed[0]
            if (first.y < y0) {
                const shift = y0 - first.y
                for (const label of placed) label.y += shift
            }
            const last = placed[placed.length - 1]
            const overflow = last.y + last.height - y1
            if (overflow > 0) {
                for (const label of placed) label.y -= overflow
            }
        }
    }

    return { placed, dropped }
}
