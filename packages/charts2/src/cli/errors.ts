/**
 * CLI error types and diagnostic printing.
 *
 * Exit-code contract (spec 24): 0 success, 1 validation/render errors,
 * 2 bad usage. Command handlers throw CliUsageError (→ 2) or CliFailure
 * (→ 1); src/cli/index.ts maps them to process exit codes.
 */

import type { Diagnostic } from "../core/types.ts"

/** Bad flags/arguments — exit code 2. */
export class CliUsageError extends Error {}

/**
 * Validation/render failure — exit code 1. An empty message means the
 * details were already printed (as diagnostics) and only the exit code
 * remains to be set.
 */
export class CliFailure extends Error {
    constructor(message = "") {
        super(message)
    }
}

/** One Diagnostic as one line: `severity code message (k=v, k=v)`. */
export function formatDiagnostic(diagnostic: Diagnostic): string {
    const entries = Object.entries(diagnostic.context ?? {})
    const context = entries.length > 0 ? ` (${entries.map(([key, value]) => `${key}=${value}`).join(", ")})` : ""
    return `${diagnostic.severity} ${diagnostic.code} ${diagnostic.message}${context}`
}

export function printDiagnostics(diagnostics: readonly Diagnostic[]): void {
    for (const diagnostic of diagnostics) {
        process.stderr.write(`${formatDiagnostic(diagnostic)}\n`)
    }
}

export function countErrors(diagnostics: readonly Diagnostic[]): number {
    return diagnostics.filter((diagnostic) => diagnostic.severity === "error").length
}

export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
    return countErrors(diagnostics) > 0
}
