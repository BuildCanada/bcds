import { describe, expect, it } from "vitest"

import { loadFixtureDataset } from "../../fixtures/index.ts"
import type { ChartDefinition } from "../types.ts"
import { resolveBindings, resolveSelection } from "./resolve.ts"
import { parseDefinition } from "./schema.ts"

const debt = loadFixtureDataset("government-debt")
const departments = loadFixtureDataset("federal-departments")

/** Build a valid definition through the real parser so defaults apply. */
function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "T", data: "fixture", y: ["spending"], ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

describe("resolveBindings override merge", () => {
    it("returns manifest column meta untouched when there are no bindings", () => {
        const definition = definitionFor({ y: ["federal_debt"] })
        const { columns, diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([])
        expect(columns.federal_debt).toEqual(debt.manifest.columns.federal_debt)
        expect(columns.gdp).toEqual(debt.manifest.columns.gdp)
    })

    it("applies per-binding overrides on top of manifest meta", () => {
        const definition = definitionFor({
            y: ["federal_debt"],
            bindings: { federal_debt: { name: "Net federal debt", decimals: 0 } },
        })
        const { columns } = resolveBindings(definition, debt.manifest)
        expect(columns.federal_debt.name).toBe("Net federal debt")
        expect(columns.federal_debt.decimals).toBe(0)
        // Everything not overridden comes from the manifest.
        expect(columns.federal_debt.unit).toBe("billion CAD")
        expect(columns.federal_debt.denominator).toBe("gdp")
        expect(columns.federal_debt.displayFactor).toBe(100)
    })

    it("ignores undefined entries in an override", () => {
        const definition = definitionFor({ y: ["federal_debt"] })
        definition.bindings = { federal_debt: { name: undefined, decimals: 0 } }
        const { columns } = resolveBindings(definition, debt.manifest)
        expect(columns.federal_debt.name).toBe("Federal debt")
        expect(columns.federal_debt.decimals).toBe(0)
    })

    it("does not mutate the manifest's column meta", () => {
        const definition = definitionFor({
            y: ["federal_debt"],
            bindings: { federal_debt: { name: "Overridden" } },
        })
        resolveBindings(definition, debt.manifest)
        expect(debt.manifest.columns.federal_debt.name).toBe("Federal debt")
    })

    it("warns when a binding references an unknown column", () => {
        const definition = definitionFor({
            y: ["federal_debt"],
            bindings: { nonexistent: { name: "Ghost" } },
        })
        const { diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "warning", code: "unknown-binding-column" }),
        ])
    })

    it("errors when a y slug is not in the manifest", () => {
        const definition = definitionFor({ y: ["federal_debt", "nonexistent"] })
        const { diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "error", code: "unknown-y-column" }),
        ])
    })
})

describe("resolveBindings stacking denominators (spec 01 §7)", () => {
    const stackedY = { y: ["federal_debt", "provincial_debt", "municipal_debt"], types: ["stacked-area", "line"] }

    it("accepts stacked y columns sharing one denominator", () => {
        const definition = definitionFor(stackedY)
        const { diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([])
    })

    it("errors when a binding override gives stacked columns different denominators", () => {
        const definition = definitionFor({
            ...stackedY,
            bindings: { provincial_debt: { denominator: "federal_debt" } },
        })
        const { diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "error", code: "mixed-denominators" }),
        ])
    })

    it("errors when one stacked column has a denominator and another has none", () => {
        const definition = definitionFor({
            y: ["federal_debt", "gdp"],
            types: ["stacked-bar"],
        })
        const { diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "error", code: "mixed-denominators" }),
        ])
    })

    it("allows different denominators when no stacked type is offered", () => {
        const definition = definitionFor({
            ...stackedY,
            types: ["line", "discrete-bar"],
            bindings: { provincial_debt: { denominator: "federal_debt" } },
        })
        const { diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([])
    })

    it("never flags a single stacked y column", () => {
        const definition = definitionFor({ y: ["federal_debt"], types: ["stacked-area"] })
        const { diagnostics } = resolveBindings(definition, debt.manifest)
        expect(diagnostics).toEqual([])
    })
})

describe("resolveSelection default top-N (spec 02 §1)", () => {
    it("selects the top 8 entities by latest y[0] value, descending", () => {
        const definition = definitionFor({})
        const { entities, diagnostics } = resolveSelection(definition, departments.dataset)
        expect(diagnostics).toEqual([])
        // Department i spends i*10 + 4 in 2023-24, so the top 8 are the last 8.
        expect(entities).toEqual([
            "Crown-Indigenous Relations and Northern Affairs Canada",
            "Natural Resources Canada",
            "Veterans Affairs Canada",
            "Fisheries and Oceans Canada",
            "Canada Revenue Agency",
            "Agriculture and Agri-Food Canada",
            "Environment and Climate Change Canada",
            "Transport Canada",
        ])
    })

    it("returns every entity when fewer than 8 are available", () => {
        const definition = definitionFor({ y: ["federal_debt"] })
        const { entities } = resolveSelection(definition, debt.dataset)
        expect(entities).toEqual(["Canada"])
    })

    it("restricts the default selection to includedEntities", () => {
        const definition = definitionFor({
            includedEntities: ["National Defence", "Health Canada", "Transport Canada"],
        })
        const { entities } = resolveSelection(definition, departments.dataset)
        expect(entities).toEqual(["Transport Canada", "Health Canada", "National Defence"])
    })

    it("removes excludedEntities before ranking", () => {
        const definition = definitionFor({
            excludedEntities: ["Crown-Indigenous Relations and Northern Affairs Canada"],
        })
        const { entities } = resolveSelection(definition, departments.dataset)
        expect(entities[0]).toBe("Natural Resources Canada")
        expect(entities).toHaveLength(8)
        expect(entities[7]).toBe("Public Safety Canada")
    })
})

describe("resolveSelection explicit selection", () => {
    it("intersects selectedEntities with the available set, preserving author order", () => {
        const definition = definitionFor({
            selectedEntities: ["Health Canada", "National Defence"],
        })
        const { entities, diagnostics } = resolveSelection(definition, departments.dataset)
        expect(diagnostics).toEqual([])
        expect(entities).toEqual(["Health Canada", "National Defence"])
    })

    it("warns about selected entities missing from the dataset", () => {
        const definition = definitionFor({
            selectedEntities: ["Health Canada", "Ministry of Silly Walks"],
        })
        const { entities, diagnostics } = resolveSelection(definition, departments.dataset)
        expect(entities).toEqual(["Health Canada"])
        expect(diagnostics).toEqual([
            expect.objectContaining({ severity: "warning", code: "unavailable-selected-entity" }),
        ])
    })

    it("drops selected entities excluded by excludedEntities", () => {
        const definition = definitionFor({
            selectedEntities: ["Health Canada", "National Defence"],
            excludedEntities: ["National Defence"],
        })
        const { entities, diagnostics } = resolveSelection(definition, departments.dataset)
        expect(entities).toEqual(["Health Canada"])
        expect(diagnostics).toHaveLength(1)
    })
})
