import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts2/StackedArea",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Stacked area chart (spec 14). The flagship demo: government debt as a " +
                    "share of GDP (scenario 27 A) — three debt levels divided by a shared GDP " +
                    "denominator, stacked over fiscal years.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const governmentDebt = storyDataset("government-debt")

const debtToGdpDefinition = {
    title: "Government debt as a share of GDP",
    subtitle: "Federal, provincial, and municipal debt divided by nominal GDP",
    data: "government-debt",
    y: ["federal_debt", "provincial_debt", "municipal_debt"],
    types: ["stacked-area"],
    sourceText: "Fiscal reference tables",
}

/** The flagship demo: debt-to-GDP stacked over fiscal years. */
export const DebtToGdp: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(debtToGdpDefinition)}
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
            definition={storyDefinition({ ...debtToGdpDefinition, stackMode: "relative" })}
            dataset={governmentDebt}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const French: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...debtToGdpDefinition, locale: "fr" })}
            dataset={governmentDebt}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
