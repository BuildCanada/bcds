import cx from "classnames"
import { forwardRef, useId, useRef, useState } from "react"
import type React from "react"

export type RadioGroupOrientation = "horizontal" | "vertical"

export interface RadioGroupOption {
    label: React.ReactNode
    value: string
    disabled?: boolean
    description?: React.ReactNode
    id?: string
}

export interface RadioGroupProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    name?: string
    options: RadioGroupOption[]
    legend?: React.ReactNode
    visuallyHiddenLegend?: boolean
    orientation?: RadioGroupOrientation
}

export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
    function RadioGroup(
        {
            value,
            defaultValue,
            onValueChange,
            name,
            options,
            legend,
            visuallyHiddenLegend = false,
            orientation = "vertical",
            className,
            disabled = false,
            ...rest
        },
        ref
    ) {
        const generatedName = useId()
        const groupName = name || generatedName
        const [internalValue, setInternalValue] = useState(defaultValue)
        const selectedValue = value ?? internalValue
        const inputRefs = useRef<Array<HTMLInputElement | null>>([])

        const setValue = (nextValue: string) => {
            if (value === undefined) setInternalValue(nextValue)
            onValueChange?.(nextValue)
        }

        const focusOption = (nextIndex: number) => {
            const option = options[nextIndex]
            if (!option || option.disabled || disabled) return
            inputRefs.current[nextIndex]?.focus()
            setValue(option.value)
        }

        const handleKeyDown = (event: React.KeyboardEvent<HTMLFieldSetElement>) => {
            const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
            if (!keys.includes(event.key)) return

            const enabledIndexes = options
                .map((option, index) => (!option.disabled ? index : -1))
                .filter((index) => index >= 0)
            if (!enabledIndexes.length) return

            const activeIndex = inputRefs.current.findIndex((input) => input === event.target)
            const selectedIndex = options.findIndex((option) => option.value === selectedValue)
            const currentIndex = activeIndex >= 0 ? activeIndex : selectedIndex
            const currentEnabledIndex = Math.max(0, enabledIndexes.indexOf(currentIndex))

            event.preventDefault()
            if (event.key === "Home") return focusOption(enabledIndexes[0])
            if (event.key === "End") return focusOption(enabledIndexes[enabledIndexes.length - 1])

            const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1
            const nextEnabledIndex = (currentEnabledIndex + delta + enabledIndexes.length) % enabledIndexes.length
            focusOption(enabledIndexes[nextEnabledIndex])
        }

        return (
            <fieldset
                {...rest}
                ref={ref}
                disabled={disabled}
                className={cx("bc-radio-group", `bc-radio-group--${orientation}`, className)}
                onKeyDown={handleKeyDown}
            >
                {legend && (
                    <legend
                        className={cx("bc-radio-group__legend", {
                            "bc-radio-group__legend--visually-hidden": visuallyHiddenLegend,
                        })}
                    >
                        {legend}
                    </legend>
                )}
                <div className="bc-radio-group__options">
                    {options.map((option, index) => {
                        const optionId = option.id || `${groupName}-${option.value}`
                        const descriptionId = option.description ? `${optionId}-description` : undefined
                        return (
                            <div
                                className={cx("bc-radio-group__option", {
                                    "bc-radio-group__option--disabled": disabled || option.disabled,
                                })}
                                key={option.value}
                            >
                                <input
                                    ref={(node) => {
                                        inputRefs.current[index] = node
                                    }}
                                    type="radio"
                                    id={optionId}
                                    name={groupName}
                                    value={option.value}
                                    checked={selectedValue === option.value}
                                    disabled={disabled || option.disabled}
                                    className="bc-radio-group__input"
                                    aria-describedby={descriptionId}
                                    onChange={() => setValue(option.value)}
                                />
                                <label className="bc-radio-group__label" htmlFor={optionId}>
                                    <span className="bc-radio-group__control" />
                                    <span className="bc-radio-group__body">
                                        <span className="bc-radio-group__text">{option.label}</span>
                                        {option.description && (
                                            <span id={descriptionId} className="bc-radio-group__description">
                                                {option.description}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            </div>
                        )
                    })}
                </div>
            </fieldset>
        )
    }
)

export default RadioGroup
