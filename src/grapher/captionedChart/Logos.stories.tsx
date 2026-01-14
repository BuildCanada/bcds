import type { Meta, StoryObj } from "@storybook/react"

import { Grapher } from "../core/Grapher"
import { createLineChartState } from "../../../.storybook/helpers/grapherStateFactory"
import { LogoOption } from "../../types/index.js"

const meta: Meta<typeof Grapher> = {
    title: "Charts/Logo Configuration",
    component: Grapher,
    parameters: {
        layout: "centered",
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
 * For backwards compatibility, the OWID logo is still available.
 */
export const OwidLogo: Story = {
    render: () => {
        const grapherState = createLineChartState({
            logo: LogoOption.owid,
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
            { logo: LogoOption.owid, label: "OWID" },
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
