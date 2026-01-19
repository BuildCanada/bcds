import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "@storybook/test"
import { useState } from "react"

import { Checkbox } from "./Checkbox"

const meta: Meta<typeof Checkbox> = {
    title: "Components/Primitives/Checkbox",
    component: Checkbox,
    parameters: {
        docs: {
            description: {
                component: `
A styled checkbox component with label support.

## Usage

\`\`\`tsx
import { Checkbox } from "@buildcanada/components"

<Checkbox label="I agree to the terms" />
\`\`\`

## Controlled vs Uncontrolled

Use \`defaultChecked\` for uncontrolled or \`checked\` with \`onChange\` for controlled:

\`\`\`tsx
// Uncontrolled
<Checkbox label="Option" defaultChecked />

// Controlled
<Checkbox
  label="Option"
  checked={isChecked}
  onChange={(e) => setIsChecked(e.target.checked)}
/>
\`\`\`
                `,
            },
        },
    },
    argTypes: {
        label: { description: "The label text displayed next to the checkbox" },
        disabled: { description: "Whether the checkbox is disabled" },
        defaultChecked: { description: "Initial checked state (uncontrolled)" },
        checked: { description: "Controlled checked state" },
        onChange: { description: "Callback when checkbox state changes" },
    },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
    args: {
        label: "I agree to the terms and conditions",
    },
}

export const Checked: Story = {
    args: {
        label: "Subscribe to newsletter",
        defaultChecked: true,
    },
}

export const Unchecked: Story = {
    args: {
        label: "Remember my preferences",
        defaultChecked: false,
    },
}

export const Disabled: Story = {
    args: {
        label: "This option is disabled",
        disabled: true,
    },
}

export const DisabledChecked: Story = {
    args: {
        label: "This option is checked and disabled",
        defaultChecked: true,
        disabled: true,
    },
}

export const LongLabel: Story = {
    args: {
        label: "By checking this box, I confirm that I have read and understood the privacy policy, terms of service, and agree to receive communications from Build Canada.",
    },
}

// Interactive test: Click to toggle
export const ClickTest: Story = {
    args: {
        label: "Click to toggle",
        onChange: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)
        const checkbox = canvas.getByRole("checkbox", { name: /click to toggle/i })

        await expect(checkbox).not.toBeChecked()
        await userEvent.click(checkbox)
        await expect(checkbox).toBeChecked()
        await expect(args.onChange).toHaveBeenCalled()
    },
}

// Interactive test: Double click
export const DoubleClickTest: Story = {
    args: {
        label: "Double click test",
        onChange: fn(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const checkbox = canvas.getByRole("checkbox", { name: /double click/i })

        await expect(checkbox).not.toBeChecked()
        await userEvent.click(checkbox)
        await expect(checkbox).toBeChecked()
        await userEvent.click(checkbox)
        await expect(checkbox).not.toBeChecked()
    },
}

// Interactive test: Disabled should not toggle
export const DisabledClickTest: Story = {
    args: {
        label: "Disabled checkbox",
        disabled: true,
        onChange: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)
        const checkbox = canvas.getByRole("checkbox", { name: /disabled checkbox/i })

        await expect(checkbox).toBeDisabled()
        await userEvent.click(checkbox)
        await expect(args.onChange).not.toHaveBeenCalled()
    },
}

// Interactive test: Keyboard interaction
export const KeyboardTest: Story = {
    args: {
        label: "Keyboard toggle",
        onChange: fn(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const checkbox = canvas.getByRole("checkbox", { name: /keyboard toggle/i })

        checkbox.focus()
        await expect(checkbox).toHaveFocus()
        await userEvent.keyboard(" ")
        await expect(checkbox).toBeChecked()
    },
}

export const Controlled: Story = {
    render: function ControlledCheckbox() {
        const [checked, setChecked] = useState(false)
        return (
            <div>
                <Checkbox
                    label={`Controlled checkbox (${checked ? "checked" : "unchecked"})`}
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                />
                <p style={{ marginTop: "16px", fontFamily: "sans-serif", fontSize: "14px" }}>
                    The checkbox is currently: <strong>{checked ? "checked" : "unchecked"}</strong>
                </p>
            </div>
        )
    },
}

export const MultipleCheckboxes: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Checkbox label="Option A" defaultChecked />
            <Checkbox label="Option B" />
            <Checkbox label="Option C" />
            <Checkbox label="Option D (disabled)" disabled />
        </div>
    ),
}

export const FormExample: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "500px" }}>
            <h3 style={{ margin: 0, fontFamily: "sans-serif" }}>Communication Preferences</h3>
            <Checkbox label="Email updates about new features" defaultChecked />
            <Checkbox label="Weekly newsletter" defaultChecked />
            <Checkbox label="Partner offers and promotions" />
            <Checkbox label="Account activity alerts" defaultChecked />
        </div>
    ),
}
