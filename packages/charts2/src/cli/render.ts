/**
 * charts render — one chart definition → SVG/PNG (spec 24).
 *
 * Pipeline: loadDefinition → loadDataset → resolveDefinitionTimes →
 * layoutChart → renderToStaticMarkup(<SceneSVG/>) → XML declaration → file
 * or stdout; PNG via @resvg/resvg-js (loadSystemFonts: false, explicit TTF
 * files from --fonts or the monorepo .fonts-cache).
 *
 * Determinism (spec 24 §3): the SVG string is a pure function of the
 * definition + dataset + flags — flags are inputs. `--transparent` clones
 * the scene with background "transparent" before SceneSVG renders it; the
 * background rect then carries fill="transparent" (valid SVG/CSS, verified
 * fully transparent under resvg). Error diagnostics → nothing is written.
 */

import { Resvg } from "@resvg/resvg-js"
import { defineCommand } from "citty"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { basename, dirname, extname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { getTheme, layoutChart, resolveDefinitionTimes, type ChromeMode, type Theme } from "../core/index.ts"
import type { Diagnostic, Locale, ViewState } from "../core/types.ts"
import type { EmphasisModel } from "../react/interaction/emphasisReducer.ts"
import { SceneSVG } from "../react/SceneSVG.tsx"
import { CliFailure, CliUsageError, countErrors, hasErrors, printDiagnostics } from "./errors.ts"
import { loadDataset, loadDefinition, parseState } from "./loadInputs.ts"

// ---------------------------------------------------------------------------
// Geometry: presets + aspect clamping (spec 24 §2)
// ---------------------------------------------------------------------------

export interface RenderPreset {
    width: number
    height: number
    chrome: ChromeMode
}

export const PRESETS: Record<string, RenderPreset> = {
    social: { width: 1200, height: 628, chrome: "full" },
    square: { width: 1080, height: 1080, chrome: "full" },
    thumbnail: { width: 300, height: 160, chrome: "thumbnail" },
    slide: { width: 1920, height: 1080, chrome: "full" },
}

export const DEFAULT_WIDTH = 850
export const DEFAULT_HEIGHT = 600
export const MIN_ASPECT = 0.5
export const MAX_ASPECT = 2

export interface GeometryFlags {
    preset?: string
    width?: number
    height?: number
    noChrome?: boolean
}

export interface RenderGeometry {
    width: number
    height: number
    chrome: ChromeMode
    diagnostics: Diagnostic[]
}

/**
 * Preset sets size + chrome; explicit --width/--height override the size;
 * --no-chrome overrides the chrome. Aspect (width ÷ height) is clamped to
 * [0.5, 2] by adjusting the height, with a warning.
 */
export function resolveRenderGeometry(flags: GeometryFlags): RenderGeometry {
    const diagnostics: Diagnostic[] = []
    let width = DEFAULT_WIDTH
    let height = DEFAULT_HEIGHT
    let chrome: ChromeMode = "full"

    if (flags.preset !== undefined) {
        const preset = PRESETS[flags.preset]
        if (preset === undefined) {
            throw new CliUsageError(
                `Unknown preset "${flags.preset}" (expected one of: ${Object.keys(PRESETS).join(", ")})`,
            )
        }
        width = preset.width
        height = preset.height
        chrome = preset.chrome
    }
    if (flags.width !== undefined) width = flags.width
    if (flags.height !== undefined) height = flags.height

    const aspect = width / height
    if (aspect > MAX_ASPECT) {
        const clamped = Math.round(width / MAX_ASPECT)
        diagnostics.push({
            severity: "warning",
            code: "aspect-clamped",
            message: `Aspect ratio ${width}:${height} exceeds ${MAX_ASPECT}; height raised to ${clamped}`,
            context: { width, height, clampedHeight: clamped },
        })
        height = clamped
    } else if (aspect < MIN_ASPECT) {
        const clamped = Math.round(width / MIN_ASPECT)
        diagnostics.push({
            severity: "warning",
            code: "aspect-clamped",
            message: `Aspect ratio ${width}:${height} is below ${MIN_ASPECT}; height lowered to ${clamped}`,
            context: { width, height, clampedHeight: clamped },
        })
        height = clamped
    }

    if (flags.noChrome === true) chrome = "none"
    return { width, height, chrome, diagnostics }
}

// ---------------------------------------------------------------------------
// The render pipeline (also the unit under test — no process state)
// ---------------------------------------------------------------------------

export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'

export interface RenderSvgOptions extends GeometryFlags {
    definitionPath: string
    /** URL-style view state overrides. */
    state?: string
    themeName?: string
    locale?: Locale
    transparent?: boolean
    /** Series keys to force-focus (spec 07 §3); overrides the definition's
     *  focusedSeries. Unknown keys are dropped with a warning. */
    focus?: string[]
}

export interface RenderSvgResult {
    /** null when any error diagnostic occurred — nothing should be written. */
    svg: string | null
    slug: string
    width: number
    height: number
    diagnostics: Diagnostic[]
}

/** Definition file path → deterministic SVG string (spec 24 §3). */
export function renderDefinitionToSvg(options: RenderSvgOptions): RenderSvgResult {
    const geometry = resolveRenderGeometry(options)
    const diagnostics: Diagnostic[] = [...geometry.diagnostics]
    const fallbackSlug = basename(options.definitionPath).replace(/\.[^.]*$/, "")
    const failed = (slug: string): RenderSvgResult => ({
        svg: null,
        slug,
        width: geometry.width,
        height: geometry.height,
        diagnostics,
    })

    const loaded = loadDefinition(options.definitionPath)
    diagnostics.push(...loaded.diagnostics)
    if (loaded.definition === null) return failed(fallbackSlug)

    let definition = loaded.definition
    const slug = definition.slug ?? fallbackSlug
    if (options.locale !== undefined) definition = { ...definition, locale: options.locale }

    const data = loadDataset(definition.data, [resolve(dirname(options.definitionPath)), process.cwd()])
    diagnostics.push(...data.diagnostics)
    if (data.dataset === null || hasErrors(diagnostics)) return failed(slug)

    const grain = data.dataset.manifest.timeGrain
    const resolvedTimes = resolveDefinitionTimes(definition, grain)
    diagnostics.push(...resolvedTimes.diagnostics)
    definition = resolvedTimes.definition

    let view: ViewState | undefined
    if (options.state !== undefined) {
        const parsedState = parseState(options.state, grain)
        diagnostics.push(...parsedState.diagnostics)
        view = parsedState.state
    }

    let theme: Theme | undefined
    if (options.themeName !== undefined) {
        const lookup = getTheme(options.themeName)
        if (lookup.warning !== undefined) {
            diagnostics.push({ severity: "warning", code: "unknown-theme", message: lookup.warning })
        }
        theme = lookup.theme
    }

    let scene = layoutChart({
        definition,
        dataset: data.dataset,
        view,
        theme,
        size: { width: geometry.width, height: geometry.height },
        chrome: geometry.chrome,
    })
    diagnostics.push(...scene.diagnostics)
    if (hasErrors(diagnostics)) return failed(slug)

    if (options.transparent === true) scene = { ...scene, background: "transparent" }

    // Force-focus (spec 07 §3): --focus overrides the definition's focusedSeries;
    // the focused series stay full-opacity while the rest dim and their markers
    // hide. Unknown keys are dropped with a warning so a typo can't blank the chart.
    const requestedFocus =
        options.focus !== undefined && options.focus.length > 0 ? options.focus : (definition.focusedSeries ?? [])
    const knownKeys = new Set(scene.series.map((s) => s.key))
    const unknownFocus = requestedFocus.filter((key) => !knownKeys.has(key))
    if (unknownFocus.length > 0) {
        diagnostics.push({
            severity: "warning",
            code: "unknown-focus-series",
            message: `--focus: no series named ${unknownFocus.join(", ")}`,
            context: { unknown: unknownFocus.join(", ") },
        })
    }
    const focusKeys = requestedFocus.filter((key) => knownKeys.has(key))
    const emphasis: EmphasisModel =
        focusKeys.length > 0 ? { mode: "emphasis", keys: new Set(focusKeys) } : { mode: "idle" }
    const dimTheme = theme ?? getTheme(definition.theme).theme

    const markup = renderToStaticMarkup(
        createElement(SceneSVG, { scene, idPrefix: slug, emphasis, dimOpacity: dimTheme.palette.dimOpacity }),
    )
    return {
        svg: `${XML_DECLARATION}\n${markup}`,
        slug,
        width: geometry.width,
        height: geometry.height,
        diagnostics,
    }
}

// ---------------------------------------------------------------------------
// PNG rasterization (spec 28 §3: explicit font files, never system fonts)
// ---------------------------------------------------------------------------

/** ../../.fonts-cache relative to this file = the package root cache (src and dist). */
export function defaultFontsDir(): string {
    return resolve(dirname(fileURLToPath(import.meta.url)), "../../.fonts-cache")
}

export function listFontFiles(fontsDir: string): string[] {
    const preferredOrder = [
        // resvg currently fails to match Söhne by family name when several
        // brand fonts are loaded, so keep the active chart UI font first.
        "soehne-kraftig.ttf",
        "founders-grotesk-mono-regular.ttf",
        "financier-text-regular.ttf",
    ]
    const orderOf = (file: string): number => {
        const index = preferredOrder.indexOf(file.toLowerCase())
        return index === -1 ? preferredOrder.length : index
    }
    return readdirSync(fontsDir)
        .filter((file) => file.toLowerCase().endsWith(".ttf"))
        .sort((a, b) => orderOf(a) - orderOf(b) || a.localeCompare(b))
        .map((file) => join(fontsDir, file))
}

export interface RasterizeOptions {
    fontsDir: string
    /** Logical pixel width; the PNG is width × scale physical pixels. */
    width: number
    scale: number
}

export function rasterize(svg: string, options: RasterizeOptions): Buffer {
    if (!existsSync(options.fontsDir)) {
        throw new CliFailure(
            `Fonts directory not found: ${options.fontsDir}\n` +
                "PNG rasterization needs TTF copies of the brand fonts. Run `bun run extract-font-metrics` " +
                "in packages/charts2 to regenerate the .fonts-cache, or pass --fonts <dir> pointing at " +
                "licensed TTF copies.",
        )
    }
    const fontFiles = listFontFiles(options.fontsDir)
    if (fontFiles.length === 0) {
        throw new CliFailure(
            `No .ttf files found in ${options.fontsDir}. Run \`bun run extract-font-metrics\` in ` +
                "packages/charts2, or pass --fonts <dir> containing TTF copies of the brand fonts.",
        )
    }
    const resvg = new Resvg(svg, {
        font: { loadSystemFonts: false, fontFiles },
        fitTo: { mode: "width", value: options.width * options.scale },
    })
    return resvg.render().asPng()
}

// ---------------------------------------------------------------------------
// Flag parsing
// ---------------------------------------------------------------------------

export type OutputFormat = "svg" | "png"

/** --format svg --format png and --format svg,png both work; deduped, ordered. */
export function parseFormats(value: string | string[] | undefined): OutputFormat[] {
    if (value === undefined) return ["svg"]
    const tokens = (Array.isArray(value) ? value : [value])
        .flatMap((entry) => entry.split(","))
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token !== "")
    if (tokens.length === 0) return ["svg"]
    const formats: OutputFormat[] = []
    for (const token of tokens) {
        if (token !== "svg" && token !== "png") {
            throw new CliUsageError(`Unknown format "${token}" (expected svg or png)`)
        }
        if (!formats.includes(token)) formats.push(token)
    }
    return formats
}

