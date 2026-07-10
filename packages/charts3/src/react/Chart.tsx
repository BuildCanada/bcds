import { renderChartSvg } from "../core/renderers"
import type { ChartDataset, ChartDefinition, ChartViewState, RenderSize } from "../core/types"

export interface ChartProps {
    definition: ChartDefinition
    dataset: ChartDataset
    state?: Partial<ChartViewState>
    size?: Partial<RenderSize>
    className?: string
    style?: Record<string, string | number>
}

export const Chart = ({
    definition,
    dataset,
    state,
    size,
    className,
    style,
}: ChartProps) => {
    const svg = renderChartSvg(definition, dataset, { state, size })
    return (
        <div
            className={["bc-charts3", className].filter(Boolean).join(" ")}
            style={style}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}
