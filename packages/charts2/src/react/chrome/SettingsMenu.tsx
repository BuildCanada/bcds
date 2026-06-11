/**
 * Settings menu (spec 10 §4): a gear button opening a popover that lists
 * only the items the caller passes — relevance to the current view is the
 * caller's decision. Closes on Escape and on outside click.
 */

import { useEffect, useRef, useState } from "react"

export type SettingsItem =
    | {
          kind: "toggle"
          id: string
          label: string
          value: boolean
          onChange: (value: boolean) => void
      }
    | {
          kind: "radio"
          id: string
          label: string
          options: { value: string; label: string }[]
          value: string
          onChange: (value: string) => void
      }

export interface SettingsMenuProps {
    items: SettingsItem[]
    /** Accessible label for the gear button. Default "Settings". */
    label?: string
}

export function SettingsMenu({ items, label = "Settings" }: SettingsMenuProps) {
    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!open) return
        function handlePointerDown(event: PointerEvent): void {
            const root = rootRef.current
            if (root !== null && event.target instanceof Node && root.contains(event.target)) return
            setOpen(false)
        }
        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [open])

    return (
        <div ref={rootRef} className="bcds2-settings">
            <button
                type="button"
                className="bcds2-settings__button"
                aria-label={label}
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path
                        d="M8 1v2.2M8 12.8V15M1 8h2.2M12.8 8H15M3.05 3.05l1.56 1.56M11.39 11.39l1.56 1.56M12.95 3.05l-1.56 1.56M4.61 11.39l-1.56 1.56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                </svg>
            </button>
            {open && (
                <div className="bcds2-settings__popover" role="menu" aria-label={label}>
                    {items.map((item) =>
                        item.kind === "toggle" ? (
                            <label key={item.id} className="bcds2-settings__item bcds2-settings__item--toggle">
                                <input
                                    type="checkbox"
                                    checked={item.value}
                                    onChange={(event) => item.onChange(event.target.checked)}
                                />
                                <span>{item.label}</span>
                            </label>
                        ) : (
                            <fieldset key={item.id} className="bcds2-settings__item bcds2-settings__item--radio">
                                <legend className="bcds2-settings__legend">{item.label}</legend>
                                {item.options.map((option) => (
                                    <label key={option.value} className="bcds2-settings__option">
                                        <input
                                            type="radio"
                                            name={`bcds2-settings-${item.id}`}
                                            value={option.value}
                                            checked={item.value === option.value}
                                            onChange={() => item.onChange(option.value)}
                                        />
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </fieldset>
                        ),
                    )}
                </div>
            )}
        </div>
    )
}
