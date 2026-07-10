import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TextField } from "./TextField"

describe("TextField", () => {
    it("supports search fields with visually hidden labels and clear actions", () => {
        const onClear = vi.fn()
        render(<TextField label="Search entities" visuallyHiddenLabel type="search" defaultValue="Canada" onClear={onClear} />)

        expect(screen.getByRole("searchbox", { name: "Search entities" })).toHaveValue("Canada")
        fireEvent.click(screen.getByRole("button", { name: "Clear" }))
        expect(onClear).toHaveBeenCalled()
    })
})
