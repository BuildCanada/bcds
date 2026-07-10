import "@testing-library/jest-dom/vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RadioGroup } from "./RadioGroup"

const options = [
    { label: "Linear", value: "linear" },
    { label: "Log", value: "log" },
]

describe("RadioGroup", () => {
    afterEach(() => cleanup())

    it("supports controlled selection", () => {
        const onValueChange = vi.fn()
        render(<RadioGroup legend="Scale" value="linear" onValueChange={onValueChange} options={options} />)

        fireEvent.click(screen.getByRole("radio", { name: "Log" }))

        expect(onValueChange).toHaveBeenCalledWith("log")
        expect(screen.getByRole("radio", { name: "Linear" })).toBeChecked()
    })

    it("moves selection with arrow keys", () => {
        const onValueChange = vi.fn()
        render(<RadioGroup legend="Scale" defaultValue="linear" onValueChange={onValueChange} options={options} />)

        const linear = screen.getByRole("radio", { name: "Linear" })
        linear.focus()
        fireEvent.keyDown(linear, { key: "ArrowRight" })

        expect(onValueChange).toHaveBeenCalledWith("log")
        expect(screen.getByRole("radio", { name: "Log" })).toHaveFocus()
    })
})
