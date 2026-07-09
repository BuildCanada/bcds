import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts2/ComparisonLines",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Comparison lines (spec 02 §2). Dashed reference lines drawn over the plot: a " +
                    "horizontal line at a fixed y value and/or a vertical line at a fixed time, each " +
                    "with an optional label. Lines outside the current plot range are skipped. Rendered " +
                    "on the continuous-axis charts (line, stacked area).",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")

const budgetsDefinition = {
    title: "Provincial budget spending",
    subtitle: "Total budgetary expenditure, with reference lines",
    data: "provincial-budgets",
    y: ["total_spending"],
    types: ["line"],
    selectedEntities: ["Ontario", "Quebec"],
    sourceText: "Provincial public accounts",
}

/** A single horizontal reference line at a fixed value. */
export const Horizontal: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                ...budgetsDefinition,
                comparisonLines: [{ y: 100, label: "$100B reference" }],
            })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** A horizontal value line plus a vertical line at a fixed fiscal year. */
export const HorizontalAndVertical: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                ...budgetsDefinition,
                comparisonLines: [
                    { y: 100, label: "$100B reference" },
                    { x: 2022, label: "2022" },
                ],
            })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
