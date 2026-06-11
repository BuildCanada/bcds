/**
 * Definition versioning & migration. Spec 02 §4.
 *
 * Definitions carry a `schemaVersion`; loading an older version migrates it
 * forward deterministically before schema parsing. A missing schemaVersion
 * is read as 1. Versions newer than CURRENT_SCHEMA_VERSION are an error —
 * we never guess at fields from the future.
 */

import type { Diagnostic } from "../types.ts"

export const CURRENT_SCHEMA_VERSION = 1

export interface DefinitionMigration {
    /** The version this migration upgrades FROM (it produces `from + 1`). */
    from: number
    description: string
    apply: (raw: Record<string, unknown>) => Record<string, unknown>
}

/**
 * Ordered migration scaffold. v1 is current, so the list is empty; when a
 * v2 schema lands, add `{ from: 1, description, apply }` here and bump
 * CURRENT_SCHEMA_VERSION. Each migration is a pure raw → raw function so
 * fixture definitions at historical versions replay identically.
 */
export const definitionMigrations: readonly DefinitionMigration[] = []

export interface MigrateDefinitionResult {
    /** null when migration is impossible (see diagnostics). */
    raw: Record<string, unknown> | null
    diagnostics: Diagnostic[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function migrationError(code: string, message: string, context?: Record<string, string | number>): MigrateDefinitionResult {
    return {
        raw: null,
        diagnostics: [{ severity: "error", code, message, ...(context !== undefined ? { context } : {}) }],
    }
}

/**
 * Bring a raw definition object up to CURRENT_SCHEMA_VERSION by replaying
 * the migrations from its declared version. Missing schemaVersion ⇒ 1.
 */
export function migrateDefinition(raw: unknown): MigrateDefinitionResult {
    if (!isPlainObject(raw)) {
        return migrationError("definition-invalid", "Chart definition must be a JSON object")
    }

    const declared = raw.schemaVersion ?? 1
    if (typeof declared !== "number" || !Number.isInteger(declared) || declared < 1) {
        return migrationError(
            "definition-invalid",
            `schemaVersion must be a positive integer, got ${JSON.stringify(declared)}`,
        )
    }
    if (declared > CURRENT_SCHEMA_VERSION) {
        return migrationError(
            "unknown-schema-version",
            `Definition declares schemaVersion ${declared} but this build only understands up to ${CURRENT_SCHEMA_VERSION}`,
            { schemaVersion: declared, current: CURRENT_SCHEMA_VERSION },
        )
    }

    let current: Record<string, unknown> = { ...raw }
    for (let version = declared; version < CURRENT_SCHEMA_VERSION; version++) {
        const migration = definitionMigrations.find((candidate) => candidate.from === version)
        if (migration === undefined) {
            return migrationError(
                "missing-migration",
                `No migration registered from schemaVersion ${version}`,
                { schemaVersion: version },
            )
        }
        current = migration.apply(current)
    }

    current.schemaVersion = CURRENT_SCHEMA_VERSION
    return { raw: current, diagnostics: [] }
}
