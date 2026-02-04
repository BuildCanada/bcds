import { DualAxis } from "../axis/Axis.js"
import { ChartManager } from "../chart/ChartManager.js"
import { CoreValueType, EntityName, Time } from "../../types/index.js"
import { ChartSeries } from "../chart/ChartInterface.js"
import { Color } from "../../utils/index.js"
import { InteractionState } from "../interaction/InteractionState.js"
import { LegendStyleConfig } from "../legend/LegendInteractionState.js"
import { GRAPHER_OPACITY_MUTE } from "../core/GrapherConstants.js"

export const LINE_CHART_CLASS_NAME = "LineChart"

// Line color
export const DEFAULT_LINE_COLOR = "#000"

// Stroke width
export const DEFAULT_STROKE_WIDTH = 1.5
export const VARIABLE_COLOR_STROKE_WIDTH = 2.5

// Marker radius
export const DEFAULT_MARKER_RADIUS = 1.8
export const VARIABLE_COLOR_MARKER_RADIUS = 2.2
export const DISCONNECTED_DOTS_MARKER_RADIUS = 2.6
export const STATIC_SMALL_MARKER_RADIUS = 3

// Line outline
export const DEFAULT_LINE_OUTLINE_WIDTH = 0.5
export const VARIABLE_COLOR_LINE_OUTLINE_WIDTH = 1.0

// Legend
export const LEGEND_PADDING = 25
export const NUMERIC_LEGEND_STYLE: LegendStyleConfig = {
    marker: { default: { stroke: "#ffffff", strokeWidth: 1 } },
}
export const CATEGORICAL_LEGEND_STYLE: LegendStyleConfig = {
    marker: {
        default: { opacity: 1 },
        muted: { opacity: GRAPHER_OPACITY_MUTE },
    },
    text: { muted: { opacity: GRAPHER_OPACITY_MUTE } },
}

export interface LinePoint {
    x: number
    y: number
    colorValue?: CoreValueType
}

export interface PlacedPoint {
    x: number
    y: number
    color: Color
    time: number
}

export interface LineChartSeries extends ChartSeries {
    displayName: string
    isProjection?: boolean
    plotMarkersOnly?: boolean
    points: LinePoint[]
    entityName: EntityName
    columnName: string
    focus: InteractionState
}

export interface PlacedLineChartSeries extends LineChartSeries {
    placedPoints: PlacedPoint[]
}

export interface RenderLineChartSeries extends PlacedLineChartSeries {
    hover: InteractionState
}

export interface LinesProps {
    dualAxis: DualAxis
    series: RenderLineChartSeries[]
    hidePoints?: boolean
    lineStrokeWidth?: number
    lineOutlineWidth?: number
    markerRadius?: number
    isStatic?: boolean
    multiColor?: boolean
    backgroundColor?: string
}

export interface LineChartManager extends ChartManager {
    highlightedTimesInLineChart?: Time[]
    lineStrokeWidth?: number
    canSelectMultipleEntities?: boolean // used to pick an appropriate series name
}
