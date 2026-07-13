/**
 * CLI input loading: definition files, dataset references, URL-style state.
 *
 * The CLI is the ONLY part of the package allowed to touch the filesystem
 * (spec 28 §1); every parse step here delegates to pure src/core functions.
 *
 * A definition's `data` field resolves in order (spec 24):
 *   (a) a directory containing manifest.json + data.csv,
 *   (b) a single JSON file { manifest, rows },
 *   (c) a bundled fixture name (provincial-budgets, government-debt, …),
 * relative to the definition file's directory first, then the cwd.
 */

import { existsSync, readFileSync, statSync } from "node:fs"
import { join, resolve } from "node:path"

import type { ParsedRows } from "../core/data/parse.ts"
import {
    buildDataset,
    paramsToViewState,
    parseCsv,
    parseDefinition,
    parseJsonRows,
    parseManifest,
    validateDataset,
} from "../core/index.ts"
import type { ChartDefinition, Dataset, Diagnostic, Manifest, TimeGrain, ViewState } from "../core/types.ts"
import { fixtureNames, fixtures, type FixtureName } from "../fixtures/index.ts"

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function ioDiagnostic(code: string, message: string, path: string): Diagnostic {
    return { severity: "error", code, message, context: { path } }
}

interface ReadJsonResult {
    raw: unknown
    diagnostics: Diagnostic[]
}

/** Read + JSON.parse a file; failures become error Diagnostics, never throws. */
export function readJsonFile(path: string, what: string): ReadJsonResult {
    let text: string
    try {
        text = readFileSync(path, "utf8")
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            raw: undefined,
            diagnostics: [ioDiagnostic(`${what}-unreadable`, `Could not read ${what} file: ${message}`, path)],
        }
    }
    try {
        return { raw: JSON.parse(text), diagnostics: [] }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            raw: undefined,
            diagnostics: [ioDiagnostic(`${what}-invalid-json`, `${what} file is not valid JSON: ${message}`, path)],
        }
    }
}

/**
 * validateDataset and buildDataset intentionally overlap (duplicate rows,
 * bad times, non-numeric cells are reported by both so each is usable
 * standalone). The CLI runs both, so drop repeats: two diagnostics with the
 * same severity, code, and context describe the same problem.
 */
