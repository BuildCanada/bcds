import type { FontSpec, TextMeasurer } from "./measurer.ts"
import { truncateWithEllipsis } from "./truncate.ts"

/** Line height multiplier: line box = LINE_HEIGHT × sizePx. */
export const LINE_HEIGHT = 1.2

export interface WrappedText {
    lines: string[]
    /** Width of the widest line in px. */
    width: number
    /** lines.length × LINE_HEIGHT × sizePx. */
    height: number
}

export interface ShrunkText {
    font: FontSpec
    lines: string[]
}

function wrapParagraph(
    paragraph: string,
    font: FontSpec,
    maxWidth: number,
    measurer: TextMeasurer,
): string[] {
    const words = paragraph.split(" ").filter((w) => w.length > 0)
    if (words.length === 0) return [""]
    const lines: string[] = []
    let line = ""
    for (const word of words) {
        const candidate = line === "" ? word : `${line} ${word}`
        if (measurer.measure(candidate, font).width <= maxWidth) {
            line = candidate
            continue
        }
        if (line !== "") {
            lines.push(line)
            line = ""
        }
        if (measurer.measure(word, font).width <= maxWidth) {
            line = word
            continue
        }
        // A single word wider than maxWidth: hard-break by codepoint, no hyphen.
        let chunk = ""
        for (const ch of word) {
            const next = chunk + ch
            if (chunk !== "" && measurer.measure(next, font).width > maxWidth) {
                lines.push(chunk)
                chunk = ch
            } else {
                chunk = next
            }
        }
        line = chunk
    }
    if (line !== "") lines.push(line)
    return lines
}

/**
 * Greedy word wrap. Breaks on spaces; never mid-word unless a single word
 * exceeds maxWidth, in which case it hard-breaks by codepoint (no hyphen).
 * Explicit "\n" forces a line break. Empty text wraps to zero lines.
 */
export function wrapText(
    text: string,
    font: FontSpec,
    maxWidth: number,
    measurer: TextMeasurer,
): WrappedText {
    if (text === "") return { lines: [], width: 0, height: 0 }
    const lines = text
        .split("\n")
        .flatMap((paragraph) => wrapParagraph(paragraph, font, maxWidth, measurer))
    let width = 0
    for (const line of lines) {
        width = Math.max(width, measurer.measure(line, font).width)
    }
    return { lines, width, height: lines.length * LINE_HEIGHT * font.sizePx }
}

/**
 * Stepwise shrink-to-fit (spec 10 §2): step sizePx down 0.5px at a time
 * until the wrapped text fits within maxWidth × maxLines, or minSizePx is
 * reached — then keep maxLines lines and truncate the last with an ellipsis
 * (never silently clipped).
 */
export function shrinkToFit(
    text: string,
    font: FontSpec,
    maxWidth: number,
    maxLines: number,
    measurer: TextMeasurer,
    minSizePx: number,
): ShrunkText {
    let sizePx = font.sizePx
    for (;;) {
        const trial: FontSpec = { ...font, sizePx }
        const wrapped = wrapText(text, trial, maxWidth, measurer)
        if (wrapped.lines.length <= maxLines && wrapped.width <= maxWidth) {
            return { font: trial, lines: wrapped.lines }
        }
        if (sizePx <= minSizePx) break
        sizePx = Math.max(minSizePx, sizePx - 0.5)
    }
    const finalFont: FontSpec = { ...font, sizePx: minSizePx }
    const wrapped = wrapText(text, finalFont, maxWidth, measurer)
    const lines = wrapped.lines.slice(0, maxLines)
    if (wrapped.lines.length > maxLines && lines.length > 0) {
        const overflow = wrapped.lines.slice(maxLines - 1).join(" ")
        lines[lines.length - 1] = truncateWithEllipsis(overflow, finalFont, maxWidth, measurer)
    }
    return { font: finalFont, lines }
}
