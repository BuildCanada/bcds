import type { Meta, StoryObj } from "@storybook/react"
import { within, expect } from "@storybook/test"

import { Hero, HeroTitle, HeroSubtitle, HeroActions } from "./Hero"
import { Button } from "../../primitives/Button"

const meta: Meta<typeof Hero> = {
    title: "Components/Content/Hero",
    component: Hero,
    parameters: {
        docs: {
            description: {
                component: `
A hero section component for page headers with title, subtitle, and call-to-action buttons.

## Usage

\`\`\`tsx
import { Hero, HeroTitle, HeroSubtitle, HeroActions } from "@buildcanada/components"
import { Button } from "@buildcanada/components"

<Hero variant="home" background="linen">
  <HeroTitle>Welcome to Build Canada</HeroTitle>
  <HeroSubtitle>
    Making government data accessible for all Canadians.
  </HeroSubtitle>
  <HeroActions>
    <Button text="Get Started" variant="solid-auburn" />
    <Button text="Learn More" variant="outline-charcoal" icon={null} />
  </HeroActions>
</Hero>
\`\`\`

## Variants

- **home**: Large, impactful hero for homepages
- **page**: Standard page header with title and description
- **centered**: Center-aligned for special sections or CTAs

## Sub-components

- \`HeroTitle\`: Main heading (h1)
- \`HeroSubtitle\`: Supporting text
- \`HeroActions\`: Container for CTA buttons
                `,
            },
        },
    },
    argTypes: {
        variant: {
            control: "select",
            options: ["home", "page", "centered"],
            description: "Layout variant of the hero",
        },
        background: {
            control: "select",
            options: ["white", "linen", "charcoal"],
            description: "Background color",
        },
    },
}

export default meta
type Story = StoryObj<typeof Hero>

export const Default: Story = {
    args: {
        variant: "page",
        background: "linen",
        children: (
            <>
                <HeroTitle>Page Title</HeroTitle>
                <HeroSubtitle>
                    A brief description of what this page is about and what
                    users can expect to find here.
                </HeroSubtitle>
            </>
        ),
    },
}

export const HomeHero: Story = {
    args: {
        variant: "home",
        background: "linen",
        children: (
            <>
                <HeroTitle>Build Canada</HeroTitle>
                <HeroSubtitle>
                    Making government data accessible and understandable for all Canadians.
                    Explore spending, analyze trends, and discover insights.
                </HeroSubtitle>
                <HeroActions>
                    <Button text="Explore Data" variant="solid-auburn" />
                    <Button text="Learn More" variant="outline-charcoal" icon={null} />
                </HeroActions>
            </>
        ),
    },
}

export const PageHero: Story = {
    args: {
        variant: "page",
        background: "linen",
        children: (
            <>
                <HeroTitle>About Us</HeroTitle>
                <HeroSubtitle>
                    Learn about our mission, team, and the work we do to make
                    government spending transparent.
                </HeroSubtitle>
            </>
        ),
    },
}

export const CenteredHero: Story = {
    args: {
        variant: "centered",
        background: "linen",
        children: (
            <>
                <HeroTitle>Canada Spends</HeroTitle>
                <HeroSubtitle>
                    Interactive visualizations of government spending across
                    all levels of government in Canada.
                </HeroSubtitle>
                <HeroActions>
                    <Button text="View Charts" variant="solid-auburn" />
                </HeroActions>
            </>
        ),
    },
}

export const WhiteBackground: Story = {
    args: {
        variant: "page",
        background: "white",
        children: (
            <>
                <HeroTitle>Research & Reports</HeroTitle>
                <HeroSubtitle>
                    In-depth analysis and reports on Canadian government policy
                    and spending patterns.
                </HeroSubtitle>
            </>
        ),
    },
}

export const CharcoalBackground: Story = {
    args: {
        variant: "centered",
        background: "charcoal",
        children: (
            <>
                <HeroTitle>Join Our Newsletter</HeroTitle>
                <HeroSubtitle>
                    Get the latest insights and analysis delivered directly to your inbox.
                </HeroSubtitle>
                <HeroActions>
                    <Button text="Subscribe" variant="solid-auburn" />
                </HeroActions>
            </>
        ),
    },
}