/** --focus A --focus B and --focus A,B both work; trimmed, deduped, ordered. */
export function parseFocusKeys(value: string | string[] | undefined): string[] {
    if (value === undefined) return []
    const tokens = (Array.isArray(value) ? value : [value])
        .flatMap((entry) => entry.split(","))
        .map((token) => token.trim())
        .filter((token) => token !== "")
    const keys: string[] = []
    for (const token of tokens) if (!keys.includes(token)) keys.push(token)
    return keys
}

function parsePositiveInt(value: string | undefined, flag: string): number | undefined {
    if (value === undefined) return undefined
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new CliUsageError(`--${flag} must be a positive integer, got "${value}"`)
    }
    return parsed
}

function parseLocale(value: string | undefined): Locale | undefined {
    if (value === undefined) return undefined
    if (value !== "en" && value !== "fr") {
        throw new CliUsageError(`--locale must be "en" or "fr", got "${value}"`)
    }
    return value
}

/**
 * Output path per format: default `<slug>.<format>`; an explicit --out is
 * used verbatim for a single format, and gets its svg/png extension swapped
 * per format when several formats are requested.
 */
export function outputPathFor(
    out: string | undefined,
    slug: string,
    format: OutputFormat,
    formatCount: number,
): string {
    if (out === undefined) return `${slug}.${format}`
    if (formatCount === 1) return out
    const extension = extname(out).toLowerCase()
    const base = extension === ".svg" || extension === ".png" ? out.slice(0, -extension.length) : out
    return `${base}.${format}`
}

