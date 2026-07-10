/**
 * charts scaffold - create starter chart definition and dataset files.
 */

import { defineCommand } from "citty"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

import type { ChartType } from "../core/types.ts"
import { CliUsageError } from "./errors.ts"

const CHART_TYPES = [
    "line",
    "discrete-bar",
    "stacked-area",
    "stacked-bar",
    "stacked-discrete-bar",
    "slope",
    "dumbbell",
    "scatter",
    "marimekko",
] as const

interface ScaffoldArgs {
    chartType: string
    name: string
    force: boolean
}

interface ScaffoldFiles {
    definition: Record<string, unknown>
    manifest: Record<string, unknown>
    csv: string
}

function isChartType(value: string): value is ChartType {
    return (CHART_TYPES as readonly string[]).includes(value)
}

export function slugifyName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

function titleFromName(name: string, slug: string): string {
    const trimmed = name.trim()
    if (trimmed.includes(" ") && /[A-Z]/.test(trimmed)) return trimmed
    return slug
        .split("-")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

function json(value: unknown): string {
    return `${JSON.stringify(value, null, 2)}\n`
}

function baseManifest(slug: string, title: string, columns: Record<string, unknown>): Record<string, unknown> {
    return {
        name: slug,
        title: `${title} dataset`,
        timeGrain: "year",
        entity: { label: "region", labelPlural: "regions" },
        columns,
        sources: [{ name: "Source name" }],
    }
}

function baseDefinition(slug: string, title: string, y: string[], type: ChartType): Record<string, unknown> {
    return {
        slug,
        title,
        subtitle: "Replace this subtitle with the chart takeaway",
        data: ".",
        y,
        types: [type],
        sourceText: "Source name",
    }
}

function singleMetricTemplate(slug: string, title: string, type: "line" | "discrete-bar"): ScaffoldFiles {
    const definition = baseDefinition(slug, title, ["value"], type)
    if (type === "line") {
        definition.selectedEntities = ["Canada", "Ontario", "Quebec"]
    } else {
        definition.time = "latest"
        definition.sort = { by: "total", order: "desc" }
    }

    return {
        definition,
        manifest: baseManifest(slug, title, {
            value: {
                name: "Value",
                type: "numeric",
                unit: "units",
                shortUnit: "",
                decimals: 0,
            },
        }),
        csv:
            "entity,time,value\n" +
            "Canada,2021,100\n" +
            "Canada,2022,110\n" +
            "Canada,2023,125\n" +
            "Ontario,2021,40\n" +
            "Ontario,2022,46\n" +
            "Ontario,2023,54\n" +
            "Quebec,2021,32\n" +
            "Quebec,2022,34\n" +
            "Quebec,2023,37\n",
    }
}

function stackedTimeTemplate(slug: string, title: string, type: "stacked-area" | "stacked-bar"): ScaffoldFiles {
    return {
        definition: {
            ...baseDefinition(slug, title, ["category_a", "category_b", "category_c"], type),
            selectedEntities: ["Canada"],
        },
        manifest: baseManifest(slug, title, {
            category_a: { name: "Category A", type: "numeric", unit: "units", decimals: 0 },
            category_b: { name: "Category B", type: "numeric", unit: "units", decimals: 0 },
            category_c: { name: "Category C", type: "numeric", unit: "units", decimals: 0 },
        }),
        csv:
            "entity,time,category_a,category_b,category_c\n" +
            "Canada,2021,40,35,25\n" +
            "Canada,2022,44,38,30\n" +
            "Canada,2023,52,41,34\n",
    }
}

function stackedDiscreteTemplate(slug: string, title: string): ScaffoldFiles {
    return {
        definition: {
            ...baseDefinition(slug, title, ["category_a", "category_b", "category_c"], "stacked-discrete-bar"),
            time: "latest",
            sort: { by: "total", order: "desc" },
        },
        manifest: baseManifest(slug, title, {
            category_a: { name: "Category A", type: "numeric", unit: "units", decimals: 0 },
            category_b: { name: "Category B", type: "numeric", unit: "units", decimals: 0 },
            category_c: { name: "Category C", type: "numeric", unit: "units", decimals: 0 },
        }),
        csv:
            "entity,time,category_a,category_b,category_c\n" +
            "Canada,2023,52,41,34\n" +
            "Ontario,2023,22,18,14\n" +
            "Quebec,2023,16,12,9\n" +
            "Alberta,2023,11,9,7\n",
    }
}

/** Slope: one metric across ≥2 times for several entities (spec 12). */
function slopeTemplate(slug: string, title: string): ScaffoldFiles {
    return {
        definition: {
            ...baseDefinition(slug, title, ["value"], "slope"),
            selectedEntities: ["Ontario", "Quebec", "Alberta"],
        },
        manifest: baseManifest(slug, title, {
            value: { name: "Value", type: "numeric", unit: "units", decimals: 0 },
        }),
        csv:
            "entity,time,value\n" +
            "Ontario,2014,40\nOntario,2024,54\n" +
            "Quebec,2014,32\nQuebec,2024,37\n" +
            "Alberta,2014,28\nAlberta,2024,25\n",
    }
}

/** Dumbbell: two metrics at one time, one row per entity (spec 17). */
function dumbbellTemplate(slug: string, title: string): ScaffoldFiles {
    return {
        definition: {
            ...baseDefinition(slug, title, ["start_value", "end_value"], "dumbbell"),
            time: "latest",
            sort: { by: "change", order: "desc" },
        },
        manifest: baseManifest(slug, title, {
            start_value: { name: "Start", type: "numeric", unit: "units", decimals: 0 },
            end_value: { name: "End", type: "numeric", unit: "units", decimals: 0 },
        }),
        csv:
            "entity,time,start_value,end_value\n" +
            "Ontario,2023,40,54\n" +
            "Quebec,2023,32,37\n" +
            "Alberta,2023,28,25\n",
    }
}

/** Scatter: x vs y metric, one point per entity at a target time (spec 18). */
function scatterTemplate(slug: string, title: string): ScaffoldFiles {
    return {
        definition: {
            ...baseDefinition(slug, title, ["metric_y"], "scatter"),
            x: "metric_x",
            time: "latest",
        },
        manifest: baseManifest(slug, title, {
            metric_x: { name: "Metric X", type: "numeric", unit: "units", decimals: 0 },
            metric_y: { name: "Metric Y", type: "numeric", unit: "units", decimals: 0 },
        }),
        csv:
            "entity,time,metric_x,metric_y\n" +
            "Ontario,2023,40,120\n" +
            "Quebec,2023,32,90\n" +
            "Alberta,2023,28,110\n" +
            "British Columbia,2023,24,70\n",
    }
}

/** Marimekko: stacked metrics with column widths from an x metric (spec 19). */
function marimekkoTemplate(slug: string, title: string): ScaffoldFiles {
    return {
        definition: {
            ...baseDefinition(slug, title, ["category_a", "category_b", "category_c"], "marimekko"),
            x: "width",
            time: "latest",
        },
        manifest: baseManifest(slug, title, {
            category_a: { name: "Category A", type: "numeric", unit: "units", decimals: 0 },
            category_b: { name: "Category B", type: "numeric", unit: "units", decimals: 0 },
            category_c: { name: "Category C", type: "numeric", unit: "units", decimals: 0 },
            width: { name: "Population", type: "numeric", unit: "people", decimals: 0 },
        }),
        csv:
            "entity,time,category_a,category_b,category_c,width\n" +
            "Ontario,2023,52,41,34,15000\n" +
            "Quebec,2023,22,18,14,8500\n" +
            "Alberta,2023,16,12,9,4400\n",
    }
}

export function scaffoldFiles(chartType: ChartType, name: string): { slug: string; files: ScaffoldFiles } {
    const slug = slugifyName(name)
    if (slug === "") throw new CliUsageError("name must contain at least one letter or number")

    const title = titleFromName(name, slug)
    switch (chartType) {
        case "line":
        case "discrete-bar":
            return { slug, files: singleMetricTemplate(slug, title, chartType) }
        case "stacked-area":
        case "stacked-bar":
            return { slug, files: stackedTimeTemplate(slug, title, chartType) }
        case "stacked-discrete-bar":
            return { slug, files: stackedDiscreteTemplate(slug, title) }
        case "slope":
            return { slug, files: slopeTemplate(slug, title) }
        case "dumbbell":
            return { slug, files: dumbbellTemplate(slug, title) }
        case "scatter":
            return { slug, files: scatterTemplate(slug, title) }
        case "marimekko":
            return { slug, files: marimekkoTemplate(slug, title) }
    }
}

export function runScaffold(args: ScaffoldArgs): void {
    if (!isChartType(args.chartType)) {
        throw new CliUsageError(`chart-type must be one of: ${CHART_TYPES.join(", ")} (got "${args.chartType}")`)
    }

    const { slug, files } = scaffoldFiles(args.chartType, args.name)
    const dir = resolve(slug)
    if (existsSync(dir)) {
        if (!args.force) {
            throw new CliUsageError(`Directory already exists: ${dir}; pass --force to replace it`)
        }
        rmSync(dir, { recursive: true, force: true })
    }

    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "definition.json"), json(files.definition))
    writeFileSync(join(dir, "manifest.json"), json(files.manifest))
    writeFileSync(join(dir, "data.csv"), files.csv)

    process.stdout.write(`created ${slug}/definition.json\n`)
    process.stdout.write(`created ${slug}/manifest.json\n`)
    process.stdout.write(`created ${slug}/data.csv\n`)
    process.stdout.write(`render with: charts render ${slug}/definition.json --out ${slug}/${slug}.svg\n`)
}

export const scaffoldCommand = defineCommand({
    meta: {
        name: "scaffold",
        description: "Create starter definition.json, manifest.json, and data.csv files for a chart type",
    },
    args: {
        chartType: {
            type: "positional",
            description: "line | discrete-bar | stacked-area | stacked-bar | stacked-discrete-bar",
            required: true,
        },
        name: {
            type: "positional",
            description: "Chart name; converted to the output directory slug",
            required: true,
        },
        force: {
            type: "boolean",
            description: "Replace an existing scaffold directory",
            default: false,
        },
    },
    run({ args }) {
        runScaffold(args as unknown as ScaffoldArgs)
    },
})
