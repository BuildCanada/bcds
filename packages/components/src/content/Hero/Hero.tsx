import cx from "classnames"

export type HeroVariant = "home" | "page" | "centered"
export type HeroBackground = "white" | "linen" | "charcoal"

export interface HeroProps {
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
    variant?: HeroVariant
    background?: HeroBackground
}

export function Hero({
    children,
    className,
    style,
    variant = "page",
    background = "linen",
}: HeroProps) {
    const classes = cx(
        "bc-hero",
        `bc-hero--${variant}`,
        `bc-hero--bg-${background}`,
        className
    )

    return (
        <div className={classes} style={style}>
            <div className="bc-hero__inner">{children}</div>
        </div>
    )
}

export interface HeroTitleProps {
    children: React.ReactNode
    className?: string
    as?: "h1" | "h2"
}

export function HeroTitle({ children, className, as: Component = "h1" }: HeroTitleProps) {
    return <Component className={cx("bc-hero__title", className)}>{children}</Component>
}

export interface HeroSubtitleProps {
    children: React.ReactNode
    className?: string
}

export function HeroSubtitle({ children, className }: HeroSubtitleProps) {
    return <p className={cx("bc-hero__subtitle", className)}>{children}</p>
}

export interface HeroActionsProps {
    children: React.ReactNode
    className?: string
}

export function HeroActions({ children, className }: HeroActionsProps) {
    return <div className={cx("bc-hero__actions", className)}>{children}</div>
}

export default Hero