// ---------------------------------------------------------------------------
// The command
// ---------------------------------------------------------------------------

interface RenderArgs {
    definition: string
    out?: string
    format?: string | string[]
    width?: string
    height?: string
    preset?: string
    scale?: string
    theme?: string
    locale?: string
    state?: string
    focus?: string | string[]
    transparent: boolean
    chrome: boolean
    fonts?: string
}

export function runRender(args: RenderArgs): void {
    if (args.out === "") throw new CliUsageError("--out requires a value")
    const formats = parseFormats(args.format)
    const scale = parsePositiveInt(typeof args.scale === "string" ? args.scale : undefined, "scale") ?? 2

    const result = renderDefinitionToSvg({
        definitionPath: args.definition,
        preset: args.preset,
        width: parsePositiveInt(args.width, "width"),
        height: parsePositiveInt(args.height, "height"),
        noChrome: args.chrome === false,
        state: args.state,
        themeName: args.theme,
        locale: parseLocale(args.locale),
        transparent: args.transparent,
        focus: parseFocusKeys(args.focus),
    })

    printDiagnostics(result.diagnostics)
    if (result.svg === null) {
        throw new CliFailure(`render failed: ${countErrors(result.diagnostics)} error(s)`)
    }

    if (args.out === "-") {
        if (formats.length !== 1 || formats[0] !== "svg") {
            throw new CliUsageError('--out "-" (stdout) is only supported for the svg format')
        }
        process.stdout.write(`${result.svg}\n`)
        return
    }

    for (const format of formats) {
        const path = outputPathFor(args.out, result.slug, format, formats.length)
        const content =
            format === "svg"
                ? `${result.svg}\n`
                : rasterize(result.svg, {
                      fontsDir: args.fonts ?? defaultFontsDir(),
                      width: result.width,
                      scale,
                  })
        try {
            mkdirSync(dirname(resolve(path)), { recursive: true })
            writeFileSync(path, content)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            throw new CliFailure(`could not write ${path}: ${message}`)
        }
        process.stderr.write(`wrote ${path}\n`)
    }
}

