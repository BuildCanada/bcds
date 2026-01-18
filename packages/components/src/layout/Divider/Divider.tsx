import cx from "classnames"

export type DividerOrientation = "horizontal" | "vertical"
export type DividerVariant = "solid" | "dashed" | "construction"

export interface DividerProps {
    className?: string
    style?: React.CSSProperties
    orientation?: DividerOrientation
    variant?: DividerVariant
    spacing?: "none" | "sm" | "md" | "lg"
}

export function Divider({
    className,
    style,
    orientation = "horizontal",
    variant = "solid",
    spacing = "md",
}: DividerProps) {
    const classes = cx(
        "bc-divider",
        `bc-divider--${orientation}`,
        `bc-divider--${variant}`,
        `bc-divider--spacing-${spacing}`,
        className
    )

    return <hr className={classes} style={style} />
}

export default Divider
