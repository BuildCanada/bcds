import type { Meta, StoryObj } from "@storybook/react"
import { faDownload, faShare, faPlus } from "@fortawesome/free-solid-svg-icons"

import { Button } from "./Button"

const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
    argTypes: {
        theme: {
            control: "select",
            options: [
                "solid-vermillion",
                "solid-blue",
                "solid-dark-blue",
                "solid-light-blue",
                "outline-vermillion",
                "outline-light-blue",
                "outline-white",
            ],
        },
        iconPosition: {
            control: "radio",
            options: ["left", "right"],
        },
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
    args: {
        text: "Click me",
        theme: "solid-vermillion",
    },
}

export const WithIconRight: Story = {
    args: {
        text: "Download",
        theme: "solid-blue",
        icon: faDownload,
        iconPosition: "right",
    },
}

export const WithIconLeft: Story = {
    args: {
        text: "Add Item",
        theme: "solid-dark-blue",
        icon: faPlus,
        iconPosition: "left",
    },
}

export const IconOnly: Story = {
    args: {
        theme: "outline-light-blue",
        icon: faShare,
        ariaLabel: "Share",
    },
}

export const Disabled: Story = {
    args: {
        text: "Disabled",
        theme: "solid-vermillion",
        disabled: true,
    },
}

export const AsLink: Story = {
    args: {
        text: "Visit Link",
        theme: "solid-blue",
        href: "https://example.com",
    },
}

export const OutlineVermillion: Story = {
    args: {
        text: "Outline Style",
        theme: "outline-vermillion",
    },
}

export const LightBlue: Story = {
    args: {
        text: "Light Blue",
        theme: "solid-light-blue",
    },
}
