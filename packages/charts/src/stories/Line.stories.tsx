import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts/Line",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Line chart (spec 11): one line per selected entity, with hover emphasis, " +
                    "click-to-focus, and single-time collapse to a discrete bar. Data comes from " +
                    "the committed fixtures (spec 26 §2).",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const provincialBudgets = storyDataset("provincial-budgets")
const federalDepartments = storyDataset("federal-departments")

const budgetsDefinition = {
    title: "Provincial budget spending",
    subtitle: "Total budgetary expenditure, public accounts basis",
    data: "provincial-budgets",
    y: ["total_spending"],
    selectedEntities: ["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"],
    sourceText: "Provincial public accounts",
}

export const ProvincialBudgets: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(budgetsDefinition)}
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
            definition={storyDefinition({ ...budgetsDefinition, stackMode: "relative" })}
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
            definition={storyDefinition({ ...budgetsDefinition, locale: "fr" })}
            dataset={provincialBudgets}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const ManyEntities: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                title: "Federal departmental spending",
                data: "federal-departments",
                y: ["spending"],
                sourceText: "Public Accounts of Canada",
            })}
            dataset={federalDepartments}
            width={1200}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
