import cx from "classnames"

export type StackDirection = "vertical" | "horizontal"
export type StackSpacing = "none" | "xs" | "sm" | "md" | "lg" | "xl"
export type StackAlign = "start" | "center" | "end" | "stretch"
export type StackJustify = "start" | "center" | "end" | "between" | "around"

export interface StackProps {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    direction?: StackDirection
    spacing?: StackSpacing
    align?: StackAlign
    justify?: StackJustify
    wrap?: boolean
    as?: "div" | "ul" | "ol" | "nav"
}

export function Stack({
    children,
    className,
    style,
    direction = "vertical",
    spacing = "md",
    align = "stretch",
    justify = "start",
    wrap = false,
    as: Component = "div",
}: StackProps) {
    const classes = cx(
        "bc-stack",
        `bc-stack--${direction}`,
        `bc-stack--spacing-${spacing}`,
        `bc-stack--align-${align}`,
        `bc-stack--justify-${justify}`,
        { "bc-stack--wrap": wrap },
        className
    )

    return (
        <Component className={classes} style={style}>
            {children}
        </Component>
    )
}

export default Stack
