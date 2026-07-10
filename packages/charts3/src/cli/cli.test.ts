import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"

const dataset = {
    manifest: {
        name: "cli-fixture",
        timeGrain: "year",
        columns: {
            value: { name: "Value", type: "numeric", decimals: 0 },
        },
        sources: [{ name: "CLI fixture source" }],
    },
    rows: [
        { entity: "A", time: 2022, value: 10 },
        { entity: "A", time: 2023, value: 12 },
        { entity: "B", time: 2022, value: 8 },
        { entity: "B", time: 2023, value: 14 },
    ],
}

const definition = {
    title: "CLI fixture chart",
    slug: "cli-fixture",
    y: "value",
    types: ["line"],
    selectedEntities: ["A", "B"],
    time: [2022, 2023],
}

describe("charts3 CLI", () => {
    it("renders SVG files from definition and dataset JSON", async () => {
        const dir = await writeFixtureFiles()
        const out = join(dir, "chart.svg")
        const result = runCli([
            "render",
            join(dir, "definition.json"),
            "--data",
            join(dir, "dataset.json"),
            "--out",
            out,
            "--width",
            "500",
            "--height",
            "320",
        ])

        expect(result.status).toBe(0)
        const svg = await readFile(out, "utf-8")
        expect(svg).toContain("<svg")
        expect(svg).toContain("CLI fixture chart")
        expect(svg).not.toContain("NaN")
    })

    it("validates datasets and exits nonzero for invalid input", async () => {
        const dir = await mkdtemp(join(tmpdir(), "charts3-cli-"))
        const invalidDataset = {
            manifest: dataset.manifest,
            rows: [
                { entity: "A", time: 2024, value: "x" },
                { entity: "A", time: 2024, value: 1 },
            ],
        }
        await writeFile(join(dir, "dataset.json"), JSON.stringify(invalidDataset))
        const result = runCli(["validate", join(dir, "dataset.json")])

        expect(result.status).toBe(1)
        expect(result.stdout).toContain("Duplicate entity/time row")
        expect(result.stdout).toContain("Numeric column contains a non-numeric value")
    })

    it("generates deterministic SVG frames for video exports", async () => {
        const dir = await writeFixtureFiles()
        const frames = join(dir, "frames")
        const result = runCli([
            "video",
            join(dir, "definition.json"),
            "--data",
            join(dir, "dataset.json"),
            "--frames",
            frames,
            "--fps",
            "2",
            "--seconds",
            "1",
        ])

        expect(result.status).toBe(0)
        expect(existsSync(join(frames, "frame-00000.svg"))).toBe(true)
        expect(existsSync(join(frames, "frame-00001.svg"))).toBe(true)
        const first = await readFile(join(frames, "frame-00000.svg"), "utf-8")
        const last = await readFile(join(frames, "frame-00001.svg"), "utf-8")
        expect(first).toContain("2022")
        expect(last).toContain("2023")
    })
})

const writeFixtureFiles = async (): Promise<string> => {
    const dir = await mkdtemp(join(tmpdir(), "charts3-cli-"))
    await writeFile(join(dir, "dataset.json"), JSON.stringify(dataset))
    await writeFile(join(dir, "definition.json"), JSON.stringify(definition))
    return dir
}

const runCli = (args: string[]) => {
    return spawnSync("bun", ["src/cli/index.ts", ...args], {
        cwd: process.cwd(),
        encoding: "utf-8",
    })
}
