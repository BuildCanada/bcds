import type { Meta, StoryObj } from "@storybook/react"

import { LoadingIndicator } from "./LoadingIndicator"
import { Bounds } from "../../utils/index.js"

const meta: Meta<typeof LoadingIndicator> = {
    title: "Components/LoadingIndicator",
    component: LoadingIndicator,
    tags: ["autodocs"],
    decorators: [
        (Story) => (
            <div style={{ position: "relative", width: "200px", height: "200px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof LoadingIndicator>

export const Default: Story = {
    args: {},
}

export const WithTitle: Story = {
    args: {
        title: "Loading chart data...",
    },
}

export const CustomColor: Story = {
    args: {
        color: "#e63946",
        title: "Loading...",
    },
}

export const WithBackground: Story = {
    args: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        title: "Loading...",
    },
}

export const DarkTheme: Story = {
    args: {
        color: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        title: "Loading...",
    },
    decorators: [
        (Story) => (
            <div
                style={{
                    position: "relative",
                    width: "200px",
                    height: "200px",
                    backgroundColor: "#1a1a1a",
                }}
            >
                <Story />
            </div>
        ),
    ],
}

export const WithBounds: Story = {
    args: {
        bounds: new Bounds(10, 10, 180, 180),
        backgroundColor: "rgba(100, 100, 255, 0.1)",
        title: "Bounded loading...",
    },
}
