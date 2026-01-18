import type { Meta, StoryObj } from "@storybook/react"

import { Stack } from "./Stack"

const meta: Meta<typeof Stack> = {
    title: "Components/Layout/Stack",
    component: Stack,
    argTypes: {
        direction: {
            control: "radio",
            options: ["vertical", "horizontal"],
        },
        spacing: {
            control: "select",
            options: ["none", "xs", "sm", "md", "lg", "xl"],
        },
        align: {
            control: "select",
            options: ["start", "center", "end", "stretch"],
        },
        justify: {
            control: "select",
            options: ["start", "center", "end", "between", "around"],
        },
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Stack>

const StackItem = ({ children, height }: { children: React.ReactNode; height?: string }) => (
    <div style={{
        padding: "16px 24px",
        backgroundColor: "#F6ECE3",
        border: "1px solid #272727",
        fontFamily: "sans-serif",
        height: height || "auto",
    }}>
        {children}
    </div>
)

export const Default: Story = {
    args: {
        direction: "vertical",
        spacing: "md",
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
            </>
        ),
    },
}

export const Vertical: Story = {
    args: {
        direction: "vertical",
        spacing: "md",
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
            </>
        ),
    },
}

export const Horizontal: Story = {
    args: {
        direction: "horizontal",
        spacing: "md",
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
            </>
        ),
    },
}

export const NoSpacing: Story = {
    args: {
        direction: "vertical",
        spacing: "none",
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
            </>
        ),
    },
}

export const ExtraSmallSpacing: Story = {
    args: {
        direction: "vertical",
        spacing: "xs",
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
            </>
        ),
    },
}

export const LargeSpacing: Story = {
    args: {
        direction: "vertical",
        spacing: "lg",
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
            </>
        ),
    },
}

export const AlignCenter: Story = {
    args: {
        direction: "horizontal",
        spacing: "md",
        align: "center",
        children: (
            <>
                <StackItem height="60px">Tall</StackItem>
                <StackItem height="40px">Medium</StackItem>
                <StackItem height="80px">Taller</StackItem>
            </>
        ),
    },
}

export const AlignStart: Story = {
    args: {
        direction: "horizontal",
        spacing: "md",
        align: "start",
        children: (
            <>
                <StackItem height="60px">Tall</StackItem>
                <StackItem height="40px">Medium</StackItem>
                <StackItem height="80px">Taller</StackItem>
            </>
        ),
    },
}

export const AlignEnd: Story = {
    args: {
        direction: "horizontal",
        spacing: "md",
        align: "end",
        children: (
            <>
                <StackItem height="60px">Tall</StackItem>
                <StackItem height="40px">Medium</StackItem>
                <StackItem height="80px">Taller</StackItem>
            </>
        ),
    },
}

export const JustifyBetween: Story = {
    args: {
        direction: "horizontal",
        spacing: "md",
        justify: "between",
        children: (
            <>
                <StackItem>Left</StackItem>
                <StackItem>Center</StackItem>
                <StackItem>Right</StackItem>
            </>
        ),
    },
    decorators: [
        (Story) => (
            <div style={{ width: "100%" }}>
                <Story />
            </div>
        ),
    ],
}

export const JustifyCenter: Story = {
    args: {
        direction: "horizontal",
        spacing: "md",
        justify: "center",
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
            </>
        ),
    },
    decorators: [
        (Story) => (
            <div style={{ width: "100%" }}>
                <Story />
            </div>
        ),
    ],
}

export const WithWrap: Story = {
    args: {
        direction: "horizontal",
        spacing: "md",
        wrap: true,
        children: (
            <>
                <StackItem>Item 1</StackItem>
                <StackItem>Item 2</StackItem>
                <StackItem>Item 3</StackItem>
                <StackItem>Item 4</StackItem>
                <StackItem>Item 5</StackItem>
                <StackItem>Item 6</StackItem>
                <StackItem>Item 7</StackItem>
                <StackItem>Item 8</StackItem>
            </>
        ),
    },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: "400px" }}>
                <Story />
            </div>
        ),
    ],
}

export const AllSpacings: Story = {
    render: () => (
        <Stack direction="vertical" spacing="lg">
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>None</p>
                <Stack direction="horizontal" spacing="none">
                    <StackItem>1</StackItem>
                    <StackItem>2</StackItem>
                    <StackItem>3</StackItem>
                </Stack>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Extra Small</p>
                <Stack direction="horizontal" spacing="xs">
                    <StackItem>1</StackItem>
                    <StackItem>2</StackItem>
                    <StackItem>3</StackItem>
                </Stack>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Small</p>
                <Stack direction="horizontal" spacing="sm">
                    <StackItem>1</StackItem>
                    <StackItem>2</StackItem>
                    <StackItem>3</StackItem>
                </Stack>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Medium</p>
                <Stack direction="horizontal" spacing="md">
                    <StackItem>1</StackItem>
                    <StackItem>2</StackItem>
                    <StackItem>3</StackItem>
                </Stack>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Large</p>
                <Stack direction="horizontal" spacing="lg">
                    <StackItem>1</StackItem>
                    <StackItem>2</StackItem>
                    <StackItem>3</StackItem>
                </Stack>
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Extra Large</p>
                <Stack direction="horizontal" spacing="xl">
                    <StackItem>1</StackItem>
                    <StackItem>2</StackItem>
                    <StackItem>3</StackItem>
                </Stack>
            </div>
        </Stack>
    ),
}
