import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "@storybook/test"

import { TextField } from "./TextField"

const meta: Meta<typeof TextField> = {
    title: "Components/Primitives/TextField",
    component: TextField,
    parameters: {
        docs: {
            description: {
                component: `
A form text input component with label, hint, and error states.

## Usage

\`\`\`tsx
import { TextField } from "@buildcanada/components"

<TextField
  label="Email Address"
  type="email"
  placeholder="you@example.com"
/>
\`\`\`

## Input Types

Supports standard HTML input types: text, email, password, number, tel, url.

## Validation States

\`\`\`tsx
// With hint text
<TextField label="Password" hint="Must be 8+ characters" />

// With error
<TextField label="Email" error="Invalid email format" />

// Required field
<TextField label="Name" required />
\`\`\`
                `,
            },
        },
    },
    argTypes: {
        type: {
            control: "select",
            options: ["text", "email", "password", "number", "tel", "url"],
            description: "HTML input type",
        },
        label: { description: "Label text above the input" },
        placeholder: { description: "Placeholder text" },
        hint: { description: "Helper text below the input" },
        error: { description: "Error message (shows error state when set)" },
        required: { description: "Whether the field is required" },
        disabled: { description: "Whether the input is disabled" },
    },
}

export default meta
type Story = StoryObj<typeof TextField>

export const Default: Story = {
    args: {
        label: "Full Name",
        placeholder: "Enter your full name",
    },
}

export const WithValue: Story = {
    args: {
        label: "Email Address",
        type: "email",
        value: "contact@buildcanada.com",
    },
}

export const WithPlaceholder: Story = {
    args: {
        label: "Company",
        placeholder: "Your company name",
    },
}

export const WithHint: Story = {
    args: {
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
        hint: "Must be at least 8 characters long",
    },
}

export const WithError: Story = {
    args: {
        label: "Email Address",
        type: "email",
        value: "invalid-email",
        error: "Please enter a valid email address",
    },
}

export const Required: Story = {
    args: {
        label: "Email Address",
        type: "email",
        placeholder: "you@example.com",
        required: true,
    },
}

export const Disabled: Story = {
    args: {
        label: "Organization",
        value: "Build Canada",
        disabled: true,
    },
}

export const EmailType: Story = {
    args: {
        label: "Email",
        type: "email",
        placeholder: "you@example.com",
    },
}

export const PasswordType: Story = {
    args: {
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
    },
}

export const NumberType: Story = {
    args: {
        label: "Amount (CAD)",
        type: "number",
        placeholder: "0.00",
    },
}

export const TelType: Story = {
    args: {
        label: "Phone Number",
        type: "tel",
        placeholder: "+1 (555) 123-4567",
    },
}

export const NoLabel: Story = {
    args: {
        placeholder: "Search...",
        type: "text",
    },
}

// Interactive test: Type in the field
export const TypeTest: Story = {
    args: {
        label: "Username",
        placeholder: "Enter username",
        onChange: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByRole("textbox", { name: /username/i })

        await expect(input).toBeInTheDocument()
        await userEvent.type(input, "testuser")
        await expect(input).toHaveValue("testuser")
        await expect(args.onChange).toHaveBeenCalled()
    },
}

// Interactive test: Focus and blur
export const FocusBlurTest: Story = {
    args: {
        label: "Email",
        placeholder: "Enter email",
        onFocus: fn(),
        onBlur: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByRole("textbox", { name: /email/i })

        await userEvent.click(input)
        await expect(args.onFocus).toHaveBeenCalled()

        await userEvent.tab()
        await expect(args.onBlur).toHaveBeenCalled()
    },
}

// Interactive test: Disabled field
export const DisabledTest: Story = {
    args: {
        label: "Locked Field",
        value: "Cannot edit this",
        disabled: true,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByRole("textbox", { name: /locked field/i })

        await expect(input).toBeDisabled()
        await expect(input).toHaveValue("Cannot edit this")
    },
}

// Interactive test: Error state
export const ErrorStateTest: Story = {
    args: {
        label: "Email",
        value: "invalid",
        error: "Invalid email format",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const input = canvas.getByRole("textbox", { name: /email/i })
        const errorMessage = canvas.getByText("Invalid email format")

        await expect(input).toHaveAttribute("aria-invalid", "true")
        await expect(errorMessage).toBeInTheDocument()
    },
}

export const AllStates: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "400px" }}>
            <TextField
                label="Default"
                placeholder="Enter text..."
            />
            <TextField
                label="With Value"
                value="Some content"
            />
            <TextField
                label="With Hint"
                placeholder="Enter text..."
                hint="This is a helpful hint"
            />
            <TextField
                label="With Error"
                value="Invalid input"
                error="This field has an error"
            />
            <TextField
                label="Required Field"
                placeholder="This field is required"
                required
            />
            <TextField
                label="Disabled"
                value="Cannot edit"
                disabled
            />
        </div>
    ),
}
