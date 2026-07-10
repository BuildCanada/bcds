import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"

import { CliUsageError } from "./errors.ts"
import {
    DEFAULT_HEIGHT,
    DEFAULT_WIDTH,
    XML_DECLARATION,
    defaultFontsDir,
    listFontFiles,
    outputPathFor,
    parseFocusKeys,
    parseFormats,
    rasterize,
    renderDefinitionToSvg,
    resolveRenderGeometry,
} from "./render.ts"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")

const tmpDirs: string[] = []

function makeTmpDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "bcds-cli-render-"))
    tmpDirs.push(dir)
    return dir
}

afterEach(() => {
    while (tmpDirs.length > 0) {
        rmSync(tmpDirs.pop() as string, { recursive: true, force: true })
    }
})

function writeDefinition(dir: string, definition: Record<string, unknown>): string {
    const path = join(dir, "definition.json")
    writeFileSync(path, JSON.stringify(definition))
    return path
}

// ---------------------------------------------------------------------------
// Geometry: presets + aspect clamping (spec 24 test expectations)
// ---------------------------------------------------------------------------

describe("resolveRenderGeometry", () => {
    const table = [
        { flags: {}, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, chrome: "full", clamped: false },
        { flags: { preset: "social" }, width: 1200, height: 628, chrome: "full", clamped: false },
        { flags: { preset: "square" }, width: 1080, height: 1080, chrome: "full", clamped: false },
        { flags: { preset: "thumbnail" }, width: 300, height: 160, chrome: "thumbnail", clamped: false },
        { flags: { preset: "slide" }, width: 1920, height: 1080, chrome: "full", clamped: false },
        // explicit width/height override the preset size
        { flags: { preset: "social", width: 600, height: 600 }, width: 600, height: 600, chrome: "full", clamped: false },
        // aspect > 2 → height raised
        { flags: { width: 2000, height: 400 }, width: 2000, height: 1000, chrome: "full", clamped: true },
        // aspect < 0.5 → height lowered
        { flags: { width: 400, height: 1000 }, width: 400, height: 800, chrome: "full", clamped: true },
        // --no-chrome wins over the preset chrome
        { flags: { preset: "thumbnail", noChrome: true }, width: 300, height: 160, chrome: "none", clamped: false },
    ] as const

    it.each(table)("resolves %j", ({ flags, width, height, chrome, clamped }) => {
        const geometry = resolveRenderGeometry({ ...flags })
        expect(geometry.width).toBe(width)
        expect(geometry.height).toBe(height)
        expect(geometry.chrome).toBe(chrome)
        if (clamped) {
            expect(geometry.diagnostics).toHaveLength(1)
            expect(geometry.diagnostics[0]).toMatchObject({ severity: "warning", code: "aspect-clamped" })
        } else {
            expect(geometry.diagnostics).toEqual([])
        }
    })

    it("rejects unknown presets as a usage error", () => {
        expect(() => resolveRenderGeometry({ preset: "billboard" })).toThrow(CliUsageError)
    })
})

// ---------------------------------------------------------------------------
// Flag helpers
// ---------------------------------------------------------------------------

describe("parseFormats", () => {
    it("defaults to svg", () => {
        expect(parseFormats(undefined)).toEqual(["svg"])
    })

    it("accepts repeated flags and comma lists, deduped", () => {
        expect(parseFormats(["svg", "png"])).toEqual(["svg", "png"])
        expect(parseFormats("svg,png,svg")).toEqual(["svg", "png"])
    })

    it("rejects unknown formats as a usage error", () => {
        expect(() => parseFormats("gif")).toThrow(CliUsageError)
    })
})

describe("parseFocusKeys", () => {
    it("splits comma-separated and repeated values, trims, and dedupes in order", () => {
        expect(parseFocusKeys(undefined)).toEqual([])
        expect(parseFocusKeys("Ontario")).toEqual(["Ontario"])
        expect(parseFocusKeys(" Ontario , Quebec ")).toEqual(["Ontario", "Quebec"])
        expect(parseFocusKeys(["Ontario", "Quebec,Ontario"])).toEqual(["Ontario", "Quebec"])
    })
})

describe("outputPathFor", () => {
    it("defaults to <slug>.<format>", () => {
        expect(outputPathFor(undefined, "my-chart", "svg", 1)).toBe("my-chart.svg")
    })

    it("uses an explicit --out verbatim for a single format", () => {
        expect(outputPathFor("out/chart.svg", "my-chart", "svg", 1)).toBe("out/chart.svg")
    })

    it("swaps the extension per format when several formats are requested", () => {
        expect(outputPathFor("out/chart.svg", "my-chart", "png", 2)).toBe("out/chart.png")
        expect(outputPathFor("out/chart", "my-chart", "png", 2)).toBe("out/chart.png")
    })
})

// ---------------------------------------------------------------------------
// SVG pipeline
// ---------------------------------------------------------------------------

