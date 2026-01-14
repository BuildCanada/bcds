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
            isEmbeddedInAnOwidPage: true,
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
