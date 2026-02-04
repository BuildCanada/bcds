import { PartialBy, PointVector } from "../../utils/index.js"
import { EntityName, VariableRow } from "../../types/index.js"
import { ChartSeries } from "../chart/ChartInterface.js"
import { CoreColumn } from "../../core-table/index.js"
import { ChartManager } from "../chart/ChartManager.js"
import { InteractionState } from "../interaction/InteractionState.js"

export interface SlopeChartManager extends ChartManager {
    canSelectMultipleEntities?: boolean // used to pick an appropriate series name
    hasTimeline?: boolean // used to filter the table for the entity selector
    hideNoDataSection?: boolean
}

export interface SlopeChartSeries extends ChartSeries {
    column: CoreColumn
    entityName: EntityName
    displayName: string
    start: Pick<VariableRow<number>, "value" | "originalTime">
    end: Pick<VariableRow<number>, "value" | "originalTime">
    annotation?: string
    focus: InteractionState
}

export type RawSlopeChartSeries = PartialBy<SlopeChartSeries, "start" | "end">

export interface PlacedSlopeChartSeries extends SlopeChartSeries {
    startPoint: PointVector
    endPoint: PointVector
}

export interface RenderSlopeChartSeries extends PlacedSlopeChartSeries {
    hover: InteractionState
}
