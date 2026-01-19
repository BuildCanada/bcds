import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "@storybook/test"
import { faLightbulb, faChartLine, faUsers, faCode } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import {
    Card,
    CardImage,
    CardIcon,
    CardContent,
    CardTitle,
    CardDescription,
    CardMeta,
    CardStat,
    CardAuthor,
} from "./Card"

const meta: Meta<typeof Card> = {
    title: "Components/Content/Card",
    component: Card,
    parameters: {
        docs: {
            description: {
                component: `
A composable card component with multiple variants for different content types.

## Usage

\`\`\`tsx
import { Card, CardContent, CardTitle, CardDescription } from "@buildcanada/components"

<Card variant="default">
  <CardContent>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text.</CardDescription>
  </CardContent>
</Card>
\`\`\`

## Variants

- **default**: Basic card for general content
- **project**: Card with image for project showcases
- **memo**: Card for articles/memos with author info
- **feature**: Card with icon for feature highlights
- **stat**: Card for displaying statistics
- **profile**: Card for team member profiles

## Sub-components

- \`CardImage\`: Image header for the card
- \`CardIcon\`: Icon container for feature cards
- \`CardContent\`: Main content wrapper
- \`CardTitle\`: Card heading
- \`CardDescription\`: Card body text
- \`CardMeta\`: Metadata like dates
- \`CardStat\`: Statistics display with change indicators
- \`CardAuthor\`: Author info with avatar
                `,
            },
        },
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["default", "project", "memo", "feature", "stat", "profile"],
            description: "The visual style variant of the card",
        },
    },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
    args: {
        variant: "default",
        children: (
            <CardContent>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>
                    This is a description of the card content. It provides more
                    details about the subject.
                </CardDescription>
            </CardContent>
        ),
    },
}

export const ProjectCard: Story = {
    args: {
        variant: "project",
        href: "#",
        children: (
            <>
                <CardImage
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop"
                    alt="Modern building"
                />
                <CardContent>
                    <CardTitle>Infrastructure Development</CardTitle>
                    <CardDescription>
                        A comprehensive analysis of Canada's infrastructure spending
                        and development priorities over the past decade.
                    </CardDescription>
                    <CardMeta>Published March 2024</CardMeta>
                </CardContent>
            </>
        ),
    },
}

export const MemoCard: Story = {
    args: {
        variant: "memo",
        href: "#",
        children: (
            <CardContent>
                <CardTitle>The Future of Canadian Manufacturing</CardTitle>
                <CardDescription>
                    How policy changes and technological innovation are reshaping
                    Canada's manufacturing sector for the next generation.
                </CardDescription>
                <CardAuthor
                    name="Sarah Johnson"
                    role="Senior Analyst"
                    avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                />
            </CardContent>
        ),
    },
}

export const FeatureCard: Story = {
    args: {
        variant: "feature",
        children: (
            <>
                <CardIcon>
                    <FontAwesomeIcon icon={faChartLine} size="2x" />
                </CardIcon>
                <CardContent>
                    <CardTitle>Data-Driven Insights</CardTitle>
                    <CardDescription>
                        Access comprehensive data analysis and visualizations
                        to understand government spending patterns.
                    </CardDescription>
                </CardContent>
            </>
        ),
    },
}

export const StatCard: Story = {
    args: {
        variant: "stat",
        children: (
            <CardContent>
                <CardStat
                    value="$456.2B"
                    label="Total Federal Spending"
                    change="+8.3%"
                    changeDirection="up"
                />
            </CardContent>
        ),
    },
}

export const ProfileCard: Story = {
    args: {
        variant: "profile",
        children: (
            <>
                <CardImage
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
                    alt="John Smith"
                />
                <CardContent>
                    <CardTitle as="h4">John Smith</CardTitle>
                    <CardDescription>Director of Research</CardDescription>
                    <CardMeta>Ottawa, ON</CardMeta>
                </CardContent>
            </>
        ),
    },
}

// Interactive test: Clickable card
export const ClickableCardTest: Story = {
    args: {
        variant: "default",
        onClick: fn(),
        children: (
            <CardContent>
                <CardTitle>Clickable Card</CardTitle>
                <CardDescription>Click anywhere on this card.</CardDescription>
            </CardContent>
        ),
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)
        const card = canvas.getByRole("button")

        await expect(card).toBeInTheDocument()
        await userEvent.click(card)
        await expect(args.onClick).toHaveBeenCalled()
    },
}

