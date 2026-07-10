import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts2/StackedDiscreteBar",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Stacked discrete bar chart (spec 16): one stacked bar per entity at a " +
                    "single time, composition across metrics, with total labels and " +
                    "absolute/relative modes.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")

const compositionDefinition = {
    title: "Provincial spending composition",
    subtitle: "Program spending and debt charges by province",
    data: "provincial-budgets",
    y: ["program_spending", "debt_charges"],
    types: ["stacked-discrete-bar"],
    selectedEntities: ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"],
    sourceText: "Provincial public accounts",
}

export const SpendingComposition: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(compositionDefinition)}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const Relative: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...compositionDefinition, stackMode: "relative" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** Nova Scotia 2022-23 is missing program_spending — missing never renders as zero. */
export const MissingData: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...compositionDefinition, time: "2022-23" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
