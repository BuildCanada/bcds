import cx from "classnames"

import { Dialog, type DialogPosition } from "../Dialog"
import { Button, type ButtonVariant } from "../../primitives/Button"

export interface PopupFormProps {
    open: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    children: React.ReactNode
    title?: string
    description?: string
    position?: DialogPosition
    offset?: number
    className?: string
    submitText?: string
    submitVariant?: ButtonVariant
    cancelText?: string
    cancelVariant?: ButtonVariant
    showCancel?: boolean
    isSubmitting?: boolean
    submitDisabled?: boolean
    closeOnEscape?: boolean
}

export function PopupForm({
    open,
    onClose,
    onSubmit,
    children,
    title,
    description,
    position = "bottom-right",
    offset,
    className,
    submitText = "Submit",
    submitVariant = "solid-auburn",
    cancelText = "Cancel",
    cancelVariant = "outline-charcoal",
    showCancel = true,
    isSubmitting = false,
    submitDisabled = false,
    closeOnEscape = true,
}: PopupFormProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSubmit(e)
    }

    const classes = cx("bc-popup-form", className)

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            description={description}
            position={position}
            offset={offset}
            closeOnEscape={closeOnEscape}
        >
            <form onSubmit={handleSubmit} className={classes}>
                <div className="bc-popup-form__fields">
                    {children}
                </div>
                <div className="bc-popup-form__actions">
                    {showCancel && (
                        <Button
                            type="button"
                            text={cancelText}
                            variant={cancelVariant}
                            onClick={onClose}
                            disabled={isSubmitting}
                            icon={null}
                        />
                    )}
                    <Button
                        type="submit"
                        text={isSubmitting ? "Submitting..." : submitText}
                        variant={submitVariant}
                        disabled={submitDisabled || isSubmitting}
                        icon={null}
                    />
                </div>
            </form>
        </Dialog>
    )
}

export default PopupForm
