import type { Meta, StoryObj } from "@storybook/react"

import { StatBlock } from "./StatBlock"

const meta: Meta<typeof StatBlock> = {
    title: "Components/Content/StatBlock",
    component: StatBlock,
    parameters: {
        docs: {
            description: {
                component: `
A component for displaying key statistics with optional trend indicators.

## Usage

\`\`\`tsx
import { StatBlock } from "@buildcanada/components"

<StatBlock
  value="$456.2B"
  label="Federal Spending"
  change="+8.3%"
  trend="up"
/>
\`\`\`

## With Description

\`\`\`tsx
<StatBlock
  value="$1.2T"
  label="Total Revenue"
  description="Combined federal and provincial revenues"
  change="+7.8%"
  trend="up"
  size="lg"
/>
\`\`\`

## Trend Indicators

- **up**: Green indicator for positive trends
- **down**: Red indicator for negative trends
- **neutral**: Gray indicator for no change
                `,
            },
        },
    },
    argTypes: {
        size: {
            control: "select",
            options: ["sm", "md", "lg"],
            description: "Size of the stat display",
        },
        trend: {
            control: "select",
            options: [undefined, "up", "down", "neutral"],
            description: "Trend direction for the change indicator",
        },
        value: { description: "The main statistic value to display" },
        label: { description: "Label describing the statistic" },
        description: { description: "Additional context or description" },
        change: { description: "Change value (e.g., '+8.3%', '-2.1%')" },
    },
}

export default meta
type Story = StoryObj<typeof StatBlock>

export const Default: Story = {
    args: {
        value: "$456.2B",
        label: "Federal Spending",
        size: "md",
    },
}

export const WithDescription: Story = {
    args: {
        value: "$456.2B",
        label: "Federal Spending",
        description: "Total federal government expenditure for fiscal year 2023-24",
        size: "md",
    },
}

export const TrendUp: Story = {
    args: {
        value: "$89.5B",
        label: "Healthcare Budget",
        change: "+12.3%",
        trend: "up",
        size: "md",
    },
}

export const TrendDown: Story = {
    args: {
        value: "2.1M",
        label: "Employment",
        change: "-3.4%",
        trend: "down",
        size: "md",
    },
}

export const TrendNeutral: Story = {
    args: {
        value: "14",
        label: "Provinces & Territories",
        change: "No change",
        trend: "neutral",
        size: "md",
    },
}

export const Small: Story = {
    args: {
        value: "$12.8B",
        label: "Education",
        change: "+5.2%",
        trend: "up",
        size: "sm",
    },
}

export const Medium: Story = {
    args: {
        value: "$12.8B",
        label: "Education",
        change: "+5.2%",
        trend: "up",
        size: "md",
    },
}

export const Large: Story = {
    args: {
        value: "$12.8B",
        label: "Education",
        change: "+5.2%",
        trend: "up",
        size: "lg",
    },
}

export const PercentageValue: Story = {
    args: {
        value: "42.5%",
        label: "Debt-to-GDP Ratio",
        description: "Compared to 38.2% in the previous year",
        size: "md",
    },
}

export const LargeNumber: Story = {
    args: {
        value: "38,941,457",
        label: "Population of Canada",
        description: "2023 Census estimate",
        size: "lg",
    },
}

export const WithFullContext: Story = {
    args: {
        value: "$1.2T",
        label: "Total Government Revenue",
        description: "Combined federal, provincial, and territorial revenues",
        change: "+7.8% YoY",
        trend: "up",
        size: "lg",
    },
}

export const StatBlocksRow: Story = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            <StatBlock
                value="$456.2B"
                label="Federal Spending"
                change="+8.3%"
                trend="up"
                size="md"
            />
            <StatBlock
                value="$89.5B"
                label="Healthcare"
                change="+12.3%"
                trend="up"
                size="md"
            />
            <StatBlock
                value="$45.1B"
                label="Defense"
                change="-2.1%"
                trend="down"
                size="md"
            />
            <StatBlock
                value="$67.3B"
                label="Education"
                change="+5.7%"
                trend="up"
                size="md"
            />
        </div>
    ),
}

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Small</p>
                <StatBlock
                    value="$456.2B"
                    label="Federal Spending"
                    change="+8.3%"
                    trend="up"
                    size="sm"
                />
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Medium</p>
                <StatBlock
                    value="$456.2B"
                    label="Federal Spending"
                    change="+8.3%"
                    trend="up"
                    size="md"
                />
            </div>
            <div>
                <p style={{ fontFamily: "sans-serif", marginBottom: "8px" }}>Large</p>
                <StatBlock
                    value="$456.2B"
                    label="Federal Spending"
                    change="+8.3%"
                    trend="up"
                    size="lg"
                />
            </div>
        </div>
    ),
}

export const AllTrends: Story = {
    render: () => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <StatBlock
                value="$89.5B"
                label="Healthcare"
                change="+12.3%"
                trend="up"
                size="md"
            />
            <StatBlock
                value="$45.1B"
                label="Defense"
                change="-2.1%"
                trend="down"
                size="md"
            />
            <StatBlock
                value="14"
                label="Provinces"
                change="No change"
                trend="neutral"
                size="md"
            />
        </div>
    ),
}

export const DashboardExample: Story = {
    render: () => (
        <div style={{
            backgroundColor: "#F6ECE3",
            padding: "32px",
            borderRadius: "0"
        }}>
            <h2 style={{
                fontFamily: "sans-serif",
                margin: "0 0 24px",
                fontSize: "24px",
                fontWeight: 500
            }}>
                2024 Budget Overview
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "16px" }}>
                    <StatBlock
                        value="$496.8B"
                        label="Total Revenue"
                        change="+6.2%"
                        trend="up"
                        size="sm"
                    />
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px" }}>
                    <StatBlock
                        value="$537.4B"
                        label="Total Expenses"
                        change="+4.8%"
                        trend="up"
                        size="sm"
                    />
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px" }}>
                    <StatBlock
                        value="$40.6B"
                        label="Deficit"
                        change="-15.3%"
                        trend="down"
                        size="sm"
                    />
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px" }}>
                    <StatBlock
                        value="1.12T"
                        label="Federal Debt"
                        change="+3.7%"
                        trend="up"
                        size="sm"
                    />
                </div>
            </div>
        </div>
    ),
}
