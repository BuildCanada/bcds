import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"

import { Dialog, type DialogPosition } from "./Dialog"
import { Button } from "../../primitives/Button"

const meta: Meta<typeof Dialog> = {
    title: "Components/Feedback/Dialog",
    component: Dialog,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: `
A non-modal floating panel that doesn't block interaction with the rest of the UI.

## Usage

\`\`\`tsx
import { Dialog } from "@buildcanada/components"

function MyComponent() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button text="Open Dialog" onClick={() => setOpen(true)} />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Dialog Title"
        position="bottom-right"
      >
        <p>Dialog content goes here.</p>
      </Dialog>
    </>
  )
}
\`\`\`

## Key Features

- **Non-modal**: Does not block interaction with the rest of the UI
- **Content-sized**: Automatically sizes to fit its contents
- **Corner positioning**: Place in any corner or center of the screen
- **No rounded corners**: Sharp edges for a clean, modern look

## Positions

- \`top-left\`
- \`top-right\`
- \`bottom-left\`
- \`bottom-right\` (default)
- \`center\`

## Offset

Use the \`offset\` prop to control distance from screen edges (default: 16px).
                `,
            },
        },
    },
    args: {
        open: true,
        title: "Dialog Title",
        description: "",
        position: "bottom-right",
        offset: 16,
        closeOnEscape: true,
        showCloseButton: true,
    },
    argTypes: {
        open: {
            control: "boolean",
            description: "Whether the dialog is open",
        },
        title: {
            control: "text",
            description: "Title displayed in the dialog header",
        },
        description: {
            control: "text",
            description: "Optional description below the title",
        },
        position: {
            control: "select",
            options: ["top-left", "top-right", "bottom-left", "bottom-right", "center"],
            description: "Position of the dialog on screen",
        },
        offset: {
            control: { type: "number", min: 0, max: 100 },
            description: "Distance from screen edges in pixels",
        },
        closeOnEscape: {
            control: "boolean",
            description: "Whether pressing Escape closes the dialog",
        },
        showCloseButton: {
            control: "boolean",
            description: "Whether to show the close button",
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
type Story = StoryObj<typeof Dialog>

// Page content to demonstrate non-blocking behavior
function PageContent() {
    return (
        <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
            <h1>Page Content</h1>
            <p>This content remains interactive when the dialog is open.</p>
            <p>
                <button onClick={() => console.log("Button clicked!")} style={{ padding: "8px 16px" }}>
                    Clickable Button
                </button>
            </p>
            <p>
                <input
                    type="text"
                    placeholder="Type here while dialog is open..."
                    style={{ padding: "8px", width: "300px" }}
                />
            </p>
        </div>
    )
}

// Simple template that renders the dialog with args
function DialogTemplate(args: React.ComponentProps<typeof Dialog>) {
    return (
        <Dialog
            {...args}
            onClose={() => console.log("Dialog closed")}
        >
            <p style={{ fontFamily: "sans-serif", margin: 0, maxWidth: "280px" }}>
                This dialog doesn't block interaction with the page behind it.
            </p>
        </Dialog>
    )
}

export const Default: Story = {
    render: (args) => <DialogTemplate {...args} />,
}

export const TopLeft: Story = {
    args: {
        position: "top-left",
        title: "Top Left",
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const TopRight: Story = {
    args: {
        position: "top-right",
        title: "Top Right",
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const BottomLeft: Story = {
    args: {
        position: "bottom-left",
        title: "Bottom Left",
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const BottomRight: Story = {
    args: {
        position: "bottom-right",
        title: "Bottom Right",
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const Centered: Story = {
    args: {
        position: "center",
        title: "Centered",
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const WithDescription: Story = {
    args: {
        title: "Notifications",
        description: "You have 3 unread messages.",
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const CustomOffset: Story = {
    args: {
        title: "Custom Offset",
        offset: 48,
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const NoCloseButton: Story = {
    args: {
        title: "No Close Button",
        showCloseButton: false,
        description: "Press Escape to close.",
    },
    render: (args) => <DialogTemplate {...args} />,
}

export const WideContent: Story = {
    args: {
        title: "Wide Content",
    },
    render: (args) => (
        <Dialog {...args} onClose={() => console.log("Dialog closed")}>
            <div style={{ fontFamily: "sans-serif", width: "400px" }}>
                <p>This dialog has wider content and will size accordingly.</p>
                <p>The dialog always sizes to fit its contents.</p>
            </div>
        </Dialog>
    ),
}

export const AllPositions: Story = {
    parameters: {
        controls: { disable: true },
    },
    render: function AllPositionsDemo() {
        const [openDialog, setOpenDialog] = useState<string | null>(null)

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
                            onClick={() => setOpenDialog(openDialog === key ? null : key)}
                            variant={openDialog === key ? "solid-auburn" : "outline-charcoal"}
                        />
                    ))}
                </div>
                {positions.map(({ key, label }) => (
                    <Dialog
                        key={key}
                        open={openDialog === key}
                        onClose={() => setOpenDialog(null)}
                        title={label}
                        position={key}
                    >
                        <p style={{ fontFamily: "sans-serif", margin: 0 }}>
                            Positioned: {label}
                        </p>
                    </Dialog>
                ))}
            </>
        )
    },
}
