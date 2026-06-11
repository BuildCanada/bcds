import { describe, expect, it } from "vitest"
import { Bounds } from "./bounds.ts"

describe("Bounds", () => {
    const b = new Bounds(10, 20, 100, 50)

    it("derives edges and centers", () => {
        expect(b.left).toBe(10)
        expect(b.top).toBe(20)
        expect(b.right).toBe(110)
        expect(b.bottom).toBe(70)
        expect(b.centerX).toBe(60)
        expect(b.centerY).toBe(45)
        expect(b.area).toBe(5000)
    })

    it("clamps negative dimensions to zero", () => {
        const tiny = new Bounds(0, 0, 10, 10).pad(20)
        expect(tiny.width).toBe(0)
        expect(tiny.height).toBe(0)
    })

    it("pads uniformly and per side", () => {
        expect(b.pad(5).toProps()).toEqual({ x: 15, y: 25, width: 90, height: 40 })
        expect(b.pad({ left: 5, top: 10 }).toProps()).toEqual({ x: 15, y: 30, width: 95, height: 40 })
        expect(b.expand(5).toProps()).toEqual({ x: 5, y: 15, width: 110, height: 60 })
        expect(b.expand({ right: 5 }).toProps()).toEqual({ x: 10, y: 20, width: 105, height: 50 })
    })

    it("slices from edges", () => {
        expect(b.fromLeft(30).toProps()).toEqual({ x: 10, y: 20, width: 30, height: 50 })
        expect(b.fromRight(30).toProps()).toEqual({ x: 80, y: 20, width: 30, height: 50 })
        expect(b.fromTop(10).toProps()).toEqual({ x: 10, y: 20, width: 100, height: 10 })
        expect(b.fromBottom(10).toProps()).toEqual({ x: 10, y: 60, width: 100, height: 10 })
    })

    it("tests intersection and containment", () => {
        expect(b.intersects(new Bounds(100, 60, 50, 50))).toBe(true)
        expect(b.intersects(new Bounds(200, 200, 10, 10))).toBe(false)
        expect(b.containsPoint(10, 20)).toBe(true)
        expect(b.containsPoint(111, 20)).toBe(false)
        expect(b.contains({ x: 60, y: 45 })).toBe(true)
        expect(b.encloses(new Bounds(20, 30, 10, 10))).toBe(true)
        expect(b.encloses(new Bounds(20, 30, 200, 10))).toBe(false)
    })

    it("splits into a grid", () => {
        const cells = new Bounds(0, 0, 100, 100).grid({ rows: 2, columns: 2 })
        expect(cells).toHaveLength(4)
        expect(cells[0]!.toProps()).toEqual({ x: 0, y: 0, width: 50, height: 50 })
        expect(cells[3]!.toProps()).toEqual({ x: 50, y: 50, width: 50, height: 50 })
        const padded = new Bounds(0, 0, 110, 100).grid(
            { rows: 1, columns: 2, count: 2 },
            { columnPadding: 10 },
        )
        expect(padded[0]!.width).toBe(50)
        expect(padded[1]!.x).toBe(60)
    })

    it("merges bounds", () => {
        const merged = Bounds.merge([b, new Bounds(0, 0, 5, 5)])
        expect(merged.toProps()).toEqual({ x: 0, y: 0, width: 110, height: 70 })
        expect(Bounds.merge([]).equals(Bounds.empty())).toBe(true)
    })

    it("sets and equals immutably", () => {
        const moved = b.set({ x: 0 })
        expect(moved.toProps()).toEqual({ x: 0, y: 20, width: 100, height: 50 })
        expect(b.x).toBe(10)
        expect(moved.equals(new Bounds(0, 20, 100, 50))).toBe(true)
        expect(b.scale(2).toProps()).toEqual({ x: 20, y: 40, width: 200, height: 100 })
    })
})
