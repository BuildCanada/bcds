import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts2/Slope",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Slope chart (spec 12): each series' change between exactly two times — the " +
                    "window's two handles. One line per series with a dot and a name + value label " +
                    "at each endpoint; only series present at both ends render.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")
const entities = ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"]

const spendingDefinition = {
    title: "Provincial spending, first vs latest year",
    subtitle: "Total budgetary expenditure, public accounts basis",
    data: "provincial-budgets",
    y: ["total_spending"],
    types: ["slope"],
    selectedEntities: entities,
    sourceText: "Provincial public accounts",
}

export const Default: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(spendingDefinition)}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** program_spending has entities missing an endpoint → listed under "No data". */
export const IncompleteEndpoints: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                ...spendingDefinition,
                title: "Provincial program spending, first vs latest year",
                y: ["program_spending"],
            })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const French: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...spendingDefinition, locale: "fr" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
