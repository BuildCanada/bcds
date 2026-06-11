import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render } from "@testing-library/react"

import { formatChange } from "../../core/format/number.ts"
import type { ColumnMeta, TimeSelection } from "../../core/types.ts"
import { loadFixtureDataset } from "../../fixtures/index.ts"
import { DataTable, EM_DASH } from "./DataTable.tsx"
import type { DataTableProps } from "./DataTable.tsx"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

afterEach(cleanup)

const { dataset } = loadFixtureDataset("provincial-budgets")
const slugs = ["total_spending", "program_spending", "debt_charges"]
const columns: Record<string, ColumnMeta> = Object.fromEntries(slugs.map((slug) => [slug, dataset.manifest.columns[slug]]))

const ALL_PROVINCES = [...dataset.entities]

function renderTable(overrides: Partial<DataTableProps> = {}) {
    const props: DataTableProps = {
        dataset,
        columns,
        entities: ALL_PROVINCES,
        timeSelection: { start: 2024, end: 2024 },
        grain: "fiscal-year",
        locale: "en",
        scope: "all",
        onScopeChange: () => undefined,
        sort: { column: "entity", order: "asc" },
        onSortChange: () => undefined,
        searchQuery: "",
        onSearchChange: () => undefined,
        ...overrides,
    }
    return render(<DataTable {...props} />)
}

function bodyRow(container: HTMLElement, entity: string): HTMLTableRowElement {
    const rows = [...container.querySelectorAll<HTMLTableRowElement>("tbody tr")]
    const row = rows.find((candidate) => candidate.querySelector("th")?.textContent === entity)
    if (row === undefined) throw new Error(`No row for ${entity}`)
    return row
}

function cellTexts(row: HTMLTableRowElement): string[] {
    return [...row.querySelectorAll("td")].map((cell) => cell.textContent ?? "")
}

describe("DataTable column set (spec 22 §1)", () => {
    const cases: { name: string; selection: TimeSelection; headerRows: number; valueColumns: number }[] = [
        { name: "single time → one value column per metric", selection: { start: 2024, end: 2024 }, headerRows: 1, valueColumns: 3 },
        { name: "time range → start/end/change/% change per metric", selection: { start: 2019, end: 2024 }, headerRows: 2, valueColumns: 12 },
    ]

    for (const testCase of cases) {
        it(testCase.name, () => {
            const { container } = renderTable({ timeSelection: testCase.selection })
            expect(container.querySelectorAll("thead tr").length).toBe(testCase.headerRows)
            const ontario = bodyRow(container, "Ontario")
            expect(ontario.querySelectorAll("td").length).toBe(testCase.valueColumns)
        })
    }

    it("labels single-time columns with metric name, unit, and time", () => {
        const { container } = renderTable({ timeSelection: { start: 2024, end: 2024 } })
        const header = container.querySelector("thead")
        expect(header?.textContent).toContain("Total spending")
        expect(header?.textContent).toContain("billion CAD")
        expect(header?.textContent).toContain("2024–25")
        expect(header?.textContent).not.toContain("Change")
    })

    it("labels range sub-columns with both endpoints and change columns", () => {
        const { container } = renderTable({ timeSelection: { start: 2019, end: 2024 } })
        const subHeaders = [...container.querySelectorAll("thead tr")[1].querySelectorAll("th")].map(
            (th) => th.textContent ?? "",
        )
        expect(subHeaders.length).toBe(12)
        expect(subHeaders[0]).toContain("2019–20")
        expect(subHeaders[1]).toContain("2024–25")
        expect(subHeaders[2]).toContain("Change")
        expect(subHeaders[3]).toContain("% change")
    })
})

describe("DataTable change math (spec 22 §1)", () => {
    it("computes absolute and relative change via formatChange (format parity)", () => {
        const { container } = renderTable({ timeSelection: { start: 2019, end: 2024 } })
        const ontario = cellTexts(bodyRow(container, "Ontario"))

        // Ontario total_spending: 165.1 → 214.5.
        const expected = formatChange(165.1, 214.5, columns.total_spending, { locale: "en" })
        expect(ontario[0]).toBe("$165.1")
        expect(ontario[1]).toBe("$214.5")
        expect(ontario[2]).toBe(expected.absolute)
        expect(ontario[3]).toBe(expected.relative)
        expect(expected.relative).not.toBeNull()
    })
})

