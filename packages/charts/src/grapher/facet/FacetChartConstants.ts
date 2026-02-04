import { ChartSeries } from "../chart/ChartInterface.js"
import { ChartManager } from "../chart/ChartManager.js"
import { GrapherChartType } from "../../types/index.js"
import { Bounds } from "../../utils/index.js"

export interface FacetChartManager extends ChartManager {
    canSelectMultipleEntities?: boolean
}

export interface FacetChartProps {
    bounds?: Bounds
    chartTypeName?: GrapherChartType
    manager: FacetChartManager
}

export interface FacetSeries extends ChartSeries {
    manager: Partial<ChartManager>
}

export interface PlacedFacetSeries extends FacetSeries {
    manager: ChartManager
    bounds: Bounds
    contentBounds: Bounds
}