export const renderCommand = defineCommand({
    meta: {
        name: "render",
        description: "Render a chart definition to SVG/PNG",
    },
    args: {
        definition: {
            type: "positional",
            description: "Path to a chart definition JSON file",
            required: true,
        },
        out: {
            type: "string",
            description: 'Output path; "-" writes SVG to stdout (default <slug>.<format>)',
        },
        format: {
            type: "string",
            description: "svg | png; repeatable or comma-separated (default svg)",
        },
        width: { type: "string", description: `Width in px (default ${DEFAULT_WIDTH})` },
        height: { type: "string", description: `Height in px (default ${DEFAULT_HEIGHT})` },
        preset: {
            type: "string",
            description:
                "social (1200×628) | square (1080×1080) | thumbnail (300×160, minimal chrome) | slide (1920×1080)",
        },
        scale: { type: "string", description: "PNG raster scale (default 2)" },
        theme: { type: "string", description: "Theme name (default from definition)" },
        locale: { type: "string", description: "en | fr (default from definition)" },
        state: {
            type: "string",
            description: 'URL-style view state, e.g. "tab=line&time=2014-15..2024-25&entities=ON~QC"',
        },
        focus: {
            type: "string",
            description:
                "Series key(s) to focus — dim the rest to the theme dim and hide their line markers; repeatable or comma-separated (default: the definition's focusedSeries)",
        },
        transparent: { type: "boolean", description: "No background fill", default: false },
        chrome: {
            type: "boolean",
            description: "Pass --no-chrome to render the plot only (no header/footer)",
            default: true,
        },
        fonts: {
            type: "string",
            description: "Directory of TTF files for PNG rasterization (default: the package .fonts-cache)",
        },
    },
    run({ args }) {
        runRender(args as unknown as RenderArgs)
    },
})
