import cx from "classnames"
import { forwardRef, useId, useState } from "react"
import type React from "react"

export interface SliderTick {
    value: number
    label?: React.ReactNode
}

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "min" | "max" | "step" | "value" | "defaultValue" | "onChange"> {
    label?: React.ReactNode
    visuallyHiddenLabel?: boolean
    min?: number
    max?: number
    step?: number
    value?: number
    defaultValue?: number
    onValueChange?: (value: number) => void
    ticks?: SliderTick[]
    valueFormatter?: (value: number) => React.ReactNode
}

export interface RangeSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
    label?: React.ReactNode
    visuallyHiddenLabel?: boolean
    min?: number
    max?: number
    step?: number
    value?: [number, number]
    defaultValue?: [number, number]
    onValueChange?: (value: [number, number]) => void
    ticks?: SliderTick[]
    disabled?: boolean
    allowCross?: boolean
    startLabel?: string
    endLabel?: string
    valueFormatter?: (value: number) => React.ReactNode
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
    function Slider(
        {
            label,
            visuallyHiddenLabel = false,
            min = 0,
            max = 100,
            step = 1,
            value,
            defaultValue = min,
            onValueChange,
            ticks,
            valueFormatter,
            id: providedId,
            className,
            disabled = false,
            ...rest
        },
        ref
    ) {
        const generatedId = useId()
        const id = providedId || generatedId
        const [internalValue, setInternalValue] = useState(defaultValue)
        const currentValue = value ?? internalValue

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = Number(event.target.value)
            if (value === undefined) setInternalValue(nextValue)
            onValueChange?.(nextValue)
        }

        return (
            <div className={cx("bc-slider", { "bc-slider--disabled": disabled }, className)}>
                {label && (
                    <label
                        htmlFor={id}
                        className={cx("bc-slider__label", {
                            "bc-slider__label--visually-hidden": visuallyHiddenLabel,
                        })}
                    >
                        {label}
                    </label>
                )}
                <div className="bc-slider__row">
                    <input
                        {...rest}
                        ref={ref}
                        id={id}
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={currentValue}
                        disabled={disabled}
                        className="bc-slider__input"
                        onChange={handleChange}
                    />
                    {valueFormatter && <output className="bc-slider__value" htmlFor={id}>{valueFormatter(currentValue)}</output>}
                </div>
                {ticks && (
                    <div className="bc-slider__ticks" aria-hidden="true">
                        {ticks.map((tick) => (
                            <span
                                key={tick.value}
                                className="bc-slider__tick"
                                style={{ left: `${((tick.value - Number(min)) / (Number(max) - Number(min))) * 100}%` }}
                            >
                                {tick.label && <span className="bc-slider__tick-label">{tick.label}</span>}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )
    }
)

export const RangeSlider = forwardRef<HTMLDivElement, RangeSliderProps>(
    function RangeSlider(
        {
            label,
            visuallyHiddenLabel = false,
            min = 0,
            max = 100,
            step = 1,
            value,
            defaultValue = [min, max],
            onValueChange,
            ticks,
            disabled = false,
            allowCross = false,
            startLabel = "Minimum value",
            endLabel = "Maximum value",
            valueFormatter,
            id: providedId,
            className,
            ...rest
        },
        ref
    ) {
        const generatedId = useId()
        const id = providedId || generatedId
        const [internalValue, setInternalValue] = useState<[number, number]>(defaultValue)
        const currentValue = value ?? internalValue

        const setRangeValue = (nextValue: [number, number]) => {
            if (value === undefined) setInternalValue(nextValue)
            onValueChange?.(nextValue)
        }

        const handleChange = (index: 0 | 1, rawValue: number) => {
            const nextValue: [number, number] = [...currentValue]
            nextValue[index] = clamp(rawValue, min, max)
            if (!allowCross) {
                if (index === 0) nextValue[0] = Math.min(nextValue[0], nextValue[1])
                else nextValue[1] = Math.max(nextValue[1], nextValue[0])
            }
            setRangeValue(nextValue)
        }

        return (
            <div {...rest} ref={ref} id={id} className={cx("bc-range-slider", { "bc-range-slider--disabled": disabled }, className)}>
                {label && (
                    <div
                        className={cx("bc-range-slider__label", {
                            "bc-range-slider__label--visually-hidden": visuallyHiddenLabel,
                        })}
                        id={`${id}-label`}
                    >
                        {label}
                    </div>
                )}
                <div className="bc-range-slider__inputs" aria-labelledby={label ? `${id}-label` : undefined}>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={currentValue[0]}
                        disabled={disabled}
                        className="bc-range-slider__input"
                        aria-label={startLabel}
                        onChange={(event) => handleChange(0, Number(event.target.value))}
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={currentValue[1]}
                        disabled={disabled}
                        className="bc-range-slider__input"
                        aria-label={endLabel}
                        onChange={(event) => handleChange(1, Number(event.target.value))}
                    />
                </div>
                {valueFormatter && (
                    <div className="bc-range-slider__value" aria-live="polite">
                        {valueFormatter(currentValue[0])} – {valueFormatter(currentValue[1])}
                    </div>
                )}
                {ticks && (
                    <div className="bc-range-slider__ticks" aria-hidden="true">
                        {ticks.map((tick) => (
                            <span
                                key={tick.value}
                                className="bc-range-slider__tick"
                                style={{ left: `${((tick.value - min) / (max - min)) * 100}%` }}
                            >
                                {tick.label && <span className="bc-range-slider__tick-label">{tick.label}</span>}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )
    }
)

export default Slider
