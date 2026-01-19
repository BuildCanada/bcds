import type { Meta, StoryObj } from "@storybook/react"

import { Section } from "./Section"
import { Container } from "../Container"

const meta: Meta<typeof Section> = {
    title: "Components/Layout/Section",
    component: Section,
    parameters: {
        docs: {
            description: {
                component: `
A full-width section component with background colors and vertical padding.

## Usage

\`\`\`tsx
import { Section, Container } from "@buildcanada/components"

<Section background="linen" spacing="lg">
  <Container>
    <h2>Section Title</h2>
    <p>Section content goes here.</p>
  </Container>
</Section>
\`\`\`

## Backgrounds

- **white**: #FFFFFF
- **linen**: #F6ECE3 (Build Canada brand)
- **charcoal**: #272727 (dark mode)

## Building Page Layouts

Stack sections to create full page layouts:

\`\`\`tsx
<>
  <Section background="linen" spacing="xl">
    <Container><Hero /></Container>
  </Section>
  <Section background="white" spacing="lg">
    <Container><Content /></Container>
  </Section>
</>
\`\`\`
                `,
            },
        },
    },
    argTypes: {
        background: {
            control: "select",
            options: ["white", "linen", "charcoal"],
            description: "Background color of the section",
        },
        spacing: {
            control: "select",
            options: ["none", "sm", "md", "lg", "xl"],
            description: "Vertical padding (top and bottom)",
        },
    },
}

export default meta
type Story = StoryObj<typeof Section>

const SectionContent = ({ dark = false }: { dark?: boolean }) => (
    <Container>
        <div style={{
            fontFamily: "sans-serif",
            color: dark ? "#ffffff" : "#272727"
        }}>
            <h2 style={{ margin: "0 0 16px" }}>Section Title</h2>
            <p style={{ margin: 0 }}>
                This is example content inside a section. Sections provide consistent
                vertical spacing and background colors for page layouts.
            </p>
        </div>
    </Container>
)

export const Default: Story = {
    args: {
        children: <SectionContent />,
        background: "white",
        spacing: "lg",
    },
}

export const WhiteBackground: Story = {
    args: {
        children: <SectionContent />,
        background: "white",
        spacing: "lg",
    },
}

export const LinenBackground: Story = {
    args: {
        children: <SectionContent />,
        background: "linen",
        spacing: "lg",
    },
}

export const CharcoalBackground: Story = {
    args: {
        children: <SectionContent dark />,
        background: "charcoal",
        spacing: "lg",
    },
}

export const NoSpacing: Story = {
    args: {
        children: <SectionContent />,
        background: "linen",
        spacing: "none",
    },
}

export const SmallSpacing: Story = {
    args: {
        children: <SectionContent />,
        background: "linen",
        spacing: "sm",
    },
}

export const LargeSpacing: Story = {
    args: {
        children: <SectionContent />,
        background: "linen",
        spacing: "lg",
    },
}

export const ExtraLargeSpacing: Story = {
    args: {
        children: <SectionContent />,
        background: "linen",
        spacing: "xl",
    },
}

export const StackedSections: Story = {
    render: () => (
        <div>
            <Section background="linen" spacing="lg">
                <Container>
                    <h2 style={{ fontFamily: "sans-serif", margin: 0 }}>Linen Section</h2>
                </Container>
            </Section>
            <Section background="white" spacing="lg">
                <Container>
                    <h2 style={{ fontFamily: "sans-serif", margin: 0 }}>White Section</h2>
                </Container>
            </Section>
            <Section background="charcoal" spacing="lg">
                <Container>
                    <h2 style={{ fontFamily: "sans-serif", margin: 0, color: "#fff" }}>Charcoal Section</h2>
                </Container>
            </Section>
            <Section background="linen" spacing="lg">
                <Container>
                    <h2 style={{ fontFamily: "sans-serif", margin: 0 }}>Linen Section</h2>
                </Container>
            </Section>
        </div>
    ),
}
