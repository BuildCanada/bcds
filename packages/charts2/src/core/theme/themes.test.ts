import { auburn } from "@buildcanada/colours/styles/colours/auburn.js"
import { lake } from "@buildcanada/colours/styles/colours/lake.js"
import { describe, expect, it } from "vitest"

import type { Theme } from "./types.ts"
import { buildCanadaTheme, canadaSpendsTheme, grapherDistinctLinesPalette, grapherDistinctPalette } from "./themes.ts"
import { DEFAULT_THEME_NAME, getTheme, themeNames } from "./registry.ts"

describe("themes", () => {
    it("both themes satisfy the frozen Theme contract", () => {
        const themes: Theme[] = [buildCanadaTheme, canadaSpendsTheme]
        expect(themes.map((t) => t.name)).toEqual([
            "build-canada",
            "canada-spends",
        ])
    })

    it("buildCanadaTheme uses the charts package distinct lines palette", () => {
        expect(buildCanadaTheme.palette.categorical).toBe(grapherDistinctLinesPalette)
        expect(buildCanadaTheme.palette.categorical[0]).toBe("#4c6a9c")
        expect(buildCanadaTheme.palette.sequentialScale).toBe(lake)
    })

    it("canadaSpendsTheme uses the charts package distinct palette", () => {
        expect(canadaSpendsTheme.palette.categorical).toBe(grapherDistinctPalette)
        expect(canadaSpendsTheme.palette.categorical[0]).toBe("#4c6a9c")
        expect(canadaSpendsTheme.palette.sequentialScale).toBe(auburn)
    })

    it("categorical palettes cover production chart defaults", () => {
        expect(buildCanadaTheme.palette.categorical).toHaveLength(24)
        expect(canadaSpendsTheme.palette.categorical).toHaveLength(12)
    })

    it("themes declare a top-right logo", () => {
        expect(buildCanadaTheme.branding.logo).toBe("build-canada-square")
        expect(canadaSpendsTheme.branding.logo).toBe("canada-spends")
    })

    it("uses the same chart background across brands", () => {
        expect(canadaSpendsTheme.chrome.background).toBe(buildCanadaTheme.chrome.background)
    })

    it("noData is a reserved neutral, never in the categorical palette", () => {
        for (const theme of [buildCanadaTheme, canadaSpendsTheme]) {
            expect(theme.palette.categorical).not.toContain(theme.palette.noData)
        }
    })

    it("uses the exact font family names from the metrics tables", () => {
        const { fonts } = buildCanadaTheme.typography
        expect(fonts.heading.stack).toBe(
            "\"Söhne Kräftig\", \"Helvetica Neue\", Arial, sans-serif",
        )
        expect(fonts.heading.metricsId).toBe("soehne-kraftig")
        expect(fonts.body.metricsId).toBe("soehne-kraftig")
        expect(fonts.mono.stack).toBe(
            "\"Founders Grotesk Mono\", Menlo, monospace",
        )
        expect(fonts.mono.metricsId).toBe("founders-grotesk-mono-regular")
    })
})

describe("getTheme", () => {
    it("defaults to build-canada when no name is given", () => {
        const { theme, warning } = getTheme()
        expect(theme).toBe(buildCanadaTheme)
        expect(warning).toBeUndefined()
    })

    it("resolves registered themes by name without warnings", () => {
        expect(getTheme("build-canada").theme).toBe(buildCanadaTheme)
        expect(getTheme("canada-spends").theme).toBe(canadaSpendsTheme)
        expect(getTheme("canada-spends").warning).toBeUndefined()
    })

    it("falls back to the default with a warning for unknown names", () => {
        const { theme, warning } = getTheme("not-a-theme")
        expect(theme).toBe(buildCanadaTheme)
        expect(warning).toContain("not-a-theme")
        expect(warning).toContain(DEFAULT_THEME_NAME)
    })

    it("lists registered theme names", () => {
        expect(themeNames()).toEqual(["build-canada", "canada-spends"])
    })
})
