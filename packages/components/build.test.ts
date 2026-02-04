/**
 * Build Pipeline Integration Test
 *
 * This test verifies that the build output is correct and can be imported.
 * Run after `bun run build` to verify the dist/ output.
 */

import { describe, it, expect, beforeAll } from "vitest"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
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

        it("should have styles/main.scss", async () => {
            expect(existsSync(join(DIST_DIR, "styles", "main.scss"))).toBe(true)
        })

        it("should have styles/tokens.scss", async () => {
            expect(existsSync(join(DIST_DIR, "styles", "tokens.scss"))).toBe(true)
        })

        it("should have styles/fonts.scss", async () => {
            expect(existsSync(join(DIST_DIR, "styles", "fonts.scss"))).toBe(true)
        })

        it("should have component directories", async () => {
            const expectedDirs = [
                "primitives",
                "layout",
                "content",
                "navigation",
                "feedback",
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

            // Should have .js extensions in imports
            expect(content).toContain('from "./primitives/Button/index.js"')
            expect(content).toContain('from "./layout/Container/index.js"')
        })

        it("should not contain TypeScript syntax", async () => {
            const content = await readFile(join(DIST_DIR, "index.js"), "utf-8")

            // Should not have type annotations in the JS output
            // Note: "export type" is valid in JS when using verbatimModuleSyntax
            expect(content).not.toMatch(/:\s*(string|number|boolean|void)\s*[;,)]/)
        })

        it("should have .js extensions in component index files", async () => {
            const buttonIndex = await readFile(
                join(DIST_DIR, "primitives", "Button", "index.js"),
                "utf-8"
            )
            expect(buttonIndex).toContain('from "./Button.js"')
        })
    })

    describe("Type declarations", () => {
        it("should have type exports in index.d.ts", async () => {
            const content = await readFile(join(DIST_DIR, "index.d.ts"), "utf-8")

            // Should export key types
            expect(content).toContain("Button")
            expect(content).toContain("Container")
            expect(content).toContain("Card")
        })
    })

    describe("Module imports", () => {
        it("should be importable from dist/", async () => {
            // Dynamic import from the built output
            const componentsModule = await import("./dist/index.js")

            // Verify key exports exist
            expect(componentsModule.Button).toBeDefined()
            expect(componentsModule.Container).toBeDefined()
            expect(componentsModule.Card).toBeDefined()
            expect(componentsModule.Header).toBeDefined()
            expect(componentsModule.Footer).toBeDefined()
        })
    })
})
