/**
 * Frozen theme contract (spec 04 §4).
 *
 * A theme bundles every brand visual decision: series colours, typography,
 * chrome, attribution, and the brand mark rendered into chart output.
 */

import type { HexColour, Locale } from "../types.ts"
import type { FontRole } from "../text/measurer.ts"

export interface FontFamilyDef {
    /** CSS font-family stack; first entry is the brand font family name. */
    stack: string
    /** Metrics table id under src/fonts/metrics/ (e.g. "soehne-kraftig"). */
    metricsId: string
}

export interface ThemePalette {
    /** Ordered categorical palette used for series assignment. */
    categorical: readonly HexColour[]
    /** Reserved neutral for missing data; never assigned to a series. */
    noData: HexColour
    /** Opacity applied to dimmed (non-emphasized) series. */
    dimOpacity: number
    /** Named 50–950 scale used for sequential ramps (future maps pass). */
    sequentialScale: Readonly<Record<string, HexColour>>
}

export interface ThemeChrome {
    background: HexColour
    plotBackground?: HexColour
    gridline: HexColour
    axisLine: HexColour
    tickLabel: HexColour
    title: HexColour
    subtitle: HexColour
    /** Frame padding in px. */
    padding: { top: number; right: number; bottom: number; left: number }
}

export interface ThemeAttribution {
    text: string
    url?: string
    licenseText?: string
}

export interface ThemeBranding {
    logo: "build-canada-square" | "canada-spends"
}

export interface Theme {
    name: string
    palette: ThemePalette
    branding: ThemeBranding
    typography: {
        fonts: Record<FontRole, FontFamilyDef>
        baseSizePx: number
    }
    chrome: ThemeChrome
    attribution: ThemeAttribution
    localeDefault: Locale
}
