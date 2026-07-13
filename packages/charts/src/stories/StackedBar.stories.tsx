import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts/StackedBar",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Stacked bar chart (spec 15): one stacked column per time step, with a " +
                    "legend and absolute/relative stack modes.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const governmentDebt = storyDataset("government-debt")

const debtDefinition = {
    title: "Government debt as a share of GDP",
    subtitle: "Federal, provincial, and municipal debt divided by nominal GDP",
    data: "government-debt",
    y: ["federal_debt", "provincial_debt", "municipal_debt"],
    types: ["stacked-bar"],
    sourceText: "Fiscal reference tables",
}

export const DebtToGdp: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(debtDefinition)}
            dataset={governmentDebt}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const Relative: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...debtDefinition, stackMode: "relative" })}
            dataset={governmentDebt}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
