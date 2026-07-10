/**
 * Committed font metrics tables (spec 28 §3).
 *
 * Role mapping: heading and body both use Söhne Kräftig (chart UI text),
 * mono uses Founders Grotesk Mono. Financier Text is loaded and exported
 * separately (serifTable) for future long-form use; it is not mapped to a
 * FontRole yet.
 */

import financierTextRegular from "../../fonts/metrics/financier-text-regular.json" with { type: "json" }
import foundersGroteskMonoRegular from "../../fonts/metrics/founders-grotesk-mono-regular.json" with { type: "json" }
import soehneKraftig from "../../fonts/metrics/soehne-kraftig.json" with { type: "json" }
import type { FontMetricsTable, FontRole } from "./measurer.ts"

export const headingTable: FontMetricsTable = soehneKraftig
export const bodyTable: FontMetricsTable = soehneKraftig
export const monoTable: FontMetricsTable = foundersGroteskMonoRegular

/** Financier Text — reserved for future long-form use (not a FontRole). */
export const serifTable: FontMetricsTable = financierTextRegular

export const tables: Record<FontRole, FontMetricsTable> = {
    heading: headingTable,
    body: bodyTable,
    mono: monoTable,
}

/**
 * SVG font-family name for a role, taken from the table's own familyName
 * (e.g. "Söhne Kräftig" with umlaut) — never hand-typed strings (spec 28 §3).
 */
export function familyNameFor(role: FontRole): string {
    return tables[role].familyName
}
