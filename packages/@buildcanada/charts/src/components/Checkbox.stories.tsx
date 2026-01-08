import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"

import { Checkbox } from "./Checkbox"

const meta: Meta<typeof Checkbox> = {
    title: "Components/Checkbox",
    component: Checkbox,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div style={{ maxWidth: "300px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Unchecked: Story = {
    args: {
        checked: false,
        label: "Accept terms and conditions",
        onChange: fn(),
    },
}

export const Checked: Story = {
    args: {
        checked: true,
        label: "Accept terms and conditions",
        onChange: fn(),
    },
}

export const Disabled: Story = {
    args: {
        checked: false,
        label: "This option is disabled",
        disabled: true,
        onChange: fn(),
    },
}

export const DisabledChecked: Story = {
    args: {
        checked: true,
        label: "This option is disabled but checked",
        disabled: true,
        onChange: fn(),
    },
}

export const WithRichLabel: Story = {
    args: {
        checked: false,
        label: (
            <span>
                I agree to the <a href="#">terms of service</a>
            </span>
        ),
        onChange: fn(),
    },
}

export const Interactive: Story = {
    render: function InteractiveCheckbox() {
        const [checked, setChecked] = React.useState(false)
        return (
            <Checkbox
                checked={checked}
                label="Click me to toggle"
                onChange={(e) => setChecked(e.target.checked)}
            />
        )
    },
}
