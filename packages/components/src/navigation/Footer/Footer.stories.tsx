import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "@storybook/test"

import { Footer } from "./Footer"

const meta: Meta<typeof Footer> = {
    title: "Components/Navigation/Footer",
    component: Footer,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component: `
A site footer component with logo, navigation links, social links, newsletter signup, and optional quote.

## Usage

\`\`\`tsx
import { Footer } from "@buildcanada/components"

<Footer
  logo={<Logo />}
  links={[
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Privacy", href: "/privacy" },
  ]}
  socialLinks={[
    { platform: "twitter", href: "https://twitter.com/..." },
    { platform: "github", href: "https://github.com/..." },
  ]}
  copyright="© 2024 Company Name"
/>
\`\`\`

## With Newsletter

\`\`\`tsx
<Footer
  logo={<Logo />}
  links={links}
  newsletter={{
    heading: "Stay Updated",
    description: "Get the latest news delivered to your inbox.",
    placeholder: "Enter your email",
    buttonText: "Subscribe",
    onSubmit: (email) => console.log(email),
  }}
  copyright="© 2024 Company Name"
/>
\`\`\`

## Social Platforms

Supported platforms: twitter, linkedin, github, email, bluesky
                `,
            },
        },
    },
}

export default meta
type Story = StoryObj<typeof Footer>

const Logo = () => (
    <span style={{
        fontFamily: "'Soehne Kraftig', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "18px",
        fontWeight: 500,
        color: "#ffffff",
        letterSpacing: "-0.01em",
    }}>
        Build Canada
    </span>
)

const basicLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Projects", href: "/projects" },
    { label: "Contact", href: "/contact" },
]

const extendedLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Projects", href: "/projects" },
    { label: "Research", href: "/research" },
    { label: "Data", href: "/data" },
    { label: "Blog", href: "/blog" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
]

const socialLinks = [
    { platform: "twitter" as const, href: "https://twitter.com/buildcanada" },
    { platform: "linkedin" as const, href: "https://linkedin.com/company/buildcanada" },
    { platform: "github" as const, href: "https://github.com/buildcanada" },
    { platform: "email" as const, href: "mailto:hello@buildcanada.com", label: "Email us" },
]

const socialLinksWithBluesky = [
    { platform: "twitter" as const, href: "https://twitter.com/buildcanada" },
    { platform: "bluesky" as const, href: "https://bsky.app/profile/buildcanada" },
    { platform: "linkedin" as const, href: "https://linkedin.com/company/buildcanada" },
    { platform: "github" as const, href: "https://github.com/buildcanada" },
]

