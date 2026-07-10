import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { viewStateToParams } from "../core/index.ts"
import { loadDataset, parseState } from "./loadInputs.ts"

// ---------------------------------------------------------------------------
// Fixtures on disk
// ---------------------------------------------------------------------------

const tmpDirs: string[] = []

function makeTmpDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "bcds-cli-test-"))
    tmpDirs.push(dir)
    return dir
}

afterEach(() => {
    while (tmpDirs.length > 0) {
        rmSync(tmpDirs.pop() as string, { recursive: true, force: true })
    }
})

function rawManifest(name: string): Record<string, unknown> {
    return {
        name,
        timeGrain: "year",
        entity: { label: "thing", labelPlural: "things" },
        columns: { value: { name: "Value", type: "numeric" } },
        sources: [{ name: "Test data" }],
    }
}

const CSV = "entity,time,value\nA,2020,1\nA,2021,2\n"

function writeDatasetDir(base: string, name: string, manifestName: string): void {
    const dir = join(base, name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "manifest.json"), JSON.stringify(rawManifest(manifestName)))
    writeFileSync(join(dir, "data.csv"), CSV)
}

function writeDatasetJson(base: string, name: string, manifestName: string): void {
    const rows = [
        { entity: "A", time: 2020, value: 1 },
        { entity: "A", time: 2021, value: 2 },
    ]
    writeFileSync(join(base, name), JSON.stringify({ manifest: rawManifest(manifestName), rows }))
}

// ---------------------------------------------------------------------------
// parseState
// ---------------------------------------------------------------------------

describe("parseState", () => {
    it("decodes a URL-style state string", () => {
        const { state, diagnostics } = parseState("tab=line&time=2014-15..2024-25&entities=ON~QC", "fiscal-year")
        expect(diagnostics).toEqual([])
        expect(state.tab).toBe("line")
        expect(state.time).toEqual({ start: 2014, end: 2024 })
        expect(state.entities).toEqual(["ON", "QC"])
    })

    it("round-trips through viewStateToParams", () => {
        const original = "tab=line&time=2014-15..2024-25&entities=ON~QC"
        const first = parseState(original, "fiscal-year")
        const encoded = viewStateToParams(first.state, "fiscal-year").toString()
        const second = parseState(encoded, "fiscal-year")
        expect(second.state).toEqual(first.state)
        expect(second.diagnostics).toEqual([])
    })

    it("tolerates a leading question mark and reports bad values as warnings", () => {
        const { state, diagnostics } = parseState("?tab=nope&entities=ON", "year")
        expect(state.tab).toBeUndefined()
        expect(state.entities).toEqual(["ON"])
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0]).toMatchObject({ severity: "warning", code: "invalid-url-param" })
    })
})

// ---------------------------------------------------------------------------
// loadDataset resolution order: dir → JSON file → bundled fixture
// ---------------------------------------------------------------------------

describe("loadDataset", () => {
    it("loads a dataset directory (manifest.json + data.csv)", () => {
        const base = makeTmpDir()
        writeDatasetDir(base, "mydata", "from-dir")
        const result = loadDataset("mydata", [base])
        expect(result.manifest?.name).toBe("from-dir")
        expect(result.dataset?.entities).toEqual(["A"])
        expect(result.diagnostics).toEqual([])
    })

    it("loads a single JSON file {manifest, rows}", () => {
        const base = makeTmpDir()
        writeDatasetJson(base, "mydata.json", "from-file")
        const result = loadDataset("mydata.json", [base])
        expect(result.manifest?.name).toBe("from-file")
        expect(result.dataset?.times).toEqual([2020, 2021])
    })

    it("prefers the definition directory over later search directories", () => {
        const defDir = makeTmpDir()
        const cwdDir = makeTmpDir()
        writeDatasetDir(defDir, "mydata", "from-def-dir")
        writeDatasetJson(cwdDir, "mydata", "from-cwd-file")
        const result = loadDataset("mydata", [defDir, cwdDir])
        expect(result.manifest?.name).toBe("from-def-dir")
    })

    it("skips a directory without manifest.json and falls through", () => {
        const defDir = makeTmpDir()
        const cwdDir = makeTmpDir()
        mkdirSync(join(defDir, "mydata")) // no manifest.json inside
        writeDatasetJson(cwdDir, "mydata", "from-cwd-file")
        const result = loadDataset("mydata", [defDir, cwdDir])
        expect(result.manifest?.name).toBe("from-cwd-file")
    })

    it("a local directory shadows a bundled fixture of the same name", () => {
        const base = makeTmpDir()
        writeDatasetDir(base, "provincial-budgets", "local-pb")
        const result = loadDataset("provincial-budgets", [base])
        expect(result.manifest?.name).toBe("local-pb")
    })

    it("falls back to bundled fixtures by name", () => {
        const base = makeTmpDir()
        const result = loadDataset("provincial-budgets", [base])
        expect(result.manifest?.name).toBe("provincial-budgets")
        expect(result.dataset?.entities).toContain("Ontario")
    })

    it("reports an error when nothing matches", () => {
        const base = makeTmpDir()
        const result = loadDataset("does-not-exist", [base])
        expect(result.dataset).toBeNull()
        expect(result.diagnostics).toHaveLength(1)
        expect(result.diagnostics[0]).toMatchObject({ severity: "error", code: "dataset-not-found" })
    })
})
