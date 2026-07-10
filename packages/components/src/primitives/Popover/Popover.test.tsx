import "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Button } from "../Button"
import { MenuButton, Popover } from "./index"

describe("Popover", () => {
    it("opens from the trigger and closes on Escape", () => {
        render(<Popover trigger={<Button text="Settings" icon={null} />}>Panel</Popover>)

        fireEvent.click(screen.getByRole("button", { name: "Settings" }))
        expect(screen.getByRole("dialog")).toHaveTextContent("Panel")

        fireEvent.keyDown(document, { key: "Escape" })
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus()
    })

    it("runs menu item selection and closes", () => {
        const onSelect = vi.fn()
        render(<MenuButton label="Download" items={[{ label: "PNG", onSelect }]} />)

        fireEvent.click(screen.getByRole("button", { name: "Download" }))
        fireEvent.click(screen.getByRole("menuitem", { name: "PNG" }))

        expect(onSelect).toHaveBeenCalled()
        expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    })
})
