import type { Meta, StoryObj } from "@storybook/react"

import { Grapher } from "../core/Grapher"
import { createLineChartState } from "../../../../../.storybook/helpers/grapherStateFactory"
import { LogoOption } from "../../types/index.js"

const meta: Meta<typeof Grapher> = {
    title: "Charts/Logo Configuration",
    component: Grapher,
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: `
Configure the logo displayed on charts. Multiple logo options are available for different branding needs.

## Usage

\`\`\`tsx
import { Grapher, GrapherState, LogoOption } from "@buildcanada/charts"

const grapherState = new GrapherState({
  logo: LogoOption["buildcanada-wide"],
  // ... other options
})

<Grapher grapherState={grapherState} />
\`\`\`

## Available Logos

- **buildcanada-wide**: Wide Build Canada logo (default, recommended)
- **buildcanada**: Square Build Canada logo (compact)
- **canadaspends**: Canada Spends branded logo
- **legacy**: Legacy logo for backwards compatibility

## Hiding the Logo

\`\`\`tsx
const grapherState = new GrapherState({
  hideLogo: true,
  // ... other options
})
\`\`\`
                `,
            },
        },
    },
    decorators: [
        (Story) => (
            <div style={{ width: "800px", height: "500px" }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof Grapher>

/**
 * The default logo is the Build Canada wide logo.
 * This is the recommended logo for most use cases.
 */
export const DefaultBuildCanadaWideLogo: Story = {
    render: () => {
        const grapherState = createLineChartState({
            logo: LogoOption["buildcanada-wide"],
        })
        return <Grapher grapherState={grapherState} />
    },
}

/**
 * The square Build Canada logo is available for cases where
 * a more compact logo is preferred.
 */
export const BuildCanadaSquareLogo: Story = {
    render: () => {
        const grapherState = createLineChartState({
            logo: LogoOption.buildcanada,
        })
        return <Grapher grapherState={grapherState} />
    },
}

/**
 * For backwards compatibility, the legacy logo option is still available.
 */
export const LegacyLogo: Story = {
    render: () => {
        const grapherState = createLineChartState({
            logo: LogoOption.legacy,
        })
        return <Grapher grapherState={grapherState} />
    },
}

/**
 * The Canada Spends logo is available for Canada Spends branded charts.
 */
export const CanadaSpendsLogo: Story = {
    render: () => {
        const grapherState = createLineChartState({
            logo: LogoOption.canadaspends,
        })
        return <Grapher grapherState={grapherState} />
    },
}

/**
 * You can also hide the logo entirely if needed.
 */
export const NoLogo: Story = {
    render: () => {
        const grapherState = createLineChartState({
            hideLogo: true,
        })
        return <Grapher grapherState={grapherState} />
    },
}

/**
 * Comparison of all available logo options side by side.
 */
export const AllLogosComparison: Story = {
    render: () => {
        const logoOptions = [
            {
                logo: LogoOption["buildcanada-wide"],
                label: "Build Canada Wide (Default)",
            },
            { logo: LogoOption.buildcanada, label: "Build Canada (Square)" },
            { logo: LogoOption.canadaspends, label: "Canada Spends" },
            { logo: LogoOption.legacy, label: "Legacy" },
        ]

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "40px",
                }}
            >
                {logoOptions.map(({ logo, label }) => (
                    <div key={logo}>
                        <h3 style={{ marginBottom: "10px" }}>{label}</h3>
                        <div style={{ width: "800px", height: "400px" }}>
                            <Grapher
                                grapherState={createLineChartState({ logo })}
                            />
                        </div>
                    </div>
                ))}
            </div>
        )
    },
    decorators: [], // Remove default decorator for this story
}
