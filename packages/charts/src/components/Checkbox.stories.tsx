import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"

import { Checkbox } from "./Checkbox"

const meta: Meta<typeof Checkbox> = {
    title: "Components/Checkbox",
    component: Checkbox,
    parameters: {
        docs: {
            description: {
                component: `
A checkbox component for the charts library.

## Usage

\`\`\`tsx
import { Checkbox } from "@buildcanada/charts"

<Checkbox
  checked={isChecked}
  label="Enable option"
  onChange={(e) => setIsChecked(e.target.checked)}
/>
\`\`\`

## Rich Labels

Labels can include React nodes for links or formatting:

\`\`\`tsx
<Checkbox
  checked={agreed}
  label={<span>I agree to the <a href="#">terms</a></span>}
  onChange={handleChange}
/>
\`\`\`

## Controlled Component

This is a controlled component - manage the \`checked\` state externally.
                `,
            },
        },
    },
    argTypes: {
        checked: { description: "Whether the checkbox is checked" },
        label: { description: "Label text or React node" },
        disabled: { description: "Whether the checkbox is disabled" },
        onChange: { description: "Callback when checkbox state changes" },
    },
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