describe("renderDefinitionToSvg", () => {
    it("is byte-deterministic on the government-debt fixture", () => {
        const dir = makeTmpDir()
        const path = writeDefinition(dir, {
            title: "Government debt",
            data: "government-debt",
            y: ["federal_debt", "provincial_debt"],
        })
        const first = renderDefinitionToSvg({ definitionPath: path })
        const second = renderDefinitionToSvg({ definitionPath: path })
        expect(first.svg).not.toBeNull()
        expect(first.svg).toContain("<svg")
        expect(first.svg?.startsWith(XML_DECLARATION)).toBe(true)
        expect(first.svg).toBe(second.svg)
        expect(first.diagnostics.filter((d) => d.severity === "error")).toEqual([])
    })

    it("--transparent renders the backdrop with fill=\"transparent\"", () => {
        const dir = makeTmpDir()
        const path = writeDefinition(dir, {
            title: "Test",
            data: "provincial-budgets",
            y: ["total_spending"],
        })
        const result = renderDefinitionToSvg({ definitionPath: path, transparent: true })
        expect(result.svg).toContain('fill="transparent"')
    })

    it("returns null svg and error diagnostics for a broken definition", () => {
        const dir = makeTmpDir()
        const path = writeDefinition(dir, { title: "No y or data" })
        const result = renderDefinitionToSvg({ definitionPath: path })
        expect(result.svg).toBeNull()
        expect(result.diagnostics.some((d) => d.severity === "error")).toBe(true)
    })

    it("--focus dims the other series and hides their line markers (spec 07 §3)", () => {
        const dir = makeTmpDir()
        const path = writeDefinition(dir, {
            title: "Focus",
            data: "provincial-budgets",
            y: ["total_spending"],
            types: ["line"],
            selectedEntities: ["Ontario", "Quebec", "Alberta"],
        })
        const plain = renderDefinitionToSvg({ definitionPath: path })
        const focused = renderDefinitionToSvg({ definitionPath: path, focus: ["Ontario"] })
        expect(plain.svg).not.toBeNull()
        expect(focused.svg).not.toBeNull()
        // Non-focused series dim to the theme dim (0.2); the plain render never dims.
        expect(plain.svg).not.toContain('opacity="0.2"')
        expect(focused.svg).toContain('opacity="0.2"')
        // Non-focused markers are hidden → strictly fewer <circle> than plain.
        const circles = (svg: string): number => (svg.match(/<circle/g) ?? []).length
        expect(circles(focused.svg as string)).toBeLessThan(circles(plain.svg as string))
    })

    it("warns on an unknown --focus series and applies no focus", () => {
        const dir = makeTmpDir()
        const path = writeDefinition(dir, {
            title: "Focus",
            data: "provincial-budgets",
            y: ["total_spending"],
            types: ["line"],
            selectedEntities: ["Ontario", "Quebec"],
        })
        const result = renderDefinitionToSvg({ definitionPath: path, focus: ["Nowhere"] })
        expect(result.svg).not.toBeNull()
        expect(result.diagnostics.some((d) => d.code === "unknown-focus-series")).toBe(true)
        expect(result.svg).not.toContain('opacity="0.2"')
    })
})

// ---------------------------------------------------------------------------
// PNG smoke (skips with a clear message when the TTF cache is absent)
// ---------------------------------------------------------------------------

describe("rasterize", () => {
    it("loads Söhne before inactive brand fonts so resvg fallback uses the chart UI face", () => {
        const dir = makeTmpDir()
        writeFileSync(join(dir, "financier-text-regular.ttf"), "")
        writeFileSync(join(dir, "soehne-kraftig.ttf"), "")
        writeFileSync(join(dir, "founders-grotesk-mono-regular.ttf"), "")
        writeFileSync(join(dir, "other.ttf"), "")

        expect(listFontFiles(dir).map((path) => path.slice(dir.length + 1))).toEqual([
            "soehne-kraftig.ttf",
            "founders-grotesk-mono-regular.ttf",
            "financier-text-regular.ttf",
            "other.ttf",
        ])
    })

    it("renders a thumbnail PNG of provincial-budgets", () => {
        if (!existsSync(defaultFontsDir())) {
            console.warn(
                "skipping PNG smoke test: .fonts-cache missing — run `bun run extract-font-metrics` in packages/charts2",
            )
            return
        }
        const dir = makeTmpDir()
        const path = writeDefinition(dir, {
            title: "Provincial budgets",
            data: "provincial-budgets",
            y: ["total_spending"],
        })
        const result = renderDefinitionToSvg({ definitionPath: path, preset: "thumbnail" })
        expect(result.svg).not.toBeNull()
        const png = rasterize(result.svg as string, {
            fontsDir: defaultFontsDir(),
            width: result.width,
            scale: 2,
        })
        expect(png.length).toBeGreaterThan(0)
        expect([...png.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
    })
})

// ---------------------------------------------------------------------------
// End-to-end spawn smoke test (the ONE spawned-process test)
// ---------------------------------------------------------------------------

describe("charts render (spawned)", () => {
    it("renders a definition file to SVG with exit code 0", () => {
        const dir = makeTmpDir()
        const definitionPath = writeDefinition(dir, {
            title: "Spawn smoke",
            data: "provincial-budgets",
            y: ["total_spending"],
        })
        const outPath = join(dir, "out.svg")
        const proc = spawnSync("bun", ["src/cli/index.ts", "render", definitionPath, "--out", outPath], {
            cwd: packageRoot,
            encoding: "utf8",
        })
        expect(proc.error).toBeUndefined()
        expect(proc.status, proc.stderr).toBe(0)
        expect(existsSync(outPath)).toBe(true)
        expect(readFileSync(outPath, "utf8")).toContain("<svg")
    })
})