describe("DataTable annotations (spec 22 §2)", () => {
    it("renders missing values as an em-dash, never blank or zero", () => {
        const { container } = renderTable({ timeSelection: { start: 2024, end: 2024 } })
        const quebec = cellTexts(bodyRow(container, "Quebec"))
        // program_spending has no tolerance: Quebec 2024-25 is missing.
        expect(quebec[1]).toBe(EM_DASH)
        expect(quebec[1]).not.toBe("")
        expect(quebec[1]).not.toBe("0")
    })

    it("suppresses change columns to em-dashes when an endpoint is missing", () => {
        const { container } = renderTable({ timeSelection: { start: 2019, end: 2024 } })
        const quebec = cellTexts(bodyRow(container, "Quebec"))
        // program_spending occupies columns 4–7: start, end (missing), change, % change.
        expect(quebec[4]).toBe("$110.4")
        expect(quebec[5]).toBe(EM_DASH)
        expect(quebec[6]).toBe(EM_DASH)
        expect(quebec[7]).toBe(EM_DASH)
    })

    it("marks toleranced cells with an info marker carrying the actual time", () => {
        const { container } = renderTable({ timeSelection: { start: 2024, end: 2024 } })
        // debt_charges (tolerance 2): Quebec 2024-25 borrows from 2023-24.
        const quebec = bodyRow(container, "Quebec")
        const marker = quebec.querySelector(".bcds2-data-table__marker--toleranced")
        expect(marker).not.toBeNull()
        expect(marker?.getAttribute("title")).toBe("Data from 2023–24")

        // Ontario has a real 2024-25 value: no marker.
        expect(bodyRow(container, "Ontario").querySelector(".bcds2-data-table__marker--toleranced")).toBeNull()
    })
})

describe("DataTable scope, sort, and search (spec 22 §3)", () => {
    it("applies the sort prop to row order", () => {
        const { container } = renderTable({ sort: { column: "total_spending", order: "desc" } })
        const names = [...container.querySelectorAll("tbody th")].map((th) => th.textContent)
        expect(names[0]).toBe("Ontario")
        expect(names[names.length - 1]).toBe("Nova Scotia")
    })

    it("shows only the selected entities when scope is selected", () => {
        const { container } = renderTable({ scope: "selected", entities: ["Ontario", "Alberta"] })
        const names = [...container.querySelectorAll("tbody th")].map((th) => th.textContent)
        expect(names).toEqual(["Alberta", "Ontario"])
    })

    it("filters rows by entity search", () => {
        const { container } = renderTable({ searchQuery: "ont" })
        const names = [...container.querySelectorAll("tbody th")].map((th) => th.textContent)
        expect(names).toEqual(["Ontario"])
    })

    it("emits scope, sort, and search changes without owning the state", () => {
        const onScopeChange = vi.fn()
        const onSortChange = vi.fn()
        const onSearchChange = vi.fn()
        const { getByText, getByLabelText } = renderTable({
            scope: "selected",
            onScopeChange,
            onSortChange,
            onSearchChange,
        })

        fireEvent.click(getByText("All"))
        expect(onScopeChange).toHaveBeenCalledWith("all")

        fireEvent.click(getByText("Total spending"))
        expect(onSortChange).toHaveBeenCalledWith({ column: "total_spending", order: "desc" })

        fireEvent.change(getByLabelText("Search provinces"), { target: { value: "que" } })
        expect(onSearchChange).toHaveBeenCalledWith("que")
    })

    it("toggles the order when the active sort column is clicked again", () => {
        const onSortChange = vi.fn()
        const { getByText } = renderTable({ sort: { column: "entity", order: "asc" }, onSortChange })
        fireEvent.click(getByText("Province"))
        expect(onSortChange).toHaveBeenCalledWith({ column: "entity", order: "desc" })
    })
})