export function dedupeDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
    const seen = new Set<string>()
    const out: Diagnostic[] = []
    for (const diagnostic of diagnostics) {
        const key = `${diagnostic.severity}|${diagnostic.code}|${JSON.stringify(diagnostic.context ?? diagnostic.message)}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push(diagnostic)
    }
    return out
}

// ---------------------------------------------------------------------------
// loadDefinition
// ---------------------------------------------------------------------------

export interface LoadDefinitionResult {
    /** null when the file is unreadable/invalid (see diagnostics). */
    definition: ChartDefinition | null
    diagnostics: Diagnostic[]
}

/** Definition JSON file → migrate → parse, collecting all diagnostics. */
export function loadDefinition(path: string): LoadDefinitionResult {
    const { raw, diagnostics } = readJsonFile(path, "definition")
    if (diagnostics.length > 0) return { definition: null, diagnostics }
    // parseDefinition runs migrateDefinition internally and reports both.
    return parseDefinition(raw)
}

// ---------------------------------------------------------------------------
// loadDataset
// ---------------------------------------------------------------------------

export interface LoadDatasetResult {
    /** null when the dataset could not be built at all (see diagnostics). */
    dataset: Dataset | null
    manifest: Manifest | null
    /** Manifest parse + row parse + validateDataset + buildDataset, deduped. */
    diagnostics: Diagnostic[]
}

/** The full diagnostic set for one raw manifest + row source. */
function buildFromRaw(manifestRaw: unknown, rowsOf: (manifest: Manifest) => ParsedRows): LoadDatasetResult {
    const { manifest, diagnostics: manifestDiagnostics } = parseManifest(manifestRaw)
    if (manifest === null) {
        return { dataset: null, manifest: null, diagnostics: manifestDiagnostics }
    }
    const parsed = rowsOf(manifest)
    const validation = validateDataset(manifest, parsed.rows)
    const built = buildDataset(manifest, parsed.rows)
    return {
        dataset: built.dataset,
        manifest,
        diagnostics: dedupeDiagnostics([
            ...manifestDiagnostics,
            ...parsed.diagnostics,
            ...validation,
            ...built.diagnostics,
        ]),
    }
}

/** Dataset form (a): a directory containing manifest.json + data.csv. */
export function loadDatasetDir(dir: string): LoadDatasetResult {
    const manifestPath = join(dir, "manifest.json")
    const csvPath = join(dir, "data.csv")
    const { raw, diagnostics } = readJsonFile(manifestPath, "manifest")
    if (diagnostics.length > 0) return { dataset: null, manifest: null, diagnostics }
    let csv: string
    try {
        csv = readFileSync(csvPath, "utf8")
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            dataset: null,
            manifest: null,
            diagnostics: [ioDiagnostic("dataset-unreadable", `Could not read dataset CSV: ${message}`, csvPath)],
        }
    }
    return buildFromRaw(raw, (manifest) => parseCsv(csv, manifest))
}

/** Dataset form (b): a single JSON file { manifest, rows }. */
export function loadDatasetJsonFile(path: string): LoadDatasetResult {
    const { raw, diagnostics } = readJsonFile(path, "dataset")
    if (diagnostics.length > 0) return { dataset: null, manifest: null, diagnostics }
    if (typeof raw !== "object" || raw === null || Array.isArray(raw) || !("manifest" in raw) || !("rows" in raw)) {
        return {
            dataset: null,
            manifest: null,
            diagnostics: [
                ioDiagnostic(
                    "dataset-invalid",
                    'Dataset JSON file must be an object with "manifest" and "rows" fields',
                    path,
                ),
            ],
        }
    }
    const shaped = raw as { manifest: unknown; rows: unknown }
    return buildFromRaw(shaped.manifest, (manifest) => parseJsonRows(shaped.rows, manifest))
}

/** Dataset form (c): a bundled fixture name. */
export function loadFixtureByName(name: FixtureName): LoadDatasetResult {
    const fixture = fixtures[name]
    return buildFromRaw(fixture.manifest, (manifest) => parseCsv(fixture.csv, manifest))
}

export function isFixtureName(dataRef: string): dataRef is FixtureName {
    return Object.hasOwn(fixtures, dataRef)
}

/**
 * Resolve a definition's `data` reference: directory → JSON file → bundled
 * fixture, trying each search directory in order (definition dir, then cwd).
 */
export function loadDataset(
    dataRef: string,
    searchDirs: readonly string[] = [process.cwd()],
): LoadDatasetResult {
    for (const dir of searchDirs) {
        const candidate = resolve(dir, dataRef)
        const stat = statSync(candidate, { throwIfNoEntry: false })
        if (stat === undefined) continue
        if (stat.isDirectory()) {
            if (existsSync(join(candidate, "manifest.json"))) return loadDatasetDir(candidate)
            continue
        }
        if (stat.isFile()) return loadDatasetJsonFile(candidate)
    }
    if (isFixtureName(dataRef)) return loadFixtureByName(dataRef)
    return {
        dataset: null,
        manifest: null,
        diagnostics: [
            {
                severity: "error",
                code: "dataset-not-found",
                message:
                    `Dataset "${dataRef}" was not found as a directory (manifest.json + data.csv), ` +
                    `a JSON file ({manifest, rows}), or a bundled fixture (${fixtureNames.join(", ")})`,
                context: { data: dataRef },
            },
        ],
    }
}

// ---------------------------------------------------------------------------
// parseState
// ---------------------------------------------------------------------------

export interface ParseStateResult {
    state: ViewState
    diagnostics: Diagnostic[]
}

/** URL-style state string ("tab=line&time=2014-15..2024-25&entities=ON~QC") → ViewState. */
export function parseState(stateString: string, grain: TimeGrain): ParseStateResult {
    const query = stateString.startsWith("?") ? stateString.slice(1) : stateString
    return paramsToViewState(new URLSearchParams(query), grain)
}
