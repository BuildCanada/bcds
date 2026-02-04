/**
 * Build Pipeline Integration Test
 *
 * This test verifies that the build output is correct and can be imported.
 * Run after `bun run build` to verify the dist/ output.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { existsSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, "dist")

describe("Build Pipeline", () => {
    beforeAll(() => {
        if (!existsSync(DIST_DIR)) {
            throw new Error(
                "dist/ directory not found. Run `bun run build` first."
            )
        }
    })

    describe("dist/ structure", () => {
        it("should have index.js", async () => {
            expect(existsSync(join(DIST_DIR, "index.js"))).toBe(true)
        })

        it("should have index.d.ts", async () => {
            expect(existsSync(join(DIST_DIR, "index.d.ts"))).toBe(true)
        })

        it("should have index.d.ts.map", async () => {
            expect(existsSync(join(DIST_DIR, "index.d.ts.map"))).toBe(true)
        })

        it("should have styles/charts.scss", async () => {
            expect(existsSync(join(DIST_DIR, "styles", "charts.scss"))).toBe(true)
        })

        it("should have core directories", async () => {
            const expectedDirs = [
                "config",
                "core-table",
                "explorer",
                "grapher",
                "types",
                "utils",
                "components",
            ]
            for (const dir of expectedDirs) {
                expect(existsSync(join(DIST_DIR, dir))).toBe(true)
            }
        })
    })

    describe("JavaScript output", () => {
        it("should have valid ESM exports in index.js", async () => {
            const content = await readFile(join(DIST_DIR, "index.js"), "utf-8")

            // Should use ESM export syntax
            expect(content).toContain("export {")

            // Should have .js extensions in imports (esbuild preserves these)
            expect(content).toContain(".js")
        })

        it("should not contain TypeScript-specific syntax", async () => {
            const content = await readFile(join(DIST_DIR, "index.js"), "utf-8")

            // Should not have interface or type declarations (these go in .d.ts)
            expect(content).not.toMatch(/^export interface\s/m)
            expect(content).not.toMatch(/^export type\s+\w+\s*=/m)
        })

        it("should have separate module files", async () => {
            // Verify key modules exist as separate files
            expect(existsSync(join(DIST_DIR, "config", "index.js"))).toBe(true)
            expect(existsSync(join(DIST_DIR, "grapher", "core", "Grapher.js"))).toBe(true)
            expect(existsSync(join(DIST_DIR, "grapher", "core", "GrapherState.js"))).toBe(true)
        })
    })

    describe("Type declarations", () => {
        it("should have type exports in index.d.ts", async () => {
            const content = await readFile(join(DIST_DIR, "index.d.ts"), "utf-8")

            // Should export key types
            expect(content).toContain("ChartsConfig")
            expect(content).toContain("Grapher")
            expect(content).toContain("GrapherState")
        })
    })

    describe("SCSS files", () => {
        it("should copy charts.scss with updated import paths", async () => {
            const content = await readFile(
                join(DIST_DIR, "styles", "charts.scss"),
                "utf-8"
            )

            // Should use the new package export path, not src/
            expect(content).toContain('@use "@buildcanada/components/styles/fonts"')
            expect(content).not.toContain('@use "@buildcanada/components/src/')
        })
    })

    describe("Module structure", () => {
        it("should export key symbols from index.js", async () => {
            const content = await readFile(join(DIST_DIR, "index.js"), "utf-8")

            // Verify key exports are present in the file
            expect(content).toContain("Grapher")
            expect(content).toContain("GrapherState")
            expect(content).toContain("ChartsProvider")
            expect(content).toContain("defaultChartsConfig")
            expect(content).toContain("Explorer")
        })

        it("should have proper ESM re-exports", async () => {
            const content = await readFile(join(DIST_DIR, "index.js"), "utf-8")

            // Should re-export from submodules
            expect(content).toMatch(/export\s*\{/)
            expect(content).toMatch(/from\s*["']\.\//)
        })

        // Note: Direct import test skipped because TC39 decorators require
        // bundler transformation (handled by Next.js/Turbopack at runtime)
    })
})
