import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"

import type { TooltipModel } from "../core/index.ts"
import type { Tab, TimeSelection } from "../core/types.ts"
import {
    DataTable,
    EntitySelector,
    SettingsMenu,
    Tabs,
    Timeline,
    Tooltip,
    type DataTableScope,
    type DataTableSort,
    type SettingsItem,
} from "../react/index.ts"
import { storyDataset } from "./helpers.tsx"

import "../react/styles/charts.scss"

const meta: Meta = {
    title: "Charts2/Chrome",
    parameters: {
        docs: {
            description: {
                component:
                    "Interactive chrome (M9): self-contained components — data in via props, " +
                    "state changes out via callbacks. Each story wires a minimal useState " +
                    "harness around one component.",
            },
        },
    },
}

export default meta
type Story = StoryObj

// ---------------------------------------------------------------------------
// Timeline (spec 08)
// ---------------------------------------------------------------------------

function TimelineHarness() {
    const times = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
    const [selection, setSelection] = useState<TimeSelection>({ start: 2016, end: 2022 })
    return (
        <div style={{ width: 600 }}>
            <Timeline
                times={times}
                grain="year"
                locale="en"
                selection={selection}
                mode="range"
                onChange={setSelection}
            />
        </div>
    )
}

export const TimelineRange: Story = {
    render: () => <TimelineHarness />,
}

function TimelineSingleHarness() {
    const times = [2019, 2020, 2021, 2022, 2023]
    const [selection, setSelection] = useState<TimeSelection>({ start: 2023, end: 2023 })
    return (
        <div style={{ width: 600 }}>
            <Timeline
                times={times}
                grain="fiscal-year"
                locale="en"
                selection={selection}
                mode="single"
                onChange={setSelection}
            />
        </div>
    )
}

export const TimelineSingle: Story = {
    render: () => <TimelineSingleHarness />,
}

// ---------------------------------------------------------------------------
// EntitySelector (spec 07 §2)
// ---------------------------------------------------------------------------

function EntitySelectorHarness() {
    const dataset = storyDataset("federal-departments")
    const [selected, setSelected] = useState<string[]>(["National Defence", "Health Canada"])
    return (
        <div style={{ width: 420 }}>
            <EntitySelector
                dataset={dataset}
                selected={selected}
                mode="multi"
                onChange={setSelected}
                sortColumns={["spending"]}
                locale="en"
            />
        </div>
    )
}

export const EntitySelectorMulti: Story = {
    render: () => <EntitySelectorHarness />,
}

// ---------------------------------------------------------------------------
// DataTable (spec 22)
// ---------------------------------------------------------------------------

function DataTableHarness() {
    const dataset = storyDataset("provincial-budgets")
    const manifest = dataset.manifest
    const [scope, setScope] = useState<DataTableScope>("selected")
    const [sort, setSort] = useState<DataTableSort>({ column: "entity", order: "asc" })
    const [searchQuery, setSearchQuery] = useState("")
    return (
        <div style={{ width: 900 }}>
            <DataTable
                dataset={dataset}
                columns={manifest.columns}
                entities={["Ontario", "Quebec", "British Columbia", "Alberta", "Nova Scotia"]}
                timeSelection={{ start: "earliest", end: "latest" }}
                grain={manifest.timeGrain}
                locale="en"
                scope={scope}
                onScopeChange={setScope}
                sort={sort}
                onSortChange={setSort}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
        </div>
    )
}

export const DataTableRange: Story = {
    render: () => <DataTableHarness />,
}

// ---------------------------------------------------------------------------
// Tooltip (spec 06) — a hand-built model, positioned statically
// ---------------------------------------------------------------------------

const tooltipModel: TooltipModel = {
    title: "2024–25",
    titleAnnotation: "fiscal year",
    subtitle: "Total spending (billion CAD)",
    rows: [
        { seriesKey: "entity:Ontario", label: "Ontario", swatch: "#516c50", valueText: "$214.5", emphasized: true },
        { seriesKey: "entity:Quebec", label: "Quebec", swatch: "#89926c", valueText: "$161.0", emphasized: false },
        {
            seriesKey: "entity:Nova Scotia",
            label: "Nova Scotia",
            swatch: "#b8b3a0",
            valueText: "$16.5",
            emphasized: false,
            notice: "toleranced",
        },
    ],
    totalRow: {
        seriesKey: "total",
        label: "Total",
        swatch: "transparent",
        valueText: "$392.0",
        emphasized: false,
    },
    footers: [
        { icon: "notice", text: "Nova Scotia: value from 2023–24 (nearest within tolerance)" },
        { icon: "projection", text: "2024–25 values are projections" },
    ],
}

export const TooltipCard: Story = {
    render: () => (
        <div style={{ position: "relative", width: 500, height: 280 }}>
            <Tooltip model={tooltipModel} x={40} y={20} bounds={{ width: 500, height: 280 }} />
        </div>
    ),
}

// ---------------------------------------------------------------------------
// SettingsMenu (spec 10 §4)
// ---------------------------------------------------------------------------

function SettingsMenuHarness() {
    const [relative, setRelative] = useState(false)
    const [scale, setScale] = useState("linear")
    const items: SettingsItem[] = [
        { kind: "toggle", id: "relative", label: "Relative", value: relative, onChange: setRelative },
        {
            kind: "radio",
            id: "scale",
            label: "Y scale",
            options: [
                { value: "linear", label: "Linear" },
                { value: "log", label: "Log" },
            ],
            value: scale,
            onChange: setScale,
        },
    ]
    return (
        <div style={{ display: "flex", justifyContent: "flex-end", width: 400 }}>
            <SettingsMenu items={items} />
        </div>
    )
}

export const Settings: Story = {
    render: () => <SettingsMenuHarness />,
}

// ---------------------------------------------------------------------------
// Tabs (spec 10 §3)
// ---------------------------------------------------------------------------

function TabsHarness() {
    const [active, setActive] = useState<Tab>("line")
    return <Tabs tabs={["line", "discrete-bar", "table"]} active={active} onChange={setActive} />
}

export const TabRow: Story = {
    render: () => <TabsHarness />,
}
