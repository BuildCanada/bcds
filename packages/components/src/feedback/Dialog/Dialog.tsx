import { useEffect, useRef, useCallback } from "react"
import cx from "classnames"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faXmark } from "@fortawesome/free-solid-svg-icons"

export type DialogPosition =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center"

export interface DialogProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    description?: string
    position?: DialogPosition
    className?: string
    closeOnEscape?: boolean
    showCloseButton?: boolean
    ariaLabelledBy?: string
    ariaDescribedBy?: string
    offset?: number
}

export function Dialog({
    open,
    onClose,
    children,
    title,
    description,
    position = "bottom-right",
    className,
    closeOnEscape = true,
    showCloseButton = true,
    ariaLabelledBy,
    ariaDescribedBy,
    offset = 16,
}: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null)

    const handleClose = useCallback(() => {
        onClose()
    }, [onClose])

    // Handle escape key
    useEffect(() => {
        if (!closeOnEscape || !open) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleClose()
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [closeOnEscape, open, handleClose])

    if (!open) return null

    const classes = cx(
        "bc-dialog",
        `bc-dialog--${position}`,
        className
    )

    const titleId = ariaLabelledBy || (title ? "bc-dialog-title" : undefined)
    const descriptionId = ariaDescribedBy || (description ? "bc-dialog-description" : undefined)

    const style = {
        "--bc-dialog-offset": `${offset}px`,
    } as React.CSSProperties

    return (
        <div
            ref={dialogRef}
            className={classes}
            style={style}
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
        >
            <div className="bc-dialog__container">
                {(title || showCloseButton) && (
                    <header className="bc-dialog__header">
                        {title && (
                            <h2 id={titleId} className="bc-dialog__title">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                type="button"
                                className="bc-dialog__close"
                                onClick={handleClose}
                                aria-label="Close dialog"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        )}
                    </header>
                )}
                {description && (
                    <p id={descriptionId} className="bc-dialog__description">
                        {description}
                    </p>
                )}
                <div className="bc-dialog__content">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Dialog