// Interactive test: Link card
export const LinkCardTest: Story = {
    args: {
        variant: "project",
        href: "#test-link",
        children: (
            <CardContent>
                <CardTitle>Link Card</CardTitle>
                <CardDescription>This card links somewhere.</CardDescription>
            </CardContent>
        ),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const link = canvas.getByRole("link")

        await expect(link).toHaveAttribute("href", "#test-link")
    },
}

// Interactive test: Card with hover
export const HoverCardTest: Story = {
    args: {
        variant: "project",
        href: "#",
        children: (
            <>
                <CardImage
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop"
                    alt="Building"
                />
                <CardContent>
                    <CardTitle>Hover Card</CardTitle>
                    <CardDescription>Hover to see the effect.</CardDescription>
                </CardContent>
            </>
        ),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        const card = canvas.getByRole("link")

        await userEvent.hover(card)
        // Visual check for hover state
    },
}

export const FeatureCardsGrid: Story = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <Card variant="feature">
                <CardIcon>
                    <FontAwesomeIcon icon={faChartLine} size="2x" />
                </CardIcon>
                <CardContent>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                        Comprehensive data analysis tools for government spending.
                    </CardDescription>
                </CardContent>
            </Card>
            <Card variant="feature">
                <CardIcon>
                    <FontAwesomeIcon icon={faUsers} size="2x" />
                </CardIcon>
                <CardContent>
                    <CardTitle>Collaboration</CardTitle>
                    <CardDescription>
                        Work together with researchers across Canada.
                    </CardDescription>
                </CardContent>
            </Card>
            <Card variant="feature">
                <CardIcon>
                    <FontAwesomeIcon icon={faLightbulb} size="2x" />
                </CardIcon>
                <CardContent>
                    <CardTitle>Insights</CardTitle>
                    <CardDescription>
                        Discover patterns and trends in public data.
                    </CardDescription>
                </CardContent>
            </Card>
            <Card variant="feature">
                <CardIcon>
                    <FontAwesomeIcon icon={faCode} size="2x" />
                </CardIcon>
                <CardContent>
                    <CardTitle>Open Source</CardTitle>
                    <CardDescription>
                        All our tools and data are freely available.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    ),
}

export const StatCardsRow: Story = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <Card variant="stat">
                <CardContent>
                    <CardStat
                        value="$456.2B"
                        label="Federal Spending"
                        change="+8.3%"
                        changeDirection="up"
                    />
                </CardContent>
            </Card>
            <Card variant="stat">
                <CardContent>
                    <CardStat
                        value="2.4M"
                        label="Public Servants"
                        change="-1.2%"
                        changeDirection="down"
                    />
                </CardContent>
            </Card>
            <Card variant="stat">
                <CardContent>
                    <CardStat
                        value="14"
                        label="Provinces & Territories"
                        changeDirection="neutral"
                    />
                </CardContent>
            </Card>
        </div>
    ),
}

export const ProjectCardsGrid: Story = {
    render: () => (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            <Card variant="project" href="#">
                <CardImage
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop"
                    alt="Infrastructure"
                />
                <CardContent>
                    <CardTitle>Infrastructure Report 2024</CardTitle>
                    <CardDescription>
                        Analysis of federal infrastructure investments.
                    </CardDescription>
                    <CardMeta>March 2024</CardMeta>
                </CardContent>
            </Card>
            <Card variant="project" href="#">
                <CardImage
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop"
                    alt="Budget"
                />
                <CardContent>
                    <CardTitle>Budget Breakdown</CardTitle>
                    <CardDescription>
                        Comprehensive federal budget analysis.
                    </CardDescription>
                    <CardMeta>February 2024</CardMeta>
                </CardContent>
            </Card>
            <Card variant="project" href="#">
                <CardImage
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
                    alt="Healthcare"
                />
                <CardContent>
                    <CardTitle>Healthcare Spending</CardTitle>
                    <CardDescription>
                        Provincial healthcare expenditure trends.
                    </CardDescription>
                    <CardMeta>January 2024</CardMeta>
                </CardContent>
            </Card>
        </div>
    ),
}
