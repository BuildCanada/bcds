/**
 * Tab row (spec 10 §3): one tab per chart type plus Table. Accessible
 * tablist with arrow-key navigation (wrapping), Home/End, and a roving
 * tab index. The caller owns the active tab and tab list.
 */

import { useRef } from "react"
import type { KeyboardEvent as ReactKeyboardEvent } from "react"
import type { Tab } from "../../core/types.ts"

const DEFAULT_LABELS: Record<Tab, string> = {
    "line": "Line",
    "discrete-bar": "Bar",
    "stacked-area": "Stacked area",
    "stacked-bar": "Stacked bar",
    "stacked-discrete-bar": "Stacked bar",
    "table": "Table",
}

export interface TabsProps {
    tabs: Tab[]
    active: Tab
    onChange: (tab: Tab) => void
    /** Label overrides per tab (e.g. localized copy). */
    labels?: Partial<Record<Tab, string>>
}

export function Tabs({ tabs, active, onChange, labels }: TabsProps) {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

    function activate(index: number): void {
        if (tabs.length === 0) return
        const wrapped = (index + tabs.length) % tabs.length
        onChange(tabs[wrapped])
        buttonRefs.current[wrapped]?.focus()
    }

    function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number): void {
        switch (event.key) {
            case "ArrowRight":
                event.preventDefault()
                activate(index + 1)
                break
            case "ArrowLeft":
                event.preventDefault()
                activate(index - 1)
                break
            case "Home":
                event.preventDefault()
                activate(0)
                break
            case "End":
                event.preventDefault()
                activate(tabs.length - 1)
                break
        }
    }

    return (
        <div className="bcds2-tabs" role="tablist">
            {tabs.map((tab, index) => (
                <button
                    key={tab}
                    ref={(element) => {
                        buttonRefs.current[index] = element
                    }}
                    type="button"
                    role="tab"
                    aria-selected={tab === active}
                    tabIndex={tab === active ? 0 : -1}
                    className={tab === active ? "bcds2-tabs__tab bcds2-tabs__tab--active" : "bcds2-tabs__tab"}
                    onClick={() => onChange(tab)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                >
                    {labels?.[tab] ?? DEFAULT_LABELS[tab]}
                </button>
            ))}
        </div>
    )
}
