import type { Meta, StoryObj } from "@storybook/react"

import { Grapher } from "./Grapher"
import {
    createLineChartState,
    createDiscreteBarChartState,
    createStackedAreaChartState,
    createStackedBarChartState,
    createSlopeChartState,
    createMapChartState,
    createCanadaMapChartState,
} from "../../../../../.storybook/helpers/grapherStateFactory"

const meta: Meta<typeof Grapher> = {
    title: "Charts/Grapher",
    component: Grapher,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: `
The main charting component that renders interactive data visualizations.

## Usage

\`\`\`tsx
import { Grapher, GrapherState } from "@buildcanada/charts"

const grapherState = new GrapherState({
  type: "LineChart",
  data: yourData,
  // ... configuration options
})

<Grapher grapherState={grapherState} />
\`\`\`

## Chart Types

- **LineChart**: Time series and trend data
- **DiscreteBarChart**: Categorical comparisons
- **StackedAreaChart**: Part-to-whole over time
- **StackedBarChart**: Part-to-whole comparisons
- **SlopeChart**: Change between two points
- **MapChart**: Geographic data visualization

## Responsive

The Grapher automatically adapts to its container size. Wrap it in a sized container for best results.
                `,
            },
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: "1100px", height: "660px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof Grapher>

export const LineChart: Story = {
    render: () => {
        const grapherState = createLineChartState()
        return <Grapher grapherState={grapherState} />
    },
}

export const DiscreteBarChart: Story = {
    render: () => {
        const grapherState = createDiscreteBarChartState()
        return <Grapher grapherState={grapherState} />
    },
}

export const StackedAreaChart: Story = {
    render: () => {
        const grapherState = createStackedAreaChartState()
        return <Grapher grapherState={grapherState} />
    },
}

export const StackedBarChart: Story = {
    render: () => {
        const grapherState = createStackedBarChartState()
        return <Grapher grapherState={grapherState} />
    },
}

export const SlopeChart: Story = {
    render: () => {
        const grapherState = createSlopeChartState()
        return <Grapher grapherState={grapherState} />
    },
}

export const MapChart: Story = {
    render: () => {
        const grapherState = createMapChartState()
        return <Grapher grapherState={grapherState} />
    },
}

export const CanadaMapChart: Story = {
    render: () => {
        const grapherState = createCanadaMapChartState()
        return <Grapher grapherState={grapherState} />
    },
}

export const SmallSize: Story = {
    render: () => {
        const grapherState = createLineChartState()
        return (
            <div style={{ width: "400px", height: "300px" }}>
                <Grapher grapherState={grapherState} />
            </div>
        )
    },
    decorators: [], // Remove the default decorator
}

export const LargeSize: Story = {
    render: () => {
        const grapherState = createLineChartState()
        return (
            <div style={{ width: "1200px", height: "800px" }}>
                <Grapher grapherState={grapherState} />
            </div>
        )
    },
    decorators: [], // Remove the default decorator
}
