import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { useArgs } from "storybook/preview-api"

import { PopupForm } from "./PopupForm"
import { Button } from "../../primitives/Button"
import { TextField } from "../../primitives/TextField"
import { Checkbox } from "../../primitives/Checkbox"

const meta: Meta<typeof PopupForm> = {
    title: "Components/Feedback/PopupForm",
    component: PopupForm,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: `
A non-modal form panel that composes Dialog with form elements and action buttons.

## Usage

\`\`\`tsx
import { PopupForm, TextField, Checkbox } from "@buildcanada/components"

function MyComponent() {
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    console.log("Form submitted")
    setOpen(false)
  }

  return (
    <>
      <Button text="Open Form" onClick={() => setOpen(true)} />
      <PopupForm
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        title="Contact Us"
        position="bottom-right"
      >
        <TextField label="Name" required />
        <TextField label="Email" type="email" required />
        <Checkbox label="Subscribe to newsletter" />
      </PopupForm>
    </>
  )
}
\`\`\`

## Key Features

- **Non-blocking**: Users can still interact with the page
- **Corner positioning**: Place in any corner of the screen
- **Composable**: Works with TextField, Checkbox, and other form primitives

## Props

- **position**: Where to place the form (default: "bottom-right")
- **offset**: Distance from screen edges (default: 16px)
- **submitText** / **cancelText**: Button labels
- **isSubmitting**: Shows loading state on submit button
                `,
            },
        },
    },
    args: {
        open: true,
        title: "Form Title",
        description: "",
        position: "bottom-right",
        offset: 16,
        submitText: "Submit",
        cancelText: "Cancel",
        showCancel: true,
        isSubmitting: false,
        submitDisabled: false,
        closeOnEscape: true,
    },
    argTypes: {
        open: {
            control: "boolean",
            description: "Whether the form is open",
        },
        title: {
            control: "text",
            description: "Title displayed in the form header",
        },
        description: {
            control: "text",
            description: "Optional description below the title",
        },
        position: {
            control: "select",
            options: ["top-left", "top-right", "bottom-left", "bottom-right", "center"],
            description: "Position of the popup form on screen",
        },
        offset: {
            control: { type: "number", min: 0, max: 100 },
            description: "Distance from screen edges in pixels",
        },
        submitText: {
            control: "text",
            description: "Text for the submit button",
        },
        cancelText: {
            control: "text",
            description: "Text for the cancel button",
        },
        showCancel: {
            control: "boolean",
            description: "Whether to show the cancel button",
        },
        isSubmitting: {
            control: "boolean",
            description: "Whether the form is currently submitting",
        },
        submitDisabled: {
            control: "boolean",
            description: "Whether the submit button is disabled",
        },
        closeOnEscape: {
            control: "boolean",
            description: "Whether pressing Escape closes the form",
        },
    },
    decorators: [
        (Story) => (
            <div style={{ minHeight: "400px" }}>
                <PageContent />
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof PopupForm>

// Page content to demonstrate non-blocking behavior
function PageContent() {
    return (
        <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
            <h1>Page Content</h1>
            <p>This content remains interactive when the form is open.</p>
            <p>
                <button onClick={() => alert("Button clicked!")} style={{ padding: "8px 16px" }}>
                    Clickable Button
                </button>
            </p>
            <p>
                <input
                    type="text"
                    placeholder="Type here while form is open..."
                    style={{ padding: "8px", width: "300px" }}
                />
            </p>
        </div>
    )
}

// Template that syncs with Storybook args
function PopupFormTemplate(args: React.ComponentProps<typeof PopupForm> & { children?: React.ReactNode }) {
    const [, setArgs] = useArgs()

    return (
        <PopupForm
            {...args}
            onClose={() => setArgs({ open: false })}
            onSubmit={() => {
                console.log("Form submitted")
                setArgs({ open: false })
            }}
        >
            {args.children || (
                <>
                    <TextField label="Name" placeholder="Your name" />
                    <TextField label="Email" type="email" placeholder="you@example.com" />
                </>
            )}
        </PopupForm>
    )
}

export const Default: Story = {
    render: (args) => <PopupFormTemplate {...args} />,
}

export const WithDescription: Story = {
    args: {
        title: "Contact Us",
        description: "We'd love to hear from you.",
    },
    render: (args) => <PopupFormTemplate {...args} />,
}

export const NewsletterSignup: Story = {
    args: {
        title: "Subscribe",
        description: "Get updates delivered to your inbox.",
        submitText: "Subscribe",
    },
    render: (args) => (
        <PopupFormTemplate {...args}>
            <TextField label="Email Address" type="email" placeholder="you@example.com" />
            <Checkbox label="I agree to receive emails" />
        </PopupFormTemplate>
    ),
}

export const TopLeftPosition: Story = {
    args: {
        title: "Quick Feedback",
        position: "top-left",
        submitText: "Send",
    },
    render: (args) => (
        <PopupFormTemplate {...args}>
            <TextField label="Your feedback" placeholder="Tell us what you think..." />
        </PopupFormTemplate>
    ),
}

export const CenteredPosition: Story = {
    args: {
        title: "Sign In",
        position: "center",
        submitText: "Sign In",
        showCancel: false,
    },
    render: (args) => (
        <PopupFormTemplate {...args}>
            <TextField label="Email" type="email" placeholder="you@example.com" />
            <TextField label="Password" type="password" placeholder="Enter password" />
            <Checkbox label="Remember me" />
        </PopupFormTemplate>
    ),
}

export const NoCancel: Story = {
    args: {
        title: "Required Action",
        description: "Please complete this form to continue.",
        submitText: "Continue",
        showCancel: false,
    },
    render: (args) => (
        <PopupFormTemplate {...args}>
            <Checkbox label="I accept the terms and conditions" />
        </PopupFormTemplate>
    ),
}

export const CustomOffset: Story = {
    args: {
        title: "Settings",
        offset: 48,
        submitText: "Save",
    },
    render: (args) => (
        <PopupFormTemplate {...args}>
            <TextField label="Display Name" placeholder="Enter name" />
            <Checkbox label="Enable notifications" />
        </PopupFormTemplate>
    ),
}

export const SubmittingState: Story = {
    args: {
        title: "Save Changes",
        submitText: "Save",
        isSubmitting: true,
    },
    render: (args) => (
        <PopupFormTemplate {...args}>
            <TextField label="Name" defaultValue="John Doe" />
            <TextField label="Email" type="email" defaultValue="john@example.com" />
        </PopupFormTemplate>
    ),
}

export const DisabledSubmit: Story = {
    args: {
        title: "Subscribe",
        submitText: "Subscribe",
        submitDisabled: true,
    },
    render: (args) => (
        <PopupFormTemplate {...args}>
            <TextField label="Email" type="email" placeholder="Enter email to enable submit" />
        </PopupFormTemplate>
    ),
}

export const AllPositions: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: function AllPositionsDemo() {
        const [openForm, setOpenForm] = useState<string | null>(null)

        const positions = [
            { key: "top-left", label: "Top Left" },
            { key: "top-right", label: "Top Right" },
            { key: "bottom-left", label: "Bottom Left" },
            { key: "bottom-right", label: "Bottom Right" },
            { key: "center", label: "Center" },
        ] as const

        return (
            <>
                <div style={{
                    position: "fixed",
                    top: "24px",
                    right: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    zIndex: 1
                }}>
                    {positions.map(({ key, label }) => (
                        <Button
                            key={key}
                            text={label}
                            onClick={() => setOpenForm(openForm === key ? null : key)}
                            variant={openForm === key ? "solid-auburn" : "outline-charcoal"}
                        />
                    ))}
                </div>
                {positions.map(({ key, label }) => (
                    <PopupForm
                        key={key}
                        open={openForm === key}
                        onClose={() => setOpenForm(null)}
                        onSubmit={() => setOpenForm(null)}
                        title={label}
                        position={key}
                        submitText="Submit"
                    >
                        <TextField label="Field" placeholder="Enter text" />
                    </PopupForm>
                ))}
            </>
        )
    },
}
