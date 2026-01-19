import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "@storybook/test"

import { Header } from "./Header"

const meta: Meta<typeof Header> = {
    title: "Components/Navigation/Header",
    component: Header,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: `
A responsive site header with navigation, logo, CTA button, and optional announcement banner.

## Usage

\`\`\`tsx
import { Header } from "@buildcanada/components"

<Header
  logo={<Logo />}
  navItems={[
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Projects", href: "/projects" },
  ]}
  cta={{ label: "Get Started", href: "/start" }}
/>
\`\`\`

## With Dropdowns

\`\`\`tsx
<Header
  logo={<Logo />}
  navItems={[
    { label: "Home", href: "/" },
    {
      label: "Projects",
      href: "/projects",
      dropdown: [
        { label: "Project A", href: "/projects/a" },
        { label: "Project B", href: "/projects/b" },
      ],
    },
  ]}
/>
\`\`\`

## Announcement Banner

\`\`\`tsx
<Header
  logo={<Logo />}
  navItems={navItems}
  announcement={{
    text: "New feature available!",
    href: "/new-feature",
    variant: "auburn", // or "default"
  }}
/>
\`\`\`

## Responsive

On mobile, navigation collapses into a hamburger menu.
                `,
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Header>

const Logo = () => (
    <span style={{
        fontFamily: "'Soehne Kraftig', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "18px",
        fontWeight: 500,
        color: "#272727",
        letterSpacing: "-0.01em",
    }}>
        Build Canada
    </span>
)

const basicNavItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Projects", href: "/projects" },
    { label: "Contact", href: "/contact" },
]

const navWithDropdowns = [
    { label: "Home", href: "/" },
    {
        label: "Projects",
        href: "/projects",
        dropdown: [
            { label: "Canada Spends", href: "/projects/canada-spends" },
            { label: "Budget Tracker", href: "/projects/budget-tracker" },
            { label: "Data Explorer", href: "/projects/data-explorer" },
        ],
    },
    {
        label: "Research",
        href: "/research",
        dropdown: [
            { label: "Reports", href: "/research/reports" },
            { label: "Analysis", href: "/research/analysis" },
            { label: "Publications", href: "/research/publications" },
        ],
    },
    { label: "About", href: "/about" },
]

export const Default: Story = {
    args: {
        logo: <Logo />,
        navItems: basicNavItems,
    },
}

export const WithCTA: Story = {
    args: {
        logo: <Logo />,
        navItems: basicNavItems,
        cta: {
            label: "Get Started",
            href: "/get-started",
        },
    },
}

export const WithAnnouncement: Story = {
    args: {
        logo: <Logo />,
        navItems: basicNavItems,
        cta: {
            label: "Get Started",
            href: "/get-started",
        },
        announcement: {
            text: "New: Canada Spends 2024 data now available!",
            href: "/projects/canada-spends",
            variant: "default",
        },
    },
}

export const WithAuburnAnnouncement: Story = {
    args: {
        logo: <Logo />,
        navItems: basicNavItems,
        cta: {
            label: "Get Started",
            href: "/get-started",
        },
        announcement: {
            text: "Breaking: Federal Budget 2024 Analysis",
            href: "/research/budget-2024",
            variant: "auburn",
        },
    },
}

export const WithDropdowns: Story = {
    args: {
        logo: <Logo />,
        navItems: navWithDropdowns,
        cta: {
            label: "Explore Data",
            href: "/explore",
        },
    },
}

export const MinimalHeader: Story = {
    args: {
        logo: <Logo />,
    },
}

export const FullFeatured: Story = {
    args: {
        logo: <Logo />,
        navItems: navWithDropdowns,
        cta: {
            label: "Get Started",
            href: "/get-started",
        },
        announcement: {
            text: "New: 2024 Federal Budget Analysis now available",
            href: "/research/budget-2024",
            variant: "auburn",
        },
    },
}

export const ManyNavItems: Story = {
    args: {
        logo: <Logo />,
        navItems: [
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Projects", href: "/projects" },
            { label: "Research", href: "/research" },
            { label: "Data", href: "/data" },
            { label: "Blog", href: "/blog" },
            { label: "Contact", href: "/contact" },
        ],
    },
}

export const WithTextLogo: Story = {
    args: {
        logo: (
            <span style={{
                fontFamily: "'Soehne Kraftig', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: "20px",
                fontWeight: 500,
                color: "#932F2F",
                letterSpacing: "-0.01em",
            }}>
                Company Name
            </span>
        ),
        navItems: basicNavItems,
        cta: {
            label: "Sign Up",
            href: "/signup",
        },
    },
}

export const CanadaSpendsHeader: Story = {
    args: {
        logo: (
            <svg width="160" height="24" viewBox="0 0 160 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="18" fontFamily="sans-serif" fontSize="16" fontWeight="600" fill="#272727">
                    Canada Spends
                </text>
            </svg>
        ),
        navItems: [
            { label: "Charts", href: "/charts" },
            { label: "Data", href: "/data" },
            {
                label: "Topics",
                href: "/topics",
                dropdown: [
                    { label: "Healthcare", href: "/topics/healthcare" },
                    { label: "Education", href: "/topics/education" },
                    { label: "Defense", href: "/topics/defense" },
                    { label: "Infrastructure", href: "/topics/infrastructure" },
                ],
            },
            { label: "About", href: "/about" },
        ],
        cta: {
            label: "Explore",
            href: "/explore",
        },
    },
}

export const ResponsiveDemo: Story = {
    args: {
        logo: <Logo />,
        navItems: navWithDropdowns,
        cta: {
            label: "Get Started",
            href: "/get-started",
        },
    },
    parameters: {
        docs: {
            description: {
                story: "Resize the viewport to see the responsive behavior. On smaller screens, the navigation collapses into a hamburger menu.",
            },
        },
    },
}

// Interactive test: Navigation links
export const NavigationTest: Story = {
    args: {
        logo: <Logo />,
        navItems: basicNavItems,
        cta: {
            label: "Get Started",
            href: "/get-started",
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        // Check that navigation links are present
        const homeLink = canvas.getByRole("link", { name: /home/i })
        const aboutLink = canvas.getByRole("link", { name: /about/i })
        const ctaButton = canvas.getByRole("link", { name: /get started/i })

        await expect(homeLink).toBeInTheDocument()
        await expect(aboutLink).toBeInTheDocument()
        await expect(ctaButton).toBeInTheDocument()

        await expect(homeLink).toHaveAttribute("href", "/")
        await expect(aboutLink).toHaveAttribute("href", "/about")
    },
}

// Interactive test: Logo presence
export const LogoTest: Story = {
    args: {
        logo: <Logo />,
        navItems: basicNavItems,
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        // Check that the logo/brand text is present
        const logoText = canvas.getByText(/build canada/i)
        await expect(logoText).toBeInTheDocument()
    },
}

// Interactive test: Announcement banner
export const AnnouncementTest: Story = {
    args: {
        logo: <Logo />,
        navItems: basicNavItems,
        announcement: {
            text: "Test announcement message",
            href: "/test-link",
            variant: "auburn",
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const announcement = canvas.getByText(/test announcement message/i)
        await expect(announcement).toBeInTheDocument()
    },
}
