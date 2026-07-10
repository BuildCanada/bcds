/**
 * charts validate — report ALL problems at once (spec 01 §8, spec 24).
 *
 * Accepts a chart definition file, a dataset directory (manifest.json +
 * data.csv), a single manifest.json, a {manifest, rows} JSON file, or a
 * bundled fixture name. The input kind is detected, the full diagnostic set
 * runs (manifest parse, dataset validate, definition parse + resolveBindings
 * + resolveDefinitionTimes when both sides are available), every Diagnostic
 * prints to stderr one per line, and a summary line goes to stdout.
 * Exit code 1 when any error, 0 otherwise.
 */

import { defineCommand } from "citty"
import { existsSync, statSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"

import { parseDefinition, parseManifest, resolveBindings, resolveDefinitionTimes } from "../core/index.ts"
import type { Diagnostic } from "../core/types.ts"
import { CliFailure, countErrors, printDiagnostics } from "./errors.ts"
import {
    isFixtureName,
    loadDataset,
    loadDatasetDir,
    loadDatasetJsonFile,
    loadFixtureByName,
    readJsonFile,
} from "./loadInputs.ts"

export type InputKind = "definition" | "dataset-dir" | "dataset-file" | "manifest" | "fixture"

export interface ValidateResult {
    kind: InputKind | null
    diagnostics: Diagnostic[]
    errors: number
    warnings: number
}

function summarize(kind: InputKind | null, diagnostics: Diagnostic[]): ValidateResult {
    const errors = countErrors(diagnostics)
    return { kind, diagnostics, errors, warnings: diagnostics.length - errors }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Full validation of a definition: parse + dataset + bindings + times. */
function validateDefinition(raw: unknown, baseDir: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = []
    const parsed = parseDefinition(raw)
    diagnostics.push(...parsed.diagnostics)
    if (parsed.definition === null) return diagnostics

    const data = loadDataset(parsed.definition.data, [baseDir, process.cwd()])
    diagnostics.push(...data.diagnostics)
    if (data.manifest === null) return diagnostics

    diagnostics.push(...resolveBindings(parsed.definition, data.manifest).diagnostics)
    diagnostics.push(...resolveDefinitionTimes(parsed.definition, data.manifest.timeGrain).diagnostics)
    return diagnostics
}

/** Detect the input kind and run its full diagnostic set. Never throws. */
export function validateInput(input: string): ValidateResult {
    const path = resolve(input)
    const stat = statSync(path, { throwIfNoEntry: false })

    if (stat?.isDirectory()) {
        if (!existsSync(join(path, "manifest.json"))) {
            return summarize("dataset-dir", [
                {
                    severity: "error",
                    code: "manifest-missing",
                    message: `Directory has no manifest.json: ${path}`,
                    context: { path },
                },
            ])
        }
        return summarize("dataset-dir", loadDatasetDir(path).diagnostics)
    }

    if (stat?.isFile()) {
        if (basename(path) === "manifest.json") {
            // Validate the dataset around it when data.csv is also present.
            if (existsSync(join(dirname(path), "data.csv"))) {
                return summarize("manifest", loadDatasetDir(dirname(path)).diagnostics)
            }
            const { raw, diagnostics } = readJsonFile(path, "manifest")
            if (diagnostics.length > 0) return summarize("manifest", diagnostics)
            return summarize("manifest", parseManifest(raw).diagnostics)
        }

        const { raw, diagnostics } = readJsonFile(path, "input")
        if (diagnostics.length > 0) return summarize(null, diagnostics)

        if (isPlainObject(raw) && "manifest" in raw && "rows" in raw) {
            return summarize("dataset-file", loadDatasetJsonFile(path).diagnostics)
        }
        if (isPlainObject(raw) && !("y" in raw) && !("data" in raw) && "columns" in raw && "timeGrain" in raw) {
            return summarize("manifest", parseManifest(raw).diagnostics)
        }
        return summarize("definition", validateDefinition(raw, dirname(path)))
    }

    if (isFixtureName(input)) {
        return summarize("fixture", loadFixtureByName(input).diagnostics)
    }

    return summarize(null, [
        {
            severity: "error",
            code: "input-not-found",
            message: `Input "${input}" is not a file, directory, or bundled fixture name`,
            context: { input },
        },
    ])
}

interface ValidateArgs {
    input: string
}

export function runValidate(args: ValidateArgs): void {
    const result = validateInput(args.input)
    printDiagnostics(result.diagnostics)
    process.stdout.write(`${result.errors} errors, ${result.warnings} warnings\n`)
    if (result.errors > 0) throw new CliFailure()
}

export const validateCommand = defineCommand({
    meta: {
        name: "validate",
        description: "Validate a chart definition, dataset directory, or manifest — all errors at once",
    },
    args: {
        input: {
            type: "positional",
            description: "Definition JSON, dataset directory, manifest.json, {manifest, rows} JSON, or fixture name",
            required: true,
        },
    },
    run({ args }) {
        runValidate(args as unknown as ValidateArgs)
    },
})