export const Default: Story = {
    args: {
        logo: <Logo />,
        links: basicLinks,
        socialLinks: socialLinks,
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

export const WithNewsletter: Story = {
    args: {
        logo: <Logo />,
        links: basicLinks,
        socialLinks: socialLinks,
        newsletter: {
            heading: "Stay Updated",
            description: "Get the latest insights delivered to your inbox.",
            placeholder: "Enter your email",
            buttonText: "Subscribe",
            onSubmit: (email) => console.log("Newsletter signup:", email),
        },
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

export const WithQuote: Story = {
    args: {
        logo: <Logo />,
        links: basicLinks,
        socialLinks: socialLinks,
        quote: {
            text: "The measure of a great democracy is how well it serves its citizens through transparent and accountable governance.",
            attribution: "Build Canada Mission Statement",
        },
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

export const FullFeatured: Story = {
    args: {
        logo: <Logo />,
        links: extendedLinks,
        socialLinks: socialLinks,
        newsletter: {
            heading: "Join Our Newsletter",
            description: "Weekly insights on Canadian government spending and policy.",
            placeholder: "you@example.com",
            buttonText: "Subscribe",
        },
        quote: {
            text: "Democracy requires an informed citizenry. We make government data accessible to all.",
            attribution: "Build Canada",
        },
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

export const MinimalFooter: Story = {
    args: {
        copyright: "© 2024 Build Canada",
    },
}

export const WithLogoOnly: Story = {
    args: {
        logo: <Logo />,
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

export const WithSocialOnly: Story = {
    args: {
        socialLinks: socialLinks,
        copyright: "© 2024 Build Canada",
    },
}

export const WithBluesky: Story = {
    args: {
        logo: <Logo />,
        links: basicLinks,
        socialLinks: socialLinksWithBluesky,
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

export const CanadaSpendsFooter: Story = {
    args: {
        logo: (
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "18px", fontFamily: "sans-serif" }}>
                Canada Spends
            </span>
        ),
        links: [
            { label: "Charts", href: "/charts" },
            { label: "Data", href: "/data" },
            { label: "Topics", href: "/topics" },
            { label: "About", href: "/about" },
            { label: "Methodology", href: "/methodology" },
            { label: "API", href: "/api" },
        ],
        socialLinks: [
            { platform: "twitter" as const, href: "https://twitter.com/canadaspends" },
            { platform: "github" as const, href: "https://github.com/buildcanada/canada-spends" },
        ],
        newsletter: {
            heading: "Data Updates",
            description: "Get notified when new datasets are published.",
            placeholder: "your@email.com",
            buttonText: "Notify Me",
        },
        copyright: "© 2024 Canada Spends. A Build Canada Project.",
    },
}

export const BuildCanadaFooter: Story = {
    args: {
        logo: (
            <span style={{ color: "#fff", fontWeight: 600, fontSize: "18px", fontFamily: "sans-serif" }}>
                Build Canada
            </span>
        ),
        links: [
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Projects", href: "/projects" },
            { label: "Memos", href: "/memos" },
            { label: "Team", href: "/team" },
            { label: "Contact", href: "/contact" },
        ],
        socialLinks: socialLinks,
        newsletter: {
            heading: "Stay Informed",
            description: "Join our mailing list for weekly updates on Canadian policy and data.",
            placeholder: "Enter your email",
            buttonText: "Subscribe",
        },
        quote: {
            text: "We believe an informed citizenry is essential to a functioning democracy.",
            attribution: "Build Canada",
        },
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

export const LongLinkList: Story = {
    args: {
        logo: <Logo />,
        links: [
            { label: "Home", href: "/" },
            { label: "About Us", href: "/about" },
            { label: "Our Mission", href: "/mission" },
            { label: "Projects", href: "/projects" },
            { label: "Canada Spends", href: "/canada-spends" },
            { label: "Research", href: "/research" },
            { label: "Reports", href: "/reports" },
            { label: "Data", href: "/data" },
            { label: "Blog", href: "/blog" },
            { label: "Careers", href: "/careers" },
            { label: "Press", href: "/press" },
            { label: "Contact", href: "/contact" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Use", href: "/terms" },
        ],
        socialLinks: socialLinks,
        copyright: "© 2024 Build Canada. All rights reserved.",
    },
}

// Interactive test: Footer links
export const LinksTest: Story = {
    args: {
        links: basicLinks,
        copyright: "© 2024 Build Canada",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const homeLink = canvas.getByRole("link", { name: /home/i })
        const aboutLink = canvas.getByRole("link", { name: /about/i })

        await expect(homeLink).toBeInTheDocument()
        await expect(aboutLink).toBeInTheDocument()
        await expect(homeLink).toHaveAttribute("href", "/")
    },
}

// Interactive test: Social links
export const SocialLinksTest: Story = {
    args: {
        socialLinks: socialLinks,
        copyright: "© 2024 Build Canada",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        // Check that social links are present (they should be links with icons)
        const twitterLink = canvas.getByRole("link", { name: /twitter/i })
        const githubLink = canvas.getByRole("link", { name: /github/i })

        await expect(twitterLink).toBeInTheDocument()
        await expect(githubLink).toBeInTheDocument()
    },
}

// Interactive test: Newsletter form
export const NewsletterTest: Story = {
    args: {
        newsletter: {
            heading: "Subscribe",
            description: "Get updates",
            placeholder: "your@email.com",
            buttonText: "Subscribe",
            onSubmit: fn(),
        },
        copyright: "© 2024 Build Canada",
    },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement)

        const emailInput = canvas.getByPlaceholderText("your@email.com")
        const submitButton = canvas.getByRole("button", { name: /subscribe/i })

        await expect(emailInput).toBeInTheDocument()
        await expect(submitButton).toBeInTheDocument()

        await userEvent.type(emailInput, "test@example.com")
        await expect(emailInput).toHaveValue("test@example.com")
    },
}

// Interactive test: Copyright text
export const CopyrightTest: Story = {
    args: {
        copyright: "© 2024 Test Company. All rights reserved.",
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const copyright = canvas.getByText(/2024 Test Company/i)
        await expect(copyright).toBeInTheDocument()
    },
}
