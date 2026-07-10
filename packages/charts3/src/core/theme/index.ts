import {
    auburn,
    charcoal,
    cerulean,
    emerald,
    lake,
    lake_maritime_blend,
    linen,
    nickel,
    pine,
    sienna,
    steel,
} from "@buildcanada/colours/styles"
import type { ChartTheme } from "../types"

const buildCanadaPalette = [
    auburn["500"],
    cerulean["700"],
    sienna["500"],
    emerald["600"],
    charcoal["700"],
    pine["600"],
    lake["700"],
    auburn["700"],
    sienna["700"],
    steel["600"],
    cerulean["500"],
    charcoal["500"],
]

export const buildCanadaTheme: ChartTheme = {
    name: "build-canada",
    background: linen["50"],
    surface: "#ffffff",
    text: charcoal["900"],
    mutedText: charcoal["600"],
    accent: auburn["500"],
    border: linen["200"],
    grid: linen["200"],
    axis: charcoal["700"],
    noData: nickel["200"],
    projectedPattern: nickel["500"],
    categoricalPalette: buildCanadaPalette,
    fontFamily: "'Soehne Kraftig', 'Helvetica Neue', Arial, sans-serif",
    bodyFontFamily: "'Financier Text', Georgia, serif",
    monoFontFamily: "'Founders Grotesk Mono', Menlo, monospace",
    titleSize: 26,
    labelSize: 12,
    tickSize: 10,
    attribution: "Build Canada",
    attributionUrl: "buildcanada.com",
}

export const canadaSpendsTheme: ChartTheme = {
    name: "canada-spends",
    background: linen["50"],
    surface: "#ffffff",
    text: charcoal["900"],
    mutedText: charcoal["600"],
    accent: lake["700"],
    border: nickel["200"],
    grid: nickel["200"],
    axis: nickel["500"],
    noData: nickel["300"],
    projectedPattern: nickel["500"],
    categoricalPalette: lake_maritime_blend,
    fontFamily: "'Soehne Kraftig', 'Helvetica Neue', Arial, sans-serif",
    bodyFontFamily: "'Financier Text', Georgia, serif",
    monoFontFamily: "Founders Grotesk Mono, Menlo, monospace",
    titleSize: 24,
    labelSize: 12,
    tickSize: 11,
    attribution: "Canada Spends",
    attributionUrl: "canadaspends.com",
}

export const themes: Record<string, ChartTheme> = {
    [buildCanadaTheme.name]: buildCanadaTheme,
    [canadaSpendsTheme.name]: canadaSpendsTheme,
}

export const resolveTheme = (theme?: string | ChartTheme): ChartTheme => {
    if (!theme) return buildCanadaTheme
    if (typeof theme !== "string") return theme
    return themes[theme] ?? buildCanadaTheme
}

export const sequentialRamp = (scale: "pine" | "lake" | "nickel" = "pine"): string[] => {
    const source = scale === "lake" ? lake : scale === "nickel" ? nickel : pine
    return [
        source["50"],
        source["100"],
        source["200"],
        source["300"],
        source["400"],
        source["500"],
        source["600"],
        source["700"],
        source["800"],
        source["900"],
        source["950"],
    ]
}

export const assignSeriesColours = (
    seriesIds: string[],
    theme: Pick<ChartTheme, "categoricalPalette">,
    fixed: Record<string, string | undefined> = {}
): Record<string, string> => {
    const colours: Record<string, string> = {}
    let paletteIndex = 0

    for (const id of seriesIds) {
        if (fixed[id]) {
            colours[id] = fixed[id]
            continue
        }

        colours[id] = theme.categoricalPalette[paletteIndex % theme.categoricalPalette.length]
        paletteIndex += 1
    }

    return colours
}
