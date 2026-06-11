import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { validateInput } from "./validate.ts"

const tmpDirs: string[] = []

function makeTmpDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "bcds-cli-validate-"))
    tmpDirs.push(dir)
    return dir
}

afterEach(() => {
    while (tmpDirs.length > 0) {
        rmSync(tmpDirs.pop() as string, { recursive: true, force: true })
    }
})

function errorCodes(result: ReturnType<typeof validateInput>): string[] {
    return result.diagnostics.filter((d) => d.severity === "error").map((d) => d.code)
}

function warningCodes(result: ReturnType<typeof validateInput>): string[] {
    return result.diagnostics.filter((d) => d.severity === "warning").map((d) => d.code)
}

describe("validateInput", () => {
    it("reports every expected error on the pathological fixture", () => {
        const result = validateInput("pathological")
        expect(result.kind).toBe("fixture")
        expect(errorCodes(result)).toContain("duplicate-row")
        expect(errorCodes(result)).toContain("non-numeric-cell")
        expect(warningCodes(result)).toContain("zero-denominator")
        expect(result.errors).toBeGreaterThanOrEqual(2)
    })

    it("flows pathological dataset errors through a definition that references it", () => {
        const dir = makeTmpDir()
        const path = join(dir, "definition.json")
        writeFileSync(path, JSON.stringify({ title: "Bad data", data: "pathological", y: ["spending"] }))
        const result = validateInput(path)
        expect(result.kind).toBe("definition")
        expect(errorCodes(result)).toContain("duplicate-row")
        expect(errorCodes(result)).toContain("non-numeric-cell")
        expect(result.errors).toBeGreaterThan(0)
    })

    it("passes a clean definition referencing a bundled fixture", () => {
        const dir = makeTmpDir()
        const path = join(dir, "definition.json")
        writeFileSync(path, JSON.stringify({ title: "Good", data: "provincial-budgets", y: ["total_spending"] }))
        const result = validateInput(path)
        expect(result.errors).toBe(0)
        expect(result.diagnostics).toEqual([])
    })

    it("runs resolveBindings: a y column missing from the manifest is an error", () => {
        const dir = makeTmpDir()
        const path = join(dir, "definition.json")
        writeFileSync(path, JSON.stringify({ title: "Bad y", data: "provincial-budgets", y: ["nonexistent"] }))
        const result = validateInput(path)
        expect(errorCodes(result)).toContain("unknown-y-column")
    })

    it("runs resolveDefinitionTimes: a malformed time bound is an error", () => {
        const dir = makeTmpDir()
        const path = join(dir, "definition.json")
        writeFileSync(
            path,
            JSON.stringify({
                title: "Bad time",
                data: "provincial-budgets",
                y: ["total_spending"],
                time: ["not-a-time", "latest"],
            }),
        )
        const result = validateInput(path)
        expect(errorCodes(result)).toContain("bad-time-bound")
    })

    it("validates a dataset directory and reports duplicate rows", () => {
        const dir = makeTmpDir()
        const datasetDir = join(dir, "data")
        mkdirSync(datasetDir)
        writeFileSync(
            join(datasetDir, "manifest.json"),
            JSON.stringify({
                name: "dupes",
                timeGrain: "year",
                entity: { label: "thing", labelPlural: "things" },
                columns: { value: { name: "Value", type: "numeric" } },
                sources: [{ name: "Test" }],
            }),
        )
        writeFileSync(join(datasetDir, "data.csv"), "entity,time,value\nA,2020,1\nA,2020,2\n")
        const result = validateInput(datasetDir)
        expect(result.kind).toBe("dataset-dir")
        expect(errorCodes(result)).toContain("duplicate-row")
    })

    it("validates a standalone manifest.json", () => {
        const dir = makeTmpDir()
        const path = join(dir, "manifest.json")
        writeFileSync(path, JSON.stringify({ name: "incomplete" }))
        const result = validateInput(path)
        expect(result.kind).toBe("manifest")
        expect(result.errors).toBeGreaterThan(0)
    })

    it("reports missing inputs", () => {
        const result = validateInput("definitely-not-a-real-input")
        expect(result.kind).toBeNull()
        expect(errorCodes(result)).toEqual(["input-not-found"])
    })
})
