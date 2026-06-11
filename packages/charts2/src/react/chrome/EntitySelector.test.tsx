import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render } from "@testing-library/react"

import { loadFixtureDataset } from "../../fixtures/index.ts"
import { EntitySelector } from "./EntitySelector.tsx"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(cleanup)

const pathological = loadFixtureDataset("pathological").dataset
const federal = loadFixtureDataset("federal-departments").dataset

function rowNames(container: HTMLElement): string[] {
    return [...container.querySelectorAll(".bcds2-entity-selector__name")].map((el) => el.textContent ?? "")
}

describe("EntitySelector search (spec 07 §2)", () => {
    it("finds accented entities from unaccented queries (quebec → Québec)", () => {
        const { container, getByLabelText } = render(
            <EntitySelector dataset={pathological} selected={[]} mode="multi" onChange={() => undefined} locale="en" />,
        )
        fireEvent.change(getByLabelText("Search places"), { target: { value: "quebec" } })
        expect(rowNames(container)).toEqual(["Québec"])
    })

    it("finds entities via manifest aliases (DFAIT → Global Affairs Canada)", () => {
        const { container, getByLabelText } = render(
            <EntitySelector dataset={federal} selected={[]} mode="multi" onChange={() => undefined} locale="en" />,
        )
        fireEvent.change(getByLabelText("Search departments"), { target: { value: "DFAIT" } })
        expect(rowNames(container)).toEqual(["Global Affairs Canada"])

        fireEvent.change(getByLabelText("Search departments"), { target: { value: "Industry Canada" } })
        expect(rowNames(container)).toContain("Innovation, Science and Economic Development Canada")
    })
})

describe("EntitySelector groups (spec 07 §2)", () => {
    it("renders group headers from entity metadata", () => {
        const { container } = render(
            <EntitySelector dataset={federal} selected={[]} mode="multi" onChange={() => undefined} locale="en" />,
        )
        const headers = [...container.querySelectorAll(".bcds2-entity-selector__group-header")].map(
            (el) => el.textContent ?? "",
        )
        expect(headers).toContain("Social")
        expect(headers).toContain("Defence and Security")
    })

    it("selects a whole group at once and deselects it on a second toggle", () => {
        const onChange = vi.fn()
        const social = ["Employment and Social Development Canada", "Health Canada", "Veterans Affairs Canada"]

        const first = render(
            <EntitySelector dataset={federal} selected={[]} mode="multi" onChange={onChange} locale="en" />,
        )
        fireEvent.click(first.getByLabelText("Select all in Social"))
        expect(onChange).toHaveBeenCalledWith(social)
        first.unmount()

        onChange.mockClear()
        const second = render(
            <EntitySelector dataset={federal} selected={social} mode="multi" onChange={onChange} locale="en" />,
        )
        fireEvent.click(second.getByLabelText("Select all in Social"))
        expect(onChange).toHaveBeenCalledWith([])
    })
})

describe("EntitySelector sorting (spec 07 §2)", () => {
    it("sorts by a numeric column and shows the formatted value beside each entity", () => {
        const { container, getByLabelText } = render(
            <EntitySelector
                dataset={federal}
                selected={[]}
                mode="multi"
                onChange={() => undefined}
                sortColumns={["spending"]}
                locale="en"
            />,
        )
        fireEvent.change(getByLabelText("Sort by"), { target: { value: "spending" } })

        // Descending by latest spending; groups keep first-appearance order,
        // so the top spender (Crown-Indigenous, 154) leads and rows sort
        // descending within each group (Social: Veterans 134 > Health 44 > ESDC 24).
        const names = rowNames(container)
        expect(names[0]).toBe("Crown-Indigenous Relations and Northern Affairs Canada")
        const veterans = names.indexOf("Veterans Affairs Canada")
        const health = names.indexOf("Health Canada")
        const esdc = names.indexOf("Employment and Social Development Canada")
        expect(veterans).toBeLessThan(health)
        expect(health).toBeLessThan(esdc)

        const values = [...container.querySelectorAll(".bcds2-entity-selector__value")].map((el) => el.textContent)
        expect(values).toContain("$154.0")
        expect(values).toContain("$14.0")
    })

    it("sorts by name by default, accent-insensitively", () => {
        const { container } = render(
            <EntitySelector dataset={pathological} selected={[]} mode="multi" onChange={() => undefined} locale="en" />,
        )
        expect(rowNames(container)).toEqual(["Î.-P.-É.", "Lonely Station", "Québec"])
    })
})

describe("EntitySelector selection modes (spec 07 §1)", () => {
    it("toggles entities in multi mode", () => {
        const onChange = vi.fn()
        const { container } = render(
            <EntitySelector dataset={pathological} selected={["Québec"]} mode="multi" onChange={onChange} locale="en" />,
        )
        const rows = [...container.querySelectorAll(".bcds2-entity-selector__row")]
        const lonely = rows.find((row) => row.textContent?.includes("Lonely Station"))
        fireEvent.click(lonely!.querySelector("input")!)
        expect(onChange).toHaveBeenCalledWith(["Québec", "Lonely Station"])
    })

    it("replaces the selection in single mode", () => {
        const onChange = vi.fn()
        const { container } = render(
            <EntitySelector dataset={pathological} selected={["Québec"]} mode="single" onChange={onChange} locale="en" />,
        )
        const rows = [...container.querySelectorAll(".bcds2-entity-selector__row")]
        const lonely = rows.find((row) => row.textContent?.includes("Lonely Station"))
        expect(lonely?.querySelector("input")?.getAttribute("type")).toBe("radio")
        fireEvent.click(lonely!.querySelector("input")!)
        expect(onChange).toHaveBeenCalledWith(["Lonely Station"])
    })

    it("selects all and clears in multi mode", () => {
        const onChange = vi.fn()
        const { getByText } = render(
            <EntitySelector dataset={pathological} selected={["Québec"]} mode="multi" onChange={onChange} locale="en" />,
        )
        fireEvent.click(getByText("Select all"))
        expect(onChange).toHaveBeenCalledWith(["Québec", "Î.-P.-É.", "Lonely Station"])

        onChange.mockClear()
        fireEvent.click(getByText("Clear"))
        expect(onChange).toHaveBeenCalledWith([])
    })

    it("hides bulk actions in single mode", () => {
        const { queryByText } = render(
            <EntitySelector dataset={pathological} selected={[]} mode="single" onChange={() => undefined} locale="en" />,
        )
        expect(queryByText("Select all")).toBeNull()
        expect(queryByText("Clear")).toBeNull()
    })
})
