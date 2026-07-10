import { describe, expect, it } from "vitest"

import { declutterLabels, LABEL_SPACING, type LabelCandidate } from "./declutter.ts"

function candidate(key: string, targetY: number, priority: number, height = 14, width = 60): LabelCandidate {
    return { seriesKey: key, text: key, targetY, priority, width, height }
}

function assertNoOverlap(placed: { y: number; height: number }[]): void {
    const sorted = [...placed].sort((a, b) => a.y - b.y)
    for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].y + 0.001).toBeGreaterThanOrEqual(sorted[i - 1].y + sorted[i - 1].height)
    }
}

describe("declutterLabels", () => {
    it("keeps non-colliding labels at their target positions", () => {
        const { placed, dropped } = declutterLabels(
            [candidate("a", 50, 1), candidate("b", 200, 2), candidate("c", 350, 3)],
            0,
            400,
        )
        expect(dropped).toEqual([])
        expect(placed.map((p) => p.y)).toEqual([43, 193, 343])
    })

    it("nudges eight colliding labels apart with no overlaps, all inside the range", () => {
        const candidates = Array.from({ length: 8 }, (_, i) => candidate(`s${i}`, 100 + i * 0.5, i + 1))
        const { placed, dropped } = declutterLabels(candidates, 0, 400)
        expect(dropped).toEqual([])
        expect(placed.length).toBe(8)
        assertNoOverlap(placed)
        for (const label of placed) {
            expect(label.y).toBeGreaterThanOrEqual(0)
            expect(label.y + label.height).toBeLessThanOrEqual(400)
        }
    })

    it("drops the lowest-priority (smallest final value) labels when space runs out", () => {
        // Range fits only 3 labels of height 14 (+ spacing).
        const available = 3 * 14 + 2 * LABEL_SPACING
        const candidates = [
            candidate("small", 10, 1),
            candidate("mid", 20, 5),
            candidate("big", 30, 10),
            candidate("bigger", 40, 20),
            candidate("tiny", 50, 0.5),
        ]
        const { placed, dropped } = declutterLabels(candidates, 0, available)
        expect(placed.map((p) => p.seriesKey).sort()).toEqual(["big", "bigger", "mid"])
        expect(dropped).toEqual(["small", "tiny"])
        assertNoOverlap(placed)
    })

    it("is deterministic", () => {
        const candidates = Array.from({ length: 10 }, (_, i) => candidate(`s${i}`, 120, 10 - i))
        const first = declutterLabels(candidates, 0, 300)
        const second = declutterLabels(candidates, 0, 300)
        expect(second).toEqual(first)
    })

    it("clamps single labels into the range", () => {
        const { placed } = declutterLabels([candidate("edge", 0, 1)], 0, 100)
        expect(placed[0].y).toBe(0)
        const bottom = declutterLabels([candidate("edge", 100, 1)], 0, 100)
        expect(bottom.placed[0].y + bottom.placed[0].height).toBeLessThanOrEqual(100)
    })
})
