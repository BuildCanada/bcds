import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render } from "@testing-library/react"

import type { Tab } from "../../core/types.ts"
import { Tabs } from "./Tabs.tsx"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(cleanup)

const TABS: Tab[] = ["line", "discrete-bar", "table"]

describe("Tabs (spec 10 §3)", () => {
    it("renders an accessible tablist with the active tab selected", () => {
        const { container } = render(<Tabs tabs={TABS} active="line" onChange={() => undefined} />)
        expect(container.querySelector('[role="tablist"]')).not.toBeNull()
        const tabs = [...container.querySelectorAll('[role="tab"]')]
        expect(tabs.length).toBe(3)
        expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["true", "false", "false"])
        expect(tabs.map((tab) => tab.textContent)).toEqual(["Line", "Bar", "Table"])
        // Roving tabindex: only the active tab is in the tab order.
        expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"])
    })

    it("activates tabs on click", () => {
        const onChange = vi.fn()
        const { getByText } = render(<Tabs tabs={TABS} active="line" onChange={onChange} />)
        fireEvent.click(getByText("Table"))
        expect(onChange).toHaveBeenCalledWith("table")
    })

    it("moves with arrow keys, wrapping at both ends", () => {
        const onChange = vi.fn()
        const { getByText } = render(<Tabs tabs={TABS} active="line" onChange={onChange} />)

        fireEvent.keyDown(getByText("Line"), { key: "ArrowRight" })
        expect(onChange).toHaveBeenLastCalledWith("discrete-bar")

        fireEvent.keyDown(getByText("Line"), { key: "ArrowLeft" })
        expect(onChange).toHaveBeenLastCalledWith("table")
    })

    it("jumps to the first and last tab with Home and End", () => {
        const onChange = vi.fn()
        const { getByText } = render(<Tabs tabs={TABS} active="discrete-bar" onChange={onChange} />)

        fireEvent.keyDown(getByText("Bar"), { key: "Home" })
        expect(onChange).toHaveBeenLastCalledWith("line")

        fireEvent.keyDown(getByText("Bar"), { key: "End" })
        expect(onChange).toHaveBeenLastCalledWith("table")
    })

    it("supports label overrides", () => {
        const { getByText } = render(
            <Tabs tabs={TABS} active="line" onChange={() => undefined} labels={{ "discrete-bar": "Bars!" }} />,
        )
        expect(getByText("Bars!")).not.toBeNull()
    })
})
