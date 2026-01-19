import type { Meta, StoryObj } from "@storybook/react"

import { Explorer } from "./Explorer"
import {
    SampleExplorerOfGraphers,
    SampleInlineDataExplorer,
} from "./Explorer.sample"
import { Bounds } from "../utils/index.js"

const meta: Meta<typeof Explorer> = {
    title: "Charts/Explorer",
    component: Explorer,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: `
A data exploration interface that wraps the Grapher with additional controls for filtering, selecting entities, and switching between chart types.

## Usage

\`\`\`tsx
import { Explorer } from "@buildcanada/charts"

<Explorer
  program={explorerProgram}
  grapherConfigs={grapherConfigs}
  bounds={bounds}
/>
\`\`\`

## Features

- **Entity Selection**: Filter data by countries, provinces, or other entities
- **Time Controls**: Adjust the time range being displayed
- **Chart Type Switching**: Toggle between different visualization types
- **Data Filtering**: Apply filters to narrow down the dataset

## Configuration

The Explorer is configured using an Explorer Program that defines:
- Available graphers and their configurations
- Entity selection options
- Default views and filters

## Embedding

Use \`isEmbeddedInPage\` prop when embedding in a page context for optimized display.
                `,
            },
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: "1000px", height: "700px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof Explorer>

export const WithGrapherConfigs: Story = {
    render: () => {
        const explorer = SampleExplorerOfGraphers({
            bounds: new Bounds(0, 0, 1000, 700),
            forceWideMode: true,
        })
        return <Explorer {...explorer.props} />
    },
}

export const WithInlineData: Story = {
    render: () => {
        const explorer = SampleInlineDataExplorer({
            bounds: new Bounds(0, 0, 1000, 700),
            forceWideMode: true,
        })
        return <Explorer {...explorer.props} />
    },
}

export const Embedded: Story = {
    render: () => {
        const explorer = SampleExplorerOfGraphers({
            bounds: new Bounds(0, 0, 800, 500),
            isEmbeddedInPage: true,
        })
        return <Explorer {...explorer.props} />
    },
    decorators: [
        (Story) => (
            <div style={{ width: "800px", height: "500px" }}>
                <Story />
            </div>
        ),
    ],
}
