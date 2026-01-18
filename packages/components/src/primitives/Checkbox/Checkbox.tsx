import cx from "classnames"
import { forwardRef, useId } from "react"

export interface CheckboxProps {
    label: string
    checked?: boolean
    defaultChecked?: boolean
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
            checked,
            defaultChecked,
            name,
            id: providedId,
            className,
            disabled = false,
            onChange,
        },
        ref
    ) {
        const generatedId = useId()
        const id = providedId || generatedId

        const classes = cx(
            "bc-checkbox",
            { "bc-checkbox--disabled": disabled },
            className
        )

        return (
            <div className={classes}>
                <input
                    ref={ref}
                    type="checkbox"
                    id={id}
                    name={name}
                    checked={checked}
                    defaultChecked={defaultChecked}
                    disabled={disabled}
                    className="bc-checkbox__input"
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
                    </span>
                    <span className="bc-checkbox__text">{label}</span>
                </label>
            </div>
        )
    }
)

export default Checkbox
