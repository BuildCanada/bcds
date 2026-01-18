import cx from "classnames"

export type StatBlockSize = "sm" | "md" | "lg"
export type StatBlockTrend = "up" | "down" | "neutral"

export interface StatBlockProps {
    value: string | number
    label: string
    description?: string
    change?: string
    trend?: StatBlockTrend
    size?: StatBlockSize
    className?: string
    style?: React.CSSProperties
}

export function StatBlock({
    value,
    label,
    description,
    change,
    trend,
    size = "md",
    className,
    style,
}: StatBlockProps) {
    const classes = cx("bc-stat-block", `bc-stat-block--${size}`, className)

    return (
        <div className={classes} style={style}>
            <span className="bc-stat-block__value">{value}</span>
            <span className="bc-stat-block__label">{label}</span>
            {description && (
                <span className="bc-stat-block__description">{description}</span>
            )}
            {change && (
                <span
                    className={cx("bc-stat-block__change", {
                        "bc-stat-block__change--up": trend === "up",
                        "bc-stat-block__change--down": trend === "down",
                    })}
                >
                    {trend === "up" && "↑ "}
                    {trend === "down" && "↓ "}
                    {change}
                </span>
            )}
        </div>
    )
}

export default StatBlock
