import type { Meta, StoryObj } from "@storybook/react"
import { Select } from "./Select"

const meta: Meta<typeof Select> = {
    title: "Components/Primitives/Select",
    component: Select,
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
    args: {
        label: "Sort order",
        defaultValue: "name",
        options: [
            { label: "Name", value: "name" },
            { label: "Value", value: "value" },
        ],
    },
}
