import cx from "classnames"
import { forwardRef, useId, useRef, useState } from "react"
import type React from "react"

export type SegmentedControlMode = "toggle" | "tabs"
export type SegmentedControlOrientation = "horizontal" | "vertical"

export interface SegmentedControlItem {
    label: React.ReactNode
    value: string
    disabled?: boolean
    icon?: React.ReactNode
    panel?: React.ReactNode
    id?: string
}

export interface SegmentedControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    items: SegmentedControlItem[]
    label?: React.ReactNode
    visuallyHiddenLabel?: boolean
    orientation?: SegmentedControlOrientation
    mode?: SegmentedControlMode
    disabled?: boolean
}

export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
    function SegmentedControl(
        {
            value,
            defaultValue,
            onValueChange,
            items,
            label,
            visuallyHiddenLabel = true,
            orientation = "horizontal",
            mode = "toggle",
            disabled = false,
            className,
            id: providedId,
            ...rest
        },
        ref
    ) {
        const generatedId = useId()
        const id = providedId || generatedId
        const [internalValue, setInternalValue] = useState(defaultValue ?? items.find((item) => !item.disabled)?.value)
        const selectedValue = value ?? internalValue
        const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

        const setValue = (nextValue: string) => {
            if (disabled) return
            if (value === undefined) setInternalValue(nextValue)
            onValueChange?.(nextValue)
        }

        const focusItem = (index: number) => {
            const item = items[index]
            if (!item || item.disabled || disabled) return
            buttonRefs.current[index]?.focus()
            setValue(item.value)
        }

        const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
            const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
            if (!keys.includes(event.key)) return

            const enabledIndexes = items
                .map((item, index) => (!item.disabled ? index : -1))
                .filter((index) => index >= 0)
            if (!enabledIndexes.length) return

            const activeIndex = buttonRefs.current.findIndex((button) => button === event.target)
            const selectedIndex = items.findIndex((item) => item.value === selectedValue)
            const currentIndex = activeIndex >= 0 ? activeIndex : selectedIndex
            const currentEnabledIndex = Math.max(0, enabledIndexes.indexOf(currentIndex))

            event.preventDefault()
            if (event.key === "Home") return focusItem(enabledIndexes[0])
            if (event.key === "End") return focusItem(enabledIndexes[enabledIndexes.length - 1])

            const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1
            const nextEnabledIndex = (currentEnabledIndex + delta + enabledIndexes.length) % enabledIndexes.length
            focusItem(enabledIndexes[nextEnabledIndex])
        }

        const selectedItem = items.find((item) => item.value === selectedValue)

        return (
            <div
                {...rest}
                ref={ref}
                id={id}
                className={cx("bc-segmented-control", `bc-segmented-control--${orientation}`, `bc-segmented-control--${mode}`, className)}
            >
                {label && (
                    <div
                        className={cx("bc-segmented-control__label", {
                            "bc-segmented-control__label--visually-hidden": visuallyHiddenLabel,
                        })}
                        id={`${id}-label`}
                    >
                        {label}
                    </div>
                )}
                <div
                    className="bc-segmented-control__list"
                    role={mode === "tabs" ? "tablist" : "group"}
                    aria-labelledby={label ? `${id}-label` : undefined}
                    aria-orientation={orientation}
                    onKeyDown={handleKeyDown}
                >
                    {items.map((item, index) => {
                        const selected = item.value === selectedValue
                        const itemId = item.id || `${id}-${item.value}`
                        const panelId = `${itemId}-panel`
                        return (
                            <button
                                key={item.value}
                                ref={(node) => {
                                    buttonRefs.current[index] = node
                                }}
                                type="button"
                                id={itemId}
                                className="bc-segmented-control__item"
                                disabled={disabled || item.disabled}
                                role={mode === "tabs" ? "tab" : undefined}
                                aria-selected={mode === "tabs" ? selected : undefined}
                                aria-controls={mode === "tabs" && item.panel !== undefined ? panelId : undefined}
                                aria-pressed={mode === "toggle" ? selected : undefined}
                                tabIndex={selected || (!selectedItem && index === 0) ? 0 : -1}
                                onClick={() => setValue(item.value)}
                            >
                                {item.icon && <span className="bc-segmented-control__icon">{item.icon}</span>}
                                <span className="bc-segmented-control__text">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
                {mode === "tabs" && items.map((item) => {
                    if (item.panel === undefined) return null
                    const itemId = item.id || `${id}-${item.value}`
                    const panelId = `${itemId}-panel`
                    const selected = item.value === selectedValue
                    return (
                        <div
                            key={panelId}
                            id={panelId}
                            role="tabpanel"
                            className="bc-segmented-control__panel"
                            aria-labelledby={itemId}
                            hidden={!selected}
                        >
                            {item.panel}
                        </div>
                    )
                })}
            </div>
        )
    }
)

export const Tabs = SegmentedControl

export default SegmentedControl
