import type { Meta, StoryObj } from "@storybook/react"

import { Grapher } from "../core/Grapher"
import {
    childMortalityGrapher,
    GrapherWithIncompleteData,
    GrapherWithAggregates,
    GrapherWithMultipleVariablesAndMultipleYears,
} from "./DataTable.sample"
import { GRAPHER_TAB_CONFIG_OPTIONS } from "../../types/index.js"

const meta: Meta<typeof Grapher> = {
    title: "Charts/DataTable",
    component: Grapher,
    parameters: {
        layout: "centered",
    },
    decorators: [
        (Story) => (
            <div style={{ width: "800px", height: "600px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof Grapher>

export const Default: Story = {
    render: () => {
        const grapherState = childMortalityGrapher({
            tab: GRAPHER_TAB_CONFIG_OPTIONS.table,
        })
        return <Grapher grapherState={grapherState} />
    },
}

export const WithIncompleteData: Story = {
    render: () => {
        const grapherState = GrapherWithIncompleteData()
        return <Grapher grapherState={grapherState} />
    },
}

export const WithAggregates: Story = {
    render: () => {
        const grapherState = GrapherWithAggregates()
        return <Grapher grapherState={grapherState} />
    },
}

export const MultipleVariables: Story = {
    render: () => {
        const grapherState = GrapherWithMultipleVariablesAndMultipleYears()
        return <Grapher grapherState={grapherState} />
    },
}
