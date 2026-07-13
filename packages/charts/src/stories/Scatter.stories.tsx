import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts/Scatter",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Scatter chart (spec 18): the relationship between two metrics across entities. " +
                    "One point per entity at the selected time, plotted on two independent value " +
                    "axes, with priority-ordered entity labels.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")
const entities = ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"]

const scatterDefinition = {
    title: "Debt charges vs program spending",
    subtitle: "By province, 2023-24",
    data: "provincial-budgets",
    x: "program_spending",
    y: ["debt_charges"],
    types: ["scatter"],
    time: "2023-24",
    selectedEntities: entities,
    sourceText: "Provincial public accounts",
}

export const Default: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(scatterDefinition)}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** Point size encodes total spending (sqrt-scaled radii). */
export const SizedByTotalSpending: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...scatterDefinition, sizeMetric: "total_spending" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
