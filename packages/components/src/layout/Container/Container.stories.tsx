import type { Meta, StoryObj } from "@storybook/react"

import { Container } from "./Container"

const meta: Meta<typeof Container> = {
    title: "Components/Layout/Container",
    component: Container,
    argTypes: {
        size: {
            control: "select",
            options: ["sm", "md", "lg", "xl", "full"],
        },
        as: {
            control: "select",
            options: ["div", "main", "article", "section"],
        },
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Container>

const PlaceholderContent = () => (
    <div style={{
        padding: "24px",
        backgroundColor: "#F6ECE3",
        border: "1px dashed #272727",
        textAlign: "center",
        fontFamily: "sans-serif"
    }}>
        Container Content
    </div>
)

export const Default: Story = {
    args: {
        children: <PlaceholderContent />,
        size: "lg",
    },
}

export const Small: Story = {
    args: {
        children: <PlaceholderContent />,
        size: "sm",
    },
}

export const Medium: Story = {
    args: {
        children: <PlaceholderContent />,
        size: "md",
    },
}

export const Large: Story = {
    args: {
        children: <PlaceholderContent />,
        size: "lg",
    },
}

export const ExtraLarge: Story = {
    args: {
        children: <PlaceholderContent />,
        size: "xl",
    },
}

export const FullWidth: Story = {
    args: {
        children: <PlaceholderContent />,
        size: "full",
    },
}

export const AsMain: Story = {
    args: {
        children: <PlaceholderContent />,
        size: "lg",
        as: "main",
    },
}

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Small (640px)</p>
                <Container size="sm">
                    <PlaceholderContent />
                </Container>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Medium (768px)</p>
                <Container size="md">
                    <PlaceholderContent />
                </Container>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Large (1024px)</p>
                <Container size="lg">
                    <PlaceholderContent />
                </Container>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Extra Large (1280px)</p>
                <Container size="xl">
                    <PlaceholderContent />
                </Container>
            </div>
        </div>
    ),
}
