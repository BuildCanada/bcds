import * as React from "react"
import { resolveExplorerView, type ExplorerDefinition } from "../core/explorer"
import type { ChartDataset, ChartViewState, RenderSize } from "../core/types"
import { Chart } from "./Chart"

export interface ExplorerProps {
    explorer: ExplorerDefinition
    dataset: ChartDataset
    initialChoices?: Record<string, string>
    chartState?: Partial<ChartViewState>
    size?: Partial<RenderSize>
    className?: string
}

export const Explorer = ({
    explorer,
    dataset,
    initialChoices,
    chartState,
    size,
    className,
}: ExplorerProps) => {
    const [choices, setChoices] = React.useState(initialChoices ?? {})
    const resolved = React.useMemo(
        () => resolveExplorerView(explorer, choices),
        [explorer, choices]
    )

    return (
        <div className={["bc-charts3-explorer", className].filter(Boolean).join(" ")}>
            <div className="bc-charts3-explorer__controls">
                {explorer.controls.map((control) => {
                    const value = resolved.choices[control.slug]
                    return (
                        <label key={control.slug} className="bc-charts3-explorer__control">
                            <span>{control.label}</span>
                            <select
                                value={value}
                                onChange={(event) =>
                                    setChoices({
                                        ...resolved.choices,
                                        [control.slug]: event.currentTarget.value,
                                    })
                                }
                            >
                                {control.options.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                        disabled={resolved.disabledOptions[control.slug]?.includes(option.value)}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )
                })}
            </div>
            <Chart
                definition={resolved.definition}
                dataset={dataset}
                state={chartState}
                size={size}
            />
        </div>
    )
}
