import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Select } from "./Select"

describe("Select", () => {
    it("supports controlled native select changes", () => {
        const onChange = vi.fn()
        render(
            <Select
                label="Sort order"
                value="name"
                onChange={onChange}
                options={[
                    { label: "Name", value: "name" },
                    { label: "Value", value: "value" },
                ]}
            />
        )

        fireEvent.change(screen.getByRole("combobox", { name: "Sort order" }), { target: { value: "value" } })

        expect(onChange).toHaveBeenCalled()
        expect(screen.getByRole("combobox", { name: "Sort order" })).toHaveValue("name")
    })

    it("supports visually hidden labels", () => {
        render(
            <Select
                label="Entity sort"
                visuallyHiddenLabel
                defaultValue="name"
                options={[{ label: "Name", value: "name" }]}
            />
        )

        expect(screen.getByRole("combobox", { name: "Entity sort" })).toBeInTheDocument()
    })
})
