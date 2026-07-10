import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RangeSlider, Slider } from "./Slider"

describe("Slider", () => {
    it("reports controlled value changes", () => {
        const onValueChange = vi.fn()
        render(<Slider label="Year" min={2020} max={2026} value={2024} onValueChange={onValueChange} />)

        fireEvent.change(screen.getByRole("slider", { name: "Year" }), { target: { value: "2025" } })

        expect(onValueChange).toHaveBeenCalledWith(2025)
    })

    it("prevents range handles from crossing by default", () => {
        const onValueChange = vi.fn()
        render(<RangeSlider label="Years" min={2020} max={2026} value={[2022, 2024]} onValueChange={onValueChange} />)

        fireEvent.change(screen.getByRole("slider", { name: "Minimum value" }), { target: { value: "2025" } })

        expect(onValueChange).toHaveBeenCalledWith([2024, 2024])
    })
})
