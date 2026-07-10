import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createDataset, renderChartSvg, type ChartDataset, type ChartDefinition, type ChartType } from "."

const timeDataset = createDataset({
    manifest: {
        name: "provincial-indicators",
        timeGrain: "fiscal-year",
        columns: {
            spending: { name: "Spending", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            population: { name: "Population", type: "numeric", decimals: 1 },
            debt: { name: "Debt", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
        },
        sources: [{ name: "Charts3 fixture data" }],
        entities: [
            { name: "Ontario", colour: "#356643" },
            { name: "Quebec", colour: "#285f73" },
            { name: "Alberta", colour: "#8a4b32" },
            { name: "British Columbia", colour: "#5d5f66" },
        ],
    },
    rows: [
        { entity: "Ontario", time: "2021-22", spending: 180, population: 14.7, debt: 390 },
        { entity: "Ontario", time: "2022-23", spending: 188, population: 15.0, debt: 402 },
        { entity: "Ontario", time: "2023-24", spending: 196, population: 15.2, debt: 415 },
        { entity: "Ontario", time: "2024-25", spending: 205, population: 15.5, debt: 430 },
        { entity: "Quebec", time: "2021-22", spending: 126, population: 8.7, debt: 210 },
        { entity: "Quebec", time: "2022-23", spending: 132, population: 8.8, debt: 216 },
        { entity: "Quebec", time: "2023-24", spending: 137, population: 8.9, debt: 222 },
        { entity: "Quebec", time: "2024-25", spending: 142, population: 9.0, debt: 230 },
        { entity: "Alberta", time: "2021-22", spending: 68, population: 4.4, debt: 95 },
        { entity: "Alberta", time: "2022-23", spending: 72, population: 4.5, debt: 98 },
        { entity: "Alberta", time: "2023-24", spending: 76, population: 4.6, debt: 103 },
        { entity: "Alberta", time: "2024-25", spending: 80, population: 4.8, debt: 108 },
        { entity: "British Columbia", time: "2021-22", spending: 78, population: 5.2, debt: 115 },
        { entity: "British Columbia", time: "2022-23", spending: 83, population: 5.3, debt: 122 },
        { entity: "British Columbia", time: "2023-24", spending: 89, population: 5.5, debt: 128 },
        { entity: "British Columbia", time: "2024-25", spending: 95, population: 5.7, debt: 136 },
    ],
})

const stackedDataset = createDataset({
    manifest: {
        name: "federal-spending-components",
        timeGrain: "fiscal-year",
        columns: {
            health: { name: "Health transfers", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            seniors: { name: "Seniors benefits", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            debt: { name: "Debt charges", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            operations: { name: "Operations", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
        },
        sources: [{ name: "Charts3 fixture data" }],
    },
    rows: [
        { entity: "Canada", time: "2021-22", health: 44, seniors: 60, debt: 24, operations: 96 },
        { entity: "Canada", time: "2022-23", health: 49, seniors: 65, debt: 31, operations: 101 },
        { entity: "Canada", time: "2023-24", health: 54, seniors: 71, debt: 42, operations: 107 },
        { entity: "Canada", time: "2024-25", health: 59, seniors: 78, debt: 51, operations: 113 },
    ],
})

const snapshotDataset = createDataset({
    manifest: {
        name: "department-snapshot",
        timeGrain: "none",
        columns: {
            spending: { name: "Spending", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            target: { name: "Target", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            marker: { name: "Prior year", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
        },
        sources: [{ name: "Charts3 fixture data" }],
    },
    rows: [
        { entity: "Health", spending: 59, target: 56, marker: 52 },
        { entity: "Seniors", spending: 78, target: 74, marker: 71 },
        { entity: "Defence", spending: 36, target: 42, marker: 33 },
        { entity: "Transport", spending: 18, target: 20, marker: 17 },
        { entity: "Housing", spending: 14, target: 18, marker: 11 },
    ],
})

const waterfallDataset = createDataset({
    manifest: {
        name: "budget-waterfall",
        timeGrain: "none",
        columns: {
            opening: { name: "Opening balance", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            revenue: { name: "Revenue", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            programs: { name: "Programs", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
            debt: { name: "Debt charges", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
        },
        sources: [{ name: "Charts3 fixture data" }],
    },
    rows: [{ entity: "Canada", opening: 12, revenue: 42, programs: -36, debt: -8 }],
})

const flowDataset = createDataset({
    manifest: {
        name: "program-flows",
        timeGrain: "none",
        dimensions: ["target"],
        columns: {
            value: { name: "Flow", type: "currency", currency: "CAD", shortUnit: "$", decimals: 0 },
        },
        sources: [{ name: "Charts3 fixture data" }],
    },
    rows: [
        { entity: "Tax revenue", target: "Health", value: 42 },
        { entity: "Tax revenue", target: "Seniors", value: 34 },
        { entity: "Borrowing", target: "Debt charges", value: 18 },
        { entity: "Borrowing", target: "Housing", value: 12 },
    ],
})

interface ChartCase {
    type: ChartType | "table"
    dataset: ChartDataset
    definition: ChartDefinition
    expectedTag: string
}

const timeSelection = ["2021-22", "2024-25"] as ["2021-22", "2024-25"]
const provinces = ["Ontario", "Quebec", "Alberta", "British Columbia"]
const departments = ["Health", "Seniors", "Defence", "Transport", "Housing"]

const chartCases: ChartCase[] = [
    {
        type: "line",
        dataset: timeDataset,
        expectedTag: "path",
        definition: { title: "Spending by province", y: "spending", types: ["line"], selectedEntities: provinces, time: timeSelection },
    },
    {
        type: "discrete-bar",
        dataset: timeDataset,
        expectedTag: "rect",
        definition: { title: "Latest provincial spending", y: "spending", types: ["discrete-bar"], selectedEntities: provinces, time: "2024-25" },
    },
    {
        type: "stacked-area",
        dataset: stackedDataset,
        expectedTag: "path",
        definition: { title: "Federal spending components", y: ["health", "seniors", "debt", "operations"], types: ["stacked-area"], selectedEntities: ["Canada"], time: timeSelection },
    },
    {
        type: "stacked-bar",
        dataset: stackedDataset,
        expectedTag: "rect",
        definition: { title: "Federal spending stacks", y: ["health", "seniors", "debt", "operations"], types: ["stacked-bar"], selectedEntities: ["Canada"], time: timeSelection },
    },
    {
        type: "stacked-discrete-bar",
        dataset: stackedDataset,
        expectedTag: "rect",
        definition: { title: "Latest component stack", y: ["health", "seniors", "debt", "operations"], types: ["stacked-discrete-bar"], selectedEntities: ["Canada"], time: "2024-25" },
    },
    {
        type: "slope",
        dataset: timeDataset,
        expectedTag: "line",
        definition: { title: "Spending change", y: "spending", types: ["slope"], selectedEntities: provinces, time: timeSelection },
    },
    {
        type: "dumbbell",
        dataset: timeDataset,
        expectedTag: "circle",
        definition: { title: "Spending endpoints", y: "spending", types: ["dumbbell"], selectedEntities: provinces, time: timeSelection },
    },
    {
        type: "scatter",
        dataset: timeDataset,
        expectedTag: "circle",
        definition: { title: "Spending and population", x: "population", y: "spending", size: "debt", types: ["scatter"], selectedEntities: provinces, time: "2024-25" },
    },
    {
        type: "marimekko",
        dataset: timeDataset,
        expectedTag: "rect",
        definition: { title: "Population and spending mix", x: "population", y: "spending", types: ["marimekko"], selectedEntities: provinces, time: "2024-25" },
    },
    {
        type: "map",
        dataset: timeDataset,
        expectedTag: "rect",
        definition: { title: "Provincial spending map", y: "spending", types: ["map"], selectedEntities: provinces, time: "2024-25" },
    },
    {
        type: "waterfall",
        dataset: waterfallDataset,
        expectedTag: "rect",
        definition: { title: "Budget bridge", y: ["opening", "revenue", "programs", "debt"], types: ["waterfall"], selectedEntities: ["Canada"] },
    },
    {
        type: "treemap",
        dataset: snapshotDataset,
        expectedTag: "rect",
        definition: { title: "Department spending treemap", y: "spending", types: ["treemap"], selectedEntities: departments },
    },
    {
        type: "sankey",
        dataset: flowDataset,
        expectedTag: "path",
        definition: { title: "Program funding flows", y: "value", types: ["sankey"], selectedEntities: ["Tax revenue", "Borrowing"], sankey: { targetColumn: "target" } },
    },
    {
        type: "bullet",
        dataset: snapshotDataset,
        expectedTag: "line",
        definition: { title: "Spending against targets", y: "spending", x: "target", types: ["bullet"], selectedEntities: departments, bullet: { marker: "marker" } },
    },
    {
        type: "table",
        dataset: timeDataset,
        expectedTag: "text",
        definition: { title: "Spending data table", y: "spending", types: ["table"], selectedEntities: ["Ontario", "Quebec"], time: timeSelection },
    },
]

describe("all charts3 chart types", () => {
    it.each(chartCases)("renders a deterministic, nonbroken $type SVG", ({ dataset, definition, expectedTag }) => {
        const first = renderChartSvg(definition, dataset, { size: { width: 760, height: 500 } })
        const second = renderChartSvg(definition, dataset, { size: { width: 760, height: 500 } })

        expect(first).toBe(second)
        expect(first).toContain("<svg")
        expect(first).toContain(`width="760"`)
        expect(first).toContain(`height="500"`)
        expect(first).toContain(`<${expectedTag}`)
        expect(first).not.toContain("NaN")
        expect(first).not.toContain("undefined")
        expect(first.length).toBeGreaterThan(1200)
    })

    it("writes a visual contact sheet for manual graph review", async () => {
        const outDir = join(process.cwd(), "visual-output")
        await mkdir(outDir, { recursive: true })

        const rendered = chartCases.map((chartCase) => {
            const svg = renderChartSvg(chartCase.definition, chartCase.dataset, {
                size: { width: 760, height: 500 },
            })
            return { ...chartCase, svg }
        })
        for (const chartCase of rendered) {
            await writeFile(join(outDir, `${chartCase.type}.svg`), chartCase.svg)
        }

        const cards = rendered.map((chartCase) => `<section><h2>${chartCase.type}</h2>${chartCase.svg}</section>`)

        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>charts3 visual fixtures</title>
<style>
body{margin:0;padding:24px;background:#f4f4f2;color:#1e3626;font-family:Arial,sans-serif}
main{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:20px}
section{background:white;border:1px solid #d7d7d0;padding:12px}
h2{font-size:14px;margin:0 0 8px}
svg{width:100%;height:auto}
</style>
</head>
<body><main>${cards.join("")}</main></body>
</html>`

        await writeFile(join(outDir, "charts3-contact-sheet.html"), html)
        expect(html).toContain("stacked-area")
        expect(html).toContain("sankey")
    })
})
