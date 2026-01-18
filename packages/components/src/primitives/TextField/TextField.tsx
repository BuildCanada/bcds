import cx from "classnames"
import { forwardRef, useId } from "react"

export type TextFieldType = "text" | "email" | "password" | "number" | "tel" | "url"

export interface TextFieldProps {
    label?: string
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
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    function TextField(
        {
            label,
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
            onChange,
            onBlur,
            onFocus,
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
                    <label htmlFor={id} className="bc-textfield__label">
                        {label}
                        {required && <span className="bc-textfield__required">*</span>}
                    </label>
                )}
                <input
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
                        [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
                        undefined
                    }
                    onChange={onChange}
                    onBlur={onBlur}
                    onFocus={onFocus}
                />
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
