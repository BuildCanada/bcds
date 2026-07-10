import type { FontSpec, TextMeasurer } from "./measurer.ts"

const ELLIPSIS = "…"

/**
 * Truncate text to fit maxWidth, appending a single "…" character.
 * Returns the text unchanged if it already fits. Trailing spaces are
 * trimmed before the ellipsis. Returns "" if not even "…" fits.
 */
export function truncateWithEllipsis(
    text: string,
    font: FontSpec,
    maxWidth: number,
    measurer: TextMeasurer,
): string {
    if (measurer.measure(text, font).width <= maxWidth) return text
    if (measurer.measure(ELLIPSIS, font).width > maxWidth) return ""
    const codepoints = [...text]
    for (let n = codepoints.length - 1; n > 0; n--) {
        const candidate = codepoints.slice(0, n).join("").trimEnd() + ELLIPSIS
        if (measurer.measure(candidate, font).width <= maxWidth) return candidate
    }
    return ELLIPSIS
}
