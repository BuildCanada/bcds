import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { SegmentedControl } from "./SegmentedControl"

const meta: Meta<typeof SegmentedControl> = {
    title: "Components/Primitives/SegmentedControl",
    component: SegmentedControl,
}

export default meta
type Story = StoryObj<typeof SegmentedControl>

export const Toggle: Story = {
    args: {
        label: "View",
        defaultValue: "chart",
        onValueChange: fn(),
        items: [
            { label: "Chart", value: "chart" },
            { label: "Table", value: "table" },
        ],
    },
}

export const Tabs: Story = {
    args: {
        label: "Chart tabs",
        mode: "tabs",
        defaultValue: "line",
        items: [
            { label: "Line", value: "line", panel: "Line chart options" },
            { label: "Bar", value: "bar", panel: "Bar chart options" },
        ],
    },
}
