import cx from "classnames"

export type SectionBackground = "white" | "linen" | "charcoal"
export type SectionSpacing = "none" | "sm" | "md" | "lg" | "xl"

export interface SectionProps {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    background?: SectionBackground
    spacing?: SectionSpacing
    id?: string
}

export function Section({
    children,
    className,
    style,
    background = "white",
    spacing = "lg",
    id,
}: SectionProps) {
    const classes = cx(
        "bc-section",
        `bc-section--bg-${background}`,
        `bc-section--spacing-${spacing}`,
        className
    )

    return (
        <section className={classes} style={style} id={id}>
            {children}
        </section>
    )
}

export default Section
