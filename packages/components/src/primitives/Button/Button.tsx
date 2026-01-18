import cx from "classnames"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconDefinition, faArrowRight } from "@fortawesome/free-solid-svg-icons"

export type ButtonVariant =
    | "solid-auburn"
    | "solid-charcoal"
    | "solid-linen"
    | "outline-auburn"
    | "outline-charcoal"
    | "outline-white"

export type ButtonSize = "sm" | "md" | "lg"

type ButtonCommonProps = {
    children?: React.ReactNode
    text?: string
    className?: string
    style?: React.CSSProperties
    variant?: ButtonVariant
    size?: ButtonSize
    icon?: IconDefinition | null
    iconPosition?: "left" | "right"
    fullWidth?: boolean
    disabled?: boolean
    ariaLabel?: string
    dataTrackNote?: string
}

type WithHrefProps = {
    href: string
    onClick?: never
    type?: never
}

type WithOnClickProps = {
    onClick?: () => void
    href?: never
    type?: "button" | "submit"
}

export type ButtonProps =
    | (ButtonCommonProps & WithHrefProps)
    | (ButtonCommonProps & WithOnClickProps)

export function Button({
    variant = "solid-auburn",
    size = "md",
    className,
    style,
    href,
    onClick,
    text,
    children,
    ariaLabel,
    type = "button",
    icon = faArrowRight,
    iconPosition = "right",
    fullWidth = false,
    dataTrackNote,
    disabled,
}: ButtonProps) {
    const classes = cx(
        "bc-btn",
        `bc-btn--${variant}`,
        `bc-btn--${size}`,
        className,
        {
            "bc-btn--icon-only": icon && !text && !children,
            "bc-btn--full-width": fullWidth,
        }
    )

    const content = (
        <>
            {iconPosition === "left" && icon && (
                <FontAwesomeIcon
                    className={cx("bc-btn__icon", { "bc-btn__icon--left": text || children })}
                    icon={icon}
                />
            )}
            {text && <span className="bc-btn__text">{text}</span>}
            {children}
            {iconPosition !== "left" && icon && (
                <FontAwesomeIcon
                    className={cx("bc-btn__icon", { "bc-btn__icon--right": text || children })}
                    icon={icon}
                />
            )}
        </>
    )

    if (href) {
        const aProps = {
            href: disabled ? undefined : href,
            className: classes,
            style,
            "data-track-note": dataTrackNote,
            onClick: disabled
                ? (e: React.MouseEvent) => e.preventDefault()
                : undefined,
            "aria-label": ariaLabel,
            "aria-disabled": disabled,
        }
        return <a {...aProps}>{content}</a>
    }

    const buttonProps = {
        type,
        className: classes,
        style,
        onClick,
        "aria-label": ariaLabel,
        "data-track-note": dataTrackNote,
        disabled,
    }
    return <button {...buttonProps}>{content}</button>
}

export default Button
