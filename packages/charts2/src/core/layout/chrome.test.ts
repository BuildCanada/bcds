import { describe, expect, it } from "vitest"

import { parseDefinition } from "../definition/schema.ts"
import type { ChartDefinition } from "../types.ts"
import { loadFixtureDataset } from "../../fixtures/index.ts"
import { defaultMeasurer } from "../text/createMeasurer.ts"
import { BUILD_CANADA_SQUARE_LOGO_DATA_URI, CANADA_SPENDS_LOGO_DATA_URI } from "../theme/logos.ts"
import { buildCanadaTheme, canadaSpendsTheme } from "../theme/themes.ts"
import { chartTitleText, layoutChrome } from "./chrome.ts"

function definitionFor(raw: Record<string, unknown>): ChartDefinition {
    const { definition } = parseDefinition({ title: "Government debt", data: "government-debt", y: ["federal_debt"], ...raw })
    if (definition === null) throw new Error("test definition failed to parse")
    return definition
}

const WINDOW = { start: 2019, end: 2023 }

describe("title auto-annotations (spec 02 §1, spec 10 §2)", () => {
    it("appends the entity when a single entity is shown and not already in the title", () => {
        const title = chartTitleText({
            definition: definitionFor({}),
            entities: ["Canada"],
            window: WINDOW,
            grain: "fiscal-year",
            locale: "en",
            relative: false,
        })
        expect(title).toBe("Government debt, Canada, 2019–20 to 2023–24")
    })

    it("skips the entity annotation when it is already in the title or multiple entities show", () => {
        const inTitle = chartTitleText({
            definition: definitionFor({ title: "Canada's government debt" }),
            entities: ["Canada"],
            window: WINDOW,
            grain: "fiscal-year",
            locale: "en",
            relative: false,
        })
        expect(inTitle).toBe("Canada's government debt, 2019–20 to 2023–24")
        const multi = chartTitleText({
            definition: definitionFor({}),
            entities: ["Ontario", "Quebec"],
            window: WINDOW,
            grain: "fiscal-year",
            locale: "en",
            relative: false,
        })
        expect(multi).toBe("Government debt, 2019–20 to 2023–24")
    })

    it("collapses the time annotation for a single-time window", () => {
        const title = chartTitleText({
            definition: definitionFor({}),
            entities: ["Ontario", "Quebec"],
            window: { start: 2023, end: 2023 },
            grain: "fiscal-year",
            locale: "en",
            relative: false,
        })
        expect(title).toBe("Government debt, 2023–24")
    })

    it("prefixes 'Change in' in relative mode", () => {
        const title = chartTitleText({
            definition: definitionFor({}),
            entities: ["Canada"],
            window: WINDOW,
            grain: "fiscal-year",
            locale: "en",
            relative: true,
        })
        expect(title).toBe("Change in Government debt, Canada, 2019–20 to 2023–24")
    })

    it("each annotation is independently suppressible", () => {
        const definition = definitionFor({
            titleAnnotations: { entity: false, time: false, changePrefix: false },
        })
        const title = chartTitleText({
            definition,
            entities: ["Canada"],
            window: WINDOW,
            grain: "fiscal-year",
            locale: "en",
            relative: true,
        })
        expect(title).toBe("Government debt")
    })

    it("omits the time annotation for grain none", () => {
        const title = chartTitleText({
            definition: definitionFor({}),
            entities: ["Ontario", "Quebec"],
            window: null,
            grain: "none",
            locale: "en",
            relative: false,
        })
        expect(title).toBe("Government debt")
    })
})

describe("chrome logo", () => {
    const governmentDebt = loadFixtureDataset("government-debt").dataset
    const base = {
        definition: definitionFor({ subtitle: "Federal, provincial, and municipal debt" }),
        manifest: governmentDebt.manifest,
        locale: "en" as const,
        measurer: defaultMeasurer,
        size: { width: 850, height: 600 },
        mode: "full" as const,
        fontScale: 1,
        window: WINDOW,
        grain: "year" as const,
        entities: ["Canada"],
        relative: false,
    }

    it("always places the Build Canada square logo in the top-right chrome", () => {
        const layout = layoutChrome({ ...base, theme: buildCanadaTheme })
        const logo = layout.nodes.find((node) => node.key === "chrome/logo/build-canada-square")
        expect(logo).toMatchObject({
            kind: "image",
            role: "chrome",
            rect: { x: 786.4, y: 16, width: 47.6, height: 47.6 },
            href: BUILD_CANADA_SQUARE_LOGO_DATA_URI,
        })
        expect(layout.contentArea.y).toBe(71.6)
    })

    it("uses the Canada Spends logo for the Canada Spends theme", () => {
        const layout = layoutChrome({ ...base, theme: canadaSpendsTheme })
        const logo = layout.nodes.find((node) => node.key === "chrome/logo/canada-spends")
        expect(logo).toMatchObject({
            kind: "image",
            role: "chrome",
            rect: { x: 679.0315789473684, y: 16, width: 154.96842105263158, height: 47.6 },
            href: CANADA_SPENDS_LOGO_DATA_URI,
        })
        expect(layout.contentArea.y).toBe(71.6)
    })
})
