import type { Meta, StoryObj } from "@storybook/react"

import { Section } from "./Section"
import { Container } from "../Container"

const meta: Meta<typeof Section> = {
    title: "Components/Layout/Section",
    component: Section,
    argTypes: {
        background: {
            control: "select",
            options: ["white", "linen", "charcoal"],
        },
        spacing: {
            control: "select",
            options: ["none", "sm", "md", "lg", "xl"],
        },
    },
    tags: ["autodocs"],
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
