import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import type { ChartType } from "../core/types.ts"
import { CliUsageError } from "./errors.ts"
import { renderDefinitionToSvg } from "./render.ts"
import { runScaffold, scaffoldFiles, slugifyName } from "./scaffold.ts"
import { validateInput } from "./validate.ts"

const chartTypes: ChartType[] = ["line", "discrete-bar", "stacked-area", "stacked-bar", "stacked-discrete-bar"]
const tmpDirs: string[] = []

function makeTmpDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "bcds-cli-scaffold-"))
    tmpDirs.push(dir)
    return dir
}

afterEach(() => {
    while (tmpDirs.length > 0) {
        rmSync(tmpDirs.pop() as string, { recursive: true, force: true })
    }
})

describe("slugifyName", () => {
    it("turns display names into directory slugs", () => {
        expect(slugifyName("Provincial Spending: 2024")).toBe("provincial-spending-2024")
    })
})

describe("scaffoldFiles", () => {
    it.each(chartTypes)("creates valid starter files for %s", (chartType) => {
        const { slug, files } = scaffoldFiles(chartType, `${chartType} starter`)
        expect(slug).toBe(`${chartType}-starter`)
        expect(files.definition.data).toBe(".")
        expect(files.definition.types).toEqual([chartType])
        expect(files.csv).toContain("entity,time")
    })

    it("rejects empty names", () => {
        expect(() => scaffoldFiles("line", "!!!")).toThrow(CliUsageError)
    })
})

describe("charts scaffold", () => {
    it.each(chartTypes)("writes a %s scaffold that validates and renders", (chartType) => {
        const dir = makeTmpDir()
        const prev = process.cwd()
        process.chdir(dir)
        try {
            runScaffold({ chartType, name: `${chartType} starter`, force: false })
        } finally {
            process.chdir(prev)
        }

        const slug = `${chartType}-starter`
        const scaffoldDir = join(dir, slug)
        const definitionPath = join(scaffoldDir, "definition.json")
        expect(existsSync(definitionPath)).toBe(true)
        expect(existsSync(join(scaffoldDir, "manifest.json"))).toBe(true)
        expect(existsSync(join(scaffoldDir, "data.csv"))).toBe(true)

        const definition = JSON.parse(readFileSync(definitionPath, "utf8")) as { data: string; types: string[] }
        expect(definition.data).toBe(".")
        expect(definition.types).toEqual([chartType])

        const validation = validateInput(definitionPath)
        expect(validation.errors, validation.diagnostics.map((d) => d.message).join("\n")).toBe(0)

        const rendered = renderDefinitionToSvg({ definitionPath })
        expect(rendered.svg, rendered.diagnostics.map((d) => d.message).join("\n")).not.toBeNull()
        expect(rendered.svg).toContain("<svg")
    })

    it("refuses to overwrite unless --force is set", () => {
        const dir = makeTmpDir()
        const prev = process.cwd()
        process.chdir(dir)
        try {
            runScaffold({ chartType: "line", name: "overwrite me", force: false })
            expect(() => runScaffold({ chartType: "line", name: "overwrite me", force: false })).toThrow(
                CliUsageError,
            )
            runScaffold({ chartType: "line", name: "overwrite me", force: true })
        } finally {
            process.chdir(prev)
        }
    })
})
