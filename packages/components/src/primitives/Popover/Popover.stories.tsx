import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "../Button"
import { MenuButton, Popover } from "./index"

const meta: Meta<typeof Popover> = {
    title: "Components/Primitives/Popover",
    component: Popover,
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
    render: () => (
        <Popover trigger={<Button text="Settings" variant="secondary" icon={null} />}>
            <div>Popover content</div>
        </Popover>
    ),
}

export const Menu = {
    render: () => (
        <MenuButton
            label="Download"
            items={[
                { label: "PNG", value: "png" },
                { label: "SVG", value: "svg" },
            ]}
        />
    ),
}