export const WithMultipleActions: Story = {
    args: {
        variant: "home",
        background: "linen",
        children: (
            <>
                <HeroTitle>Open Government Data</HeroTitle>
                <HeroSubtitle>
                    Access, analyze, and visualize government spending data
                    with our free and open-source tools.
                </HeroSubtitle>
                <HeroActions>
                    <Button text="Get Started" variant="solid-auburn" />
                    <Button text="View Demo" variant="outline-charcoal" icon={null} />
                    <Button text="Documentation" variant="outline-charcoal" icon={null} />
                </HeroActions>
            </>
        ),
    },
}

export const MinimalHero: Story = {
    args: {
        variant: "page",
        background: "linen",
        children: (
            <HeroTitle>Contact</HeroTitle>
        ),
    },
}

export const LongContent: Story = {
    args: {
        variant: "home",
        background: "linen",
        children: (
            <>
                <HeroTitle>Understanding Government Spending in Canada</HeroTitle>
                <HeroSubtitle>
                    Our platform provides comprehensive data visualization and analysis tools
                    that help citizens, researchers, and policymakers understand how public
                    money is spent across federal, provincial, and municipal governments.
                    From healthcare to infrastructure, education to defense, explore the
                    full picture of Canadian government finances.
                </HeroSubtitle>
                <HeroActions>
                    <Button text="Explore the Data" variant="solid-auburn" />
                    <Button text="Read Our Methodology" variant="outline-charcoal" icon={null} />
                </HeroActions>
            </>
        ),
    },
}

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <Hero variant="home" background="linen">
                <HeroTitle>Home Variant</HeroTitle>
                <HeroSubtitle>Large, impactful hero for homepages with prominent CTAs.</HeroSubtitle>
                <HeroActions>
                    <Button text="Primary Action" variant="solid-auburn" />
                    <Button text="Secondary" variant="outline-charcoal" icon={null} />
                </HeroActions>
            </Hero>
            <Hero variant="page" background="white">
                <HeroTitle>Page Variant</HeroTitle>
                <HeroSubtitle>Standard page header with title and optional description.</HeroSubtitle>
            </Hero>
            <Hero variant="centered" background="charcoal">
                <HeroTitle>Centered Variant</HeroTitle>
                <HeroSubtitle>Center-aligned content for special sections or CTAs.</HeroSubtitle>
                <HeroActions>
                    <Button text="Take Action" variant="solid-auburn" />
                </HeroActions>
            </Hero>
        </div>
    ),
}

// Interactive test: Title and subtitle render correctly
export const ContentTest: Story = {
    args: {
        variant: "page",
        background: "linen",
        children: (
            <>
                <HeroTitle>Test Title</HeroTitle>
                <HeroSubtitle>Test subtitle text content.</HeroSubtitle>
            </>
        ),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const title = canvas.getByText("Test Title")
        const subtitle = canvas.getByText("Test subtitle text content.")

        await expect(title).toBeInTheDocument()
        await expect(subtitle).toBeInTheDocument()
    },
}

// Interactive test: Action buttons are rendered
export const ActionsTest: Story = {
    args: {
        variant: "home",
        background: "linen",
        children: (
            <>
                <HeroTitle>Hero with Actions</HeroTitle>
                <HeroSubtitle>Testing action buttons.</HeroSubtitle>
                <HeroActions>
                    <Button text="Primary Button" variant="solid-auburn" />
                    <Button text="Secondary Button" variant="outline-charcoal" icon={null} />
                </HeroActions>
            </>
        ),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const primaryBtn = canvas.getByRole("button", { name: /primary button/i })
        const secondaryBtn = canvas.getByRole("button", { name: /secondary button/i })

        await expect(primaryBtn).toBeInTheDocument()
        await expect(secondaryBtn).toBeInTheDocument()
    },
}
