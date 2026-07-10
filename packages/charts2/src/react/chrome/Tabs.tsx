/**
 * Tab row (spec 10 §3): one tab per chart type plus Table. Accessible
 * tablist with arrow-key navigation (wrapping), Home/End, and a roving
 * tab index. The caller owns the active tab and tab list.
 */

import { SegmentedControl } from "@buildcanada/components"
import type { Tab } from "../../core/types.ts"

const DEFAULT_LABELS: Record<Tab, string> = {
    "line": "Line",
    "discrete-bar": "Bar",
    "stacked-area": "Stacked area",
    "stacked-bar": "Stacked bar",
    "stacked-discrete-bar": "Stacked bar",
    "slope": "Slope",
    "dumbbell": "Dumbbell",
    "scatter": "Scatter",
    "marimekko": "Marimekko",
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
    return (
        <SegmentedControl
            className="bcds2-tabs"
            label="Chart view"
            mode="tabs"
            value={active}
            onValueChange={(value) => onChange(value as Tab)}
            items={tabs.map((tab) => ({
                value: tab,
                label: labels?.[tab] ?? DEFAULT_LABELS[tab],
            }))}
        />
    )
}
