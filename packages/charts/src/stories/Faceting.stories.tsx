import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts/Faceting",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Faceting — small multiples (spec 09). One chart splits into a grid of panels, " +
                    "either one per entity (each panel shows all metrics) or one per metric (each shows " +
                    "all entities). Panels share a common value domain so they read on the same scale, " +
                    "colours stay consistent across panels, and a single shared legend sits above the grid.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")

const facetDefinition = {
    title: "Provincial spending composition",
    subtitle: "Program spending and debt charges by province",
    data: "provincial-budgets",
    y: ["program_spending", "debt_charges"],
    types: ["line"],
    selectedEntities: ["Ontario", "Quebec", "British Columbia", "Alberta"],
    sourceText: "Provincial public accounts",
}

/** One panel per entity; each panel carries every metric. */
export const ByEntity: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...facetDefinition, facet: "entity" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** One panel per metric; each panel carries every entity, with a shared legend. */
export const ByMetric: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...facetDefinition, facet: "metric" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
