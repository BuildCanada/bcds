import type { Meta, StoryObj } from "@storybook/react"

import { Grid, GridItem } from "./Grid"

const meta: Meta<typeof Grid> = {
    title: "Components/Layout/Grid",
    component: Grid,
    argTypes: {
        columns: {
            control: "select",
            options: [1, 2, 3, 4, 6, 12],
        },
        columnsMd: {
            control: "select",
            options: [undefined, 1, 2, 3, 4, 6, 12],
        },
        columnsLg: {
            control: "select",
            options: [undefined, 1, 2, 3, 4, 6, 12],
        },
        gap: {
            control: "select",
            options: ["none", "sm", "md", "lg"],
        },
    },
    tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Grid>

const GridCell = ({ children }: { children: React.ReactNode }) => (
    <div style={{
        padding: "24px",
        backgroundColor: "#F6ECE3",
        border: "1px solid #272727",
        textAlign: "center",
        fontFamily: "sans-serif"
    }}>
        {children}
    </div>
)

export const Default: Story = {
    args: {
        columns: 3,
        gap: "md",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
                <GridCell>Item 4</GridCell>
                <GridCell>Item 5</GridCell>
                <GridCell>Item 6</GridCell>
            </>
        ),
    },
}

export const TwoColumns: Story = {
    args: {
        columns: 2,
        gap: "md",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
                <GridCell>Item 4</GridCell>
            </>
        ),
    },
}

export const ThreeColumns: Story = {
    args: {
        columns: 3,
        gap: "md",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
            </>
        ),
    },
}

export const FourColumns: Story = {
    args: {
        columns: 4,
        gap: "md",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
                <GridCell>Item 4</GridCell>
            </>
        ),
    },
}

export const ResponsiveGrid: Story = {
    args: {
        columns: 1,
        columnsMd: 2,
        columnsLg: 4,
        gap: "md",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
                <GridCell>Item 4</GridCell>
            </>
        ),
    },
}

export const NoGap: Story = {
    args: {
        columns: 3,
        gap: "none",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
            </>
        ),
    },
}

export const SmallGap: Story = {
    args: {
        columns: 3,
        gap: "sm",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
            </>
        ),
    },
}

export const LargeGap: Story = {
    args: {
        columns: 3,
        gap: "lg",
        children: (
            <>
                <GridCell>Item 1</GridCell>
                <GridCell>Item 2</GridCell>
                <GridCell>Item 3</GridCell>
            </>
        ),
    },
}

export const WithGridItems: Story = {
    render: () => (
        <Grid columns={4} gap="md">
            <GridItem span={2}>
                <GridCell>Span 2</GridCell>
            </GridItem>
            <GridItem>
                <GridCell>Span 1</GridCell>
            </GridItem>
            <GridItem>
                <GridCell>Span 1</GridCell>
            </GridItem>
            <GridItem>
                <GridCell>Span 1</GridCell>
            </GridItem>
            <GridItem span={3}>
                <GridCell>Span 3</GridCell>
            </GridItem>
        </Grid>
    ),
}

export const TwelveColumnGrid: Story = {
    render: () => (
        <Grid columns={12} gap="sm">
            <GridItem span={4}>
                <GridCell>4 cols</GridCell>
            </GridItem>
            <GridItem span={4}>
                <GridCell>4 cols</GridCell>
            </GridItem>
            <GridItem span={4}>
                <GridCell>4 cols</GridCell>
            </GridItem>
            <GridItem span={6}>
                <GridCell>6 cols</GridCell>
            </GridItem>
            <GridItem span={6}>
                <GridCell>6 cols</GridCell>
            </GridItem>
            <GridItem span={3}>
                <GridCell>3</GridCell>
            </GridItem>
            <GridItem span={3}>
                <GridCell>3</GridCell>
            </GridItem>
            <GridItem span={3}>
                <GridCell>3</GridCell>
            </GridItem>
            <GridItem span={3}>
                <GridCell>3</GridCell>
            </GridItem>
        </Grid>
    ),
}
