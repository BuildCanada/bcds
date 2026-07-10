import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { RangeSlider, Slider } from "./Slider"

const meta: Meta<typeof Slider> = {
    title: "Components/Primitives/Slider",
    component: Slider,
}

export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
    args: {
        label: "Year",
        min: 2018,
        max: 2026,
        defaultValue: 2024,
        onValueChange: fn(),
        valueFormatter: (value) => value,
    },
}

export const Range = {
    render: () => (
        <RangeSlider
            label="Year range"
            min={2018}
            max={2026}
            defaultValue={[2020, 2025]}
            valueFormatter={(value) => value}
        />
    ),
}
