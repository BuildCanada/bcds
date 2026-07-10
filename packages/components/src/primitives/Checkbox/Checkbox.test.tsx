import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Checkbox } from "./Checkbox"

describe("Checkbox", () => {
    it("sets native and ARIA mixed state for indeterminate checkboxes", () => {
        render(<Checkbox label="Show estimates" indeterminate />)

        const checkbox = screen.getByRole("checkbox", { name: "Show estimates" }) as HTMLInputElement
        expect(checkbox.indeterminate).toBe(true)
        expect(checkbox).toHaveAttribute("aria-checked", "mixed")
    })
})
