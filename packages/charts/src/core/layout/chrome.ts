/**
 * Frame chrome geometry (spec 10 §1–2): header (title + subtitle) and footer
 * (source and note) text nodes, plus the content rectangle left
 * for legend + plot. Interactive chrome components (tabs, controls,
 * timeline) are M9's — this module lays out static text geometry only.
 *
 * Title auto-annotations per spec 02 §1: appended entity name (single entity
 * not already in the title), appended time reflecting the current window,
 * and a "Change in" prefix in relative mode — each suppressible via
 * titleAnnotations.
 */

import { formatTimeRange } from "../format/timeLabels.ts"
import type { Rect, SceneNode } from "../scene/nodes.ts"
import type { TextMeasurer } from "../text/measurer.ts"
import { shrinkToFit } from "../text/wrap.ts"
import { wrapText, LINE_HEIGHT } from "../text/wrap.ts"
import { truncateWithEllipsis } from "../text/truncate.ts"
import {
    BUILD_CANADA_SQUARE_LOGO_ASPECT_RATIO,
    BUILD_CANADA_SQUARE_LOGO_DATA_URI,
    CANADA_SPENDS_LOGO_ASPECT_RATIO,
    CANADA_SPENDS_LOGO_DATA_URI,
} from "../theme/logos.ts"
import type { Theme } from "../theme/types.ts"
import type { ChartDefinition, Locale, Manifest, TimeGrain } from "../types.ts"
import type { TimeWindow } from "./context.ts"
import { footerFont, strings, subtitleFont, titleFont } from "./charts/shared.ts"

export type ChromeMode = "full" | "thumbnail" | "none"

const TITLE_MAX_LINES = 2
const TITLE_MIN_SIZE = 12
const HEADER_GAP = 8
const FOOTER_GAP = 4
const FOOTER_TOP_GAP = 10
const LOGO_GAP = 12
const LOGO_LAYOUT_ITERATIONS = 5

// ---------------------------------------------------------------------------
// Title annotation (spec 02 §1) — exported for the spec 10 title tests
// ---------------------------------------------------------------------------

export interface TitleTextInput {
    definition: ChartDefinition
    entities: readonly string[]
    window: TimeWindow | null
    grain: TimeGrain
    locale: Locale
    relative: boolean
}

export function chartTitleText(input: TitleTextInput): string {
    const { definition, entities, window, grain, locale, relative } = input
    const annotations = definition.titleAnnotations
    let title = definition.title

    if (relative && annotations.changePrefix) {
        title = locale === "fr" ? `Évolution : ${title}` : `Change in ${title}`
    }
    if (
        annotations.entity &&
        entities.length === 1 &&
        !title.toLowerCase().includes(entities[0].toLowerCase())
    ) {
        title = `${title}, ${entities[0]}`
    }
    if (annotations.time && window !== null && grain !== "none") {
        title = `${title}, ${formatTimeRange(window.start, window.end, grain, locale)}`
    }
    return title
}

// ---------------------------------------------------------------------------
// Frame layout
// ---------------------------------------------------------------------------

export interface ChromeInput {
    definition: ChartDefinition
    manifest: Manifest
    theme: Theme
    locale: Locale
    measurer: TextMeasurer
    size: { width: number; height: number }
    mode: ChromeMode
    fontScale: number
    window: TimeWindow | null
    grain: TimeGrain
    entities: readonly string[]
    relative: boolean
}

export interface ChromeLayout {
    /** Area between header and footer where legend + plot live. */
    contentArea: Rect
    nodes: SceneNode[]
    titleText: string
}

function sourceLineText(definition: ChartDefinition, manifest: Manifest, locale: Locale): string {
    const text =
        definition.sourceText ??
        manifest.sources
            .map((source) => source.name)
            .filter((name) => name !== "")
            .join("; ")
    return text === "" ? "" : `${strings(locale).source}: ${text}`
}

