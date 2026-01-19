import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "@storybook/test"
import { faDownload, faPlus, faCheck, faEnvelope } from "@fortawesome/free-solid-svg-icons"

import { Button } from "./Button"

const meta: Meta<typeof Button> = {
    title: "Components/Primitives/Button",
    component: Button,
    parameters: {
        docs: {
            description: {
                component: `
A versatile button component that supports multiple variants, sizes, and icon configurations.

## Usage

\`\`\`tsx
import { Button } from "@buildcanada/components"

<Button text="Click me" variant="solid-auburn" />
\`\`\`

## Features

- **6 variants**: solid-auburn, solid-charcoal, solid-linen, outline-auburn, outline-charcoal, outline-white
- **3 sizes**: sm, md, lg
- **Icon support**: Left or right positioned icons using FontAwesome
- **Link mode**: Can render as an anchor tag with \`href\` prop
- **Full width**: Expand to container width with \`fullWidth\` prop
                `,
            },
        },
    },
    argTypes: {
        variant: {
            control: "select",
            options: [
                "solid-auburn",
                "solid-charcoal",
                "solid-linen",
                "outline-auburn",
                "outline-charcoal",
                "outline-white",
            ],
            description: "The visual style variant of the button",
        },
        size: {
            control: "radio",
            options: ["sm", "md", "lg"],
            description: "The size of the button",
        },
        iconPosition: {
            control: "radio",
            options: ["left", "right"],
            description: "Position of the icon relative to the text",
        },
        text: {
            description: "The button label text",
        },
        icon: {
            description: "FontAwesome icon definition. Defaults to arrow-right.",
        },
        disabled: {
            description: "Whether the button is disabled",
        },
        fullWidth: {
            description: "Whether the button should expand to full container width",
        },
        href: {
            description: "If provided, renders as an anchor tag instead of button",
        },
    },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
    args: {
        text: "Get Started",
        variant: "solid-auburn",
    },
}

export const SolidAuburn: Story = {
    args: {
        text: "Learn More",
        variant: "solid-auburn",
    },
}

export const SolidCharcoal: Story = {
    args: {
        text: "View Projects",
        variant: "solid-charcoal",
    },
}

export const SolidLinen: Story = {
    args: {
        text: "Explore",
        variant: "solid-linen",
    },
}

export const OutlineAuburn: Story = {
    args: {
        text: "Subscribe",
        variant: "outline-auburn",
    },
}

export const OutlineCharcoal: Story = {
    args: {
        text: "Read Article",
        variant: "outline-charcoal",
    },
}

export const OutlineWhite: Story = {
    args: {
        text: "Contact Us",
        variant: "outline-white",
    },
    parameters: {
        backgrounds: { default: "charcoal" },
    },
}

export const Small: Story = {
    args: {
        text: "Small Button",
        variant: "solid-auburn",
        size: "sm",
    },
}

export const Medium: Story = {
    args: {
        text: "Medium Button",
        variant: "solid-auburn",
        size: "md",
    },
}

export const Large: Story = {
    args: {
        text: "Large Button",
        variant: "solid-auburn",
        size: "lg",
    },
}

export const WithIconRight: Story = {
    args: {
        text: "Download Report",
        variant: "solid-auburn",
        icon: faDownload,
        iconPosition: "right",
    },
}

export const WithIconLeft: Story = {
    args: {
        text: "Add Item",
        variant: "solid-charcoal",
        icon: faPlus,
        iconPosition: "left",
    },
}

export const IconOnly: Story = {
    args: {
        icon: faEnvelope,
        variant: "outline-auburn",
        ariaLabel: "Send email",
    },
}

export const NoIcon: Story = {
    args: {
        text: "No Arrow",
        variant: "solid-auburn",
        icon: null,
    },
}

export const Disabled: Story = {
    args: {
        text: "Disabled",
        variant: "solid-auburn",
        disabled: true,
    },
}

export const FullWidth: Story = {
    args: {
        text: "Full Width Button",
        variant: "solid-auburn",
        fullWidth: true,
    },
}

export const AsLink: Story = {
    args: {
        text: "Visit Website",
        variant: "solid-auburn",
        href: "https://buildcanada.com",
    },
}

export const SubmitButton: Story = {
    args: {
        text: "Submit Form",
        variant: "solid-auburn",
        type: "submit",
        icon: faCheck,
    },
}

// Interactive test: Button click
export const ClickTest: Story = {
    args: {
        text: "Click Me",
        variant: "solid-auburn",
        onClick: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)
        const button = canvas.getByRole("button", { name: /click me/i })

        await expect(button).toBeInTheDocument()
        await userEvent.click(button)
        await expect(args.onClick).toHaveBeenCalled()
    },
}

// Interactive test: Disabled button should not be clickable
export const DisabledClickTest: Story = {
    args: {
        text: "Disabled Button",
        variant: "solid-auburn",
        disabled: true,
        onClick: fn(),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)
        const button = canvas.getByRole("button", { name: /disabled button/i })

        await expect(button).toBeDisabled()
        await userEvent.click(button)
        await expect(args.onClick).not.toHaveBeenCalled()
    },
}

// Interactive test: Hover state
export const HoverTest: Story = {
    args: {
        text: "Hover Me",
        variant: "solid-auburn",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const button = canvas.getByRole("button", { name: /hover me/i })

        await expect(button).toBeInTheDocument()
        await userEvent.hover(button)
        // Visual check - hover state should be visible
    },
}

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <Button text="Solid Auburn" variant="solid-auburn" />
                <Button text="Solid Charcoal" variant="solid-charcoal" />
                <Button text="Solid Linen" variant="solid-linen" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <Button text="Outline Auburn" variant="outline-auburn" />
                <Button text="Outline Charcoal" variant="outline-charcoal" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", backgroundColor: "#272727", padding: "16px" }}>
                <Button text="Outline White" variant="outline-white" />
            </div>
        </div>
    ),
}

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <Button text="Small" variant="solid-auburn" size="sm" />
            <Button text="Medium" variant="solid-auburn" size="md" />
            <Button text="Large" variant="solid-auburn" size="lg" />
        </div>
    ),
}
