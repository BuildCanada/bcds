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
        docs: {
            description: {
                component: `
The DataTable view displays chart data in a tabular format, allowing users to inspect the underlying values.

## Usage

\`\`\`tsx
import { Grapher, GrapherState, GRAPHER_TAB_CONFIG_OPTIONS } from "@buildcanada/charts"

const grapherState = new GrapherState({
  tab: GRAPHER_TAB_CONFIG_OPTIONS.table,
  // ... other configuration
})

<Grapher grapherState={grapherState} />
\`\`\`

## Features

- **Sortable Columns**: Click column headers to sort
- **Entity Filtering**: Filter by selected entities
- **Data Export**: Download data in various formats
- **Incomplete Data Handling**: Gracefully handles missing values

## Switching to Table View

Users can switch to the table view using the tab controls on the chart, or you can set it as the default view.
                `,
            },
        },
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
