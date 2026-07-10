import cx from "classnames"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconDefinition, faArrowRight } from "@fortawesome/free-solid-svg-icons"
import { forwardRef } from "react"
import type React from "react"

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "ghost"
    | "danger"
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
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    fullWidth?: boolean
    disabled?: boolean
    ariaLabel?: string
    dataTrackNote?: string
} & Pick<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | "id"
    | "title"
    | "aria-controls"
    | "aria-describedby"
    | "aria-expanded"
    | "aria-haspopup"
    | "aria-labelledby"
    | "aria-pressed"
    | "aria-label"
>
type DataAttributes = {
    [key: `data-${string}`]: string | number | boolean | undefined
}

export type ButtonProps = ButtonCommonProps &
    DataAttributes &
    Omit<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        "children" | "className" | "style" | "disabled" | "onClick" | "type"
    > & {
        href?: string
        target?: React.AnchorHTMLAttributes<HTMLAnchorElement>["target"]
        rel?: React.AnchorHTMLAttributes<HTMLAnchorElement>["rel"]
        download?: React.AnchorHTMLAttributes<HTMLAnchorElement>["download"]
        onClick?: React.MouseEventHandler<HTMLElement>
        type?: "button" | "submit" | "reset"
    }

function isIconDefinition(icon: React.ReactNode | IconDefinition): icon is IconDefinition {
    return typeof icon === "object" && icon !== null && "icon" in icon && "prefix" in icon
}

function renderIcon(icon: React.ReactNode | IconDefinition, position: "left" | "right", hasText: boolean) {
    if (!icon) return null

    const className = cx("bc-btn__icon", {
        "bc-btn__icon--left": position === "left" && hasText,
        "bc-btn__icon--right": position === "right" && hasText,
    })

    if (isIconDefinition(icon)) {
        return <FontAwesomeIcon className={className} icon={icon} />
    }

    return <span className={className}>{icon}</span>
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
    function Button(
        {
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
            iconLeft,
            iconRight,
            fullWidth = false,
            dataTrackNote,
            disabled,
            ...rest
        },
        ref
    ) {
        const hasText = Boolean(text || children)
        const resolvedIconLeft = iconLeft ?? (iconPosition === "left" ? icon : null)
        const resolvedIconRight = iconRight ?? (iconPosition !== "left" ? icon : null)

        const classes = cx(
            "bc-btn",
            `bc-btn--${variant}`,
            `bc-btn--${size}`,
            className,
            {
                "bc-btn--icon-only": !hasText && (resolvedIconLeft || resolvedIconRight),
                "bc-btn--full-width": fullWidth,
            }
        )

        const content = (
            <>
                {renderIcon(resolvedIconLeft, "left", hasText)}
                {text && <span className="bc-btn__text">{text}</span>}
                {children}
                {renderIcon(resolvedIconRight, "right", hasText)}
            </>
        )

        if (href) {
            const aProps = {
                ...rest,
                ref: ref as React.ForwardedRef<HTMLAnchorElement>,
                href: disabled ? undefined : href,
                className: classes,
                style,
                "data-track-note": dataTrackNote,
                onClick: disabled
                    ? (e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()
                    : (onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined),
                "aria-label": ariaLabel ?? rest["aria-label"],
                "aria-disabled": disabled,
            }
            return <a {...(aProps as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{content}</a>
        }

        const buttonProps = {
            ...rest,
            ref: ref as React.ForwardedRef<HTMLButtonElement>,
            type,
            className: classes,
            style,
            onClick: onClick as React.MouseEventHandler<HTMLButtonElement> | undefined,
            "aria-label": ariaLabel ?? rest["aria-label"],
            "data-track-note": dataTrackNote,
            disabled,
        }
        return <button {...(buttonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{content}</button>
    }
)

export default Button
