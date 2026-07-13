import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render } from "@testing-library/react"

import type { TooltipModel } from "../../core/scene/nodes.ts"
import { computeTooltipPlacement, Tooltip, TOOLTIP_CURSOR_OFFSET } from "./Tooltip.tsx"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(cleanup)

const CARD = { width: 100, height: 60 }
const BOUNDS = { width: 400, height: 300 }

describe("computeTooltipPlacement (spec 06 §3)", () => {
    it("places the card right and below the cursor by default (center)", () => {
        expect(computeTooltipPlacement(200, 150, CARD, BOUNDS)).toEqual({ left: 212, top: 162 })
    })

    it("stays inside bounds at the top-left corner", () => {
        expect(computeTooltipPlacement(0, 0, CARD, BOUNDS)).toEqual({
            left: TOOLTIP_CURSOR_OFFSET,
            top: TOOLTIP_CURSOR_OFFSET,
        })
    })

    it("flips left of the cursor at the top-right corner", () => {
        expect(computeTooltipPlacement(395, 5, CARD, BOUNDS)).toEqual({ left: 283, top: 17 })
    })

    it("flips above the cursor at the bottom-left corner", () => {
        expect(computeTooltipPlacement(5, 295, CARD, BOUNDS)).toEqual({ left: 17, top: 223 })
    })

    it("flips both axes at the bottom-right corner", () => {
        expect(computeTooltipPlacement(395, 295, CARD, BOUNDS)).toEqual({ left: 283, top: 223 })
    })

    it("clamps to the frame when the card cannot fit either side", () => {
        const placement = computeTooltipPlacement(50, 150, CARD, { width: 90, height: 300 })
        expect(placement.left).toBe(0)
    })
})

const model: TooltipModel = {
    title: "2021–22",
    titleAnnotation: "fiscal year",
    subtitle: "Total spending (billion CAD)",
    rows: [
        { seriesKey: "Ontario", label: "Ontario", swatch: "#112233", valueText: "$186.4 billion", emphasized: true },
        { seriesKey: "Quebec", label: "Quebec", swatch: "#445566", valueText: "$140.5 billion", emphasized: false },
        { seriesKey: "Nova Scotia", label: "Nova Scotia", swatch: "#778899", valueText: "No data", emphasized: false, notice: "missing" },
        { seriesKey: "Alberta", label: "Alberta", swatch: "#99aabb", valueText: "—", emphasized: false, notice: "missing" },
    ],
    totalRow: { seriesKey: "_total", label: "Total", swatch: "#000000", valueText: "$326.9 billion", emphasized: false },
    footers: [
        { icon: "notice", text: "Data from 2019" },
        { icon: "projection", text: "Projected data" },
    ],
}

describe("Tooltip rendering (spec 06 §1)", () => {
    it("renders the model verbatim: title, annotation, subtitle, rows in order, total, footers", () => {
        const { container } = render(<Tooltip model={model} x={10} y={10} bounds={BOUNDS} />)

        const title = container.querySelector(".bcds2-tooltip__title")
        expect(title?.textContent).toBe("2021–22 fiscal year")
        expect(container.querySelector(".bcds2-tooltip__subtitle")?.textContent).toBe("Total spending (billion CAD)")

        const rows = [...container.querySelectorAll(".bcds2-tooltip__rows .bcds2-tooltip__row")]
        expect(rows.map((row) => row.querySelector(".bcds2-tooltip__label")?.textContent)).toEqual([
            "Ontario",
            "Quebec",
            "Nova Scotia",
            "Alberta",
        ])
        expect(rows.map((row) => row.querySelector(".bcds2-tooltip__value")?.textContent)).toEqual([
            "$186.4 billion",
            "$140.5 billion",
            "No data",
            "—",
        ])

        const total = container.querySelector(".bcds2-tooltip__row--total")
        expect(total?.querySelector(".bcds2-tooltip__label")?.textContent).toBe("Total")
        expect(total?.querySelector(".bcds2-tooltip__value")?.textContent).toBe("$326.9 billion")

        const footers = [...container.querySelectorAll(".bcds2-tooltip__footer-text")]
        expect(footers.map((footer) => footer.textContent)).toEqual(["Data from 2019", "Projected data"])
        expect(container.querySelector(".bcds2-tooltip__footer--notice .bcds2-tooltip__footer-icon")).not.toBeNull()
        expect(container.querySelector(".bcds2-tooltip__footer--projection svg")).not.toBeNull()
    })

    it("emphasizes the hovered row and mutes missing rows", () => {
        const { container } = render(<Tooltip model={model} x={10} y={10} bounds={BOUNDS} />)

        const ontario = container.querySelector('[data-series-key="Ontario"]')
        expect(ontario?.className).toContain("bcds2-tooltip__row--emphasized")

        const novaScotia = container.querySelector('[data-series-key="Nova Scotia"]')
        expect(novaScotia?.className).toContain("bcds2-tooltip__row--missing")
        expect(novaScotia?.className).not.toContain("emphasized")
    })

    it("positions itself via computeTooltipPlacement", () => {
        const { container } = render(<Tooltip model={model} x={30} y={40} bounds={BOUNDS} />)
        const card = container.querySelector(".bcds2-tooltip") as HTMLElement
        // happy-dom measures 0×0, so the card sits at cursor + offset.
        expect(card.style.left).toBe("42px")
        expect(card.style.top).toBe("52px")
    })

    it("omits subtitle, total, and footers when absent", () => {
        const sparse: TooltipModel = { title: "2020", rows: model.rows.slice(0, 1), footers: [] }
        const { container } = render(<Tooltip model={sparse} x={0} y={0} bounds={BOUNDS} />)
        expect(container.querySelector(".bcds2-tooltip__subtitle")).toBeNull()
        expect(container.querySelector(".bcds2-tooltip__row--total")).toBeNull()
        expect(container.querySelector(".bcds2-tooltip__footers")).toBeNull()
    })
})
