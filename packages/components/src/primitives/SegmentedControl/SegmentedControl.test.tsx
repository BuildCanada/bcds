import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SegmentedControl } from "./SegmentedControl"

const items = [
    { label: "Chart", value: "chart", panel: "Chart panel" },
    { label: "Table", value: "table", panel: "Table panel" },
]

describe("SegmentedControl", () => {
    it("renders tab semantics in tabs mode", () => {
        render(<SegmentedControl label="View" mode="tabs" defaultValue="chart" items={items} />)

        expect(screen.getByRole("tab", { name: "Chart" })).toHaveAttribute("aria-selected", "true")
        expect(screen.getByRole("tabpanel", { name: "Chart" })).toHaveTextContent("Chart panel")
    })

    it("uses aria-pressed in toggle mode", () => {
        const onValueChange = vi.fn()
        render(<SegmentedControl label="View" defaultValue="chart" onValueChange={onValueChange} items={items} />)

        fireEvent.click(screen.getByRole("button", { name: "Table" }))

        expect(onValueChange).toHaveBeenCalledWith("table")
        expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute("aria-pressed", "true")
    })
})
