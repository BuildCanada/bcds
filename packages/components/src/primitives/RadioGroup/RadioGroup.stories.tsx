import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { RadioGroup } from "./RadioGroup"

const meta: Meta<typeof RadioGroup> = {
    title: "Components/Primitives/RadioGroup",
    component: RadioGroup,
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
    args: {
        legend: "Scale",
        defaultValue: "linear",
        onValueChange: fn(),
        options: [
            { label: "Linear", value: "linear" },
            { label: "Log", value: "log", description: "Useful for wide ranges" },
        ],
    },
}
