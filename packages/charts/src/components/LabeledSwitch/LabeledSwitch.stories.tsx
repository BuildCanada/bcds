import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "storybook/test"

import { LabeledSwitch } from "./LabeledSwitch"

const meta: Meta<typeof LabeledSwitch> = {
    title: "Components/LabeledSwitch",
    component: LabeledSwitch,
    parameters: {
        docs: {
            description: {
                component: `
A toggle switch component with a label and optional tooltip.

## Usage

\`\`\`tsx
import { LabeledSwitch } from "@buildcanada/charts"

<LabeledSwitch
  value={isEnabled}
  label="Enable feature"
  onToggle={() => setIsEnabled(!isEnabled)}
/>
\`\`\`

## With Tooltip

\`\`\`tsx
<LabeledSwitch
  value={value}
  label="Advanced mode"
  tooltip="Shows additional configuration options"
  onToggle={handleToggle}
/>
\`\`\`

## Controlled Component

This is a controlled component - you must manage the \`value\` state and handle \`onToggle\`.
                `,
            },
        },
    },
    argTypes: {
        value: { description: "Current toggle state (on/off)" },
        label: { description: "Label text displayed next to the switch" },
        tooltip: { description: "Optional tooltip text on hover" },
        disabled: { description: "Whether the switch is disabled" },
        onToggle: { description: "Callback when switch is toggled" },
    },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: "400px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof LabeledSwitch>

export const Off: Story = {
    args: {
        value: false,
        label: "Enable notifications",
        onToggle: fn(),
    },
}

export const On: Story = {
    args: {
        value: true,
        label: "Enable notifications",
        onToggle: fn(),
    },
}

export const WithTooltip: Story = {
    args: {
        value: false,
        label: "Show advanced options",
        tooltip: "This will reveal additional configuration settings for power users.",
        onToggle: fn(),
    },
}

export const Disabled: Story = {
    args: {
        value: false,
        label: "Premium feature",
        disabled: true,
        onToggle: fn(),
    },
}

export const DisabledOn: Story = {
    args: {
        value: true,
        label: "Always enabled",
        disabled: true,
        onToggle: fn(),
    },
}

export const Interactive: Story = {
    render: function InteractiveSwitch() {
        const [value, setValue] = React.useState(false)
        return (
            <LabeledSwitch
                value={value}
                label="Toggle me"
                tooltip="Click the switch to toggle it on and off"
                onToggle={() => setValue(!value)}
            />
        )
    },
}
