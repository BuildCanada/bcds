import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts2/Marimekko",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Marimekko chart (spec 19): composition across entities where each column's " +
                    "width also encodes a quantity. Segments stack by metric; column widths come " +
                    "from the x metric (equal widths when unbound).",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")
const entities = ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"]

const marimekkoDefinition = {
    title: "Spending composition, sized by budget",
    subtitle: "Width = total spending; 2023-24",
    data: "provincial-budgets",
    y: ["program_spending", "debt_charges"],
    x: "total_spending",
    types: ["marimekko"],
    time: "2023-24",
    selectedEntities: entities,
    sourceText: "Provincial public accounts",
}

export const Default: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(marimekkoDefinition)}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** Relative mode: every column normalized to 100% (the natural marimekko mode). */
export const Relative: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...marimekkoDefinition, stackMode: "relative" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** No x binding → equal-width columns (a plain 100%-stacked comparison). */
export const EqualWidths: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                ...marimekkoDefinition,
                title: "Spending composition (equal widths)",
                subtitle: "No width metric; 2023-24",
                x: undefined,
            })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
