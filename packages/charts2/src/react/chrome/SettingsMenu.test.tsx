import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render } from "@testing-library/react"

import type { SettingsItem } from "./SettingsMenu.tsx"
import { SettingsMenu } from "./SettingsMenu.tsx"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(cleanup)

function makeItems(onToggle = vi.fn(), onScale = vi.fn()): SettingsItem[] {
    return [
        { kind: "toggle", id: "relative", label: "Relative", value: false, onChange: onToggle },
        {
            kind: "radio",
            id: "scale",
            label: "Y-axis scale",
            options: [
                { value: "linear", label: "Linear" },
                { value: "log", label: "Log" },
            ],
            value: "linear",
            onChange: onScale,
        },
    ]
}

describe("SettingsMenu (spec 10 §4)", () => {
    it("opens the popover from the gear button and lists only the passed items", () => {
        const { container, getByLabelText, getByText } = render(<SettingsMenu items={makeItems()} />)
        expect(container.querySelector(".bcds2-settings__popover")).toBeNull()

        fireEvent.click(getByLabelText("Settings"))
        expect(container.querySelector(".bcds2-settings__popover")).not.toBeNull()
        expect(container.querySelector(".bc-checkbox")).not.toBeNull()
        expect(getByText("Relative")).not.toBeNull()
        expect(getByText("Y-axis scale")).not.toBeNull()
        expect(container.querySelectorAll(".bcds2-settings__item").length).toBe(2)
    })

    it("emits toggle and radio changes", () => {
        const onToggle = vi.fn()
        const onScale = vi.fn()
        const { container, getByLabelText } = render(<SettingsMenu items={makeItems(onToggle, onScale)} />)
        fireEvent.click(getByLabelText("Settings"))

        const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement
        fireEvent.click(checkbox)
        expect(onToggle).toHaveBeenCalledWith(true)

        const log = container.querySelector('input[type="radio"][value="log"]') as HTMLInputElement
        fireEvent.click(log)
        expect(onScale).toHaveBeenCalledWith("log")
    })

    it("closes on Escape", () => {
        const { container, getByLabelText } = render(<SettingsMenu items={makeItems()} />)
        fireEvent.click(getByLabelText("Settings"))
        expect(container.querySelector(".bcds2-settings__popover")).not.toBeNull()

        fireEvent.keyDown(document, { key: "Escape" })
        expect(container.querySelector(".bcds2-settings__popover")).toBeNull()
    })

    it("closes on outside click but not on inside click", () => {
        const { container, getByLabelText, getByText } = render(<SettingsMenu items={makeItems()} />)
        fireEvent.click(getByLabelText("Settings"))

        fireEvent.pointerDown(getByText("Relative"))
        expect(container.querySelector(".bcds2-settings__popover")).not.toBeNull()

        fireEvent.pointerDown(document.body)
        expect(container.querySelector(".bcds2-settings__popover")).toBeNull()
    })
})
