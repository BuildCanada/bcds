import cx from "classnames"
import { forwardRef, useEffect, useId, useRef } from "react"
import type React from "react"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    label: string
    visuallyHiddenLabel?: boolean
    checked?: boolean
    defaultChecked?: boolean
    indeterminate?: boolean
    name?: string
    id?: string
    className?: string
    disabled?: boolean
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    function Checkbox(
        {
            label,
            visuallyHiddenLabel = false,
            checked,
            defaultChecked,
            indeterminate = false,
            name,
            id: providedId,
            className,
            disabled = false,
            onChange,
            ...rest
        },
        ref
    ) {
        const generatedId = useId()
        const id = providedId || generatedId
        const inputRef = useRef<HTMLInputElement | null>(null)

        useEffect(() => {
            if (inputRef.current) inputRef.current.indeterminate = indeterminate
        }, [indeterminate])

        const setRefs = (node: HTMLInputElement | null) => {
            inputRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref) ref.current = node
        }

        const classes = cx(
            "bc-checkbox",
            { "bc-checkbox--disabled": disabled },
            { "bc-checkbox--indeterminate": indeterminate },
            className
        )

        return (
            <div className={classes}>
                <input
                    {...rest}
                    ref={setRefs}
                    type="checkbox"
                    id={id}
                    name={name}
                    checked={checked}
                    defaultChecked={defaultChecked}
                    disabled={disabled}
                    className="bc-checkbox__input"
                    aria-checked={indeterminate ? "mixed" : checked}
                    onChange={onChange}
                />
                <label htmlFor={id} className="bc-checkbox__label">
                    <span className="bc-checkbox__box">
                        <svg
                            className="bc-checkbox__check"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M11.5 4L5.5 10L2.5 7"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="square"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="bc-checkbox__mixed" />
                    </span>
                    <span
                        className={cx("bc-checkbox__text", {
                            "bc-checkbox__text--visually-hidden": visuallyHiddenLabel,
                        })}
                    >
                        {label}
                    </span>
                </label>
            </div>
        )
    }
)

export default Checkbox
