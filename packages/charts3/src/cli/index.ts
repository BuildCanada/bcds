#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { basename, dirname, extname, join } from "node:path"
import { tmpdir } from "node:os"
import {
    createDataset,
    createTimelineFramePlan,
    decodeViewState,
    renderChartSvg,
    validateDataset,
    type ChartDataset,
    type ChartDefinition,
} from "../core"

interface Flags {
    [key: string]: string | boolean | string[]
}

const main = async () => {
    const [command, ...args] = process.argv.slice(2)

    if (!command || command === "help" || command === "--help") {
        printHelp()
        return
    }

    if (command === "render") await renderCommand(args)
    else if (command === "validate") await validateCommand(args)
    else if (command === "preview") await previewCommand(args)
    else if (command === "batch") await batchCommand(args)
    else if (command === "video") await videoCommand(args)
    else throw new Error(`Unknown command: ${command}`)
}

const renderCommand = async (args: string[]) => {
    const { positional, flags } = parseArgs(args)
    const definition = await readJson<ChartDefinition>(required(positional[0], "definition"))
    const dataset = createDataset(await readJson<ChartDatasetInput>(required(stringFlag(flags.data), "--data")))
    const size = readSize(flags)
    const state = stringFlag(flags.state)
    const format = stringFlag(flags.format) ?? inferFormat(stringFlag(flags.out)) ?? "svg"
    const out = stringFlag(flags.out) ?? `${definition.slug ?? "chart"}.${format}`
    const svg = renderChartSvg(definition, dataset, { size, state: state ? decodeViewState(state) : undefined })

    if (format === "svg") {
        await writeOutput(out, svg)
    } else if (format === "png") {
        await writePng(out, svg)
    } else {
        throw new Error(`Unsupported format: ${format}`)
    }
}

const validateCommand = async (args: string[]) => {
    const { positional } = parseArgs(args)
    const input = await readJson<ChartDatasetInput>(required(positional[0], "dataset"))
    const result = validateDataset(createDataset(input))
    const output = JSON.stringify(result, null, 2)
    process.stdout.write(`${output}\n`)
    if (!result.ok) process.exitCode = 1
}

