import cx from "classnames"

export type GridColumns = 1 | 2 | 3 | 4 | 6 | 12
export type GridGap = "none" | "sm" | "md" | "lg"

export interface GridProps {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    columns?: GridColumns
    columnsMd?: GridColumns
    columnsLg?: GridColumns
    gap?: GridGap
    as?: "div" | "ul" | "ol"
}

export function Grid({
    children,
    className,
    style,
    columns = 1,
    columnsMd,
    columnsLg,
    gap = "md",
    as: Component = "div",
}: GridProps) {
    const classes = cx(
        "bc-grid",
        `bc-grid--cols-${columns}`,
        `bc-grid--gap-${gap}`,
        columnsMd && `bc-grid--cols-md-${columnsMd}`,
        columnsLg && `bc-grid--cols-lg-${columnsLg}`,
        className
    )

    return (
        <Component className={classes} style={style}>
            {children}
        </Component>
    )
}

export interface GridItemProps {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    span?: number
    spanMd?: number
    spanLg?: number
}

export function GridItem({
    children,
    className,
    style,
    span,
    spanMd,
    spanLg,
}: GridItemProps) {
    const classes = cx(
        "bc-grid__item",
        span && `bc-grid__item--span-${span}`,
        spanMd && `bc-grid__item--span-md-${spanMd}`,
        spanLg && `bc-grid__item--span-lg-${spanLg}`,
        className
    )

    return (
        <div className={classes} style={style}>
            {children}
        </div>
    )
}

export default Grid
