import { describe, expect, it } from "vitest"

import { CURRENT_SCHEMA_VERSION, definitionMigrations, migrateDefinition } from "./migrate.ts"

describe("migrateDefinition scaffold (spec 02 §4)", () => {
    it("treats a missing schemaVersion as version 1", () => {
        const { raw, diagnostics } = migrateDefinition({ title: "T", data: "d", y: ["a"] })
        expect(diagnostics).toEqual([])
        expect(raw).toEqual({ title: "T", data: "d", y: ["a"], schemaVersion: CURRENT_SCHEMA_VERSION })
    })

    it("passes a current-version definition through unchanged", () => {
        const input = { schemaVersion: CURRENT_SCHEMA_VERSION, title: "T" }
        const { raw, diagnostics } = migrateDefinition(input)
        expect(diagnostics).toEqual([])
        expect(raw).toEqual(input)
    })

    it("does not mutate the input object", () => {
        const input = { title: "T" }
        migrateDefinition(input)
        expect(input).toEqual({ title: "T" })
    })

    it("rejects an unknown future schema version with an error", () => {
        const { raw, diagnostics } = migrateDefinition({ schemaVersion: 99, title: "T" })
        expect(raw).toBeNull()
        expect(diagnostics).toEqual([
            expect.objectContaining({
                severity: "error",
                code: "unknown-schema-version",
                context: { schemaVersion: 99, current: CURRENT_SCHEMA_VERSION },
            }),
        ])
    })

    it("rejects a non-object definition", () => {
        const { raw, diagnostics } = migrateDefinition(["not", "an", "object"])
        expect(raw).toBeNull()
        expect(diagnostics[0]).toMatchObject({ severity: "error", code: "definition-invalid" })
    })

    it("rejects a non-integer schemaVersion", () => {
        for (const bad of [1.5, "1", 0, -1]) {
            const { raw, diagnostics } = migrateDefinition({ schemaVersion: bad, title: "T" })
            expect(raw).toBeNull()
            expect(diagnostics[0].severity).toBe("error")
        }
    })

    it("treats an explicit null schemaVersion like a missing one", () => {
        const { raw, diagnostics } = migrateDefinition({ schemaVersion: null, title: "T" })
        expect(diagnostics).toEqual([])
        expect(raw!.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    })

    it("has no registered migrations while v1 is current", () => {
        // When this fails, CURRENT_SCHEMA_VERSION was bumped: add the
        // corresponding migration to definitionMigrations and a fixture
        // definition at the old version proving identical output.
        expect(CURRENT_SCHEMA_VERSION).toBe(1)
        expect(definitionMigrations).toEqual([])
    })
})
