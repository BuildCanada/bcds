import { describe, expect, it } from "vitest"
import {
    decodeExplorerState,
    encodeExplorerState,
    resolveExplorerView,
    type ExplorerDefinition,
} from "."

const explorer: ExplorerDefinition = {
    slug: "public-finance",
    title: "Public finance explorer",
    controls: [
        {
            slug: "metric",
            label: "Metric",
            type: "dropdown",
            defaultValue: "spending",
            options: [
                { value: "spending", label: "Spending" },
                { value: "debt", label: "Debt" },
            ],
        },
        {
            slug: "view",
            label: "View",
            type: "radio",
            defaultValue: "line",
            options: [
                { value: "line", label: "Line" },
                { value: "map", label: "Map" },
                { value: "missing", label: "Unavailable" },
            ],
        },
    ],
    views: [
        {
            choices: { metric: "spending", view: "line" },
            definition: { title: "Spending over time", y: "spending", types: ["line"] },
        },
        {
            choices: { metric: "spending", view: "map" },
            definition: { title: "Spending map", y: "spending", types: ["map"] },
        },
        {
            choices: { metric: "debt", view: "line" },
            definition: { title: "Debt over time", y: "debt", types: ["line"] },
        },
    ],
}

describe("explorer resolution", () => {
    it("resolves exact choices to a chart definition", () => {
        const result = resolveExplorerView(explorer, { metric: "spending", view: "map" })
        expect(result.definition.title).toBe("Spending map")
        expect(result.choices).toEqual({ metric: "spending", view: "map" })
    })

    it("falls back to a valid view and reports globally unavailable options", () => {
        const result = resolveExplorerView(explorer, { metric: "debt", view: "map" })
        expect(result.definition.title).toBe("Debt over time")
        expect(result.choices).toEqual({ metric: "debt", view: "line" })
        expect(result.disabledOptions.view).toContain("missing")
    })

    it("round-trips choices through URL query state", () => {
        const encoded = encodeExplorerState({ view: "line", metric: "debt" })
        expect(encoded).toBe("metric=debt&view=line")
        expect(decodeExplorerState(encoded)).toEqual({ metric: "debt", view: "line" })
    })
})
