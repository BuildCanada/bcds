import cx from "classnames"
import { forwardRef, useId } from "react"
import type React from "react"

export type TextFieldType = "text" | "search" | "email" | "password" | "number" | "tel" | "url"

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
    label?: string
    visuallyHiddenLabel?: boolean
    placeholder?: string
    value?: string
    defaultValue?: string
    type?: TextFieldType
    name?: string
    id?: string
    className?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
    autoComplete?: string
    iconLeft?: React.ReactNode
    iconRight?: React.ReactNode
    onClear?: () => void
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    function TextField(
        {
            label,
            visuallyHiddenLabel = false,
            placeholder,
            value,
            defaultValue,
            type = "text",
            name,
            id: providedId,
            className,
            error,
            hint,
            disabled = false,
            required = false,
            autoComplete,
            iconLeft,
            iconRight,
            onClear,
            onChange,
            onBlur,
            onFocus,
            ...rest
        },
        ref
    ) {
        const generatedId = useId()
        const id = providedId || generatedId
        const errorId = `${id}-error`
        const hintId = `${id}-hint`

        const hasError = Boolean(error)

        const classes = cx(
            "bc-textfield",
            { "bc-textfield--error": hasError },
            { "bc-textfield--disabled": disabled },
            className
        )

        return (
            <div className={classes}>
                {label && (
                    <label
                        htmlFor={id}
                        className={cx("bc-textfield__label", {
                            "bc-textfield__label--visually-hidden": visuallyHiddenLabel,
                        })}
                    >
                        {label}
                        {required && <span className="bc-textfield__required">*</span>}
                    </label>
                )}
                <div className="bc-textfield__control">
                    {iconLeft && <span className="bc-textfield__icon bc-textfield__icon--left">{iconLeft}</span>}
                    <input
                        {...rest}
                        ref={ref}
                        type={type}
                        id={id}
                        name={name}
                        value={value}
                        defaultValue={defaultValue}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        autoComplete={autoComplete}
                        className="bc-textfield__input"
                        aria-invalid={hasError}
                        aria-describedby={
                            [error && errorId, hint && hintId, rest["aria-describedby"]]
                                .filter(Boolean)
                                .join(" ") || undefined
                        }
                        onChange={onChange}
                        onBlur={onBlur}
                        onFocus={onFocus}
                    />
                    {onClear && (value || defaultValue) && (
                        <button
                            type="button"
                            className="bc-textfield__clear"
                            aria-label="Clear"
                            disabled={disabled}
                            onClick={onClear}
                        >
                            ×
                        </button>
                    )}
                    {iconRight && <span className="bc-textfield__icon bc-textfield__icon--right">{iconRight}</span>}
                </div>
                {hint && !error && (
                    <p id={hintId} className="bc-textfield__hint">
                        {hint}
                    </p>
                )}
                {error && (
                    <p id={errorId} className="bc-textfield__error" role="alert">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

export default TextField
