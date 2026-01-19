import type { Meta, StoryObj } from "@storybook/react"

import { Divider } from "./Divider"

const meta: Meta<typeof Divider> = {
    title: "Components/Layout/Divider",
    component: Divider,
    parameters: {
        docs: {
            description: {
                component: `
A visual separator for dividing content sections.

## Usage

\`\`\`tsx
import { Divider } from "@buildcanada/components"

<Divider variant="solid" spacing="md" />
\`\`\`

## Variants

- **solid**: Standard solid line
- **dashed**: Dashed line for lighter separation
- **construction**: Blueprint-style pattern (Build Canada brand)

## Vertical Orientation

Use \`orientation="vertical"\` for horizontal layouts:

\`\`\`tsx
<div style={{ display: "flex" }}>
  <div>Left</div>
  <Divider orientation="vertical" />
  <div>Right</div>
</div>
\`\`\`
                `,
            },
        },
    },
    argTypes: {
        orientation: {
            control: "radio",
            options: ["horizontal", "vertical"],
            description: "Direction of the divider",
        },
        variant: {
            control: "select",
            options: ["solid", "dashed", "construction"],
            description: "Visual style of the divider",
        },
        spacing: {
            control: "select",
            options: ["none", "sm", "md", "lg"],
            description: "Margin around the divider",
        },
    },
}

export default meta
type Story = StoryObj<typeof Divider>

export const Default: Story = {
    args: {
        orientation: "horizontal",
        variant: "solid",
        spacing: "md",
    },
}

export const Solid: Story = {
    args: {
        variant: "solid",
        spacing: "md",
    },
}

export const Dashed: Story = {
    args: {
        variant: "dashed",
        spacing: "md",
    },
}

export const Construction: Story = {
    args: {
        variant: "construction",
        spacing: "md",
    },
}

export const NoSpacing: Story = {
    args: {
        variant: "solid",
        spacing: "none",
    },
}

export const SmallSpacing: Story = {
    args: {
        variant: "solid",
        spacing: "sm",
    },
}

export const LargeSpacing: Story = {
    args: {
        variant: "solid",
        spacing: "lg",
    },
}

export const Vertical: Story = {
    args: {
        orientation: "vertical",
        variant: "solid",
        spacing: "md",
    },
    decorators: [
        (Story) => (
            <div style={{ display: "flex", height: "100px", alignItems: "stretch" }}>
                <div style={{ padding: "16px", fontFamily: "sans-serif" }}>Left Content</div>
                <Story />
                <div style={{ padding: "16px", fontFamily: "sans-serif" }}>Right Content</div>
            </div>
        ),
    ],
}

export const VerticalDashed: Story = {
    args: {
        orientation: "vertical",
        variant: "dashed",
        spacing: "md",
    },
    decorators: [
        (Story) => (
            <div style={{ display: "flex", height: "100px", alignItems: "stretch" }}>
                <div style={{ padding: "16px", fontFamily: "sans-serif" }}>Left</div>
                <Story />
                <div style={{ padding: "16px", fontFamily: "sans-serif" }}>Right</div>
            </div>
        ),
    ],
}

export const InContent: Story = {
    render: () => (
        <div style={{ maxWidth: "600px", fontFamily: "sans-serif" }}>
            <h2 style={{ margin: "0 0 8px" }}>Section One</h2>
            <p style={{ margin: "0 0 16px", lineHeight: 1.6 }}>
                This is the first section of content. It contains some text that
                demonstrates how dividers work to separate content.
            </p>
            <Divider variant="solid" spacing="md" />
            <h2 style={{ margin: "0 0 8px" }}>Section Two</h2>
            <p style={{ margin: "0 0 16px", lineHeight: 1.6 }}>
                This is the second section. The solid divider above creates a
                clear visual break between the two sections.
            </p>
            <Divider variant="dashed" spacing="md" />
            <h2 style={{ margin: "0 0 8px" }}>Section Three</h2>
            <p style={{ margin: "0", lineHeight: 1.6 }}>
                The dashed divider provides a lighter separation, suggesting
                related but distinct content.
            </p>
        </div>
    ),
}

export const ConstructionStyle: Story = {
    render: () => (
        <div style={{ maxWidth: "600px", fontFamily: "sans-serif" }}>
            <h2 style={{ margin: "0 0 16px" }}>Build Canada</h2>
            <Divider variant="construction" spacing="lg" />
            <p style={{ margin: 0, lineHeight: 1.6 }}>
                The construction variant uses the blueprint/draft aesthetic that's
                part of the Build Canada design language. It features a distinctive
                pattern that references technical drawings.
            </p>
        </div>
    ),
}

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontFamily: "sans-serif" }}>
            <div>
                <p style={{ marginBottom: "8px" }}>Solid</p>
                <Divider variant="solid" spacing="none" />
            </div>
            <div>
                <p style={{ marginBottom: "8px" }}>Dashed</p>
                <Divider variant="dashed" spacing="none" />
            </div>
            <div>
                <p style={{ marginBottom: "8px" }}>Construction</p>
                <Divider variant="construction" spacing="none" />
            </div>
        </div>
    ),
}
