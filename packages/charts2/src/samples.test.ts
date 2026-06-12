import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { renderDefinitionToSvg, XML_DECLARATION } from "./cli/render.ts"
import { validateInput } from "./cli/validate.ts"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const samplesDir = join(packageRoot, "samples")
const sampleFiles = readdirSync(samplesDir)
    .filter((file) => file.endsWith(".json"))
    .sort()

describe("samples", () => {
    it("has committed sample definitions", () => {
        expect(sampleFiles).toEqual([
            "discrete-bar-population.json",
            "line-federal-departments.json",
            "line-provincial-budgets.json",
            "stacked-area-government-debt.json",
            "stacked-bar-government-debt.json",
            "stacked-discrete-bar-provincial-composition.json",
        ])
    })

    it.each(sampleFiles)("%s validates and renders deterministically", (file) => {
        const path = join(samplesDir, file)
        const raw = JSON.parse(readFileSync(path, "utf8")) as { subtitle?: unknown }
        const subtitle = typeof raw.subtitle === "string" ? raw.subtitle : ""

        expect(typeof raw.subtitle).toBe("string")
        expect(subtitle.trim()).not.toBe("")

        const validation = validateInput(path)
        expect(validation.errors, JSON.stringify(validation.diagnostics, null, 2)).toBe(0)
        expect(validation.diagnostics).toEqual([])

        const first = renderDefinitionToSvg({ definitionPath: path })
        const second = renderDefinitionToSvg({ definitionPath: path })

        expect(first.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([])
        expect(first.svg).not.toBeNull()
        expect(first.svg).toBe(second.svg)
        expect(first.svg?.startsWith(`${XML_DECLARATION}\n<svg`)).toBe(true)
        expect(first.svg).toContain(subtitle)
        expect(first.svg).not.toContain("NaN")
        expect(first.svg).not.toContain("Infinity")
    })
})