export function layoutChrome(input: ChromeInput): ChromeLayout {
    const { definition, manifest, theme, locale, measurer, size, mode, fontScale } = input
    const padding = theme.chrome.padding
    const innerX = padding.left
    const innerWidth = Math.max(10, size.width - padding.left - padding.right)
    const nodes: SceneNode[] = []

    const titleText = chartTitleText({
        definition,
        entities: input.entities,
        window: input.window,
        grain: input.grain,
        locale,
        relative: input.relative,
    })

    let cursorY = padding.top

    // --- Header ---------------------------------------------------------------
    if (mode !== "none") {
        const header = solveHeaderLayout({
            definition,
            titleText,
            mode,
            fontScale,
            innerWidth,
            theme,
            measurer,
        })
        const { logoHeight, logoWidth, title, subtitle } = header
        const logoX = innerX + innerWidth - logoWidth
        nodes.push(brandLogoNode(theme, logoX, cursorY, logoWidth, logoHeight))

        title.lines.forEach((line, index) => {
            const metrics = measurer.measure(line, title.font)
            nodes.push({
                key: `chrome/title/line-${index}`,
                role: "chrome",
                kind: "text",
                position: { x: innerX, y: cursorY + index * LINE_HEIGHT * title.font.sizePx + metrics.ascent },
                text: line,
                font: title.font,
                anchor: "start",
                colour: theme.chrome.title,
                measured: metrics,
            })
        })

        if (subtitle !== undefined) {
            subtitle.lines.forEach((line, index) => {
                const metrics = measurer.measure(line, subtitle.font)
                nodes.push({
                    key: `chrome/subtitle/line-${index}`,
                    role: "chrome",
                    kind: "text",
                    position: {
                        x: innerX,
                        y: cursorY + subtitle.offsetY + index * LINE_HEIGHT * subtitle.font.sizePx + metrics.ascent,
                    },
                    text: line,
                    font: subtitle.font,
                    anchor: "start",
                    colour: theme.chrome.subtitle,
                    measured: metrics,
                })
            })
        }
        cursorY += header.height + HEADER_GAP
    }

    // --- Footer (bottom-up) ------------------------------------------------------
    const font = footerFont(fontScale)
    const lineHeight = LINE_HEIGHT * font.sizePx
    interface FooterLine {
        key: string
        text: string
        anchor: "start" | "end"
    }
    const footerLines: FooterLine[] = []
    if (mode === "full") {
        if (definition.note !== undefined && definition.note !== "") {
            footerLines.push({ key: "chrome/note", text: definition.note, anchor: "start" })
        }
        const source = sourceLineText(definition, manifest, locale)
        if (source !== "") footerLines.push({ key: "chrome/source", text: source, anchor: "start" })
    }
    let footerTop = size.height - padding.bottom
    if (footerLines.length > 0) {
        footerTop -= footerLines.length * lineHeight + (footerLines.length - 1) * FOOTER_GAP + FOOTER_TOP_GAP
        let lineY = footerTop + FOOTER_TOP_GAP
        for (const line of footerLines) {
            const text = truncateWithEllipsis(line.text, font, innerWidth, measurer)
            const metrics = measurer.measure(text, font)
            nodes.push({
                key: line.key,
                role: "chrome",
                kind: "text",
                position: {
                    x: line.anchor === "end" ? innerX + innerWidth : innerX,
                    y: lineY + metrics.ascent,
                },
                text,
                font,
                anchor: line.anchor,
                colour: theme.chrome.tickLabel,
                measured: metrics,
            })
            lineY += lineHeight + FOOTER_GAP
        }
    }

    const contentArea: Rect = {
        x: innerX,
        y: cursorY,
        width: innerWidth,
        height: Math.max(10, footerTop - cursorY),
    }

    return { contentArea, nodes, titleText }
}

interface HeaderLayoutInput {
    definition: ChartDefinition
    titleText: string
    mode: ChromeMode
    fontScale: number
    innerWidth: number
    theme: Theme
    measurer: TextMeasurer
}

interface HeaderTextLayout {
    logoHeight: number
    logoWidth: number
    height: number
    title: {
        lines: string[]
        font: ReturnType<typeof titleFont>
        height: number
    }
    subtitle?: {
        lines: string[]
        font: ReturnType<typeof subtitleFont>
        height: number
        offsetY: number
    }
}

function solveHeaderLayout(input: HeaderLayoutInput): HeaderTextLayout {
    const aspectRatio = logoAspectRatio(input.theme)
    let logoHeight = LINE_HEIGHT * titleFont(input.fontScale).sizePx
    let layout = measureHeaderText(input, logoHeight * aspectRatio)

    for (let i = 0; i < LOGO_LAYOUT_ITERATIONS; i++) {
        logoHeight = layout.height
        const next = measureHeaderText(input, logoHeight * aspectRatio)
        if (Math.abs(next.height - layout.height) < 0.01) {
            layout = next
            break
        }
        layout = next
    }

    logoHeight = layout.height
    return {
        ...layout,
        logoHeight,
        logoWidth: logoHeight * aspectRatio,
    }
}

function measureHeaderText(input: HeaderLayoutInput, logoWidth: number): Omit<HeaderTextLayout, "logoHeight" | "logoWidth"> {
    const textWidth = Math.max(10, input.innerWidth - logoWidth - LOGO_GAP)
    const title = shrinkToFit(
        input.titleText,
        titleFont(input.fontScale),
        textWidth,
        TITLE_MAX_LINES,
        input.measurer,
        TITLE_MIN_SIZE,
    )
    const titleHeight = title.lines.length * LINE_HEIGHT * title.font.sizePx

    if (input.mode !== "full" || input.definition.subtitle === undefined || input.definition.subtitle === "") {
        return {
            height: titleHeight,
            title: { lines: title.lines, font: title.font, height: titleHeight },
        }
    }

    const subtitleFontSpec = subtitleFont(input.fontScale)
    const subtitle = wrapText(input.definition.subtitle, subtitleFontSpec, textWidth, input.measurer)
    return {
        height: titleHeight + HEADER_GAP + subtitle.height,
        title: { lines: title.lines, font: title.font, height: titleHeight },
        subtitle: {
            lines: subtitle.lines,
            font: subtitleFontSpec,
            height: subtitle.height,
            offsetY: titleHeight + HEADER_GAP,
        },
    }
}

function logoAspectRatio(theme: Theme): number {
    return theme.branding.logo === "canada-spends"
        ? CANADA_SPENDS_LOGO_ASPECT_RATIO
        : BUILD_CANADA_SQUARE_LOGO_ASPECT_RATIO
}

function brandLogoNode(theme: Theme, x: number, y: number, width: number, height: number): SceneNode {
    return {
        key: `chrome/logo/${theme.branding.logo}`,
        role: "chrome",
        kind: "image",
        href:
            theme.branding.logo === "canada-spends"
                ? CANADA_SPENDS_LOGO_DATA_URI
                : BUILD_CANADA_SQUARE_LOGO_DATA_URI,
        rect: { x, y, width, height },
        preserveAspectRatio: "xMidYMid meet",
    }
}
