import cx from "classnames"
import { forwardRef, useId } from "react"
import type React from "react"

export interface SelectOption {
    label: string
    value: string
    disabled?: boolean
}

export interface SelectOptionGroup {
    label: string
    options: SelectOption[]
}

export type SelectOptionItem = SelectOption | SelectOptionGroup

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
    label?: string
    visuallyHiddenLabel?: boolean
    options: SelectOptionItem[]
    placeholder?: string
    error?: string
    hint?: string
}

function isOptionGroup(option: SelectOptionItem): option is SelectOptionGroup {
    return "options" in option
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    function Select(
        {
            label,
            visuallyHiddenLabel = false,
            options,
            placeholder,
            error,
            hint,
            id: providedId,
            className,
            disabled = false,
            required = false,
            ...rest
        },
        ref
    ) {
        const generatedId = useId()
        const id = providedId || generatedId
        const errorId = `${id}-error`
        const hintId = `${id}-hint`
        const hasError = Boolean(error)

        return (
            <div className={cx("bc-select", { "bc-select--error": hasError, "bc-select--disabled": disabled }, className)}>
                {label && (
                    <label
                        htmlFor={id}
                        className={cx("bc-select__label", {
                            "bc-select__label--visually-hidden": visuallyHiddenLabel,
                        })}
                    >
                        {label}
                        {required && <span className="bc-select__required">*</span>}
                    </label>
                )}
                <div className="bc-select__control">
                    <select
                        {...rest}
                        ref={ref}
                        id={id}
                        disabled={disabled}
                        required={required}
                        className="bc-select__input"
                        aria-invalid={hasError}
                        aria-describedby={
                            [error && errorId, hint && hintId, rest["aria-describedby"]]
                                .filter(Boolean)
                                .join(" ") || undefined
                        }
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options.map((option) =>
                            isOptionGroup(option) ? (
                                <optgroup key={option.label} label={option.label}>
                                    {option.options.map((child) => (
                                        <option key={child.value} value={child.value} disabled={child.disabled}>
                                            {child.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ) : (
                                <option key={option.value} value={option.value} disabled={option.disabled}>
                                    {option.label}
                                </option>
                            )
                        )}
                    </select>
                    <span className="bc-select__chevron" aria-hidden="true">⌄</span>
                </div>
                {hint && !error && <p id={hintId} className="bc-select__hint">{hint}</p>}
                {error && <p id={errorId} className="bc-select__error" role="alert">{error}</p>}
            </div>
        )
    }
)

export default Select
