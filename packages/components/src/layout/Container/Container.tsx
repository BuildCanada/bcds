import cx from "classnames"

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full"

export interface ContainerProps {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    size?: ContainerSize
    as?: "div" | "main" | "article" | "section"
}

export function Container({
    children,
    className,
    style,
    size = "lg",
    as: Component = "div",
}: ContainerProps) {
    const classes = cx("bc-container", `bc-container--${size}`, className)

    return (
        <Component className={classes} style={style}>
            {children}
        </Component>
    )
}

export default Container
