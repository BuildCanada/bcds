/**
 * Committed fixture datasets (spec 26 §2). Each fixture is a TypeScript
 * module exporting CSV text and a raw manifest object — no fs access
 * needed in tests, and the browser/Storybook can import them directly.
 */

import { buildDataset, type BuildDatasetResult } from "../core/data/dataset.ts"
import { parseManifest } from "../core/data/manifest.ts"
import { parseCsv } from "../core/data/parse.ts"
import type { Dataset, Diagnostic, Manifest } from "../core/types.ts"
import { federalDepartments } from "./federal-departments.ts"
import { governmentDebt } from "./government-debt.ts"
import { pathological } from "./pathological.ts"
import { populationSnapshot } from "./population-snapshot.ts"
import { provincialBudgets } from "./provincial-budgets.ts"
import type { Fixture } from "./types.ts"

export type { Fixture } from "./types.ts"
export { federalDepartments, governmentDebt, pathological, populationSnapshot, provincialBudgets }

export const fixtures = {
    "provincial-budgets": provincialBudgets,
    "federal-departments": federalDepartments,
    "population-snapshot": populationSnapshot,
    "government-debt": governmentDebt,
    pathological: pathological,
} as const

export type FixtureName = keyof typeof fixtures

export const fixtureNames = Object.keys(fixtures) as FixtureName[]

/** Look up a fixture's raw CSV + manifest by name. */
export function loadFixture(name: FixtureName): Fixture {
    return fixtures[name]
}

export interface LoadedFixtureDataset {
    manifest: Manifest
    dataset: Dataset
    /** Manifest + parse + build diagnostics, concatenated. */
    diagnostics: Diagnostic[]
}

/**
 * Convenience loader: parse the fixture's manifest and CSV and build the
 * Dataset. Throws if the manifest itself is invalid (fixtures are
 * committed, so that is a programming error); data-level diagnostics
 * (e.g. the pathological fixture's duplicates) are returned, not thrown.
 */
export function loadFixtureDataset(name: FixtureName): LoadedFixtureDataset {
    const fixture = fixtures[name]
    const { manifest, diagnostics: manifestDiagnostics } = parseManifest(fixture.manifest)
    if (manifest === null) {
        throw new Error(`Fixture "${name}" has an invalid manifest: ${manifestDiagnostics.map((d) => d.message).join("; ")}`)
    }
    const parsed = parseCsv(fixture.csv, manifest)
    const built: BuildDatasetResult = buildDataset(manifest, parsed.rows)
    return {
        manifest,
        dataset: built.dataset,
        diagnostics: [...manifestDiagnostics, ...parsed.diagnostics, ...built.diagnostics],
    }
}
