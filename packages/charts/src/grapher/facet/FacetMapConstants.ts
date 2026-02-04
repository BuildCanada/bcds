import { ChartSeries } from "../chart/ChartInterface.js"
import { Bounds, GrapherAnalyticsContext } from "../../utils/index.js"
import { MapChartManager } from "../mapCharts/MapChartConstants.js"
import { GrapherAnalytics } from "../core/GrapherAnalytics.js"

export interface FacetMapManager extends MapChartManager {
    analytics?: GrapherAnalytics
    analyticsContext?: GrapherAnalyticsContext
}

export interface FacetMapProps {
    bounds?: Bounds
    manager: FacetMapManager
}

export interface MapFacetSeries extends ChartSeries {
    manager: Partial<MapChartManager>
}

export interface PlacedMapFacetSeries extends MapFacetSeries {
    manager: MapChartManager
    bounds: Bounds
}
