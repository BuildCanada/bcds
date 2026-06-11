/**
 * Built-in themes (spec 04 §4).
 *
 * Build Canada and Canada Spends ship as the first two themes. A new brand
 * is a new Theme document here (plus, optionally, new palettes in
 * @buildcanada/colours) — zero chart-code changes.
 *
 * Categorical palettes mirror the production `charts` Grapher defaults
 * (Distinct and Distinct lines). Sequential scales still come from
 * @buildcanada/colours by identity.
 */

import { auburn, charcoal, lake, linen, nickel } from "@buildcanada/colours"

import type { HexColour } from "../types.ts"
import type { Theme } from "./types.ts"

const soehneStack = "\"Söhne Kräftig\", \"Helvetica Neue\", Arial, sans-serif"
const monoStack = "\"Founders Grotesk Mono\", Menlo, monospace"

// Ported from packages/charts/src/grapher/color/CustomSchemes.ts:
// Grapher's Distinct (Palette A) and Distinct lines palettes are the current
// production defaults for multi-series charts.
export const grapherDistinctPalette: readonly HexColour[] = [
    "#4c6a9c",
    "#883039",
    "#578145",
    "#b13507",
    "#b16214",
    "#970046",
    "#d73c50",
    "#00295b",
    "#00847e",
    "#bc8e5a",
    "#a2559c",
    "#18470f",
]

export const grapherDistinctLinesPalette: readonly HexColour[] = [
    "#4c6a9c",
    "#b13507",
    "#996d39",
    "#2c8465",
    "#6d3e91",
    "#883039",
    "#00295b",
    "#a2559c",
    "#9a5129",
    "#008291",
    "#970046",
    "#338711",
    "#c4523e",
    "#286bbb",
    "#18470f",
    "#d73c50",
    "#b16214",
    "#00847e",
    "#cf0a66",
    "#578145",
    "#be5915",
    "#8c4569",
    "#00875e",
    "#c15065",
]

/** Shared typography: both brands set in Söhne with Founders Grotesk Mono. */
const typography: Theme["typography"] = {
    fonts: {
        heading: { stack: soehneStack, metricsId: "soehne-kraftig" },
        body: { stack: soehneStack, metricsId: "soehne-kraftig" },
        mono: { stack: monoStack, metricsId: "founders-grotesk-mono-regular" },
    },
    baseSizePx: 16,
}

export const buildCanadaTheme: Theme = {
    name: "build-canada",
    palette: {
        categorical: grapherDistinctLinesPalette,
        noData: nickel["300"],
        dimOpacity: 0.35,
        sequentialScale: lake,
    },
    branding: {
        logo: "build-canada-square",
    },
    typography,
    chrome: {
        background: linen["50"],
        gridline: nickel["200"],
        axisLine: nickel["400"],
        tickLabel: charcoal["600"],
        title: charcoal["1000"],
        subtitle: charcoal["700"],
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
    },
    attribution: {
        text: "Powered by Build Canada Charts",
        url: "https://buildcanada.com",
    },
    localeDefault: "en",
}

export const canadaSpendsTheme: Theme = {
    name: "canada-spends",
    palette: {
        categorical: grapherDistinctPalette,
        noData: nickel["300"],
        dimOpacity: 0.35,
        sequentialScale: auburn,
    },
    branding: {
        logo: "canada-spends",
    },
    typography,
    chrome: {
        background: "#ffffff",
        gridline: charcoal["200"],
        axisLine: charcoal["400"],
        tickLabel: charcoal["600"],
        title: charcoal["1000"],
        subtitle: charcoal["700"],
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
    },
    attribution: {
        text: "Canada Spends",
        url: "https://canadaspends.com",
    },
    localeDefault: "en",
}