const previewCommand = async (args: string[]) => {
    const { positional, flags } = parseArgs(args)
    const definition = await readJson<ChartDefinition>(required(positional[0], "definition"))
    const dataset = createDataset(await readJson<ChartDatasetInput>(required(stringFlag(flags.data), "--data")))
    const svg = renderChartSvg(definition, dataset, {
        size: readSize(flags),
        state: stringFlag(flags.state) ? decodeViewState(stringFlag(flags.state)!) : undefined,
    })
    const out = stringFlag(flags.out) ?? `${definition.slug ?? "chart"}-preview.html`
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeHtml(definition.title)}</title><body style="margin:0;background:#f4f4f2;padding:24px">${svg}</body></html>`
    await writeOutput(out, html)
}

const batchCommand = async (args: string[]) => {
    const { positional } = parseArgs(args)
    const manifest = await readJson<BatchManifest>(required(positional[0], "manifest"))
    const failures: Array<{ index: number; message: string }> = []

    for (const [index, item] of manifest.renders.entries()) {
        try {
            const definition = await readJson<ChartDefinition>(item.definition)
            const dataset = createDataset(await readJson<ChartDatasetInput>(item.data))
            for (const output of item.outputs) {
                const svg = renderChartSvg(definition, dataset, {
                    size: output,
                    state: item.state ? decodeViewState(item.state) : undefined,
                })
                if (output.format === "png") await writePng(output.out, svg)
                else await writeOutput(output.out, svg)
            }
        } catch (error) {
            failures.push({ index, message: error instanceof Error ? error.message : String(error) })
        }
    }

    process.stdout.write(JSON.stringify({ ok: failures.length === 0, failures }, null, 2) + "\n")
    if (failures.length) process.exitCode = 1
}

const videoCommand = async (args: string[]) => {
    const { positional, flags } = parseArgs(args)
    const definition = await readJson<ChartDefinition>(required(positional[0], "definition"))
    const dataset = createDataset(await readJson<ChartDatasetInput>(required(stringFlag(flags.data), "--data")))
    const size = readSize(flags)
    const fps = numberFlag(flags.fps) ?? 30
    const seconds = numberFlag(flags.seconds)
    const frameDir = stringFlag(flags.frames) ?? join(process.cwd(), `${definition.slug ?? "chart"}-frames`)
    const out = stringFlag(flags.out)
    const plan = createTimelineFramePlan(definition, dataset, {
        fps,
        seconds,
        size,
        state: stringFlag(flags.state),
    })

    await mkdir(frameDir, { recursive: true })
    for (const frame of plan.frames) {
        const svg = renderChartSvg(definition, dataset, {
            size,
            state: frame.state,
        })
        await writeFile(join(frameDir, `frame-${String(frame.index).padStart(5, "0")}.svg`), svg)
    }

    if (out) {
        await encodeVideo(frameDir, out, fps)
    }

    process.stdout.write(JSON.stringify({ ok: true, fps, frames: plan.totalFrames, frameDir, out }, null, 2) + "\n")
}

type ChartDatasetInput = ChartDataset

interface BatchManifest {
    renders: Array<{
        definition: string
        data: string
        state?: string
        outputs: Array<{ out: string; format?: "svg" | "png"; width?: number; height?: number }>
    }>
}

const parseArgs = (args: string[]): { positional: string[]; flags: Flags } => {
    const positional: string[] = []
    const flags: Flags = {}

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index]
        if (!arg.startsWith("--")) {
            positional.push(arg)
            continue
        }
        const key = arg.slice(2)
        const next = args[index + 1]
        const value = next && !next.startsWith("--") ? next : true
        if (value !== true) index += 1
        if (flags[key] !== undefined) {
            const current = flags[key]
            flags[key] = Array.isArray(current) ? [...current, String(value)] : [String(current), String(value)]
        } else {
            flags[key] = value
        }
    }

    return { positional, flags }
}

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, "utf-8")) as T

const readSize = (flags: Flags): { width?: number; height?: number } => ({
    width: numberFlag(flags.width),
    height: numberFlag(flags.height),
})

const writeOutput = async (out: string, content: string) => {
    if (out === "-") {
        process.stdout.write(content)
        return
    }
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, content)
}

const writePng = async (out: string, svg: string) => {
    const dir = await mkdtemp(join(tmpdir(), "charts3-"))
    const svgPath = join(dir, "chart.svg")
    await writeFile(svgPath, svg)
    await mkdir(dirname(out), { recursive: true })
    const result = spawnSync("rsvg-convert", [svgPath, "-o", out], { stdio: "inherit" })
    if (result.status !== 0) throw new Error("PNG rendering requires rsvg-convert")
}

const encodeVideo = async (frameDir: string, out: string, fps: number) => {
    const pngDir = join(frameDir, "png")
    await mkdir(pngDir, { recursive: true })
    const svgFiles = Array.from({ length: countFrameFiles(frameDir) }, (_, index) =>
        join(frameDir, `frame-${String(index).padStart(5, "0")}.svg`)
    )
    for (const svgPath of svgFiles) {
        const pngPath = join(pngDir, `${basename(svgPath, ".svg")}.png`)
        const raster = spawnSync("rsvg-convert", [svgPath, "-o", pngPath], { stdio: "inherit" })
        if (raster.status !== 0) throw new Error("Video rendering requires rsvg-convert")
    }

    await mkdir(dirname(out), { recursive: true })
    const encode = spawnSync(
        "ffmpeg",
        [
            "-y",
            "-framerate",
            String(fps),
            "-i",
            join(pngDir, "frame-%05d.png"),
            "-pix_fmt",
            "yuv420p",
            out,
        ],
        { stdio: "inherit" }
    )
    if (encode.status !== 0) throw new Error("Video encoding requires ffmpeg")
}

const countFrameFiles = (frameDir: string): number => {
    let index = 0
    while (existsSync(join(frameDir, `frame-${String(index).padStart(5, "0")}.svg`))) index += 1
    return index
}

const stringFlag = (value: Flags[string]): string | undefined =>
    Array.isArray(value) ? value[0] : typeof value === "string" ? value : undefined

const numberFlag = (value: Flags[string]): number | undefined => {
    const raw = stringFlag(value)
    if (!raw) return undefined
    const valueNumber = Number(raw)
    return Number.isFinite(valueNumber) ? valueNumber : undefined
}

const required = (value: string | undefined, name: string): string => {
    if (!value) throw new Error(`Missing ${name}`)
    return value
}

const inferFormat = (out?: string): string | undefined => {
    const extension = out ? extname(out).slice(1) : undefined
    return extension || undefined
}

const escapeHtml = (value: string): string =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

const printHelp = () => {
    process.stdout.write(`charts3

Commands:
  render <definition.json> --data <dataset.json> [--out chart.svg] [--format svg|png]
  validate <dataset.json>
  preview <definition.json> --data <dataset.json> [--out preview.html]
  batch <manifest.json>
  video <definition.json> --data <dataset.json> [--frames dir] [--out video.mp4]

Flags:
  --width <px> --height <px> --state <query> --fps <n> --seconds <n>
`)
}

main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
})
