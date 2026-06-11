import type { Meta, StoryObj } from "@storybook/react"

import { Chart } from "../react/index.ts"
import { renderStoryTooltip, storyDataset, storyDefinition } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta<typeof Chart> = {
    title: "Charts2/DiscreteBar",
    component: Chart,
    parameters: {
        docs: {
            description: {
                component:
                    "Discrete bar chart (spec 13): one bar per entity at a single time (or no " +
                    "time dimension at all), with value labels and sort control. Negative values " +
                    "extend left of the zero line.",
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Chart>

const populationSnapshot = storyDataset("population-snapshot")
const pathological = storyDataset("pathological")

const populationDefinition = {
    title: "Population by province and territory",
    data: "population-snapshot",
    y: ["population"],
    types: ["discrete-bar"],
    sourceText: "Statistics Canada",
}

export const Population: Story = {
    render: () => (
        <Chart
            definition={storyDefinition(populationDefinition)}
            dataset={populationSnapshot}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const SortedByName: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...populationDefinition, sort: { by: "name", order: "asc" } })}
            dataset={populationSnapshot}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

export const SortedAscending: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({ ...populationDefinition, sort: { by: "total", order: "asc" } })}
            dataset={populationSnapshot}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}

/** All-negative values from the pathological fixture (spec 26 §2). */
export const NegativeValues: Story = {
    render: () => (
        <Chart
            definition={storyDefinition({
                title: "Net balance by place",
                data: "pathological",
                y: ["negatives"],
                types: ["discrete-bar"],
                selectedEntities: ["Québec", "Î.-P.-É.", "Lonely Station"],
                time: 2021,
            })}
            dataset={pathological}
            width={850}
            height={600}
            renderTooltip={renderStoryTooltip}
        />
    ),
}
