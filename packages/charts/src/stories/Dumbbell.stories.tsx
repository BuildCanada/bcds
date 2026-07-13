import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts/Dumbbell",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Dumbbell chart (spec 17): one row per entity showing movement between two " +
                    "values — two metrics at one time, or two times of one metric — as two dots " +
                    "joined by an arrow (default) or plain-line connector.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")
const entities = ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"]

/** Two-metric mode: start = program spending, end = debt charges. */
const twoMetricDefinition = {
    title: "Program spending vs debt charges",
    subtitle: "By province, 2023-24",
    data: "provincial-budgets",
    y: ["program_spending", "debt_charges"],
    types: ["dumbbell"],
    time: "2023-24",
    selectedEntities: entities,
    sourceText: "Provincial public accounts",
}

export const TwoMetric: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(twoMetricDefinition)}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const ChangeLabelsLineConnector: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                ...twoMetricDefinition,
                valueLabelMode: "change",
                connector: "line",
            })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** Time-range mode: one metric across the window's two handles. */
export const TimeRange: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                title: "Total spending, first vs latest year",
                subtitle: "By province",
                data: "provincial-budgets",
                y: ["total_spending"],
                types: ["dumbbell"],
                selectedEntities: entities,
                sourceText: "Provincial public accounts",
            })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
